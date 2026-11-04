"""AEGIS Module 5 - Adversarial Testing, Disagreement Analysis, and Evaluation."""

from aegis.evaluation.models import (
    AdversarialTestCase,
    CaseComparisonSummary,
    DisagreementItem,
    EvaluationMetrics,
    FailureCategory,
    FailureSeverity,
    FieldComparisonResult,
    MutationType,
)
from aegis.evaluation.dataset_manager import EvaluationDatasetManager
from aegis.evaluation.comparator import FieldComparisonEngine
from aegis.evaluation.adversarial import AdversarialTestGenerator
from aegis.evaluation.disagreement import DisagreementAnalyzer
from aegis.evaluation.regression import RegressionEngine, RegressionFixture
from aegis.evaluation.reporter import EvaluationReportGenerator

__all__ = [
    "AdversarialTestCase",
    "AdversarialTestGenerator",
    "CaseComparisonSummary",
    "DisagreementAnalyzer",
    "DisagreementItem",
    "EvaluationDatasetManager",
    "EvaluationMetrics",
    "EvaluationReportGenerator",
    "FailureCategory",
    "FailureSeverity",
    "FieldComparisonEngine",
    "FieldComparisonResult",
    "MutationType",
    "RegressionEngine",
    "RegressionFixture",
]

