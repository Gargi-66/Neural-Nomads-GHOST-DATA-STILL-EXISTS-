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
    except ValueError:
        return None


def read_only_connection(path: Path | str) -> sqlite3.Connection:
    absolute = str(Path(path).resolve())
    connection = sqlite3.connect(f"file:{absolute}?mode=ro", uri=True)
    connection.row_factory = sqlite3.Row
    return connection


def table_columns(connection: sqlite3.Connection, table: str) -> list[str]:
    return [row[1] for row in connection.execute(f'PRAGMA table_info("{table}")')]


def json_list(value: str | None) -> list[Any]:
    try:
        parsed = json.loads(value or "[]")
        return parsed if isinstance(parsed, list) else []
    except json.JSONDecodeError:
        return []


def classify_resource(row: sqlite3.Row, policy_action: str | None, evidence_rows: list[sqlite3.Row], activity_rows: list[sqlite3.Row], cutoff: str) -> tuple[str, str, str]:
    """Deterministic resource classification. Silver observations and verified evidence only."""
    state = (row["state"] or "UNKNOWN").upper()
    relationship = (row["relationship_status"] or "UNRESOLVED").upper()
    cutoff_time = parse_timestamp(cutoff)

    valid_evidence = []
    evidence_ids = []
    for evidence in evidence_rows:
        captured = parse_timestamp(evidence["captured_at"])
        status = (evidence["resource_link_status"] or "").upper()
        if status in {"VERIFIED", "RESOLVED"}:
            if captured is None:
                valid_evidence.append(evidence)
                evidence_ids.append(evidence["evidence_id"])
            elif cutoff_time and captured <= cutoff_time:
                valid_evidence.append(evidence)
                evidence_ids.append(evidence["evidence_id"])

    if relationship not in {"RESOLVED", "VERIFIED"}:
        return "UNVERIFIED", "Identity/resource relationship is unresolved", " | ".join(evidence_ids) 

    if valid_evidence:
        evidence_eligible = True
    else:
        evidence_eligible = False

    pending_activity = any((activity["timestamp"] or "") and parse_timestamp(activity["timestamp"])
                           and cutoff_time and parse_timestamp(activity["timestamp"])
                           <= cutoff_time and (activity["result"] or "").upper() in {"PENDING", "NOT_STARTED", "IN_PROGRESS"}
                           for activity in activity_rows)
    if pending_activity:
        return "PENDING", "A supported operation remains pending", " | ".join(evidence_ids)

    if state in {"ABSENT", "DELETED", "PURGED"}:
        if evidence_eligible:
            return "DELETED", "Verified evidence confirms deletion or purge", " | ".join(evidence_ids)
        return "UNVERIFIED", "Deletion-like state has no verified evidence at cutoff", " | ".join(evidence_ids)

    if state in {"ANONYMIZED", "REDACTED"}:
        if evidence_eligible:
            return "ANONYMIZED", "Verified evidence confirms identifiers were removed", " | ".join(evidence_ids)
        return "UNVERIFIED", "Anonymization/redaction lacks verified evidence at cutoff", " | ".join(evidence_ids)

    if state == "BLOCKED" and "BACKUP" in (row["resource_type"] or ""):
        if evidence_eligible:
            return "ARCHIVED", "Backup is blocked from restore but remains retained/archived", " | ".join(evidence_ids)
        return "UNVERIFIED", "Blocked backup lacks verified evidence", " | ".join(evidence_ids)

    if policy_action == "RETAIN" or state == "RETAINED":
        if evidence_eligible:
            return "RETAINED", "Supported policy exception permits retention", " | ".join(evidence_ids)
        return "UNVERIFIED", "Retention lacks supporting verified evidence", " | ".join(evidence_ids)

    if state == "IDENTIFIABLE" or state == "PRESENT" or state == "ACTIVE":
        return "INCOMPLETE", "The resource remains identifiable or active", " | ".join(evidence_ids)

    if state == "UNKNOWN":
        return "UNKNOWN", "Silver has no definitive resource state", " | ".join(evidence_ids)

    return "UNVERIFIED", "The resource state cannot be verified from supported evidence", " | ".join(evidence_ids)


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

        resources_by_customer: dict[str, list[sqlite3.Row]] = defaultdict(list)
        for row in silver.execute("SELECT * FROM fact_resource ORDER BY resource_id"):
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

            if customer_id:
                case_resources = resources_by_customer.get(customer_id, [])
            else:
                case_resources = []

            classified_resources = []
            evidence_ids: list[str] = []
            for resource in case_resources:
                policy = policy_map.get(resource["resource_type"])
                policy_action = policy["action_required"] if policy else None
                evidence = evidence_by_resource.get(resource["resource_id"], [])
                activities = activity_by_resource.get(resource["resource_id"], [])
                classification, reason, evidence_ref = classify_resource(resource, policy_action, evidence, activities, audit_cutoff)
                if evidence_ref:
                    evidence_ids.extend(part.strip() for part in evidence_ref.split("|") if part.strip())

                resource_row = {
                    "case_id": case_id,
                    "customer_id": customer_id,
                    "resource_id": resource["resource_id"],
                    "system_id": resource["system_id"] or "",
                    "resource_type": resource["resource_type"] or "UNKNOWN",
                    "silver_state": resource["state"] or "UNKNOWN",
                    "verified_state": classification,
                    "policy_action": policy_action or "UNKNOWN",
                    "policy_reason": policy["retention_period"] if policy else "No applicable policy row",
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

            request_status = (request["reported_status"] or "").upper()
            if identity_status not in {"VERIFIED", "RESOLVED"} or unresolved_identity_count:
                overall = "UNVERIFIED"
            elif "invalid" in request_status.lower() or "invalid" in request_text.lower():
                overall = "NOT_APPLICABLE"
            elif pending:
                overall = "PENDING"
            elif incomplete:
                overall = "INCOMPLETE"
            elif unverified:
                overall = "UNVERIFIED"
            elif counts["RETAINED"]:
                retained_only_exception = all(row["verified_state"] in {"DELETED", "ANONYMIZED", "RETAINED", "ARCHIVED"} for row in classified_resources)
                overall = "COMPLETE_WITH_EXCEPTION" if retained_only_exception else "INCOMPLETE"
            elif classified_resources:
                overall = "COMPLETE"
            else:
                overall = "INCOMPLETE"

            case_count[overall] += 1
            total_resource_count = len(classified_resources)
            evidence_completeness = "COMPLETE" if total_resource_count and unverified == 0 and counts["UNKNOWN"] == 0 else "UNVERIFIED" if unverified else "INCOMPLETE" if total_resource_count == 0 else "PARTIAL"

            customer_audit_rows.append({
                "case_id": case_id,
                "customer_id": customer_id,
                "request_date": request["requested_at"] or "",
                "request_status": request_status,
                "audit_cutoff": audit_cutoff,
                "overall_deletion_status": overall,
                "deletion_completion_status": "VERIFIED" if overall in {"COMPLETE", "COMPLETE_WITH_EXCEPTION"} else "UNVERIFIED" if overall in {"UNVERIFIED", "NOT_APPLICABLE"} else "PENDING" if overall == "PENDING" else "INCOMPLETE",
                "deleted_resource_count": counts["DELETED"],
                "anonymized_resource_count": counts["ANONYMIZED"],
                "archived_resource_count": counts["ARCHIVED"],
                "retained_resource_count": counts["RETAINED"],
                "pending_resource_count": pending,
                "unverified_resource_count": unverified,
                "total_resource_count": total_resource_count,
                "policy_exception_count": counts["RETAINED"],
                "unresolved_identity_count": unresolved_identity_count,
                "evidence_completeness": evidence_completeness,
                "last_verified_at": max((row["last_verified_at"] for row in classified_resources if row["last_verified_at"]), default=""),
                "analysis_timestamp": analysis_timestamp,
                "request_text": request_text,
                "evidence_references": " | ".join(sorted(set(evidence_ids))),
            })

        gold_db_path = gold_path / "gold_database.db"
        database_temp = gold_path / (".gold_database_" + next(tempfile._get_candidate_names()) + ".tmp")
        connection = sqlite3.connect(database_temp)
        try:
            connection.executescript("""
            CREATE TABLE customer_deletion_audit (
              case_id TEXT PRIMARY KEY, customer_id TEXT, request_date TEXT, request_status TEXT,
              audit_cutoff TEXT, overall_deletion_status TEXT, deletion_completion_status TEXT,
              deleted_resource_count INTEGER, anonymized_resource_count INTEGER, archived_resource_count INTEGER,
              retained_resource_count INTEGER, pending_resource_count INTEGER, unverified_resource_count INTEGER,
              total_resource_count INTEGER, policy_exception_count INTEGER, unresolved_identity_count INTEGER,
              evidence_completeness TEXT, last_verified_at TEXT, analysis_timestamp TEXT,
              request_text TEXT, evidence_references TEXT
            );
            CREATE TABLE resource_audit (
              case_id TEXT, customer_id TEXT, resource_id TEXT, system_id TEXT, resource_type TEXT,
              silver_state TEXT, verified_state TEXT, policy_action TEXT, policy_reason TEXT,
              evidence_references TEXT, classification_reason TEXT, last_verified_at TEXT, audit_cutoff TEXT,
              PRIMARY KEY(case_id, resource_id)
            );
            CREATE INDEX idx_gold_case_status ON customer_deletion_audit(overall_deletion_status);
            CREATE INDEX idx_gold_resource_state ON resource_audit(verified_state);
            CREATE VIEW v_gold_customer_summary AS
              SELECT customer_id, COUNT(*) AS request_count,
                     SUM(CASE WHEN overall_deletion_status='COMPLETE' THEN 1 ELSE 0 END) AS complete_count,
                     SUM(CASE WHEN overall_deletion_status='INCOMPLETE' THEN 1 ELSE 0 END) AS incomplete_count,
                     SUM(CASE WHEN overall_deletion_status='PENDING' THEN 1 ELSE 0 END) AS pending_count,
                     SUM(CASE WHEN overall_deletion_status='UNVERIFIED' THEN 1 ELSE 0 END) AS unverified_count,
                     SUM(CASE WHEN overall_deletion_status='COMPLETE_WITH_EXCEPTION' THEN 1 ELSE 0 END) AS exception_count
              FROM customer_deletion_audit GROUP BY customer_id;
            CREATE VIEW v_gold_resource_summary AS
              SELECT resource_type, verified_state, COUNT(*) AS resource_count
              FROM resource_audit GROUP BY resource_type, verified_state;
            """)
            connection.executemany("INSERT INTO customer_deletion_audit VALUES (:case_id,:customer_id,:request_date,:request_status,:audit_cutoff,:overall_deletion_status,:deletion_completion_status,:deleted_resource_count,:anonymized_resource_count,:archived_resource_count,:retained_resource_count,:pending_resource_count,:unverified_resource_count,:total_resource_count,:policy_exception_count,:unresolved_identity_count,:evidence_completeness,:last_verified_at,:analysis_timestamp,:request_text,:evidence_references)", customer_audit_rows)
            connection.executemany("INSERT INTO resource_audit VALUES (:case_id,:customer_id,:resource_id,:system_id,:resource_type,:silver_state,:verified_state,:policy_action,:policy_reason,:evidence_references,:classification_reason,:last_verified_at,:audit_cutoff)", resource_rows)
            connection.commit()
        finally:
            connection.close()
        os.replace(database_temp, gold_db_path)

        case_fields = list(customer_audit_rows[0].keys()) if customer_audit_rows else ["case_id", "customer_id", "request_date", "request_status", "audit_cutoff", "overall_deletion_status", "deletion_completion_status", "deleted_resource_count", "anonymized_resource_count", "archived_resource_count", "retained_resource_count", "pending_resource_count", "unverified_resource_count", "total_resource_count", "policy_exception_count", "unresolved_identity_count", "evidence_completeness", "last_verified_at", "analysis_timestamp", "request_text", "evidence_references"]
        _write_csv_atomic(gold_path / "customer_deletion_audit.csv", case_fields, customer_audit_rows)
        resource_fields = list(resource_rows[0].keys()) if resource_rows else ["case_id", "customer_id", "resource_id", "system_id", "resource_type", "silver_state", "verified_state", "policy_action", "policy_reason", "evidence_references", "classification_reason", "last_verified_at", "audit_cutoff"]
        _write_csv_atomic(gold_path / "resource_audit.csv", resource_fields, resource_rows)

        summary_fields = ["overall_deletion_status", "case_count"]
        deletion_summary = [{"overall_deletion_status": status, "case_count": count} for status, count in sorted(case_count.items())]
        _write_csv_atomic(gold_path / "deletion_summary.csv", summary_fields, deletion_summary)

        resource_status = Counter((row["resource_type"], row["verified_state"]) for row in resource_rows)
        _write_csv_atomic(gold_path / "resource_status_summary.csv", ["resource_type", "verified_state", "resource_count"], [{"resource_type": key[0], "verified_state": key[1], "resource_count": value} for key, value in sorted(resource_status.items())])

        system_status = Counter((row["system_id"], row["verified_state"]) for row in resource_rows)
        _write_csv_atomic(gold_path / "system_deletion_summary.csv", ["system_id", "verified_state", "resource_count"], [{"system_id": key[0], "verified_state": key[1], "resource_count": value} for key, value in sorted(system_status.items())])

        retention_status = Counter((row["policy_action"], row["verified_state"], row["policy_reason"]) for row in resource_rows if row["policy_action"] == "RETAIN" or row["verified_state"] == "RETAINED")
        _write_csv_atomic(gold_path / "retention_summary.csv", ["policy_action", "verified_state", "policy_reason", "resource_count"], [{"policy_action": key[0], "verified_state": key[1], "policy_reason": key[2], "resource_count": value} for key, value in sorted(retention_status.items())])

        _write_csv_atomic(gold_path / "pending_cases.csv", case_fields, [row for row in customer_audit_rows if row["overall_deletion_status"] == "PENDING"])
        _write_csv_atomic(gold_path / "unverified_cases.csv", case_fields, [row for row in customer_audit_rows if row["overall_deletion_status"] == "UNVERIFIED"])

        quality_lines = [
            "# Gold Data Quality Report", "",
            f"- Silver source: {silver_path.resolve()}",
            "- Silver and Bronze connections were not used for writes.",
            f"- Gold cases: {len(customer_audit_rows)}",
            f"- Gold resource rows: {len(resource_rows)}",
            f"- Unresolved identities: {sum(row['unresolved_identity_count'] for row in customer_audit_rows)}",
            f"- Unverified resources: {sum(row['unverified_resource_count'] for row in customer_audit_rows)}",
            "- Evidence captured after audit cutoff is excluded by the Gold cutoff filter.",
            "- Gold classification is deterministic and never overrides Silver evidence or policy records.",
        ]
        (gold_path / "gold_data_quality_report.md").write_text("\n".join(quality_lines) + "\n", encoding="utf-8")

        return {
            "silver_db": str(silver_path.resolve()),
            "gold_dir": str(gold_path.resolve()),
            "gold_db": str(gold_db_path.resolve()),
            "case_count": len(customer_audit_rows),
            "resource_count": len(resource_rows),
            "status_counts": dict(sorted(case_count.items())),
        }
    finally:
        silver.close()


def read_gold(gold_dir: Path | str = DEFAULT_GOLD_DIR) -> sqlite3.Connection:
    gold_db = Path(gold_dir) / "gold_database.db"
    connection = read_only_connection(gold_db)
    return connection
