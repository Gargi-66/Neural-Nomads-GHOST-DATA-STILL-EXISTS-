"""Test suite for AEGIS 3.1 Live Deletion Intake Pipeline.

Verifies:
1. Invalid OTP rejection (enforces 849201).
2. Unknown email Zero-Trust handling (NOT_APPLICABLE, NO_RECORD_FOUND, 0 steps).
3. Known email identity resolution & DAG remediation plan generation.
4. Idempotency & 24h duplicate submission prevention.
5. Non-deletion intent rejection (export / marketing opt-out only).
6. Temporal cutoff consistency (audit_at == submitted_at).
7. Cryptographic receipt verification (SHA-256 hash).
8. PII masking before dispatching to external LLMs.
9. FastAPI live endpoints integration (POST /api/intake, GET /api/intake/{id}, GET /api/cases).
10. Benchmark output.csv immutability check.
"""

import hashlib
import json
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

from live.engine import LiveIntakeEngine, verify_otp_code, is_deletion_authorized
from live.db import get_live_request, list_live_requests
from llm.audit_explainer import mask_pii
from api.app import app

BENCHMARK_OUTPUT_HASH = "225aca95073a6a1ac09bc71e59fa9302d4b6c9bf1f5881f76e07f44582aa4907"


@pytest.fixture
def intake_engine():
    return LiveIntakeEngine()


@pytest.fixture
def api_client():
    return TestClient(app)


def test_invalid_otp_rejection(intake_engine):
    """Enforce that invalid verification codes are rejected."""
    assert not verify_otp_code("123456")
    assert not verify_otp_code("000000")
    assert verify_otp_code("849201")
    assert verify_otp_code("849-201")

    with pytest.raises(ValueError, match="Invalid OTP verification code"):
        intake_engine.process_intake(
            full_name="Bob Test",
            email="bob@example.com",
            otp_code="999999"
        )


def test_unknown_email_zero_trust(intake_engine):
    """Zero-Trust Audit: Unknown emails must never claim COMPLETE, but return NOT_APPLICABLE."""
    unknown_email = f"stranger_unknown_{hashlib.md5(b'test').hexdigest()[:8]}@untracked.org"
    result = intake_engine.process_intake(
        full_name="Unknown Subject",
        email=unknown_email,
        request_text="Delete all my personal records and data immediately.",
        otp_code="849201"
    )

    assert result["status"] == "NOT_APPLICABLE"
    assert "NO_RECORD_FOUND" in result["verdict_reason"]
    assert result["steps"] == []
    assert len(result["receipt_hash"]) == 64


def test_known_email_dag_plan(intake_engine):
    """Known customer with remaining data produces an INCOMPLETE status with ordered DAG steps."""
    result = intake_engine.process_intake(
        full_name="Mariam Nasser",
        email="nasser.mariam@gmail.com",
        request_text="Please permanently erase all my accounts, support records, and search entries.",
        otp_code="849-201"
    )

    assert result["status"] == "INCOMPLETE"
    assert result["customer_id"] == "user_98"
    assert len(result["steps"]) > 0

    # Verify topological phase ordering: FINDING -> REMEDIATION -> VERIFICATION
    phases = [s["phase"] for s in result["steps"]]
    finding_indices = [i for i, p in enumerate(phases) if p == "FINDING"]
    remediation_indices = [i for i, p in enumerate(phases) if p == "REMEDIATION"]
    verification_indices = [i for i, p in enumerate(phases) if p == "VERIFICATION"]

    if finding_indices and remediation_indices:
        assert max(finding_indices) < min(remediation_indices)
    if remediation_indices and verification_indices:
        assert max(remediation_indices) < min(verification_indices)


def test_duplicate_24h_window_idempotency(intake_engine):
    """Identical requests within 24h must return existing ticket with idempotent=True."""
    email = "nasser.mariam@gmail.com"
    first = intake_engine.process_intake(
        full_name="Mariam Nasser",
        email=email,
        otp_code="849201"
    )
    second = intake_engine.process_intake(
        full_name="Mariam Nasser",
        email=email,
        otp_code="849201"
    )

    assert second["idempotent"] is True
    assert second["ticket_id"] == first["ticket_id"]
    assert second["receipt_hash"] == first["receipt_hash"]


def test_non_deletion_intent_rejected(intake_engine):
    """Inquiry, download, or opt-out requests must be classified as NOT_APPLICABLE."""
    assert not is_deletion_authorized("Please do not delete my account, only export my data.")
    assert not is_deletion_authorized("I want to update my email address only.")

    unique_email = f"download_only_{hashlib.md5(b'exp').hexdigest()[:6]}@example.com"
    result = intake_engine.process_intake(
        full_name="Export Only",
        email=unique_email,
        request_text="Please do not delete my account, only download my data.",
        otp_code="849201"
    )

    assert result["status"] == "NOT_APPLICABLE"
    assert result["steps"] == []


def test_temporal_cutoff_submission_time(intake_engine):
    """The temporal cutoff for a live request is the submission timestamp."""
    unique_email = f"temporal_{hashlib.md5(b'time').hexdigest()[:6]}@example.com"
    result = intake_engine.process_intake(
        full_name="Time Subject",
        email=unique_email,
        otp_code="849201"
    )

    assert result["submitted_at"] == result["audit_at"]
    assert "T" in result["audit_at"]


def test_pii_masking_for_llm():
    """Verify regex-based PII redaction before external LLM dispatch."""
    raw_text = "Contact user Alice at alice.smith@gmail.com or phone +1-555-019-2834 regarding case_100."
    sanitized = mask_pii(raw_text)

    assert "alice.smith@gmail.com" not in sanitized
    assert "[REDACTED_EMAIL]" in sanitized
    assert "+1-555-019-2834" not in sanitized
    assert "[REDACTED_PHONE]" in sanitized
    assert "case_100" in sanitized  # Retains forensic case reference


def test_fastapi_live_endpoints_integration(api_client):
    """Verify live API endpoints end-to-end."""
    # 1. Invalid OTP rejection
    bad_res = api_client.post("/api/intake", json={
        "full_name": "API Tester",
        "email": "tester@domain.com",
        "otp_code": "000000"
    })
    assert bad_res.status_code == 400

    # 2. Valid submission
    unique_email = f"api_user_{hashlib.md5(b'live').hexdigest()[:6]}@domain.com"
    good_res = api_client.post("/api/intake", json={
        "full_name": "API Live Subject",
        "email": unique_email,
        "legal_framework": "CCPA",
        "deletion_scope": "ALL_PERSONAL_DATA",
        "request_text": "Please delete all my account data.",
        "otp_code": "849201"
    })
    assert good_res.status_code == 200
    ticket_id = good_res.json()["ticket_id"]

    # 3. Retrieve intake ticket
    ticket_res = api_client.get(f"/api/intake/{ticket_id}")
    assert ticket_res.status_code == 200
    assert ticket_res.json()["ticket_id"] == ticket_id

    # 4. Check merged cases endpoint
    cases_res = api_client.get("/api/cases?limit=10")
    assert cases_res.status_code == 200
    cases_list = cases_res.json()["cases"]
    assert any(c.get("case_id") == ticket_id for c in cases_list)
    assert any(c.get("source") == "live" for c in cases_list)
    assert any(c.get("source") == "benchmark" for c in cases_list)

    # 5. Live CSV export
    export_res = api_client.get("/api/live/export.csv")
    assert export_res.status_code == 200
    assert "ticket_id,full_name,email" in export_res.text
    assert ticket_id in export_res.text


def test_benchmark_artifacts_untouched():
    """Guarantee non-negotiable rule: output.csv is 100% unchanged."""
    root_csv = Path(__file__).resolve().parent.parent / "output.csv"
    assert root_csv.exists()

    with open(root_csv, "rb") as f:
        content = f.read()
        computed_hash = hashlib.sha256(content).hexdigest()

    assert computed_hash == BENCHMARK_OUTPUT_HASH, "output.csv was modified or corrupted!"
