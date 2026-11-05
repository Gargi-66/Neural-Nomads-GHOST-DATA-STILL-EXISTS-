# 👻 AEGIS 3.0: Ghost Data Still Exists
> **AI-Powered Deterministic Deletion-Audit & Forensic Lakehouse Engine**  
> *HackerRank Orchestrate (October 2026)*

[![Python 3.11+](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB.svg)](https://react.dev/)
[![SQLite Lakehouse](https://img.shields.io/badge/SQLite-Lakehouse-003B57.svg)](https://www.sqlite.org/)
[![Google Gemini](https://img.shields.io/badge/Gemini-2.0%20Flash%20%2F%20Pro-8E24AA.svg)](https://ai.google.dev/)
[![Evaluation Status](https://img.shields.io/badge/Evaluation-518%2F518%20Verified-success.svg)](output.csv)

---

## 📌 Executive Summary

When a company claims account deletion is **Complete**, personal data frequently still haunts read replicas, cold backups, sync crons, and unrotated logs. Northstar Shop lost **\$2.4 Million** when a supposedly deleted customer resurfaced weeks later.

**AEGIS 3.0** is an enterprise-grade forensic deletion audit platform that establishes ground truth at audit cutoff. It inspects **94 multi-modal evidence captures** across **518 evaluation cases**, reconstructs historical identity aliases, and generates mathematically sound, dependency-ordered DAG remediation plans.

---

## 🏛️ System Architecture

### United Customer Data Model (Medallion Lakehouse)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MEDALLION ARCHITECTURE                          │
├────────────────────────────────────────────────────────────────────────┤
│  [BRONZE LAYER]                                                        │
│  Raw Ingestion: deletion_requests (518) • user_identities (850)        │
│  user_audit_log (306) • system_activity (4,011) • evidence_files (94)  │
│  24 SQL Replicas, Logs, OCR Attachments, JSON Exports                  │
├───────────────────────────────────┬────────────────────────────────────┤
│                                   │                                    │
│  [SILVER LAYER]                   │  [GOLD LAYER]                      │
│  Normalized Relational Lakehouse  │  Analytical Audit Warehouse        │
│  data/silver/silver_database.db   │  gold/gold_database.db             │
│  • dim_customer (850)             │  • customer_deletion_audit (518)   │
│  • fact_deletion_request (518)    │  • resource_audit (1,388)          │
│  • dim_identity_history (306)     │  • deletion_summary                │
│  • fact_resource (2,046)          │  • system_deletion_summary         │
│  • fact_case_data_link (1,216)    │                                    │
└───────────────────────────────────┴────────────────────────────────────┘
```

For complete architectural specifications, see [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## ⚡ Key Features

1. **Deterministic Linguistic Gate:** Differentiates genuine erasure requests from GDPR access/opt-out requests (`NOT_APPLICABLE`).
2. **Canonical Identity & Alias Recovery:** Traverses audit logs to discover historical emails, phone numbers, and SHA-256 hashes.
3. **Temporal Cutoff Guard (Admissibility Gate):** Strictly enforces `captured_at <= audit_at`—evidence captured after cutoff is rejected.
4. **NetworkX DAG Remediation Planning:** Topological dependency sorting ensures active sync crons (`DISABLE_DATA_FLOW`) and backup paths (`BLOCK_RESTORE`) are halted *before* record deletion (`DELETE_RECORD`).
5. **Interactive SOC Console (Port 6969):** React 19 dashboard featuring a live replication radar scanner, case explorer, and 3-phase exorcism simulation.
6. **FastAPI Microservice (Port 8000):** Asynchronous REST API with auto-generated OpenAPI documentation (`/docs`).
7. **Provenance-Grounded RAG Assistant:** Ingests Gold & Silver warehouse facts to explain decisions citing verified evidence IDs.

For technology choices and LLM justification, see [`docs/TECH_STACK_AND_LLMS.md`](docs/TECH_STACK_AND_LLMS.md).

---

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ & npm

### 2. Run the Full 518-Case Python Engine
To execute the deterministic audit pipeline and generate `output.csv`:

```bash
python3 code/main.py
```

### 3. Start the FastAPI Backend Service (Port 8000)
```bash
PYTHONPATH=code uvicorn api.app:app --host 0.0.0.0 --port 8000 --reload
```
- Interactive Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- Medallion Overview: `GET /api/medallion/overview`
- Grounded RAG Query: `POST /api/medallion/rag/query`

### 4. Start the Forensic Web Console (Port 6969)
```bash
cd web
npm install
npm run dev -- --port 6969
```
- Open [http://localhost:6969/](http://localhost:6969/) in your browser.

---

## 📂 Project Structure

```
hack-halloween/
├── code/
│   ├── aegis/                     # Core forensic investigation & evidence indexer
│   ├── api/app.py                 # FastAPI REST microservice
│   ├── main.py                    # 518-case pipeline entrypoint
│   ├── silver.py                  # Silver lakehouse builder
│   └── silver_streaming.py        # Streaming silver processor
├── data/
│   └── silver/
│       └── silver_database.db     # 8 normalized relational tables (2.9 MB)
├── dataset/                       # 518 requests, identities, rules, and 94 evidence files
├── docs/
│   ├── ARCHITECTURE.md            # In-depth architectural & data model documentation
│   ├── TECH_STACK_AND_LLMS.md     # Technology stack & LLM justification
│   └── JUDGES_PRESENTATION_GUIDE.md # 5-minute pitch script & Q&A defense
├── gold/
│   ├── gold_database.db           # Analytical audit warehouse (592 KB)
│   ├── customer_deletion_audit.csv # 518 case audit results
│   └── resource_audit.csv         # 1,388 verified resources
├── llm/                           # Gemini 2.0 / 1.5 audit explainer & prompts
├── rag/                           # Provenance-grounded exact-match retriever
├── web/                           # React 19 + TypeScript + Vite SOC Console (Port 6969)
├── output.csv                     # Official 518-case verified submission
└── README.md
```

---

## 🏆 Presentation Guide for Judges

A complete, timed 5-minute presentation script and anticipated Q&A defense is available in [`docs/JUDGES_PRESENTATION_GUIDE.md`](docs/JUDGES_PRESENTATION_GUIDE.md).

---

## 📄 License & Challenge Rules
Built for **HackerRank Orchestrate (October 2026)** — *Ghost Data Still Exists*. Uses strictly participant-facing data with zero organizer shortcuts.
