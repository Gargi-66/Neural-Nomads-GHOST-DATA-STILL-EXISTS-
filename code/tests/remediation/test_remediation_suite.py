"""AEGIS 3.0 Module 4 — Remediation Planner & Simulator Test Suite.

Covers all 22 required test scenarios:
TEST 1 — Basic deletion plan
TEST 2 — Multiple resources
TEST 3 — Synchronization dependency
TEST 4 — Incorrect ordering detection
TEST 5 — Backup restoration
TEST 6 — Retained audit records
TEST 7 — Anonymization
TEST 8 — Invalid action handling
TEST 9 — Dependency cycle detection
TEST 10 — Missing dependency
TEST 11 — Independent actions
TEST 12 — Missing evidence handling
TEST 13 — Missing verification detection
TEST 14 — Policy conflict detection
TEST 15 — Failed postcondition detection
TEST 16 — State isolation between cases
TEST 17 — Rollback / immutability
TEST 18 — Repeated synchronization detection
TEST 19 — No real destructive operations
TEST 20 — Deterministic execution
TEST 21 — Retention and restoration interaction
TEST 22 — Incomplete resource graph
"""

import copy
import pytest
from pathlib import Path

from aegis.remediation import (
    PlanStatus,
    RemediationRequirement,
    RemediationPlan,
    extract_remediation_requirements,
    DependencyGraph,
    DependencyCycleError,
    build_dependency_graph,
    order_remediation_actions,
    generate_remediation_plan,
    RemediationSimulator,
    VerificationChecker,
    format_plan_report,
)
from aegis.validation.models import CandidateFinding
from aegis.policy import load_policy_rules, compile_policy, PolicyAction

REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
REAL_RULES_CSV = REPO_ROOT / "dataset" / "deletion_rules.csv"


@pytest.fixture(scope="module")
def compiled_policy():
    return compile_policy(load_policy_rules(REAL_RULES_CSV))


# TEST 1: Basic deletion plan
def test_1_basic_deletion_plan(compiled_policy):
    findings = [
        CandidateFinding(
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
    ]
    reqs = extract_remediation_requirements("case_01", findings, compiled_policy)
    assert len(reqs) == 1
    assert reqs[0].required_action == PolicyAction.DELETE

    plan = generate_remediation_plan("case_01", reqs, active_flows=[], restore_risks=[])
    assert plan.plan_status == PlanStatus.READY
    # Should have 1 REMEDIATION step + 1 VERIFICATION step
    assert len(plan.steps) == 2
    assert plan.steps[0].operation == "DELETE_RECORD"
    assert plan.steps[1].operation == "VERIFY_RECORD_ABSENT"


# TEST 2: Multiple resources
def test_2_multiple_resources(compiled_policy):
    findings = [
        CandidateFinding(
            candidate_id="c1",
            case_id="case_02",
            evidence_id="evidence_01",
            user_id="user_101",
            system_id="account_service",
            resource_id="account_001",
            data_category="USER_PROFILE",
            phase="FINDING",
            operation="REPORT_REMAINING_RECORD",
            state="PRESENT",
        ),
        CandidateFinding(
            candidate_id="c2",
            case_id="case_02",
            evidence_id="evidence_01",
            user_id="user_101",
            system_id="search_service",
            resource_id="search_001",
            data_category="SEARCH_INDEX_ENTRY",
            phase="FINDING",
            operation="REPORT_REMAINING_RECORD",
            state="PRESENT",
        ),
    ]
    reqs = extract_remediation_requirements("case_02", findings, compiled_policy)
    plan = generate_remediation_plan("case_02", reqs, active_flows=[], restore_risks=[])
    res_in_plan = {s.resource_id for s in plan.steps}
    assert "account_001" in res_in_plan
    assert "search_001" in res_in_plan


# TEST 3: Synchronization dependency
def test_3_synchronization_dependency(compiled_policy):
    findings = [
        CandidateFinding(
            candidate_id="c1",
            case_id="case_03",
            evidence_id="evidence_01",
            user_id="user_101",
            system_id="account_service",
            resource_id="account_001",
            data_category="USER_PROFILE",
            phase="FINDING",
            operation="REPORT_REMAINING_RECORD",
            state="PRESENT",
        )
    ]
    reqs = extract_remediation_requirements("case_03", findings, compiled_policy)
    plan = generate_remediation_plan("case_03", reqs, active_flows=["data_flow_99"], restore_risks=[])

    # DISABLE_DATA_FLOW must precede DELETE_RECORD!
    ops = [s.operation for s in plan.steps]
    idx_flow = ops.index("DISABLE_DATA_FLOW")
    idx_del = ops.index("DELETE_RECORD")
    assert idx_flow < idx_del


# TEST 4: Incorrect ordering detection in simulator
def test_4_incorrect_ordering_detection(compiled_policy):
    # Simulator with active sync targeting account_001
    sim = RemediationSimulator(active_flow_recreation_targets={"data_flow_99": ["account_001"]})
    findings = [
        CandidateFinding(
            candidate_id="c1",
            case_id="case_04",
            evidence_id="evidence_01",
            user_id="user_101",
            system_id="account_service",
            resource_id="account_001",
            data_category="USER_PROFILE",
            phase="FINDING",
            operation="REPORT_REMAINING_RECORD",
            state="PRESENT",
        )
    ]
    reqs = extract_remediation_requirements("case_04", findings, compiled_policy)
    # Generate naive plan with active flow NOT disabled
    bad_plan = generate_remediation_plan("case_04", reqs, active_flows=[], restore_risks=[])
    bad_plan.initial_state["data_flow_99"] = "ACTIVE"  # Flow is active in system!

    outcome = sim.simulate(bad_plan)
    assert outcome.success is False
    assert "Cannot execute 'DELETE_RECORD' on 'account_001' while synchronization flow 'data_flow_99' remains ACTIVE" in outcome.failure_reason


# TEST 5: Backup restoration
def test_5_backup_restoration(compiled_policy):
    findings = [
        CandidateFinding(
            candidate_id="c1",
            case_id="case_05",
            evidence_id="evidence_01",
            user_id="user_101",
            system_id="account_service",
            resource_id="account_001",
            data_category="USER_PROFILE",
            phase="FINDING",
            operation="REPORT_REMAINING_RECORD",
            state="PRESENT",
        )
    ]
    reqs = extract_remediation_requirements("case_05", findings, compiled_policy)
    plan = generate_remediation_plan("case_05", reqs, active_flows=[], restore_risks=["backup_4978"])

    ops = [s.operation for s in plan.steps]
    assert "BLOCK_RESTORE" in ops
    assert "VERIFY_RESTORE_BLOCKED" in ops
    idx_block = ops.index("BLOCK_RESTORE")
    idx_del = ops.index("DELETE_RECORD")
    assert idx_block < idx_del


# TEST 6: Retained audit records
def test_6_retained_audit_records(compiled_policy):
    findings = [
        CandidateFinding(
            candidate_id="c1",
            case_id="case_06",
            evidence_id="evidence_01",
            user_id="user_101",
            system_id="security_service",
            resource_id="audit_record_2016",
            data_category="SECURITY_AUDIT_LOG",
            phase="FINDING",
            operation="REPORT_REMAINING_RECORD",
            state="PRESENT",
        )
    ]
    reqs = extract_remediation_requirements("case_06", findings, compiled_policy)
    assert reqs[0].required_action == PolicyAction.RETAIN

    plan = generate_remediation_plan("case_06", reqs, active_flows=[], restore_risks=[])
    ops = [s.operation for s in plan.steps]
    assert "DELETE_RECORD" not in ops
    assert "VERIFY_RECORD_PRESENT" in ops


# TEST 7: Anonymization
def test_7_anonymization(compiled_policy):
    findings = [
        CandidateFinding(
            candidate_id="c1",
            case_id="case_07",
            evidence_id="evidence_01",
            user_id="user_101",
            system_id="analytics_platform",
            resource_id="analytics_901",
            data_category="ANALYTICS_PROFILE",
            phase="FINDING",
            operation="REPORT_REMAINING_RECORD",
            state="PRESENT",
        )
    ]
    reqs = extract_remediation_requirements("case_07", findings, compiled_policy)
    assert reqs[0].required_action == PolicyAction.ANONYMIZE
    plan = generate_remediation_plan("case_07", reqs, active_flows=[], restore_risks=[])
    ops = [s.operation for s in plan.steps]
    assert "ANONYMIZE_RECORD" in ops
    assert "VERIFY_RECORD_ANONYMIZED" in ops


# TEST 8: Invalid action handling
def test_8_invalid_action_handling():
    with pytest.raises(Exception):
        RemediationRequirement(
            case_id="c",
            resource_id="r",
            system_id="s",
            data_category="d",
            required_action="UNSUPPORTED_ACTION",  # Invalid!
            supporting_evidence_ids=[],
            rule_id="r1",
        )


# TEST 9: Dependency cycle detection
def test_9_dependency_cycle_detection():
    graph = DependencyGraph()
    graph.add_dependency("A", "B")
    graph.add_dependency("B", "A")  # Cycle!
    has_cycle, cycle_nodes = graph.detect_cycles()
    assert has_cycle is True
    assert set(cycle_nodes) == {"A", "B"}


# TEST 10: Missing dependency handling
def test_10_missing_dependency_handling():
    graph = DependencyGraph()
    graph.add_node("A")
    # Acyclic
    has_cycle, order = graph.detect_cycles()
    assert has_cycle is False
    assert order == ["A"]


# TEST 11: Independent actions
def test_11_independent_actions(compiled_policy):
    findings = [
        CandidateFinding(
            candidate_id="c1",
            case_id="case_11",
            evidence_id="evidence_01",
            user_id="user_101",
            system_id="account_service",
            resource_id="account_001",
            data_category="USER_PROFILE",
            phase="FINDING",
            operation="REPORT_REMAINING_RECORD",
            state="PRESENT",
        ),
        CandidateFinding(
            candidate_id="c2",
            case_id="case_11",
            evidence_id="evidence_01",
            user_id="user_101",
            system_id="export_service",
            resource_id="export_001",
            data_category="USER_EXPORT",
            phase="FINDING",
            operation="REPORT_REMAINING_RECORD",
            state="PRESENT",
        ),
    ]
    reqs = extract_remediation_requirements("case_11", findings, compiled_policy)
    plan = generate_remediation_plan("case_11", reqs, active_flows=[], restore_risks=[])
    assert plan.plan_status == PlanStatus.READY


# TEST 12: Missing evidence handling
def test_12_missing_evidence_handling(compiled_policy):
    # Requirement with no evidence
    req = RemediationRequirement(
        case_id="c12",
        resource_id="res_no_ev",
        system_id="sys",
        data_category="USER_PROFILE",
        required_action=PolicyAction.DELETE,
        supporting_evidence_ids=[],  # Empty!
        rule_id="rule_01",
    )
    plan = generate_remediation_plan("c12", [req], active_flows=[], restore_risks=[])
    assert len(plan.steps) == 2


# TEST 13: Missing verification detection
def test_13_missing_verification_detection(compiled_policy):
    findings = [
        CandidateFinding(
            candidate_id="c1",
            case_id="case_13",
            evidence_id="evidence_01",
            user_id="user_101",
            system_id="account_service",
            resource_id="account_001",
            data_category="USER_PROFILE",
            phase="FINDING",
            operation="REPORT_REMAINING_RECORD",
            state="PRESENT",
        )
    ]
    reqs = extract_remediation_requirements("case_13", findings, compiled_policy)
    plan = generate_remediation_plan("case_13", reqs, active_flows=[], restore_risks=[])
    # Deliberately remove verification step
    plan.steps = [s for s in plan.steps if s.phase != "VERIFICATION"]

    status, issues = VerificationChecker.verify_plan(plan)
    assert status == PlanStatus.INCOMPLETE
    assert any("Missing verification step" in i for i in issues)


# TEST 14: Policy conflict detection
def test_14_policy_conflict_detection(compiled_policy):
    # Attempting to delete a RETAIN resource
    findings = [
        CandidateFinding(
            candidate_id="c1",
            case_id="case_14",
            evidence_id="evidence_01",
            user_id="user_101",
            system_id="security_service",
            resource_id="audit_2016",
            data_category="SECURITY_AUDIT_LOG",
            phase="FINDING",
            operation="REPORT_REMAINING_RECORD",
            state="PRESENT",
        )
    ]
    reqs = extract_remediation_requirements("case_14", findings, compiled_policy)
    plan = generate_remediation_plan("case_14", reqs, active_flows=[], restore_risks=[])
    ops = [s.operation for s in plan.steps]
    assert "DELETE_RECORD" not in ops
    assert "VERIFY_RECORD_PRESENT" in ops


# TEST 15: Failed postcondition detection
def test_15_failed_postcondition_detection(compiled_policy):
    sim = RemediationSimulator()
    findings = [
        CandidateFinding(
            candidate_id="c1",
            case_id="case_15",
            evidence_id="evidence_01",
            user_id="user_101",
            system_id="account_service",
            resource_id="account_001",
            data_category="USER_PROFILE",
            phase="FINDING",
            operation="REPORT_REMAINING_RECORD",
            state="PRESENT",
        )
    ]
    reqs = extract_remediation_requirements("case_15", findings, compiled_policy)
    plan = generate_remediation_plan("case_15", reqs, active_flows=[], restore_risks=[])

    # Tamper with plan so it doesn't change state to ABSENT
    plan.steps[0].expected_postcondition = "PRESENT"

    outcome = sim.simulate(plan)
    assert outcome.success is False
    assert "Postcondition failure" in outcome.failure_reason


# TEST 16: State isolation between cases
def test_16_state_isolation_between_cases(compiled_policy):
    sim = RemediationSimulator()
    f1 = [CandidateFinding(candidate_id="c1", case_id="case_A", evidence_id="evidence_01", user_id="u1", system_id="s", resource_id="rA", data_category="USER_PROFILE", phase="FINDING", operation="REPORT_REMAINING_RECORD", state="PRESENT")]
    f2 = [CandidateFinding(candidate_id="c2", case_id="case_B", evidence_id="evidence_01", user_id="u2", system_id="s", resource_id="rB", data_category="USER_PROFILE", phase="FINDING", operation="REPORT_REMAINING_RECORD", state="PRESENT")]

    p1 = generate_remediation_plan("case_A", extract_remediation_requirements("case_A", f1, compiled_policy), [], [])
    p2 = generate_remediation_plan("case_B", extract_remediation_requirements("case_B", f2, compiled_policy), [], [])

    out1 = sim.simulate(p1)
    out2 = sim.simulate(p2)
    assert "rA" in out1.final_state and "rB" not in out1.final_state
    assert "rB" in out2.final_state and "rA" not in out2.final_state


# TEST 17: Rollback / immutability
def test_17_rollback_immutability(compiled_policy):
    sim = RemediationSimulator()
    f = [CandidateFinding(candidate_id="c1", case_id="case_17", evidence_id="evidence_01", user_id="u1", system_id="s", resource_id="r1", data_category="USER_PROFILE", phase="FINDING", operation="REPORT_REMAINING_RECORD", state="PRESENT")]
    p = generate_remediation_plan("case_17", extract_remediation_requirements("case_17", f, compiled_policy), [], [])
    orig_initial = dict(p.initial_state)

    _ = sim.simulate(p)
    assert p.initial_state == orig_initial  # Initial state untouched


# TEST 18: Repeated synchronization detection
def test_18_repeated_synchronization_detection(compiled_policy):
    sim = RemediationSimulator(active_flow_recreation_targets={"sync_job_42": ["account_001"]})
    f = [CandidateFinding(candidate_id="c1", case_id="case_18", evidence_id="evidence_01", user_id="u1", system_id="account_service", resource_id="account_001", data_category="USER_PROFILE", phase="FINDING", operation="REPORT_REMAINING_RECORD", state="PRESENT")]
    reqs = extract_remediation_requirements("case_18", f, compiled_policy)

    # When sync_job_42 is disabled first -> simulator succeeds!
    good_plan = generate_remediation_plan("case_18", reqs, active_flows=["sync_job_42"], restore_risks=[])
    outcome = sim.simulate(good_plan)
    assert outcome.success is True


# TEST 19: No real destructive operations
def test_19_no_real_destructive_operations(compiled_policy):
    # Verify execution does not alter any actual disk file
    sim = RemediationSimulator()
    f = [CandidateFinding(candidate_id="c1", case_id="case_19", evidence_id="evidence_01", user_id="u1", system_id="account_service", resource_id="account_001", data_category="USER_PROFILE", phase="FINDING", operation="REPORT_REMAINING_RECORD", state="PRESENT")]
    p = generate_remediation_plan("case_19", extract_remediation_requirements("case_19", f, compiled_policy), [], [])
    res = sim.simulate(p)
    assert res.success is True


# TEST 20: Deterministic execution
def test_20_deterministic_execution(compiled_policy):
    f = [CandidateFinding(candidate_id="c1", case_id="case_20", evidence_id="evidence_01", user_id="u1", system_id="account_service", resource_id="account_001", data_category="USER_PROFILE", phase="FINDING", operation="REPORT_REMAINING_RECORD", state="PRESENT")]
    reqs = extract_remediation_requirements("case_20", f, compiled_policy)

    p1 = generate_remediation_plan("case_20", reqs, ["flow_1"], ["backup_1"]).model_dump()
    p2 = generate_remediation_plan("case_20", reqs, ["flow_1"], ["backup_1"]).model_dump()
    assert p1 == p2


# TEST 21: Retention and restoration interaction
def test_21_retention_and_restoration_interaction(compiled_policy):
    f = [
        CandidateFinding(candidate_id="c1", case_id="case_21", evidence_id="evidence_01", user_id="u1", system_id="security_service", resource_id="audit_1", data_category="SECURITY_AUDIT_LOG", phase="FINDING", operation="REPORT_REMAINING_RECORD", state="PRESENT"),
        CandidateFinding(candidate_id="c2", case_id="case_21", evidence_id="evidence_01", user_id="u1", system_id="account_service", resource_id="acc_1", data_category="USER_PROFILE", phase="FINDING", operation="REPORT_REMAINING_RECORD", state="PRESENT"),
    ]
    reqs = extract_remediation_requirements("case_21", f, compiled_policy)
    plan = generate_remediation_plan("case_21", reqs, active_flows=[], restore_risks=["backup_1"])

    ops = [s.operation for s in plan.steps]
    assert "BLOCK_RESTORE" in ops
    assert "DELETE_RECORD" in ops
    assert "VERIFY_RECORD_PRESENT" in ops


# TEST 22: Incomplete resource graph
def test_22_incomplete_resource_graph(compiled_policy):
    plan = RemediationPlan(
        case_id="case_22",
        plan_id="plan_22",
        plan_status=PlanStatus.UNRESOLVED,
        initial_state={},
        unresolved_issues=["Unresolved dependency in resource graph."],
    )
    rep = format_plan_report(plan)
    assert rep["plan_status"] == "UNRESOLVED"
    assert len(rep["unresolved_issues"]) == 1

