"""
FastAPI server — bridges the Next.js frontend to the Python intelligence system.
Run: uvicorn api_server:app --reload --port 8000
"""

import os
import time
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from dotenv import load_dotenv

from storage.db import get_recent_signals, get_recent_insights
from config.competitors import COMPETITORS

load_dotenv()

app = FastAPI(title="FintechIntel API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        os.getenv("FRONTEND_URL", ""),
        "https://*.netlify.app",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Stats ────────────────────────────────────────────────────────────────────

@app.get("/stats")
def get_stats(hours: int = 168):
    signals = get_recent_signals(hours=hours)
    insights = get_recent_insights(hours=hours)
    urgent = [i for i in insights if i.get("is_urgent") or int(i.get("importance_score", 0)) >= 8]
    high = [s for s in signals if int(s.get("importance", 0)) >= 7]
    competitors_active = len({s.get("competitor") for s in signals if s.get("competitor")})

    return {
        "total_signals": len(signals),
        "urgent_insights": len(urgent),
        "high_priority_signals": len(high),
        "competitors_active": competitors_active,
        "last_scan": datetime.utcnow().strftime("%H:%M UTC"),
    }


# ─── Signals ─────────────────────────────────────────────────────────────────

@app.get("/signals")
def get_signals(
    hours: int = 168,
    competitor: Optional[str] = None,
    min_importance: int = 0,
):
    signals = get_recent_signals(
        hours=hours,
        min_importance=min_importance,
        competitor_key=competitor,
    )
    return signals


# ─── Insights ────────────────────────────────────────────────────────────────

@app.get("/insights")
def get_insights(hours: int = 168):
    return get_recent_insights(hours=hours)


# ─── Competitors ─────────────────────────────────────────────────────────────

@app.get("/competitors")
def get_competitors(hours: int = 168):
    signals = get_recent_signals(hours=hours)
    insights = get_recent_insights(hours=hours)

    result = []
    for key, comp in COMPETITORS.items():
        comp_signals = [s for s in signals if s.get("competitor_key") == key]
        comp_insights = [i for i in insights if i.get("competitor") == comp["name"]]
        urgent = sum(1 for i in comp_insights if int(i.get("importance_score", 0)) >= 8)

        result.append({
            "key": key,
            "name": comp["name"],
            "category": comp["category"],
            "website": comp["website"],
            "signal_count": len(comp_signals),
            "urgent_count": urgent,
            "last_seen": comp_signals[0]["timestamp"][:16] if comp_signals else None,
        })

    return sorted(result, key=lambda x: x["signal_count"], reverse=True)


# ─── Scan ─────────────────────────────────────────────────────────────────────

_scan_running = False


@app.post("/scan")
def trigger_scan(weekly: bool = False, background_tasks: BackgroundTasks = None):
    global _scan_running
    if _scan_running:
        return {"status": "already_running", "signals_collected": 0, "insights_generated": 0}

    _scan_running = True
    start = time.time()
    try:
        from orchestrator import run_full_scan
        result = run_full_scan(send_weekly_report=weekly)
        duration = round(time.time() - start, 1)
        insights = result.get("insights", [])
        urgent = [i for i in insights if i.get("is_urgent") or int(i.get("importance_score", 0)) >= 8]
        return {
            "status": "done",
            "signals_collected": len(result.get("signals", [])),
            "insights_generated": len(insights),
            "urgent_count": len(urgent),
            "duration_seconds": duration,
        }
    except Exception as e:
        return {"status": "error", "error": str(e), "signals_collected": 0, "insights_generated": 0}
    finally:
        _scan_running = False


# ─── Alerts ──────────────────────────────────────────────────────────────────

@app.post("/alerts/send")
def send_alerts():
    from agents.alert_agent import send_instant_alerts
    sent = send_instant_alerts()
    return {"sent": sent}


# ─── PDF Report ──────────────────────────────────────────────────────────────

@app.post("/report/generate")
def generate_report():
    from agents.alert_agent import generate_pdf_report
    path = generate_pdf_report()
    return {"path": path}


@app.get("/report/download")
def download_report():
    from agents.alert_agent import generate_pdf_report
    path = generate_pdf_report()
    return FileResponse(
        path,
        media_type="application/pdf",
        filename=f"fintech_intel_{datetime.utcnow().strftime('%Y%m%d')}.pdf",
    )


@app.get("/health")
def health():
    return {"status": "ok", "time": datetime.utcnow().isoformat()}
