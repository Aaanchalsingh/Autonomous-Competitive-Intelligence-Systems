"""
Orchestrator — coordinates all agents on schedule.
Run this file directly for a full scan, or use scheduler.py for 24/7 automation.
"""

import os
import sys
from datetime import datetime

from dotenv import load_dotenv

load_dotenv()


def run_full_scan(send_weekly_report: bool = False):
    """Run all agents in sequence and send alerts."""
    print(f"\n{'='*60}")
    print(f"  FINTECH INTEL SCAN — {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}")
    print(f"{'='*60}\n")

    all_signals = []

    # 1. Web Scraper
    print("\n[1/4] Running Web Scraper Agent...")
    try:
        from agents.scraper_agent import run_scraper_agent
        signals = run_scraper_agent()
        all_signals.extend(signals)
        print(f"      → {len(signals)} website changes detected")
    except Exception as e:
        print(f"      ✗ Scraper error: {e}")

    # 2. News & Funding
    print("\n[2/4] Running News & Funding Agent...")
    try:
        from agents.news_agent import run_news_agent
        signals = run_news_agent()
        all_signals.extend(signals)
        print(f"      → {len(signals)} news signals collected")
    except Exception as e:
        print(f"      ✗ News agent error: {e}")

    # 3. Jobs Tracker
    print("\n[3/4] Running Jobs Tracker Agent...")
    try:
        from agents.jobs_agent import run_jobs_agent
        signals = run_jobs_agent()
        all_signals.extend(signals)
        print(f"      → {len(signals)} hiring signals detected")
    except Exception as e:
        print(f"      ✗ Jobs agent error: {e}")

    # 4. Analyst
    print("\n[4/4] Running Analyst Agent (Gemini)...")
    insights = []
    try:
        from agents.analyst_agent import run_analyst_agent
        insights = run_analyst_agent()
        print(f"      → {len(insights)} strategic insights generated")
    except Exception as e:
        print(f"      ✗ Analyst error: {e}")

    # 5. Alerts
    print("\n[5/5] Running Alert Agent...")
    try:
        from agents.alert_agent import run_alert_agent
        result = run_alert_agent(send_weekly=send_weekly_report)
        print(f"      → {result['instant_alerts_sent']} instant alerts sent")
        if result.get("weekly_report"):
            print(f"      → Weekly report: {result['weekly_report']}")
    except Exception as e:
        print(f"      ✗ Alert agent error: {e}")

    # Summary
    print(f"\n{'='*60}")
    print(f"  SCAN COMPLETE")
    print(f"  Total signals: {len(all_signals)}")
    print(f"  Insights generated: {len(insights)}")
    urgent = [i for i in insights if i.get("is_urgent") or i.get("importance_score", 0) >= 8]
    if urgent:
        print(f"\n  🚨 URGENT ITEMS ({len(urgent)}):")
        for item in urgent:
            print(f"     • [{item.get('competitor')}] {item.get('insight_title', '')}")
    print(f"{'='*60}\n")

    return {"signals": all_signals, "insights": insights}


def run_news_only():
    """Quick news scan — runs every 6 hours."""
    from agents.news_agent import run_news_agent
    from agents.alert_agent import send_instant_alerts
    signals = run_news_agent()
    send_instant_alerts()
    return signals


def run_jobs_only():
    """Jobs scan — runs every 48 hours."""
    from agents.jobs_agent import run_jobs_agent
    return run_jobs_agent()


if __name__ == "__main__":
    weekly = "--weekly" in sys.argv
    run_full_scan(send_weekly_report=weekly)
