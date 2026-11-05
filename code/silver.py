from __future__ import annotations

import csv
import hashlib
import json
import os
import re
import sqlite3
import tempfile
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

from identity import IdentityIndex, normalize_identifier, parse_timestamp


_ENTITY_FIELDS: dict[str, list[str]] = {
    "fact_deletion_request": [
        "case_id", "customer_id", "email", "requested_at", "reported_status", "reported_at",
        "audit_at", "request_text", "source_file", "identity_resolution_status",
    ],
    "dim_customer": [
        "customer_id", "name", "phone", "email", "current_updated_at", "source_file",
    ],
    "dim_identity_history": [
        "audit_id", "customer_id", "old_email", "new_email", "change_date", "field_name",
        "old_value", "new_value", "source_file",
    ],
    "fact_resource": [
        "resource_id", "customer_id", "system_id", "resource_type", "state", "observed_at",
        "system_ids_json", "resource_types_json", "source_evidence_ids_json",
        "observations_json", "relationship_status",
    ],
    "fact_activity": [
        "activity_id", "resource_id", "claimed_resource_id", "system_id", "event_type", "timestamp", "result",
        "source_system", "target_system", "details", "source_file",
    ],
    "fact_evidence": [
        "evidence_id", "resource_id", "source_file", "evidence_type", "captured_at",
        "source_origin", "resource_link_status",
    ],
    "dim_deletion_policy": [
        "policy_id", "source_rule_id", "resource_type", "action_required", "retention_period",
    ],
    "fact_case_data_link": [
        "link_id", "case_id", "customer_id", "resource_id", "evidence_id", "activity_id",
        "rule_id", "relationship_status", "source_reference",
    ],
}
_OCR_FIELDS = [
    "evidence_id", "source_file", "extracted_text", "extraction_status", "extraction_method",
    "captured_at", "extracted_at", "source_sha256", "line_boxes_json",
]
_IMAGE_FACT_FIELDS = [
    "evidence_id", "source_reference", "user_id", "user_ids_json", "customer_id", "customer_ids_json",
    "resource_id", "resource_ids_json", "system_id", "system_ids_json", "system_name",
    "resource_type", "event_type", "deletion_status", "event_timestamp", "error_message",
    "emails_json", "phones_json", "uncertain_fields_json", "extraction_confidence", "relationship_status",
]
_VISUAL_SUFFIXES = {".png", ".jpg", ".jpeg", ".tif", ".tiff", ".webp", ".pdf"}
_RESOURCE_RE = re.compile(
    r"\b(?:account|search|support|analytics|export|backup|data_flow|audit_record|tombstone|cache|email_delivery|marketing)_\d+\b",
    re.IGNORECASE,
)
_USER_RE = re.compile(r"\buser_[a-z0-9_-]+\b", re.IGNORECASE)
_CUSTOMER_RE = re.compile(r"\bcustomer_[a-z0-9_-]+\b", re.IGNORECASE)
_SYSTEM_RE = re.compile(r"\b[a-z][a-z0-9_]*(?:_service|_platform|_system)\b", re.IGNORECASE)
_EMAIL_RE = re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.IGNORECASE)
_PHONE_RE = re.compile(r"(?<!\w)\+?\d[\d ()-]{6,}\d(?!\w)")
_PHONE_LABEL_RE = re.compile(r"(?i)\b(?:phone|telephone|mobile|contact number)\s*[:=]\s*(.+?)\s*$")
_TIMESTAMP_RE = re.compile(
    r"\b\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?\b"
)
_LABELS = {
    "system_name": ("system", "system name"),
    "resource_type": ("resource type", "record type", "data category"),
    "event_type": ("event type", "activity type", "operation"),
    "deletion_status": ("deletion status", "account status", "status"),
    "error_message": ("error", "error message", "failure reason"),
    "event_timestamp": ("deletion timestamp", "event timestamp", "event time", "timestamp", "updated at"),
}


def _read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as stream:
        return list(csv.DictReader(stream))


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _timestamp(value: str | None, quality: list[str], label: str) -> str:
    raw = (value or "").strip()
    if not raw:
        return ""
    try:
        parsed = parse_timestamp(raw)
    except (ValueError, TypeError):
        quality.append(f"Invalid timestamp in {label}: {raw}")
        return raw
    if parsed.tzinfo is None:
        return parsed.isoformat()
    return parsed.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def _identifier(value: str | None) -> str:
    return (value or "").strip()


def _email(value: str | None) -> str:
    return normalize_identifier(value).replace(" ", "")


def _phone(value: str | None) -> str:
    value = (value or "").strip()
    if not value:
        return ""
    digits = "".join(character for character in value if character.isdigit())
    return f"+{digits}" if value.lstrip().startswith("+") and digits else digits


def _write_csv(path: Path, fields: list[str], rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        "w", newline="", encoding="utf-8", dir=path.parent, delete=False
    ) as stream:
        temporary = Path(stream.name)
        writer = csv.DictWriter(stream, fieldnames=fields, lineterminator="\n", extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            writer.writerow({field: row.get(field, "") for field in fields})
    os.replace(temporary, path)


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _values(pattern: re.Pattern[str], text: str) -> list[str]:
    return sorted({match.group(0).strip() for match in pattern.finditer(text)}, key=str.casefold)


def _labeled_values(text: str, labels: Iterable[str]) -> list[str]:
    label_pattern = "|".join(re.escape(label) for label in sorted(labels, key=len, reverse=True))
    found = []
    for line in text.splitlines():
        match = re.search(rf"(?i)(?:^|\b)(?:{label_pattern})\s*[:=]\s*(.+?)\s*$", line)
        if match:
            value = match.group(1).strip(" \t|;,")
            if value and value.casefold() not in {"null", "none", "unknown", "n/a", "-"}:
                found.append(value)
    return sorted(set(found), key=str.casefold)


def _one(values: list[str]) -> str:
    return values[0] if len(values) == 1 else ""


def _stable_customer_matches(
    observation: Any,
    identity_index: IdentityIndex,
    customer_ids: set[str],
) -> set[str]:
    matches: set[str] = set()
    normalized = {normalize_identifier(value) for value in observation.identifiers}
    event_time = observation.observed_at
    for customer_id in customer_ids:
        known = identity_index.identifiers(customer_id, event_time)
        strong = {
            normalize_identifier(value) for value in known
            if value == customer_id or "@" in value or value.startswith("+") or re.fullmatch(r"[a-f0-9]{32,64}", value)
        }
        if normalized.intersection(strong):
            matches.add(customer_id)
    return matches


def _image_facts(
    manifest: dict[str, str],
    text: str,
    customer_ids: set[str],
    quality: list[str],
) -> dict[str, Any]:
    user_ids = _values(_USER_RE, text)
    customer_ids_found = _values(_CUSTOMER_RE, text)
    resource_ids = _values(_RESOURCE_RE, text)
    system_ids = _values(_SYSTEM_RE, text)
    emails = sorted({_email(value) for value in _values(_EMAIL_RE, text)})
    phones = sorted({
        "".join(character for character in match.group(1) if character.isdigit())
        for line in text.splitlines()
        if (match := _PHONE_LABEL_RE.search(line))
        and _PHONE_RE.search(match.group(1))
    })
    system_names = _labeled_values(text, _LABELS["system_name"])
    resource_types = _labeled_values(text, _LABELS["resource_type"])
    event_types = _labeled_values(text, _LABELS["event_type"])
    statuses = _labeled_values(text, _LABELS["deletion_status"])
    timestamps = _values(_TIMESTAMP_RE, text)
    errors = []
    for line in text.splitlines():
        if re.search(r"(?i)\b(error|failed|failure|exception)\b", line):
            errors.append(line.strip())
    mapped_customer = user_ids[0] if len(user_ids) == 1 and user_ids[0] in customer_ids else ""
    uncertain = []
    for field, values in (
        ("user_id", user_ids), ("customer_id", customer_ids_found), ("resource_id", resource_ids),
        ("system_id", system_ids), ("system_name", system_names), ("resource_type", resource_types),
        ("event_type", event_types), ("deletion_status", statuses), ("event_timestamp", timestamps),
        ("error_message", sorted(set(errors))),
    ):
        if len(values) > 1:
            uncertain.append(field)
    if len(user_ids) == 1 and len(resource_ids) == 1:
        uncertain.append("customer_resource_relationship")
    return {
        "evidence_id": manifest["file_id"],
        "source_reference": manifest.get("source_origin", manifest.get("origin", "")),
        "user_id": _one(user_ids),
        "user_ids_json": json.dumps(user_ids, ensure_ascii=False),
        "customer_id": _one(customer_ids_found) or mapped_customer,
        "customer_ids_json": json.dumps(customer_ids_found, ensure_ascii=False),
        "resource_id": _one(resource_ids),
        "resource_ids_json": json.dumps(resource_ids, ensure_ascii=False),
        "system_id": _one(system_ids),
        "system_ids_json": json.dumps(system_ids, ensure_ascii=False),
        "system_name": _one(system_names),
        "resource_type": _one(resource_types),
        "event_type": _one(event_types),
        "deletion_status": _one(statuses),
        "event_timestamp": _timestamp(_one(timestamps), quality, f"OCR {manifest['file_id']}"),
        "error_message": " | ".join(sorted(set(errors))),
        "emails_json": json.dumps(emails, ensure_ascii=False),
        "phones_json": json.dumps(phones, ensure_ascii=False),
        "uncertain_fields_json": json.dumps(sorted(set(uncertain)), ensure_ascii=False),
        "extraction_confidence": "",
        "relationship_status": "UNRESOLVED_OCR_RELATIONSHIP" if resource_ids or user_ids or customer_ids_found else "TEXT_ONLY",
    }


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
        new_email TEXT, change_date TEXT, field_name TEXT, old_value TEXT, new_value TEXT,
        source_file TEXT NOT NULL
    );
    CREATE TABLE fact_resource (
        resource_id TEXT PRIMARY KEY, customer_id TEXT REFERENCES dim_customer(customer_id), system_id TEXT,
        resource_type TEXT, state TEXT, observed_at TEXT, system_ids_json TEXT NOT NULL,
        resource_types_json TEXT NOT NULL, source_evidence_ids_json TEXT NOT NULL,
        observations_json TEXT NOT NULL, relationship_status TEXT NOT NULL
    );
    CREATE TABLE fact_activity (
        activity_id TEXT PRIMARY KEY, resource_id TEXT REFERENCES fact_resource(resource_id), claimed_resource_id TEXT,
        system_id TEXT,
        event_type TEXT, timestamp TEXT, result TEXT, source_system TEXT, target_system TEXT,
        details TEXT, source_file TEXT NOT NULL
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
        customer_id TEXT REFERENCES dim_customer(customer_id),
        resource_id TEXT REFERENCES fact_resource(resource_id),
        evidence_id TEXT REFERENCES fact_evidence(evidence_id),
        activity_id TEXT REFERENCES fact_activity(activity_id),
        rule_id TEXT REFERENCES dim_deletion_policy(policy_id),
        relationship_status TEXT NOT NULL, source_reference TEXT
    );

    CREATE INDEX idx_request_customer ON fact_deletion_request(customer_id);
    CREATE INDEX idx_resource_customer ON fact_resource(customer_id);
    CREATE INDEX idx_activity_resource_time ON fact_activity(resource_id, timestamp);
    CREATE INDEX idx_evidence_resource ON fact_evidence(resource_id);
    CREATE INDEX idx_case_link_customer ON fact_case_data_link(customer_id, case_id);

    CREATE VIEW v_case_customer AS
      SELECT r.case_id, r.customer_id, r.audit_at, r.reported_status, c.name, c.email, c.phone
      FROM fact_deletion_request AS r LEFT JOIN dim_customer AS c ON c.customer_id = r.customer_id;

    CREATE VIEW v_customer_resources AS
      SELECT c.customer_id, c.name, x.resource_id, x.system_id, x.resource_type, x.state, x.observed_at
      FROM dim_customer AS c LEFT JOIN fact_resource AS x ON x.customer_id = c.customer_id;

    CREATE VIEW v_resource_activity_evidence_policy AS
      SELECT x.resource_id, x.system_id, x.customer_id, a.activity_id, a.event_type, a.timestamp,
             a.result, e.evidence_id, e.captured_at, p.policy_id, p.action_required
      FROM fact_resource AS x
      LEFT JOIN fact_activity AS a ON a.resource_id = x.resource_id
      LEFT JOIN fact_evidence AS e ON e.resource_id = x.resource_id
      LEFT JOIN dim_deletion_policy AS p ON p.resource_type = x.resource_type;

    CREATE VIEW v_case_evidence_asof AS
      SELECT l.case_id, l.customer_id, l.resource_id, l.evidence_id, l.activity_id, l.rule_id,
             l.relationship_status, r.audit_at, e.captured_at, a.timestamp AS activity_timestamp
      FROM fact_case_data_link AS l
      JOIN fact_deletion_request AS r ON r.case_id = l.case_id
      LEFT JOIN fact_evidence AS e ON e.evidence_id = l.evidence_id
      LEFT JOIN fact_activity AS a ON a.activity_id = l.activity_id
      WHERE (e.captured_at IS NULL OR e.captured_at = '' OR e.captured_at <= r.audit_at)
        AND (a.timestamp IS NULL OR a.timestamp = '' OR a.timestamp <= r.audit_at);

    CREATE VIEW v_activity_timeline AS
      SELECT activity_id, resource_id, system_id, event_type, timestamp, result,
             ROW_NUMBER() OVER (PARTITION BY resource_id ORDER BY timestamp, activity_id) AS row_number,
             RANK() OVER (PARTITION BY resource_id ORDER BY timestamp) AS event_rank,
             DENSE_RANK() OVER (PARTITION BY resource_id ORDER BY timestamp) AS event_dense_rank,
             LAG(result) OVER (PARTITION BY resource_id ORDER BY timestamp, activity_id) AS previous_result,
             LEAD(result) OVER (PARTITION BY resource_id ORDER BY timestamp, activity_id) AS next_result,
             COUNT(*) OVER (PARTITION BY resource_id) AS resource_activity_count,
             MIN(timestamp) OVER (PARTITION BY resource_id) AS first_activity_at,
             MAX(timestamp) OVER (PARTITION BY resource_id) AS last_activity_at
      FROM fact_activity;

    CREATE VIEW v_customer_activity_summary AS
      SELECT r.customer_id, COUNT(a.activity_id) AS activity_count,
             COUNT(DISTINCT a.resource_id) AS resource_count,
             SUM(CASE WHEN upper(COALESCE(a.result, '')) IN ('SUCCESS', 'SUCCEEDED', '200', 'OK') THEN 1 ELSE 0 END) AS claimed_success_count,
             AVG(CASE WHEN upper(COALESCE(a.result, '')) IN ('SUCCESS', 'SUCCEEDED', '200', 'OK') THEN 1.0 ELSE 0.0 END) AS claimed_success_ratio,
             MIN(a.timestamp) AS first_activity_at, MAX(a.timestamp) AS last_activity_at
      FROM fact_resource AS r JOIN fact_activity AS a ON a.resource_id = r.resource_id
      WHERE r.customer_id IS NOT NULL
      GROUP BY r.customer_id
      HAVING COUNT(a.activity_id) > 0;

    CREATE VIEW v_policy_resource_summary AS
      SELECT p.policy_id, p.resource_type, p.action_required, COUNT(r.resource_id) AS resource_count,
             COUNT(DISTINCT r.customer_id) AS linked_customer_count
      FROM dim_deletion_policy AS p LEFT JOIN fact_resource AS r ON r.resource_type = p.resource_type
      GROUP BY p.policy_id, p.resource_type, p.action_required
      HAVING COUNT(r.resource_id) >= 0;
    """)


def build_silver(
    dataset_dir: str | Path,
    identity_index: IdentityIndex,
    evidence_store: Any,
    silver_root: str | Path | None = None,
) -> dict[str, Any]:
    """Build repeatable Silver CSV and SQLite outputs from source rows and parsed evidence."""
    dataset = Path(dataset_dir)
    root = Path(silver_root) if silver_root is not None else dataset.parent / "data" / "silver"
    cleaned_dir = root / "cleaned"
    resources_dir = root / "resources"
    activities_dir = root / "activities"
    evidence_dir = root / "evidence"
    policies_dir = root / "policies"
    relationships_dir = root / "relationships"
    extracted_dir = root / "extracted"
    for directory in (cleaned_dir, resources_dir, activities_dir, evidence_dir, policies_dir, relationships_dir, extracted_dir):
        directory.mkdir(parents=True, exist_ok=True)

    quality: list[str] = []
    for evidence_id, error in getattr(evidence_store, "image_ingestion_errors", {}).items():
        quality.append(f"Bronze image ingestion failed for {evidence_id}: {error}")
    sources = {
        "deletion_requests.csv": _read_csv(dataset / "deletion_requests.csv"),
        "user_identities.csv": _read_csv(dataset / "user_identities.csv"),
        "user_audit_log.csv": _read_csv(dataset / "user_audit_log.csv"),
        "system_activity.csv": _read_csv(dataset / "system_activity.csv"),
        "evidence_files.csv": _read_csv(dataset / "evidence_files.csv"),
        "deletion_rules.csv": _read_csv(dataset / "deletion_rules.csv"),
    }
    image_suffixes = _VISUAL_SUFFIXES - {".pdf"}
    visual_manifest = [row for row in sources["evidence_files.csv"] if Path(row["file_path"]).suffix.casefold() in _VISUAL_SUFFIXES]
    prior_ocr_path = extracted_dir / "silver_ocr_text.csv"
    prior_ocr = {
        row["evidence_id"]: row for row in _read_csv(prior_ocr_path)
    } if prior_ocr_path.exists() else {}
    bronze_metadata_path = dataset.parent / "data" / "bronze" / "evidence_files.csv"
    bronze_by_id = {
        row["evidence_id"]: row for row in _read_csv(bronze_metadata_path)
    } if bronze_metadata_path.exists() else {}
    ocr_rows: list[dict[str, Any]] = []
    image_fact_rows: list[dict[str, Any]] = []
    customer_ids = {_identifier(row.get("user_id")) for row in sources["user_identities.csv"]}
    customer_ids.discard("")
    for manifest in visual_manifest:
        evidence_id = manifest["file_id"]
        suffix = Path(manifest["file_path"]).suffix.casefold()
        source_path = dataset / manifest["file_path"]
        extracted_at = ""
        if suffix in image_suffixes and evidence_id in bronze_by_id:
            source_path = dataset.parent / bronze_by_id[evidence_id]["storage_path"]
        text = evidence_store.ocr_text_by_evidence.get(evidence_id, "")
        extraction_error = evidence_store.ocr_errors.get(evidence_id, "")
        if not source_path.is_file():
            extraction_status = "SOURCE_MISSING"
            source_hash = ""
            text = ""
            quality.append(f"Missing visual evidence source: {evidence_id}")
        else:
            try:
                source_hash = _sha256(source_path)
            except OSError as error:
                source_hash = ""
                extraction_status = "SOURCE_UNREADABLE"
                extraction_error = str(error)
                text = ""
                quality.append(f"Unreadable visual evidence source {evidence_id}: {error}")
            else:
                cached = prior_ocr.get(evidence_id)
                cached_lines_valid = suffix == ".pdf"
                if suffix in image_suffixes and cached and "line_boxes_json" in cached:
                    try:
                        cached_lines_valid = isinstance(json.loads(cached["line_boxes_json"]), list)
                    except json.JSONDecodeError:
                        cached_lines_valid = False
                if (
                    cached
                    and cached.get("source_sha256") == source_hash
                    and cached.get("extraction_status") in {"SUCCESS", "NO_TEXT"}
                    and evidence_id not in evidence_store.ocr_errors
                    and cached_lines_valid
                ):
                    text = cached.get("extracted_text", "")
                    extracted_at = cached.get("extracted_at", "")
                    extraction_status = cached["extraction_status"]
                else:
                    extracted_at = _utc_now()
                    if extraction_error:
                        extraction_status = "OCR_ERROR"
                        quality.append(f"OCR failed for {evidence_id}: {extraction_error}")
                    elif evidence_id not in evidence_store.ocr_text_by_evidence:
                        extraction_status = "OCR_NOT_RUN"
                        quality.append(f"OCR was unavailable for {evidence_id}")
                    else:
                        extraction_status = "SUCCESS" if text.strip() else "NO_TEXT"
                if not extracted_at:
                    extracted_at = _utc_now()
        if not extracted_at:
            extracted_at = _utc_now()
        ocr_rows.append({
            "evidence_id": evidence_id,
            "source_file": manifest["file_path"],
            "extracted_text": text,
            "extraction_status": extraction_status,
            "extraction_method": "PDFKit+Apple Vision via code/ocr.swift" if suffix == ".pdf" else "Apple Vision via code/ocr.swift",
            "captured_at": _timestamp(manifest.get("captured_at"), quality, f"evidence {evidence_id}"),
            "extracted_at": extracted_at,
            "source_sha256": source_hash,
            "line_boxes_json": json.dumps(
                evidence_store.ocr_lines_by_evidence.get(evidence_id, []),
                ensure_ascii=False,
                separators=(",", ":"),
            ),
        })
        if suffix in image_suffixes:
            image_fact_rows.append(_image_facts(manifest, text, customer_ids, quality))

    # The current OCR helper provides text but no calibrated confidence values.
    _write_csv(prior_ocr_path, _OCR_FIELDS, ocr_rows)
    _write_csv(extracted_dir / "silver_image_facts.csv", _IMAGE_FACT_FIELDS, image_fact_rows)

    request_rows: list[dict[str, Any]] = []
    resolved_customers: dict[str, str | None] = {}
    request_by_case: dict[str, dict[str, str]] = {}
    for row in sources["deletion_requests.csv"]:
        case_id = _identifier(row.get("case_id"))
        if not case_id:
            quality.append("Deletion request has missing case_id")
            continue
        request_by_case[case_id] = row
        cutoff = _timestamp(row.get("audit_at"), quality, f"request {case_id} audit_at")
        customer_id = None
        if cutoff:
            try:
                customer_id = identity_index.resolve(_email(row.get("email")), cutoff)
            except (ValueError, TypeError):
                quality.append(f"Invalid audit_at prevents customer resolution for {case_id}")
        resolved_customers[case_id] = customer_id
        if customer_id is None:
            quality.append(f"Unresolved customer for deletion request {case_id}")
        request_rows.append({
            "case_id": case_id,
            "customer_id": customer_id or "",
            "email": _email(row.get("email")),
            "requested_at": _timestamp(row.get("requested_at"), quality, f"request {case_id} requested_at"),
            "reported_status": (row.get("reported_status") or "").strip().upper(),
            "reported_at": _timestamp(row.get("reported_at"), quality, f"request {case_id} reported_at"),
            "audit_at": cutoff,
            "request_text": row.get("request_text", ""),
            "source_file": "dataset/deletion_requests.csv",
            "identity_resolution_status": "RESOLVED" if customer_id else "UNRESOLVED",
        })
    duplicate_cases = [case for case, count in Counter(row["case_id"] for row in request_rows).items() if count > 1]
    quality.extend(f"Duplicate deletion case_id: {case}" for case in duplicate_cases)

    identity_groups: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in sources["user_identities.csv"]:
        customer_id = _identifier(row.get("user_id"))
        if customer_id:
            identity_groups[customer_id].append(row)
        else:
            quality.append("Identity row has missing user_id")
    customer_rows: list[dict[str, Any]] = []
    for customer_id, rows in sorted(identity_groups.items()):
        if len(rows) > 1:
            quality.append(f"Duplicate identity user_id {customer_id}; selected latest valid updated_at")
        selected = max(rows, key=lambda row: _timestamp(row.get("updated_at"), quality, f"identity {customer_id} updated_at"))
        customer_rows.append({
            "customer_id": customer_id,
            "name": " ".join((selected.get("name") or "").split()),
            "phone": _phone(selected.get("phone")),
            "email": _email(selected.get("email")),
            "current_updated_at": _timestamp(selected.get("updated_at"), quality, f"identity {customer_id} updated_at"),
            "source_file": "dataset/user_identities.csv",
        })

    history_rows: list[dict[str, Any]] = []
    for row in sources["user_audit_log.csv"]:
        field = (row.get("field_name") or "").strip().casefold()
        old_value, new_value = row.get("old_value", ""), row.get("new_value", "")
        history_rows.append({
            "audit_id": _identifier(row.get("audit_id")),
            "customer_id": _identifier(row.get("user_id")),
            "old_email": _email(old_value) if field == "email" else "",
            "new_email": _email(new_value) if field == "email" else "",
            "change_date": _timestamp(row.get("event_time"), quality, f"audit {row.get('audit_id')} event_time"),
            "field_name": field,
            "old_value": old_value,
            "new_value": new_value,
            "source_file": "dataset/user_audit_log.csv",
        })

    visual_ids = {row["file_id"] for row in visual_manifest}
    observations_by_resource: dict[str, list[Any]] = defaultdict(list)
    for observation in evidence_store.observations:
        observations_by_resource[observation.resource_id].append(observation)
    resource_rows: list[dict[str, Any]] = []
    resource_systems: dict[str, set[str]] = {}
    resource_categories: dict[str, set[str]] = {}
    resource_customer: dict[str, str | None] = {}
    for resource_id, observations in sorted(observations_by_resource.items()):
        systems = sorted({item.system_id for item in observations if item.system_id})
        categories = sorted({item.category for item in observations if item.category})
        evidence_ids = sorted({item.evidence_id for item in observations if item.evidence_id in evidence_store.capture_time_by_evidence})
        owners: set[str] = set()
        for item in observations:
            if item.evidence_id in visual_ids:
                continue
            owners.update(_stable_customer_matches(item, identity_index, customer_ids))
        owners_sorted = sorted(owners)
        resource_systems[resource_id] = set(systems)
        resource_categories[resource_id] = set(categories)
        resource_customer[resource_id] = owners_sorted[0] if len(owners_sorted) == 1 else None
        latest_observation = max(observations, key=lambda item: (item.observed_at, item.evidence_id))
        state_values = sorted({item.state for item in observations})
        if len(systems) > 1:
            quality.append(f"Resource {resource_id} observed in multiple systems: {', '.join(systems)}")
        if len(owners_sorted) > 1:
            quality.append(f"Resource {resource_id} has conflicting customer links")
        if len(state_values) > 1:
            quality.append(f"Resource {resource_id} has multiple observed states")
        resource_rows.append({
            "resource_id": resource_id,
            "customer_id": owners_sorted[0] if len(owners_sorted) == 1 else "",
            "system_id": systems[0] if len(systems) == 1 else "",
            "resource_type": categories[0] if len(categories) == 1 else "",
            "state": latest_observation.state,
            "observed_at": _timestamp(latest_observation.observed_at, quality, f"resource {resource_id}"),
            "system_ids_json": json.dumps(systems, ensure_ascii=False),
            "resource_types_json": json.dumps(categories, ensure_ascii=False),
            "source_evidence_ids_json": json.dumps(evidence_ids, ensure_ascii=False),
            "observations_json": json.dumps([
                {"evidence_id": item.evidence_id, "system_id": item.system_id, "resource_type": item.category,
                 "state": item.state, "observed_at": item.observed_at, "direct": item.direct,
                 "identifiers": sorted(item.identifiers)}
                for item in sorted(observations, key=lambda value: (value.observed_at, value.evidence_id, value.state))
            ], ensure_ascii=False, separators=(",", ":")),
            "relationship_status": "RESOLVED" if len(owners_sorted) == 1 else "UNRESOLVED",
        })

    activity_rows: list[dict[str, Any]] = []
    activity_ids: set[str] = set()
    for row in sources["system_activity.csv"]:
        activity_id = _identifier(row.get("activity_id"))
        if not activity_id:
            quality.append("System activity row has missing activity_id")
            continue
        activity_ids.add(activity_id)
        resource_id = _identifier(row.get("resource_id"))
        target_system = _identifier(row.get("target_system"))
        observed_systems = resource_systems.get(resource_id, set())
        linked_resource_id = resource_id if resource_id in observations_by_resource else ""
        if linked_resource_id and target_system and observed_systems and target_system not in observed_systems:
            quality.append(
                f"Activity {activity_id} target system {target_system} conflicts with observed systems for {resource_id}"
            )
            linked_resource_id = ""
        activity_rows.append({
            "activity_id": activity_id,
            "resource_id": linked_resource_id,
            "claimed_resource_id": resource_id,
            "system_id": target_system,
            "event_type": (row.get("event_type") or "").strip().upper(),
            "timestamp": _timestamp(row.get("event_time"), quality, f"activity {activity_id} event_time"),
            "result": (row.get("reported_result") or "").strip().upper(),
            "source_system": _identifier(row.get("source_system")),
            "target_system": target_system,
            "details": row.get("details", ""),
            "source_file": "dataset/system_activity.csv",
        })

    evidence_rows: list[dict[str, Any]] = []
    evidence_ids = {row["file_id"] for row in sources["evidence_files.csv"] if row.get("file_id")}
    evidence_resource_ids: dict[str, str | None] = {}
    for row in sources["evidence_files.csv"]:
        evidence_id = _identifier(row.get("file_id"))
        file_path = _identifier(row.get("file_path"))
        suffix = Path(file_path).suffix.casefold()
        evidence_type = "IMAGE" if suffix in image_suffixes else "PDF" if suffix == ".pdf" else "SQL" if suffix == ".sql" else "JSON" if suffix == ".json" else "LOG" if suffix in {".log", ".txt"} else "OTHER"
        linked_resources = {
            item.resource_id for item in evidence_store.observations
            if item.evidence_id == evidence_id and item.resource_id and evidence_id not in visual_ids
        }
        resource_id = next(iter(linked_resources)) if len(linked_resources) == 1 else None
        evidence_resource_ids[evidence_id] = resource_id
        evidence_rows.append({
            "evidence_id": evidence_id,
            "resource_id": resource_id or "",
            "source_file": file_path,
            "evidence_type": evidence_type,
            "captured_at": _timestamp(row.get("captured_at"), quality, f"evidence {evidence_id} captured_at"),
            "source_origin": row.get("source_origin", row.get("origin", "")),
            "resource_link_status": "RESOLVED" if resource_id else "UNRESOLVED_OR_MULTIPLE",
        })
        resolved_source = dataset / file_path
        if not resolved_source.is_file():
            quality.append(f"Evidence manifest source is missing: {evidence_id} ({file_path})")

    policy_rows: list[dict[str, Any]] = []
    policy_by_category: dict[str, str] = {}
    for row in sources["deletion_rules.csv"]:
        policy_id = _identifier(row.get("rule_id"))
        category = (row.get("data_category") or "").strip().upper()
        policy_by_category[category] = policy_id
        policy_rows.append({
            "policy_id": policy_id,
            "source_rule_id": policy_id,
            "resource_type": category,
            "action_required": (row.get("required_action") or "").strip().upper(),
            "retention_period": row.get("condition", ""),
        })

    request_activity_by_resource: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for activity in activity_rows:
        if activity["resource_id"]:
            request_activity_by_resource[activity["resource_id"]].append(activity)
    link_map: dict[str, dict[str, Any]] = {}

    def add_link(case_id: str, customer_id: str | None, resource_id: str | None, evidence_id: str | None,
                 activity_id: str | None, rule_id: str | None, relationship_status: str,
                 source_reference: str = "") -> None:
        parts = (case_id, customer_id or "", resource_id or "", evidence_id or "", activity_id or "", rule_id or "", relationship_status)
        link_id = hashlib.sha256("\x1f".join(parts).encode("utf-8")).hexdigest()[:24]
        link_map[link_id] = {
            "link_id": link_id, "case_id": case_id, "customer_id": customer_id or "",
            "resource_id": resource_id or "", "evidence_id": evidence_id or "", "activity_id": activity_id or "",
            "rule_id": rule_id or "", "relationship_status": relationship_status,
            "source_reference": source_reference,
        }

    for case_id, request in request_by_case.items():
        customer_id = resolved_customers.get(case_id)
        if not customer_id:
            add_link(case_id, None, None, None, None, None, "UNRESOLVED_CUSTOMER")
            continue
        cutoff = request_rows[next(i for i, item in enumerate(request_rows) if item["case_id"] == case_id)]["audit_at"]
        try:
            identifiers = identity_index.identifiers(customer_id, cutoff)
            linked_observations = evidence_store.observations_for_user(identifiers, cutoff)
        except (ValueError, TypeError):
            linked_observations = []
        if not linked_observations:
            add_link(case_id, customer_id, None, None, None, None, "NO_CUTOFF_VALID_EVIDENCE")
        for observation in linked_observations:
            if observation.evidence_id in visual_ids:
                add_link(case_id, customer_id, None, observation.evidence_id, None, None,
                         "OCR_EVIDENCE_MENTION_RESOURCE_UNRESOLVED", observation.evidence_id)
                continue
            evidence_id = observation.evidence_id if observation.evidence_id in evidence_ids else None
            activity_id = observation.evidence_id if observation.evidence_id in activity_ids else None
            rule_id = policy_by_category.get(observation.category)
            linked_activities = [
                activity for activity in request_activity_by_resource.get(observation.resource_id, [])
                if activity["timestamp"] and activity["timestamp"] <= cutoff
                and (not observation.system_id or activity["target_system"] == observation.system_id)
            ]
            if linked_activities:
                for activity in linked_activities:
                    add_link(case_id, customer_id, observation.resource_id, evidence_id,
                             activity["activity_id"], rule_id, "DIRECT_IDENTIFIER_AND_RESOURCE",
                             evidence_id or observation.evidence_id)
            else:
                add_link(case_id, customer_id, observation.resource_id, evidence_id,
                         activity_id, rule_id, "DIRECT_IDENTIFIER_AND_RESOURCE",
                         evidence_id or observation.evidence_id)

    link_rows = sorted(link_map.values(), key=lambda row: row["link_id"])
    request_rows.sort(key=lambda row: row["case_id"])
    customer_rows.sort(key=lambda row: row["customer_id"])
    history_rows.sort(key=lambda row: row["audit_id"])
    resource_rows.sort(key=lambda row: row["resource_id"])
    activity_rows.sort(key=lambda row: row["activity_id"])
    evidence_rows.sort(key=lambda row: row["evidence_id"])
    policy_rows.sort(key=lambda row: row["policy_id"])
    entity_rows = {
        "fact_deletion_request": request_rows,
        "dim_customer": customer_rows,
        "dim_identity_history": history_rows,
        "fact_resource": resource_rows,
        "fact_activity": activity_rows,
        "fact_evidence": evidence_rows,
        "dim_deletion_policy": policy_rows,
        "fact_case_data_link": link_rows,
    }
    destination_dirs = {
        "fact_deletion_request": cleaned_dir,
        "dim_customer": cleaned_dir,
        "dim_identity_history": cleaned_dir,
        "fact_resource": resources_dir,
        "fact_activity": activities_dir,
        "fact_evidence": evidence_dir,
        "dim_deletion_policy": policies_dir,
        "fact_case_data_link": relationships_dir,
    }
    for entity, rows in entity_rows.items():
        _write_csv(destination_dirs[entity] / f"{entity}.csv", _ENTITY_FIELDS[entity], rows)

    image_candidate_count = sum(bool(row["resource_ids_json"] or row["user_id"] or row["customer_ids_json"] != "[]") for row in image_fact_rows)
    unresolved_resource_count = sum(row["relationship_status"] != "RESOLVED" for row in resource_rows)
    dq_path = root / "data_quality_report.md"
    report = [
        "# Silver Data Quality Report", "",
        f"- Requests: {len(request_rows)}; resolved customers: {sum(bool(row['customer_id']) for row in request_rows)}; unresolved customers: {sum(not row['customer_id'] for row in request_rows)}.",
        f"- Customers: {len(customer_rows)}; identity history rows: {len(history_rows)}.",
        f"- Resources: {len(resource_rows)}; unresolved/conflicting resource ownership: {unresolved_resource_count}.",
        f"- Activities: {len(activity_rows)}; evidence records: {len(evidence_rows)}; policies: {len(policy_rows)}.",
        f"- Case-data links: {len(link_rows)}; OCR records: {len(ocr_rows)}; image fact rows: {len(image_fact_rows)}.",
        f"- Image OCR records with candidate identifiers: {image_candidate_count}; OCR errors: {sum(row['extraction_status'] in {'OCR_ERROR', 'SOURCE_MISSING', 'SOURCE_UNREADABLE', 'OCR_NOT_RUN'} for row in ocr_rows)}.",
        "- OCR-derived customer/resource co-occurrence is preserved as an unresolved candidate and is not promoted to a verified relationship.",
        "- OCR extraction confidence is blank because the existing Swift helper does not expose a calibrated confidence score.",
        "", "## Data Quality Findings", "",
    ]
    report.extend(f"- {message}" for message in sorted(set(quality)))
    if not quality:
        report.append("- No quality issues detected in the processed rows.")
    dq_path.write_text("\n".join(report) + "\n", encoding="utf-8")

    database_path = root / "silver_database.db"
    def sql_rows(rows: list[dict[str, Any]], foreign_keys: tuple[str, ...]) -> list[dict[str, Any]]:
        return [
            {**row, **{field: row.get(field) or None for field in foreign_keys}}
            for row in rows
        ]

    with tempfile.NamedTemporaryFile(suffix=".db", dir=root, delete=False) as temporary:
        temporary_db = Path(temporary.name)
    try:
        connection = sqlite3.connect(temporary_db)
        try:
            _make_schema(connection)
            connection.executemany("INSERT INTO dim_customer VALUES (:customer_id,:name,:phone,:email,:current_updated_at,:source_file)", customer_rows)
            connection.executemany("INSERT INTO fact_deletion_request VALUES (:case_id,:customer_id,:email,:requested_at,:reported_status,:reported_at,:audit_at,:request_text,:source_file,:identity_resolution_status)", sql_rows(request_rows, ("customer_id",)))
            connection.executemany("INSERT INTO dim_identity_history VALUES (:audit_id,:customer_id,:old_email,:new_email,:change_date,:field_name,:old_value,:new_value,:source_file)", sql_rows(history_rows, ("customer_id",)))
            connection.executemany("INSERT INTO fact_resource VALUES (:resource_id,:customer_id,:system_id,:resource_type,:state,:observed_at,:system_ids_json,:resource_types_json,:source_evidence_ids_json,:observations_json,:relationship_status)", sql_rows(resource_rows, ("customer_id",)))
            connection.executemany("INSERT INTO fact_activity VALUES (:activity_id,:resource_id,:claimed_resource_id,:system_id,:event_type,:timestamp,:result,:source_system,:target_system,:details,:source_file)", sql_rows(activity_rows, ("resource_id",)))
            connection.executemany("INSERT INTO fact_evidence VALUES (:evidence_id,:resource_id,:source_file,:evidence_type,:captured_at,:source_origin,:resource_link_status)", sql_rows(evidence_rows, ("resource_id",)))
            connection.executemany("INSERT INTO dim_deletion_policy VALUES (:policy_id,:source_rule_id,:resource_type,:action_required,:retention_period)", policy_rows)
            connection.executemany("INSERT INTO fact_case_data_link VALUES (:link_id,:case_id,:customer_id,:resource_id,:evidence_id,:activity_id,:rule_id,:relationship_status,:source_reference)", sql_rows(link_rows, ("customer_id", "resource_id", "evidence_id", "activity_id", "rule_id")))
            connection.commit()
            foreign_key_errors = connection.execute("PRAGMA foreign_key_check").fetchall()
            if foreign_key_errors:
                quality.append(f"SQLite foreign key errors: {len(foreign_key_errors)}")
                raise sqlite3.IntegrityError(f"Silver database has {len(foreign_key_errors)} foreign key errors")
        finally:
            connection.close()
        os.replace(temporary_db, database_path)
    except (OSError, sqlite3.Error):
        temporary_db.unlink(missing_ok=True)
        raise

    return {
        "root": root,
        "database": database_path,
        "entity_counts": {name: len(rows) for name, rows in entity_rows.items()},
        "ocr_count": len(ocr_rows),
        "image_fact_count": len(image_fact_rows),
        "quality_findings": sorted(set(quality)),
    }
