"""AEGIS 3.0 Module 2 — Operations and Allowed Pairs Validator.

Sourced directly from AGENTS.md §6.4 and §6.5.
"""

from typing import Tuple, Set

# (phase, operation, state)
ALLOWED_TRIPLETS: Set[Tuple[str, str, str]] = {
    # FINDING
    ("FINDING", "REPORT_REMAINING_RECORD", "PRESENT"),
    ("FINDING", "REPORT_EXPOSED_PII", "PRESENT"),
    ("FINDING", "REPORT_ACTIVE_DATA_FLOW", "ACTIVE"),
    ("FINDING", "REPORT_RESTORE_RISK", "ACTIVE"),
    # REMEDIATION
    ("REMEDIATION", "DISABLE_DATA_FLOW", "DISABLED"),
    ("REMEDIATION", "BLOCK_RESTORE", "BLOCKED"),
    ("REMEDIATION", "DELETE_RECORD", "ABSENT"),
    ("REMEDIATION", "REDACT_RECORD", "REDACTED"),
    ("REMEDIATION", "ANONYMIZE_RECORD", "ANONYMIZED"),
    # VERIFICATION
    ("VERIFICATION", "VERIFY_RECORD_ABSENT", "ABSENT"),
    ("VERIFICATION", "VERIFY_RECORD_PRESENT", "PRESENT"),
    ("VERIFICATION", "VERIFY_RECORD_REDACTED", "REDACTED"),
    ("VERIFICATION", "VERIFY_RECORD_ANONYMIZED", "ANONYMIZED"),
    ("VERIFICATION", "VERIFY_DATA_FLOW_DISABLED", "DISABLED"),
    ("VERIFICATION", "VERIFY_RESTORE_BLOCKED", "BLOCKED"),
}


def validate_operation_triplet(phase: str, operation: str, state: str) -> Tuple[bool, str]:
    """Validates that phase, operation, and state match the exact allowed contract."""
    triplet = (phase.strip().upper(), operation.strip().upper(), state.strip().upper())
    if triplet in ALLOWED_TRIPLETS:
        return True, "Valid operation triplet."

    # Specific diagnostic errors
    valid_phases = {"FINDING", "REMEDIATION", "VERIFICATION"}
    if triplet[0] not in valid_phases:
        return False, f"Invalid phase '{triplet[0]}'. Allowed: {sorted(valid_phases)}"

    allowed_for_phase = [op for p, op, st in ALLOWED_TRIPLETS if p == triplet[0]]
    if triplet[1] not in allowed_for_phase:
        return False, f"Operation '{triplet[1]}' is not permitted in phase '{triplet[0]}'."

    allowed_states = [st for p, op, st in ALLOWED_TRIPLETS if p == triplet[0] and op == triplet[1]]
    return False, f"State '{triplet[2]}' is invalid for '{triplet[1]}' in phase '{triplet[0]}'. Allowed: {allowed_states}"

