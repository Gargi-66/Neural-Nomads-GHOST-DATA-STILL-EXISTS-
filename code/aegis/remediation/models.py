"""AEGIS 3.0 Module 4 — Remediation Models & Enums.

Strictly adhering to AGENTS.md §6.4 & §6.5, PERSON4_INTERFACES.md, and deletion_rules.csv.
"""

from enum import Enum
from typing import List, Dict, Any, Optional, Set
from pydantic import BaseModel, Field, ConfigDict

from aegis.policy.models import PolicyAction


class PlanStatus(str, Enum):
    READY = "READY"
    BLOCKED = "BLOCKED"
    INCOMPLETE = "INCOMPLETE"
    UNRESOLVED = "UNRESOLVED"
    INVALID = "INVALID"


class RemediationRequirement(BaseModel):
    """Normalized remediation requirement extracted from validated findings and policies."""
    model_config = ConfigDict(extra="forbid")

    case_id: str
    resource_id: str
    system_id: str
    data_category: str
    required_action: PolicyAction
    supporting_evidence_ids: List[str]
    current_state: str = "PRESENT"
    is_tombstone: bool = False
    prohibited_fields: List[str] = Field(default_factory=list)
    permitted_fields: List[str] = Field(default_factory=list)
    rule_id: str


class RemediationStep(BaseModel):
    """Concrete remediation step in execution plan."""
    model_config = ConfigDict(extra="forbid")

    step_id: str
    resource_id: str
    system_id: str
    phase: str  # FINDING, REMEDIATION, VERIFICATION
    operation: str
    state: str
    depends_on: List[str] = Field(default_factory=list)
    expected_precondition: str
    expected_postcondition: str
    evidence_id: str = ""  # Empty string for proposed remediation per AGENTS.md §6.6
    rule_id: Optional[str] = None


class RemediationPlan(BaseModel):
    """Complete, structured remediation plan."""
    model_config = ConfigDict(extra="forbid")

    case_id: str
    plan_id: str
    plan_status: PlanStatus
    initial_state: Dict[str, str]  # resource_id -> state
    requirements: List[RemediationRequirement] = Field(default_factory=list)
    steps: List[RemediationStep] = Field(default_factory=list)
    active_flows: List[str] = Field(default_factory=list)
    restore_risks: List[str] = Field(default_factory=list)
    unresolved_issues: List[str] = Field(default_factory=list)
    validation_notes: List[str] = Field(default_factory=list)

