from __future__ import annotations

import csv
import hashlib
import json
import os
import re
import sqlite3
import tempfile
from collections import defaultdict
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Iterable


CORE_ENTITY_NAMES = (
    "fact_deletion_request", "dim_customer", "dim_identity_history",
    "fact_resource", "fact_activity", "fact_evidence",
    "dim_deletion_policy", "fact_case_data_link",
)

REQUIRED_SCHEMAS = {
    "deletion_requests.csv": {"case_id", "customer_id", "email", "request_date", "request_type", "request_status"},
    "customer_identity.csv": {"customer_id", "email", "user_id", "identity_status"},
    "customer_resources.csv": {"resource_id", "customer_id", "resource_type", "system_name", "record_status", "contains_pii"},
    "transactions.csv": {"transaction_id", "customer_id", "transaction_date", "amount", "personal_data_status"},
    "backups.csv": {"backup_id", "customer_id", "backup_date", "backup_location", "backup_status", "purge_status"},
    "system_activities.csv": {"activity_id", "case_id", "customer_id", "resource_id", "action", "activity_status", "activity_date"},
    "audit.csv": {"audit_id", "case_id", "customer_id", "resource_id", "performed_by", "action", "audit_date", "result"},
    "deletion_evidence.csv": {"evidence_id", "case_id", "customer_id", "resource_id", "evidence_type", "evidence_status"},
    "deletion_rules.csv": {"resource_type", "retention_required", "retention_period_days", "rule_reason"},
}


def normalize(value: Any) -> str:
    return " ".join(str(value or "").strip().casefold().split())


def normalize_upper(value: Any) -> str:
    normalized = normalize(value)
    return normalized.upper()


def parse_date(value: Any, field: str = "date") -> str | None:
    raw = str(value or "").strip()
    if not raw:
        return None
    try:
        if "T" in raw or "Z" in raw:
            parsed = datetime.fromisoformat(raw.replace("Z", "+00:00"))
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=timezone.utc)
            return parsed.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
        parsed = date.fromisoformat(raw)
        return datetime(parsed.year, parsed.month, parsed.day, tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")
    except (TypeError, ValueError):
        return None


def parse_bool(value: Any) -> bool | None:
    normalized = normalize(value)
    if normalized in {"true", "1", "yes", "y"}:
        return True
    if normalized in {"false", "0", "no", "n"}:
        return False
    return None


def stable_id(prefix: str, *parts: Any) -> str:
    payload = "\x1f".join(normalize(part) for part in parts)
    return f"{prefix}_{hashlib.sha256(payload.encode('utf-8')).hexdigest()[:20]}"


def read_csv(path: Path) -> tuple[list[dict[str, str]], list[dict[str, str]]]:
    rejects: list[dict[str, str]] = []
    if not path.is_file():
        return [], [{"source_file": path.name, "source_row": "0", "record_id": "", "reasons": "SOURCE_MISSING"}]
    try:
        with path.open(newline="", encoding="utf-8-sig") as stream:
            reader = csv.DictReader(stream)
            if reader.fieldnames is None:
                return [], [{"source_file": path.name, "source_row": "0", "record_id": "", "reasons": "MISSING_HEADER"}]
            rows = []
            required = REQUIRED_SCHEMAS.get(path.name, set())
            missing_columns = sorted(required - set(reader.fieldnames or []))
            if missing_columns:
                return [], [{"source_file": path.name, "source_row": "0", "record_id": "", "reasons": "MISSING_COLUMNS:" + ",".join(missing_columns)}]
            for number, row in enumerate(reader, start=2):
                cleaned = {str(key).strip(): str(value or "").strip() for key, value in row.items()}
                missing = sorted(key for key in required if not cleaned.get(key, ""))
                if missing:
                    rejects.append({"source_file": path.name, "source_row": str(number), "record_id": "", "reasons": "REQUIRED_NULL:" + ",".join(missing)})
                    continue
                rows.append(cleaned)
            return rows, rejects
    except (OSError, csv.Error, UnicodeDecodeError) as error:
        return [], [{"source_file": path.name, "source_row": "0", "record_id": "", "reasons": f"SOURCE_READ_ERROR:{type(error).__name__}"}]


def _make_schema(connection: sqlite3.Connection) -> None:
    connection.executescript("""
    PRAGMA foreign_keys = ON;
    CREATE TABLE fact_deletion_request (
      case_id TEXT PRIMARY KEY, customer_id TEXT REFERENCES dim_customer(customer_id), email TEXT,
      requested_at TEXT, reported_status TEXT, reported_at TEXT, audit_at TEXT, request_text TEXT,
      source_file TEXT NOT NULL, identity_resolution_status TEXT NOT NULL
    );
    CREATE TABLE dim_customer (
      customer_id TEXT PRIMARY KEY, name TEXT, phone TEXT, email TEXT,
      current_updated_at TEXT, source_file TEXT NOT NULL
    );
    CREATE TABLE dim_identity_history (
      audit_id TEXT PRIMARY KEY, customer_id TEXT REFERENCES dim_customer(customer_id), old_email TEXT,
      new_email TEXT, change_date TEXT, field_name TEXT, old_value TEXT, new_value TEXT, source_file TEXT NOT NULL
    );
    CREATE TABLE fact_resource (
      resource_id TEXT PRIMARY KEY, customer_id TEXT REFERENCES dim_customer(customer_id), system_id TEXT,
      resource_type TEXT, state TEXT, observed_at TEXT, system_ids_json TEXT NOT NULL,
      resource_types_json TEXT NOT NULL, source_evidence_ids_json TEXT NOT NULL,
      observations_json TEXT NOT NULL, relationship_status TEXT NOT NULL
    );
    CREATE TABLE fact_activity (
      activity_id TEXT PRIMARY KEY, resource_id TEXT REFERENCES fact_resource(resource_id), claimed_resource_id TEXT,
      system_id TEXT, event_type TEXT, timestamp TEXT, result TEXT, source_system TEXT,
      target_system TEXT, details TEXT, source_file TEXT NOT NULL
    );
    CREATE TABLE fact_evidence (
      evidence_id TEXT PRIMARY KEY, resource_id TEXT REFERENCES fact_resource(resource_id), source_file TEXT NOT NULL,
      evidence_type TEXT, captured_at TEXT, source_origin TEXT, resource_link_status TEXT NOT NULL
    );
    CREATE TABLE dim_deletion_policy (
      policy_id TEXT PRIMARY KEY, source_rule_id TEXT NOT NULL, resource_type TEXT,
      action_required TEXT, retention_period TEXT
    );
    CREATE TABLE fact_case_data_link (
      link_id TEXT PRIMARY KEY, case_id TEXT NOT NULL REFERENCES fact_deletion_request(case_id),
      customer_id TEXT REFERENCES dim_customer(customer_id), resource_id TEXT REFERENCES fact_resource(resource_id),
      evidence_id TEXT REFERENCES fact_evidence(evidence_id), activity_id TEXT REFERENCES fact_activity(activity_id),
      rule_id TEXT REFERENCES dim_deletion_policy(policy_id), relationship_status TEXT NOT NULL, source_reference TEXT
    );
    CREATE TABLE silver_rejects (
      source_file TEXT NOT NULL, source_row TEXT NOT NULL, record_id TEXT, reasons TEXT NOT NULL
    );
    CREATE INDEX idx_stream_resource_customer ON fact_resource(customer_id);
    CREATE INDEX idx_stream_activity_resource ON fact_activity(resource_id, timestamp);
    CREATE VIEW v_stream_verified_case_links AS
      SELECT l.*, r.audit_at, e.captured_at
      FROM fact_case_data_link l
      JOIN fact_deletion_request r ON r.case_id=l.case_id
      LEFT JOIN fact_evidence e ON e.evidence_id=l.evidence_id
      WHERE l.relationship_status='VERIFIED'
        AND (e.captured_at IS NULL OR e.captured_at='' OR e.captured_at<=r.audit_at);
    CREATE VIEW v_stream_resource_quality AS
      SELECT resource_id, customer_id, system_id, resource_type, state, relationship_status,
             CASE WHEN relationship_status='RESOLVED' THEN 1 ELSE 0 END AS ownership_verified
      FROM fact_resource;
    """)


def build_streaming_silver(input_dir: str | Path, output_dir: str | Path) -> dict[str, Any]:
    """Build the reference streaming fixture into the existing eight Silver entities.

    This function is intentionally separate from build_silver and never writes challenge
    datasets. All relationships require direct customer/resource/evidence IDs and a
    successful request/customer identity match; ambiguous rows remain unresolved.
    """
    source = Path(input_dir)
    output = Path(output_dir)
    output.mkdir(parents=True, exist_ok=True)

    raw: dict[str, list[dict[str, str]]] = {}
    rejects: list[dict[str, str]] = []
    for filename in REQUIRED_SCHEMAS:
        rows, row_rejects = read_csv(source / filename)
        raw[filename] = rows
        rejects.extend(row_rejects)

    identity_rows = raw["customer_identity.csv"]
    customers: dict[str, dict[str, str]] = {}
    email_index: dict[str, set[str]] = defaultdict(set)
    user_index: dict[str, set[str]] = defaultdict(set)
    for row in identity_rows:
        customer_id = normalize(row["customer_id"])
        user_id = normalize(row["user_id"])
        email = normalize(row["email"])
        if not customer_id or not user_id:
            rejects.append({"source_file": "customer_identity.csv", "source_row": "", "record_id": row.get("customer_id", ""), "reasons": "REQUIRED_NULL"})
            continue
        if customer_id in customers:
            rejects.append({"source_file": "customer_identity.csv", "source_row": "", "record_id": customer_id, "reasons": "DUPLICATE_CUSTOMER_ID"})
            continue
        customer_status = normalize_upper(row["identity_status"])
        if customer_status not in {"ACTIVE", "INACTIVE", "DELETED"}:
            rejects.append({"source_file": "customer_identity.csv", "source_row": "", "record_id": customer_id, "reasons": "INVALID_IDENTITY_STATUS"})
            continue
        customers[customer_id] = {"customer_id": customer_id, "user_id": user_id, "email": email, "identity_status": customer_status}
        email_index[email].add(customer_id)
        user_index[user_id].add(customer_id)

    duplicate_rejections = [
        {"source_file": "customer_identity.csv", "source_row": "", "record_id": email, "reasons": "DUPLICATE_EMAIL_CUSTOMERS:" + ",".join(sorted(ids))}
        for email, ids in email_index.items() if len(ids) > 1
    ]
    rejects.extend(duplicate_rejections)

    request_rows: list[dict[str, str]] = []
    request_customers: dict[str, str] = {}
    request_audit_by_case: dict[str, str] = {}
    request_source_rows: dict[str, str] = {}
    seen_requests: set[str] = set()
    for index, row in enumerate(raw["deletion_requests.csv"], start=2):
        case_id = normalize(row["case_id"])
        customer_id = normalize(row["customer_id"])
        email = normalize(row["email"])
        requested = parse_date(row["request_date"])
        if not requested:
            rejects.append({"source_file": "deletion_requests.csv", "source_row": str(index), "record_id": case_id, "reasons": "INVALID_DATE:request_date"})
            continue
        if case_id in seen_requests:
            rejects.append({"source_file": "deletion_requests.csv", "source_row": str(index), "record_id": case_id, "reasons": "DUPLICATE_PRIMARY_KEY"})
            continue
        seen_requests.add(case_id)
        customer = customers.get(customer_id)
        email_matches = email_index.get(email, set())
        if customer is None:
            resolution = "UNRESOLVED_CUSTOMER_ID"
        elif email_matches != {customer_id} or normalize(customer["email"]) != email:
            resolution = "AMBIGUOUS_EMAIL_CUSTOMER_CONFLICT"
        else:
            resolution = "VERIFIED"
            request_customers[case_id] = customer_id
        request_source_rows[case_id] = str(index)
        audit_at = requested
        request_audit_by_case[case_id] = audit_at
        request_rows.append({
            "case_id": case_id, "customer_id": customer_id if resolution == "VERIFIED" else "",
            "email": email, "requested_at": audit_at, "reported_status": normalize_upper(row["request_status"]),
            "reported_at": audit_at, "audit_at": audit_at, "request_text": "Deletion request type: " + normalize_upper(row["request_type"]),
            "source_file": "deletion_requests.csv", "identity_resolution_status": resolution,
        })

    resource_rows: list[dict[str, str]] = []
    resource_customer: dict[str, str | None] = {}
    seen_resources: dict[str, set[str]] = defaultdict(set)
    resource_reject_record: dict[str, set[str]] = defaultdict(set)
    for index, row in enumerate(raw["customer_resources.csv"], start=2):
        resource_id = normalize(row["resource_id"])
        customer_id = normalize(row["customer_id"])
        resource_type = normalize_upper(row["resource_type"])
        system_id = normalize(row["system_name"])
        record_status = normalize_upper(row["record_status"])
        contains_pii = parse_bool(row["contains_pii"])
        if not re.fullmatch(r"[a-z][a-z0-9_-]*", resource_id):
            rejects.append({"source_file": "customer_resources.csv", "source_row": str(index), "record_id": resource_id, "reasons": "INVALID_RESOURCE_ID"})
            continue
        if contains_pii is None:
            rejects.append({"source_file": "customer_resources.csv", "source_row": str(index), "record_id": resource_id, "reasons": "INVALID_BOOLEAN:contains_pii"})
            continue
        state = "IDENTIFIABLE" if contains_pii and record_status not in {"DELETED", "ANONYMIZED", "RETAINED"} else record_status
        if customer_id not in customers:
            relationship = "UNRESOLVED_CUSTOMER"
        else:
            relationship = "RESOLVED"
        owners = seen_resources[resource_id]
        owners.add(customer_id if customer_id in customers else "")
        resource_customer[resource_id] = customer_id if len(owners) == 1 and customer_id in customers else None
        resource_reject_record[resource_id].add(record_status)
        resource_rows.append({
            "resource_id": resource_id, "customer_id": customer_id if relationship == "RESOLVED" else "",
            "system_id": system_id, "resource_type": resource_type, "state": state,
            "observed_at": "", "system_ids_json": json.dumps([system_id]),
            "resource_types_json": json.dumps([resource_type]), "source_evidence_ids_json": "[]",
            "observations_json": json.dumps([{"source_file":"customer_resources.csv","source_row":index,"record_status":record_status,"contains_pii":contains_pii,"personal_data_status":"IDENTIFIABLE" if contains_pii else "ANONYMIZED"}], separators=(',', ':')),
            "relationship_status": relationship,
        })

    # Preserve one deterministic row per resource. Duplicate streaming snapshots are merged without duplicate IDs.
    merged_resources: dict[str, dict[str, str]] = {}
    for row in resource_rows:
        resource_id = row["resource_id"]
        if resource_id in merged_resources:
            existing = merged_resources[resource_id]
            systems = sorted(set(json.loads(existing["system_ids_json"])) | set(json.loads(row["system_ids_json"])))
            types = sorted(set(json.loads(existing["resource_types_json"])) | set(json.loads(row["resource_types_json"])))
            observations = json.loads(existing["observations_json"])
            observations.extend(json.loads(row["observations_json"]))
            owners = {existing["customer_id"], row["customer_id"]} - {""}
            existing.update({
                "system_ids_json": json.dumps(systems), "resource_types_json": json.dumps(types),
                "observations_json": json.dumps(observations, separators=(',', ':')),
                "customer_id": next(iter(owners)) if len(owners) == 1 else "",
                "relationship_status": "CONFLICTING_CUSTOMER" if len(owners) > 1 else existing["relationship_status"],
            })
        else:
            merged_resources[resource_id] = dict(row)
    resource_rows = [merged_resources[key] for key in sorted(merged_resources)]

    policy_rows: list[dict[str, str]] = []
    policy_seen: set[str] = set()
    for index, row in enumerate(raw["deletion_rules.csv"], start=2):
        resource_type = normalize_upper(row["resource_type"])
        retention_required = parse_bool(row["retention_required"])
        try:
            retention_days = int(row["retention_period_days"])
            if retention_days < 0:
                raise ValueError
        except ValueError:
            rejects.append({"source_file":"deletion_rules.csv","source_row":str(index),"record_id":resource_type,"reasons":"INVALID_RETENTION_PERIOD_DAYS"})
            continue
        if retention_required is None:
            rejects.append({"source_file":"deletion_rules.csv","source_row":str(index),"record_id":resource_type,"reasons":"INVALID_BOOLEAN:retention_required"})
            continue
        if resource_type in policy_seen:
            rejects.append({"source_file":"deletion_rules.csv","source_row":str(index),"record_id":resource_type,"reasons":"DUPLICATE_POLICY_RESOURCE_TYPE"})
            continue
        policy_seen.add(resource_type)
        action = "RETAIN" if retention_required else "ANONYMIZE" if resource_type == "ANALYTICS_COPY" else "DELETE"
        policy_id = stable_id("rule", resource_type, row["rule_reason"])
        policy_rows.append({"policy_id":policy_id,"source_rule_id":"deletion_rules.csv","resource_type":resource_type,
                           "action_required":action,"retention_period":json.dumps({"days":retention_days,"reason":row["rule_reason"],"retention_required":retention_required}, separators=(',', ':'))})

    transaction_resources: list[dict[str, str]] = []
    for index, row in enumerate(raw["transactions.csv"], start=2):
        transaction_id = normalize(row["transaction_id"])
        customer_id = normalize(row["customer_id"])
        transaction_date = parse_date(row["transaction_date"])
        try:
            amount = float(row["amount"])
            if amount < 0:
                raise ValueError
        except ValueError:
            rejects.append({"source_file":"transactions.csv","source_row":str(index),"record_id":transaction_id,"reasons":"INVALID_AMOUNT"})
            continue
        if transaction_date is None:
            rejects.append({"source_file":"transactions.csv","source_row":str(index),"record_id":transaction_id,"reasons":"INVALID_DATE:transaction_date"})
            continue
        personal_status = normalize_upper(row["personal_data_status"])
        if personal_status not in {"ANONYMIZED", "IDENTIFIABLE", "RETAINED"}:
            rejects.append({"source_file":"transactions.csv","source_row":str(index),"record_id":transaction_id,"reasons":"INVALID_PERSONAL_DATA_STATUS"})
            continue
        resource_id = transaction_id if not transaction_id.startswith("T") else "transaction_" + transaction_id[1:].lower()
        system_id = "payment_service"
        relationship = "RESOLVED" if customer_id in customers else "UNRESOLVED_CUSTOMER"
        transaction_resources.append({"resource_id":resource_id,"customer_id":customer_id if relationship=="RESOLVED" else "","system_id":system_id,
                                      "resource_type":"TRANSACTION","state":personal_status,"observed_at":transaction_date,
                                      "system_ids_json":json.dumps([system_id]),"resource_types_json":json.dumps(["TRANSACTION"]),
                                      "source_evidence_ids_json":"[]","observations_json":json.dumps([{"transaction_id":transaction_id,"amount":amount,"personal_data_status":personal_status}], separators=(',', ':')),"relationship_status":relationship})

    backup_resources: list[dict[str, str]] = []
    for index, row in enumerate(raw["backups.csv"], start=2):
        backup_id = normalize(row["backup_id"])
        customer_id = normalize(row["customer_id"])
        backup_date = parse_date(row["backup_date"])
        if backup_date is None:
            rejects.append({"source_file":"backups.csv","source_row":str(index),"record_id":backup_id,"reasons":"INVALID_DATE:backup_date"})
            continue
        backup_status = normalize_upper(row["backup_status"])
        purge_status = normalize_upper(row["purge_status"])
        if backup_status not in {"AVAILABLE", "DELETED", "EXPIRED"}:
            rejects.append({"source_file":"backups.csv","source_row":str(index),"record_id":backup_id,"reasons":"INVALID_BACKUP_STATUS"})
            continue
        if purge_status not in {"PURGED", "PENDING", "NOT_STARTED", "EXEMPT", "FAILED", "BLOCKED"}:
            rejects.append({"source_file":"backups.csv","source_row":str(index),"record_id":backup_id,"reasons":"INVALID_PURGE_STATUS"})
            continue
        resource_id = "backup_" + backup_id[1:].lower()
        relationship = "RESOLVED" if customer_id in customers else "UNRESOLVED_CUSTOMER"
        state = "BLOCKED" if purge_status in {"PURGED", "EXEMPT"} else "ACTIVE" if backup_status == "AVAILABLE" else "PRESENT"
        backup_resources.append({"resource_id":resource_id,"customer_id":customer_id if relationship=="RESOLVED" else "","system_id":"backup_service","resource_type":"BACKUP_SNAPSHOT","state":state,
                                 "observed_at":backup_date,"system_ids_json":json.dumps(["backup_service"]),"resource_types_json":json.dumps(["BACKUP_SNAPSHOT"]),"source_evidence_ids_json":"[]",
                                 "observations_json":json.dumps([{"backup_id":backup_id,"backup_location":row["backup_location"],"backup_status":backup_status,"purge_status":purge_status}], separators=(',', ':')),"relationship_status":relationship})

    by_resource: dict[str, dict[str, str]] = {row["resource_id"]: dict(row) for row in resource_rows}
    for row in transaction_resources + backup_resources:
        resource_id = row["resource_id"]
        if resource_id not in by_resource:
            by_resource[resource_id] = row
        else:
            existing = by_resource[resource_id]
            existing["observations_json"] = json.dumps(json.loads(existing["observations_json"])+json.loads(row["observations_json"]), separators=(',', ':'))
    resource_rows = [by_resource[key] for key in sorted(by_resource)]

    activity_rows: list[dict[str, str]] = []
    activity_by_id: dict[str, dict[str, str]] = {}
    for filename in ("system_activities.csv", "audit.csv"):
        date_field = "activity_date" if filename == "system_activities.csv" else "audit_date"
        id_field = "activity_id" if filename == "system_activities.csv" else "audit_id"
        for index, row in enumerate(raw[filename], start=2):
            record_id = normalize(row[id_field])
            event_time = parse_date(row[date_field])
            if event_time is None:
                rejects.append({"source_file":filename,"source_row":str(index),"record_id":record_id,"reasons":"INVALID_DATE:"+date_field})
                continue
            case_id = normalize(row["case_id"])
            customer_id = normalize(row["customer_id"])
            resource_id = normalize(row["resource_id"])
            if record_id in activity_by_id:
                rejects.append({"source_file":filename,"source_row":str(index),"record_id":record_id,"reasons":"DUPLICATE_PRIMARY_KEY"})
                continue
            action = normalize_upper(row["action"])
            result = normalize_upper(row["activity_status"] if filename == "system_activities.csv" else row["result"])
            if filename == "audit.csv" and result not in {"SUCCESS", "FAILED", "APPROVED", "PENDING", "REJECTED"}:
                rejects.append({"source_file":filename,"source_row":str(index),"record_id":record_id,"reasons":"INVALID_AUDIT_RESULT"})
                continue
            verified_resource = resource_id in by_resource
            verified_customer = customer_id in customers
            verified_case = case_id in request_customers and request_customers[case_id] == customer_id
            if not (verified_resource and verified_customer and verified_case):
                relationship_status = "UNVERIFIED_ACTIVITY"
                linked_resource = ""
            else:
                relationship_status = "VERIFIED_ACTIVITY"
                linked_resource = resource_id
            activity_rows.append({"activity_id":record_id,"resource_id":linked_resource,"claimed_resource_id":resource_id,
                                  "system_id":normalize(row.get("target_system", "") or by_resource.get(resource_id,{}).get("system_id","unknown")),
                                  "event_type":action,"timestamp":event_time,"result":result,"source_system":normalize(row.get("source_system", "") or ("audit" if filename=="audit.csv" else "system_activity")),
                                  "target_system":normalize(row.get("target_system", "") or by_resource.get(resource_id,{}).get("system_id","")),"details":row.get("details", "") or row.get("performed_by", ""),"source_file":filename})
            activity_by_id[record_id] = activity_rows[-1]

    evidence_rows: list[dict[str, str]] = []
    evidence_by_id: dict[str, dict[str, str]] = {}
    for index, row in enumerate(raw["deletion_evidence.csv"], start=2):
        evidence_id = normalize(row["evidence_id"])
        case_id = normalize(row["case_id"])
        customer_id = normalize(row["customer_id"])
        resource_id = normalize(row["resource_id"])
        evidence_status = normalize_upper(row["evidence_status"])
        if evidence_status not in {"VERIFIED", "UNVERIFIED", "CONTRADICTORY", "STALE", "MISSING"}:
            rejects.append({"source_file":"deletion_evidence.csv","source_row":str(index),"record_id":evidence_id,"reasons":"INVALID_EVIDENCE_STATUS"})
            continue
        if evidence_id in evidence_by_id:
            rejects.append({"source_file":"deletion_evidence.csv","source_row":str(index),"record_id":evidence_id,"reasons":"DUPLICATE_PRIMARY_KEY"})
            continue
        verified = (
            evidence_status == "VERIFIED" and resource_id in by_resource and customer_id in customers
            and case_id in request_customers and request_customers[case_id] == customer_id
        )
        evidence_rows.append({"evidence_id":evidence_id,"resource_id":resource_id if verified else "","source_file":"deletion_evidence.csv",
                             "evidence_type":normalize(row["evidence_type"]),"captured_at":"","source_origin":"deletion_evidence.csv",
                             "resource_link_status":"VERIFIED" if verified else "UNVERIFIED_OR_CONFLICTING"})
        evidence_by_id[evidence_id] = evidence_rows[-1]

    policy_by_type = {row["resource_type"]: row for row in policy_rows}
    link_map: dict[str, dict[str, str]] = {}
    for row in raw["deletion_evidence.csv"]:
        evidence_id = normalize(row["evidence_id"])
        case_id = normalize(row["case_id"])
        customer_id = normalize(row["customer_id"])
        resource_id = normalize(row["resource_id"])
        evidence_status = normalize_upper(row["evidence_status"])
        evidence = evidence_by_id.get(evidence_id)
        if evidence_status != "VERIFIED" or evidence is None or evidence["resource_link_status"] != "VERIFIED":
            relationship_status = "UNVERIFIED_EVIDENCE"
            linked_resource = ""
            linked_evidence = ""
        else:
            relationship_status = "VERIFIED"
            linked_resource = resource_id
            linked_evidence = evidence_id
        resource = by_resource.get(resource_id)
        policy = policy_by_type.get(resource["resource_type"] if resource else normalize_upper("UNKNOWN"))
        rule_id = policy["policy_id"] if policy else ""
        link_id = stable_id("link", case_id, customer_id, linked_resource, linked_evidence)
        link_map[link_id] = {"link_id":link_id,"case_id":case_id if case_id in seen_requests else "","customer_id":customer_id if customer_id in customers else "",
                             "resource_id":linked_resource,"evidence_id":linked_evidence,"activity_id":"","rule_id":rule_id,
                             "relationship_status":relationship_status,"source_reference":"deletion_evidence.csv:"+evidence_id}

    link_rows = sorted(link_map.values(), key=lambda row: row["link_id"])

    entity_fields = {
        "fact_deletion_request": ("case_id","customer_id","email","requested_at","reported_status","reported_at","audit_at","request_text","source_file","identity_resolution_status"),
        "dim_customer": ("customer_id","name","phone","email","current_updated_at","source_file"),
        "dim_identity_history": ("audit_id","customer_id","old_email","new_email","change_date","field_name","old_value","new_value","source_file"),
        "fact_resource": ("resource_id","customer_id","system_id","resource_type","state","observed_at","system_ids_json","resource_types_json","source_evidence_ids_json","observations_json","relationship_status"),
        "fact_activity": ("activity_id","resource_id","claimed_resource_id","system_id","event_type","timestamp","result","source_system","target_system","details","source_file"),
        "fact_evidence": ("evidence_id","resource_id","source_file","evidence_type","captured_at","source_origin","resource_link_status"),
        "dim_deletion_policy": ("policy_id","source_rule_id","resource_type","action_required","retention_period"),
        "fact_case_data_link": ("link_id","case_id","customer_id","resource_id","evidence_id","activity_id","rule_id","relationship_status","source_reference"),
    }
    customer_rows = [{"customer_id":customer_id,"name":"","phone":"","email":value["email"],"current_updated_at":"","source_file":"customer_identity.csv"} for customer_id,value in sorted(customers.items())]
    entity_rows = {
        "fact_deletion_request": sorted(request_rows,key=lambda row:row["case_id"]),
        "dim_customer": customer_rows,
        "dim_identity_history": [],
        "fact_resource": resource_rows,
        "fact_activity": sorted(activity_rows,key=lambda row:row["activity_id"]),
        "fact_evidence": sorted(evidence_rows,key=lambda row:row["evidence_id"]),
        "dim_deletion_policy": sorted(policy_rows,key=lambda row:row["policy_id"]),
        "fact_case_data_link": link_rows,
    }

    for entity, rows in entity_rows.items():
        destination = output / f"{entity}.csv"
        with tempfile.NamedTemporaryFile("w",newline="",encoding="utf-8",dir=output,delete=False) as stream:
            temp=Path(stream.name)
            writer=csv.DictWriter(stream,fieldnames=list(entity_fields[entity]),lineterminator="\n",extrasaction="ignore")
            writer.writeheader()
            for row in rows:
                writer.writerow({field:row.get(field,"") for field in entity_fields[entity]})
        os.replace(temp,destination)

    rejects_output = output / "silver_rejects.csv"
    reject_fields=("source_file","source_row","record_id","reasons")
    with tempfile.NamedTemporaryFile("w",newline="",encoding="utf-8",dir=output,delete=False) as stream:
        temp=Path(stream.name)
        writer=csv.DictWriter(stream,fieldnames=list(reject_fields),lineterminator="\n")
        writer.writeheader(); writer.writerows(rejects)
    os.replace(temp,rejects_output)

    database_path=output / "silver_database.db"
    with tempfile.NamedTemporaryFile(suffix=".db",dir=output,delete=False) as stream:
        temporary_db=Path(stream.name)
    try:
        connection=sqlite3.connect(temporary_db)
        connection.execute("PRAGMA foreign_keys=OFF")
        _make_schema(connection)
        connection.execute("PRAGMA foreign_keys=OFF")
        connection.executemany("INSERT INTO dim_customer VALUES (:customer_id,:name,:phone,:email,:current_updated_at,:source_file)", customer_rows)
        connection.executemany("INSERT INTO fact_deletion_request VALUES (:case_id,:customer_id,:email,:requested_at,:reported_status,:reported_at,:audit_at,:request_text,:source_file,:identity_resolution_status)", [{**row,"customer_id":row.get("customer_id") or None} for row in entity_rows["fact_deletion_request"]])
        connection.executemany("INSERT INTO fact_resource VALUES (:resource_id,:customer_id,:system_id,:resource_type,:state,:observed_at,:system_ids_json,:resource_types_json,:source_evidence_ids_json,:observations_json,:relationship_status)", [{**row,"customer_id":row.get("customer_id") or None} for row in resource_rows])
        connection.executemany("INSERT INTO fact_activity VALUES (:activity_id,:resource_id,:claimed_resource_id,:system_id,:event_type,:timestamp,:result,:source_system,:target_system,:details,:source_file)", [{**row,"resource_id":row.get("resource_id") or None} for row in activity_rows])
        connection.executemany("INSERT INTO fact_evidence VALUES (:evidence_id,:resource_id,:source_file,:evidence_type,:captured_at,:source_origin,:resource_link_status)", [{**row,"resource_id":row.get("resource_id") or None} for row in evidence_rows])
        connection.executemany("INSERT INTO dim_deletion_policy VALUES (:policy_id,:source_rule_id,:resource_type,:action_required,:retention_period)", policy_rows)
        connection.executemany("INSERT INTO fact_case_data_link VALUES (:link_id,:case_id,:customer_id,:resource_id,:evidence_id,:activity_id,:rule_id,:relationship_status,:source_reference)", [{**row,"customer_id":row.get("customer_id") or None,"resource_id":row.get("resource_id") or None,"evidence_id":row.get("evidence_id") or None,"activity_id":row.get("activity_id") or None,"rule_id":row.get("rule_id") or None} for row in link_rows])
        connection.executemany("INSERT INTO silver_rejects VALUES (:source_file,:source_row,:record_id,:reasons)", rejects)
        connection.commit()
        foreign_key_errors=connection.execute("PRAGMA foreign_key_check").fetchall()
        if foreign_key_errors:
            connection.close()
            raise sqlite3.IntegrityError(f"Streaming Silver has {len(foreign_key_errors)} foreign-key violations")
        connection.close()
        os.replace(temporary_db,database_path)
    except (OSError,sqlite3.Error):
        temporary_db.unlink(missing_ok=True)
        raise

    return {
        "root":output,"database":database_path,"entity_counts":{name:len(rows) for name,rows in entity_rows.items()},
        "reject_count":len(rejects),"unresolved_requests":sum(row["identity_resolution_status"]!= "VERIFIED" for row in request_rows),
        "unverified_evidence_count":sum(row["resource_link_status"] != "VERIFIED" for row in evidence_rows),
        "verified_links":sum(row["relationship_status"] == "VERIFIED" for row in link_rows),
    }
