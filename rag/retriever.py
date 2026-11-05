from __future__ import annotations

import json
import re
import sqlite3
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Iterable, Optional


@dataclass(frozen=True)
class RetrievedChunk:
    text: str
    metadata: dict[str, str]


class AuditRetriever:
    """Provenance-grounded RAG retriever across Medallion Gold and Silver warehouses.
    
    Adherence rules:
    - R01: Multiformat ID normalization (CASE001, case_01, case_1, CUST001, user_1).
    - R02: Activity log retrieval (fact_activity).
    - R03: Policy rule retrieval (dim_deletion_policy).
    - R04 & R05: Case-specific evidence relationship & strict audit cutoff filtering.
    - R08: Source reference preservation.
    - R09: Strict cross-customer isolation.
    - R10: Graceful insufficient evidence handling.
    """

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
        except (ValueError, TypeError):
            return None

    @classmethod
    def normalize_case_ids(cls, text: str) -> set[str]:
        """R01: Matches CASE001, case_100, case-100, case100."""
        matches = re.findall(r"(?i)\b(?:case[_\-\s]*(\d+))\b", text)
        case_ids = set()
        for num in matches:
            n = int(num)
            case_ids.add(f"case_{n}")
            case_ids.add(f"case_{num.zfill(3)}")
        return case_ids

    @classmethod
    def normalize_customer_ids(cls, text: str) -> set[str]:
        """R01: Matches CUST001, customer_1, user_98, user-98, user98."""
        matches = re.findall(r"(?i)\b(?:customer|user|cust)[_\-\s]*(\d+)\b", text)
        cust_ids = set()
        for num in matches:
            n = int(num)
            cust_ids.add(f"user_{n}")
            cust_ids.add(f"user_{num.zfill(3)}")
            cust_ids.add(f"customer_{n}")
        return cust_ids

    @classmethod
    def extract_resource_ids(cls, text: str) -> set[str]:
        """R01: Matches all infrastructure resource IDs."""
        matches = re.findall(
            r"(?i)\b(?:account|search|support|analytics|export|backup|data_flow|audit_record|tombstone|transaction|marketing)[_\-\s]*[a-z0-9_-]+\b",
            text
        )
        return {m.lower().replace("-", "_").replace(" ", "_") for m in matches}

    def retrieve(self, question: str, limit: int = 15) -> list[RetrievedChunk]:
        case_ids = self.normalize_case_ids(question)
        customer_ids = self.normalize_customer_ids(question)
        resource_ids = self.extract_resource_ids(question)

        chunks: list[RetrievedChunk] = []
        target_cutoff: Optional[datetime] = None
        target_case_id: Optional[str] = None
        target_customer_id: Optional[str] = None

        gold = self._connect(self.gold_db)
        try:
            # 1. Retrieve Case Level Audit from Gold
            case_query = "SELECT * FROM customer_deletion_audit WHERE 1=1"
            params: list[str] = []
            conditions = []
            if case_ids:
                conditions.append("LOWER(case_id) IN (" + ",".join("?" for _ in case_ids) + ")")
                params.extend([c.lower() for c in case_ids])
            elif customer_ids:
                conditions.append("LOWER(customer_id) IN (" + ",".join("?" for _ in customer_ids) + ")")
                params.extend([c.lower() for c in customer_ids])

            if conditions:
                case_query += " AND (" + " OR ".join(conditions) + ")"
            
            case_rows = list(gold.execute(case_query + " ORDER BY case_id LIMIT ?", (*params, limit)))

            # If user explicitly searched for specific case ID(s) and none were found in Gold:
            if case_ids and not case_rows:
                return []

            for row in case_rows:
                target_case_id = row["case_id"]
                target_customer_id = row["customer_id"]
                target_cutoff = self._parse_timestamp(row["audit_cutoff"])
                
                text_payload = json.dumps(dict(row), ensure_ascii=False, sort_keys=True)
                chunks.append(RetrievedChunk(text_payload, {
                    "case_id": row["case_id"] or "",
                    "customer_id": row["customer_id"] or "",
                    "resource_id": "",
                    "evidence_id": row["evidence_references"] or "",
                    "system_id": "",
                    "resource_type": "CASE_AUDIT",
                    "policy_id": "",
                    "source_layer": "gold",
                    "source_file": "gold/gold_database.db:customer_deletion_audit",
                    "timestamp": row["audit_cutoff"] or "",
                    "verification_status": row["deletion_completion_status"] or "UNVERIFIED",
                }))

            # 2. Retrieve Resource Level Audit from Gold (R09: Enforce customer/case isolation)
            res_query = "SELECT * FROM resource_audit WHERE 1=1"
            res_params: list[str] = []
            res_conditions = []
            
            if target_case_id:
                res_conditions.append("LOWER(case_id) = ?")
                res_params.append(target_case_id.lower())
            elif case_ids:
                res_conditions.append("LOWER(case_id) IN (" + ",".join("?" for _ in case_ids) + ")")
                res_params.extend([c.lower() for c in case_ids])
            elif target_customer_id:
                res_conditions.append("LOWER(customer_id) = ?")
                res_params.append(target_customer_id.lower())
            elif customer_ids:
                res_conditions.append("LOWER(customer_id) IN (" + ",".join("?" for _ in customer_ids) + ")")
                res_params.extend([c.lower() for c in customer_ids])

            if resource_ids:
                res_conditions.append("LOWER(resource_id) IN (" + ",".join("?" for _ in resource_ids) + ")")
                res_params.extend([r.lower() for r in resource_ids])

            if res_conditions:
                res_query += " AND " + " AND ".join(res_conditions)
            
            res_rows = list(gold.execute(res_query + " ORDER BY case_id, resource_id LIMIT ?", (*res_params, limit)))
            for row in res_rows:
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
                    "verification_status": row["verified_state"] or "UNVERIFIED",
                }))
        finally:
            gold.close()

        silver = self._connect(self.silver_db)
        try:
            # 3. Retrieve Evidence from Silver (R04 & R05: Cutoff filtered & scoped via fact_case_data_link)
            admissible_evidence_ids = set()
            if target_case_id or case_ids:
                check_cases = {target_case_id.lower()} if target_case_id else {c.lower() for c in case_ids}
                placeholders = ",".join("?" for _ in check_cases)
                links = silver.execute(
                    f"SELECT * FROM fact_case_data_link WHERE LOWER(case_id) IN ({placeholders})",
                    list(check_cases)
                ).fetchall()
                for link in links:
                    if link["evidence_id"]:
                        admissible_evidence_ids.add(link["evidence_id"])

            if admissible_evidence_ids:
                ev_placeholders = ",".join("?" for _ in admissible_evidence_ids)
                ev_rows = silver.execute(
                    f"SELECT * FROM fact_evidence WHERE evidence_id IN ({ev_placeholders})",
                    list(admissible_evidence_ids)
                ).fetchall()

                for row in ev_rows:
                    cap_time = self._parse_timestamp(row["captured_at"])
                    # R05: Strictly exclude evidence captured after cutoff
                    if target_cutoff and cap_time and cap_time > target_cutoff:
                        continue
                    
                    chunks.append(RetrievedChunk(json.dumps(dict(row), ensure_ascii=False, sort_keys=True), {
                        "case_id": target_case_id or "",
                        "customer_id": target_customer_id or "",
                        "resource_id": row["resource_id"] or "",
                        "evidence_id": row["evidence_id"] or "",
                        "system_id": "",
                        "resource_type": "EVIDENCE_SNAPSHOT",
                        "policy_id": "",
                        "source_layer": "silver",
                        "source_file": "data/silver/silver_database.db:fact_evidence",
                        "timestamp": row["captured_at"] or "",
                        "verification_status": row["resource_link_status"] or "UNVERIFIED",
                    }))

            # 4. R02: Retrieve Activity Logs from Silver (fact_activity)
            if target_case_id or case_ids or target_customer_id or customer_ids:
                # Find activity IDs linked in fact_case_data_link
                act_ids = set()
                if target_case_id or case_ids:
                    check_cases = {target_case_id.lower()} if target_case_id else {c.lower() for c in case_ids}
                    act_links = silver.execute(
                        f"SELECT DISTINCT activity_id FROM fact_case_data_link WHERE LOWER(case_id) IN ({','.join('?' for _ in check_cases)}) AND activity_id IS NOT NULL",
                        list(check_cases)
                    ).fetchall()
                    for al in act_links:
                        act_ids.add(al["activity_id"])
                
                if act_ids:
                    act_placeholders = ",".join("?" for _ in act_ids)
                    act_rows = silver.execute(
                        f"SELECT * FROM fact_activity WHERE activity_id IN ({act_placeholders})",
                        list(act_ids)
                    ).fetchall()
                    for a_row in act_rows:
                        act_time = self._parse_timestamp(a_row["timestamp"])
                        if target_cutoff and act_time and act_time > target_cutoff:
                            continue
                        chunks.append(RetrievedChunk(json.dumps(dict(a_row), ensure_ascii=False, sort_keys=True), {
                            "case_id": target_case_id or "",
                            "customer_id": target_customer_id or "",
                            "resource_id": a_row["resource_id"] or "",
                            "evidence_id": "",
                            "system_id": a_row["system_id"] or "",
                            "resource_type": "ACTIVITY_LOG",
                            "policy_id": "",
                            "source_layer": "silver",
                            "source_file": "data/silver/silver_database.db:fact_activity",
                            "timestamp": a_row["timestamp"] or "",
                            "verification_status": a_row["result"] or "UNKNOWN",
                        }))

            # 5. R03: Retrieve Policy Rules from Silver (dim_deletion_policy)
            policies = list(silver.execute("SELECT * FROM dim_deletion_policy ORDER BY policy_id"))
            # Match policies relevant to question or retrieved resources
            retrieved_types = {c.metadata.get("resource_type", "").lower() for c in chunks if c.metadata.get("resource_type")}
            q_types = {m.lower() for m in re.findall(r"(?i)profile|transaction|analytics|backup|order|support|search|export|marketing|legal|log", question)}
            target_types = retrieved_types | q_types

            for pol in policies:
                pol_type = (pol["resource_type"] or "").lower()
                if target_types and not any(t in pol_type for t in target_types):
                    continue
                chunks.append(RetrievedChunk(json.dumps(dict(pol), ensure_ascii=False, sort_keys=True), {
                    "case_id": "",
                    "customer_id": "",
                    "resource_id": "",
                    "evidence_id": "",
                    "system_id": "",
                    "resource_type": pol["resource_type"] or "",
                    "policy_id": pol["policy_id"] or "",
                    "source_layer": "silver",
                    "source_file": "data/silver/silver_database.db:dim_deletion_policy",
                    "timestamp": "",
                    "verification_status": "POLICY_RECORD",
                }))
        finally:
            silver.close()

        # Deduplicate while preserving order
        unique: list[RetrievedChunk] = []
        seen: set[str] = set()
        for chunk in chunks:
            chunk_key = chunk.text + json.dumps(chunk.metadata, sort_keys=True)
            if chunk_key in seen:
                continue
            seen.add(chunk_key)
            unique.append(chunk)

        return unique[:limit]

    def format_context(self, chunks: Iterable[RetrievedChunk]) -> str:
        chunk_list = list(chunks)
        if not chunk_list:
            return "Insufficient evidence: no matching Gold or Silver records were retrieved."
        
        parts = ["## Retrieved Evidence-Grounded Context (Medallion Provenance)"]
        for index, chunk in enumerate(chunk_list, start=1):
            parts.append(f"### Source {index} [{chunk.metadata.get('source_layer', 'unknown').upper()}]")
            parts.append(f"Metadata: {json.dumps(chunk.metadata, ensure_ascii=False)}")
            parts.append(f"Record: {chunk.text}")
        return "\n\n".join(parts)
