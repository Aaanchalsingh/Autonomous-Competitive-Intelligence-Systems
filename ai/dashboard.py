"""
Streamlit Dashboard — visual interface for the intelligence system.
Run: streamlit run dashboard.py
Deploy free: https://streamlit.io/cloud
"""

import json
import os
from datetime import datetime

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

from storage.db import get_recent_signals, get_recent_insights, get_job_count_history
from config.competitors import COMPETITORS

st.set_page_config(
    page_title="Fintech Intel Dashboard",
    page_icon="🔍",
    layout="wide",
)

# ─── Sidebar ─────────────────────────────────────────────────────────────────

st.sidebar.title("🔍 Fintech Intel")
st.sidebar.markdown("Autonomous Competitive Intelligence")

time_window = st.sidebar.selectbox(
    "Time window",
    [24, 48, 168, 336, 720],
    index=2,
    format_func=lambda x: {24: "Last 24h", 48: "Last 48h", 168: "Last 7 days",
                            336: "Last 2 weeks", 720: "Last 30 days"}[x],
)

selected_competitors = st.sidebar.multiselect(
    "Filter competitors",
    options=list(COMPETITORS.keys()),
    default=list(COMPETITORS.keys()),
    format_func=lambda k: COMPETITORS[k]["name"],
)

if st.sidebar.button("🔄 Run Scan Now", type="primary"):
    with st.spinner("Running full intelligence scan..."):
        from orchestrator import run_full_scan
        result = run_full_scan()
    st.sidebar.success(f"Done! {len(result['signals'])} signals, {len(result['insights'])} insights")
    st.rerun()

# ─── Load data ───────────────────────────────────────────────────────────────

signals = get_recent_signals(hours=time_window)
insights = get_recent_insights(hours=time_window)

# Filter by selected competitors
if selected_competitors:
    signals = [s for s in signals if s.get("competitor_key") in selected_competitors]
    insights = [i for i in insights if any(
        COMPETITORS[k]["name"] == i.get("competitor")
        for k in selected_competitors
    )]

# ─── KPI Row ─────────────────────────────────────────────────────────────────

st.title("🔍 Fintech Competitive Intelligence")
st.caption(f"Last updated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}")

col1, col2, col3, col4 = st.columns(4)

urgent = [i for i in insights if i.get("is_urgent") or int(i.get("importance_score", 0)) >= 8]
high_signals = [s for s in signals if int(s.get("importance", 0)) >= 7]
competitors_active = len({s.get("competitor") for s in signals})

col1.metric("Total Signals", len(signals))
col2.metric("🚨 Urgent Insights", len(urgent))
col3.metric("⚡ High-Priority Signals", len(high_signals))
col4.metric("Competitors Active", competitors_active)

st.divider()

# ─── Urgent Alerts ───────────────────────────────────────────────────────────

if urgent:
    st.subheader("🚨 Urgent Intelligence")
    for insight in urgent[:5]:
        with st.expander(
            f"[{insight.get('competitor', '?')}] {insight.get('insight_title', 'Insight')}  "
            f"— Score: {insight.get('importance_score', '?')}/10",
            expanded=True,
        ):
            st.write(insight.get("insight_body", ""))
            st.info(f"**What to do:** {insight.get('so_what', '')}")
            if insight.get("predicted_move"):
                st.warning(f"**Predicted move:** {insight.get('predicted_move', '')}")

# ─── Signal Timeline ─────────────────────────────────────────────────────────

st.subheader("📈 Signal Activity")

if signals:
    df = pd.DataFrame(signals)
    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    df["importance"] = pd.to_numeric(df.get("importance", 5), errors="coerce").fillna(5)
    df["date"] = df["timestamp"].dt.date

    daily = df.groupby(["date", "competitor"]).size().reset_index(name="count")

    fig = px.bar(
        daily,
        x="date",
        y="count",
        color="competitor",
        title="Daily Signal Volume by Competitor",
        labels={"count": "Signals", "date": "Date"},
    )
    fig.update_layout(height=300, margin=dict(t=40, b=20))
    st.plotly_chart(fig, use_container_width=True)

# ─── Competitor Breakdown ────────────────────────────────────────────────────

st.subheader("🏢 Competitor Breakdown")

cols = st.columns(min(len(selected_competitors), 3))
for idx, key in enumerate(selected_competitors):
    comp = COMPETITORS[key]
    comp_signals = [s for s in signals if s.get("competitor_key") == key]
    comp_insights = [i for i in insights if i.get("competitor") == comp["name"]]

    with cols[idx % 3]:
        urgent_count = sum(1 for i in comp_insights if int(i.get("importance_score", 0)) >= 8)
        st.metric(
            comp["name"],
            f"{len(comp_signals)} signals",
            delta=f"{urgent_count} urgent" if urgent_count else None,
            delta_color="inverse" if urgent_count else "off",
        )

# ─── All Insights ────────────────────────────────────────────────────────────

st.subheader("💡 All Insights")

if insights:
    for insight in insights:
        score = int(insight.get("importance_score", 5))
        color = "🔴" if score >= 8 else "🟡" if score >= 5 else "🟢"
        with st.expander(
            f"{color} [{insight.get('competitor', '?')}] {insight.get('insight_title', '')}  (Score: {score}/10)"
        ):
            st.write(insight.get("insight_body", ""))
            if insight.get("so_what"):
                st.info(f"**Action:** {insight['so_what']}")
            if insight.get("predicted_move"):
                st.warning(f"**Predicted:** {insight['predicted_move']}")
else:
    st.info("No insights yet. Run a scan to generate intelligence.")

# ─── Raw Signals Table ───────────────────────────────────────────────────────

with st.expander("📋 Raw Signals Log"):
    if signals:
        table_data = []
        for s in signals[:100]:
            table_data.append({
                "Time": s.get("timestamp", "")[:16].replace("T", " "),
                "Competitor": s.get("competitor", ""),
                "Type": s.get("signal_type", ""),
                "Source": s.get("source", ""),
                "Importance": s.get("importance", 5),
                "Summary": (s.get("summary") or s.get("title", ""))[:80],
            })
        st.dataframe(pd.DataFrame(table_data), use_container_width=True)
    else:
        st.info("No signals in selected time window.")

# ─── Generate Report Button ──────────────────────────────────────────────────

st.divider()
col_a, col_b = st.columns(2)

with col_a:
    if st.button("📄 Generate PDF Report"):
        with st.spinner("Generating PDF..."):
            from agents.alert_agent import generate_pdf_report
            path = generate_pdf_report()
        with open(path, "rb") as f:
            st.download_button(
                "⬇️ Download PDF Briefing",
                f,
                file_name=f"fintech_intel_{datetime.utcnow().strftime('%Y%m%d')}.pdf",
                mime="application/pdf",
            )

with col_b:
    if st.button("📱 Send Telegram Alert"):
        with st.spinner("Sending..."):
            from agents.alert_agent import send_instant_alerts
            count = send_instant_alerts()
        st.success(f"Sent {count} alerts via Telegram")
