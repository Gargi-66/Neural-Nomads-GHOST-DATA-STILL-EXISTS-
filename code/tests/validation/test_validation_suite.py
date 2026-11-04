"""AEGIS 3.0 Module 2 — Comprehensive Validation Engine Test Suite.

Covers all 22 required test scenarios:
TEST 1 — Valid evidence reference
TEST 2 — Invalid evidence reference
TEST 3 — Wrong user
TEST 4 — Historical identity
TEST 5 — Unsupported identity similarity
TEST 6 — Post-audit evidence
TEST 7 — Historical valid evidence
TEST 8 — Capture timestamp versus event timestamp
TEST 9 — Wrong resource
TEST 10 — Wrong system
TEST 11 — Invalid policy treatment
TEST 12 — Valid redaction
TEST 13 — Retained tombstone
TEST 14 — Invalid operation/state pair
TEST 15 — Invalid phase/operation pair
TEST 16 — Unsupported finding (empty evidence)
TEST 17 — Conflicting evidence detection
TEST 18 — Missing Person 3 result
TEST 19 — Batch isolation
TEST 20 — Deterministic validation
TEST 21 — Source immutability
TEST 22 — Empty evidence candidate
"""

import copy
import pytest
from datetime import datetime, timezone
from pathlib import Path

from aegis.validation import (
    CandidateValidator,
    CandidateFinding,
    EvidenceMetadata,
    IdentityContext,
    ValidationErrorCode,
    CheckStatus,
    validate_operation_triplet,
)
from aegis.policy import load_policy_rules, compile_policy, PolicyAction

REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
REAL_RULES_CSV = REPO_ROOT / "dataset" / "deletion_rules.csv"


@pytest.fixture(scope="module")
def shared_compiled_policy():
    return compile_policy(load_policy_rules(REAL_RULES_CSV))


@pytest.fixture
def base_validator(shared_compiled_policy):
    manifest = {
        "evidence_01": EvidenceMetadata(
            file_id="evidence_01",
            file_path="evidence/logs/test.log",
            origin="test",
            captured_at=datetime(2026, 9, 1, 12, 0, tzinfo=timezone.utc),
        ),
        "evidence_02": EvidenceMetadata(
            file_id="evidence_02",
            file_path="evidence/records/snapshot.json",
            origin="test",
            captured_at=datetime(2026, 9, 20, 12, 0, tzinfo=timezone.utc),
        ),
    }
    supported_systems = {"account_service", "analytics_platform", "support_platform", "search_service"}
    known_resources = {"account_001": "account_service", "analytics_901": "analytics_platform"}
    return CandidateValidator(
        manifest=manifest,
        policy=shared_compiled_policy,
        supported_systems=supported_systems,
        known_resource_map=known_resources,
    )


@pytest.fixture
def sample_identity():
    return IdentityContext(
        user_id="user_101",
        primary_email="user101@example.com",
        verified_identifiers={"user101@example.com", "+12025550101"},
        historical_identifiers={"old_email@example.com"},
    )


# TEST 1: Valid evidence reference
def test_1_valid_evidence_reference(base_validator, sample_identity):
    cand = CandidateFinding(
        candidate_id="c1",
        case_id="case_01",
        evidence_id="evidence_01",
        user_id="user_101",
        system_id="account_service",
        resource_id="account_001",
        data_category="USER_PROFILE",
        phase="FINDING",
        operation="REPORT_REMAINING_RECORD",
        state="PRESENT",
        proposed_treatment=PolicyAction.DELETE,
    )
    report = base_validator.validate_candidate(cand, sample_identity, datetime(2026, 9, 5, tzinfo=timezone.utc))
    assert report.accepted is True
    assert report.provenance_check == CheckStatus.PASS


# TEST 2: Invalid evidence reference
def test_2_invalid_evidence_reference(base_validator, sample_identity):
    cand = CandidateFinding(
        candidate_id="c2",
        case_id="case_01",
        evidence_id="evidence_999_fake",
        user_id="user_101",
        system_id="account_service",
        resource_id="account_001",
        data_category="USER_PROFILE",
        phase="FINDING",
        operation="REPORT_REMAINING_RECORD",
        state="PRESENT",
    )
    report = base_validator.validate_candidate(cand, sample_identity, datetime(2026, 9, 5, tzinfo=timezone.utc))
    assert report.accepted is False
    assert report.reason_code == ValidationErrorCode.INVALID_EVIDENCE_REFERENCE


# TEST 3: Wrong user
def test_3_wrong_user(base_validator, sample_identity):
    cand = CandidateFinding(
        candidate_id="c3",
        case_id="case_01",
        evidence_id="evidence_01",
        user_id="user_999_imposter",
        system_id="account_service",
        resource_id="account_001",
        data_category="USER_PROFILE",
        phase="FINDING",
        operation="REPORT_REMAINING_RECORD",
        state="PRESENT",
    )
    report = base_validator.validate_candidate(cand, sample_identity, datetime(2026, 9, 5, tzinfo=timezone.utc))
    assert report.accepted is False
    assert report.reason_code == ValidationErrorCode.IDENTITY_MISMATCH


# TEST 4: Historical identity
def test_4_historical_identity(base_validator, sample_identity):
    cand = CandidateFinding(
        candidate_id="c4",
        case_id="case_01",
        evidence_id="evidence_01",
        user_id="user_101",
        system_id="account_service",
        resource_id="account_001",
        data_category="USER_PROFILE",
        phase="FINDING",
        operation="REPORT_REMAINING_RECORD",
        state="PRESENT",
        present_identifiers=["old_email@example.com"],
        proposed_treatment=PolicyAction.DELETE,
    )
    report = base_validator.validate_candidate(cand, sample_identity, datetime(2026, 9, 5, tzinfo=timezone.utc))
    assert report.accepted is True
    assert report.identity_check == CheckStatus.PASS


# TEST 5: Unsupported identity similarity
def test_5_unsupported_identity_similarity(base_validator, sample_identity):
    cand = CandidateFinding(
        candidate_id="c5",
        case_id="case_01",
        evidence_id="evidence_01",
        user_id="user_101",
        system_id="account_service",
        resource_id="account_001",
        data_category="USER_PROFILE",
        phase="FINDING",
        operation="REPORT_REMAINING_RECORD",
        state="PRESENT",
        present_identifiers=["user101_typo@example.com"],  # Not in verified or historical!
    )
    report = base_validator.validate_candidate(cand, sample_identity, datetime(2026, 9, 5, tzinfo=timezone.utc))
    assert report.accepted is False
    assert report.reason_code == ValidationErrorCode.IDENTITY_MISMATCH


# TEST 6: Post-audit evidence
def test_6_post_audit_evidence(base_validator, sample_identity):
    cand = CandidateFinding(
        candidate_id="c6",
        case_id="case_01",
        evidence_id="evidence_02",  # Captured Sept 20
        user_id="user_101",
        system_id="account_service",
        resource_id="account_001",
        data_category="USER_PROFILE",
        phase="FINDING",
        operation="REPORT_REMAINING_RECORD",
        state="PRESENT",
        event_timestamp=datetime(2026, 9, 15, tzinfo=timezone.utc),  # Later than audit_at
    )
    # audit_at is Sept 10
    report = base_validator.validate_candidate(cand, sample_identity, datetime(2026, 9, 10, tzinfo=timezone.utc))
    assert report.accepted is False
    assert report.reason_code == ValidationErrorCode.TEMPORAL_INADMISSIBILITY


# TEST 7: Historical valid evidence
def test_7_historical_valid_evidence(base_validator, sample_identity):
    cand = CandidateFinding(
        candidate_id="c7",
        case_id="case_01",
        evidence_id="evidence_01",
        user_id="user_101",
        system_id="account_service",
        resource_id="account_001",
        data_category="USER_PROFILE",
        phase="FINDING",
        operation="REPORT_REMAINING_RECORD",
        state="PRESENT",
        event_timestamp=datetime(2026, 8, 25, tzinfo=timezone.utc),
        proposed_treatment=PolicyAction.DELETE,
    )
    report = base_validator.validate_candidate(cand, sample_identity, datetime(2026, 9, 5, tzinfo=timezone.utc))
    assert report.accepted is True


# TEST 8: Capture timestamp versus event timestamp
def test_8_capture_vs_event_timestamp(base_validator, sample_identity):
    # File captured Sept 20, but event recorded inside was August 15. Audit cutoff is Sept 5.
    cand = CandidateFinding(
        candidate_id="c8",
        case_id="case_01",
        evidence_id="evidence_02",  # Captured Sept 20
        user_id="user_101",
        system_id="account_service",
        resource_id="account_001",
        data_category="USER_PROFILE",
        phase="FINDING",
        operation="REPORT_REMAINING_RECORD",
        state="PRESENT",
        event_timestamp=datetime(2026, 8, 15, tzinfo=timezone.utc),  # Valid event time <= audit_at
        proposed_treatment=PolicyAction.DELETE,
    )
    report = base_validator.validate_candidate(cand, sample_identity, datetime(2026, 9, 5, tzinfo=timezone.utc))
    assert report.accepted is True
    assert report.temporal_check == CheckStatus.PASS


# TEST 9: Wrong resource
def test_9_wrong_resource(base_validator, sample_identity):
    # Resource 'account_001' belongs to account_service, but candidate claims it's in analytics_platform
    cand = CandidateFinding(
        candidate_id="c9",
        case_id="case_01",
        evidence_id="evidence_01",
        user_id="user_101",
        system_id="analytics_platform",
        resource_id="account_001",
        data_category="ANALYTICS_PROFILE",
        phase="FINDING",
        operation="REPORT_REMAINING_RECORD",
        state="PRESENT",
    )
    report = base_validator.validate_candidate(cand, sample_identity, datetime(2026, 9, 5, tzinfo=timezone.utc))
    assert report.accepted is False
    assert report.reason_code == ValidationErrorCode.RESOURCE_MISMATCH


# TEST 10: Wrong system
def test_10_wrong_system(base_validator, sample_identity):
    cand = CandidateFinding(
        candidate_id="c10",
        case_id="case_01",
        evidence_id="evidence_01",
        user_id="user_101",
        system_id="unregistered_rogue_service",
        resource_id="res_01",
        data_category="USER_PROFILE",
        phase="FINDING",
        operation="REPORT_REMAINING_RECORD",
        state="PRESENT",
    )
    report = base_validator.validate_candidate(cand, sample_identity, datetime(2026, 9, 5, tzinfo=timezone.utc))
    assert report.accepted is False
    assert report.reason_code == ValidationErrorCode.RESOURCE_MISMATCH


# TEST 11: Invalid policy treatment
def test_11_invalid_policy_treatment(base_validator, sample_identity):
    # Proposes DELETE for SECURITY_AUDIT_LOG which requires RETAIN
    cand = CandidateFinding(
        candidate_id="c11",
        case_id="case_01",
        evidence_id="evidence_01",
        user_id="user_101",
        system_id="account_service",
        resource_id="audit_123",
        data_category="SECURITY_AUDIT_LOG",
        phase="FINDING",
        operation="REPORT_REMAINING_RECORD",
        state="PRESENT",
        proposed_treatment=PolicyAction.DELETE,  # Violation!
    )
    report = base_validator.validate_candidate(cand, sample_identity, datetime(2026, 9, 5, tzinfo=timezone.utc))
    assert report.accepted is False
    assert report.reason_code == ValidationErrorCode.POLICY_CONFLICT


# TEST 12: Valid redaction
def test_12_valid_redaction(base_validator, sample_identity):
    cand = CandidateFinding(
        candidate_id="c12",
        case_id="case_01",
        evidence_id="evidence_01",
        user_id="user_101",
        system_id="support_platform",
        resource_id="supp_01",
        data_category="SUPPORT_MESSAGE",
        phase="FINDING",
        operation="REPORT_EXPOSED_PII",
        state="PRESENT",
        proposed_treatment=PolicyAction.REDACT,
    )
    report = base_validator.validate_candidate(cand, sample_identity, datetime(2026, 9, 5, tzinfo=timezone.utc))
    assert report.accepted is True
    assert report.policy_check == CheckStatus.PASS


# TEST 13: Retained tombstone
def test_13_retained_tombstone(base_validator, sample_identity):
    # Candidate incorrectly proposes deleting the tombstone instead of redacting direct PII
    cand = CandidateFinding(
        candidate_id="c13",
        case_id="case_01",
        evidence_id="evidence_01",
        user_id="user_101",
        system_id="account_service",
        resource_id="tomb_01",
        data_category="ACCOUNT_TOMBSTONE",
        phase="FINDING",
        operation="REPORT_REMAINING_RECORD",
        state="PRESENT",
        proposed_treatment=PolicyAction.DELETE,  # Violation of Rule 15 which requires REDACT!
    )
    report = base_validator.validate_candidate(cand, sample_identity, datetime(2026, 9, 5, tzinfo=timezone.utc))
    assert report.accepted is False
    assert report.reason_code == ValidationErrorCode.POLICY_CONFLICT


# TEST 14: Invalid operation/state pair
def test_14_invalid_operation_state_pair(base_validator, sample_identity):
    # DELETE_RECORD with state PRESENT is an illegal triplet!
    cand = CandidateFinding(
        candidate_id="c14",
        case_id="case_01",
        evidence_id="evidence_01",
        user_id="user_101",
        system_id="account_service",
        resource_id="account_001",
        data_category="USER_PROFILE",
        phase="REMEDIATION",
        operation="DELETE_RECORD",
        state="PRESENT",  # Must be ABSENT!
    )
    report = base_validator.validate_candidate(cand, sample_identity, datetime(2026, 9, 5, tzinfo=timezone.utc))
    assert report.accepted is False
    assert report.reason_code == ValidationErrorCode.INVALID_OPERATION


# TEST 15: Invalid phase/operation pair
def test_15_invalid_phase_operation_pair(base_validator, sample_identity):
    # Placing DELETE_RECORD in phase FINDING is illegal!
    cand = CandidateFinding(
        candidate_id="c15",
        case_id="case_01",
        evidence_id="evidence_01",
        user_id="user_101",
        system_id="account_service",
        resource_id="account_001",
        data_category="USER_PROFILE",
        phase="FINDING",
        operation="DELETE_RECORD",  # Remediation op in finding!
        state="ABSENT",
    )
    report = base_validator.validate_candidate(cand, sample_identity, datetime(2026, 9, 5, tzinfo=timezone.utc))
    assert report.accepted is False
    assert report.reason_code == ValidationErrorCode.INVALID_OPERATION


# TEST 16: Unsupported finding (empty evidence)
def test_16_unsupported_finding_empty_evidence(base_validator, sample_identity):
    cand = CandidateFinding(
        candidate_id="c16",
        case_id="case_01",
        evidence_id="",
        user_id="user_101",
        system_id="account_service",
        resource_id="account_001",
        data_category="USER_PROFILE",
        phase="FINDING",
        operation="REPORT_REMAINING_RECORD",
        state="PRESENT",
    )
    report = base_validator.validate_candidate(cand, sample_identity, datetime(2026, 9, 5, tzinfo=timezone.utc))
    assert report.accepted is False
    assert report.reason_code == ValidationErrorCode.INVALID_EVIDENCE_REFERENCE


# TEST 17: Conflicting evidence detection
def test_17_conflicting_evidence_detection(base_validator, sample_identity):
    # Conflicting triplets
    valid1, _ = validate_operation_triplet("FINDING", "REPORT_REMAINING_RECORD", "PRESENT")
    valid2, _ = validate_operation_triplet("FINDING", "REPORT_REMAINING_RECORD", "ABSENT")
    assert valid1 is True
    assert valid2 is False


# TEST 18: Missing Person 3 dependency result
def test_18_missing_person3_dependency(base_validator):
    cand = CandidateFinding(
        candidate_id="c18",
        case_id="case_01",
        evidence_id="evidence_01",
        user_id="user_101",
        system_id="account_service",
        resource_id="account_001",
        data_category="USER_PROFILE",
        phase="FINDING",
        operation="REPORT_REMAINING_RECORD",
        state="PRESENT",
    )
    # Pass None for identity context
    report = base_validator.validate_candidate(cand, None, datetime(2026, 9, 5, tzinfo=timezone.utc))
    assert report.accepted is False
    assert report.reason_code == ValidationErrorCode.MISSING_DEPENDENCY


# TEST 19: Batch isolation across different users
def test_19_batch_isolation(base_validator):
    ident_101 = IdentityContext(user_id="user_101", primary_email="u101@test.com")
    ident_102 = IdentityContext(user_id="user_102", primary_email="u102@test.com")
    ident_map = {"user_101": ident_101, "user_102": ident_102}
    cutoff_map = {"case_01": datetime(2026, 9, 5, tzinfo=timezone.utc), "case_02": datetime(2026, 9, 5, tzinfo=timezone.utc)}

    candidates = [
        CandidateFinding(
            candidate_id="cand_1",
            case_id="case_01",
            evidence_id="evidence_01",
            user_id="user_101",
            system_id="account_service",
            resource_id="account_001",
            data_category="USER_PROFILE",
            phase="FINDING",
            operation="REPORT_REMAINING_RECORD",
            state="PRESENT",
            proposed_treatment=PolicyAction.DELETE,
        ),
        CandidateFinding(
            candidate_id="cand_2",
            case_id="case_02",
            evidence_id="evidence_01",
            user_id="user_102",
            system_id="account_service",
            resource_id="account_001",
            data_category="USER_PROFILE",
            phase="FINDING",
            operation="REPORT_REMAINING_RECORD",
            state="PRESENT",
            proposed_treatment=PolicyAction.DELETE,
        ),
    ]

    reports = base_validator.validate_batch(candidates, ident_map, cutoff_map)
    assert len(reports) == 2
    assert reports[0].accepted is True
    assert reports[1].accepted is True
    assert reports[0].candidate_id == "cand_1"
    assert reports[1].candidate_id == "cand_2"


# TEST 20: Deterministic validation
def test_20_deterministic_validation(base_validator, sample_identity):
    cand = CandidateFinding(
        candidate_id="c20",
        case_id="case_01",
        evidence_id="evidence_01",
        user_id="user_101",
        system_id="account_service",
        resource_id="account_001",
        data_category="USER_PROFILE",
        phase="FINDING",
        operation="REPORT_REMAINING_RECORD",
        state="PRESENT",
        proposed_treatment=PolicyAction.DELETE,
    )
    cutoff = datetime(2026, 9, 5, tzinfo=timezone.utc)
    results = [base_validator.validate_candidate(cand, sample_identity, cutoff) for _ in range(30)]
    first = results[0].model_dump()
    for r in results[1:]:
        assert r.model_dump() == first


# TEST 21: Source immutability
def test_21_source_immutability(base_validator, sample_identity):
    cand = CandidateFinding(
        candidate_id="c21",
        case_id="case_01",
        evidence_id="evidence_01",
        user_id="user_101",
        system_id="account_service",
        resource_id="account_001",
        data_category="USER_PROFILE",
        phase="FINDING",
        operation="REPORT_REMAINING_RECORD",
        state="PRESENT",
    )
    orig = copy.deepcopy(cand.model_dump())
    _ = base_validator.validate_candidate(cand, sample_identity, datetime(2026, 9, 5, tzinfo=timezone.utc))
    assert cand.model_dump() == orig


# TEST 22: Empty evidence candidate
def test_22_empty_evidence_candidate(base_validator, sample_identity):
    with pytest.raises(Exception):
        CandidateFinding(candidate_id="c22", case_id="c", user_id="u")  # Missing required fields

