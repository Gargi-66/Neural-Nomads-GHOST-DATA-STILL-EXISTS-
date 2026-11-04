"""AEGIS 3.0 Module 1 — Policy Evaluator.

Pure deterministic evaluation function mapping ResourceContext + CompiledPolicy -> PolicyDecision.
"""

from typing import List, Optional
from aegis.policy.models import ResourceContext, PolicyDecision, PolicyRule, PolicyAction
from aegis.policy.compiler import CompiledPolicy
from aegis.policy.tombstone import (
    evaluate_tombstone_identifiers,
    PROHIBITED_DIRECT_IDENTIFIERS,
    PERMITTED_INTERNAL_IDENTIFIERS,
)
from aegis.policy.explanations import format_policy_explanation


class UnresolvedPolicyError(Exception):
    """Raised when a resource category has no matching policy rule."""
    pass


def evaluate_policy(resource: ResourceContext, policy: CompiledPolicy) -> PolicyDecision:
    """Evaluates the required treatment for a resource under compiled policy rules.

    Pure deterministic function:
    - Zero network calls
    - Zero LLM calls
    - Zero input mutation
    - Fails safely with UnresolvedPolicyError if category is unknown
    """
    category = resource.data_category.strip().upper()
    matching_rules = policy.get_rules_for_category(category)

    if not matching_rules:
        raise UnresolvedPolicyError(
            f"No matching policy rule found for category '{category}' on resource '{resource.resource_id}'."
        )

    # 1. Specialized Category Handling: ACCOUNT_TOMBSTONE (Rule 15)
    if category == "ACCOUNT_TOMBSTONE":
        rule = matching_rules[0]
        permitted, prohibited, violations = evaluate_tombstone_identifiers(resource.present_identifiers)
        is_compliant = len(violations) == 0
        explanation = format_policy_explanation(
            resource_id=resource.resource_id,
            data_category=category,
            rule_id=rule.rule_id,
            action=rule.required_action,
            condition=rule.condition,
            prohibited=prohibited,
            permitted=permitted,
        )
        return PolicyDecision(
            resource_id=resource.resource_id,
            system_id=resource.system_id,
            data_category=category,
            rule_id=rule.rule_id,
            required_action=rule.required_action,
            condition_applied=rule.condition,
            permitted_identifiers=permitted,
            prohibited_identifiers=prohibited,
            explanation=explanation,
            is_compliant=is_compliant,
            violating_fields=violations,
        )

    # 2. General Rule Selection: Match based on contextual conditions
    selected_rule: Optional[PolicyRule] = None
    for rule in matching_rules:
        cond = rule.condition.lower()
        if cond == "always":
            selected_rule = rule
            break
        elif "shared customer, agent, or order context" in cond and resource.is_shared_context:
            selected_rule = rule
            break
        elif "belongs only to the deletion subject" in cond and resource.is_subject_only:
            selected_rule = rule
            break
        elif "still attributable to a user" in cond and resource.is_attributable:
            selected_rule = rule
            break
        elif "user email address" in cond:
            selected_rule = rule
            break
        elif "retention period" in cond and resource.within_retention_period:
            selected_rule = rule
            break
        elif "legal hold" in cond and resource.legal_hold_active:
            selected_rule = rule
            break
        elif "restore access can be blocked" in cond and resource.restore_access_blockable:
            selected_rule = rule
            break

    if not selected_rule:
        # Check if any rule has an "Always" condition
        always_rules = [r for r in matching_rules if r.condition.lower() == "always"]
        if always_rules:
            selected_rule = always_rules[0]
        else:
            raise UnresolvedPolicyError(
                f"Policy evaluation unresolved for category '{category}' on resource '{resource.resource_id}'. "
                f"None of the {len(matching_rules)} condition criteria were satisfied by the resource context."
            )

    # Identifier prohibition check for REDACT / ANONYMIZE actions
    prohibited_fields: List[str] = []
    violating_fields: List[str] = []
    permitted_fields: List[str] = []

    if selected_rule.required_action == PolicyAction.REDACT:
        # Redact direct PII
        for ident in resource.present_identifiers:
            if ident.lower() in PROHIBITED_DIRECT_IDENTIFIERS or "email" in ident.lower() or "phone" in ident.lower():
                prohibited_fields.append(ident)
                violating_fields.append(ident)
            else:
                permitted_fields.append(ident)
    elif selected_rule.required_action == PolicyAction.ANONYMIZE:
        for ident in resource.present_identifiers:
            prohibited_fields.append(ident)
            violating_fields.append(ident)
    elif selected_rule.required_action == PolicyAction.DELETE:
        # Whole record to be deleted; present identifiers must all be purged
        prohibited_fields = list(resource.present_identifiers)
        violating_fields = list(resource.present_identifiers)
    elif selected_rule.required_action == PolicyAction.RETAIN:
        permitted_fields = list(resource.present_identifiers)

    is_compliant = len(violating_fields) == 0

    explanation = format_policy_explanation(
        resource_id=resource.resource_id,
        data_category=category,
        rule_id=selected_rule.rule_id,
        action=selected_rule.required_action,
        condition=selected_rule.condition,
        prohibited=prohibited_fields,
        permitted=permitted_fields,
    )

    return PolicyDecision(
        resource_id=resource.resource_id,
        system_id=resource.system_id,
        data_category=category,
        rule_id=selected_rule.rule_id,
        required_action=selected_rule.required_action,
        condition_applied=selected_rule.condition,
        permitted_identifiers=permitted_fields,
        prohibited_identifiers=prohibited_fields,
        explanation=explanation,
        is_compliant=is_compliant,
        violating_fields=violating_fields,
    )

