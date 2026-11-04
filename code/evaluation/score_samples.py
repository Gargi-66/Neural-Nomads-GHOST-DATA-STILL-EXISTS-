#!/usr/bin/env python3
"""Evaluation harness for scoring pipeline predictions against public sample ground truth.

Measures:
- Case-level deletion status accuracy
- Exact step-array match accuracy
- Step-level precision, recall, and F1 based on signature tuples:
  (phase, system_id, resource_id, operation, state, evidence_id)
- Grouped failure diagnostics per case
"""

import csv
import json
import sys
from collections import Counter
from pathlib import Path
from typing import Any, Dict, List, Tuple

CODE_DIR = Path(__file__).resolve().parents[1]
ROOT_DIR = CODE_DIR.parent
if str(CODE_DIR) not in sys.path:
    sys.path.insert(0, str(CODE_DIR))


def score_predictions(
    expected_rows: List[Dict[str, str]],
    predicted_cases: Dict[str, Dict[str, Any]],
) -> Dict[str, Any]:
    expected = {row["case_id"]: row for row in expected_rows}
    case_ids = sorted(expected.keys())

    correct_status = 0
    exact_arrays = 0
    exact_sequences = 0
    total_expected_steps = 0
    total_predicted_steps = 0
    total_matched_steps = 0

    mismatches: List[Dict[str, Any]] = []

    for cid in case_ids:
        exp_row = expected[cid]
        pred_item = predicted_cases.get(cid, {"deletion_status": "UNKNOWN", "steps": []})

        exp_status = exp_row["deletion_status"]
        pred_status = pred_item.get("deletion_status")

        exp_steps = json.loads(exp_row["steps_json"])
        pred_steps = pred_item.get("steps", [])

        total_expected_steps += len(exp_steps)
        total_predicted_steps += len(pred_steps)

        status_match = (exp_status == pred_status)
        correct_status += int(status_match)

        array_match = (exp_steps == pred_steps)
        exact_arrays += int(array_match)

        exp_seq = [(s["phase"], s["system_id"], s["resource_id"], s["operation"]) for s in exp_steps]
        pred_seq = [(s["phase"], s["system_id"], s["resource_id"], s["operation"]) for s in pred_steps]
        exact_sequences += int(exp_seq == pred_seq)

        exp_signatures = Counter(
            (s["phase"], s["system_id"], s["resource_id"], s["operation"], s["state"], s.get("evidence_id", ""))
            for s in exp_steps
        )
        pred_signatures = Counter(
            (s["phase"], s["system_id"], s["resource_id"], s["operation"], s["state"], s.get("evidence_id", ""))
            for s in pred_steps
        )

        matched = sum((exp_signatures & pred_signatures).values())
        total_matched_steps += matched

        missing = list((exp_signatures - pred_signatures).elements())
        extra = list((pred_signatures - exp_signatures).elements())

        if not status_match or missing or extra or not array_match:
            # Classify diff failure types
            failure_types = []
            if not status_match:
                failure_types.append(f"WRONG_STATUS (expected {exp_status}, got {pred_status})")
            if missing:
                failure_types.append(f"MISSING_STEPS ({len(missing)})")
            if extra:
                failure_types.append(f"EXTRA_STEPS ({len(extra)})")
            if exp_seq != pred_seq and not (missing or extra):
                failure_types.append("WRONG_ORDER")

            mismatches.append({
                "case_id": cid,
                "expected_status": exp_status,
                "predicted_status": pred_status,
                "failure_types": failure_types,
                "missing": missing,
                "extra": extra,
            })

    precision = total_matched_steps / total_predicted_steps if total_predicted_steps > 0 else 0.0
    recall = total_matched_steps / total_expected_steps if total_expected_steps > 0 else 0.0
    f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0

    return {
        "case_count": len(case_ids),
        "correct_status": correct_status,
        "status_accuracy": correct_status / len(case_ids) if case_ids else 0.0,
        "exact_arrays": exact_arrays,
        "array_accuracy": exact_arrays / len(case_ids) if case_ids else 0.0,
        "exact_sequences": exact_sequences,
        "total_expected_steps": total_expected_steps,
        "total_predicted_steps": total_predicted_steps,
        "total_matched_steps": total_matched_steps,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "mismatches": mismatches,
    }


def print_summary_table(metrics: Dict[str, Any]) -> None:
    cases = metrics["case_count"]
    print("\n" + "=" * 70)
    print("               AEGIS PUBLIC BENCHMARK SCORE SUMMARY")
    print("=" * 70)
    print(f"Total Test Cases:            {cases}")
    print(f"Status Accuracy:             {metrics['correct_status']}/{cases} ({metrics['status_accuracy']:.2%})")
    print(f"Exact Step-Array Match:      {metrics['exact_arrays']}/{cases} ({metrics['array_accuracy']:.2%})")
    print(f"Exact Sequence Match:        {metrics['exact_sequences']}/{cases} ({metrics['exact_sequences'] / cases:.2%})")
    print("-" * 70)
    print(f"Total Steps (Expected/Pred): {metrics['total_expected_steps']} / {metrics['total_predicted_steps']}")
    print(f"Matched Steps:               {metrics['total_matched_steps']}")
    print(f"Step Precision:              {metrics['precision']:.2%}")
    print(f"Step Recall:                 {metrics['recall']:.2%}")
    print(f"Step F1 Score:               {metrics['f1']:.2%}")
    print("=" * 70)

    mismatches = metrics["mismatches"]
    if mismatches:
        print(f"\n--- MISMATCHED CASES ({len(mismatches)}) ---")
        for m in mismatches:
            failures_str = "; ".join(m["failure_types"])
            print(f"[{m['case_id']}] -> {failures_str}")
            if m["missing"]:
                for item in m["missing"][:3]:
                    print(f"   - MISSING: {item[0]} {item[1]}/{item[2]} {item[3]} state={item[4]} [evidence={item[5] or 'empty'}]")
                if len(m["missing"]) > 3:
                    print(f"   ... and {len(m['missing']) - 3} more missing")
            if m["extra"]:
                for item in m["extra"][:3]:
                    print(f"   + EXTRA:   {item[0]} {item[1]}/{item[2]} {item[3]} state={item[4]} [evidence={item[5] or 'empty'}]")
                if len(m["extra"]) > 3:
                    print(f"   ... and {len(m['extra']) - 3} more extra")


def run_evaluation(
    dataset_dir: Path = ROOT_DIR / "dataset",
    requests_path: Path = ROOT_DIR / "dataset" / "sample_deletion_requests.csv",
    gold_path: Path = ROOT_DIR / "dataset" / "sample_output.csv",
) -> Dict[str, Any]:
    with open(gold_path, newline="", encoding="utf-8-sig") as f:
        expected_rows = list(csv.DictReader(f))

    # Import main pipeline
    from main import run_pipeline_for_cases
    predicted_cases = run_pipeline_for_cases(dataset_dir, requests_path)

    metrics = score_predictions(expected_rows, predicted_cases)
    print_summary_table(metrics)
    return metrics


if __name__ == "__main__":
    run_evaluation()

