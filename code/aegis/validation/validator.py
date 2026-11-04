"""AEGIS 3.0 Module 2 — Candidate & Batch Validator Orchestrator.
"""

from datetime import datetime
from typing import List, Dict, Set, Optional

from aegis.validation.models import (
    CandidateFinding,
    EvidenceMetadata,
    IdentityContext,
    ValidationReport,
    ValidationErrorCode,
    CheckStatus,
)
from aegis.validation.operations import validate_operation_triplet
from aegis.validation.checkers import (
    validate_provenance,
    validate_identity,
    validate_temporal,
    validate_resource,
    validate_policy_consistency,
)
from aegis.policy.compiler import CompiledPolicy


class CandidateValidator:
    """Deterministic validation engine for candidate findings."""

    def __init__(
        self,
        manifest: Dict[str, EvidenceMetadata],
        policy: CompiledPolicy,
        supported_systems: Set[str],
        known_resource_map: Optional[Dict[str, str]] = None,
    ) -> None:
        self.manifest = manifest
        self.policy = policy
        self.supported_systems = supported_systems
        self.known_resource_map = known_resource_map or {}

    def validate_candidate(
        self,
        candidate: CandidateFinding,
        identity: Optional[IdentityContext],
        audit_at: datetime,
    ) -> ValidationReport:
        """Executes the full 6-stage validation pipeline on a single candidate finding."""
        report = ValidationReport(
            candidate_id=candidate.candidate_id,
            accepted=False,
            diagnostics={},
        )

        # 0. Missing Dependency Check
        if identity is None:
            report.reason_code = ValidationErrorCode.MISSING_DEPENDENCY
            report.reason = "Person 3 IdentityContext dependency is missing."
            return report

        # 1. Operation & State Validation
        op_valid, op_msg = validate_operation_triplet(candidate.phase, candidate.operation, candidate.state)
        if not op_valid:
            report.operation_check = CheckStatus.FAIL
            report.reason_code = ValidationErrorCode.INVALID_OPERATION
            report.reason = op_msg
            return report
        report.operation_check = CheckStatus.PASS

        # 2. Provenance Check
        prov_valid, prov_msg = validate_provenance(candidate, self.manifest)
        if not prov_valid:
            report.provenance_check = CheckStatus.FAIL
            report.reason_code = ValidationErrorCode.INVALID_EVIDENCE_REFERENCE
            report.reason = prov_msg
            return report
        report.provenance_check = CheckStatus.PASS

        # 3. Identity Check
        ident_valid, ident_msg = validate_identity(candidate, identity)
        if not ident_valid:
            report.identity_check = CheckStatus.FAIL
            report.reason_code = ValidationErrorCode.IDENTITY_MISMATCH
            report.reason = ident_msg
            return report
        report.identity_check = CheckStatus.PASS

        # 4. Temporal Admissibility Check
        temp_valid, temp_msg = validate_temporal(candidate, audit_at, self.manifest)
        if not temp_valid:
            report.temporal_check = CheckStatus.FAIL
            report.reason_code = ValidationErrorCode.TEMPORAL_INADMISSIBILITY
            report.reason = temp_msg
            return report
        report.temporal_check = CheckStatus.PASS

        # 5. Resource Consistency Check
        res_valid, res_msg = validate_resource(candidate, self.supported_systems, self.known_resource_map)
        if not res_valid:
            report.resource_check = CheckStatus.FAIL
            report.reason_code = ValidationErrorCode.RESOURCE_MISMATCH
            report.reason = res_msg
            return report
        report.resource_check = CheckStatus.PASS

        # 6. Policy Consistency Check
        pol_valid, pol_msg = validate_policy_consistency(candidate, self.policy)
        if not pol_valid:
            report.policy_check = CheckStatus.FAIL
            report.reason_code = ValidationErrorCode.POLICY_CONFLICT
            report.reason = pol_msg
            return report
        report.policy_check = CheckStatus.PASS

        # All 6 checks passed
        report.accepted = True
        return report

    def validate_batch(
        self,
        candidates: List[CandidateFinding],
        identities: Dict[str, IdentityContext],  # user_id -> context
        audit_at_map: Dict[str, datetime],       # case_id -> audit_at
    ) -> List[ValidationReport]:
        """Validates a batch of candidates in deterministic order without cross-case leakage."""
        reports: List[ValidationReport] = []
        # Sort candidates deterministically by case_id, candidate_id
        sorted_candidates = sorted(candidates, key=lambda c: (c.case_id, c.candidate_id))

        for cand in sorted_candidates:
            ident = identities.get(cand.user_id)
            audit_at = audit_at_map.get(cand.case_id)
            if not audit_at:
                reports.append(
                    ValidationReport(
                        candidate_id=cand.candidate_id,
                        accepted=False,
                        reason_code=ValidationErrorCode.MISSING_DEPENDENCY,
                        reason=f"Missing audit_at cutoff for case '{cand.case_id}'.",
                    )
                )
                continue

            report = self.validate_candidate(cand, ident, audit_at)
            reports.append(report)

        return reports

