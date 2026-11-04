"""Adversarial test generator for creating controlled mutations of deletion investigation scenarios."""

from __future__ import annotations

import copy
from datetime import datetime, timezone
from typing import Any, Dict, List
from aegis.evaluation.models import AdversarialTestCase, FailureCategory, MutationType


class AdversarialTestGenerator:
    """Generates deterministic, controlled adversarial test scenarios with explicit expected outcomes."""

    def generate_temporal_cutoff_mutation(
        self,
        base_case_id: str,
        audit_at: datetime,
        evidence_id: str,
        delta_seconds: int = 3600,
    ) -> AdversarialTestCase:
        """Mutates an evidence timestamp to be after the audit cutoff."""
        mutated_time = datetime.fromtimestamp(audit_at.timestamp() + delta_seconds, tz=timezone.utc)
        return AdversarialTestCase(
            mutation_id=f"MUT-TEMP-{base_case_id}",
            parent_case_id=base_case_id,
            mutation_type=MutationType.TEMPORAL_CUTOFF,
            description=f"Evidence {evidence_id} timestamp moved to {mutated_time.isoformat()} (post audit_at {audit_at.isoformat()}).",
            parameters={
                "evidence_id": evidence_id,
                "original_audit_at": audit_at.isoformat(),
                "mutated_captured_at": mutated_time.isoformat(),
            },
            expected_admissible=False,
            expected_failure_category=FailureCategory.TEMPORAL_CUTOFF_VIOLATION,
            expected_rejection_reason="Evidence captured_at is strictly after audit cutoff.",
        )

    def generate_decoy_identity_mutation(
        self,
        base_case_id: str,
        target_user_id: str,
        decoy_user_id: str,
        evidence_id: str,
    ) -> AdversarialTestCase:
        """Injects evidence belonging to a decoy user instead of the target subject."""
        return AdversarialTestCase(
            mutation_id=f"MUT-DECOY-{base_case_id}",
            parent_case_id=base_case_id,
            mutation_type=MutationType.DECOY_EVIDENCE,
            description=f"Evidence {evidence_id} belongs to decoy {decoy_user_id}, not subject {target_user_id}.",
            parameters={
                "target_user_id": target_user_id,
                "decoy_user_id": decoy_user_id,
                "evidence_id": evidence_id,
            },
            expected_admissible=False,
            expected_failure_category=FailureCategory.IDENTITY_RESOLUTION_FAILURE,
            expected_rejection_reason="Evidence identity does not match subject or validated alias.",
        )

    def generate_retention_conflict_mutation(
        self,
        base_case_id: str,
        resource_id: str,
        category: str = "SECURITY_AUDIT_LOG",
    ) -> AdversarialTestCase:
        """Changes a resource into a legally retained category and tests that deletion is blocked."""
        return AdversarialTestCase(
            mutation_id=f"MUT-RET-{base_case_id}",
            parent_case_id=base_case_id,
            mutation_type=MutationType.RETENTION_CONFLICT,
            description=f"Resource {resource_id} designated as {category} requiring retention.",
            parameters={
                "resource_id": resource_id,
                "category": category,
            },
            expected_admissible=True,
            expected_failure_category=FailureCategory.RETENTION_VIOLATION,
            expected_rejection_reason="Resource required by policy to be retained; DELETE operation prohibited.",
        )

    def generate_sync_recreation_mutation(
        self,
        base_case_id: str,
        source_system: str,
        target_resource: str,
        data_flow_id: str,
    ) -> AdversarialTestCase:
        """Simulates an active synchronization stream targeting a deleted resource."""
        return AdversarialTestCase(
            mutation_id=f"MUT-SYNC-{base_case_id}",
            parent_case_id=base_case_id,
            mutation_type=MutationType.SYNC_RECREATION,
            description=f"Active connector {data_flow_id} can recreate {target_resource} from {source_system}.",
            parameters={
                "data_flow_id": data_flow_id,
                "target_resource": target_resource,
                "source_system": source_system,
                "flow_state": "ACTIVE",
            },
            expected_admissible=True,
            expected_status="INCOMPLETE",
            expected_failure_category=FailureCategory.SYNCHRONIZATION_RECREATION_RISK,
            expected_rejection_reason="Active synchronization process recreation path detected.",
        )

    def generate_backup_restoration_mutation(
        self,
        base_case_id: str,
        backup_resource_id: str,
        target_record_id: str,
    ) -> AdversarialTestCase:
        """Simulates a backup restore path that can restore previously deleted data."""
        return AdversarialTestCase(
            mutation_id=f"MUT-BKUP-{base_case_id}",
            parent_case_id=base_case_id,
            mutation_type=MutationType.BACKUP_RESTORATION,
            description=f"Backup archive {backup_resource_id} has restore_allowed=True for {target_record_id}.",
            parameters={
                "backup_id": backup_resource_id,
                "target_record_id": target_record_id,
                "restore_allowed": True,
            },
            expected_admissible=True,
            expected_status="INCOMPLETE",
            expected_failure_category=FailureCategory.BACKUP_RESTORATION_RISK,
            expected_rejection_reason="Unblocked backup restoration path detected.",
        )

    def generate_hallucinated_reference_mutation(
        self,
        base_case_id: str,
        invented_evidence_id: str,
    ) -> AdversarialTestCase:
        """Injects a completely fabricated evidence reference into a proposed finding."""
        return AdversarialTestCase(
            mutation_id=f"MUT-HALLUC-{base_case_id}",
            parent_case_id=base_case_id,
            mutation_type=MutationType.HALLUCINATED_REFERENCE,
            description=f"Proposed finding cites non-existent evidence_id '{invented_evidence_id}'.",
            parameters={
                "invented_evidence_id": invented_evidence_id,
            },
            expected_admissible=False,
            expected_failure_category=FailureCategory.HALLUCINATED_EVIDENCE_REFERENCE,
            expected_rejection_reason="Evidence reference not found in evidence manifest.",
        )

