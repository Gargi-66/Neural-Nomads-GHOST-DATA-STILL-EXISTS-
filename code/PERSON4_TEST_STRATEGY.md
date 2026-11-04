# PERSON 4 TEST STRATEGY & ADVERSARIAL SUITE SPECIFICATION
**AEGIS 3.0 — HackerRank Orchestrate (October 2026)**  
**Shared Testing Standards & Mutation Test Scenarios**  

---

## 1. Testing Philosophy & Zero Golden Overrides

- **No Hidden Answers**: Tests must execute purely against public participant data (`sample_deletion_requests.csv`, `sample_output.csv`) and synthesized adversarial fixtures.
- **Hermetic Testing**: Unit tests must not require internet access, API keys, or live external database instances.
- **Fail-Fast Gates**: Any violation of phase ordering, operation labels, or empty evidence_id semantics in proposed steps must trigger an immediate assertion error.

---

## 2. Test Directory Layout

```
code/tests/
├── unit/
│   ├── test_policy_engine.py       # Rule compilation and category mapping
│   ├── test_evidence_validator.py  # Temporal cutoff and provenance check
│   ├── test_remediation_planner.py # Step ordering and consecutive numbering
│   └── test_simulator.py           # Precondition & postcondition state transitions
├── integration/
│   ├── test_public_sample_regression.py # Full execution against sample_deletion_requests.csv
│   └── test_bounded_agent_tools.py      # Mocked tool-loop interactions
└── adversarial/
    ├── test_temporal_leakage.py    # Shifting audit_at before evidence capture
    ├── test_decoy_identity.py      # Fuzzy name match rejection
    ├── test_zombie_resurrection.py # Unblocked sync stream failure
    └── test_tombstone_leakage.py   # Un-redacted name/phone in tombstone
```

---

## 3. Four Mandatory Adversarial Scenarios

These four scenarios will be implemented to catch regression traps:

### Scenario 1: Temporal Cutoff Violation (`test_temporal_leakage.py`)
- **Setup**: A case has `audit_at = 2026-09-01T00:00:00Z`. An evidence file (`evidence_99`) shows a record was deleted on `2026-09-05T00:00:00Z`.
- **Expected Invariant**: `evidence_validator` MUST reject `evidence_99`. The status at `audit_at` must remain `INCOMPLETE` (the deletion had not happened yet).
- **Target Bug Exposed**: Using future evidence to falsely validate an earlier state.

### Scenario 2: Decoy Identity Injection (`test_decoy_identity.py`)
- **Setup**: Subject is `Amina El-Masri` (`user_01`). A log file contains an entry for `Amina El-Masry` (spelled with `y`, different `user_id = user_99`).
- **Expected Invariant**: The candidate fact is rejected. No records belonging to `user_99` are added to `user_01`'s deletion scope.
- **Target Bug Exposed**: Unsafe fuzzy name matching polluting the deletion scope.

### Scenario 3: Zombie Sync Resurrection Trap (`test_zombie_resurrection.py`)
- **Setup**: A primary account record is deleted, but `system_activity.csv` shows an active CDC replication sync from `account_service_replica` to `account_service`.
- **Expected Invariant**:
  - The planner must emit `REPORT_ACTIVE_DATA_FLOW` followed by `DISABLE_DATA_FLOW`.
  - The simulator must FAIL if `DELETE_RECORD` is attempted before `DISABLE_DATA_FLOW`.
- **Target Bug Exposed**: Deleting data while an active background process can recreate it.

### Scenario 4: Account Tombstone PII Leakage (`test_tombstone_leakage.py`)
- **Setup**: An account tombstone in `account_service` retains `user_id` (allowed), but also retains `phone = "+971 50 482 7316"` (prohibited under `rule_15`).
- **Expected Invariant**: The engine emits `REPORT_EXPOSED_PII` and `REDACT_RECORD`, NOT `DELETE_RECORD`.
- **Target Bug Exposed**: Over-deleting the entire tombstone (which breaks foreign keys) or failing to scrub direct identifiers.

