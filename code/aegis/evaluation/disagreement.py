"""Disagreement analyzer for comparing LLM agent proposals against deterministic decisions."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from aegis.evaluation.models import DisagreementItem


class DisagreementAnalyzer:
    """Tracks, classifies, and queues discrepancies between bounded LLM proposals and deterministic engines."""

    def __init__(self):
        self.review_queue: List[DisagreementItem] = []

    def check_evidence_admissibility_disagreement(
        self,
        case_id: str,
        evidence_id: str,
        deterministic_admissible: bool,
        llm_accepted: bool,
    ) -> Optional[DisagreementItem]:
        """Flags when LLM accepted evidence that the deterministic engine marked inadmissible (or vice versa)."""
        if deterministic_admissible != llm_accepted:
            item = DisagreementItem(
                case_id=case_id,
                decision_type="EVIDENCE_ADMISSIBILITY",
                deterministic_verdict=deterministic_admissible,
                llm_verdict=llm_accepted,
                evidence_id=evidence_id,
                requires_review=True,
            )
            self.review_queue.append(item)
            return item
        return None

    def check_policy_treatment_disagreement(
        self,
        case_id: str,
        resource_id: str,
        deterministic_action: str,
        llm_proposed_action: str,
        rule_id: Optional[str] = None,
    ) -> Optional[DisagreementItem]:
        """Flags when LLM proposed an action (e.g. DELETE) conflicting with deterministic policy (e.g. RETAIN)."""
        if deterministic_action != llm_proposed_action:
            item = DisagreementItem(
                case_id=case_id,
                decision_type="POLICY_TREATMENT",
                deterministic_verdict=deterministic_action,
                llm_verdict=llm_proposed_action,
                resource_id=resource_id,
                rule_id=rule_id,
                requires_review=True,
            )
            self.review_queue.append(item)
            return item
        return None

    def get_unresolved_count(self) -> int:
        """Returns the number of unadjudicated disagreements in the review queue."""
        return sum(1 for item in self.review_queue if not item.adjudicated)

    def adjudicate_item(self, index: int, notes: str, upheld_deterministic: bool = True) -> bool:
        """Records an adjudication decision on a queued disagreement item."""
        if 0 <= index < len(self.review_queue):
            item = self.review_queue[index]
            item.adjudicated = True
            item.adjudication_notes = f"Upheld deterministic: {upheld_deterministic}. Notes: {notes}"
            item.requires_review = False
            return True
        return False

