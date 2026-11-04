"""AEGIS 3.0 Module 4 — Remediation Plan Reporter.

Formats the complete plan, dependency DAG, simulation trace, and verification status.
"""

from typing import Any, Dict, Optional
from aegis.remediation.models import RemediationPlan
from aegis.remediation.simulator import SimulationOutcome


def format_plan_report(plan: RemediationPlan, simulation: Optional[SimulationOutcome] = None) -> Dict[str, Any]:
    """Generates structured diagnostics report for the remediation plan."""
    return {
        "case_id": plan.case_id,
        "plan_id": plan.plan_id,
        "plan_status": plan.plan_status.value,
        "initial_state": plan.initial_state,
        "requirements_count": len(plan.requirements),
        "steps_count": len(plan.steps),
        "active_flows": plan.active_flows,
        "restore_risks": plan.restore_risks,
        "steps": [s.model_dump() for s in plan.steps],
        "simulation": simulation.model_dump() if simulation else None,
        "unresolved_issues": plan.unresolved_issues,
    }

