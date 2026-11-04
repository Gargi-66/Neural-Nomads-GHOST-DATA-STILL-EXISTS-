"""Field-level comparison engine for assessing prediction accuracy against ground truth."""

from __future__ import annotations

import json
from typing import Any, Dict, List, Optional
from aegis.evaluation.models import (
    CaseComparisonSummary,
    FailureCategory,
    FailureSeverity,
    FieldComparisonResult,
)


class FieldComparisonEngine:
    """Performs deep structural and field-level comparison between predictions and expected outputs."""

    def compare_case(
        self,
        case_id: str,
        actual_output: Dict[str, Any],
        expected_output: Dict[str, Any],
    ) -> CaseComparisonSummary:
        """Compares a single case prediction against expected ground truth."""
        comparisons: List[FieldComparisonResult] = []
        failure_cats: List[FailureCategory] = []

        # 1. Compare deletion_status
        actual_status = actual_output.get("deletion_status")
        expected_status = expected_output.get("deletion_status")
        status_match = actual_status == expected_status

        if not status_match:
            comparisons.append(
                FieldComparisonResult(
                    case_id=case_id,
                    field_path="deletion_status",
                    expected_value=expected_status,
                    actual_value=actual_status,
                    passed=False,
                    failure_category=FailureCategory.STATUS_MISMATCH,
                    severity=FailureSeverity.CRITICAL,
                    diagnostic_message=f"Status mismatch: expected {expected_status}, got {actual_status}",
                )
            )
            failure_cats.append(FailureCategory.STATUS_MISMATCH)
        else:
            comparisons.append(
                FieldComparisonResult(
                    case_id=case_id,
                    field_path="deletion_status",
                    expected_value=expected_status,
                    actual_value=actual_status,
                    passed=True,
                    diagnostic_message="Status matched",
                )
            )

        # 2. Compare steps
        actual_steps = actual_output.get("steps", [])
        expected_steps = expected_output.get("steps", [])
        step_count_expected = len(expected_steps)
        step_count_actual = len(actual_steps)

        if step_count_expected != step_count_actual:
            comparisons.append(
                FieldComparisonResult(
                    case_id=case_id,
                    field_path="steps.length",
                    expected_value=step_count_expected,
                    actual_value=step_count_actual,
                    passed=False,
                    failure_category=FailureCategory.VERIFICATION_OMISSION if step_count_actual < step_count_expected else FailureCategory.UNEXPECTED_FIELD,
                    severity=FailureSeverity.HIGH,
                    diagnostic_message=f"Step count mismatch: expected {step_count_expected}, got {step_count_actual}",
                )
            )
            if step_count_actual < step_count_expected:
                failure_cats.append(FailureCategory.VERIFICATION_OMISSION)
            else:
                failure_cats.append(FailureCategory.UNEXPECTED_FIELD)

        # 3. Compare individual step fields
        min_steps = min(step_count_expected, step_count_actual)
        for i in range(min_steps):
            exp_s = expected_steps[i]
            act_s = actual_steps[i]

            for field in ["phase", "system_id", "resource_id", "operation", "state", "evidence_id"]:
                exp_val = exp_s.get(field)
                act_val = act_s.get(field)
                passed = exp_val == act_val

                cat = None
                if not passed:
                    if field == "operation":
                        cat = FailureCategory.POLICY_MISMATCH
                    elif field == "evidence_id":
                        cat = FailureCategory.INVALID_EVIDENCE_REFERENCE
                    elif field == "phase":
                        cat = FailureCategory.DEPENDENCY_ORDERING_VIOLATION
                    else:
                        cat = FailureCategory.OUTPUT_SCHEMA_FAILURE
                    failure_cats.append(cat)

                comparisons.append(
                    FieldComparisonResult(
                        case_id=case_id,
                        field_path=f"steps[{i}].{field}",
                        expected_value=exp_val,
                        actual_value=act_val,
                        passed=passed,
                        failure_category=cat,
                        severity=FailureSeverity.HIGH if not passed else FailureSeverity.LOW,
                        diagnostic_message=f"Step {i+1} {field}: expected '{exp_val}', got '{act_val}'" if not passed else "Matched",
                    )
                )

        exact_match = status_match and (step_count_expected == step_count_actual) and all(c.passed for c in comparisons)

        return CaseComparisonSummary(
            case_id=case_id,
            status_match=status_match,
            step_count_expected=step_count_expected,
            step_count_actual=step_count_actual,
            exact_match=exact_match,
            field_comparisons=comparisons,
            failure_categories=list(set(failure_cats)),
        )

