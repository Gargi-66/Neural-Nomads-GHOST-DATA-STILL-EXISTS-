"""AEGIS 3.0 Module 3 — Investigation Context & State Manager.

Maintains strict per-case isolation and audit_at boundary immutability.
"""

from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, ConfigDict

from aegis.validation.models import (
    CandidateFinding,
    ValidationReport,
    IdentityContext,
)


class InvestigationContext(BaseModel):
    """Isolated, immutable context for a single case investigation."""
    model_config = ConfigDict(extra="forbid", frozen=False)

    case_id: str
    user_id: str
    audit_at: datetime = Field(..., frozen=True)
    requested_at: datetime
    request_text: str
    identity_context: Optional[IdentityContext] = None
    retrieved_evidence_ids: List[str] = Field(default_factory=list)
    tool_history: List[Dict[str, Any]] = Field(default_factory=list)
    accepted_findings: List[CandidateFinding] = Field(default_factory=list)
    rejected_findings: List[ValidationReport] = Field(default_factory=list)
    unresolved_questions: List[str] = Field(default_factory=list)
    investigation_complete: bool = False
    termination_reason: Optional[str] = None

    def record_tool_call(self, tool_name: str, arguments: Dict[str, Any], result: Dict[str, Any]) -> None:
        self.tool_history.append({
            "tool": tool_name,
            "arguments": arguments,
            "result": result,
        })

    def add_accepted_finding(self, finding: CandidateFinding) -> None:
        self.accepted_findings.append(finding)
        if finding.evidence_id and finding.evidence_id not in self.retrieved_evidence_ids:
            self.retrieved_evidence_ids.append(finding.evidence_id)

    def add_rejected_finding(self, report: ValidationReport) -> None:
        self.rejected_findings.append(report)
