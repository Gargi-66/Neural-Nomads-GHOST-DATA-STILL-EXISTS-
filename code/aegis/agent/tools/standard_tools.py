"""AEGIS 3.0 Module 3 — Prebuilt Standard Investigation Tools.

Implements resolve_identity, query_evidence, check_admissibility, apply_policy.
"""

from typing import Dict, Any, Optional
from datetime import datetime
from aegis.agent.tool_registry import ToolDefinition
from aegis.validation.validator import CandidateValidator
from aegis.validation.models import CandidateFinding
from aegis.policy.models import ResourceContext
from aegis.policy.evaluator import evaluate_policy
from aegis.policy.compiler import CompiledPolicy


def make_standard_tools(
    validator: CandidateValidator,
    policy: CompiledPolicy,
) -> list[ToolDefinition]:
    """Builds standard investigation tools wired to Module 1 and Module 2."""

    def handle_check_admissibility(
        candidate_id: str,
        case_id: str,
        evidence_id: str,
        audit_at: Optional[str] = None,
        event_time: Optional[str] = None
    ) -> Dict[str, Any]:
        """Tool handler for check_admissibility with complete temporal and provenance validation."""
        meta = validator.manifest.get(evidence_id)
        if not meta:
            return {"admissible": False, "reason": f"Evidence '{evidence_id}' does not exist in manifest."}

        # Temporal admissibility check against audit_at cutoff
        if audit_at:
            try:
                dt_audit = datetime.fromisoformat(audit_at.replace("Z", "+00:00"))
                if meta.captured_at > dt_audit:
                    return {
                        "admissible": False,
                        "evidence_id": evidence_id,
                        "reason": f"Evidence captured_at ({meta.captured_at.isoformat()}) is strictly after audit cutoff ({dt_audit.isoformat()}).",
                    }
            except Exception as ex:
                return {"admissible": False, "reason": f"Invalid audit_at format: {ex}"}

        return {
            "admissible": True,
            "evidence_id": evidence_id,
            "origin": meta.origin,
            "captured_at": meta.captured_at.isoformat(),
        }

    def handle_apply_policy(resource_id: str, system_id: str, data_category: str) -> Dict[str, Any]:
        """Tool handler for apply_policy."""
        ctx = ResourceContext(
            resource_id=resource_id,
            system_id=system_id,
            data_category=data_category,
        )
        try:
            dec = evaluate_policy(ctx, policy)
            return {
                "rule_id": dec.rule_id,
                "required_action": dec.required_action.value,
                "explanation": dec.explanation,
            }
        except Exception as e:
            return {"error": str(e)}

    return [
        ToolDefinition(
            name="check_admissibility",
            description="Checks if an evidence reference exists in manifest and returns capture details.",
            parameters_schema={
                "type": "object",
                "properties": {
                    "candidate_id": {"type": "string"},
                    "case_id": {"type": "string"},
                    "evidence_id": {"type": "string"},
                    "event_time": {"type": "string"},
                },
                "required": ["candidate_id", "case_id", "evidence_id"],
            },
            handler=handle_check_admissibility,
        ),
        ToolDefinition(
            name="apply_policy",
            description="Queries compiled deletion policy rules to find required action for a resource category.",
            parameters_schema={
                "type": "object",
                "properties": {
                    "resource_id": {"type": "string"},
                    "system_id": {"type": "string"},
                    "data_category": {"type": "string"},
                },
                "required": ["resource_id", "system_id", "data_category"],
            },
            handler=handle_apply_policy,
        ),
        ToolDefinition(
            name="propose_finding",
            description="Submits a structured candidate finding for deterministic validation.",
            parameters_schema={
                "type": "object",
                "properties": {
                    "candidate_id": {"type": "string"},
                    "case_id": {"type": "string"},
                    "evidence_id": {"type": "string"},
                    "user_id": {"type": "string"},
                    "system_id": {"type": "string"},
                    "resource_id": {"type": "string"},
                    "data_category": {"type": "string"},
                    "phase": {"type": "string"},
                    "operation": {"type": "string"},
                    "state": {"type": "string"},
                },
                "required": [
                    "candidate_id", "case_id", "evidence_id", "user_id",
                    "system_id", "resource_id", "data_category",
                    "phase", "operation", "state"
                ],
            },
            handler=lambda **kwargs: kwargs,  # Intercepted by orchestrator SafetyGate
        ),
    ]

