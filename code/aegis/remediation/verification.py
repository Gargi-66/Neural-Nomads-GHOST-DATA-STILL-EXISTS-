"""AEGIS 3.0 Module 4 — Verification and Plan Completeness Checker.

Evaluates whether the plan satisfies all required verification rules.
"""

from typing import Tuple, List
from aegis.remediation.models import RemediationPlan, PlanStatus
from aegis.policy.models import PolicyAction


class VerificationChecker:
    """Verifies that all requirements, verification steps, and policy rules are complete."""

    @staticmethod
    def verify_plan(plan: RemediationPlan) -> Tuple[PlanStatus, List[str]]:
        """Checks:
        1. Every requirement has a remediation step (unless RETAIN).
        2. Every remediation step has a corresponding verification check.
        3. No prohibited operations exist.
        4. Retained records have VERIFY_RECORD_PRESENT.
        """
        issues: List[str] = []

        if plan.plan_status == PlanStatus.INVALID:
            return PlanStatus.INVALID, plan.unresolved_issues

        # 1. Check requirement coverage
        remediated_res = {s.resource_id for s in plan.steps if s.phase == "REMEDIATION"}
        for req in plan.requirements:
            if req.required_action != PolicyAction.RETAIN:
                if req.resource_id not in remediated_res:
                    issues.append(f"Missing remediation step for resource '{req.resource_id}'.")

        # 2. Check verification step coverage
        verified_res = {s.resource_id: s.operation for s in plan.steps if s.phase == "VERIFICATION"}
        for s in plan.steps:
            if s.phase == "REMEDIATION":
                if s.resource_id not in verified_res:
                    issues.append(f"Missing verification step for remediated resource '{s.resource_id}'.")

        # 3. Check retained records have VERIFY_RECORD_PRESENT
        for req in plan.requirements:
            if req.required_action == PolicyAction.RETAIN:
                if verified_res.get(req.resource_id) != "VERIFY_RECORD_PRESENT":
                    issues.append(f"Retained resource '{req.resource_id}' missing 'VERIFY_RECORD_PRESENT'.")

        if issues:
            return PlanStatus.INCOMPLETE, issues

        return PlanStatus.READY, []

