"""AEGIS 3.1 Live Deletion Intake Database Layer.

Manages data/live_intake.db in SQLite WAL mode.
Completely isolated from benchmark output.csv, gold_database.db, and silver_database.db.
"""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

# Resolve repo root relative to this file
_THIS_DIR = Path(__file__).resolve().parent
_REPO_ROOT = _THIS_DIR.parent.parent
DB_PATH = _REPO_ROOT / "data" / "live_intake.db"


def get_live_db_connection(readonly: bool = False) -> sqlite3.Connection:
    """Connect to data/live_intake.db with WAL mode and row factory."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    if readonly and not DB_PATH.exists():
        # Create it first so readonly doesn't fail
        init_live_db()
    
    uri = f"file:{DB_PATH.resolve()}?mode={'ro' if readonly else 'rwc'}"
    conn = sqlite3.connect(uri, uri=True, timeout=10.0)
    conn.row_factory = sqlite3.Row
    if not readonly:
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
    return conn


def init_live_db() -> None:
    """Initialize the schema for live deletion requests."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH.resolve()), timeout=10.0)
    try:
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        conn.execute("""
            CREATE TABLE IF NOT EXISTS live_deletion_requests (
                ticket_id TEXT PRIMARY KEY,
                full_name TEXT NOT NULL,
                email TEXT NOT NULL,
                normalized_email TEXT NOT NULL,
                legal_framework TEXT NOT NULL,
                deletion_scope TEXT NOT NULL,
                request_text TEXT NOT NULL,
                otp_code TEXT NOT NULL,
                verified BOOLEAN NOT NULL DEFAULT 1,
                deletion_status TEXT NOT NULL,
                verdict_reason TEXT NOT NULL,
                customer_id TEXT,
                submitted_at TEXT NOT NULL,
                audit_at TEXT NOT NULL,
                receipt_hash TEXT NOT NULL,
                steps_json TEXT NOT NULL,
                resources_json TEXT NOT NULL DEFAULT '[]'
            );
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_live_email ON live_deletion_requests(normalized_email);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_live_status ON live_deletion_requests(deletion_status);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_live_submitted ON live_deletion_requests(submitted_at);")
        conn.commit()
    finally:
        conn.close()


def find_recent_request(normalized_email: str, within_seconds: int = 86400) -> Optional[Dict[str, Any]]:
    """Check if an identical request was submitted within the duplicate window (default 24h)."""
    init_live_db()
    conn = get_live_db_connection(readonly=True)
    try:
        cursor = conn.execute(
            """
            SELECT * FROM live_deletion_requests 
            WHERE normalized_email = ? 
            ORDER BY submitted_at DESC LIMIT 1
            """,
            (normalized_email,)
        )
        row = cursor.fetchone()
        if not row:
            return None
        
        row_dict = dict(row)
        submitted_at_str = row_dict.get("submitted_at", "")
        try:
            submitted_dt = datetime.fromisoformat(submitted_at_str.replace("Z", "+00:00"))
            now_dt = datetime.now(timezone.utc)
            delta_seconds = (now_dt - submitted_dt).total_seconds()
            if delta_seconds < within_seconds:
                return row_dict
        except Exception:
            pass
        return None
    finally:
        conn.close()


def insert_live_request(record: Dict[str, Any]) -> None:
    """Insert a new live deletion request into live_intake.db."""
    init_live_db()
    conn = get_live_db_connection(readonly=False)
    try:
        conn.execute(
            """
            INSERT INTO live_deletion_requests (
                ticket_id, full_name, email, normalized_email, legal_framework,
                deletion_scope, request_text, otp_code, verified, deletion_status,
                verdict_reason, customer_id, submitted_at, audit_at, receipt_hash,
                steps_json, resources_json
            ) VALUES (
                :ticket_id, :full_name, :email, :normalized_email, :legal_framework,
                :deletion_scope, :request_text, :otp_code, :verified, :deletion_status,
                :verdict_reason, :customer_id, :submitted_at, :audit_at, :receipt_hash,
                :steps_json, :resources_json
            )
            """,
            record
        )
        conn.commit()
    finally:
        conn.close()


def get_live_request(ticket_id: str) -> Optional[Dict[str, Any]]:
    """Fetch a single live deletion request by ticket_id."""
    init_live_db()
    conn = get_live_db_connection(readonly=True)
    try:
        cursor = conn.execute("SELECT * FROM live_deletion_requests WHERE ticket_id = ?", (ticket_id,))
        row = cursor.fetchone()
        if not row:
            return None
        return dict(row)
    finally:
        conn.close()


def list_live_requests(limit: int = 100) -> List[Dict[str, Any]]:
    """List recent live deletion requests."""
    init_live_db()
    conn = get_live_db_connection(readonly=True)
    try:
        cursor = conn.execute("SELECT * FROM live_deletion_requests ORDER BY submitted_at DESC LIMIT ?", (limit,))
        return [dict(r) for r in cursor.fetchall()]
    finally:
        conn.close()

