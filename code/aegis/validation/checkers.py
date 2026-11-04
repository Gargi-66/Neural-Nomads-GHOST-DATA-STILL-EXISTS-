"""AEGIS 3.0 Module 2 — Provenance, Identity, Temporal, Resource & Policy Checkers.
"""

from datetime import datetime
from typing import Dict, Tuple, Set, Optional

from aegis.validation.models import (
    CandidateFinding,
    EvidenceMetadata,
    IdentityContext,
    ValidationErrorCode,
)
from aegis.policy.models import ResourceContext, PolicyAction
from aegis.policy.compiler import CompiledPolicy
from aegis.policy.evaluator import evaluate_policy, UnresolvedPolicyError


def validate_provenance(candidate: CandidateFinding, manifest: Dict[str, EvidenceMetadata]) -> Tuple[bool, Optional[str]]:
    """Checks whether the referenced evidence ID exists in the manifest."""
    evidence_id = candidate.evidence_id.strip()
    if not evidence_id:
        return False, "Evidence reference is empty."
    if evidence_id not in manifest:
        return False, f"Evidence reference '{evidence_id}' not found in evidence manifest."
    return True, None


def validate_identity(candidate: CandidateFinding, identity: IdentityContext) -> Tuple[bool, Optional[str]]:
    """Checks that candidate belongs to the resolved identity and does not use unsupported fuzzy matches."""
    if candidate.user_id != identity.user_id:
        return False, f"Candidate user_id '{candidate.user_id}' does not match investigated user '{identity.user_id}'."

    all_valid = identity.verified_identifiers | identity.historical_identifiers
    if candidate.present_identifiers:
        # Check if at least one identifier is verified or if any present identifier belongs to someone else
        matched = False
        for ident in candidate.present_identifiers:
            norm = ident.strip().lower()
            if norm in all_valid or ident in all_valid:
                matched = True
            elif "user_" in norm and norm != identity.user_id:
                return False, f"Candidate contains conflicting user identifier '{ident}'."
        if not matched:
            return False, f"Identifiers {candidate.present_identifiers} cannot be authoritatively linked to '{identity.user_id}'."

    return True, None


def validate_temporal(
    candidate: CandidateFinding,
    audit_at: datetime,
    manifest: Dict[str, EvidenceMetadata]
) -> Tuple[bool, Optional[str]]:
    """Validates temporal admissibility against case audit_at.

    Rules:
    1. If candidate has an event_timestamp (e.g. log event time), it must be <= audit_at.
    2. A capture timestamp alone does not invalidate historical events, but if both event and capture
       are after audit_at, it is strictly inadmissible.
    3. An event occurring after audit_at cannot prove state before audit_at.
    """
    ev_meta = manifest.get(candidate.evidence_id)
    if not ev_meta:
        return False, f"Missing evidence metadata for '{candidate.evidence_id}'."

    # If the event itself happened after audit_at -> strictly inadmissible
    if candidate.event_timestamp and candidate.event_timestamp > audit_at:
        return False, (
            f"Event timestamp '{candidate.event_timestamp.isoformat()}' "
            f"occurred after audit cutoff '{audit_at.isoformat()}'."
        )

    # If no event timestamp is specified and file was captured after audit_at -> inadmissible
    if not candidate.event_timestamp and ev_meta.captured_at > audit_at:
        return False, (
            f"Evidence captured_at '{ev_meta.captured_at.isoformat()}' "
            f"is after audit cutoff '{audit_at.isoformat()}' with no earlier event timestamp."
        )

    return True, None


def validate_resource(
    candidate: CandidateFinding,
    supported_systems: Set[str],
    known_resource_map: Optional[Dict[str, str]] = None
) -> Tuple[bool, Optional[str]]:
    """Validates that system_id and resource_id are non-empty and consistent."""
    if not candidate.system_id or not candidate.resource_id:
        return False, "Candidate system_id or resource_id is empty."

    if candidate.system_id not in supported_systems:
        return False, f"System '{candidate.system_id}' is not recognized in active platform topology."

    if known_resource_map:
        expected_system = known_resource_map.get(candidate.resource_id)
        if expected_system and expected_system != candidate.system_id:
            return False, (
                f"Resource '{candidate.resource_id}' belongs to system '{expected_system}', "
                f"not claimed system '{candidate.system_id}'."
            )

    return True, None


def validate_policy_consistency(
    candidate: CandidateFinding,
    policy: CompiledPolicy
) -> Tuple[bool, Optional[str]]:
    """Validates that proposed treatment conforms to Module 1 policy rules."""
    cat_upper = candidate.data_category.upper()
    res_ctx = ResourceContext(
        resource_id=candidate.resource_id,
        system_id=candidate.system_id,
        data_category=candidate.data_category,
        present_identifiers=candidate.present_identifiers,
        is_tombstone=(cat_upper == "ACCOUNT_TOMBSTONE"),
        is_shared_context=(cat_upper == "SUPPORT_MESSAGE"),
        legal_hold_active=(cat_upper == "LEGAL_HOLD_RECORD"),
    )
    try:
        decision = evaluate_policy(res_ctx, policy)
    except UnresolvedPolicyError as e:
        return False, str(e)

    if candidate.proposed_treatment and candidate.proposed_treatment != decision.required_action:
        return False, (
            f"Candidate proposes treatment '{candidate.proposed_treatment.value}' "
            f"which contradicts policy rule '{decision.rule_id}' requiring '{decision.required_action.value}'."
        )

    return True, None

