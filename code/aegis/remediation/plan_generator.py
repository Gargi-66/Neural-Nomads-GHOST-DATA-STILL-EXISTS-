"""AEGIS 3.0 Module 4 — Remediation Plan Generator.

Generates structured RemediationPlan conforming strictly to AGENTS.md §6.4 and §6.5.
"""

from typing import List, Dict, Optional
from aegis.remediation.models import (
    RemediationPlan,
    RemediationStep,
    RemediationRequirement,
    PlanStatus,
)
from aegis.remediation.dependency_graph import build_dependency_graph, DependencyCycleError
from aegis.remediation.action_ordering import order_remediation_actions
from aegis.policy.models import PolicyAction


def generate_remediation_plan(
    case_id: str,
    requirements: List[RemediationRequirement],
    active_flows: List[str],
    restore_risks: List[str],
    explicit_dependencies: Optional[Dict[str, List[str]]] = None,
) -> RemediationPlan:
    """Generates structured plan with topological step ordering."""
    plan_id = f"plan_{case_id}"
    initial_state: Dict[str, str] = {}

    for req in requirements:
        initial_state[req.resource_id] = req.current_state
    for flow in active_flows:
        initial_state[flow] = "ACTIVE"
    for risk in restore_risks:
        initial_state[risk] = "ACTIVE"

    resource_ids = [r.resource_id for r in requirements if r.required_action != PolicyAction.RETAIN]

    # Build dependency graph
    dep_graph = build_dependency_graph(
        active_flows=active_flows,
        restore_risks=restore_risks,
        remediation_resources=resource_ids,
        explicit_dependencies=explicit_dependencies,
    )

    try:
        ordered_ids = order_remediation_actions(dep_graph)
    except DependencyCycleError as e:
        return RemediationPlan(
            case_id=case_id,
            plan_id=plan_id,
            plan_status=PlanStatus.INVALID,
            initial_state=initial_state,
            requirements=requirements,
            steps=[],
            active_flows=active_flows,
            restore_risks=restore_risks,
            unresolved_issues=[str(e)],
        )

    # Compile concrete RemediationSteps
    steps: List[RemediationStep] = []
    step_counter = 1

    # 1. REMEDIATION: DISABLE_DATA_FLOW
    for flow in [fid for fid in ordered_ids if fid in active_flows]:
        steps.append(
            RemediationStep(
                step_id=f"step_{step_counter}",
                resource_id=flow,
                system_id="integration_service",
                phase="REMEDIATION",
                operation="DISABLE_DATA_FLOW",
                state="DISABLED",
                expected_precondition="ACTIVE",
                expected_postcondition="DISABLED",
                evidence_id="",
            )
        )
        step_counter += 1

    # 2. REMEDIATION: BLOCK_RESTORE
    for risk in [rid for rid in ordered_ids if rid in restore_risks]:
        steps.append(
            RemediationStep(
                step_id=f"step_{step_counter}",
                resource_id=risk,
                system_id="backup_service",
                phase="REMEDIATION",
                operation="BLOCK_RESTORE",
                state="BLOCKED",
                expected_precondition="ACTIVE",
                expected_postcondition="BLOCKED",
                evidence_id="",
            )
        )
        step_counter += 1

    # 3. REMEDIATION: Records (DELETE, REDACT, ANONYMIZE)
    req_map = {r.resource_id: r for r in requirements}
    for res_id in [rid for rid in ordered_ids if rid in req_map]:
        req = req_map[res_id]
        if req.required_action == PolicyAction.DELETE:
            op = "DELETE_RECORD"
            post = "ABSENT"
        elif req.required_action == PolicyAction.REDACT:
            op = "REDACT_RECORD"
            post = "REDACTED"
        elif req.required_action == PolicyAction.ANONYMIZE:
            op = "ANONYMIZE_RECORD"
            post = "ANONYMIZED"
        else:
            continue  # RETAIN does not receive a remediation deletion step!

        prereqs = [f for f in active_flows] + [r for r in restore_risks]
        steps.append(
            RemediationStep(
                step_id=f"step_{step_counter}",
                resource_id=req.resource_id,
                system_id=req.system_id,
                phase="REMEDIATION",
                operation=op,
                state=post,
                depends_on=prereqs,
                expected_precondition=req.current_state,
                expected_postcondition=post,
                evidence_id="",
                rule_id=req.rule_id,
            )
        )
        step_counter += 1

    # 4. VERIFICATION steps for all remediated items & retained items
    for step in list(steps):
        if step.operation == "DISABLE_DATA_FLOW":
            ver_op = "VERIFY_DATA_FLOW_DISABLED"
            ver_state = "DISABLED"
        elif step.operation == "BLOCK_RESTORE":
            ver_op = "VERIFY_RESTORE_BLOCKED"
            ver_state = "BLOCKED"
        elif step.operation == "DELETE_RECORD":
            ver_op = "VERIFY_RECORD_ABSENT"
            ver_state = "ABSENT"
        elif step.operation == "REDACT_RECORD":
            ver_op = "VERIFY_RECORD_REDACTED"
            ver_state = "REDACTED"
        elif step.operation == "ANONYMIZE_RECORD":
            ver_op = "VERIFY_RECORD_ANONYMIZED"
            ver_state = "ANONYMIZED"
        else:
            continue

        steps.append(
            RemediationStep(
                step_id=f"step_{step_counter}",
                resource_id=step.resource_id,
                system_id=step.system_id,
                phase="VERIFICATION",
                operation=ver_op,
                state=ver_state,
                depends_on=[step.step_id],
                expected_precondition=step.expected_postcondition,
                expected_postcondition=ver_state,
                evidence_id="",
                rule_id=step.rule_id,
            )
        )
        step_counter += 1

    # Include VERIFY_RECORD_PRESENT for policy-retained records
    for req in requirements:
        if req.required_action == PolicyAction.RETAIN:
            steps.append(
                RemediationStep(
                    step_id=f"step_{step_counter}",
                    resource_id=req.resource_id,
                    system_id=req.system_id,
                    phase="VERIFICATION",
                    operation="VERIFY_RECORD_PRESENT",
                    state="PRESENT",
                    expected_precondition="PRESENT",
                    expected_postcondition="PRESENT",
                    evidence_id="",
                    rule_id=req.rule_id,
                )
            )
            step_counter += 1

    return RemediationPlan(
        case_id=case_id,
        plan_id=plan_id,
        plan_status=PlanStatus.READY,
        initial_state=initial_state,
        requirements=requirements,
        steps=steps,
        active_flows=active_flows,
        restore_risks=restore_risks,
    )

