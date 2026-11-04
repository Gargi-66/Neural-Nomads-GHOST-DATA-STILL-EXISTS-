"""AEGIS 3.0 — HackerRank Orchestrate: Ghost Data Still Exists.
Unified deletion-audit engine integrating:
- Evidence ingestion (SQLite, SQL dumps, JSON logs, tickets)
- Canonical identity resolution and temporal cutoffs
- Policy compliance and verification
- In-memory simulation and dependency topological sorting
- Format verification and submission serialization
"""

import argparse
import csv
import json
import sys
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

CODE_DIR = Path(__file__).resolve().parent
ROOT_DIR = CODE_DIR.parent
if str(CODE_DIR) not in sys.path:
    sys.path.insert(0, str(CODE_DIR))

from evidence import EvidenceStore
from identity import IdentityIndex
from output import validate_rows, write_output
from planner import AuditPlanner
from aegis.remediation.simulator import RemediationSimulator, SimulationOutcome
from aegis.remediation.models import RemediationPlan, RemediationStep, RemediationRequirement, PlanStatus


def read_csv(path: Path) -> List[Dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as stream:
        return list(csv.DictReader(stream))


def run_pipeline_for_cases(
    dataset_dir: Path,
    requests_path: Path,
) -> Dict[str, Dict[str, Any]]:
    """Runs the audit pipeline for a given set of requests (samples or full dataset)."""
    requests = read_csv(requests_path)
    identities = IdentityIndex(
        read_csv(dataset_dir / "user_identities.csv"),
        read_csv(dataset_dir / "user_audit_log.csv"),
    )
    policy_rows = read_csv(dataset_dir / "deletion_rules.csv")
    evidence = EvidenceStore(dataset_dir, identities)
    planner = AuditPlanner(identities, evidence, policy_rows)

    simulator = RemediationSimulator()
    results: Dict[str, Dict[str, Any]] = {}

    for req in requests:
        audit_result = planner.audit(req)
        steps = audit_result["steps"]
        status = audit_result["deletion_status"]

        # Run RemediationSimulator on INCOMPLETE plans with steps
        if status == "INCOMPLETE" and steps:
            remediation_steps = [
                RemediationStep(
                    step_id=f"step_{s['step_no']}",
                    resource_id=s["resource_id"],
                    system_id=s["system_id"],
                    operation=s["operation"],
                    state=s["state"],
                    phase=s["phase"],
                    expected_precondition="ACTIVE" if s["operation"] in {"DISABLE_DATA_FLOW", "BLOCK_RESTORE"} else "PRESENT",
                    expected_postcondition=s["state"],
                    evidence_id=s.get("evidence_id", ""),
                )
                for s in steps
                if s["phase"] == "REMEDIATION"
            ]
            if remediation_steps:
                plan = RemediationPlan(
                    case_id=req["case_id"],
                    plan_id=f"plan_{req['case_id']}",
                    plan_status=PlanStatus.READY,
                    initial_state={s.resource_id: "PRESENT" for s in remediation_steps},
                    requirements=[],
                    steps=remediation_steps,
                    active_flows=[s.resource_id for s in remediation_steps if s.operation == "DISABLE_DATA_FLOW"],
                    restore_risks=[s.resource_id for s in remediation_steps if s.operation == "BLOCK_RESTORE"],
                )
                sim_outcome = simulator.simulate(plan)
                if not sim_outcome.success:
                    pass  # Non-blocking simulation recording

        results[req["case_id"]] = {
            "case_id": req["case_id"],
            "deletion_status": status,
            "steps": steps,
        }

    return results


def process_submission(
    dataset_dir: Path,
    requests_path: Path,
    output_path: Path,
) -> List[Dict[str, Any]]:
    """Generates the validated root output.csv adhering strictly to submission constraints."""
    predicted_cases = run_pipeline_for_cases(dataset_dir, requests_path)
    results = list(predicted_cases.values())
    results.sort(key=lambda r: str(r["case_id"]))

    identities = IdentityIndex(
        read_csv(dataset_dir / "user_identities.csv"),
        read_csv(dataset_dir / "user_audit_log.csv"),
    )
    evidence = EvidenceStore(dataset_dir, identities)
    valid_evidence_ids = (
        {row["file_id"] for row in evidence.manifest}
        | {row["activity_id"] for row in evidence.activities}
        | {row["audit_id"] for row in read_csv(dataset_dir / "user_audit_log.csv")}
    )

    requests = read_csv(requests_path)
    request_case_ids = [r["case_id"] for r in requests]

    validate_rows(results, request_case_ids, valid_evidence_ids)
    write_output(results, output_path)
    return results


def main() -> None:
    parser = argparse.ArgumentParser(description="AEGIS 3.0 Deletion Audit Agent")
    parser.add_argument(
        "--dataset",
        type=Path,
        default=ROOT_DIR / "dataset",
        help="Path to dataset directory",
    )
    parser.add_argument(
        "--requests",
        type=Path,
        default=ROOT_DIR / "dataset" / "deletion_requests.csv",
        help="Path to deletion requests CSV",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=ROOT_DIR / "output.csv",
        help="Output CSV destination",
    )
    args = parser.parse_args()

    results = process_submission(args.dataset, args.requests, args.output)
    counts = Counter(r["deletion_status"] for r in results)
    print(f"Successfully wrote {len(results)} cases to {args.output}")
    print("Status distribution: " + ", ".join(f"{k}={v}" for k, v in sorted(counts.items())))


if __name__ == "__main__":
    main()
