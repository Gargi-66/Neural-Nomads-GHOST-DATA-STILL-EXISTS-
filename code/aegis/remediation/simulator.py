"""AEGIS 3.0 Module 4 — In-Memory State-Transition Simulator.

Hermetically executes the remediation plan against an isolated in-memory copy of the system state,
detecting dependency violations, postcondition failures, and zombie sync recreations.
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, ConfigDict

from aegis.remediation.models import RemediationPlan, RemediationStep, PlanStatus


class SimulationOutcome(BaseModel):
    model_config = ConfigDict(extra="forbid")
    success: bool
    failed_step_id: Optional[str] = None
    failure_reason: Optional[str] = None
    transitions_recorded: List[Dict[str, Any]]
    final_state: Dict[str, str]


class RemediationSimulator:
    """Hermetic simulator executing plans in memory."""

    def __init__(self, active_flow_recreation_targets: Optional[Dict[str, List[str]]] = None) -> None:
        # flow_id -> list of resource_ids it will recreate if ACTIVE
        self.flow_targets = active_flow_recreation_targets or {}

    def simulate(self, plan: RemediationPlan) -> SimulationOutcome:
        """Simulates plan execution on an isolated copy of initial_state."""
        current_state = dict(plan.initial_state)
        transitions: List[Dict[str, Any]] = []

        for step in plan.steps:
            if step.phase != "REMEDIATION":
                continue  # Simulator only executes active remediation transitions

            res_id = step.resource_id
            op = step.operation

            # 1. Dependency Precondition Checks
            # Rule: DELETE_RECORD on resource cannot proceed if an active flow targets it
            for flow_id, targets in self.flow_targets.items():
                if res_id in targets and current_state.get(flow_id) == "ACTIVE":
                    return SimulationOutcome(
                        success=False,
                        failed_step_id=step.step_id,
                        failure_reason=(
                            f"Simulation Failure at {step.step_id}: Cannot execute '{op}' on '{res_id}' "
                            f"while synchronization flow '{flow_id}' remains ACTIVE."
                        ),
                        transitions_recorded=transitions,
                        final_state=current_state,
                    )

            # 2. Precondition Check
            curr = current_state.get(res_id)
            if curr != step.expected_precondition:
                return SimulationOutcome(
                    success=False,
                    failed_step_id=step.step_id,
                    failure_reason=(
                        f"Precondition mismatch for '{res_id}' at {step.step_id}: "
                        f"expected '{step.expected_precondition}', found '{curr}'."
                    ),
                    transitions_recorded=transitions,
                    final_state=current_state,
                )

            # 3. Apply state transition in memory
            prev = current_state[res_id]
            current_state[res_id] = step.expected_postcondition
            transitions.append({
                "step_id": step.step_id,
                "resource_id": res_id,
                "operation": op,
                "prev_state": prev,
                "new_state": step.expected_postcondition,
            })

        # 4. Postcondition Completeness Check across all requirements
        for req in plan.requirements:
            expected = "ABSENT" if req.required_action.value == "DELETE" else (
                "REDACTED" if req.required_action.value == "REDACT" else (
                    "ANONYMIZED" if req.required_action.value == "ANONYMIZE" else "PRESENT"
                )
            )
            actual = current_state.get(req.resource_id)
            if actual != expected:
                return SimulationOutcome(
                    success=False,
                    failed_step_id="postcondition_check",
                    failure_reason=(
                        f"Postcondition failure for '{req.resource_id}': "
                        f"policy requires '{expected}', but final simulated state is '{actual}'."
                    ),
                    transitions_recorded=transitions,
                    final_state=current_state,
                )

        return SimulationOutcome(
            success=True,
            failed_step_id=None,
            failure_reason=None,
            transitions_recorded=transitions,
            final_state=current_state,
        )

