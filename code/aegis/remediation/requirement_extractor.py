"""AEGIS 3.0 Module 4 — Remediation Requirement Extractor.

Converts validated investigation findings and compiled policy decisions into normalized requirements.
"""

from typing import List, Dict, Set
from aegis.validation.models import CandidateFinding
from aegis.policy.models import ResourceContext, PolicyAction
from aegis.policy.evaluator import evaluate_policy
from aegis.policy.compiler import CompiledPolicy
from aegis.remediation.models import RemediationRequirement


def extract_remediation_requirements(
    case_id: str,
    findings: List[CandidateFinding],
    policy: CompiledPolicy,
) -> List[RemediationRequirement]:
    """Extracts required actions for all validated finding resources.

    Deterministic:
    - Queries Module 1 evaluate_policy()
    - Preserves evidence provenance
    - Identifies tombstones and field restrictions
    """
    requirements: List[RemediationRequirement] = []
    seen_resources: Set[str] = set()

    for f in findings:
        res_key = f"{f.system_id}:{f.resource_id}"
        if res_key in seen_resources:
            continue
        seen_resources.add(res_key)

        is_tomb = (f.data_category.upper() == "ACCOUNT_TOMBSTONE")
        ctx = ResourceContext(
            resource_id=f.resource_id,
            system_id=f.system_id,
            data_category=f.data_category,
            present_identifiers=f.present_identifiers,
            is_tombstone=is_tomb,
        )

        decision = evaluate_policy(ctx, policy)

        req = RemediationRequirement(
            case_id=case_id,
            resource_id=f.resource_id,
            system_id=f.system_id,
            data_category=f.data_category,
            required_action=decision.required_action,
            supporting_evidence_ids=[f.evidence_id] if f.evidence_id else [],
            current_state=f.state,
            is_tombstone=is_tomb,
            prohibited_fields=decision.prohibited_identifiers,
            permitted_fields=decision.permitted_identifiers,
            rule_id=decision.rule_id,
        )
        requirements.append(req)

    return requirements

