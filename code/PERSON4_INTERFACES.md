# PERSON 4 INTERFACES & CONTRACTS: TYPED MODELS & API BOUNDARIES
**AEGIS 3.0 — HackerRank Orchestrate (October 2026)**  
**Pydantic v2 Models & Deterministic Function Signatures**  

---

## 1. Allowed Enums (Sourced Strictly from AGENTS.md)

```python
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

class DeletionStatus(str, Enum):
    COMPLETE = "COMPLETE"
    INCOMPLETE = "INCOMPLETE"
    NOT_APPLICABLE = "NOT_APPLICABLE"

class StepPhase(str, Enum):
    FINDING = "FINDING"
    REMEDIATION = "REMEDIATION"
    VERIFICATION = "VERIFICATION"

class StepOperation(str, Enum):
    # FINDINGS
    REPORT_REMAINING_RECORD = "REPORT_REMAINING_RECORD"
    REPORT_EXPOSED_PII = "REPORT_EXPOSED_PII"
    REPORT_ACTIVE_DATA_FLOW = "REPORT_ACTIVE_DATA_FLOW"
    REPORT_RESTORE_RISK = "REPORT_RESTORE_RISK"
    # REMEDIATION
    DISABLE_DATA_FLOW = "DISABLE_DATA_FLOW"
    BLOCK_RESTORE = "BLOCK_RESTORE"
    DELETE_RECORD = "DELETE_RECORD"
    REDACT_RECORD = "REDACT_RECORD"
    ANONYMIZE_RECORD = "ANONYMIZE_RECORD"
    # VERIFICATION
    VERIFY_RECORD_ABSENT = "VERIFY_RECORD_ABSENT"
    VERIFY_RECORD_PRESENT = "VERIFY_RECORD_PRESENT"
    VERIFY_RECORD_REDACTED = "VERIFY_RECORD_REDACTED"
    VERIFY_RECORD_ANONYMIZED = "VERIFY_RECORD_ANONYMIZED"
    VERIFY_DATA_FLOW_DISABLED = "VERIFY_DATA_FLOW_DISABLED"
    VERIFY_RESTORE_BLOCKED = "VERIFY_RESTORE_BLOCKED"

class StepState(str, Enum):
    PRESENT = "PRESENT"
    ABSENT = "ABSENT"
    REDACTED = "REDACTED"
    ANONYMIZED = "ANONYMIZED"
    ACTIVE = "ACTIVE"
    DISABLED = "DISABLED"
    BLOCKED = "BLOCKED"

class PolicyAction(str, Enum):
    DELETE = "DELETE"
    REDACT = "REDACT"
    ANONYMIZE = "ANONYMIZE"
    RETAIN = "RETAIN"
```

---

## 2. Pydantic v2 Data Models

```python
class StepObject(BaseModel):
    """Exact schema required inside steps_json array."""
    model_config = ConfigDict(extra="forbid")

    step_no: int = Field(..., ge=1, description="Consecutive integer starting at 1")
    phase: StepPhase
    system_id: str
    resource_id: str
    operation: StepOperation
    state: StepState
    evidence_id: str = Field(..., description="file_id, activity_id, or audit_id for findings/verification; empty string for proposed remediation")

class DeletionRule(BaseModel):
    """Compiled from dataset/deletion_rules.csv."""
    rule_id: str
    data_category: str
    condition: str
    required_action: PolicyAction

class EvidenceCandidate(BaseModel):
    """Extracted claim from evidence before verification."""
    file_id: str
    locator: str  # row, line, or page number
    system_id: str
    resource_id: str
    observed_at: datetime
    matched_identifiers: List[str]
    category: str
    extracted_state: StepState
    confidence: float = 1.0

class EvidenceValidationResult(BaseModel):
    """Result of deterministic admissibility and provenance check."""
    is_valid: bool
    candidate: EvidenceCandidate
    rejection_reason: Optional[str] = None  # e.g., "TEMPORAL_LEAKAGE: observed_at > audit_at"

class PolicyEvaluationResult(BaseModel):
    """Result of policy evaluation for a single resource."""
    resource_id: str
    system_id: str
    data_category: str
    required_action: PolicyAction
    current_state: StepState
    is_compliant: bool
    violating_fields: List[str] = Field(default_factory=list)

class SimulationState(BaseModel):
    """In-memory copy of case world state."""
    resources: Dict[str, StepState]  # resource_id -> state
    active_flows: Dict[str, StepState]  # flow_id -> state (ACTIVE/DISABLED)
    restore_risks: Dict[str, StepState]  # backup_id -> state (ACTIVE/BLOCKED)
    exposed_pii: Dict[str, List[str]]  # resource_id -> list of exposed PII field names

class SimulationResult(BaseModel):
    """Outcome of running remediation simulator."""
    success: bool
    executed_steps_count: int
    failed_step_no: Optional[int] = None
    violation_message: Optional[str] = None
    final_state: SimulationState

class AdversarialTestCase(BaseModel):
    """Synthetic test case for mutation testing."""
    test_id: str
    mutation_type: str  # TEMPORAL_SHIFT, DECOY_IDENTITY, PHANTOM_SYNC
    case_input: Dict[str, Any]
    expected_status: DeletionStatus
    expected_violation: Optional[str] = None
```

---

## 3. Function Signatures & Boundaries

### 3.1 Policy Engine (`code/aegis/policy/engine.py`)
```python
def compile_rules(rules_csv_path: str) -> List[DeletionRule]:
    """Compiles deletion_rules.csv into memory."""
    ...

def evaluate_resource_policy(
    resource_category: str,
    resource_attributes: Dict[str, Any],
    rules: List[DeletionRule]
) -> PolicyEvaluationResult:
    """Evaluates whether a given resource meets policy requirements.
    Deterministic; no external network or LLM calls.
    """
    ...
```

### 3.2 Evidence Candidate Validator (`code/aegis/validation/validator.py`)
```python
def validate_evidence_candidate(
    candidate: EvidenceCandidate,
    audit_at: datetime,
    manifest_files: Dict[str, datetime]  # file_id -> captured_at
) -> EvidenceValidationResult:
    """Enforces strict audit_at cutoff and manifest file existence.
    Rejects any evidence captured after audit_at.
    """
    ...
```

### 3.3 Remediation Planner (`code/aegis/remediation/planner.py`)
```python
def build_remediation_plan(
    case_id: str,
    findings: List[StepObject],
    policy_results: List[PolicyEvaluationResult],
    active_flows: List[str],
    restore_risks: List[str]
) -> List[StepObject]:
    """Constructs ordered steps_json adhering strictly to:
    1. Phase sequence: FINDING -> REMEDIATION -> VERIFICATION
    2. Operation sequence specified in AGENTS.md
    3. Ascending sort by system_id then resource_id
    4. Consecutive step_no numbering starting at 1
    """
    ...
```

### 3.4 Remediation Simulator (`code/aegis/simulation/simulator.py`)
```python
def simulate_plan(
    initial_state: SimulationState,
    proposed_steps: List[StepObject],
    policy_rules: List[DeletionRule]
) -> SimulationResult:
    """Executes the proposed plan against the in-memory state.
    Verifies that all preconditions and postconditions hold.
    """
    ...
```

