"""AEGIS 3.0 Module 3 — Automated Agent Test Suite.

Covers all 20 required agent test scenarios:
TEST 1 — Successful investigation
TEST 2 — Unknown tool
TEST 3 — Invalid tool arguments
TEST 4 — Wrong tool output handling
TEST 5 — Evidence validation rejection
TEST 6 — Agent retries after rejection
TEST 7 — LLM attempts policy override
TEST 8 — LLM attempts to modify audit_at
TEST 9 — LLM invents evidence reference
TEST 10 — Conflicting evidence handling
TEST 11 — Missing dependency handling
TEST 12 — Infinite tool loop cutoff
TEST 13 — Provider timeout handling
TEST 14 — Invalid structured response
TEST 15 — Cross-case isolation
TEST 16 — No direct deletion
TEST 17 — Missing evidence handling
TEST 18 — Deterministic mock execution
TEST 19 — API key security
TEST 20 — Maximum execution time deadline
"""

import copy
import pytest
import time
from datetime import datetime, timezone
from pathlib import Path

from aegis.agent import (
    MockLLMProviderAdapter,
    LLMResponse,
    LLMToolCall,
    ToolRegistry,
    ToolDefinition,
    ToolRegistryError,
    InvestigationContext,
    SafetyGate,
    AgentOrchestrator,
    generate_investigation_report,
    make_standard_tools,
)
from aegis.validation import (
    CandidateValidator,
    CandidateFinding,
    EvidenceMetadata,
    IdentityContext,
    ValidationErrorCode,
)
from aegis.policy import load_policy_rules, compile_policy, PolicyAction

REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
REAL_RULES_CSV = REPO_ROOT / "dataset" / "deletion_rules.csv"


@pytest.fixture(scope="module")
def shared_policy():
    return compile_policy(load_policy_rules(REAL_RULES_CSV))


@pytest.fixture
def mock_validator(shared_policy):
    manifest = {
        "evidence_01": EvidenceMetadata(
            file_id="evidence_01",
            file_path="evidence/logs/service.log",
            origin="test",
            captured_at=datetime(2026, 9, 1, 12, 0, tzinfo=timezone.utc),
        )
    }
    supported_systems = {"account_service", "analytics_platform"}
    return CandidateValidator(
        manifest=manifest,
        policy=shared_policy,
        supported_systems=supported_systems,
        known_resource_map={"account_001": "account_service"},
    )


@pytest.fixture
def base_context():
    ident = IdentityContext(
        user_id="user_101",
        primary_email="user101@example.com",
        verified_identifiers={"user101@example.com"},
    )
    return InvestigationContext(
        case_id="case_01",
        user_id="user_101",
        audit_at=datetime(2026, 9, 5, tzinfo=timezone.utc),
        requested_at=datetime(2026, 8, 20, tzinfo=timezone.utc),
        request_text="Please delete my account data.",
        identity_context=ident,
    )


# TEST 1: Successful investigation
def test_1_successful_investigation(mock_validator, shared_policy, base_context):
    tools = ToolRegistry()
    for t in make_standard_tools(mock_validator, shared_policy):
        tools.register_tool(t)

    mock_llm = MockLLMProviderAdapter([
        LLMResponse(
            content="I will check policy.",
            tool_calls=[LLMToolCall(tool_name="apply_policy", arguments={"resource_id": "account_001", "system_id": "account_service", "data_category": "USER_PROFILE"})],
        ),
        LLMResponse(
            content="I will propose finding.",
            tool_calls=[LLMToolCall(tool_name="propose_finding", arguments={
                "candidate_id": "c1",
                "case_id": "case_01",
                "evidence_id": "evidence_01",
                "user_id": "user_101",
                "system_id": "account_service",
                "resource_id": "account_001",
                "data_category": "USER_PROFILE",
                "phase": "FINDING",
                "operation": "REPORT_REMAINING_RECORD",
                "state": "PRESENT",
            })],
        ),
        LLMResponse(content="Investigation finished.", tool_calls=[]),
    ])

    orchestrator = AgentOrchestrator(
        provider=mock_llm,
        tool_registry=tools,
        safety_gate=SafetyGate(mock_validator),
        max_tool_calls=5,
    )

    ctx = orchestrator.run_investigation(base_context)
    assert ctx.investigation_complete is True
    assert len(ctx.accepted_findings) == 1
    assert ctx.accepted_findings[0].candidate_id == "c1"


# TEST 2: Unknown tool
def test_2_unknown_tool(mock_validator, shared_policy, base_context):
    tools = ToolRegistry()
    mock_llm = MockLLMProviderAdapter([
        LLMResponse(
            content="Calling bad tool.",
            tool_calls=[LLMToolCall(tool_name="hack_mainframe", arguments={})],
        ),
        LLMResponse(content="Done.", tool_calls=[]),
    ])
    orchestrator = AgentOrchestrator(mock_llm, tools, SafetyGate(mock_validator))
    ctx = orchestrator.run_investigation(base_context)
    assert len(ctx.tool_history) == 1
    assert ctx.tool_history[0]["result"]["success"] is False
    assert "Unknown tool" in ctx.tool_history[0]["result"]["error"]


# TEST 3: Invalid tool arguments
def test_3_invalid_tool_arguments(mock_validator, shared_policy, base_context):
    tools = ToolRegistry()
    for t in make_standard_tools(mock_validator, shared_policy):
        tools.register_tool(t)

    mock_llm = MockLLMProviderAdapter([
        LLMResponse(
            content="Calling with bad args.",
            tool_calls=[LLMToolCall(tool_name="apply_policy", arguments={"wrong_arg": 123})],
        ),
        LLMResponse(content="Done.", tool_calls=[]),
    ])
    orchestrator = AgentOrchestrator(mock_llm, tools, SafetyGate(mock_validator))
    ctx = orchestrator.run_investigation(base_context)
    assert ctx.tool_history[0]["result"]["success"] is False
    assert "Invalid arguments" in ctx.tool_history[0]["result"]["error"]


# TEST 4: Wrong tool output handling
def test_4_wrong_tool_output(mock_validator, base_context):
    tools = ToolRegistry()
    tools.register_tool(ToolDefinition(
        name="crashing_tool",
        description="Fails with exception.",
        parameters_schema={},
        handler=lambda: (_ for _ in ()).throw(RuntimeError("DB exploded")),
    ))
    mock_llm = MockLLMProviderAdapter([
        LLMResponse(content="Call fail.", tool_calls=[LLMToolCall(tool_name="crashing_tool", arguments={})]),
        LLMResponse(content="Done.", tool_calls=[]),
    ])
    orchestrator = AgentOrchestrator(mock_llm, tools, SafetyGate(mock_validator))
    ctx = orchestrator.run_investigation(base_context)
    assert ctx.tool_history[0]["result"]["success"] is False
    assert "DB exploded" in ctx.tool_history[0]["result"]["error"]


# TEST 5: Evidence validation rejection
def test_5_evidence_validation_rejection(mock_validator, shared_policy, base_context):
    tools = ToolRegistry()
    for t in make_standard_tools(mock_validator, shared_policy):
        tools.register_tool(t)

    # Propose finding with NON-EXISTENT evidence ID
    mock_llm = MockLLMProviderAdapter([
        LLMResponse(
            content="Proposing fake finding.",
            tool_calls=[LLMToolCall(tool_name="propose_finding", arguments={
                "candidate_id": "c_fake",
                "case_id": "case_01",
                "evidence_id": "fake_ev_999",
                "user_id": "user_101",
                "system_id": "account_service",
                "resource_id": "account_001",
                "data_category": "USER_PROFILE",
                "phase": "FINDING",
                "operation": "REPORT_REMAINING_RECORD",
                "state": "PRESENT",
            })],
        ),
        LLMResponse(content="Done.", tool_calls=[]),
    ])
    orchestrator = AgentOrchestrator(mock_llm, tools, SafetyGate(mock_validator))
    ctx = orchestrator.run_investigation(base_context)
    assert len(ctx.accepted_findings) == 0
    assert len(ctx.rejected_findings) == 1
    assert ctx.rejected_findings[0].reason_code == ValidationErrorCode.INVALID_EVIDENCE_REFERENCE


# TEST 6: Agent retries after rejection
def test_6_agent_retries_after_rejection(mock_validator, shared_policy, base_context):
    tools = ToolRegistry()
    for t in make_standard_tools(mock_validator, shared_policy):
        tools.register_tool(t)

    mock_llm = MockLLMProviderAdapter([
        # 1. Propose invalid evidence
        LLMResponse(
            content="Attempt 1.",
            tool_calls=[LLMToolCall(tool_name="propose_finding", arguments={
                "candidate_id": "c_bad",
                "case_id": "case_01",
                "evidence_id": "bad_id",
                "user_id": "user_101",
                "system_id": "account_service",
                "resource_id": "account_001",
                "data_category": "USER_PROFILE",
                "phase": "FINDING",
                "operation": "REPORT_REMAINING_RECORD",
                "state": "PRESENT",
            })],
        ),
        # 2. Receive rejection feedback and propose valid evidence
        LLMResponse(
            content="Attempt 2 with corrected evidence.",
            tool_calls=[LLMToolCall(tool_name="propose_finding", arguments={
                "candidate_id": "c_good",
                "case_id": "case_01",
                "evidence_id": "evidence_01",
                "user_id": "user_101",
                "system_id": "account_service",
                "resource_id": "account_001",
                "data_category": "USER_PROFILE",
                "phase": "FINDING",
                "operation": "REPORT_REMAINING_RECORD",
                "state": "PRESENT",
            })],
        ),
        LLMResponse(content="Concluded.", tool_calls=[]),
    ])
    orchestrator = AgentOrchestrator(mock_llm, tools, SafetyGate(mock_validator))
    ctx = orchestrator.run_investigation(base_context)
    assert len(ctx.rejected_findings) == 1
    assert len(ctx.accepted_findings) == 1
    assert ctx.accepted_findings[0].candidate_id == "c_good"


# TEST 7: LLM attempts policy override
def test_7_llm_attempts_policy_override(mock_validator, shared_policy, base_context):
    tools = ToolRegistry()
    for t in make_standard_tools(mock_validator, shared_policy):
        tools.register_tool(t)

    # Propose DELETE on SECURITY_AUDIT_LOG
    mock_llm = MockLLMProviderAdapter([
        LLMResponse(
            content="Deleting audit log.",
            tool_calls=[LLMToolCall(tool_name="propose_finding", arguments={
                "candidate_id": "c_pol",
                "case_id": "case_01",
                "evidence_id": "evidence_01",
                "user_id": "user_101",
                "system_id": "account_service",
                "resource_id": "account_001",
                "data_category": "SECURITY_AUDIT_LOG",
                "phase": "FINDING",
                "operation": "REPORT_REMAINING_RECORD",
                "state": "PRESENT",
                "proposed_treatment": "DELETE",  # Rejected by Module 1 rule 12!
            })],
        ),
        LLMResponse(content="Done.", tool_calls=[]),
    ])
    orchestrator = AgentOrchestrator(mock_llm, tools, SafetyGate(mock_validator))
    ctx = orchestrator.run_investigation(base_context)
    assert len(ctx.accepted_findings) == 0
    assert ctx.rejected_findings[0].reason_code == ValidationErrorCode.POLICY_CONFLICT


# TEST 8: LLM attempts to modify audit_at
def test_8_llm_attempts_modify_audit_at(base_context):
    original_cutoff = base_context.audit_at
    # Context does not expose a setter for audit_at; verify immutability
    with pytest.raises(Exception):
        base_context.audit_at = datetime(2030, 1, 1)  # If frozen or protected
    assert base_context.audit_at == original_cutoff


# TEST 9: LLM invents evidence reference
def test_9_llm_invents_evidence_reference(mock_validator, shared_policy, base_context):
    tools = ToolRegistry()
    for t in make_standard_tools(mock_validator, shared_policy):
        tools.register_tool(t)

    mock_llm = MockLLMProviderAdapter([
        LLMResponse(
            content="Inventing evidence_phantom",
            tool_calls=[LLMToolCall(tool_name="propose_finding", arguments={
                "candidate_id": "c_inv",
                "case_id": "case_01",
                "evidence_id": "evidence_phantom_99",
                "user_id": "user_101",
                "system_id": "account_service",
                "resource_id": "account_001",
                "data_category": "USER_PROFILE",
                "phase": "FINDING",
                "operation": "REPORT_REMAINING_RECORD",
                "state": "PRESENT",
            })],
        ),
        LLMResponse(content="Done.", tool_calls=[]),
    ])
    orchestrator = AgentOrchestrator(mock_llm, tools, SafetyGate(mock_validator))
    ctx = orchestrator.run_investigation(base_context)
    assert len(ctx.accepted_findings) == 0
    assert ctx.rejected_findings[0].reason_code == ValidationErrorCode.INVALID_EVIDENCE_REFERENCE


# TEST 10: Conflicting evidence handling
def test_10_conflicting_evidence_handling(base_context):
    base_context.unresolved_questions.append("Conflicting replica states between replica_1 and replica_2.")
    rep = generate_investigation_report(base_context)
    assert len(rep["unresolved_questions"]) == 1
    assert "Conflicting" in rep["unresolved_questions"][0]


# TEST 11: Missing dependency handling
def test_11_missing_dependency_handling(mock_validator, shared_policy):
    ident_missing_context = InvestigationContext(
        case_id="case_01",
        user_id="user_101",
        audit_at=datetime(2026, 9, 5, tzinfo=timezone.utc),
        requested_at=datetime(2026, 8, 20, tzinfo=timezone.utc),
        request_text="Delete me.",
        identity_context=None,  # Missing!
    )
    cand = CandidateFinding(
        candidate_id="c11",
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
    gate = SafetyGate(mock_validator)
    is_acc, rpt = gate.process_proposed_finding(cand, ident_missing_context)
    assert is_acc is False
    assert rpt.reason_code == ValidationErrorCode.MISSING_DEPENDENCY


# TEST 12: Infinite tool loop cutoff
def test_12_infinite_tool_loop_cutoff(mock_validator, shared_policy, base_context):
    tools = ToolRegistry()
    for t in make_standard_tools(mock_validator, shared_policy):
        tools.register_tool(t)

    # Provider always returns tool call in loop
    mock_llm = MockLLMProviderAdapter([
        LLMResponse(
            content=f"Loop {i}",
            tool_calls=[LLMToolCall(tool_name="apply_policy", arguments={"resource_id": "acc", "system_id": "account_service", "data_category": "USER_PROFILE"})],
        ) for i in range(20)
    ])
    orchestrator = AgentOrchestrator(mock_llm, tools, SafetyGate(mock_validator), max_tool_calls=4)
    ctx = orchestrator.run_investigation(base_context)
    assert len(ctx.tool_history) == 4
    assert ctx.termination_reason == "MAX_TOOL_CALLS_REACHED"


# TEST 13: Provider timeout handling
def test_13_provider_timeout_handling(mock_validator, base_context):
    mock_llm = MockLLMProviderAdapter()
    mock_llm.should_timeout = True
    orchestrator = AgentOrchestrator(mock_llm, ToolRegistry(), SafetyGate(mock_validator))
    ctx = orchestrator.run_investigation(base_context)
    assert ctx.termination_reason == "PROVIDER_TIMEOUT"


# TEST 14: Invalid structured response
def test_14_invalid_structured_response(mock_validator, shared_policy, base_context):
    tools = ToolRegistry()
    for t in make_standard_tools(mock_validator, shared_policy):
        tools.register_tool(t)

    mock_llm = MockLLMProviderAdapter([
        LLMResponse(
            content="Passing broken fields.",
            tool_calls=[LLMToolCall(tool_name="propose_finding", arguments={"not_a_field": 123})],
        ),
        LLMResponse(content="Done.", tool_calls=[]),
    ])
    orchestrator = AgentOrchestrator(mock_llm, tools, SafetyGate(mock_validator))
    ctx = orchestrator.run_investigation(base_context)
    assert "Invalid CandidateFinding schema" in ctx.tool_history[0]["result"]["error"]


# TEST 15: Cross-case isolation
def test_15_cross_case_isolation(mock_validator, shared_policy):
    tools = ToolRegistry()
    for t in make_standard_tools(mock_validator, shared_policy):
        tools.register_tool(t)

    ctx1 = InvestigationContext(
        case_id="case_01",
        user_id="user_101",
        audit_at=datetime(2026, 9, 5, tzinfo=timezone.utc),
        requested_at=datetime(2026, 8, 20, tzinfo=timezone.utc),
        request_text="Req 1",
        identity_context=IdentityContext(user_id="user_101", primary_email="u101@test.com"),
    )
    ctx2 = InvestigationContext(
        case_id="case_02",
        user_id="user_102",
        audit_at=datetime(2026, 9, 5, tzinfo=timezone.utc),
        requested_at=datetime(2026, 8, 20, tzinfo=timezone.utc),
        request_text="Req 2",
        identity_context=IdentityContext(user_id="user_102", primary_email="u102@test.com"),
    )

    mock_llm = MockLLMProviderAdapter([
        LLMResponse(content="Call for case 1", tool_calls=[]),
        LLMResponse(content="Call for case 2", tool_calls=[]),
    ])
    orchestrator = AgentOrchestrator(mock_llm, tools, SafetyGate(mock_validator))
    res1 = orchestrator.run_investigation(ctx1)
    res2 = orchestrator.run_investigation(ctx2)
    assert res1.case_id == "case_01"
    assert res2.case_id == "case_02"
    assert res1.user_id != res2.user_id


# TEST 16: No direct deletion
def test_16_no_direct_deletion():
    tools = ToolRegistry()
    destructive_tool = ToolDefinition(
        name="execute_delete_from_db",
        description="Destructive delete.",
        parameters_schema={},
        handler=lambda: {"deleted": True},
        is_destructive=True,
    )
    with pytest.raises(ToolRegistryError, match="Security Violation: Destructive tool"):
        tools.register_tool(destructive_tool)


# TEST 17: Missing evidence handling
def test_17_missing_evidence_handling(mock_validator, shared_policy, base_context):
    tools = ToolRegistry()
    for t in make_standard_tools(mock_validator, shared_policy):
        tools.register_tool(t)

    mock_llm = MockLLMProviderAdapter([
        LLMResponse(
            content="Check missing file",
            tool_calls=[LLMToolCall(tool_name="check_admissibility", arguments={"candidate_id": "c1", "case_id": "case_01", "evidence_id": "non_existent_file"})],
        ),
        LLMResponse(content="No findings possible.", tool_calls=[]),
    ])
    orchestrator = AgentOrchestrator(mock_llm, tools, SafetyGate(mock_validator))
    ctx = orchestrator.run_investigation(base_context)
    assert ctx.tool_history[0]["result"]["result"]["admissible"] is False
    assert len(ctx.accepted_findings) == 0


# TEST 18: Deterministic mock execution
def test_18_deterministic_mock_execution(mock_validator, shared_policy, base_context):
    tools = ToolRegistry()
    for t in make_standard_tools(mock_validator, shared_policy):
        tools.register_tool(t)

    def run_once():
        ctx = copy.deepcopy(base_context)
        mock_llm = MockLLMProviderAdapter([
            LLMResponse(content="Tool call", tool_calls=[LLMToolCall(tool_name="apply_policy", arguments={"resource_id": "a", "system_id": "account_service", "data_category": "USER_PROFILE"})]),
            LLMResponse(content="Done", tool_calls=[]),
        ])
        orch = AgentOrchestrator(mock_llm, tools, SafetyGate(mock_validator))
        return orch.run_investigation(ctx)

    r1 = run_once().model_dump()
    r2 = run_once().model_dump()
    assert r1 == r2


# TEST 19: API key security
def test_19_api_key_security(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "sk-secret-token-12345")
    mock_llm = MockLLMProviderAdapter()
    resp = mock_llm.generate([{"role": "user", "content": "hello"}])
    # Ensure no secret is dumped in string representation
    assert "sk-secret-token-12345" not in repr(resp)


# TEST 20: Maximum execution time deadline
def test_20_maximum_execution_time_deadline(mock_validator, shared_policy, base_context):
    tools = ToolRegistry()
    tools.register_tool(ToolDefinition(
        name="slow_tool",
        description="Sleeps 0.2s.",
        parameters_schema={},
        handler=lambda: time.sleep(0.2) or {"status": "ok"},
    ))
    mock_llm = MockLLMProviderAdapter([
        LLMResponse(content="Slow call", tool_calls=[LLMToolCall(tool_name="slow_tool", arguments={})]) for _ in range(10)
    ])
    # Deadline 0.1s
    orchestrator = AgentOrchestrator(mock_llm, tools, SafetyGate(mock_validator), timeout_seconds=0.1)
    ctx = orchestrator.run_investigation(base_context)
    assert ctx.termination_reason in ("TIMEOUT_EXCEEDED", "MAX_TOOL_CALLS_REACHED")
