"""AEGIS 3.0 Module 1 — Policy Models & Enums.

Strictly aligned with PERSON4_INTERFACES.md, AGENTS.md, and deletion_rules.csv.
"""

from enum import Enum
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field, ConfigDict


class PolicyAction(str, Enum):
    """Permitted required treatment actions from deletion_rules.csv."""
    DELETE = "DELETE"
    REDACT = "REDACT"
    ANONYMIZE = "ANONYMIZE"
    RETAIN = "RETAIN"


class PolicyRule(BaseModel):
    """Normalized rule compiled from deletion_rules.csv."""
    model_config = ConfigDict(frozen=True, extra="forbid")

    rule_id: str = Field(..., description="Unique rule identifier, e.g. rule_01")
    data_category: str = Field(..., description="Target data category, e.g. USER_PROFILE")
    condition: str = Field(..., description="Evaluation condition or context trigger")
    required_action: PolicyAction = Field(..., description="Permitted action for this rule")


class ResourceContext(BaseModel):
    """Contextual attributes of a resource being evaluated under policy."""
    model_config = ConfigDict(extra="forbid")

    resource_id: str
    system_id: str
    data_category: str
    is_shared_context: bool = False
    is_subject_only: bool = True
    is_attributable: bool = True
    within_retention_period: bool = True
    legal_hold_active: bool = False
    restore_access_blockable: bool = True
    is_tombstone: bool = False
    contains_user_email: bool = True
    attributes: Dict[str, Any] = Field(default_factory=dict)
    present_identifiers: List[str] = Field(default_factory=list)


class PolicyDecision(BaseModel):
    """Deterministic decision emitted by Policy Evaluator."""
    model_config = ConfigDict(extra="forbid")

    resource_id: str
    system_id: str
    data_category: str
    rule_id: str
    required_action: PolicyAction
    condition_applied: str
    permitted_identifiers: List[str] = Field(default_factory=list)
    prohibited_identifiers: List[str] = Field(default_factory=list)
    explanation: str
    is_compliant: bool = True
    violating_fields: List[str] = Field(default_factory=list)

