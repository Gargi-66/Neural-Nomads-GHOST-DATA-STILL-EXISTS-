"""AEGIS 3.0 Module 1 — Policy Explanations Generator.

Generates structured, human-readable rationale for policy decisions.
"""

from aegis.policy.models import PolicyAction


def format_policy_explanation(
    resource_id: str,
    data_category: str,
    rule_id: str,
    action: PolicyAction,
    condition: str,
    prohibited: list[str],
    permitted: list[str],
) -> str:
    """Produces a deterministic, standardized explanation string."""
    if action == PolicyAction.DELETE:
        return (
            f"Resource '{resource_id}' ({data_category}) must be deleted under {rule_id}. "
            f"Condition: '{condition}'. Entire record must reach state ABSENT."
        )
    elif action == PolicyAction.REDACT:
        prohibited_str = ", ".join(prohibited) if prohibited else "direct personal identifiers"
        permitted_str = f" Permitted internal reference: {', '.join(permitted)}." if permitted else ""
        return (
            f"Resource '{resource_id}' ({data_category}) must be redacted under {rule_id}. "
            f"Condition: '{condition}'. Prohibited fields to remove: [{prohibited_str}].{permitted_str}"
        )
    elif action == PolicyAction.ANONYMIZE:
        return (
            f"Resource '{resource_id}' ({data_category}) must be anonymized under {rule_id}. "
            f"Condition: '{condition}'. The record may remain but must be irreversibly unlinked."
        )
    elif action == PolicyAction.RETAIN:
        return (
            f"Resource '{resource_id}' ({data_category}) must be retained under {rule_id}. "
            f"Condition: '{condition}'. Record must remain present and accessible."
        )
    return f"Resource '{resource_id}' evaluated under {rule_id} -> {action.value}."

