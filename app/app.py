from __future__ import annotations

import io
import json
import sqlite3
import sys
from pathlib import Path

import pandas as pd
import plotly.express as px
import streamlit as st

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

GOLD_DB = ROOT / "gold" / "gold_database.db"
SILVER_DB = ROOT / "data" / "silver" / "silver_database.db"
BRONZE_MANIFEST = ROOT / "data" / "bronze" / "evidence_files.csv"
LIVE_DB = ROOT / "data" / "live_intake.db"


def readonly_connection(database: Path) -> sqlite3.Connection:
    connection = sqlite3.connect(f"file:{database.resolve()}?mode=ro", uri=True)
    connection.row_factory = sqlite3.Row
    return connection


@st.cache_data(ttl="15m", max_entries=20)
def load_gold_tables() -> tuple[pd.DataFrame, pd.DataFrame]:
    with readonly_connection(GOLD_DB) as connection:
        cases = pd.read_sql_query("SELECT * FROM customer_deletion_audit ORDER BY case_id", connection)
        resources = pd.read_sql_query("SELECT * FROM resource_audit ORDER BY case_id, resource_id", connection)
    return cases, resources


@st.cache_data(ttl="15m", max_entries=20)
def load_silver_tables() -> dict[str, pd.DataFrame]:
    with readonly_connection(SILVER_DB) as connection:
        names = {
            "requests": "fact_deletion_request", "customers": "dim_customer",
            "identity_history": "dim_identity_history", "resources": "fact_resource",
            "activities": "fact_activity", "evidence": "fact_evidence",
            "policies": "dim_deletion_policy", "links": "fact_case_data_link",
        }
        return {name: pd.read_sql_query(f"SELECT * FROM {table}", connection) for name, table in names.items()}


@st.cache_data(ttl="15m", max_entries=20)
def load_bronze_manifest() -> pd.DataFrame:
    return pd.read_csv(BRONZE_MANIFEST) if BRONZE_MANIFEST.exists() else pd.DataFrame()


@st.cache_data(ttl="15m", max_entries=20)
def load_synthetic_source_tables() -> dict[str, pd.DataFrame]:
    dataset_dir = ROOT / "dataset"
    paths = {
        "requests": "deletion_requests.csv", "identities": "user_identities.csv",
        "identity_history": "user_audit_log.csv", "activity": "system_activity.csv",
        "rules": "deletion_rules.csv", "evidence_manifest": "evidence_files.csv",
    }
    return {name: pd.read_csv(dataset_dir / filename) for name, filename in paths.items()}


@st.cache_data(ttl="15m", max_entries=20)
def load_synthetic_results() -> pd.DataFrame:
    path = ROOT / "output.csv"
    if not path.exists():
        return pd.DataFrame(columns=["case_id", "deletion_status", "steps_json"])
    return pd.read_csv(path)


@st.cache_data(ttl="5s", max_entries=20)
def load_live_requests() -> pd.DataFrame:
    if not LIVE_DB.exists():
        return pd.DataFrame()
    try:
        with readonly_connection(LIVE_DB) as connection:
            return pd.read_sql_query("SELECT * FROM live_deletion_requests ORDER BY submitted_at DESC", connection)
    except Exception:
        return pd.DataFrame()


st.set_page_config(page_title="Synthetic Deletion Audit Warehouse", layout="wide")
st.title("Synthetic Data Deletion Audit Warehouse")

overview, bronze_tab, silver_tab, gold_tab, results_tab, live_tab = st.tabs([
    "Overview", "Bronze analysis", "Silver analysis", "Gold analysis",
    "Synthetic data analysis", "Live intake",
])

with overview:
    st.subheader("Synthetic warehouse overview")
    bronze = load_bronze_manifest()
    silver = load_silver_tables()
    gold_cases, gold_resources = load_gold_tables()
    with st.container(horizontal=True):
        st.metric("Bronze evidence", len(bronze), border=True)
        st.metric("Silver requests", len(silver["requests"]), border=True)
        st.metric("Silver resources", len(silver["resources"]), border=True)
        st.metric("Gold cases", len(gold_cases), border=True)
        st.metric("Gold resources", len(gold_resources), border=True)

    c1, c2 = st.columns(2)
    with c1:
        with st.container(border=True):
            st.markdown("**Synthetic data lineage**")
            st.markdown("```mermaid\nflowchart LR\nB[Bronze] --> S[Silver]\nS --> G[Gold]\nG --> R[Final synthetic analysis]\n```")
    with c2:
        with st.container(border=True):
            st.markdown("**Current coverage**")
            st.write("Bronze evidence types:", bronze["evidence_type"].nunique() if not bronze.empty else 0)
            st.write("Silver resource types:", silver["resources"]["resource_type"].nunique())
            st.write("Gold audit statuses:", gold_cases["overall_deletion_status"].nunique())

with bronze_tab:
    st.subheader("Bronze: raw synthetic evidence")
    bronze = load_bronze_manifest()
    if bronze.empty:
        st.warning("The Bronze evidence manifest is unavailable.")
    else:
        with st.container(horizontal=True):
            st.metric("Evidence files", len(bronze), border=True)
            st.metric("Evidence types", bronze["evidence_type"].nunique(), border=True)
            st.metric("File formats", bronze["file_format"].nunique(), border=True)
        c1, c2 = st.columns(2)
        with c1:
            chart = bronze["evidence_type"].fillna("Unknown").value_counts().rename_axis("evidence_type").reset_index(name="count")
            st.plotly_chart(px.bar(chart, x="evidence_type", y="count", title="Evidence types"), width="stretch")
        with c2:
            chart = bronze["file_format"].fillna("Unknown").value_counts().rename_axis("file_format").reset_index(name="count")
            st.plotly_chart(px.bar(chart, x="file_format", y="count", title="Evidence formats"), width="stretch")
        st.dataframe(bronze, hide_index=True, alt="Synthetic Bronze evidence manifest")

with silver_tab:
    st.subheader("Silver: cleaned synthetic entities")
    silver = load_silver_tables()
    with st.container(horizontal=True):
        st.metric("Customers", len(silver["customers"]), border=True)
        st.metric("Identity changes", len(silver["identity_history"]), border=True)
        st.metric("Activities", len(silver["activities"]), border=True)
        st.metric("Evidence observations", len(silver["evidence"]), border=True)

    silver_view = st.segmented_control("Silver table", options=["Requests", "Customers", "Resources", "Activities", "Evidence", "Policies", "Links"])
    table_map = {
        "Requests": "requests", "Customers": "customers", "Resources": "resources",
        "Activities": "activities", "Evidence": "evidence", "Policies": "policies", "Links": "links",
    }
    selected = silver[table_map[silver_view]] if silver_view else silver["requests"]
    st.dataframe(selected, hide_index=True, alt="Synthetic Silver table")

with gold_tab:
    st.subheader("Gold: synthetic warehouse outcomes")
    if not GOLD_DB.exists():
        st.warning("Gold warehouse is missing. Run `python3 gold/build_gold.py` first.")
    else:
        cases, resources = load_gold_tables()
        status_counts = cases["overall_deletion_status"].fillna("UNKNOWN").value_counts()
        resource_counts = resources["verified_state"].fillna("UNKNOWN").value_counts()
        complete_count = int(status_counts.get("COMPLETE", 0) + status_counts.get("COMPLETE_WITH_EXCEPTION", 0))
        with st.container(horizontal=True):
            st.metric("Gold cases", len(cases), border=True)
            st.metric("Complete", complete_count, border=True)
            st.metric("Incomplete", int(status_counts.get("INCOMPLETE", 0)), border=True)
            st.metric("Unverified", int(status_counts.get("UNVERIFIED", 0)), border=True)
            st.metric("Gold resources", len(resources), border=True)

        chart_statuses = status_counts.reindex(
            ["COMPLETE", "COMPLETE_WITH_EXCEPTION", "INCOMPLETE", "UNVERIFIED", "UNKNOWN", "PENDING", "NOT_APPLICABLE"],
            fill_value=0,
        )
        chart = chart_statuses.rename_axis("warehouse_status").reset_index(name="count")
        chart["display_status"] = chart["warehouse_status"].replace({"COMPLETE_WITH_EXCEPTION": "Complete with exception"})
        st.plotly_chart(
            px.bar(
                chart,
                x="display_status",
                y="count",
                color="display_status",
                title="Gold warehouse status (zero complete included)",
                text="count",
            ),
            width="stretch",
        )
        warehouse_view = st.segmented_control("Gold table", options=["Cases", "Resources"])
        st.dataframe(resources if warehouse_view == "Resources" else cases, hide_index=True, alt="Synthetic Gold warehouse records")

        st.subheader("Search Gold details")
        c1, c2, c3, c4 = st.columns(4)
        with c1:
            search_case = st.text_input("Case ID", key="gold_search_case")
        with c2:
            search_user = st.text_input("User or customer ID", key="gold_search_user")
        with c3:
            search_resource = st.text_input("Resource ID", key="gold_search_resource")
        with c4:
            search_status = st.selectbox(
                "Verified status",
                ["All"] + sorted(resources["verified_state"].dropna().unique().tolist()),
                key="gold_search_status",
            )

        filtered_resources = resources.copy()
        if search_user:
            filtered_resources = filtered_resources[
                filtered_resources["customer_id"].fillna("").str.contains(search_user, case=False, regex=False)
            ]
        if search_resource:
            filtered_resources = filtered_resources[
                filtered_resources["resource_id"].fillna("").str.contains(search_resource, case=False, regex=False)
            ]
        if search_status != "All":
            filtered_resources = filtered_resources[filtered_resources["verified_state"] == search_status]

        filtered_cases = cases.copy()
        if search_case:
            filtered_cases = filtered_cases[filtered_cases["case_id"].fillna("").str.contains(search_case, case=False, regex=False)]
        if search_user:
            filtered_cases = filtered_cases[filtered_cases["customer_id"].fillna("").str.contains(search_user, case=False, regex=False)]
        if search_resource:
            matching_case_ids = set(filtered_resources["case_id"])
            filtered_cases = filtered_cases[filtered_cases["case_id"].isin(matching_case_ids)]
        if search_status != "All":
            matching_case_ids = set(filtered_resources["case_id"])
            filtered_cases = filtered_cases[filtered_cases["case_id"].isin(matching_case_ids)]

        detail_view = st.segmented_control("Detail type", options=["Cases", "Resources"], key="gold_detail_view")
        if detail_view == "Resources":
            st.dataframe(filtered_resources, hide_index=True, alt="Filtered synthetic Gold resources")
        else:
            st.dataframe(filtered_cases, hide_index=True, alt="Filtered synthetic Gold cases")

with results_tab:
    st.subheader("Synthetic data analysis")
    st.caption("Uses only participant-facing synthetic dataset files and the final `output.csv` predictions.")
    source = load_synthetic_source_tables()
    results = load_synthetic_results()

    with st.container(horizontal=True):
        st.metric("Synthetic requests", len(source["requests"]), border=True)
        st.metric("Synthetic users", source["identities"]["user_id"].nunique(), border=True)
        st.metric("Identity changes", len(source["identity_history"]), border=True)
        st.metric("System activities", len(source["activity"]), border=True)
        st.metric("Evidence files", len(source["evidence_manifest"]), border=True)

    if results.empty:
        st.warning("No final synthetic results are available. Generate root `output.csv` first.")
    else:
        def count_steps(value: str) -> int:
            try:
                steps = json.loads(value)
                return len(steps) if isinstance(steps, list) else 0
            except (TypeError, json.JSONDecodeError):
                return 0

        results = results.copy()
        results["step_count"] = results["steps_json"].fillna("[]").apply(count_steps)

        known_statuses = set(results["deletion_status"])
        status_counts = results["deletion_status"].fillna("UNVERIFIED").value_counts()
        if "UNVERIFIED" not in known_statuses:
            missing_statuses = len(results[results["deletion_status"].isna()])
            if missing_statuses:
                status_counts["UNVERIFIED"] = missing_statuses

        c1, c2 = st.columns(2)
        with c1:
            status_chart = status_counts.rename_axis("status").reset_index(name="count")
            st.plotly_chart(px.bar(status_chart, x="status", y="count", color="status", title="Synthetic deletion status", text="count"), width="stretch")
        with c2:
            step_chart = results["step_count"].value_counts().sort_index().rename_axis("step_count").reset_index(name="case_count")
            st.plotly_chart(px.bar(step_chart, x="step_count", y="case_count", title="Cases by remediation-plan length", text="case_count"), width="stretch")

        with st.container(horizontal=True):
            st.metric("Complete", int(status_counts.get("COMPLETE", 0)), border=True)
            st.metric("Incomplete", int(status_counts.get("INCOMPLETE", 0)), border=True)
            st.metric("Not applicable", int(status_counts.get("NOT_APPLICABLE", 0)), border=True)
            st.metric("Unverified", int(status_counts.get("UNVERIFIED", 0)), border=True)
            st.metric("Average steps", round(results["step_count"].mean(), 1), border=True)

        status_filter = st.multiselect("Synthetic status", sorted(status_counts.index.tolist()))
        filtered = results[results["deletion_status"].isin(status_filter)] if status_filter else results.copy()

        st.subheader("Search synthetic details")
        c1, c2, c3, c4 = st.columns(4)
        with c1:
            search_case = st.text_input("Case ID", key="synthetic_search_case")
        with c2:
            search_user = st.text_input("User or customer ID", key="synthetic_search_user")
        with c3:
            search_resource = st.text_input("Resource ID", key="synthetic_search_resource")
        with c4:
            search_status = st.selectbox(
                "Final status",
                ["All"] + sorted(filtered["deletion_status"].dropna().unique().tolist()),
                key="synthetic_search_status",
            )

        detail_resources = gold_resources if "gold_resources" in locals() else load_gold_tables()[1]
        if search_resource:
            detail_resources = detail_resources[
                detail_resources["resource_id"].fillna("").str.contains(search_resource, case=False, regex=False)
            ]
        if search_status != "All":
            filtered = filtered[filtered["deletion_status"] == search_status]
        if search_case:
            filtered = filtered[filtered["case_id"].fillna("").str.contains(search_case, case=False, regex=False)]
        if search_user:
            matching_case_ids = set(
                detail_resources[detail_resources["customer_id"].fillna("").str.contains(search_user, case=False, regex=False)]["case_id"]
            )
            filtered = filtered[filtered["case_id"].isin(matching_case_ids)]
        if search_resource:
            matching_case_ids = set(detail_resources["case_id"])
            filtered = filtered[filtered["case_id"].isin(matching_case_ids)]

        st.dataframe(filtered, hide_index=True, alt="Filtered final synthetic prediction results")

        selected_case = st.selectbox("Open synthetic case", [""] + filtered["case_id"].tolist())
        if selected_case:
            row = filtered[filtered["case_id"] == selected_case].iloc[0]
            st.markdown(f"### {selected_case}: {row['deletion_status']}")
            steps = []
            try:
                parsed = json.loads(row["steps_json"])
                if isinstance(parsed, list):
                    steps = parsed
            except (TypeError, json.JSONDecodeError):
                pass
            st.dataframe(pd.DataFrame(steps), hide_index=True, alt="Synthetic ordered remediation plan") if steps else st.info("No ordered steps for this synthetic case.")

        buffer = io.StringIO()
        filtered.to_csv(buffer, index=False)
        st.download_button("Download synthetic results CSV", buffer.getvalue(), "synthetic_results.csv", "text/csv", width="stretch")

with live_tab:
    st.subheader("Live erasure intake requests (data/live_intake.db)")
    live_df = load_live_requests()

    if live_df.empty:
        st.info("No live deletion requests recorded yet in data/live_intake.db. Submit an erasure request using the floating Chatbot or POST /api/intake to see real-time forensic auditing.")
    else:
        # Metrics row
        total_live = len(live_df)
        incomplete_live = len(live_df[live_df["deletion_status"] == "INCOMPLETE"])
        complete_live = len(live_df[live_df["deletion_status"] == "COMPLETE"])
        na_live = len(live_df[live_df["deletion_status"] == "NOT_APPLICABLE"])

        with st.container(horizontal=True):
            st.metric("Total Live Requests", total_live, border=True)
            st.metric("Incomplete (Ghost Data Found)", incomplete_live, border=True)
            st.metric("Complete (Verified Purged)", complete_live, border=True)
            st.metric("Not Applicable (No Lakehouse Record)", na_live, border=True)

        st.markdown("**Live Deletion Requests Registry**")
        display_cols = ["ticket_id", "full_name", "email", "legal_framework", "deletion_status", "customer_id", "submitted_at", "receipt_hash"]
        st.dataframe(live_df[display_cols], hide_index=True, width="stretch")

        # Detail inspector
        st.markdown("---")
        st.subheader("Live Request DAG Remediation Inspector")
        ticket_options = [""] + live_df["ticket_id"].tolist()
        selected_ticket = st.selectbox("Inspect Live Ticket", ticket_options, key="live_ticket_selector")

        if selected_ticket:
            ticket_row = live_df[live_df["ticket_id"] == selected_ticket].iloc[0]
            c1, c2 = st.columns([2, 1])
            with c1:
                st.markdown(f"**Ticket ID**: `{selected_ticket}` &bull; **Status**: `{ticket_row['deletion_status']}`")
                st.markdown(f"**Subject**: {ticket_row['full_name']} (`{ticket_row['email']}`)")
                st.markdown(f"**Legal Framework**: {ticket_row['legal_framework']} &bull; **Scope**: `{ticket_row['deletion_scope']}`")
                st.info(f"**Audit Verdict**: {ticket_row['verdict_reason']}")
            with c2:
                st.markdown(f"**Cutoff**: `{ticket_row['audit_at']}`")
                st.markdown(f"**Receipt Hash**:")
                st.code(ticket_row['receipt_hash'], language="text")

            # Parse and render DAG steps
            steps_data = []
            try:
                parsed_steps = json.loads(ticket_row["steps_json"])
                if isinstance(parsed_steps, list):
                    steps_data = parsed_steps
            except Exception:
                pass

            if steps_data:
                st.markdown(f"**Topologically Sorted DAG Steps ({len(steps_data)} steps)**")
                st.dataframe(pd.DataFrame(steps_data), hide_index=True, width="stretch")
            else:
                st.write("No remediation steps required (Clean or No Lakehouse Record).")

        # Export live CSV
        live_csv_buf = io.StringIO()
        live_df.to_csv(live_csv_buf, index=False)
        st.download_button(
            "Download Live Requests CSV (live_deletion_requests.csv)",
            live_csv_buf.getvalue(),
            "live_deletion_requests.csv",
            "text/csv",
            width="stretch"
        )

