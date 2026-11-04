"""Comprehensive test suite for AEGIS Module 5 - Evaluation & Adversarial Testing."""

from datetime import datetime, timezone
import json
import pytest
from aegis.evaluation.dataset_manager import EvaluationDatasetManager
from aegis.evaluation.comparator import FieldComparisonEngine
from aegis.evaluation.adversarial import AdversarialTestGenerator
from aegis.evaluation.disagreement import DisagreementAnalyzer
from aegis.evaluation.regression import RegressionEngine, RegressionFixture
from aegis.evaluation.reporter import EvaluationReportGenerator
from aegis.evaluation.models import FailureCategory, MutationType


@pytest.fixture
def dataset_mgr():
    return EvaluationDatasetManager()


@pytest.fixture
def comparator():
    return FieldComparisonEngine()


@pytest.fixture
def adv_gen():
    return AdversarialTestGenerator()


@pytest.fixture
def diag_analyzer():
    return DisagreementAnalyzer()


@pytest.fixture
def reg_engine():
    return RegressionEngine()


@pytest.fixture
def reporter():
    return EvaluationReportGenerator()


# 1. Dataset loading tests
def test_1_dataset_loading(dataset_mgr):
    df_official = dataset_mgr.load_official_requests()
    assert len(df_official) == 518
    assert "case_id" in df_official.columns

    df_sample = dataset_mgr.load_sample_requests()
    assert len(df_sample) == 32

    gt = dataset_mgr.load_sample_ground_truth()
    assert len(gt) == 32
    assert "case_01" in gt
    assert gt["case_01"]["deletion_status"] == "COMPLETE"


# 2. Output schema validation
def test_2_fixture_schema_validation(dataset_mgr):
    import pandas as pd
    valid_df = pd.DataFrame([
        {"case_id": "case_01", "deletion_status": "COMPLETE", "steps_json": "[]"}
    ])
    errors = dataset_mgr.validate_output_schema(valid_df)
    assert len(errors) == 0

    invalid_df = pd.DataFrame([
        {"case_id": "case_01", "deletion_status": "INVALID_STATUS", "steps_json": "[]"}
    ])
    errors2 = dataset_mgr.validate_output_schema(invalid_df)
    assert len(errors2) > 0
    assert "invalid deletion_status" in errors2[0]


# 3. Exact field comparison
def test_3_exact_field_comparison(comparator):
    exp = {
        "deletion_status": "COMPLETE",
        "steps": [{"step_no": 1, "phase": "VERIFICATION", "system_id": "account_service", "resource_id": "account_001", "operation": "VERIFY_RECORD_ABSENT", "state": "ABSENT", "evidence_id": "evidence_54"}]
    }
    act = {
        "deletion_status": "COMPLETE",
        "steps": [{"step_no": 1, "phase": "VERIFICATION", "system_id": "account_service", "resource_id": "account_001", "operation": "VERIFY_RECORD_ABSENT", "state": "ABSENT", "evidence_id": "evidence_54"}]
    }
    res = comparator.compare_case("case_01", act, exp)
    assert res.exact_match is True
    assert res.status_match is True
    assert len(res.failure_categories) == 0


# 4. Missing field detection
def test_4_missing_step_detection(comparator):
    exp = {
        "deletion_status": "COMPLETE",
        "steps": [
            {"step_no": 1, "phase": "VERIFICATION", "system_id": "account_service", "resource_id": "account_001", "operation": "VERIFY_RECORD_ABSENT", "state": "ABSENT", "evidence_id": "evidence_54"},
            {"step_no": 2, "phase": "VERIFICATION", "system_id": "analytics_platform", "resource_id": "analytics_901", "operation": "VERIFY_RECORD_ANONYMIZED", "state": "ANONYMIZED", "evidence_id": "evidence_56"}
        ]
    }
    act = {
        "deletion_status": "COMPLETE",
        "steps": [
            {"step_no": 1, "phase": "VERIFICATION", "system_id": "account_service", "resource_id": "account_001", "operation": "VERIFY_RECORD_ABSENT", "state": "ABSENT", "evidence_id": "evidence_54"}
        ]
    }
    res = comparator.compare_case("case_04", act, exp)
    assert res.exact_match is False
    assert FailureCategory.VERIFICATION_OMISSION in res.failure_categories


# 5. Invalid evidence reference detection
def test_5_invalid_evidence_reference_detection(comparator):
    exp = {
        "deletion_status": "COMPLETE",
        "steps": [{"step_no": 1, "phase": "VERIFICATION", "system_id": "account_service", "resource_id": "account_001", "operation": "VERIFY_RECORD_ABSENT", "state": "ABSENT", "evidence_id": "evidence_54"}]
    }
    act = {
        "deletion_status": "COMPLETE",
        "steps": [{"step_no": 1, "phase": "VERIFICATION", "system_id": "account_service", "resource_id": "account_001", "operation": "VERIFY_RECORD_ABSENT", "state": "ABSENT", "evidence_id": "evidence_999_fake"}]
    }
    res = comparator.compare_case("case_01", act, exp)
    assert res.exact_match is False
    assert FailureCategory.INVALID_EVIDENCE_REFERENCE in res.failure_categories


# 6. Adversarial: Temporal cutoff mutation
def test_6_adversarial_cutoff_mutation(adv_gen):
    audit_at = datetime(2026, 9, 3, 11, 30, tzinfo=timezone.utc)
    mutation = adv_gen.generate_temporal_cutoff_mutation("case_01", audit_at, "evidence_54", delta_seconds=7200)
    assert mutation.expected_admissible is False
    assert mutation.expected_failure_category == FailureCategory.TEMPORAL_CUTOFF_VIOLATION
    assert mutation.mutation_type == MutationType.TEMPORAL_CUTOFF


# 7. Adversarial: Decoy evidence mutation
def test_7_adversarial_decoy_mutation(adv_gen):
    mutation = adv_gen.generate_decoy_identity_mutation("case_05", "user_05", "user_99_decoy", "evidence_54")
    assert mutation.expected_admissible is False
    assert mutation.expected_failure_category == FailureCategory.IDENTITY_RESOLUTION_FAILURE


# 8. Adversarial: Retention conflict mutation
def test_8_adversarial_retention_mutation(adv_gen):
    mutation = adv_gen.generate_retention_conflict_mutation("case_05", "audit_record_101", "SECURITY_AUDIT_LOG")
    assert mutation.expected_admissible is True
    assert mutation.expected_failure_category == FailureCategory.RETENTION_VIOLATION


# 9. Adversarial: Sync recreation scenario
def test_9_adversarial_sync_recreation(adv_gen):
    mutation = adv_gen.generate_sync_recreation_mutation("case_11", "account_service", "search_052", "data_flow_9522")
    assert mutation.expected_status == "INCOMPLETE"
    assert mutation.expected_failure_category == FailureCategory.SYNCHRONIZATION_RECREATION_RISK


# 10. Adversarial: Backup restoration scenario
def test_10_adversarial_backup_restoration(adv_gen):
    mutation = adv_gen.generate_backup_restoration_mutation("case_09", "backup_4978", "account_3960")
    assert mutation.expected_status == "INCOMPLETE"
    assert mutation.expected_failure_category == FailureCategory.BACKUP_RESTORATION_RISK


# 11. Adversarial: Hallucinated evidence reference
def test_11_adversarial_hallucinated_reference(adv_gen):
    mutation = adv_gen.generate_hallucinated_reference_mutation("case_01", "evidence_invented_by_llm")
    assert mutation.expected_admissible is False
    assert mutation.expected_failure_category == FailureCategory.HALLUCINATED_EVIDENCE_REFERENCE


# 12. Disagreement analyzer: evidence admissibility discrepancy
def test_12_disagreement_evidence_admissibility(diag_analyzer):
    item = diag_analyzer.check_evidence_admissibility_disagreement(
        case_id="case_01",
        evidence_id="evidence_54",
        deterministic_admissible=False,
        llm_accepted=True,
    )
    assert item is not None
    assert item.requires_review is True
    assert diag_analyzer.get_unresolved_count() == 1


# 13. Disagreement analyzer: policy treatment conflict
def test_13_disagreement_policy_treatment(diag_analyzer):
    item = diag_analyzer.check_policy_treatment_disagreement(
        case_id="case_03",
        resource_id="audit_record_2016",
        deterministic_action="RETAIN",
        llm_proposed_action="DELETE",
        rule_id="rule_12",
    )
    assert item is not None
    assert item.decision_type == "POLICY_TREATMENT"
    assert item.deterministic_verdict == "RETAIN"
    assert item.llm_verdict == "DELETE"


# 14. Disagreement analyzer adjudication
def test_14_disagreement_adjudication(diag_analyzer):
    diag_analyzer.check_policy_treatment_disagreement(
        case_id="case_03",
        resource_id="audit_record_2016",
        deterministic_action="RETAIN",
        llm_proposed_action="DELETE",
    )
    assert diag_analyzer.get_unresolved_count() >= 1
    success = diag_analyzer.adjudicate_item(0, "Deterministic policy Rule 12 is authoritative.", upheld_deterministic=True)
    assert success is True
    assert diag_analyzer.review_queue[0].adjudicated is True
    assert diag_analyzer.get_unresolved_count() == 0


# 15. Regression engine: replay all standard fixtures
def test_15_regression_engine_replay_all(reg_engine):
    def mock_runner(fixture: RegressionFixture) -> bool:
        if fixture.fixture_id == "REG-01-HISTORICAL-EMAIL":
            return fixture.payload.get("expected_user_id") == fixture.expected_result
        elif fixture.fixture_id == "REG-02-POST-AUDIT-REJECTION":
            return fixture.payload["evidence_captured_at"] > fixture.payload["audit_at"] and fixture.expected_result is False
        elif fixture.fixture_id == "REG-03-AUDIT-LOG-RETENTION":
            return fixture.payload["category"] == "SECURITY_AUDIT_LOG" and fixture.expected_result == "RETAIN"
        elif fixture.fixture_id == "REG-04-SYNC-ORDERING":
            return fixture.expected_result[0] == "DISABLE_DATA_FLOW"
        return False

    results = reg_engine.replay_all(mock_runner)
    assert len(results) >= 4
    assert all(results.values())


# 16. Evaluation report generator: metrics computation
def test_16_report_metrics_computation(reporter, comparator):
    exp = {
        "deletion_status": "COMPLETE",
        "steps": [{"step_no": 1, "phase": "VERIFICATION", "system_id": "account_service", "resource_id": "account_001", "operation": "VERIFY_RECORD_ABSENT", "state": "ABSENT", "evidence_id": "evidence_54"}]
    }
    act = {
        "deletion_status": "COMPLETE",
        "steps": [{"step_no": 1, "phase": "VERIFICATION", "system_id": "account_service", "resource_id": "account_001", "operation": "VERIFY_RECORD_ABSENT", "state": "ABSENT", "evidence_id": "evidence_54"}]
    }
    res = comparator.compare_case("case_01", act, exp)
    metrics = reporter.compute_metrics([res], unresolved_disagreements=0)
    assert metrics.total_cases_evaluated == 1
    assert metrics.passed_cases == 1
    assert metrics.exact_match_rate == 1.0
    assert metrics.field_level_accuracy == 1.0


# 17. Evaluation report generator: markdown report generation
def test_17_markdown_report_generation(reporter, comparator):
    exp = {
        "deletion_status": "COMPLETE",
        "steps": [{"step_no": 1, "phase": "VERIFICATION", "system_id": "account_service", "resource_id": "account_001", "operation": "VERIFY_RECORD_ABSENT", "state": "ABSENT", "evidence_id": "evidence_54"}]
    }
    act = {
        "deletion_status": "COMPLETE",
        "steps": [{"step_no": 1, "phase": "VERIFICATION", "system_id": "account_service", "resource_id": "account_001", "operation": "VERIFY_RECORD_ABSENT", "state": "ABSENT", "evidence_id": "evidence_54"}]
    }
    res = comparator.compare_case("case_01", act, exp)
    metrics = reporter.compute_metrics([res])
    md = reporter.generate_markdown_report(metrics, [res])
    assert "AEGIS 3.0 — Evaluation & Adversarial Verification Report" in md
    assert "Participant-Created Custom Evaluation Cases" in md
    assert "Exact-Match Success Cases" in md


# 18. Cross-case isolation in comparison engine
def test_18_cross_case_isolation(comparator):
    exp1 = {"deletion_status": "COMPLETE", "steps": []}
    act1 = {"deletion_status": "INCOMPLETE", "steps": []}
    res1 = comparator.compare_case("case_01", act1, exp1)

    exp2 = {"deletion_status": "COMPLETE", "steps": []}
    act2 = {"deletion_status": "COMPLETE", "steps": []}
    res2 = comparator.compare_case("case_02", act2, exp2)

    assert res1.exact_match is False
    assert res2.exact_match is True
    assert len(res2.failure_categories) == 0


# 19. Repeated deterministic execution
def test_19_repeated_deterministic_execution(comparator):
    exp = {
        "deletion_status": "COMPLETE",
        "steps": [{"step_no": 1, "phase": "VERIFICATION", "system_id": "account_service", "resource_id": "account_001", "operation": "VERIFY_RECORD_ABSENT", "state": "ABSENT", "evidence_id": "evidence_54"}]
    }
    act = {
        "deletion_status": "COMPLETE",
        "steps": [{"step_no": 1, "phase": "VERIFICATION", "system_id": "account_service", "resource_id": "account_001", "operation": "VERIFY_RECORD_ABSENT", "state": "ABSENT", "evidence_id": "evidence_54"}]
    }
    res_a = comparator.compare_case("case_01", act, exp)
    res_b = comparator.compare_case("case_01", act, exp)
    assert res_a.exact_match == res_b.exact_match
    assert res_a.step_count_actual == res_b.step_count_actual


# 20. Output contract compatibility (NOT_APPLICABLE check)
def test_20_not_applicable_contract(dataset_mgr):
    import pandas as pd
    valid_na = pd.DataFrame([
        {"case_id": "case_99", "deletion_status": "NOT_APPLICABLE", "steps_json": "[]"}
    ])
    errs = dataset_mgr.validate_output_schema(valid_na)
    assert len(errs) == 0

    invalid_na = pd.DataFrame([
        {"case_id": "case_99", "deletion_status": "NOT_APPLICABLE", "steps_json": "[{\"step_no\": 1}]"}
    ])
    errs2 = dataset_mgr.validate_output_schema(invalid_na)
    assert len(errs2) == 1
    assert "NOT_APPLICABLE must have steps_json=[]" in errs2[0]

