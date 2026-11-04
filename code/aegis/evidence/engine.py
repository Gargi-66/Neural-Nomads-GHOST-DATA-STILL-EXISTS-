"""AEGIS 3.0 Evidence Discovery & Ingestion Engine.

Deterministically scans, indexes, and normalizes evidence across all 94 manifest
evidence files (logs, databases, records, json bundles, pdfs, txt handovers) and
system_activity.csv. Strictly enforces temporal cutoff at audit_at and maps
resources to canonical identities.
"""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

import pandas as pd
import pypdf

from aegis.policy.models import PolicyAction


class ObservedResource:
    """A resource whose state has been observed in an admissible evidence artifact."""

    def __init__(
        self,
        evidence_id: str,
        system_id: str,
        resource_id: str,
        data_category: str,
        state: str,
        identifiers: List[Any],
        captured_at: datetime,
        has_pii: bool = False,
        details: str = "",
    ):
        self.evidence_id = evidence_id
        self.system_id = system_id.strip().lower()
        self.resource_id = resource_id.strip()
        self.data_category = data_category.strip().upper()
        self.state = state.strip().upper()  # PRESENT, ABSENT, REDACTED, ANONYMIZED, ACTIVE, DISABLED, BLOCKED
        self.identifiers: Set[str] = {
            str(i).strip().lower() for i in identifiers if i is not None and pd.notna(i) and str(i).strip()
        }
        self.captured_at = captured_at
        self.has_pii = has_pii
        self.details = details

    def __repr__(self) -> str:
        return f"<Observed {self.system_id}:{self.resource_id} {self.state} pii={self.has_pii} ev={self.evidence_id}>"


class EvidenceIndex:
    """In-memory searchable index of all observed resources and activity flows."""

    def __init__(self, observations: List[ObservedResource], activity_df: pd.DataFrame):
        self.observations = observations
        self.activity_df = activity_df

        # Pre-build lookup map by identifier
        self._by_identifier: Dict[str, List[ObservedResource]] = {}
        for obs in observations:
            for ident in obs.identifiers:
                self._by_identifier.setdefault(ident.lower(), []).append(obs)

        # Pre-index system_activity linkages
        # "Data catalog linked <resource_id> to <email> and <user_id>"
        self.resource_linkages: Dict[str, Set[str]] = {}
        for _, act in activity_df.iterrows():
            det = str(act.get("details", ""))
            m = re.search(r"linked\s+([a-zA-Z0-9_]+).*?to\s+([^\s]+)\s+and\s+([a-zA-Z0-9_]+)", det)
            if m:
                r_id = m.group(1).strip()
                em = m.group(2).strip().lower()
                u_id = m.group(3).strip().lower()
                self.resource_linkages.setdefault(r_id, set()).update([em, u_id])

        # Link any observations matching these resource IDs
        for obs in self.observations:
            if obs.resource_id in self.resource_linkages:
                for link_id in self.resource_linkages[obs.resource_id]:
                    obs.identifiers.add(link_id)
                    self._by_identifier.setdefault(link_id, []).append(obs)

        # Global cross-artifact resource-to-user inheritance
        # (e.g. account_5684 is identified in snapshot bundle, then 404 in readback export)
        global_res_users: Dict[str, Set[str]] = {}
        for obs in self.observations:
            if obs.identifiers:
                global_res_users.setdefault(obs.resource_id, set()).update(obs.identifiers)

        for obs in self.observations:
            if obs.resource_id in global_res_users:
                new_ids = global_res_users[obs.resource_id] - obs.identifiers
                if new_ids:
                    obs.identifiers.update(new_ids)
                    for nid in new_ids:
                        self._by_identifier.setdefault(nid, []).append(obs)

    def find_resources_for_subject(
        self,
        subject_identifiers: Set[str],
        audit_at: datetime
    ) -> List[ObservedResource]:
        """Finds all observations for the subject captured strictly at or before audit_at."""
        clean_idents = {str(i).strip().lower() for i in subject_identifiers if i}
        matching_obs = []
        seen_res = set()

        for ident in clean_idents:
            for obs in self._by_identifier.get(ident, []):
                if obs.captured_at <= audit_at:
                    matching_obs.append(obs)

        # Also search resource linkages
        for r_id, link_idents in self.resource_linkages.items():
            if clean_idents.intersection(link_idents):
                for obs in self.observations:
                    if obs.resource_id == r_id and obs.captured_at <= audit_at:
                        matching_obs.append(obs)

        # De-duplicate: for each unique resource_id, take the latest observation before audit_at
        by_resource: Dict[str, ObservedResource] = {}
        # Sort chronologically so latest overwrites earlier
        matching_obs.sort(key=lambda x: x.captured_at)
        for obs in matching_obs:
            by_resource[obs.resource_id] = obs

        return list(by_resource.values())

    def discover_active_flows_for_subject(
        self,
        subject_identifiers: Set[str],
        audit_at: datetime
    ) -> List[str]:
        """Finds any active data flow / sync connector IDs for the subject at audit_at."""
        clean_idents = {str(i).strip().lower() for i in subject_identifiers if i}
        active_flows = set()

        # 1. From observations
        res_obs = self.find_resources_for_subject(subject_identifiers, audit_at)
        for r in res_obs:
            if r.data_category == "DATA_FLOW" or "data_flow" in r.resource_id or r.system_id == "integration_service":
                if r.state == "ACTIVE":
                    active_flows.add(r.resource_id)

        # 2. From system_activity.csv events before audit_at
        for _, act in self.activity_df.iterrows():
            t_str = str(act.get("event_time", ""))
            try:
                t_event = datetime.fromisoformat(t_str.replace("Z", "+00:00"))
                if t_event > audit_at:
                    continue
            except Exception:
                continue

            det = str(act.get("details", ""))
            r_id = str(act.get("resource_id", ""))
            et = str(act.get("event_type", ""))

            # Check if event concerns subject
            if any(ident in det.lower() for ident in clean_idents) or r_id in active_flows:
                if et in ("CHECK_DATA_FLOW", "SYNC_RECORD") and "remains enabled" in det:
                    m = re.search(r"data_flow_\d+", det)
                    flow_id = m.group(0) if m else r_id
                    active_flows.add(flow_id)
                elif et == "DISABLE_DATA_FLOW" and act.get("reported_result") == "SUCCESS":
                    m = re.search(r"data_flow_\d+", det)
                    flow_id = m.group(0) if m else r_id
                    active_flows.discard(flow_id)

        return sorted(list(active_flows))

    def discover_restore_risks_for_subject(
        self,
        subject_identifiers: Set[str],
        audit_at: datetime
    ) -> List[str]:
        """Finds any active backup restoration risks for the subject at audit_at."""
        clean_idents = {str(i).strip().lower() for i in subject_identifiers if i}
        restore_risks = set()

        # 1. From observations
        res_obs = self.find_resources_for_subject(subject_identifiers, audit_at)
        for r in res_obs:
            if r.data_category == "BACKUP_ARCHIVE" or "backup" in r.resource_id or r.system_id == "backup_service":
                if r.state == "ACTIVE":
                    restore_risks.add(r.resource_id)

        # 2. From system_activity.csv events before audit_at
        for _, act in self.activity_df.iterrows():
            t_str = str(act.get("event_time", ""))
            try:
                t_event = datetime.fromisoformat(t_str.replace("Z", "+00:00"))
                if t_event > audit_at:
                    continue
            except Exception:
                continue

            det = str(act.get("details", ""))
            r_id = str(act.get("resource_id", ""))
            et = str(act.get("event_type", ""))

            if any(ident in det.lower() for ident in clean_idents) or r_id in restore_risks:
                if et in ("CHECK_RESTORE_ACCESS", "RESTORE_BACKUP") and ("can still be restored" in det or "repopulated" in det):
                    m = re.search(r"backup_\d+", det)
                    bk_id = m.group(0) if m else r_id
                    restore_risks.add(bk_id)
                elif et == "BLOCK_RESTORE" and act.get("reported_result") == "SUCCESS":
                    m = re.search(r"backup_\d+", det)
                    bk_id = m.group(0) if m else r_id
                    restore_risks.discard(bk_id)

        return sorted(list(restore_risks))


def build_evidence_index(dataset_dir: Path) -> EvidenceIndex:
    """Parses all 94 evidence files and system_activity.csv to create the searchable index."""
    manifest_df = pd.read_csv(dataset_dir / "evidence_files.csv")
    activity_df = pd.read_csv(dataset_dir / "system_activity.csv")

    observations: List[ObservedResource] = []

    for _, row in manifest_df.iterrows():
        ev_id = row["file_id"]
        rel_path = row["file_path"]
        fpath = dataset_dir / rel_path
        if not fpath.exists():
            continue

        try:
            captured_at = datetime.fromisoformat(row["captured_at"].replace("Z", "+00:00"))
        except Exception:
            continue

        ext = fpath.suffix.lower()

        # 1. TXT Handover files
        if ext == ".txt":
            with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                for line in f:
                    parts = [p.strip() for p in line.split("|")]
                    if len(parts) >= 6:
                        sys_id = parts[1]
                        res_id = parts[2]
                        cat = parts[3]
                        raw_status = parts[4].upper()
                        ident = parts[5]

                        state = "PRESENT"
                        has_pii = False
                        if raw_status in ("NOT_FOUND", "ABSENT", "PURGED"):
                            state = "ABSENT"
                        elif raw_status in ("ANONYMIZED", "UNLINKED"):
                            state = "ANONYMIZED"
                        elif raw_status in ("REDACTED", "MASKED"):
                            state = "REDACTED"
                        elif raw_status in ("DISABLED", "STOPPED"):
                            state = "DISABLED"
                        elif raw_status in ("BLOCKED", "RESTRICTED"):
                            state = "BLOCKED"
                        elif raw_status in ("ACTIVE", "ENABLED"):
                            state = "ACTIVE"
                        elif raw_status in ("IDENTIFIABLE", "EXPOSED"):
                            state = "PRESENT"
                            has_pii = True

                        observations.append(ObservedResource(
                            ev_id, sys_id, res_id, cat, state, [ident], captured_at, has_pii, line.strip()
                        ))

        # 2. JSON Collections & Snapshots
        elif ext == ".json":
            try:
                with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                    data = json.load(f)

                if isinstance(data, dict) and "service_exports" in data:
                    exports = data["service_exports"]
                    for sys_id, content in exports.items():
                        if isinstance(content, dict):
                            for subkey, items in content.items():
                                if isinstance(items, list):
                                    for item in items:
                                        res_id = item.get("resource_id") or item.get("id") or item.get("connector_id")
                                        if not res_id:
                                            continue
                                        raw_st = str(item.get("status") or item.get("result") or "").upper()
                                        idents = [
                                            item.get("customer_reference"),
                                            item.get("subject_reference"),
                                            item.get("lookup_key"),
                                            item.get("email"),
                                            item.get("owner_email"),
                                            item.get("phone"),
                                        ]
                                        has_pii = (raw_st == "IDENTIFIABLE")

                                        if item.get("status_code") == 404 or item.get("profile") is None or raw_st in ("NOT_FOUND", "ABSENT", "404"):
                                            st = "ABSENT"
                                        elif raw_st in ("ANONYMIZED", "UNLINKED"):
                                            st = "ANONYMIZED"
                                        elif raw_st in ("REDACTED", "MASKED"):
                                            st = "REDACTED"
                                        elif raw_st in ("DISABLED", "STOPPED") or item.get("enabled") is False:
                                            st = "DISABLED"
                                        elif raw_st in ("BLOCKED", "RESTRICTED") or item.get("restore_allowed") is False:
                                            st = "BLOCKED"
                                        elif raw_st in ("ACTIVE", "ENABLED") or item.get("enabled") is True:
                                            st = "ACTIVE"
                                        elif item.get("requester_email") is None and sys_id == "support_platform":
                                            st = "REDACTED"
                                        else:
                                            st = "PRESENT"

                                        cat = "USER_PROFILE"
                                        if "search" in sys_id: cat = "SEARCH_INDEX_ENTRY"
                                        elif "analytics" in sys_id: cat = "ANALYTICS_PROFILE"
                                        elif "support" in sys_id: cat = "SUPPORT_MESSAGE"
                                        elif "integration" in sys_id: cat = "DATA_FLOW"
                                        elif "backup" in sys_id: cat = "BACKUP_ARCHIVE"
                                        elif "security" in sys_id: cat = "SECURITY_AUDIT_LOG"
                                        elif "export" in sys_id: cat = "USER_EXPORT"
                                        elif "identity" in sys_id: cat = "ACCOUNT_TOMBSTONE"

                                        observations.append(ObservedResource(
                                            ev_id, sys_id, res_id, cat, st, idents, captured_at, has_pii
                                        ))

                elif isinstance(data, dict) and "snapshots" in data:
                    for snap in data["snapshots"]:
                        sys_id = snap.get("data_store", "account_service")
                        cat = "USER_PROFILE"
                        if "search" in sys_id: cat = "SEARCH_INDEX_ENTRY"
                        elif "analytics" in sys_id: cat = "ANALYTICS_PROFILE"
                        elif "support" in sys_id: cat = "SUPPORT_MESSAGE"
                        elif "integration" in sys_id: cat = "DATA_FLOW"
                        elif "backup" in sys_id: cat = "BACKUP_ARCHIVE"
                        elif "security" in sys_id: cat = "SECURITY_AUDIT_LOG"
                        elif "identity" in sys_id: cat = "ACCOUNT_TOMBSTONE"

                        snap_cap = captured_at
                        if "captured_at" in snap:
                            try:
                                snap_cap = datetime.fromisoformat(str(snap["captured_at"]).replace("Z", "+00:00"))
                            except Exception:
                                pass

                        for rec in snap.get("records", []):
                            res_id = rec.get("resource_id")
                            idents = [
                                rec.get("customer_reference"),
                                rec.get("subject_reference"),
                                rec.get("subject_selector"),
                                rec.get("email"),
                                rec.get("phone"),
                                rec.get("full_name")
                            ]
                            
                            st = "PRESENT"
                            has_pii = False
                            if sys_id == "backup_service":
                                st = "BLOCKED" if rec.get("restore_allowed") is False else "ACTIVE"
                            elif sys_id == "integration_service":
                                st = "DISABLED" if rec.get("enabled") is False else "ACTIVE"
                            elif sys_id == "support_platform":
                                st = "REDACTED" if "[REDACTED]" in str(rec.get("message_text", "")) else "PRESENT"
                            elif sys_id == "identity_service":
                                has_pii = bool(rec.get("email") or rec.get("phone") or rec.get("name") or rec.get("email_hash"))
                                st = "PRESENT" if has_pii else "REDACTED"
                            elif sys_id == "account_service" and rec.get("account_status") in ("DELETED", "INACTIVE"):
                                st = "ABSENT"

                            observations.append(ObservedResource(
                                ev_id, sys_id, res_id, cat, st, idents, snap_cap, has_pii
                            ))

                elif isinstance(data, dict) and "records" in data:
                    for rec in data["records"]:
                        res_id = rec.get("resource_id")
                        idents = [rec.get("customer_reference"), rec.get("owner_email"), rec.get("email"), rec.get("phone")]
                        st = "PRESENT" if rec.get("download_available", True) else "ABSENT"
                        observations.append(ObservedResource(
                            ev_id, "export_service", res_id, "USER_EXPORT", st, idents, captured_at, False
                        ))

                elif isinstance(data, dict) and "connectors" in data:
                    for conn in data["connectors"]:
                        res_id = conn.get("connector_id") or conn.get("resource_id")
                        st = "DISABLED" if conn.get("status") == "DISABLED" else "ACTIVE"
                        idents = [conn.get("customer_reference"), conn.get("customer_email")]
                        observations.append(ObservedResource(
                            ev_id, "integration_service", res_id, "DATA_FLOW", st, idents, captured_at, False
                        ))

            except Exception:
                pass

        # 3. SQL Point-in-Time Databases
        elif ext == ".sql":
            with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            for line in content.splitlines():
                line = line.strip()
                if not line.startswith("INSERT INTO"):
                    continue
                m_json = re.search(r"VALUES\s*\(\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'(\{.*?\})'\s*,\s*'([^']+)'\s*\)", line)
                if m_json:
                    res_id = m_json.group(1)
                    sys_id = m_json.group(2)
                    collection = m_json.group(3)
                    json_str = m_json.group(4)
                    try:
                        rec = json.loads(json_str)
                        idents = [rec.get("customer_reference"), rec.get("user_id"), rec.get("email"), rec.get("phone")]
                        doc = rec.get("document", {})
                        if isinstance(doc, dict):
                            idents.extend([doc.get("email"), doc.get("customer_reference")])
                        
                        cat = "USER_PROFILE"
                        if "search" in sys_id or "search" in collection: cat = "SEARCH_INDEX_ENTRY"
                        elif "security" in sys_id: cat = "SECURITY_AUDIT_LOG"
                        elif "analytics" in sys_id: cat = "ANALYTICS_PROFILE"
                        elif "support" in sys_id: cat = "SUPPORT_MESSAGE"

                        observations.append(ObservedResource(
                            ev_id, sys_id, res_id, cat, "PRESENT", idents, captured_at, False
                        ))
                    except Exception:
                        pass
                else:
                    m_std = re.search(r"VALUES\s*\((.*?)\)", line)
                    if m_std:
                        vals = [v.strip().strip("'\"") for v in m_std.group(1).split(",")]
                        if len(vals) >= 4:
                            res_id = vals[0]
                            uid = vals[1]
                            name = vals[2]
                            email = vals[3]
                            phone = vals[4] if len(vals) > 4 else None
                            sys_id = "account_service"
                            cat = "USER_PROFILE"
                            if "search" in line.lower():
                                sys_id = "search_service"
                                cat = "SEARCH_INDEX_ENTRY"
                            observations.append(ObservedResource(
                                ev_id, sys_id, res_id, cat, "PRESENT", [uid, name, email, phone], captured_at, False
                            ))

        # 4. Observability and Trace Logs
        elif ext == ".log":
            with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                lines = f.readlines()

            # First pass: map trace_ids to user identifiers and resources
            trace_idents: Dict[str, Set[str]] = {}
            for line in lines:
                tr_m = re.search(r"trace_id=([a-zA-Z0-9_\-]+)", line)
                if tr_m:
                    tr = tr_m.group(1)
                    for p in [r"lookup_key=([^\s]+)", r"subject_key=([^\s]+)", r"subject_ref=([^\s]+)", r"correlation_key=([^\s]+)", r"matched_value=\"?([^\s\"]+)\"?", r"email=([^\s]+)", r"customer_reference=([^\s]+)"]:
                        m = re.search(p, line)
                        if m:
                            clean_v = m.group(1).strip().strip('\'"')
                            if clean_v.lower() != "null":
                                trace_idents.setdefault(tr, set()).add(clean_v.lower())

            # Second pass: extract observations with complete trace context
            for line in lines:
                if "resource_id=" in line:
                    res_match = re.search(r"resource_id=([a-zA-Z0-9_]+)", line)
                    svc_match = re.search(r"service=([a-zA-Z0-9_]+)", line)
                    tr_match = re.search(r"trace_id=([a-zA-Z0-9_\-]+)", line)
                    if res_match:
                        res_id = res_match.group(1)
                        raw_svc = svc_match.group(1) if svc_match else "account_service"
                        sys_id = raw_svc
                        if "account" in raw_svc: sys_id = "account_service"
                        elif "search" in raw_svc: sys_id = "search_service"
                        elif "support" in raw_svc: sys_id = "support_platform"
                        elif "analytics" in raw_svc: sys_id = "analytics_platform"
                        elif "integration" in raw_svc: sys_id = "integration_service"
                        elif "backup" in raw_svc: sys_id = "backup_service"
                        elif "security" in raw_svc: sys_id = "security_service"
                        elif "export" in raw_svc: sys_id = "export_service"
                        elif "identity" in raw_svc: sys_id = "identity_service"

                        idents = set()
                        if tr_match and tr_match.group(1) in trace_idents:
                            idents.update(trace_idents[tr_match.group(1)])

                        for p in [r"lookup_key=([^\s]+)", r"subject_key=([^\s]+)", r"subject_ref=([^\s]+)", r"correlation_key=([^\s]+)", r"matched_value=\"?([^\s\"]+)\"?", r"email=([^\s]+)", r"customer_reference=([^\s]+)"]:
                            m = re.search(p, line)
                            if m and m.group(1).lower() != "null":
                                idents.add(m.group(1).strip().lower())

                        has_pii = ("pii_scan" in line or "IDENTIFIABLE" in line or "direct_identifiers=1" in line or "marker_found=false" in line)
                        if "rows=0" in line or "http_status=404" in line or "NOT_FOUND" in line:
                            st = "ABSENT"
                        elif "enabled=false" in line or "stopped" in line or "enabled=False" in line:
                            st = "DISABLED"
                        elif "restore_allowed=false" in line or "restore_allowed=False" in line:
                            st = "BLOCKED"
                        elif "deletion_block=false" in line or "eligible=true" in line:
                            st = "ACTIVE"
                        elif "enabled=true" in line or "enabled=True" in line:
                            st = "ACTIVE"
                        elif "restore_allowed=true" in line or "restore_allowed=True" in line:
                            st = "ACTIVE"
                        elif "customer_reference=null email=null" in line or "ANONYMIZED" in line:
                            st = "ANONYMIZED"
                        elif "REDACTED" in line:
                            st = "REDACTED"
                        elif "rows=1" in line or "result=hit" in line:
                            st = "PRESENT"
                        else:
                            st = "PRESENT"

                        cat = "USER_PROFILE"
                        if "search" in sys_id: cat = "SEARCH_INDEX_ENTRY"
                        elif "analytics" in sys_id: cat = "ANALYTICS_PROFILE"
                        elif "support" in sys_id: cat = "SUPPORT_MESSAGE"
                        elif "integration" in sys_id: cat = "DATA_FLOW"
                        elif "backup" in sys_id: cat = "BACKUP_ARCHIVE"
                        elif "security" in sys_id: cat = "SECURITY_AUDIT_LOG"
                        elif "export" in sys_id: cat = "USER_EXPORT"
                        elif "identity" in sys_id: cat = "ACCOUNT_TOMBSTONE"

                        observations.append(ObservedResource(
                            ev_id, sys_id, res_id, cat, st, list(idents), captured_at, has_pii, line.strip()
                        ))

        # 5. Documents (PDFs)
        elif ext == ".pdf":
            try:
                reader = pypdf.PdfReader(fpath)
                full_txt = ""
                for p in reader.pages:
                    full_txt += p.extract_text() + "\n"
                res_m = re.search(r"(support_\d+|export_\d+|account_\d+)", full_txt)
                if res_m:
                    res_id = res_m.group(1)
                    emails = re.findall(r"[\w\.-]+@[\w\.-]+\.\w+", full_txt)
                    phones = re.findall(r"\+\d[\d\s-]+\d", full_txt)
                    observations.append(ObservedResource(
                        ev_id, "support_platform", res_id, "SUPPORT_MESSAGE", "PRESENT", emails + phones, captured_at, False
                    ))
            except Exception:
                pass

    return EvidenceIndex(observations, activity_df)
