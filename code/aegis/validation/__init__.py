"""AEGIS 3.0 Module 2 — Package Init.
"""

from aegis.validation.models import (
    ValidationErrorCode,
    CheckStatus,
    CandidateFinding,
    EvidenceMetadata,
    IdentityContext,
    ValidationReport,
)
from aegis.validation.operations import validate_operation_triplet, ALLOWED_TRIPLETS
from aegis.validation.validator import CandidateValidator

__all__ = [
    "ValidationErrorCode",
    "CheckStatus",
    "CandidateFinding",
    "EvidenceMetadata",
    "IdentityContext",
    "ValidationReport",
    "validate_operation_triplet",
    "ALLOWED_TRIPLETS",
    "CandidateValidator",
]

