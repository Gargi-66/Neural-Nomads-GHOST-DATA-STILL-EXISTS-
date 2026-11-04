"""AEGIS 3.0 Module 1 — Policy Compiler.

Converts raw policy records into normalized, indexed policy dictionaries,
detecting ambiguous or contradictory rules.
"""

from typing import List, Dict
from aegis.policy.models import PolicyRule
from aegis.policy.loader import PolicyLoadError


class PolicyConflictError(Exception):
    """Raised when conflicting or ambiguous rules exist in the policy set."""
    pass


class CompiledPolicy:
    """Indexed policy repository providing O(1) category lookups."""

    def __init__(self, rules: List[PolicyRule]) -> None:
        self.rules: List[PolicyRule] = list(rules)
        self.category_map: Dict[str, List[PolicyRule]] = {}

        for rule in self.rules:
            cat = rule.data_category.upper()
            if cat not in self.category_map:
                self.category_map[cat] = []
            self.category_map[cat].append(rule)

        # Detect conflicting unconditional rules for the same category
        for cat, cat_rules in self.category_map.items():
            unconditional_actions = {r.required_action for r in cat_rules if r.condition.lower() == "always"}
            if len(unconditional_actions) > 1:
                raise PolicyConflictError(
                    f"Contradictory unconditional policies detected for category '{cat}': {unconditional_actions}"
                )

    def get_rules_for_category(self, category: str) -> List[PolicyRule]:
        """Returns all compiled rules matching the normalized category."""
        return self.category_map.get(category.strip().upper(), [])

    def __len__(self) -> int:
        return len(self.rules)


def compile_policy(rules: List[PolicyRule]) -> CompiledPolicy:
    """Compiles a list of PolicyRule models into a CompiledPolicy index."""
    if not rules:
        raise PolicyLoadError("Cannot compile an empty policy rule set.")
    return CompiledPolicy(rules)

