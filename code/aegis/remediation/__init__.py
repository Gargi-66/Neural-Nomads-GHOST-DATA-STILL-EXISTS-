"""AEGIS 3.0 Module 4 — Package Init.
"""

from aegis.remediation.models import (
    PlanStatus,
    RemediationRequirement,
    RemediationStep,
    RemediationPlan,
)
from aegis.remediation.requirement_extractor import extract_remediation_requirements
from aegis.remediation.dependency_graph import (
    DependencyGraph,
    DependencyCycleError,
    build_dependency_graph,
)
from aegis.remediation.action_ordering import order_remediation_actions
from aegis.remediation.plan_generator import generate_remediation_plan
from aegis.remediation.simulator import (
    RemediationSimulator,
    SimulationOutcome,
)
from aegis.remediation.verification import VerificationChecker
from aegis.remediation.reporter import format_plan_report

__all__ = [
    "PlanStatus",
    "RemediationRequirement",
    "RemediationStep",
    "RemediationPlan",
    "extract_remediation_requirements",
    "DependencyGraph",
    "DependencyCycleError",
    "build_dependency_graph",
    "order_remediation_actions",
    "generate_remediation_plan",
    "RemediationSimulator",
    "SimulationOutcome",
    "VerificationChecker",
    "format_plan_report",
]

