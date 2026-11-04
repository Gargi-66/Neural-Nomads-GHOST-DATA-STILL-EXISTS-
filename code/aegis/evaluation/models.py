"""Data models for AEGIS Module 5 - Evaluation, Adversarial Testing, and Disagreement Analysis."""

from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class FailureCategory(str, Enum):
    """Structured taxonomy of failure types."""
    IDENTITY_RESOLUTION_FAILURE = "IDENTITY_RESOLUTION_FAILURE"
    HISTORICAL_IDENTIFIER_MISMATCH = "HISTORICAL_IDENTIFIER_MISMATCH"
    EVIDENCE_VALIDATION_FAILURE = "EVIDENCE_VALIDATION_FAILURE"
    INVALID_EVIDENCE_REFERENCE = "INVALID_EVIDENCE_REFERENCE"
    TEMPORAL_CUTOFF_VIOLATION = "TEMPORAL_CUTOFF_VIOLATION"
    POLICY_MISMATCH = "POLICY_MISMATCH"
    RETENTION_VIOLATION = "RETENTION_VIOLATION"
    REMEDIATION_PLANNING_FAILURE = "REMEDIATION_PLANNING_FAILURE"
    DEPENDENCY_ORDERING_VIOLATION = "DEPENDENCY_ORDERING_VIOLATION"
    BACKUP_RESTORATION_RISK = "BACKUP_RESTORATION_RISK"
    SYNCHRONIZATION_RECREATION_RISK = "SYNCHRONIZATION_RECREATION_RISK"
    VERIFICATION_OMISSION = "VERIFICATION_OMISSION"
    LLM_TOOL_MISUSE = "LLM_TOOL_MISUSE"
    HALLUCINATED_EVIDENCE_REFERENCE = "HALLUCINATED_EVIDENCE_REFERENCE"
    OUTPUT_SCHEMA_FAILURE = "OUTPUT_SCHEMA_FAILURE"
    INTEGRATION_FAILURE = "INTEGRATION_FAILURE"
    UNEXPECTED_FIELD = "UNEXPECTED_FIELD"
    STATUS_MISMATCH = "STATUS_MISMATCH"


class FailureSeverity(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class FieldComparisonResult(BaseModel):
    """Result of comparing a single field between actual and expected."""
    case_id: str
    field_path: str
    expected_value: Any
    actual_value: Any
    passed: bool
    failure_category: Optional[FailureCategory] = None
    severity: FailureSeverity = FailureSeverity.MEDIUM
    diagnostic_message: str = ""


class CaseComparisonSummary(BaseModel):
    """Summary of comparing an entire case against ground truth."""
    case_id: str
    status_match: bool
    step_count_expected: int
    step_count_actual: int
    exact_match: bool
    field_comparisons: List[FieldComparisonResult] = Field(default_factory=list)
    failure_categories: List[FailureCategory] = Field(default_factory=list)


class MutationType(str, Enum):
    HISTORICAL_IDENTITY = "HISTORICAL_IDENTITY"
    TEMPORAL_CUTOFF = "TEMPORAL_CUTOFF"
    DECOY_EVIDENCE = "DECOY_EVIDENCE"
    RETENTION_CONFLICT = "RETENTION_CONFLICT"
    TOMBSTONE_INJECTION = "TOMBSTONE_INJECTION"
    SYNC_RECREATION = "SYNC_RECREATION"
    BACKUP_RESTORATION = "BACKUP_RESTORATION"
    CONFLICTING_EVIDENCE = "CONFLICTING_EVIDENCE"
    HALLUCINATED_REFERENCE = "HALLUCINATED_REFERENCE"


class AdversarialTestCase(BaseModel):
    """Represents a mutated adversarial test scenario with explicit expected outcome."""
    mutation_id: str
    parent_case_id: str
    mutation_type: MutationType
    description: str
    parameters: Dict[str, Any] = Field(default_factory=dict)
    expected_admissible: bool = True
    expected_status: Optional[str] = None
    expected_failure_category: Optional[FailureCategory] = None
    expected_rejection_reason: Optional[str] = None


class DisagreementItem(BaseModel):
    """Represents a divergence between LLM proposal and deterministic decision."""
    case_id: str
    decision_type: str  # e.g., "EVIDENCE_VALIDITY", "POLICY_ACTION", "IDENTITY_MATCH"
    deterministic_verdict: Any
    llm_verdict: Any
    evidence_id: Optional[str] = None
    resource_id: Optional[str] = None
    rule_id: Optional[str] = None
    adjudicated: bool = False
    adjudication_notes: Optional[str] = None
    requires_review: bool = True


class EvaluationMetrics(BaseModel):
    """Quantitative performance metrics computed from evaluation runs."""
    total_cases_evaluated: int = 0
    passed_cases: int = 0
    failed_cases: int = 0
    cases_without_ground_truth: int = 0
    exact_match_rate: float = 0.0
    field_level_accuracy: float = 0.0
    false_acceptance_count: int = 0
    false_rejection_count: int = 0
    temporal_leakage_count: int = 0
    policy_violation_count: int = 0
    dependency_ordering_violations: int = 0
    unresolved_disagreement_count: int = 0
    failure_distribution: Dict[str, int] = Field(default_factory=dict)

