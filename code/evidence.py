import csv
import json
import re
import sqlite3
import subprocess
import sys
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Iterable

from identity import IdentityIndex, normalize_identifier, parse_timestamp


@dataclass(frozen=True)
class Observation:
    evidence_id: str
    observed_at: str
    system_id: str
    resource_id: str
    category: str
    state: str
    identifiers: frozenset[str]
    direct: bool
    detail: str = ""


_CATEGORY_TO_SYSTEM = {
    "USER_PROFILE": "account_service",
    "SECONDARY_IDENTIFIER": "identity_service",
    "SEARCH_INDEX_ENTRY": "search_service",
    "CACHE_ENTRY": "cache_service",
    "SUPPORT_MESSAGE": "support_platform",
    "SUPPORT_ATTACHMENT": "support_platform",
    "ANALYTICS_PROFILE": "analytics_platform",
    "PRODUCT_TELEMETRY": "analytics_platform",
    "USER_EXPORT": "export_service",
    "MARKETING_PROFILE": "marketing_platform",
    "EMAIL_DELIVERY_LOG": "email_delivery_service",
    "SECURITY_AUDIT_LOG": "security_service",
    "LEGAL_HOLD_RECORD": "legal_service",
    "BACKUP_ARCHIVE": "backup_service",
    "ACCOUNT_TOMBSTONE": "identity_service",
    "DATA_FLOW": "integration_service",
}


def _read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as stream:
        return list(csv.DictReader(stream))


def _flatten(value: Any) -> set[str]:
    values: set[str] = set()
    if isinstance(value, dict):
        for key, nested in value.items():
            if key.casefold() not in {"metrics", "recent_activity", "reporting_window"}:
                values.update(_flatten(nested))
    elif isinstance(value, list):
        for nested in value:
            values.update(_flatten(nested))
    elif value is not None and not isinstance(value, bool):
        normalized = normalize_identifier(str(value))
        if normalized:
            values.add(normalized)
    return values


def _identity_fields(record: Any) -> set[str]:
    values: set[str] = set()
    if isinstance(record, dict):
        for key, value in record.items():
            if key.casefold() in {
                "customer_reference", "subject_reference", "subject_ref", "user_id",
                "email", "customer_email", "owner_email", "requester_email",
                "email_hash", "phone", "customer_phone", "owner_phone",
                "requester_phone", "full_name", "display_name", "name", "lookup_value",
                "subject_selector", "customer_selector",
            }:
                values.update(_flatten(value))
            elif isinstance(value, (dict, list)):
                values.update(_identity_fields(value))
    elif isinstance(record, list):
        for value in record:
            values.update(_identity_fields(value))
    elif isinstance(record, str):
        values.add(record)
    return {value for value in values if not value.startswith(("account_", "search_", "support_", "analytics_", "export_", "backup_", "data_flow_", "audit_record_", "tombstone_"))}


def _record_is_identifiable(
    record: Any, include_stable_references: bool = True,
) -> bool:
    direct_identifier_keys = {
        "email", "customer_email", "owner_email", "requester_email", "email_hash",
        "phone", "customer_phone", "owner_phone", "requester_phone", "name",
        "full_name", "display_name", "lookup_value", "subject_selector",
    }
    stable_reference_keys = {
        "customer_reference", "subject_reference", "user_id", "subject_ref",
    }
    sensitive_keys = direct_identifier_keys | (
        stable_reference_keys if include_stable_references else set()
    )
    if isinstance(record, dict):
        for key, value in record.items():
            if key.casefold() in sensitive_keys and value not in (None, "", [], {}):
                return True
            if isinstance(value, (dict, list)) and _record_is_identifiable(value, include_stable_references):
                return True
    elif isinstance(record, list):
        return any(
            _record_is_identifiable(item, include_stable_references)
            for item in record
            if isinstance(item, (dict, list))
        )
    return False


def _record_state(category: str, record: dict[str, Any]) -> str:
    if category in {"DATA_FLOW"}:
        return "ACTIVE" if bool(record.get("enabled")) else "DISABLED"
    if category == "BACKUP_ARCHIVE":
        return "ACTIVE" if bool(record.get("restore_allowed")) else "BLOCKED"
    if category in {"ANALYTICS_PROFILE", "PRODUCT_TELEMETRY"}:
        return "IDENTIFIABLE" if _record_is_identifiable(record) else "ANONYMIZED"
    if category == "ACCOUNT_TOMBSTONE":
        direct_identifiers = ("name", "email", "phone", "email_hash", "full_name")
        return "IDENTIFIABLE" if any(record.get(field) not in (None, "") for field in direct_identifiers) else "REDACTED"
    if category in {"SUPPORT_MESSAGE", "EMAIL_DELIVERY_LOG"}:
        return "IDENTIFIABLE" if _record_is_identifiable(record, False) else "REDACTED"
    if category == "SECURITY_AUDIT_LOG":
        return "PRESENT"
    if category == "LEGAL_HOLD_RECORD":
        return "PRESENT"
    return "PRESENT"


def _observed_at(record: dict[str, Any], fallback: str) -> str:
    for key in ("observed_at", "captured_at", "updated_at", "recorded_at", "indexed_at", "created_at"):
        if isinstance(record.get(key), str) and record[key]:
            return record[key]
    return fallback


def _collection_category(collection: str, record: dict[str, Any]) -> str:
    if collection in {"customer_profiles", "customer_profiles_primary", "customer_profiles_failover_replica"}:
        return "USER_PROFILE"
    if collection == "customer_analytics_reports" or collection == "customer_analytics_profiles":
        return "ANALYTICS_PROFILE"
    if collection in {"customer_search_documents", "search_documents_primary"}:
        return "SEARCH_INDEX_ENTRY"
    if collection in {"support_conversations", "support_records"}:
        return "SUPPORT_MESSAGE"
    if collection in {"ticket_attachments"}:
        return "SUPPORT_ATTACHMENT"
    if collection in {"customer_exports", "customer_export_jobs"}:
        return "USER_EXPORT"
    if collection in {"connector_configurations", "connector_subscriptions"}:
        return "DATA_FLOW"
    if collection in {"backup_catalog", "backup_restore_entries"}:
        return "BACKUP_ARCHIVE"
    if collection in {"security_audit_events", "security_audit_records", "security_audit_logs"}:
        return "SECURITY_AUDIT_LOG"
    if collection in {"retained_order_records"}:
        return "LEGAL_HOLD_RECORD"
    if collection in {"deleted_customer_references"}:
        return "ACCOUNT_TOMBSTONE"
    if collection == "customer_profiles":
        return "USER_PROFILE"
    return str(record.get("record_type", "UNKNOWN"))


class EvidenceStore:
    def __init__(self, dataset_dir: Path, identity_index: IdentityIndex) -> None:
        self.dataset_dir = dataset_dir
        self.evidence_dir = dataset_dir / "evidence"
        self.identity_index = identity_index
        self.manifest = _read_csv(dataset_dir / "evidence_files.csv")
        self.file_id_by_path = {row["file_path"]: row["file_id"] for row in self.manifest}
        self.capture_time_by_evidence = {
            row["file_id"]: row["captured_at"] for row in self.manifest
        }
        self.observations: list[Observation] = []
        self._by_identifier: dict[str, list[Observation]] = defaultdict(list)
        self._by_resource: dict[str, list[Observation]] = defaultdict(list)
        self.activities = _read_csv(dataset_dir / "system_activity.csv")
        self._load_structured_evidence()
        self._load_logs()
        self._load_identity_links()

    def _add(self, observation: Observation) -> None:
        self.observations.append(observation)
        for identifier in observation.identifiers:
            self._by_identifier[identifier].append(observation)
        self._by_resource[observation.resource_id].append(observation)

    def _load_structured_evidence(self) -> None:
        for manifest in self.manifest:
            relative = manifest["file_path"]
            path = self.dataset_dir / relative
            evidence_id = manifest["file_id"]
            captured = manifest["captured_at"]
            if path.suffix.casefold() == ".json":
                try:
                    payload = json.loads(path.read_text(encoding="utf-8"))
                except (OSError, json.JSONDecodeError):
                    continue
                self._load_json(payload, evidence_id, captured)
            elif path.suffix.casefold() == ".sql":
                self._load_sql(path, evidence_id, captured)
        self._load_visual_evidence()

    def _load_json(self, payload: Any, evidence_id: str, captured: str) -> None:
        if isinstance(payload, dict) and isinstance(payload.get("snapshots"), list):
            for snapshot in payload["snapshots"]:
                system = str(snapshot.get("data_store", "unknown"))
                collection = str(snapshot.get("collection", "unknown"))
                category = _collection_category(collection, {})
                for record in snapshot.get("records", []):
                    if not isinstance(record, dict) or not record.get("resource_id"):
                        continue
                    actual_category = str(record.get("record_type", category))
                    self._add(
                        Observation(
                            evidence_id, _observed_at(record, snapshot.get("captured_at", captured)),
                            system, str(record["resource_id"]), actual_category,
                            _record_state(actual_category, record),
                            frozenset(_identity_fields(record)), True,
                            json.dumps(record, ensure_ascii=False, sort_keys=True),
                        )
                    )
            return

        if isinstance(payload, dict) and isinstance(payload.get("service_exports"), dict):
            for system, groups in payload["service_exports"].items():
                if not isinstance(groups, dict):
                    continue
                for group, records in groups.items():
                    if not isinstance(records, list):
                        continue
                    category = self._service_category(group)
                    for record in records:
                        if not isinstance(record, dict) or not record.get("resource_id"):
                            continue
                        self._add(
                            Observation(
                                evidence_id, _observed_at(record, captured), system,
                                str(record["resource_id"]), category,
                                self._service_record_state(group, record),
                                frozenset(_identity_fields(record)), True,
                                json.dumps(record, ensure_ascii=False, sort_keys=True),
                            )
                        )
            return

        if isinstance(payload, dict):
            records = payload.get("records", [])
            if isinstance(records, list):
                for record in records:
                    if not isinstance(record, dict) or not record.get("resource_id"):
                        continue
                    category = str(
                        record.get(
                            "record_type",
                            _collection_category(str(payload.get("collection", "unknown")), record),
                        )
                    )
                    system = str(
                        record.get("system")
                        or _CATEGORY_TO_SYSTEM.get(category)
                        or payload.get("source", "unknown")
                    )
                    self._add(
                        Observation(
                            evidence_id, _observed_at(record, captured),
                            system, str(record["resource_id"]), category,
                            self._claim_state(record["result"])
                            if "result" in record
                            else _record_state(category, record),
                            frozenset(_identity_fields(record)), True,
                            json.dumps(record, ensure_ascii=False, sort_keys=True),
                        )
                    )

    def _load_visual_evidence(self) -> None:
        if sys.platform != "darwin":
            return
        helper = Path(__file__).with_name("ocr.swift")
        visual_files = [
            self.dataset_dir / row["file_path"]
            for row in self.manifest
            if Path(row["file_path"]).suffix.casefold() in {".png", ".pdf"}
        ]
        if not helper.is_file() or not visual_files:
            return
        try:
            result = subprocess.run(
                ["swift", str(helper), *(str(path) for path in visual_files)],
                capture_output=True, check=True, text=True, timeout=120,
            )
            extracted = json.loads(result.stdout)
        except (OSError, subprocess.SubprocessError, json.JSONDecodeError):
            return
        manifest_by_path = {
            str((self.dataset_dir / row["file_path"]).resolve()): row for row in self.manifest
        }
        for image_path, text in extracted.items():
            manifest = manifest_by_path.get(str(Path(image_path).resolve()))
            if manifest and isinstance(text, str):
                self._load_document_text(
                    text, manifest["file_id"], manifest["captured_at"], Path(image_path).name
                )

    def _load_document_text(
        self, text: str, evidence_id: str, captured: str, source_name: str,
    ) -> None:
        user_ids = self.identity_index.identifiers_in_text(text, captured)
        resource_matches = list(re.finditer(
            r"\b(account|search|support|analytics|export|backup|data_flow|audit_record|tombstone|cache|email_delivery|marketing)_\d+\b",
            text, re.IGNORECASE,
        ))
        for index, match in enumerate(resource_matches):
            resource = match.group(0)
            start = max(0, match.start() - 180)
            end = min(len(text), resource_matches[index + 1].start() if index + 1 < len(resource_matches) else match.end() + 180)
            context = text[start:end]
            category = self._category_for_resource(resource, context)
            if "attachment" in source_name.casefold() and category == "SUPPORT_MESSAGE":
                category = "SUPPORT_ATTACHMENT"
            relevant_identifiers = {
                identifier for identifier in user_ids if identifier in normalize_identifier(context)
            }
            if not relevant_identifiers:
                relevant_identifiers = user_ids if len(resource_matches) == 1 else set()
            if not relevant_identifiers:
                continue
            state = "IDENTIFIABLE"
            if category == "ACCOUNT_TOMBSTONE":
                state = "REDACTED" if not re.search(r"email|phone|full_name|email_hash", context, re.IGNORECASE) else "IDENTIFIABLE"
            elif category == "BACKUP_ARCHIVE":
                state = "ACTIVE" if re.search(r"restore (?:allowed|access)[^\n]*(?:yes|true|enabled|allowed)", context, re.IGNORECASE) else "BLOCKED"
            self._add(
                Observation(
                    evidence_id, captured, _CATEGORY_TO_SYSTEM.get(category, "unknown"),
                    resource, category, state, frozenset(relevant_identifiers), True,
                    f"{source_name}: {context.strip()}",
                )
            )

    def _service_record_state(self, group: str, record: dict[str, Any]) -> str:
        if group == "profile_lookups":
            return "ABSENT" if record.get("status_code") == 404 else "PRESENT"
        if group == "index_queries":
            hits = record.get("hits", 0)

            if isinstance(hits, dict):
                documents = hits.get("documents", [])
                if isinstance(documents, list):
                    hit_count = len(documents)
                else:
                    hit_count = int(hits.get("total", 0) or 0)
            elif isinstance(hits, list):
                hit_count = len(hits)
            else:
                try:
                    hit_count = int(hits or 0)
                except (TypeError, ValueError):
                    hit_count = 0

            return "PRESENT" if hit_count > 0 else "ABSENT"
        return _record_state(self._service_category(group), record)

    @staticmethod
    def _service_category(group: str) -> str:
        return {
            "profile_lookups": "USER_PROFILE",
            "profiles": "ANALYTICS_PROFILE",
            "restore_entries": "BACKUP_ARCHIVE",
            "exports": "USER_EXPORT",
            "connectors": "DATA_FLOW",
            "index_queries": "SEARCH_INDEX_ENTRY",
            "audit_records": "SECURITY_AUDIT_LOG",
            "tickets": "SUPPORT_MESSAGE",
        }.get(group, _collection_category(group, {}))

    def _load_sql(self, path: Path, evidence_id: str, captured: str) -> None:
        connection = sqlite3.connect(":memory:")
        try:
            connection.executescript(path.read_text(encoding="utf-8"))
            tables = connection.execute(
                "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
            ).fetchall()
            for (table,) in tables:
                columns = [row[1] for row in connection.execute(f'PRAGMA table_info("{table}")')]
                if {"resource_id", "origin_system", "collection_name", "record_json"}.issubset(columns):
                    rows = connection.execute(
                        f'SELECT resource_id, origin_system, collection_name, record_json, updated_at FROM "{table}"'
                    )
                    for resource_id, system, collection, raw_record, updated_at in rows:
                        try:
                            record = json.loads(raw_record)
                        except (TypeError, json.JSONDecodeError):
                            continue
                        category = _collection_category(collection, record)
                        self._add(
                            Observation(
                                evidence_id, updated_at or captured, system, resource_id,
                                category, _record_state(category, record),
                                frozenset(_identity_fields(record)), True,
                                json.dumps(record, ensure_ascii=False, sort_keys=True),
                            )
                        )
                else:
                    self._load_sql_typed_table(connection, table, columns, evidence_id, captured)
        except sqlite3.Error:
            return
        finally:
            connection.close()

    def _load_sql_typed_table(
        self, connection: sqlite3.Connection, table: str, columns: list[str],
        evidence_id: str, captured: str,
    ) -> None:
        if "resource_id" not in columns or "snapshot_scope" == table:
            return
        rows = connection.execute(f'SELECT * FROM "{table}"')
        category = _collection_category(table, {})
        for values in rows:
            record = dict(zip(columns, values))
            observed = _observed_at(record, captured)
            self._add(
                Observation(
                    evidence_id, observed, _CATEGORY_TO_SYSTEM.get(category, "unknown"),
                    str(record["resource_id"]), category,
                    _record_state(category, record),
                    frozenset(_identity_fields(record)), True,
                    json.dumps(record, ensure_ascii=False, sort_keys=True, default=str),
                )
            )

    @staticmethod
    def _claim_state(result: Any) -> str:
        value = str(result).upper()
        return {
            "FOUND": "PRESENT", "IDENTIFIABLE": "IDENTIFIABLE", "ANONYMIZED": "ANONYMIZED",
            "REDACTED": "REDACTED", "ACTIVE": "ACTIVE", "DISABLED": "DISABLED",
            "BLOCKED": "BLOCKED", "NOT_FOUND": "ABSENT", "NOTFOUND": "ABSENT",
            "ABSENT": "ABSENT", "PRESENT": "PRESENT",
        }.get(value, value)

    def _load_logs(self) -> None:
        for manifest in self.manifest:
            relative = manifest["file_path"]
            path = self.dataset_dir / relative
            if path.suffix.casefold() not in {".log", ".txt"}:
                continue
            try:
                lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
            except OSError:
                continue
            trace_identifiers: dict[tuple[str, str], set[str]] = defaultdict(set)
            for line in lines:
                fields = self._parse_log_fields(line)
                trace_id = fields.get("trace_id") or fields.get("requestId") or fields.get("request_id")
                system = self._normalize_log_system(
                    fields.get("service") or fields.get("function") or fields.get("logger") or "unknown"
                )
                inherited: set[str] = set()
                if trace_id:
                    key = (system, trace_id)
                    identifiers = self._log_identifiers(line, fields)
                    if identifiers:
                        trace_identifiers[key].update(identifiers)
                    inherited = trace_identifiers[key]
                self._load_log_line(
                    line, manifest["file_id"], manifest["captured_at"], inherited, fields
                )

    @staticmethod
    def _parse_log_fields(line: str) -> dict[str, str]:
        fields: dict[str, str] = {}
        pair_pattern = re.compile(
            r"(?P<key>[A-Za-z_][\w]*)=(?:\"(?P<quoted>(?:\\.|[^\"\\])*)\"|(?P<bare>[^\s,|]+))"
        )

        def add_pairs(text: str) -> None:
            for match in pair_pattern.finditer(text):
                value = match.group("quoted") if match.group("quoted") is not None else match.group("bare")
                fields[match.group("key")] = value.replace('\\"', '"')

        brace = line.find("{")
        if brace >= 0:
            try:
                payload = json.loads(line[brace:])
            except json.JSONDecodeError:
                payload = None
            if isinstance(payload, dict):
                return {key: str(value) for key, value in payload.items()}

        message = re.search(r"\bmessage=\"(.*)\"\s*$", line)
        if message:
            raw_message = message.group(1)
            try:
                decoded_message = json.loads(f'\"{raw_message}\"')
            except json.JSONDecodeError:
                decoded_message = raw_message.replace('\\"', '"')
            add_pairs(decoded_message)
            add_pairs(line[:message.start()])
        else:
            add_pairs(line)
        return fields

    @staticmethod
    def _normalize_log_system(system: str) -> str:
        return {
            "profile_service": "account_service",
            "support_replica": "support_platform",
        }.get(system, system)

    @classmethod
    def _log_identifiers(
        cls, line: str, fields: dict[str, str] | None = None,
    ) -> set[str]:
        parsed_fields = fields if fields is not None else cls._parse_log_fields(line)
        identifier_keys = {
            "email", "lookup_key", "match_key", "correlation_key", "scan_key",
            "subject_key", "matched_value", "customer_email", "requester_email",
            "owner_email", "subject_reference", "subject_ref", "customer_reference",
            "user_id", "phone", "email_hash",
        }
        identifiers: set[str] = set()
        for key, raw_value in parsed_fields.items():
            if key.casefold() not in identifier_keys:
                continue
            value = str(raw_value).strip('"\'')
            if value.casefold() not in {"null", "none", "unknown", "-"}:
                identifiers.add(normalize_identifier(value))
        return identifiers

    def _load_identity_links(self) -> None:
        for row in _read_csv(self.dataset_dir / "system_activity.csv"):
            if row["event_type"] != "LINK_RESOURCE_IDENTITY":
                continue
            identifiers = self.identity_index.identifiers_in_text(
                row["details"], row["event_time"]
            )
            if not identifiers:
                continue
            resource = row["resource_id"]
            category = self._category_for_resource(resource, row["details"])
            self._add(
                Observation(
                    row["activity_id"], row["event_time"], row["target_system"],
                    resource, category, "UNKNOWN", frozenset(identifiers), True,
                    row["details"],
                )
            )

    def _load_log_line(
        self, line: str, evidence_id: str, fallback: str,
        inherited_identifiers: set[str] | None = None,
        parsed_fields: dict[str, str] | None = None,
    ) -> None:
        handover = re.search(
            r"(?P<timestamp>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)\s*\|\s*"
            r"(?P<system>[\w]+)\s*\|\s*(?P<resource>(?:account|search|support|analytics|export|backup|data_flow|audit_record|tombstone)_\d+)\s*\|\s*"
            r"(?P<category>[\w_]+)\s*\|\s*(?P<state>[\w_]+)\s*\|\s*(?P<subject>.*)",
            line,
            re.IGNORECASE,
        )
        if handover:
            category = handover.group("category").upper()
            subject = handover.group("subject").strip()
            identifiers = self.identity_index.identifiers_in_text(subject, handover.group("timestamp"))
            self._add(
                Observation(
                    evidence_id, handover.group("timestamp"), handover.group("system"),
                    handover.group("resource"), category,
                    self._claim_state(handover.group("state")),
                    frozenset(identifiers), True, line,
                )
            )
            return
        fields = parsed_fields if parsed_fields is not None else self._parse_log_fields(line)
        timestamp = re.search(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z", line)
        resource = fields.get("resource_id")
        if not resource:
            resource_match = re.search(
                r"\b(account|search|support|analytics|export|backup|data_flow|audit_record|tombstone|cache|email_delivery|marketing)_\d+\b",
                line,
                re.IGNORECASE,
            )
            resource = resource_match.group(0) if resource_match else None
        if not timestamp or not resource:
            return
        raw_system = fields.get("service") or fields.get("function") or fields.get("logger") or "unknown"
        system = self._normalize_log_system(raw_system)
        event = fields.get("event", "").casefold()
        category = self._category_for_resource(resource, line)
        if event in {"contact_query_completed", "deletion_marker_check"} and system == "support_platform":
            category = "SECONDARY_IDENTIFIER"
        elif event == "contact_lookup_completed" and system == "analytics_platform":
            category = "SECONDARY_IDENTIFIER"
        state = self._state_for_log(event, line, category, fields)
        identifiers = self._log_identifiers(line, fields)
        identifiers.update(inherited_identifiers or set())
        self._add(
            Observation(
                evidence_id, timestamp.group(0), system, resource, category,
                state, frozenset(identifiers), True, line,
            )
        )

    @staticmethod
    def _category_for_resource(resource: str, line: str) -> str:
        prefix = resource.split("_", 1)[0].casefold()
        if prefix == "account":
            return "USER_PROFILE"
        if prefix == "search":
            return "SEARCH_INDEX_ENTRY"
        if prefix == "analytics":
            return "ANALYTICS_PROFILE"
        if prefix == "support":
            return "SUPPORT_ATTACHMENT" if "attachment" in line.casefold() else "SUPPORT_MESSAGE"
        if prefix == "export":
            return "USER_EXPORT"
        if prefix == "backup":
            return "BACKUP_ARCHIVE"
        if prefix == "data":
            return "DATA_FLOW"
        if prefix == "audit":
            return "SECURITY_AUDIT_LOG"
        if prefix == "tombstone":
            return "ACCOUNT_TOMBSTONE"
        if prefix == "email":
            return "EMAIL_DELIVERY_LOG"
        if prefix == "marketing":
            return "MARKETING_PROFILE"
        return "UNKNOWN"

    @staticmethod
    def _state_for_log(
        event: str, line: str, category: str, fields: dict[str, str] | None = None,
    ) -> str:
        lower = line.casefold()
        values = {key.casefold(): str(value).casefold() for key, value in (fields or {}).items()}
        if event in {"profile_lookup_completed", "contact_query_completed", "contact_lookup_completed"}:
            rows = values.get("rows")
            return "ABSENT" if rows == "0" else "PRESENT" if rows is not None else "UNKNOWN"
        if event == "index_query_completed":
            result = values.get("result")
            return "ABSENT" if result in {"miss", "not_found"} else "PRESENT" if result else "UNKNOWN"
        if event == "export_metadata_read_completed":
            return "PRESENT" if values.get("available") == "true" else "ABSENT" if values.get("available") == "false" else "UNKNOWN"
        if event == "export_download_check_completed":
            return "PRESENT" if values.get("available") == "true" else "ABSENT" if values.get("available") == "false" else "UNKNOWN"
        if event in {"analytics_profile_read_completed", "support_ticket_read_completed"}:
            if event == "analytics_profile_read_completed" and all(
                values.get(key) in {None, "null", ""}
                for key in ("email", "phone", "email_hash", "customer_reference")
            ):
                return "ANONYMIZED"
            if event == "support_ticket_read_completed" and all(
                values.get(key) in {None, "null", ""}
                for key in ("requester_email", "requester_phone", "requester_name")
            ):
                return "REDACTED"
            return "IDENTIFIABLE"
        if event in {"connector_config_read_completed", "connector_heartbeat", "connector_config_loaded"}:
            return "ACTIVE" if values.get("enabled") == "true" else "DISABLED" if values.get("enabled") == "false" else "UNKNOWN"
        if event in {"restore_policy_read_completed", "restore_candidate_evaluated"}:
            if values.get("restore_allowed") == "true" or (
                values.get("eligible") == "true" and values.get("deletion_block") == "false"
            ):
                return "ACTIVE"
            if values.get("restore_allowed") == "false" or values.get("deletion_block") == "true":
                return "BLOCKED"
        if event == "restore_authorization_completed":
            return "BLOCKED" if values.get("decision") == "deny" else "ACTIVE" if values.get("decision") == "allow" else "UNKNOWN"
        if event == "audit_record_read_completed":
            rows = values.get("rows")
            return "PRESENT" if rows in {"1", "true"} else "ABSENT" if rows == "0" else "UNKNOWN"
        if event in {"analytics_identity_scan", "analytics_profile_read"}:
            return "ANONYMIZED" if values.get("direct_identifiers") == "0" else "IDENTIFIABLE" if values.get("direct_identifiers") == "1" or values.get("matched_value") else "UNKNOWN"
        if event == "message_read":
            return "REDACTED" if values.get("message_text") == "[redacted]" else "IDENTIFIABLE"
        if event == "deletion_marker_check":
            return "PRESENT" if values.get("marker_found") == "false" else "ABSENT" if values.get("marker_found") == "true" else "UNKNOWN"
        if event in {"message_pii_scan", "attachment_pii_scan"}:
            if values.get("matched_value") or values.get("direct_identifiers") == "1":
                return "IDENTIFIABLE"
            if values.get("direct_identifiers") == "0":
                return "REDACTED"
        return "UNKNOWN"

    def observations_for(self, identifiers: Iterable[str], cutoff: str) -> list[Observation]:
        normalized = {normalize_identifier(item) for item in identifiers if item}
        found: dict[tuple[str, str, str, str], Observation] = {}
        for identifier in normalized:
            for observation in self._by_identifier.get(identifier, ()):
                if (
                    parse_timestamp(observation.observed_at) <= parse_timestamp(cutoff)
                    and parse_timestamp(self.capture_time_by_evidence.get(observation.evidence_id, observation.observed_at))
                    <= parse_timestamp(cutoff)
                ):
                    key = (observation.evidence_id, observation.resource_id, observation.system_id, observation.observed_at)
                    found[key] = observation
        return list(found.values())

    def observations_for_resource(
        self, resource_id: str, cutoff: str, system_id: str | None = None,
    ) -> list[Observation]:
        return [
            observation
            for observation in self._by_resource.get(resource_id, ())
            if system_id is None or observation.system_id == system_id
            if parse_timestamp(observation.observed_at) <= parse_timestamp(cutoff)
            and parse_timestamp(self.capture_time_by_evidence.get(observation.evidence_id, observation.observed_at))
            <= parse_timestamp(cutoff)
        ]

    @staticmethod
    def related_resource_ids(observation: Observation) -> set[str]:
        try:
            payload = json.loads(observation.detail)
        except (json.JSONDecodeError, TypeError):
            payload = None
        relation_keys = {
            "source_resource_id", "account_resource_id", "origin_resource_id",
            "source_record_id", "parent_resource_id",
        }
        resource_pattern = re.compile(
            r"^(?:account|search|support|analytics|export|backup|data_flow|audit_record|tombstone|cache|email_delivery|marketing)_\d+$",
            re.IGNORECASE,
        )
        related: set[str] = set()

        def visit(value: Any) -> None:
            if isinstance(value, dict):
                for key, nested in value.items():
                    if key.casefold() in relation_keys and isinstance(nested, str):
                        if resource_pattern.fullmatch(nested):
                            related.add(nested)
                    else:
                        visit(nested)
            elif isinstance(value, list):
                for nested in value:
                    visit(nested)

        visit(payload)
        return related

    def observations_for_user(self, identifiers: Iterable[str], cutoff: str) -> list[Observation]:
        normalized = {normalize_identifier(item) for item in identifiers if item}
        cutoff_time = parse_timestamp(cutoff)
        result: dict[tuple[str, str, str, str], Observation] = {}
        for observation in self.observations:
            if not normalized.intersection(observation.identifiers):
                continue
            if parse_timestamp(observation.observed_at) > cutoff_time:
                continue
            captured_at = self.capture_time_by_evidence.get(
                observation.evidence_id, observation.observed_at
            )
            if parse_timestamp(captured_at) > cutoff_time:
                continue
            key = (
                observation.system_id, observation.resource_id,
                observation.category, observation.evidence_id,
                observation.observed_at, observation.state,
            )
            result[key] = observation
        return list(result.values())
