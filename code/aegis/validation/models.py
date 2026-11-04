"""AEGIS 3.0 Module 2 — Validation Enums, Models and Error Taxonomies.

Defines the contracts for Candidate Validation across provenance, identity,
temporal admissibility, resource consistency, policy, and operations.
"""

from enum import Enum
from typing import List, Optional, Dict, Any, Set
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

from aegis.policy.models import PolicyAction


class ValidationErrorCode(str, Enum):
    INVALID_EVIDENCE_REFERENCE = "INVALID_EVIDENCE_REFERENCE"
    IDENTITY_MISMATCH = "IDENTITY_MISMATCH"
    TEMPORAL_INADMISSIBILITY = "TEMPORAL_INADMISSIBILITY"
    RESOURCE_MISMATCH = "RESOURCE_MISMATCH"
    POLICY_CONFLICT = "POLICY_CONFLICT"
    INVALID_OPERATION = "INVALID_OPERATION"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"
    CONFLICTING_EVIDENCE = "CONFLICTING_EVIDENCE"
    MISSING_DEPENDENCY = "MISSING_DEPENDENCY"
    INVALID_CANDIDATE = "INVALID_CANDIDATE"


class CheckStatus(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    NOT_EVALUATED = "NOT_EVALUATED"


class CandidateFinding(BaseModel):
    """Candidate finding proposed by LLM investigator or extraction engine."""
    model_config = ConfigDict(extra="forbid")

    candidate_id: str
    case_id: str
    evidence_id: str
    user_id: str
    system_id: str
    resource_id: str
    data_category: str
    phase: str
    operation: str
    state: str
    proposed_treatment: Optional[PolicyAction] = None
    event_timestamp: Optional[datetime] = None
    present_identifiers: List[str] = Field(default_factory=list)
    raw_claims: Dict[str, Any] = Field(default_factory=dict)


class EvidenceMetadata(BaseModel):
    """Provenance record from evidence manifest."""
    model_config = ConfigDict(frozen=True, extra="forbid")

    file_id: str
    file_path: str
    origin: str
    captured_at: datetime


class IdentityContext(BaseModel):
    """Person 3 authoritative identity resolution context."""
    model_config = ConfigDict(frozen=True, extra="forbid")

    user_id: str
    primary_email: str
    verified_identifiers: Set[str] = Field(default_factory=set)  # normalized emails, phones, hashes
    historical_identifiers: Set[str] = Field(default_factory=set)


class ValidationReport(BaseModel):
    """Structured report detailing checks for a single candidate finding."""
    model_config = ConfigDict(extra="forbid")

    candidate_id: str
    accepted: bool
    reason_code: Optional[ValidationErrorCode] = None
    reason: Optional[str] = None
    provenance_check: CheckStatus = CheckStatus.NOT_EVALUATED
    identity_check: CheckStatus = CheckStatus.NOT_EVALUATED
    temporal_check: CheckStatus = CheckStatus.NOT_EVALUATED
    resource_check: CheckStatus = CheckStatus.NOT_EVALUATED
    policy_check: CheckStatus = CheckStatus.NOT_EVALUATED
    operation_check: CheckStatus = CheckStatus.NOT_EVALUATED
    diagnostics: Dict[str, Any] = Field(default_factory=dict)

