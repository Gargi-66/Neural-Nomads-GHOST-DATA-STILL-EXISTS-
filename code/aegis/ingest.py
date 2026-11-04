"""AEGIS 3.0 Evidence Ingestion Module.
Step B contract:
Reads dataset/evidence_files.csv and parses all evidence files into normalized Fact records.
Wraps the high-performance EvidenceStore engine with Fact abstraction.
"""

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, FrozenSet, List, Optional, Set

from evidence import EvidenceStore, Observation
from identity import IdentityIndex


@dataclass(frozen=True)
class Fact:
    file_id: str
    captured_at: str
    system_id: str
    resource_id: str
    category: str
    state: str
    identifiers: FrozenSet[str]
    locator: str = ""
    direct: bool = True


class EvidenceIngestor:
    """Ingests and indexes all multi-modal evidence across SQLite, SQL dumps, JSON, and logs."""

    def __init__(self, dataset_dir: Path, identity_index: IdentityIndex) -> None:
        self.dataset_dir = dataset_dir
        self.identity_index = identity_index
        self.store = EvidenceStore(dataset_dir, identity_index)

    def get_all_facts(self) -> List[Fact]:
        return [
            Fact(
                file_id=obs.evidence_id,
                captured_at=obs.observed_at,
                system_id=obs.system_id,
                resource_id=obs.resource_id,
                category=obs.category,
                state=obs.state,
                identifiers=obs.identifiers,
                locator=obs.detail,
                direct=obs.direct,
            )
            for obs in self.store.observations
        ]

    def get_coverage_summary(self) -> Dict[str, Any]:
        files_count = len(self.store.manifest)
        facts_count = len(self.store.observations)
        return {
            "manifest_files_count": files_count,
            "total_facts_ingested": facts_count,
            "facts_per_file_avg": facts_count / files_count if files_count else 0,
        }
