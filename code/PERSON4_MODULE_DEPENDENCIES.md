# PERSON 4 MODULE DEPENDENCIES & BUILD ORDER
**AEGIS 3.0 — HackerRank Orchestrate (October 2026)**  
**Module Graph, Execution Primitives & Cross-Team Handshakes**  

---

## 1. Internal Dependency & Implementation DAG

Every sub-module within Person 4 has a strict dependency order:

```mermaid
flowchart TD
    M0["Module 0: Contracts & Models<br/>(PERSON4_INTERFACES.md)"] --> M1["Module 1: Policy Engine<br/>(aegis/policy/)"]
    M0 --> M2["Module 2: Evidence Validator<br/>(aegis/validation/)"]
    M1 --> M3["Module 3: Bounded LLM Agent<br/>(aegis/agent/)"]
    M2 --> M3
    M1 --> M4["Module 4: Remediation Planner & Simulator<br/>(aegis/remediation/)"]
    M2 --> M4
    M4 --> M5["Module 5: Adversarial Testing & Evaluation<br/>(aegis/evaluation/)"]
```

### Authoritative Package Structure:
1. **Module 0**: Specification & Architecture documents (`code/PERSON4_*.md`).
2. **Module 1**: `code/aegis/policy/` (Rule compilation, tombstone logic, evaluator, validator).
3. **Module 2**: `code/aegis/validation/` (Temporal cutoff, evidence manifest, identity consistency, operation triplets).
4. **Module 3**: `code/aegis/agent/` (Bounded LLM provider, tool registry, safety gate, orchestrator).
5. **Module 4**: `code/aegis/remediation/` (Requirement extraction, DAG dependency graph, plan generator, in-memory simulator).
6. **Module 5**: `code/aegis/evaluation/` (Dataset manager, field comparator, error taxonomy, adversarial mutations, disagreement analyzer, regression engine).

---

## 2. External Integration Handshakes

### Handshake with Person 2 (Ingestion & Data Engineering):
- **Input Received**: `List[EvidenceFact]` from SQLite/DuckDB.
- **Contract Expectation**: Person 2 must supply `file_id`, `locator`, `observed_at`, and `identifiers`. If `observed_at` is missing, Person 4 rejects it as unverifiable.

### Handshake with Person 3 (Identity & Graph):
- **Input Received**: `user_id`, list of historical aliases (emails, phones, hashes), and list of active `data_flow_ids` / `backup_ids` targeting the user's records.
- **Contract Expectation**: Person 3 provides the reachability DAG. Person 4 inspects this DAG to determine whether `REPORT_ACTIVE_DATA_FLOW` or `REPORT_RESTORE_RISK` is required.

### Handshake with Person 1 (Platform & Output):
- **Output Delivered**: Fully verified, ordered `List[StepObject]` for each `case_id`.
- **Contract Guarantee**: Person 4 guarantees that all steps in `List[StepObject]` strictly satisfy consecutive integer numbering (1..N), valid operations, correct phase ordering, and empty `evidence_id: ""` on proposed steps. Person 1 can directly dump this into `output.csv`.

