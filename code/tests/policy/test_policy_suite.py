"""AEGIS 3.0 Module 1 — Automated Test Suite.

Covers all 15 required test scenarios:
1. Valid policy loading
2. Missing required column
3. Unknown treatment
4. Duplicate conflicting policies
5. DELETE treatment
6. REDACT treatment
7. ANONYMIZE treatment
8. RETAIN treatment
9. Tombstone preservation
10. Unknown resource category
11. Missing policy context
12. Deterministic execution
13. Policy conflict fail-closed
14. Unsupported identifier retention
15. No mutation of input objects
"""

import copy
import pytest
from pathlib import Path
from aegis.policy import (
    load_policy_rules,
    PolicyLoadError,
    compile_policy,
    PolicyConflictError,
    evaluate_policy,
    UnresolvedPolicyError,
    validate_policy_decision,
    PolicyValidationError,
    ResourceContext,
    PolicyAction,
    PolicyRule,
)

REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
REAL_RULES_CSV = REPO_ROOT / "dataset" / "deletion_rules.csv"


@pytest.fixture(scope="module")
def real_compiled_policy():
    """Loads and compiles real deletion_rules.csv."""
    rules = load_policy_rules(REAL_RULES_CSV)
    return compile_policy(rules)


# Test 1: Valid policy loading
def test_1_valid_policy_loading(real_compiled_policy):
    assert len(real_compiled_policy) == 15
    rules = real_compiled_policy.get_rules_for_category("USER_PROFILE")
    assert len(rules) == 1
    assert rules[0].required_action == PolicyAction.DELETE
    assert rules[0].rule_id == "rule_01"


# Test 2: Missing required column
def test_2_missing_required_column(tmp_path):
    bad_csv = tmp_path / "bad_rules.csv"
    bad_csv.write_text("rule_id,data_category,condition\nrule_01,USER_PROFILE,Always\n", encoding="utf-8")
    with pytest.raises(PolicyLoadError, match="Missing required columns"):
        load_policy_rules(bad_csv)


# Test 3: Unknown treatment
def test_3_unknown_treatment(tmp_path):
    bad_csv = tmp_path / "bad_action.csv"
    bad_csv.write_text(
        "rule_id,data_category,condition,required_action\nrule_01,USER_PROFILE,Always,OBLITERATE\n",
        encoding="utf-8",
    )
    with pytest.raises(PolicyLoadError, match="Unsupported treatment value 'OBLITERATE'"):
        load_policy_rules(bad_csv)


# Test 4: Duplicate conflicting policies (duplicate rule_id)
def test_4_duplicate_conflicting_policies(tmp_path):
    dup_csv = tmp_path / "dup_rules.csv"
    dup_csv.write_text(
        "rule_id,data_category,condition,required_action\n"
        "rule_01,USER_PROFILE,Always,DELETE\n"
        "rule_01,USER_PROFILE,Always,REDACT\n",
        encoding="utf-8",
    )
    with pytest.raises(PolicyLoadError, match="Duplicate rule_id detected: rule_01"):
        load_policy_rules(dup_csv)


# Test 5: DELETE treatment
def test_5_delete_treatment(real_compiled_policy):
    res = ResourceContext(
        resource_id="account_001",
        system_id="account_service",
        data_category="USER_PROFILE",
        present_identifiers=["name", "email"],
    )
    dec = evaluate_policy(res, real_compiled_policy)
    assert dec.required_action == PolicyAction.DELETE
    assert dec.rule_id == "rule_01"
    assert validate_policy_decision(dec, real_compiled_policy) is True


# Test 6: REDACT treatment
def test_6_redact_treatment(real_compiled_policy):
    res = ResourceContext(
        resource_id="support_4185",
        system_id="support_platform",
        data_category="SUPPORT_MESSAGE",
        is_shared_context=True,
        present_identifiers=["email", "order_id"],
    )
    dec = evaluate_policy(res, real_compiled_policy)
    assert dec.required_action == PolicyAction.REDACT
    assert dec.rule_id == "rule_05"
    assert "email" in dec.prohibited_identifiers


# Test 7: ANONYMIZE treatment
def test_7_anonymize_treatment(real_compiled_policy):
    res = ResourceContext(
        resource_id="analytics_901",
        system_id="analytics_platform",
        data_category="ANALYTICS_PROFILE",
        is_attributable=True,
        present_identifiers=["user_id"],
    )
    dec = evaluate_policy(res, real_compiled_policy)
    assert dec.required_action == PolicyAction.ANONYMIZE
    assert dec.rule_id == "rule_07"


# Test 8: RETAIN treatment
def test_8_retain_treatment(real_compiled_policy):
    res = ResourceContext(
        resource_id="audit_record_2016",
        system_id="security_service",
        data_category="SECURITY_AUDIT_LOG",
        within_retention_period=True,
        present_identifiers=["audit_id", "user_id"],
    )
    dec = evaluate_policy(res, real_compiled_policy)
    assert dec.required_action == PolicyAction.RETAIN
    assert dec.rule_id == "rule_12"
    assert dec.required_action != PolicyAction.DELETE


# Test 9: Tombstone preservation (Rule 15)
def test_9_tombstone_preservation(real_compiled_policy):
    res = ResourceContext(
        resource_id="tombstone_99",
        system_id="account_service",
        data_category="ACCOUNT_TOMBSTONE",
        is_tombstone=True,
        present_identifiers=["user_id", "email", "phone"],
    )
    dec = evaluate_policy(res, real_compiled_policy)
    assert dec.required_action == PolicyAction.REDACT
    assert dec.rule_id == "rule_15"
    assert "user_id" in dec.permitted_identifiers
    assert "email" in dec.prohibited_identifiers
    assert "phone" in dec.prohibited_identifiers
    assert dec.is_compliant is False  # Because direct PII email/phone are present!


# Test 10: Unknown resource category fails safely
def test_10_unknown_resource_category(real_compiled_policy):
    res = ResourceContext(
        resource_id="weird_01",
        system_id="quantum_service",
        data_category="INTERGALACTIC_LOGS",
    )
    with pytest.raises(UnresolvedPolicyError, match="No matching policy rule found for category 'INTERGALACTIC_LOGS'"):
        evaluate_policy(res, real_compiled_policy)


# Test 11: Missing policy context / empty category
def test_11_missing_policy_context(real_compiled_policy):
    with pytest.raises(Exception):
        ResourceContext(resource_id="missing_cat", system_id="sys")  # Missing data_category


# Test 12: Deterministic execution
def test_12_deterministic_execution(real_compiled_policy):
    res = ResourceContext(
        resource_id="account_005",
        system_id="account_service",
        data_category="USER_PROFILE",
    )
    decisions = [evaluate_policy(res, real_compiled_policy) for _ in range(50)]
    first = decisions[0]
    for d in decisions[1:]:
        assert d.model_dump() == first.model_dump()


# Test 13: Policy conflict fail-closed
def test_13_policy_conflict():
    conflicting_rules = [
        PolicyRule(rule_id="r1", data_category="USER_PROFILE", condition="Always", required_action=PolicyAction.DELETE),
        PolicyRule(rule_id="r2", data_category="USER_PROFILE", condition="Always", required_action=PolicyAction.RETAIN),
    ]
    with pytest.raises(PolicyConflictError, match="Contradictory unconditional policies detected"):
        compile_policy(conflicting_rules)


# Test 14: Unsupported identifier retention
def test_14_unsupported_identifier_retention(real_compiled_policy):
    res = ResourceContext(
        resource_id="tombstone_clean",
        system_id="account_service",
        data_category="ACCOUNT_TOMBSTONE",
        present_identifiers=["user_id"],
    )
    dec = evaluate_policy(res, real_compiled_policy)
    assert dec.is_compliant is True
    assert len(dec.violating_fields) == 0


# Test 15: No mutation of input objects
def test_15_no_mutation(real_compiled_policy):
    res = ResourceContext(
        resource_id="orig_01",
        system_id="account_service",
        data_category="USER_PROFILE",
        present_identifiers=["email", "phone"],
    )
    original_dict = copy.deepcopy(res.model_dump())
    _ = evaluate_policy(res, real_compiled_policy)
    assert res.model_dump() == original_dict
