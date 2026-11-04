import json
import re
from collections import defaultdict
from datetime import datetime
from typing import Any

from evidence import EvidenceStore, Observation
from identity import IdentityIndex, parse_timestamp
from intent import authorizes_deletion


_OPERATION_ORDER = {
    "REPORT_REMAINING_RECORD": 0,
    "REPORT_EXPOSED_PII": 1,
    "REPORT_ACTIVE_DATA_FLOW": 2,
    "REPORT_RESTORE_RISK": 3,
    "DISABLE_DATA_FLOW": 0,
    "BLOCK_RESTORE": 1,
    "DELETE_RECORD": 2,
    "REDACT_RECORD": 3,
    "ANONYMIZE_RECORD": 4,
    "VERIFY_RECORD_ABSENT": 0,
    "VERIFY_RECORD_PRESENT": 1,
    "VERIFY_RECORD_REDACTED": 2,
    "VERIFY_RECORD_ANONYMIZED": 3,
    "VERIFY_DATA_FLOW_DISABLED": 4,
    "VERIFY_RESTORE_BLOCKED": 5,
}


def _record_data(observation: Observation) -> dict[str, Any]:
    try:
        value = json.loads(observation.detail)
    except (json.JSONDecodeError, TypeError):
        return {}
    return value if isinstance(value, dict) else {}


def _security_record_is_retained(observation: Observation, cutoff: str) -> bool:
    data = _record_data(observation)
    retention = data.get("retention_until")
    if not retention:
        match = re.search(r"retention_until[=:]([\w:.+-]+)", observation.detail)
        retention = match.group(1).strip('"\'') if match else None
    if not retention:
        return True
    try:
        return parse_timestamp(str(retention)) > parse_timestamp(cutoff)
    except ValueError:
        return True


def _required_treatment(
    observation: Observation, cutoff: str, rules: dict[str, str],
) -> tuple[str | None, str | None, str | None]:
    category = observation.category
    state = observation.state
    required_action = rules.get(category)
    if required_action == "DELETE":
        if state in {"PRESENT", "IDENTIFIABLE"}:
            return "REPORT_REMAINING_RECORD", "DELETE_RECORD", "VERIFY_RECORD_ABSENT"
        if state == "ABSENT":
            return None, None, "VERIFY_RECORD_ABSENT"
    elif required_action == "REDACT":
        if state in {"IDENTIFIABLE", "PRESENT"}:
            return "REPORT_EXPOSED_PII", "REDACT_RECORD", "VERIFY_RECORD_REDACTED"
        if state == "REDACTED":
            return None, None, "VERIFY_RECORD_REDACTED"
    elif required_action == "ANONYMIZE":
        if state in {"IDENTIFIABLE", "PRESENT"}:
            return "REPORT_EXPOSED_PII", "ANONYMIZE_RECORD", "VERIFY_RECORD_ANONYMIZED"
        if state == "ANONYMIZED":
            return None, None, "VERIFY_RECORD_ANONYMIZED"
    elif required_action == "RETAIN" and category == "SECURITY_AUDIT_LOG":
        if _security_record_is_retained(observation, cutoff):
            return None, None, "VERIFY_RECORD_PRESENT"

    if category in {
        "USER_PROFILE", "SECONDARY_IDENTIFIER", "SEARCH_INDEX_ENTRY", "CACHE_ENTRY",
        "SUPPORT_ATTACHMENT", "USER_EXPORT", "MARKETING_PROFILE",
    }:
        if state in {"PRESENT", "IDENTIFIABLE"}:
            return "REPORT_REMAINING_RECORD", "DELETE_RECORD", "VERIFY_RECORD_ABSENT"
        if state == "ABSENT":
            return None, None, "VERIFY_RECORD_ABSENT"
    elif category == "SUPPORT_MESSAGE":
        if state in {"IDENTIFIABLE", "PRESENT"}:
            return "REPORT_EXPOSED_PII", "REDACT_RECORD", "VERIFY_RECORD_REDACTED"
        if state == "REDACTED":
            return None, None, "VERIFY_RECORD_REDACTED"
    elif category in {"ANALYTICS_PROFILE", "PRODUCT_TELEMETRY"}:
        if state in {"IDENTIFIABLE", "PRESENT"}:
            return "REPORT_EXPOSED_PII", "ANONYMIZE_RECORD", "VERIFY_RECORD_ANONYMIZED"
        if state == "ANONYMIZED":
            return None, None, "VERIFY_RECORD_ANONYMIZED"
    elif category == "EMAIL_DELIVERY_LOG":
        if state in {"IDENTIFIABLE", "PRESENT"}:
            return "REPORT_EXPOSED_PII", "REDACT_RECORD", "VERIFY_RECORD_REDACTED"
        if state == "REDACTED":
            return None, None, "VERIFY_RECORD_REDACTED"
    elif category == "ACCOUNT_TOMBSTONE":
        if state in {"IDENTIFIABLE", "PRESENT"}:
            return "REPORT_EXPOSED_PII", "REDACT_RECORD", "VERIFY_RECORD_REDACTED"
        if state == "REDACTED":
            return None, None, "VERIFY_RECORD_REDACTED"
    elif category == "SECURITY_AUDIT_LOG":
        if _security_record_is_retained(observation, cutoff):
            return None, None, "VERIFY_RECORD_PRESENT"
    elif category == "LEGAL_HOLD_RECORD":
        return None, None, "VERIFY_RECORD_PRESENT"
    elif category == "BACKUP_ARCHIVE":
        if state in {"ACTIVE", "PRESENT", "IDENTIFIABLE"}:
            return "REPORT_RESTORE_RISK", "BLOCK_RESTORE", "VERIFY_RESTORE_BLOCKED"
        if state in {"BLOCKED", "DISABLED"}:
            return None, None, "VERIFY_RESTORE_BLOCKED"
    elif category == "DATA_FLOW":
        if state in {"ACTIVE", "PRESENT", "IDENTIFIABLE"}:
            return "REPORT_ACTIVE_DATA_FLOW", "DISABLE_DATA_FLOW", "VERIFY_DATA_FLOW_DISABLED"
        if state in {"DISABLED", "BLOCKED"}:
            return None, None, "VERIFY_DATA_FLOW_DISABLED"
    return None, None, None


def _step(
    phase: str, system_id: str, resource_id: str, operation: str,
    state: str, evidence_id: str,
) -> dict[str, Any]:
    return {
        "step_no": 0,
        "phase": phase,
        "system_id": system_id,
        "resource_id": resource_id,
        "operation": operation,
        "state": state,
        "evidence_id": evidence_id,
    }


class AuditPlanner:
    def __init__(
        self,
        identity_index: IdentityIndex,
        evidence_store: EvidenceStore,
        policy_rows: list[dict[str, str]],
    ) -> None:
        self.identity_index = identity_index
        self.evidence_store = evidence_store
        self.rules = {row["data_category"]: row["required_action"] for row in policy_rows}

    def audit(self, request: dict[str, str]) -> dict[str, Any]:
        if not authorizes_deletion(request["request_text"]):
            return {"case_id": request["case_id"], "deletion_status": "NOT_APPLICABLE", "steps": []}

        cutoff = request["audit_at"]
        user_id = self.identity_index.resolve(request["email"], cutoff)
        if not user_id:
            return {"case_id": request["case_id"], "deletion_status": "INCOMPLETE", "steps": []}

        identifiers = self.identity_index.identifiers(user_id, cutoff)
        observations = self.evidence_store.observations_for_user(identifiers, cutoff)
        resources: dict[tuple[str, str], list[Observation]] = defaultdict(list)
        for observation in observations:
            resources[(observation.system_id, observation.resource_id)].extend(
                self.evidence_store.observations_for_resource(
                    observation.resource_id, cutoff, observation.system_id
                )
            )

        current: dict[tuple[str, str], Observation] = {}
        request_time = parse_timestamp(request["requested_at"])
        for key, candidates in resources.items():
            unique = {(item.evidence_id, item.observed_at, item.state): item for item in candidates}
            known = [
                item for item in unique.values()
                if item.state != "UNKNOWN"
                and (item.state != "ABSENT" or parse_timestamp(item.observed_at) >= request_time)
            ]
            if known:
                current[key] = max(
                    known, key=lambda item: parse_timestamp(item.observed_at)
                )

        findings: list[dict[str, Any]] = []
        remediation: list[dict[str, Any]] = []
        verification: list[dict[str, Any]] = []
        finding_observations: list[Observation] = []
        for (system_id, resource_id), observation in current.items():
            finding_operation, remediation_operation, verification_operation = _required_treatment(
                observation, cutoff, self.rules
            )
            if finding_operation:
                finding_observations.append(observation)
                finding_state = "ACTIVE" if finding_operation in {
                    "REPORT_ACTIVE_DATA_FLOW", "REPORT_RESTORE_RISK"
                } else "PRESENT"
                findings.append(
                    _step(
                        "FINDING", system_id, resource_id, finding_operation,
                        finding_state, observation.evidence_id,
                    )
                )
                remediation_state = {
                    "DISABLE_DATA_FLOW": "DISABLED", "BLOCK_RESTORE": "BLOCKED",
                    "DELETE_RECORD": "ABSENT", "REDACT_RECORD": "REDACTED",
                    "ANONYMIZE_RECORD": "ANONYMIZED",
                }[remediation_operation]
                remediation.append(
                    _step(
                        "REMEDIATION", system_id, resource_id, remediation_operation,
                        remediation_state, "",
                    )
                )
            if verification_operation:
                verification_state = {
                    "VERIFY_RECORD_ABSENT": "ABSENT",
                    "VERIFY_RECORD_PRESENT": "PRESENT",
                    "VERIFY_RECORD_REDACTED": "REDACTED",
                    "VERIFY_RECORD_ANONYMIZED": "ANONYMIZED",
                    "VERIFY_DATA_FLOW_DISABLED": "DISABLED",
                    "VERIFY_RESTORE_BLOCKED": "BLOCKED",
                }[verification_operation]
                verification.append(
                    _step(
                        "VERIFICATION", system_id, resource_id, verification_operation,
                        verification_state, observation.evidence_id,
                    )
                )

        has_primary_profile_absence = any(
            observation.system_id == "account_service"
            and observation.category == "USER_PROFILE"
            and observation.state == "ABSENT"
            for observation in current.values()
        )
        incomplete = bool(findings) or not has_primary_profile_absence or not verification
        if incomplete and not findings:
            remediation = []
            verification = []
        if incomplete:
            for step in verification:
                step["evidence_id"] = ""
            verification_keys = {
                (step["system_id"], step["resource_id"], step["operation"])
                for step in verification
            }
            for observation in finding_observations:
                for resource_id in self.evidence_store.related_resource_ids(observation):
                    if not resource_id.startswith("account_"):
                        continue
                    key = ("account_service", resource_id, "VERIFY_RECORD_ABSENT")
                    if key not in verification_keys:
                        verification.append(
                            _step(
                                "VERIFICATION", "account_service", resource_id,
                                "VERIFY_RECORD_ABSENT", "ABSENT", "",
                            )
                        )
                        verification_keys.add(key)
        steps = findings + remediation + verification
        steps.sort(
            key=lambda step: (
                {"FINDING": 0, "REMEDIATION": 1, "VERIFICATION": 2}[step["phase"]],
                _OPERATION_ORDER[step["operation"]],
                step["system_id"],
                step["resource_id"],
            )
        )
        for number, item in enumerate(steps, start=1):
            item["step_no"] = number
        return {
            "case_id": request["case_id"],
            "deletion_status": "INCOMPLETE" if incomplete else "COMPLETE",
            "steps": steps,
        }