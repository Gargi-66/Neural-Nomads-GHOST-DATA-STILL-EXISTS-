"""AEGIS 3.0 Module 1 — Policy Loader.

Loads deletion_rules.csv, validates columns, parses types, detects malformed entries.
"""

import csv
import logging
from pathlib import Path
from typing import List, Dict, Set
from aegis.policy.models import PolicyRule, PolicyAction

logger = logging.getLogger(__name__)

REQUIRED_COLUMNS = {"rule_id", "data_category", "condition", "required_action"}
VALID_ACTIONS = {action.value for action in PolicyAction}


class PolicyLoadError(Exception):
    """Raised when deletion_rules.csv cannot be loaded or validated."""
    pass


def load_policy_rules(csv_path: str | Path) -> List[PolicyRule]:
    """Loads and validates policy rules from deletion_rules.csv.

    Raises PolicyLoadError if:
      - File does not exist
      - Required columns are missing
      - Unknown treatment action is encountered
      - Duplicate rule_id or conflicting rule exists
      - Required fields are empty
    """
    path = Path(csv_path)
    if not path.is_file():
        raise PolicyLoadError(f"Policy file not found: {csv_path}")

    rules: List[PolicyRule] = []
    seen_rule_ids: Set[str] = set()

    try:
        with open(path, mode="r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            if not reader.fieldnames:
                raise PolicyLoadError(f"Policy file is empty: {csv_path}")

            missing_cols = REQUIRED_COLUMNS - set(reader.fieldnames)
            if missing_cols:
                raise PolicyLoadError(f"Missing required columns in {csv_path}: {sorted(missing_cols)}")

            for row_idx, row in enumerate(reader, start=2):
                rule_id = (row.get("rule_id") or "").strip()
                data_category = (row.get("data_category") or "").strip()
                condition = (row.get("condition") or "").strip()
                required_action_raw = (row.get("required_action") or "").strip().upper()

                if not rule_id or not data_category or not condition or not required_action_raw:
                    raise PolicyLoadError(f"Row {row_idx}: Missing required values in policy entry: {row}")

                if rule_id in seen_rule_ids:
                    raise PolicyLoadError(f"Duplicate rule_id detected: {rule_id} at row {row_idx}")
                seen_rule_ids.add(rule_id)

                if required_action_raw not in VALID_ACTIONS:
                    raise PolicyLoadError(
                        f"Row {row_idx}: Unsupported treatment value '{required_action_raw}'. "
                        f"Allowed: {sorted(VALID_ACTIONS)}"
                    )

                action = PolicyAction(required_action_raw)
                rules.append(
                    PolicyRule(
                        rule_id=rule_id,
                        data_category=data_category,
                        condition=condition,
                        required_action=action,
                    )
                )
    except PolicyLoadError:
        raise
    except Exception as e:
        raise PolicyLoadError(f"Failed to read policy rules from {csv_path}: {e}") from e

    logger.debug("Successfully loaded %d policy rules from %s", len(rules), csv_path)
    return rules

