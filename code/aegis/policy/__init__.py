"""AEGIS 3.0 Module 1 — Policy Engine Package Entry.

Exposes the clean public interface for AEGIS 3.0 Policy Subsystem.
"""

from aegis.policy.models import (
    PolicyAction,
    PolicyRule,
    ResourceContext,
    PolicyDecision,
)
from aegis.policy.loader import load_policy_rules, PolicyLoadError
from aegis.policy.compiler import compile_policy, CompiledPolicy, PolicyConflictError
from aegis.policy.evaluator import evaluate_policy, UnresolvedPolicyError
from aegis.policy.validator import validate_policy_decision, PolicyValidationError
from aegis.policy.tombstone import evaluate_tombstone_identifiers

__all__ = [
    "PolicyAction",
    "PolicyRule",
    "ResourceContext",
    "PolicyDecision",
    "load_policy_rules",
    "PolicyLoadError",
    "compile_policy",
    "CompiledPolicy",
    "PolicyConflictError",
    "evaluate_policy",
    "UnresolvedPolicyError",
    "validate_policy_decision",
    "PolicyValidationError",
    "evaluate_tombstone_identifiers",
]

