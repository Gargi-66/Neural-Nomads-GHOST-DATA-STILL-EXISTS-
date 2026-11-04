"""AEGIS 3.0 Module 3 — Safety Gate & Policy Enforcement.

Enforces that LLM proposals CANNOT override Module 1 policy or bypass Module 2 validation.
"""

from typing import Tuple, Optional
from aegis.validation.models import CandidateFinding, ValidationReport
from aegis.validation.validator import CandidateValidator
from aegis.agent.context import InvestigationContext


class SafetyGate:
    """Enforces non-negotiable security and validation boundaries on all LLM proposals."""

    def __init__(self, validator: CandidateValidator) -> None:
        self.validator = validator

    def process_proposed_finding(
        self,
        candidate: CandidateFinding,
        context: InvestigationContext,
    ) -> Tuple[bool, ValidationReport]:
        """Submits candidate finding to Module 2 for deterministic validation.

        Returns (is_accepted, validation_report).
        """
        # Strict context check: Candidate MUST belong to this case and user
        if candidate.case_id != context.case_id or candidate.user_id != context.user_id:
            report = ValidationReport(
                candidate_id=candidate.candidate_id,
                accepted=False,
                reason="Cross-case identity or case_id contamination detected.",
            )
            context.add_rejected_finding(report)
            return False, report

        # Submit to Module 2
        report = self.validator.validate_candidate(
            candidate=candidate,
            identity=context.identity_context,
            audit_at=context.audit_at,
        )

        if report.accepted:
            context.add_accepted_finding(candidate)
            return True, report
        else:
            context.add_rejected_finding(report)
            return False, report

