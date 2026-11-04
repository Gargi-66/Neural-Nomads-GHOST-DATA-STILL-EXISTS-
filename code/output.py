import csv
import json
from pathlib import Path
from typing import Any


HEADER = ["case_id", "deletion_status", "steps_json"]
ALLOWED_STEPS = {
    ("FINDING", "REPORT_REMAINING_RECORD", "PRESENT"),
    ("FINDING", "REPORT_EXPOSED_PII", "PRESENT"),
    ("FINDING", "REPORT_ACTIVE_DATA_FLOW", "ACTIVE"),
    ("FINDING", "REPORT_RESTORE_RISK", "ACTIVE"),
    ("REMEDIATION", "DISABLE_DATA_FLOW", "DISABLED"),
    ("REMEDIATION", "BLOCK_RESTORE", "BLOCKED"),
    ("REMEDIATION", "DELETE_RECORD", "ABSENT"),
    ("REMEDIATION", "REDACT_RECORD", "REDACTED"),
    ("REMEDIATION", "ANONYMIZE_RECORD", "ANONYMIZED"),
    ("VERIFICATION", "VERIFY_RECORD_ABSENT", "ABSENT"),
    ("VERIFICATION", "VERIFY_RECORD_PRESENT", "PRESENT"),
    ("VERIFICATION", "VERIFY_RECORD_REDACTED", "REDACTED"),
    ("VERIFICATION", "VERIFY_RECORD_ANONYMIZED", "ANONYMIZED"),
    ("VERIFICATION", "VERIFY_DATA_FLOW_DISABLED", "DISABLED"),
    ("VERIFICATION", "VERIFY_RESTORE_BLOCKED", "BLOCKED"),
}
STEP_FIELDS = {
    "step_no", "phase", "system_id", "resource_id", "operation", "state", "evidence_id"
}
PHASE_ORDER = {"FINDING": 0, "REMEDIATION": 1, "VERIFICATION": 2}
OPERATION_ORDER = {
    operation: index
    for index, operation in enumerate(
        (
            "REPORT_REMAINING_RECORD", "REPORT_EXPOSED_PII", "REPORT_ACTIVE_DATA_FLOW",
            "REPORT_RESTORE_RISK", "DISABLE_DATA_FLOW", "BLOCK_RESTORE", "DELETE_RECORD",
            "REDACT_RECORD", "ANONYMIZE_RECORD", "VERIFY_RECORD_ABSENT",
            "VERIFY_RECORD_PRESENT", "VERIFY_RECORD_REDACTED", "VERIFY_RECORD_ANONYMIZED",
            "VERIFY_DATA_FLOW_DISABLED", "VERIFY_RESTORE_BLOCKED",
        )
    )
}


def validate_rows(
    rows: list[dict[str, Any]],
    expected_case_ids: list[str],
    valid_evidence_ids: set[str] | None = None,
) -> None:
    if [row["case_id"] for row in rows] != sorted(expected_case_ids):
        raise ValueError("Output must contain every request exactly once, sorted by case_id")
    if len(rows) != len(expected_case_ids) or len({row["case_id"] for row in rows}) != len(rows):
        raise ValueError("Output case count does not match the request dataset")
    for row in rows:
        status = row["deletion_status"]
        steps = row["steps"]
        if status not in {"COMPLETE", "INCOMPLETE", "NOT_APPLICABLE"}:
            raise ValueError(f"Invalid deletion_status for {row['case_id']}: {status}")
        if status == "NOT_APPLICABLE" and steps:
            raise ValueError(f"NOT_APPLICABLE case {row['case_id']} must have no steps")
        if status == "COMPLETE" and not steps:
            raise ValueError(f"COMPLETE case {row['case_id']} must include verification evidence")
        if status == "COMPLETE" and not any(
            step["system_id"] == "account_service"
            and step["operation"] == "VERIFY_RECORD_ABSENT"
            and step["state"] == "ABSENT"
            for step in steps
        ):
            raise ValueError(f"COMPLETE case {row['case_id']} must verify primary profile absence")
        if status == "COMPLETE" and any(step["phase"] != "VERIFICATION" for step in steps):
            raise ValueError(f"COMPLETE case {row['case_id']} may contain verification only")
        if status == "INCOMPLETE" and steps and not any(step["phase"] == "FINDING" for step in steps):
            raise ValueError(f"INCOMPLETE case {row['case_id']} must include a finding")
        seen_steps: set[tuple[str, str, str, str]] = set()
        previous_order: tuple[int, int, str, str] | None = None
        for number, step in enumerate(steps, start=1):
            if set(step) != STEP_FIELDS or step["step_no"] != number:
                raise ValueError(f"Invalid step shape or numbering for {row['case_id']}")
            if (step["phase"], step["operation"], step["state"]) not in ALLOWED_STEPS:
                raise ValueError(f"Invalid phase/operation/state in {row['case_id']}: {step}")
            current_order = (
                PHASE_ORDER[step["phase"]], OPERATION_ORDER[step["operation"]],
                step["system_id"], step["resource_id"],
            )
            if previous_order is not None and current_order < previous_order:
                raise ValueError(f"Step ordering is invalid for {row['case_id']}")
            previous_order = current_order
            signature = (step["phase"], step["system_id"], step["resource_id"], step["operation"])
            if signature in seen_steps:
                raise ValueError(f"Duplicate semantic step for {row['case_id']}: {step}")
            seen_steps.add(signature)
            if step["evidence_id"] and valid_evidence_ids is not None and step["evidence_id"] not in valid_evidence_ids:
                raise ValueError(f"Unknown evidence_id for {row['case_id']}: {step['evidence_id']}")
            if status == "COMPLETE" and not step["evidence_id"]:
                raise ValueError(f"COMPLETE verification requires evidence in {row['case_id']}")
            if status == "INCOMPLETE" and step["phase"] in {"REMEDIATION", "VERIFICATION"} and step["evidence_id"]:
                raise ValueError(f"Future steps must have empty evidence_id in {row['case_id']}")


def write_output(rows: list[dict[str, Any]], output_path: Path) -> None:
    with output_path.open("w", newline="", encoding="utf-8") as stream:
        writer = csv.DictWriter(stream, fieldnames=HEADER, lineterminator="\n")
        writer.writeheader()
        for row in rows:
            writer.writerow(
                {
                    "case_id": row["case_id"],
                    "deletion_status": row["deletion_status"],
                    "steps_json": json.dumps(row["steps"], ensure_ascii=False, separators=(",", ":")),
                }
            )