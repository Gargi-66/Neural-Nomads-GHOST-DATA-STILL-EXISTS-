from __future__ import annotations

import json
import re
import sqlite3
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Iterable


@dataclass(frozen=True)
class RetrievedChunk:
    text: str
    metadata: dict[str, str]


class AuditRetriever:
    def __init__(self, gold_db: Path | str, silver_db: Path | str):
        self.gold_db = Path(gold_db)
        self.silver_db = Path(silver_db)

    def _connect(self, path: Path) -> sqlite3.Connection:
        connection = sqlite3.connect(f"file:{path.resolve()}?mode=ro", uri=True)
        connection.row_factory = sqlite3.Row
        return connection

    @staticmethod
    def _parse_timestamp(value: str | None) -> datetime | None:
        if not value:
            return None
        try:
            return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        except ValueError:
            return None

    def retrieve(self, question: str, limit: int = 12) -> list[RetrievedChunk]:
        raw_case_ids = sorted(set(re.findall(r"(?i)\b(?:case_[a-z0-9_-]+|case\d+[a-z0-9_-]*)\b", question)))
        case_ids: set[str] = set()
        for raw in raw_case_ids:
            normalized = raw.lower().replace("-", "_")
            digits = re.search(r"(\d+)", normalized)
            if digits:
                number = digits.group(1)
                case_ids.add(normalized)
                case_ids.add("case_" + str(int(number)))
                case_ids.add("case_" + number.zfill(3))
        resource_ids = sorted(set(re.findall(r"(?i)\b(?:account|search|support|analytics|export|backup|data_flow|audit_record|tombstone|transaction|marketing)_[a-z0-9_-]+\b", question)))
        customer_ids = sorted(set(re.findall(r"(?i)\bcustomer_[a-z0-9_-]+\b|\buser_[a-z0-9_-]+\b|\bc\d{1,8}\b", question)))

        chunks: list[RetrievedChunk] = []
        gold = self._connect(self.gold_db)
        try:
            case_query = "SELECT * FROM customer_deletion_audit WHERE 1=1"
            params: list[str] = []
            conditions = []
            if case_ids:
                conditions.append("LOWER(case_id) IN (" + ",".join("?" for _ in case_ids) + ")")
                params.extend(case_ids)
            elif customer_ids:
                conditions.append("LOWER(customer_id) IN (" + ",".join("?" for _ in customer_ids) + ")")
                params.extend(customer_ids)
            if conditions:
                case_query += " AND " + " AND ".join(conditions)
            rows = list(gold.execute(case_query + " ORDER BY case_id LIMIT ?", (*params, limit)))

            for row in rows:
                text = json.dumps(dict(row), ensure_ascii=False, sort_keys=True)
                chunks.append(RetrievedChunk(text, {
                    "case_id": row["case_id"] or "",
                    "customer_id": row["customer_id"] or "",
                    "resource_id": "",
                    "evidence_id": row["evidence_references"] or "",
                    "system_id": "",
                    "resource_type": "",
                    "policy_id": "",
                    "source_layer": "gold",
                    "source_file": "gold/gold_database.db:customer_deletion_audit",
                    "timestamp": row["audit_cutoff"] or "",
                    "verification_status": "VERIFIED" if row["deletion_completion_status"] in {"VERIFIED", "PENDING"} else "UNVERIFIED",
                }))

            resource_query = "SELECT * FROM resource_audit WHERE 1=1"
            resource_params: list[str] = []
            resource_conditions = []
            if case_ids:
                resource_conditions.append("LOWER(case_id) IN (" + ",".join("?" for _ in case_ids) + ")")
                resource_params.extend(case_ids)
            if resource_ids:
                resource_conditions.append("LOWER(resource_id) IN (" + ",".join("?" for _ in resource_ids) + ")")
                resource_params.extend(resource_ids)
            if customer_ids:
                resource_conditions.append("LOWER(customer_id) IN (" + ",".join("?" for _ in customer_ids) + ")")
                resource_params.extend(customer_ids)
            if resource_conditions:
                resource_query += " AND " + " AND ".join(resource_conditions)
            resource_rows = list(gold.execute(resource_query + " ORDER BY case_id, resource_id LIMIT ?", (*resource_params, limit)))
            for row in resource_rows:
                chunks.append(RetrievedChunk(json.dumps(dict(row), ensure_ascii=False, sort_keys=True), {
                    "case_id": row["case_id"] or "",
                    "customer_id": row["customer_id"] or "",
                    "resource_id": row["resource_id"] or "",
                    "evidence_id": row["evidence_references"] or "",
                    "system_id": row["system_id"] or "",
                    "resource_type": row["resource_type"] or "",
                    "policy_id": "",
                    "source_layer": "gold",
                    "source_file": "gold/gold_database.db:resource_audit",
                    "timestamp": row["audit_cutoff"] or "",
                    "verification_status": "VERIFIED" if row["verified_state"] in {"DELETED", "ANONYMIZED", "ARCHIVED", "RETAINED"} else "UNVERIFIED",
                }))
        finally:
            gold.close()

        silver = self._connect(self.silver_db)
        try:
            evidence_query = "SELECT * FROM fact_evidence WHERE 1=1"
            evidence_params: list[str] = []
            evidence_conditions: list[str] = []
            evidence_case_map: dict[str, dict[str, str | None]] = {}
            evidence_query_ids: set[str] = set()
            if case_ids or customer_ids:
                for row in silver.execute("SELECT * FROM fact_case_data_link"):
                    link = dict(row)
                    evidence_case_map[row["evidence_id"]] = link
                    if case_ids and link["case_id"] and link["case_id"].lower() in {value.lower() for value in case_ids}:
                        if link["evidence_id"]:
                            evidence_query_ids.add(link["evidence_id"])
                    if customer_ids and link["customer_id"] and link["customer_id"].lower() in {value.lower() for value in customer_ids}:
                        if link["evidence_id"]:
                            evidence_query_ids.add(link["evidence_id"])
            if resource_ids:
                normalized = {value.lower() for value in resource_ids}
                evidence_conditions.append("LOWER(resource_id) IN (" + ",".join("?" for _ in normalized) + ")")
                evidence_params.extend(sorted(normalized))
            if case_ids or customer_ids:
                if evidence_query_ids:
                    normalized = sorted(evidence_query_ids)
                    evidence_conditions.append("LOWER(evidence_id) IN (" + ",".join("?" for _ in normalized) + ")")
                    evidence_params.extend(value.lower() for value in normalized)
                else:
                    evidence_conditions.append("1=0")
            if evidence_conditions:
                evidence_query += " AND " + " AND ".join(evidence_conditions)
            evidence_rows = list(silver.execute(evidence_query + " ORDER BY evidence_id LIMIT ?", (*evidence_params, limit)))

            for row in evidence_rows:
                link = evidence_case_map.get(row["evidence_id"])
                if case_ids and link and link["case_id"] and link["case_id"].lower() not in {value.lower() for value in case_ids}:
                    continue
                if customer_ids and link and link["customer_id"] and link["customer_id"] .lower() not in {value.lower() for value in customer_ids}:
                    continue
                chunks.append(RetrievedChunk(json.dumps(dict(row), ensure_ascii=False, sort_keys=True), {
                    "case_id": link["case_id"] if link else "",
                    "customer_id": link["customer_id"] if link else "",
                    "resource_id": row["resource_id"] or "",
                    "evidence_id": row["evidence_id"] or "",
                    "system_id": "",
                    "resource_type": "",
                    "policy_id": "",
                    "source_layer": "silver",
                    "source_file": "data/silver/silver_database.db:fact_evidence",
                    "timestamp": row["captured_at"] or "",
                    "verification_status": row["resource_link_status"] or "UNVERIFIED",
                }))

            policies = list(silver.execute("SELECT * FROM dim_deletion_policy ORDER BY policy_id"))
            resource_types = {match.lower() for match in re.findall(r"(?i)profile|transaction|analytics|backup|order|support|search|export|marketing|legal", question)}
            for row in policies:
                if resource_types:
                    type_tokens = row["resource_type"] or ""
                    if not any(token in type_tokens.lower() for token in resource_types):
                        continue
                chunks.append(RetrievedChunk(json.dumps(dict(row), ensure_ascii=False, sort_keys=True), {
                    "case_id": "",
                    "customer_id": "",
                    "resource_id": "",
                    "evidence_id": "",
                    "system_id": "",
                    "resource_type": row["resource_type"] or "",
                    "policy_id": row["policy_id"] or "",
                    "source_layer": "silver",
                    "source_file": "data/silver/silver_database.db:dim_deletion_policy",
                    "timestamp": "",
                    "verification_status": "POLICY_RECORD",
                }))
        finally:
            silver.close()

        unique: list[RetrievedChunk] = []
        seen: set[tuple[str, str]] = set()
        for chunk in chunks:
            key = (chunk.text, json.dumps(chunk.metadata, sort_keys=True))
            if key in seen:
                continue
            seen.add(key)
            unique.append(chunk)
        return unique[:limit]

    def format_context(self, chunks: Iterable[RetrievedChunk]) -> str:
        parts = ["## Retrieved evidence-grounded context"]
        for index, chunk in enumerate(chunks, start=1):
            parts.append(f"### Source {index}")
            parts.append(json.dumps(chunk.metadata, ensure_ascii=False, sort_keys=True))
            parts.append(chunk.text)
        if len(parts) == 1:
            return "Insufficient evidence: no matching Gold or Silver records were retrieved."
        return "\n".join(parts)
