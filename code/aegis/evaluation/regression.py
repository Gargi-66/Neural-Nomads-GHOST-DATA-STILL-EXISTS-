"""Regression testing engine for replaying confirmed edge cases and verifying bugfixes remain solid."""

from __future__ import annotations

from typing import Any, Callable, Dict, List, Optional
from pydantic import BaseModel, Field


class RegressionFixture(BaseModel):
    """Encapsulates a regression test case with its setup and expected outcome."""
    fixture_id: str
    description: str
    target_module: str
    payload: Dict[str, Any] = Field(default_factory=dict)
    expected_result: Any
    created_at: str = "2026-11-04T19:40:00Z"


class RegressionEngine:
    """Manages and executes regression test fixtures against AEGIS modules."""

    def __init__(self):
        self.fixtures: Dict[str, RegressionFixture] = {}
        self._init_standard_regression_fixtures()

    def register_fixture(self, fixture: RegressionFixture) -> None:
        """Registers a new regression fixture."""
        self.fixtures[fixture.fixture_id] = fixture

    def _init_standard_regression_fixtures(self) -> None:
        """Seeds the standard suite of regression cases established during Modules 1-4 development."""
        # 1. Historical alias recovery regression
        self.register_fixture(
            RegressionFixture(
                fixture_id="REG-01-HISTORICAL-EMAIL",
                description="Historical email in audit log must resolve to canonical user_id.",
                target_module="aegis.validation",
                payload={"email": "l.fontaine46@yahoo.com", "expected_user_id": "user_43"},
                expected_result="user_43",
            )
        )
        # 2. Post-audit cutoff rejection regression
        self.register_fixture(
            RegressionFixture(
                fixture_id="REG-02-POST-AUDIT-REJECTION",
                description="Evidence captured after audit_at must be strictly rejected as inadmissible.",
                target_module="aegis.validation",
                payload={
                    "audit_at": "2026-09-03T11:30:00Z",
                    "evidence_captured_at": "2026-09-05T06:30:00Z",
                },
                expected_result=False,
            )
        )
        # 3. Legal audit record retention regression
        self.register_fixture(
            RegressionFixture(
                fixture_id="REG-03-AUDIT-LOG-RETENTION",
                description="Security audit record within retention period must evaluate to RETAIN, not DELETE.",
                target_module="aegis.policy",
                payload={"category": "SECURITY_AUDIT_LOG", "condition": "Record is within the supplied retention period"},
                expected_result="RETAIN",
            )
        )
        # 4. Dependency ordering: sync disable before record deletion
        self.register_fixture(
            RegressionFixture(
                fixture_id="REG-04-SYNC-ORDERING",
                description="DISABLE_DATA_FLOW must strictly precede DELETE_RECORD in remediation sequence.",
                target_module="aegis.remediation",
                payload={"operations": ["DELETE_RECORD", "DISABLE_DATA_FLOW"]},
                expected_result=["DISABLE_DATA_FLOW", "DELETE_RECORD"],
            )
        )

    def replay_fixture(self, fixture_id: str, test_runner: Callable[[RegressionFixture], bool]) -> bool:
        """Executes a specific regression fixture using a supplied test runner function."""
        if fixture_id not in self.fixtures:
            raise KeyError(f"Regression fixture '{fixture_id}' not found.")
        return test_runner(self.fixtures[fixture_id])

    def replay_all(self, test_runner: Callable[[RegressionFixture], bool]) -> Dict[str, bool]:
        """Executes all registered regression fixtures and returns results per fixture_id."""
        return {fid: test_runner(fix) for fid, fix in self.fixtures.items()}

