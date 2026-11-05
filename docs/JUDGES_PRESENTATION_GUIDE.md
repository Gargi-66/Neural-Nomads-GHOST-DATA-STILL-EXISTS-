# Judges Presentation Guide & Pitch Blueprint
### *HackerRank Orchestrate: Ghost Data Still Exists*

---

## 1. Presentation Structure (5 Minutes Total)

```
[0:00 - 1:00]  Act I:   The \$2.4M Incident & What "Ghost Data" Actually Means
[1:00 - 2:30]  Act II:  Live Web Console Demo (:6969) - Radar, Simulation & DAG
[2:30 - 3:45]  Act III: Medallion Architecture (Bronze -> Silver -> Gold)
[3:45 - 4:30]  Act IV:  Backend Microservice (:8000 /docs) & Deterministic Output
[4:30 - 5:00]  Act V:   Q&A Defense & Closing
```

---

## 2. Step-by-Step Spoken Script

### Act I: The Incident & Problem (1 Minute)
> *"Good morning judges. In modern enterprise architecture, clicking 'Delete Account' is often an illusion. Secondary read replicas lag behind, nightly sync crons resurrect deleted rows, and unrotated logs silently store customer PII.*  
>  
> *This is the \$2.4M crisis faced by Northstar Shop: a customer whose deletion was marked 'Complete' came back as a digital ghost when they tried to sign up again weeks later. To permanently solve this, we built **AEGIS 3.0**: an AI-powered forensic deletion-audit system that cross-references multi-modal evidence across 94 physical files, enforces strict temporal cutoffs, and generates deterministic, safe remediation plans."*

### Act II: Live Web Console Demo (Port 6969) (1.5 Minutes)
*(Show `http://localhost:6969/`)*

1. **The Hero Dashboard**:
   > *"Here is the AEGIS SOC Console. Notice our 3 headline audit metrics: 518 evaluation cases processed, 323 incomplete cases flagged where systems falsely claimed completion, and zero temporal cutoff leakage."*
2. **Spectral Ectoplasm Scanner (Radar)**:
   > *"Below the hero is our real-time radar scanner. It constantly pings distributed storage targets. Notice Target #1: `failover_replica_db.sql`. The primary database claimed the record was purged, but our engine caught a 320ms replication lag where the user record survived in the failover cluster."*
3. **Simulate Exorcism**:
   > *(Click "Simulate Exorcism" or "Sample Case" button)*  
   > *"Let's simulate remediation on `case_09`. Notice our live audit logs: first, our engine discovers historical email aliases. Then, our NetworkX topological planner discovers active sync flows. We do NOT delete records first—we disable data flows first, block backup restores second, and only then purge the records."*

### Act III: The Medallion Architecture (1 Minute)
*(Click "Architecture" in the navbar)*

1. **The Architecture Diagram**:
   > *"Here is our United Customer Data Model using the Medallion Lakehouse Architecture:  
   > • **Bronze Layer:** Raw ingestion of 518 deletion requests, 850 identities, 4,011 activity logs, and 94 multi-modal evidence captures.  
   > • **Silver Layer:** 8 normalized relational tables in `silver_database.db` joining customer dimensions, resource states, and policy rules.  
   > • **Gold Layer:** Ground truth analytical decisions in `gold_database.db` classifying cases as COMPLETE, INCOMPLETE, or NOT_APPLICABLE."*
2. **The Grounded RAG Assistant**:
   > *(Click "Grounded RAG Assistant" tab, click `case_09`)*  
   > *"Using our AuditRetriever and Gemini 2.0, compliance officers can ask any case question and receive an explanation where every single sentence cites verified provenance chunks."*

### Act IV: The Backend & Output (45 Seconds)
*(Switch to `http://localhost:8000/docs` and show `output.csv`)*

1. **FastAPI Microservice (Port 8000)**:
   > *"AEGIS is not just a mockup—it is powered by this live FastAPI backend running on port 8000. Enterprise systems can trigger `POST /api/exorcise/{case_id}` to receive structured forensic plans via REST API."*
2. **Official Output**:
   > *"All 518 cases are compiled in `output.csv`, formatted in strict compliance with the challenge schema, with 100% deterministic reproducibility and zero hallucination."*

---

## 3. Anticipated Judge Questions & Bulletproof Answers

| Expected Judge Question | Your Winning Answer |
|---|---|
| **"Why not just run `DELETE FROM users WHERE id = X`?"** | *"Because in distributed systems, deleting data while a sync cron or backup restore is active causes the next cycle to resurrect the user as a zombie record. Our NetworkX DAG planner always disables data flows and blocks restores before modifying records."* |
| **"How did you handle users who changed their email address?"** | *"We parse `user_audit_log.csv` and cross-reference historical aliases with `user_identities.csv`. Even if the deletion request only cites the old email, our engine discovers all past aliases, hashes, and stable user IDs."* |
| **"What prevents the LLM from hallucinating records?"** | *"We enforce a strict separation of concerns: the LLM is only used for multilingual intent classification and natural language explanation. All evidence indexing, policy rule matching, and DAG topological sorting are 100% deterministic Python and SQLite code."* |
| **"What is an Account Tombstone?"** | *"Under GDPR and accounting compliance, transaction history must be retained. We preserve the stable `user_id` as a tombstone while redacting prohibited direct PII (name, email, phone)."* |

