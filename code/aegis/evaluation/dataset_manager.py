"""Dataset manager for loading, validating, and managing official and synthetic test fixtures."""

from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any, Dict, List, Optional
import pandas as pd


class EvaluationDatasetManager:
    """Manages evaluation cases, ground truth, and test fixtures safely without mutating originals."""

    def __init__(self, repo_root: Optional[Path] = None):
        if repo_root is None:
            # Current file is in code/aegis/evaluation -> parent^3 is repo root
            self.repo_root = Path(__file__).resolve().parent.parent.parent.parent
        else:
            self.repo_root = Path(repo_root)
        self.dataset_dir = self.repo_root / "dataset"

    def load_official_requests(self) -> pd.DataFrame:
        """Loads all 518 official evaluation requests."""
        path = self.dataset_dir / "deletion_requests.csv"
        if not path.exists():
            raise FileNotFoundError(f"Official requests file not found: {path}")
        return pd.read_csv(path)

    def load_sample_requests(self) -> pd.DataFrame:
        """Loads the 32 sample deletion requests."""
        path = self.dataset_dir / "sample_deletion_requests.csv"
        if not path.exists():
            raise FileNotFoundError(f"Sample requests file not found: {path}")
        return pd.read_csv(path)

    def load_sample_ground_truth(self) -> Dict[str, Dict[str, Any]]:
        """Loads the 32 sample expected outputs into a structured map keyed by case_id."""
        path = self.dataset_dir / "sample_output.csv"
        if not path.exists():
            raise FileNotFoundError(f"Sample output file not found: {path}")
        
        df = pd.read_csv(path)
        ground_truth = {}
        for _, row in df.iterrows():
            cid = str(row["case_id"]).strip()
            status = str(row["deletion_status"]).strip()
            raw_steps = row["steps_json"]
            steps = json.loads(raw_steps) if isinstance(raw_steps, str) else []
            ground_truth[cid] = {
                "case_id": cid,
                "deletion_status": status,
                "steps": steps,
            }
        return ground_truth

    def validate_output_schema(self, df: pd.DataFrame) -> List[str]:
        """Validates that a predictions DataFrame matches the official contract."""
        errors = []
        expected_cols = ["case_id", "deletion_status", "steps_json"]
        if list(df.columns) != expected_cols:
            errors.append(f"Columns mismatch: expected {expected_cols}, got {list(df.columns)}")

        valid_statuses = {"COMPLETE", "INCOMPLETE", "NOT_APPLICABLE"}
        for idx, row in df.iterrows():
            status = row.get("deletion_status")
            if status not in valid_statuses:
                errors.append(f"Row {idx} ({row.get('case_id')}): invalid deletion_status '{status}'")
            raw_steps = row.get("steps_json")
            try:
                steps = json.loads(raw_steps) if isinstance(raw_steps, str) else raw_steps
                if not isinstance(steps, list):
                    errors.append(f"Row {idx}: steps_json is not a list")
                elif status == "NOT_APPLICABLE" and len(steps) != 0:
                    errors.append(f"Row {idx}: NOT_APPLICABLE must have steps_json=[]")
            except Exception as e:
                errors.append(f"Row {idx}: steps_json failed JSON decoding: {e}")

        return errors

