# Technology Stack & LLM Architecture Justification
### *AEGIS 3.0: Forensic Deletion-Audit Engine*

---

## 1. Complete Technology Stack Overview

| Domain | Technology | Version / Spec | Primary Responsibility |
|---|---|---|---|
| **Core Engine** | Python | 3.11+ | Deterministic audit logic, file ingestion, policy matrix evaluation |
| **Data Lakehouse** | SQLite (Embedded) | 3.40+ | In-memory and disk-backed relational Silver and Gold warehouses |
| **High-Perf Analytics**| DuckDB / Pandas | Latest | Fast analytical queries over raw CSVs and multi-source evidence |
| **Graph Theory** | NetworkX | 3.0+ | Directed Acyclic Graph (DAG) topological sorting for remediation plans |
| **Backend REST API** | FastAPI + Uvicorn | 0.115+ | High-throughput asynchronous REST microservice (Port 8000) |
| **Frontend Console** | React 19 + TypeScript | React 19, Vite 8 | Interactive SOC compliance dashboard and real-time radar (Port 6969) |
| **Styling & Assets** | Tailwind CSS v4 | v4.0 | Zero-runtime CSS design system with custom atmospheric animations |
| **OCR Ingestion** | Apple Vision / Swift | macOS Native | Optical character recognition for support screenshots & PDF attachments |
| **LLM Reasoning** | Gemini 2.0 / 1.5 Pro & Flash | Google GenAI API | Provenance-grounded forensic explanation & multilingual intent analysis |
| **RAG Retrieval** | AuditRetriever | Exact-ID Engine | Exact-match provenance retriever across Silver & Gold SQLite tables |

---

## 2. Why We Used These Specific Technologies

### 2.1 Backend Architecture: FastAPI + Uvicorn
- **Why chosen over Django / Flask:**
  - **Asynchronous Throughput:** High-concurrency async request processing allows real-time scanning of 94 evidence files without blocking the main event loop.
  - **Auto-Generated OpenAPI / Swagger UI:** Exposes interactive documentation at `/docs` (Port 8000), allowing enterprise compliance tools, CI/CD gates, or SOC engineers to test endpoints directly.
  - **Type Safety via Pydantic:** Eliminates schema mismatch bugs when serializing complex nested remediation plans.

### 2.2 Lakehouse Engine: SQLite & DuckDB
- **Why chosen over PostgreSQL / MySQL:**
  - **Zero-Latency Embedded Access:** Zero network roundtrip overhead; reads tables at memory bus speed.
  - **Strict Read-Only Immutability:** Uses URI flags (`mode=ro`) to mathematically guarantee that auditing operations never mutate the underlying evidence.
  - **Portability:** Self-contained single-file databases (`silver_database.db`, `gold_database.db`) can be shared, backed up, and independently verified without database server setup.

### 2.3 Graph Theory: NetworkX Directed Acyclic Graphs (DAGs)
- **Why chosen:**
  - In distributed systems, deleting data in the wrong order causes disaster:
    - *If you delete a user row in primary DB before disabling a nightly sync cron, the sync cron queries a replica and resurrects the deleted user row as a zombie.*
    - *If you delete a table without blocking an automated backup restore, the next disaster-recovery drill restores the prohibited PII.*
  - **NetworkX Topological Sort** guarantees that prerequisite operations (`DISABLE_DATA_FLOW`, `BLOCK_RESTORE`) strictly precede mutation operations (`DELETE_RECORD`, `REDACT_RECORD`), completely eliminating race conditions.

### 2.4 Frontend Console: React 19 + TypeScript + Vite (Port 6969)
- **Why chosen:**
  - **Instantaneous HMR:** Sub-second hot module replacement for frictionless live demonstrations.
  - **Component Isolation:** Modular SOC dashboard featuring:
    - *Spectral Ectoplasm Scanner* (Radar for replication lag).
    - *Investigation Modal* (3-phase live simulation).
    - *Medallion Warehouse Explorer* (Interactive Bronze, Silver, Gold inspection).
  - **Client-Side Fallback Cache:** Bundles `medallion_sample.json` and `all_cases.json` so the UI remains fully functional even in offline demonstration environments.

---

## 3. Large Language Models (LLMs): Why, Where & How

### 3.1 Which LLMs Were Used?
1. **Gemini 2.0 / 1.5 Flash**: Fast, high-throughput model for real-time linguistic classification and fast interactive queries.
2. **Gemini 1.5 Pro**: Deep reasoning model used during audit research and complex multimodal evidence synthesis (cross-referencing image OCR text with SQL replica drift).

### 3.2 Why We Chose Google Gemini Models
1. **Massive Context Window (1 Million+ Tokens)**:
   - A single deletion audit case requires analyzing customer identities, historical audit logs, system activity logs, SQL table dumps, and PDF tickets simultaneously. Gemini's massive window easily ingests entire evidence closures without truncation or information loss.
2. **Strict Grounding & Provenance Fidelity**:
   - Hallucination in compliance auditing is unacceptable—claiming a record exists when it does not, or vice versa, causes severe regulatory breach. Gemini exhibits industry-leading adherence to system prompts requiring **every claim to cite an explicit `evidence_id`, `activity_id`, or `audit_id`**.
3. **Structured JSON Mode**:
   - Enforces strict adherence to the challenge schema (`case_id`, `deletion_status`, `steps_json`), producing valid, parseable JSON arrays without markdown leaks or syntax flaws.
4. **Multilingual Intent Understanding**:
   - Deletion requests in `deletion_requests.csv` arrive in diverse global languages (English, Spanish, French, German, Japanese, Hindi, etc.). Gemini accurately determines whether a customer is demanding account erasure or simply requesting billing receipts.

### 3.3 Where LLMs Are Used vs. Where Deterministic Code Is Used

To ensure **zero hallucination** and **100% deterministic reproducibility**, we architected a strict separation of concerns:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   DETERMINISTIC VS LLM BOUNDARY                        │
├───────────────────────────────────┬────────────────────────────────────┤
│   DETERMINISTIC ENGINE (Code)     │         LLM AGENT (Gemini)         │
├───────────────────────────────────┼────────────────────────────────────┤
│ • Temporal Cutoff Enforcement     │ • Natural Language Intent          │
│   (captured_at <= audit_at)       │   Classification (Multilingual)    │
│ • Canonical Identity Alias Link   │ • Complex OCR Text Disambiguation  │
│ • NetworkX DAG Topological Sort   │ • Grounded Natural Language        │
│ • Policy Rule Matching Matrix     │   Audit Explanation (RAG)          │
│ • output.csv Step Numbering       │ • Evidence Cross-Synthesis         │
└───────────────────────────────────┴────────────────────────────────────┘
```

> **Key Architectural Takeaway:**  
> The LLM is **never allowed to guess or hallucinate step operations**. All step operations, states, and resource IDs are constrained to the official policy vocabulary (`REPORT_REMAINING_RECORD`, `DISABLE_DATA_FLOW`, `DELETE_RECORD`, etc.). The LLM serves as an intelligent forensic investigator and explainer, backed by mathematical and relational rigor.
