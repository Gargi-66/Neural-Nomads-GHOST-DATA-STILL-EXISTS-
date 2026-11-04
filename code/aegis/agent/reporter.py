"""AEGIS 3.0 Module 3 — Investigation Reporter.

Produces explainable diagnostic reports for completed or partial investigations.
"""

from typing import Dict, Any, List
from aegis.agent.context import InvestigationContext


class InvestigationReport(dict):
    pass


def generate_investigation_report(context: InvestigationContext) -> Dict[str, Any]:
    """Generates a structured, auditable summary of the investigation."""
    return {
        "case_id": context.case_id,
        "user_id": context.user_id,
        "investigation_complete": context.investigation_complete,
        "termination_reason": context.termination_reason,
        "tools_called_count": len(context.tool_history),
        "retrieved_evidence_ids": context.retrieved_evidence_ids,
        "accepted_findings_count": len(context.accepted_findings),
        "rejected_findings_count": len(context.rejected_findings),
        "unresolved_questions": context.unresolved_questions,
        "accepted_findings": [f.model_dump() for f in context.accepted_findings],
        "rejected_reports": [r.model_dump() for r in context.rejected_findings],
    }

