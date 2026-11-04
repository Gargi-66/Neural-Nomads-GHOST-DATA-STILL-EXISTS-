"""AEGIS 3.0 Module 1 — Policy Decision Validator.

Validates that a generated PolicyDecision conforms to safety constraints.
"""

from aegis.policy.models import PolicyDecision, PolicyAction
from aegis.policy.compiler import CompiledPolicy


class PolicyValidationError(Exception):
    """Raised when a PolicyDecision violates system invariants."""
    pass


def validate_policy_decision(decision: PolicyDecision, policy: CompiledPolicy) -> bool:
    """Validates that a PolicyDecision is legally sound:
    - Rule exists in compiled policy
    - Category matches rule
    - Action matches compiled rule mandate
    - No unknown actions
    """
    rules = policy.get_rules_for_category(decision.data_category)
    if not rules:
        raise PolicyValidationError(f"Category '{decision.data_category}' does not exist in compiled policy.")

    matching_rule = next((r for r in rules if r.rule_id == decision.rule_id), None)
    if not matching_rule:
        raise PolicyValidationError(
            f"Rule ID '{decision.rule_id}' does not match category '{decision.data_category}'."
        )

    if decision.required_action != matching_rule.required_action:
        raise PolicyValidationError(
            f"Action mismatch: Decision specifies '{decision.required_action.value}' "
            f"but rule '{matching_rule.rule_id}' requires '{matching_rule.required_action.value}'."
        )

    return True

