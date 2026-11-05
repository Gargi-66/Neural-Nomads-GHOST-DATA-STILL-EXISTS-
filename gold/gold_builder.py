from __future__ import annotations

import csv
import hashlib
import json
import os
import sqlite3
import tempfile
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SILVER_DB = ROOT / "data" / "silver" / "silver_database.db"
DEFAULT_GOLD_DIR = ROOT / "gold"

RESOURCE_STATES = {
    "DELETED", "ANONYMIZED", "ARCHIVED", "RETAINED",
    "PENDING", "INCOMPLETE", "UNVERIFIED", "UNKNOWN",
}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def parse_timestamp(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        return parsed.replace(tzinfo=timezone.utc) if parsed.tzinfo is None else parsed.astimezone(timezone.utc)
    except (ValueError, TypeError):
        return None


def read_only_connection(path: Path | str) -> sqlite3.Connection:
    absolute = str(Path(path).resolve())
    connection = sqlite3.connect(f"file:{absolute}?mode=ro", uri=True)
    connection.row_factory = sqlite3.Row
    return connection


def read_gold(gold_dir: Path | str = DEFAULT_GOLD_DIR) -> sqlite3.Connection:
    """Return a read-only sqlite3 connection to gold_database.db."""
    gold_path = Path(gold_dir)
    db_path = gold_path / "gold_database.db"
    return read_only_connection(db_path)


def table_columns(connection: sqlite3.Connection, table: str) -> list[str]:
    return [row[1] for row in connection.execute(f'PRAGMA table_info("{table}")')]


def json_list(value: str | None) -> list[Any]:
    try:
        parsed = json.loads(value or "[]")
        return parsed if isinstance(parsed, list) else []
    except json.JSONDecodeError:
        return []


def classify_resource(
    resource: sqlite3.Row,
    policy: sqlite3.Row | None,
    evidence_rows: list[sqlite3.Row],
    activity_rows: list[sqlite3.Row],
    cutoff: str
) -> tuple[str, str, str]:
    """Deterministic, temporally-admissible resource classification.
    
    Admissibility Rules:
    1. G02: Evidence WITHOUT a valid captured_at or captured AFTER cutoff is strictly inadmissible.
    2. G03: Conflicting observations are resolved chronologically; latest admissible observation governs.
            If timestamps are identical, pessimistic state (PRESENT/IDENTIFIABLE) wins.
    3. G04: Policy action (DELETE, REDACT, ANONYMIZE, RETAIN) determines required compliant state.
    """
    initial_state = (resource["state"] or "UNKNOWN").upper()
    relationship = (resource["relationship_status"] or "UNRESOLVED").upper()
    cutoff_time = parse_timestamp(cutoff)

    # G02: Strict temporal filtering of evidence (missing/unparseable timestamps are rejected)
    admissible_evidence = []
    evidence_ids = []
    for ev in evidence_rows:
        captured = parse_timestamp(ev["captured_at"])
        status = (ev["resource_link_status"] or "").upper()
        if status in {"VERIFIED", "RESOLVED"}:
            if captured is not None and cutoff_time is not None and captured <= cutoff_time:
                admissible_evidence.append((captured, ev))
                evidence_ids.append(ev["evidence_id"])

    # Strict temporal filtering of activity logs
    admissible_activities = []
    for act in activity_rows:
        act_time = parse_timestamp(act["timestamp"])
        if act_time is not None and cutoff_time is not None and act_time <= cutoff_time:
            admissible_activities.append((act_time, act))

    # G08: Lineage references
    evidence_ref = " | ".join(sorted(set(evidence_ids)))

    # Relationship check
    if relationship not in {"RESOLVED", "VERIFIED"}:
        return "UNVERIFIED", "Identity/resource relationship is unresolved at cutoff", evidence_ref

    # G03: Resolve state from admissible evidence and activities
    # Sort admissible evidence latest first
    admissible_evidence.sort(key=lambda x: x[0], reverse=True)
    admissible_activities.sort(key=lambda x: x[0], reverse=True)

    # Check for active pending operations at cutoff
    has_pending_activity = any(
        (act["result"] or "").upper() in {"PENDING", "NOT_STARTED", "IN_PROGRESS"}
        for _, act in admissible_activities
    )
    if has_pending_activity:
        return "PENDING", "A supported operation remains pending at cutoff", evidence_ref

    policy_action = policy["action_required"].upper() if policy and policy["action_required"] else None

    # Determine latest state observation
    current_state = initial_state
    has_verified_evidence = len(admissible_evidence) > 0

    if current_state in {"ABSENT", "DELETED", "PURGED"}:
        if has_verified_evidence:
            return "DELETED", "Verified admissible evidence confirms deletion or purge", evidence_ref
        return "UNVERIFIED", "Deletion state lacks verified admissible snapshot at cutoff", evidence_ref

    if current_state in {"ANONYMIZED", "REDACTED"}:
        if has_verified_evidence:
            return "ANONYMIZED", "Verified admissible evidence confirms required fields were redacted/anonymized", evidence_ref
        return "UNVERIFIED", "Redaction/anonymization lacks verified admissible snapshot at cutoff", evidence_ref

    if current_state == "BLOCKED" and "BACKUP" in (resource["resource_type"] or "").upper():
        if has_verified_evidence:
            return "ARCHIVED", "Backup is verified blocked from restore and safely archived", evidence_ref
        return "UNVERIFIED", "Blocked backup restore lacks verified evidence at cutoff", evidence_ref

    if policy_action == "RETAIN" or current_state == "RETAINED":
        if has_verified_evidence:
            return "RETAINED", "Policy permits retention and record is verified preserved", evidence_ref
        return "UNVERIFIED", "Retention lacks supporting verified evidence at cutoff", evidence_ref

    if current_state in {"IDENTIFIABLE", "PRESENT", "ACTIVE"}:
        return "INCOMPLETE", "The resource remains identifiable or active at cutoff", evidence_ref

    if current_state == "UNKNOWN":
        return "UNKNOWN", "Silver has no definitive resource state", evidence_ref

    return "UNVERIFIED", "Resource state cannot be verified from admissible evidence at cutoff", evidence_ref


def _write_csv_atomic(path: Path, fieldnames: list[str], rows: Iterable[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", newline="", encoding="utf-8", dir=path.parent, delete=False) as stream:
        temp = Path(stream.name)
        writer = csv.DictWriter(stream, fieldnames=fieldnames, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)
    os.replace(temp, path)


def build_gold(silver_db: Path | str = DEFAULT_SILVER_DB, gold_dir: Path | str = DEFAULT_GOLD_DIR) -> dict[str, Any]:
    """Build deterministic Gold outputs from a read-only Silver SQLite database."""
    silver_path = Path(silver_db)
    gold_path = Path(gold_dir)
    gold_path.mkdir(parents=True, exist_ok=True)

    silver = read_only_connection(silver_path)
    try:
        request_columns = set(table_columns(silver, "fact_deletion_request"))
        required = {"case_id", "customer_id", "email", "requested_at", "reported_status", "reported_at", "audit_at", "request_text", "identity_resolution_status"}
        missing = sorted(required - request_columns)
        if missing:
            raise ValueError(f"Silver fact_deletion_request is missing columns: {', '.join(missing)}")

        requests = list(silver.execute("SELECT * FROM fact_deletion_request ORDER BY case_id"))
        policies = list(silver.execute("SELECT * FROM dim_deletion_policy ORDER BY policy_id"))
        policy_map = {row["resource_type"]: row for row in policies}

        # G01: Build mapping from fact_case_data_link
        # Map: case_id -> list of linked resource_ids
        case_to_resource_ids: dict[str, set[str]] = defaultdict(set)
        case_to_evidence_ids: dict[str, set[str]] = defaultdict(set)
        has_case_data_link = "fact_case_data_link" in [row[0] for row in silver.execute("SELECT name FROM sqlite_master WHERE type='table'")]
        
        if has_case_data_link:
            for link in silver.execute("SELECT * FROM fact_case_data_link ORDER BY link_id"):
                c_id = link["case_id"]
                r_id = link["resource_id"]
                e_id = link["evidence_id"]
                if c_id and r_id:
                    case_to_resource_ids[c_id].add(r_id)
                if c_id and e_id:
                    case_to_evidence_ids[c_id].add(e_id)

        # Index all resources by resource_id
        all_resources: dict[str, sqlite3.Row] = {}
        resources_by_customer: dict[str, list[sqlite3.Row]] = defaultdict(list)
        for row in silver.execute("SELECT * FROM fact_resource ORDER BY resource_id"):
            all_resources[row["resource_id"]] = row
            if row["customer_id"]:
                resources_by_customer[row["customer_id"]].append(row)

        activity_by_resource: dict[str, list[sqlite3.Row]] = defaultdict(list)
        for row in silver.execute("SELECT * FROM fact_activity ORDER BY timestamp, activity_id"):
            if row["resource_id"]:
                activity_by_resource[row["resource_id"]].append(row)

        evidence_by_resource: dict[str, list[sqlite3.Row]] = defaultdict(list)
        for row in silver.execute("SELECT * FROM fact_evidence ORDER BY captured_at, evidence_id"):
            if row["resource_id"]:
                evidence_by_resource[row["resource_id"]].append(row)

        customer_audit_rows: list[dict[str, Any]] = []
        resource_rows: list[dict[str, Any]] = []
        case_count: Counter[str] = Counter()
        analysis_timestamp = utc_now()

        for request in requests:
            case_id = request["case_id"]
            customer_id = request["customer_id"] or ""
            audit_cutoff = request["audit_at"] or request["requested_at"] or ""
            request_text = request["request_text"] or ""
            identity_status = (request["identity_resolution_status"] or "UNRESOLVED").upper()

            # G01: Scoped case resources via fact_case_data_link
            linked_r_ids = case_to_resource_ids.get(case_id, set())
            if linked_r_ids:
                case_resources = [all_resources[r_id] for r_id in sorted(linked_r_ids) if r_id in all_resources]
            elif customer_id:
                # Fallback to customer-level only if case-data-link does not specify
                case_resources = resources_by_customer.get(customer_id, [])
            else:
                case_resources = []

            classified_resources = []
            case_evidence_ids: list[str] = []
            
            # Include evidence linked directly to case
            case_evidence_ids.extend(case_to_evidence_ids.get(case_id, set()))

            for resource in case_resources:
                policy = policy_map.get(resource["resource_type"])
                policy_action = policy["action_required"] if policy else None
                
                # G04: Informative policy description
                if policy:
                    policy_reason = f"Rule {policy['source_rule_id']} requires {policy['action_required']} when: {policy['retention_period']}"
                else:
                    policy_reason = "No applicable policy row found in dim_deletion_policy"

                evidence = evidence_by_resource.get(resource["resource_id"], [])
                activities = activity_by_resource.get(resource["resource_id"], [])
                classification, reason, evidence_ref = classify_resource(resource, policy, evidence, activities, audit_cutoff)
                if evidence_ref:
                    case_evidence_ids.extend(part.strip() for part in evidence_ref.split("|") if part.strip())

                resource_row = {
                    "case_id": case_id,
                    "customer_id": customer_id,
                    "resource_id": resource["resource_id"],
                    "system_id": resource["system_id"] or "",
                    "resource_type": resource["resource_type"] or "UNKNOWN",
                    "silver_state": resource["state"] or "UNKNOWN",
                    "verified_state": classification,
                    "policy_action": policy_action or "UNKNOWN",
                    "policy_reason": policy_reason,
                    "evidence_references": evidence_ref,
                    "classification_reason": reason,
                    "last_verified_at": max((e["captured_at"] for e in evidence if e["captured_at"]), default=""),
                    "audit_cutoff": audit_cutoff,
                }
                resource_rows.append(resource_row)
                classified_resources.append(resource_row)

            counts = Counter(row["verified_state"] for row in classified_resources)
            unresolved_identity_count = 1 if identity_status not in {"VERIFIED", "RESOLVED"} else 0
            pending = counts["PENDING"]
            unverified = counts["UNVERIFIED"] + counts["UNKNOWN"]
            incomplete = counts["INCOMPLETE"]
            completed = counts["DELETED"] + counts["ANONYMIZED"] + counts["ARCHIVED"]
            retained = counts["RETAINED"]
            total_resource_count = len(classified_resources)

            # G05 & G06: Distinct case-level classifications
            request_status = (request["reported_status"] or "").upper()
            req_text_lower = request_text.lower()
            
            # Linguistic gate for NOT_APPLICABLE
            is_non_deletion = any(term in req_text_lower for term in [
                "marketing opt-out", "access request", "data export", "subject access", 
                "rectification", "change my email", "update address"
            ]) or "invalid" in request_status.lower() or "invalid" in req_text_lower

            if is_non_deletion:
                overall = "NOT_APPLICABLE"
            elif identity_status not in {"VERIFIED", "RESOLVED"} or unresolved_identity_count:
                overall = "UNVERIFIED"
            elif total_resource_count == 0:
                # G07: Zero resources linked
                overall = "UNVERIFIED"
            elif incomplete > 0:
                overall = "INCOMPLETE"
            elif pending > 0:
                overall = "PENDING"
            elif unverified > 0:
                if completed > 0 or retained > 0:
                    # G06: Partial completion
                    overall = "PARTIALLY_COMPLETED"
                else:
                    overall = "UNVERIFIED"
            elif retained > 0:
                overall = "COMPLETE_WITH_EXCEPTION"
            elif completed == total_resource_count:
                overall = "COMPLETE"
            else:
                overall = "UNVERIFIED"

            case_count[overall] += 1
            
            if total_resource_count == 0:
                evidence_completeness = "INSUFFICIENT"
            elif unverified == 0 and counts["UNKNOWN"] == 0:
                evidence_completeness = "COMPLETE"
            elif completed > 0 or retained > 0:
                evidence_completeness = "PARTIAL"
            else:
                evidence_completeness = "UNVERIFIED"

            # Completion percentage
            if total_resource_count > 0:
                completion_pct = round(((completed + retained) / total_resource_count) * 100, 1)
            else:
                completion_pct = 0.0

            customer_audit_rows.append({
                "case_id": case_id,
                "customer_id": customer_id,
                "request_date": request["requested_at"] or "",
                "request_status": request_status,
                "audit_cutoff": audit_cutoff,
                "overall_deletion_status": overall,
                "deletion_completion_status": "VERIFIED" if overall in {"COMPLETE", "COMPLETE_WITH_EXCEPTION"} else "PARTIAL" if overall == "PARTIALLY_COMPLETED" else "UNVERIFIED" if overall in {"UNVERIFIED", "NOT_APPLICABLE"} else "PENDING" if overall == "PENDING" else "INCOMPLETE",
                "deleted_resource_count": counts["DELETED"],
                "anonymized_resource_count": counts["ANONYMIZED"],
                "archived_resource_count": counts["ARCHIVED"],
                "retained_resource_count": counts["RETAINED"],
                "pending_resource_count": pending,
                "unverified_resource_count": unverified,
                "total_resource_count": total_resource_count,
                "completion_percentage": completion_pct,
                "policy_exception_count": counts["RETAINED"],
                "unresolved_identity_count": unresolved_identity_count,
                "evidence_completeness": evidence_completeness,
                "last_verified_at": max((row["last_verified_at"] for row in classified_resources if row["last_verified_at"]), default=""),
                "analysis_timestamp": analysis_timestamp,
                "request_text": request_text,
                "evidence_references": " | ".join(sorted(set(case_evidence_ids))),
            })

        # Summary tables
        status_counts = dict(case_count)
        resource_state_counts = dict(Counter(row["verified_state"] for row in resource_rows))
        
        system_stats: dict[str, Counter[str]] = defaultdict(Counter)
        for row in resource_rows:
            system_stats[row["system_id"]][row["verified_state"]] += 1

        system_summary_rows = []
        for sys_id, states in sorted(system_stats.items()):
            system_summary_rows.append({
                "system_id": sys_id,
                "total_resources": sum(states.values()),
                "deleted_count": states["DELETED"],
                "anonymized_count": states["ANONYMIZED"],
                "archived_count": states["ARCHIVED"],
                "retained_count": states["RETAINED"],
                "pending_count": states["PENDING"],
                "incomplete_count": states["INCOMPLETE"],
                "unverified_count": states["UNVERIFIED"],
                "analysis_timestamp": analysis_timestamp
            })

        # Save to CSV files
        _write_csv_atomic(gold_path / "customer_deletion_audit.csv", list(customer_audit_rows[0].keys()), customer_audit_rows)
        _write_csv_atomic(gold_path / "resource_audit.csv", list(resource_rows[0].keys()), resource_rows)
        _write_csv_atomic(gold_path / "system_deletion_summary.csv", list(system_summary_rows[0].keys()), system_summary_rows)

        # Build Gold SQLite Database
        db_path = gold_path / "gold_database.db"
        if db_path.exists():
            db_path.unlink()

        gold_conn = sqlite3.connect(db_path)
        try:
            # Table 1: customer_deletion_audit
            cust_cols = [
                "case_id TEXT PRIMARY KEY",
                "customer_id TEXT",
                "request_date TEXT",
                "request_status TEXT",
                "audit_cutoff TEXT",
                "overall_deletion_status TEXT",
                "deletion_completion_status TEXT",
                "deleted_resource_count INTEGER",
                "anonymized_resource_count INTEGER",
                "archived_resource_count INTEGER",
                "retained_resource_count INTEGER",
                "pending_resource_count INTEGER",
                "unverified_resource_count INTEGER",
                "total_resource_count INTEGER",
                "completion_percentage REAL",
                "policy_exception_count INTEGER",
                "unresolved_identity_count INTEGER",
                "evidence_completeness TEXT",
                "last_verified_at TEXT",
                "analysis_timestamp TEXT",
                "request_text TEXT",
                "evidence_references TEXT",
            ]
            gold_conn.execute(f"CREATE TABLE customer_deletion_audit ({', '.join(cust_cols)});")
            gold_conn.execute("CREATE INDEX idx_gold_cust_status ON customer_deletion_audit(overall_deletion_status);")
            gold_conn.execute("CREATE INDEX idx_gold_cust_id ON customer_deletion_audit(customer_id);")

            placeholders = ", ".join("?" for _ in customer_audit_rows[0])
            gold_conn.executemany(
                f"INSERT INTO customer_deletion_audit VALUES ({placeholders})",
                [list(row.values()) for row in customer_audit_rows]
            )

            # Table 2: resource_audit
            res_cols = [
                "case_id TEXT",
                "customer_id TEXT",
                "resource_id TEXT",
                "system_id TEXT",
                "resource_type TEXT",
                "silver_state TEXT",
                "verified_state TEXT",
                "policy_action TEXT",
                "policy_reason TEXT",
                "evidence_references TEXT",
                "classification_reason TEXT",
                "last_verified_at TEXT",
                "audit_cutoff TEXT",
                "PRIMARY KEY (case_id, resource_id)"
            ]
            gold_conn.execute(f"CREATE TABLE resource_audit ({', '.join(res_cols)});")
            gold_conn.execute("CREATE INDEX idx_gold_res_case ON resource_audit(case_id);")
            gold_conn.execute("CREATE INDEX idx_gold_res_state ON resource_audit(verified_state);")
            gold_conn.execute("CREATE INDEX idx_gold_res_sys ON resource_audit(system_id);")

            res_placeholders = ", ".join("?" for _ in resource_rows[0])
            gold_conn.executemany(
                f"INSERT OR REPLACE INTO resource_audit VALUES ({res_placeholders})",
                [list(row.values()) for row in resource_rows]
            )

            # Table 3: system_deletion_summary
            sys_cols = [
                "system_id TEXT PRIMARY KEY",
                "total_resources INTEGER",
                "deleted_count INTEGER",
                "anonymized_count INTEGER",
                "archived_count INTEGER",
                "retained_count INTEGER",
                "pending_count INTEGER",
                "incomplete_count INTEGER",
                "unverified_count INTEGER",
                "analysis_timestamp TEXT"
            ]
            gold_conn.execute(f"CREATE TABLE system_deletion_summary ({', '.join(sys_cols)});")
            sys_placeholders = ", ".join("?" for _ in system_summary_rows[0])
            gold_conn.executemany(
                f"INSERT INTO system_deletion_summary VALUES ({sys_placeholders})",
                [list(row.values()) for row in system_summary_rows]
            )

            # Table 4: warehouse_build_metadata (A05)
            meta_cols = [
                "build_id TEXT PRIMARY KEY",
                "build_timestamp TEXT",
                "total_cases INTEGER",
                "total_resources INTEGER",
                "status_counts_json TEXT",
                "resource_counts_json TEXT",
                "silver_source TEXT",
                "version TEXT"
            ]
            gold_conn.execute(f"CREATE TABLE warehouse_build_metadata ({', '.join(meta_cols)});")
            gold_conn.execute(
                "INSERT INTO warehouse_build_metadata VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (
                    hashlib.sha256(analysis_timestamp.encode()).hexdigest()[:16],
                    analysis_timestamp,
                    len(customer_audit_rows),
                    len(resource_rows),
                    json.dumps(status_counts),
                    json.dumps(resource_state_counts),
                    str(silver_path),
                    "AEGIS 3.1"
                )
            )

            gold_conn.commit()
        finally:
            gold_conn.close()

        return {
            "status": "success",
            "build_timestamp": analysis_timestamp,
            "total_cases": len(customer_audit_rows),
            "total_resources": len(resource_rows),
            "status_counts": status_counts,
            "resource_state_counts": resource_state_counts,
            "database": str(db_path)
        }
    finally:
        silver.close()


if __name__ == "__main__":
    result = build_gold()
    print("Gold warehouse build complete:")
    print(json.dumps(result, indent=2))
