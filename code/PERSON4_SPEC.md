# PERSON 4 SPECIFICATION: DETERMINISTIC POLICY, EVIDENCE ASSURANCE & BOUNDED REMEDIATION
**HackerRank Orchestrate — Ghost Data Still Exists**  
**Workstream**: Person 4 — Policy, LLM Tools & Simulator  
**Status**: Authoritative Architectural Baseline (Module 0)  
**Parent Contract**: `hackerrank-orchestrate-october26/AGENTS.md` and `problem_statement.md`  

---

## 1. System Mission & Core Boundaries

Person 4 is responsible for turning evidence candidates into compliant, ordered, dependency-safe findings and remediation plans without allowing an LLM to override ground-truth facts.

### 1.1 The Inviolable Separation of Powers
To prevent hallucinations, data poisoning, and non-deterministic scoring penalties:
1. **Person 2 (Ingestion)** owns raw file parsing, SHA-256 content hashing, and locator extraction.
2. **Person 3 (Identity & Graph)** owns historical alias resolution and the system activity reachability graph.
3. **Person 4 (This Subsystem)** owns:
   - Compiling and executing `deletion_rules.csv`.
   - Admissibility filtering (rejection of post-cutoff evidence).
   - Constrained LLM investigation tool-use.
   - Remediation planning & in-memory simulation.
   - Disagreement triage and adversarial mutation testing.
4. **Person 1 (Platform & Output)** owns the final CLI runner, `output.csv` serialization, and evaluation packaging.

```
       ┌────────────────────────┐      ┌────────────────────────┐
       │ Person 2: Ingest/Facts │      │ Person 3: Graph/Ident  │
       └───────────┬────────────┘      └───────────┬────────────┘
                   │                               │
                   └───────────────┬───────────────┘
                                   ▼
        ┌─────────────────────────────────────────────────────┐
        │        PERSON 4 SUBSYSTEM (POLICY & SIMULATOR)      │
        │                                                     │
        │  [1. Policy Engine]         [2. Evidence Validator] │
        │   - deletion_rules.csv       - Audit-at Cutoff      │
        │   - Retention vs Redaction   - Provenance Check     │
        │                                                     │
        │  [3. Bounded LLM Agent]     [4. Remediation Plan]   │
        │   - Read-only tools only     - Dependency Sorter    │
        │   - Zero final authority     - Strict Op Order      │
        │                                                     │
        │  [5. Remediation Simulator] [6. Adversarial Triage] │
        │   - Pre/Postcondition test   - Mutation testing     │
        │   - State transition check   - Disagreement queue   │
        └──────────────────────────┬──────────────────────────┘
                                   │
                                   ▼
                   ┌───────────────────────────────┐
                   │ Person 1: output.csv & Runner │
                   └───────────────────────────────┘
```

### 1.2 The Sovereign Rule of the LLM
The LLM is a **constrained reading assistant**, NOT an adjudicator.
- **NEVER** let the LLM set `deletion_status`.
- **NEVER** let the LLM invent or modify `case_id`, `system_id`, `resource_id`, or `evidence_id`.
- **NEVER** let the LLM choose an operation outside the 15 allowed verbs in `AGENTS.md`.
- **NEVER** let the LLM write to `output.csv` or SQLite.
- Any LLM suggestion is treated as a **Candidate Fact** until validated by deterministic code against physical files and `audit_at`.

---

## 2. Component Taxonomy & Responsibilities

| Sub-Module | Responsibility | Determinism | Owner |
| :--- | :--- | :--- | :--- |
| **`policy_engine`** | Compiles `deletion_rules.csv` into a deterministic rule evaluator mapping data categories (`USER_PROFILE`, `ACCOUNT_TOMBSTONE`, etc.) to actions (`DELETE`, `REDACT`, `ANONYMIZE`, `RETAIN`). | 100% Pure Deterministic | Person 4 |
| **`evidence_validator`** | Verifies candidate facts: checks timestamp $\le \text{audit\_at}$, checks physical existence in `evidence_files.csv`, matches user identity. | 100% Pure Deterministic | Person 4 |
| **`llm_adapter`** | Provider-agnostic client (Gemini, Claude, OpenAI, Ollama) enforcing JSON schemas, retries, timeout budgets, and token usage accounting. | External / Network | Person 4 |
| **`bounded_agent`** | ReAct tool loop restricted to read-only diagnostic tools (`search_evidence`, `inspect_resource`, `inspect_flows`, `propose_finding`). | Bounded Stochastic | Person 4 |
| **`remediation_planner`** | Converts validated findings and unfulfilled policy rules into dependency-ordered remediation and verification steps. | 100% Pure Deterministic | Person 4 |
| **`remediation_simulator`**| Isolated state machine that applies proposed steps in sequence, checking if all zombie syncs are disabled before deletion, and confirming postconditions. | 100% Pure Deterministic | Person 4 |
| **`adversarial_suite`** | Synthesizes mutation cases (temporal shift, decoy identity, phantom sync) to prove the agent detects violations and does not leak false positives. | 100% Pure Deterministic | Person 4 |
| **`disagreement_triage`**| Compares candidate facts against deterministic ground rules. Produces diagnostics when models or heuristics disagree. | 100% Pure Deterministic | Person 4 |

---

## 3. Ground Truth Data Schema Alignments

Based on physical inspection of `dataset/` in `hackerrank-orchestrate-october26`:

1. **`deletion_requests.csv`**:
   - `case_id` (str, e.g., `case_01`)
   - `email` (str, request subject email)
   - `requested_at` (ISO-8601 UTC timestamp)
   - `reported_status` (`COMPLETE`, `PARTIALLY_COMPLETE`, `NOT_STARTED` — workflow claims only!)
   - `reported_at` (ISO-8601 UTC timestamp)
   - `audit_at` (ISO-8601 UTC timestamp — strict cutoff boundary)
   - `request_text` (str, customer statement)
2. **`deletion_rules.csv`** (Compiled Policy):
   - `rule_id`: `rule_01` to `rule_15`
   - `data_category`: `USER_PROFILE`, `SECONDARY_IDENTIFIER`, `SEARCH_INDEX_ENTRY`, `CACHE_ENTRY`, `SUPPORT_MESSAGE`, `SUPPORT_ATTACHMENT`, `ANALYTICS_PROFILE`, `PRODUCT_TELEMETRY`, `USER_EXPORT`, `MARKETING_PROFILE`, `EMAIL_DELIVERY_LOG`, `SECURITY_AUDIT_LOG`, `LEGAL_HOLD_RECORD`, `BACKUP_ARCHIVE`, `ACCOUNT_TOMBSTONE`
   - `required_action`: `DELETE`, `REDACT`, `ANONYMIZE`, `RETAIN`
3. **`evidence_files.csv`**:
   - `file_id`: `evidence_01` to `evidence_N`
   - `file_path`: Relative path under `dataset/`
   - `origin`: Originating service
   - `captured_at`: ISO-8601 UTC timestamp

