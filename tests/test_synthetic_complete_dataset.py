"""
AEGIS 3.1 — Synthetic Complete Deletion Dataset Validation Suite.
Validates:
1. Conformance into 8 Silver entities with exact expected record counts.
2. Complete end-to-end Gold pipeline execution.
3. 100% verified complete deletion decisions (8 / 8 cases).
4. Full evidence attribution and zero pending/unverified residue.
"""
from __future__ import annotations

import sqlite3
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "code"))
sys.path.insert(0, str(ROOT))

from clean_synthetic_silver import clean_synthetic_to_silver


class SyntheticCompleteDeletionDatasetTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.results = clean_synthetic_to_silver()

    def test_silver_layer_tables_and_row_counts(self):
        silver_db = Path(self.results["silver_db"])
        self.assertTrue(silver_db.exists(), f"Silver database {silver_db} must exist")
        conn = sqlite3.connect(silver_db)
        try:
            req_count = conn.execute("SELECT COUNT(*) FROM fact_deletion_request").fetchone()[0]
            cust_count = conn.execute("SELECT COUNT(*) FROM dim_customer").fetchone()[0]
            res_count = conn.execute("SELECT COUNT(*) FROM fact_resource").fetchone()[0]
            act_count = conn.execute("SELECT COUNT(*) FROM fact_activity").fetchone()[0]
            evd_count = conn.execute("SELECT COUNT(*) FROM fact_evidence").fetchone()[0]
            pol_count = conn.execute("SELECT COUNT(*) FROM dim_deletion_policy").fetchone()[0]
            link_count = conn.execute("SELECT COUNT(*) FROM fact_case_data_link").fetchone()[0]

            self.assertEqual(req_count, 8, "Silver layer must contain exactly 8 deletion requests")
            self.assertEqual(cust_count, 8, "Silver layer must contain exactly 8 customers")
            self.assertEqual(res_count, 24, "Silver layer must contain 24 resources (3 per customer)")
            self.assertEqual(act_count, 24, "Silver layer must contain 24 activities")
            self.assertEqual(evd_count, 24, "Silver layer must contain 24 evidence confirmations")
            self.assertEqual(pol_count, 3, "Silver layer must contain 3 policies")
            self.assertEqual(link_count, 24, "Silver layer must contain 24 links")
        finally:
            conn.close()

    def test_streamlined_analysis_shows_eight_completed_people(self):
        gold_db = Path(self.results["gold_db"])
        self.assertTrue(gold_db.exists(), f"Gold database {gold_db} must exist")
        conn = sqlite3.connect(gold_db)
        conn.row_factory = sqlite3.Row
        try:
            rows = conn.execute("SELECT * FROM customer_deletion_audit").fetchall()
            self.assertEqual(len(rows), 8, "Streamlined audit must evaluate exactly 8 cases")

            completed_cases = [r for r in rows if r["overall_deletion_status"] == "COMPLETE"]
            self.assertEqual(len(completed_cases), 8, "Count of completed cases must be exactly 8")

            # Verify every case and resource is strictly verified
            for r in rows:
                self.assertEqual(r["overall_deletion_status"], "COMPLETE")
                self.assertEqual(r["deletion_completion_status"], "VERIFIED")
                self.assertEqual(r["deleted_resource_count"], 3)
                self.assertEqual(r["pending_resource_count"], 0)
                self.assertEqual(r["unverified_resource_count"], 0)

            # Check individual resources
            resources = conn.execute("SELECT * FROM resource_audit").fetchall()
            self.assertEqual(len(resources), 24, "Must contain exactly 24 resource audit rows")
            for res in resources:
                self.assertEqual(res["verified_state"], "DELETED")
                self.assertEqual(res["policy_action"], "DELETE")
                self.assertTrue(len(res["evidence_references"]) > 0, "Resource must have evidence references")
        finally:
            conn.close()


if __name__ == "__main__":
    unittest.main()

