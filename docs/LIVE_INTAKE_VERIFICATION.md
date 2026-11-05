# AEGIS 3.1 Live Intake Pipeline: Phase 0 Forensic Verification Report

**Date**: 2026-11-05  
**Harness / Tool**: `antigravity`  
**Model**: `gemini-3.8-flash-high`  
**Target Repository**: `hack-halloween`  
**Status**: Verified & Audited against Ground Truth  

---

## 1. Verification of Owner-Reported Claims

| Claim ID | Owner-Reported Claim | Ground Truth Status | Verification Details & File References |
|---|---|---|---|
| **C-01** | `/api/exorcise/{case_id}` exists in FastAPI backend | **WRONG** | Grepped codebase and inspected `code/api/app.py`. The endpoint does not exist anywhere in the code. It was described in architectural presentation docs but was never implemented. We will not depend on it. |
| **C-02** | `code/api/app.py` serves `/api/cases`, `/api/dashboard`, `/api/medallion/case/{case_id}/resources` | **CONFIRMED** | Verified in `code/api/app.py`: `/api/dashboard` at L151, `/api/cases` at L215, `/api/cases/{case_id}` at L254, `/api/medallion/case/{case_id}/resources` at L274. |
| **C-03** | Silver DB contains `dim_customer`, `fact_deletion_request`, `dim_identity_history`, `fact_resource`, `fact_case_data_link` | **CONFIRMED** | Inspected `data/silver/silver_database.db` via sqlite3. All 8 tables exist (`fact_deletion_request`, `dim_customer`, `dim_identity_history`, `fact_resource`, `fact_activity`, `fact_evidence`, `dim_deletion_policy`, `fact_case_data_link`). |
| **C-04** | Gold DB contains `customer_deletion_audit`, `resource_audit`, `system_deletion_summary`, `warehouse_build_metadata` | **CONFIRMED** | Inspected `gold/gold_database.db` via sqlite3. All 4 tables exist and are properly indexed (`customer_deletion_audit`, `resource_audit`, `system_deletion_summary`, `warehouse_build_metadata`). |
| **C-05** | Benchmark dataset has exactly 518 cases | **CONFIRMED** | Verified in `dataset/deletion_requests.csv` (519 lines including header = exactly 518 rows). |
| **C-06** | Browser React console can run Python engine in TypeScript | **WRONG / REJECTED** | No Python engine exists in TypeScript. Per Non-Negotiable Rule 4, live requests are processed by the real Python engine via FastAPI (`POST /api/intake`). The frontend only communicates with FastAPI, falling back to a labeled offline demo simulation if the backend is unreachable. |

---

## 2. Benchmark Case ID Format vs. Live Ticket Format

- **Benchmark Cases**: Strict format `case_01`, `case_02`, ... `case_518` (lowercase prefix `case_`, consecutive numbering). Grader strictly enforces 518 rows sorted by `case_id` in `output.csv`.
- **Live Ticket Format**: Must use a distinct namespaced prefix to guarantee zero collision:
  - Format: `CASE-LIVE-{TIMESTAMP}-{HEX4}` (e.g., `CASE-LIVE-20261105-8F2B`) or sequence `CASE-LIVE-0001`.
  - Stored exclusively in `data/live_intake.db` (never in `output.csv`, `gold/gold_database.db`, or `data/silver/silver_database.db`).

---

## 3. Exact JSON Shapes of `/api/cases` and `/api/cases/{case_id}`

### `GET /api/cases`
Response Envelope:
```json
{
  "dataset": "challenge",
  "total": 518,
  "page": 1,
  "limit": 50,
  "cases": [
    {
      "case_id": "case_100",
      "customer_id": "user_98",
      "request_date": "2026-08-04T06:00:00Z",
      "request_status": "COMPLETE",
      "audit_cutoff": "2026-09-01T06:00:00Z",
      "overall_deletion_status": "INCOMPLETE",
      "deletion_completion_status": "INCOMPLETE",
      "deleted_resource_count": 0,
      "anonymized_resource_count": 0,
      "archived_resource_count": 0,
      "retained_resource_count": 0,
      "pending_resource_count": 0,
      "unverified_resource_count": 0,
      "total_resource_count": 2,
      "completion_percentage": 0.0,
      "policy_exception_count": 0,
      "unresolved_identity_count": 0,
      "evidence_completeness": "COMPLETE",
      "last_verified_at": "",
      "analysis_timestamp": "2026-11-05T04:14:50Z",
      "request_text": "Please close my account...",
      "evidence_references": "evidence_89",
      "source": "benchmark"
    }
  ]
}
```

### `GET /api/cases/{case_id}`
Response contains the case dictionary above, plus:
```json
{
  "resources": [
    {
      "case_id": "case_100",
      "customer_id": "user_98",
      "resource_id": "account_98",
      "system_id": "account_service",
      "resource_type": "USER_PROFILE",
      "silver_state": "PRESENT",
      "verified_state": "PRESENT",
      "policy_action": "DELETE",
      "policy_reason": "Policy P01 requires erasure",
      "evidence_references": "evidence_89",
      "classification_reason": "Identifiable personal data",
      "last_verified_at": "2026-08-15T00:00:00Z",
      "audit_cutoff": "2026-09-01T06:00:00Z"
    }
  ],
  "steps": [ ... ]
}
```

When returning live cases, we add `"source": "live"` (while benchmark cases have `"source": "benchmark"`).

---

## 4. Single-Case Execution Path in Python Engine

In `code/planner.py`, `AuditPlanner.audit(request: dict[str, str])` is already designed to process an individual request dictionary:
```python
request = {
    "case_id": "CASE-LIVE-0001",
    "email": "user@example.com",
    "requested_at": "2026-11-05T14:30:00Z",
    "reported_status": "NOT_STARTED",
    "reported_at": "2026-11-05T14:30:00Z",
    "audit_at": "2026-11-05T14:30:00Z",
    "request_text": "Delete all my personal records and data under GDPR",
}
```
Execution takes < 50ms per single case using in-memory `IdentityIndex` and `EvidenceStore`.

---

## 5. Live Case Resource Scoping Proposal (Zero Benchmark Mutation)

To preserve the 518 benchmark cases and grader integrity:
1. **Never write to `fact_case_data_link` or Silver DB**: Silver DB is opened in read-only mode (`?mode=ro`).
2. **Customer Identity Resolution**:
   - Query `dim_customer` and `dim_identity_history` in `data/silver/silver_database.db` (read-only) using normalized email.
   - If found $\to$ retrieve `customer_id`.
   - Query `fact_resource` where `customer_id = ?` to obtain all personal resources.
3. **Handling Unknown Emails (Zero-Trust Rule)**:
   - If an email does not match any record in `dim_customer` or `dim_identity_history`, do NOT mark `COMPLETE`.
   - Per zero-trust audit principles, if no data exists to audit, the status is `NOT_APPLICABLE` with verdict `NO_RECORD_FOUND` and empty steps `[]`.
4. **Isolated Storage**:
   - All live requests are written to `data/live_intake.db` in SQLite WAL mode.
   - Schema includes `ticket_id`, `full_name`, `email`, `legal_framework`, `deletion_scope`, `request_text`, `status`, `submitted_at`, `audit_at`, `steps_json`, `receipt_hash`.

