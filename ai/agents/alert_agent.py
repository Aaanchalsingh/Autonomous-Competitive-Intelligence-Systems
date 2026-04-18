"""
Alert Agent — sends instant Telegram alerts for high-priority signals
and generates weekly PDF briefings.
"""

import os
import json
from datetime import datetime
from typing import Optional

import requests
from dotenv import load_dotenv

from storage.db import get_recent_signals, get_recent_insights, mark_signal_alerted

load_dotenv()


# ─── Telegram ────────────────────────────────────────────────────────────────

def send_telegram(message: str) -> bool:
    """Send a message via Telegram Bot API."""
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    chat_id = os.getenv("TELEGRAM_CHAT_ID")

    if not token or not chat_id:
        print("[Alert] Telegram not configured — skipping.")
        return False

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "HTML",
        "disable_web_page_preview": True,
    }
    try:
        resp = requests.post(url, json=payload, timeout=10)
        resp.raise_for_status()
        return True
    except Exception as e:
        print(f"[Alert] Telegram error: {e}")
        return False


def format_instant_alert(signal: dict) -> str:
    """Format a high-priority signal as a Telegram message."""
    emoji_map = {
        "news_article": "📰",
        "blog_post": "✍️",
        "content_change": "🔄",
        "hiring_trend": "👥",
    }
    emoji = emoji_map.get(signal.get("signal_type", ""), "⚡")
    importance = signal.get("importance", 5)
    urgency = "🚨 URGENT" if importance >= 8 else "⚠️ ALERT"

    lines = [
        f"{urgency} — Fintech Intel",
        f"",
        f"{emoji} <b>{signal.get('competitor', 'Unknown')}</b>",
        f"",
        f"{signal.get('summary') or signal.get('title', 'No summary')}",
    ]

    if signal.get("url"):
        lines.append(f"")
        lines.append(f"🔗 <a href='{signal['url']}'>Read more</a>")

    lines.append(f"")
    lines.append(f"⏰ {signal.get('timestamp', '')[:16].replace('T', ' ')} UTC")

    return "\n".join(lines)


def send_instant_alerts() -> int:
    """Check for unalerted high-priority signals and send Telegram messages."""
    signals = get_recent_signals(hours=12, min_importance=8, alerted=False)
    sent = 0

    for signal in signals:
        message = format_instant_alert(signal)
        if send_telegram(message):
            mark_signal_alerted(signal["id"])
            sent += 1
            print(f"[Alert] Sent instant alert for {signal.get('competitor')}")

    print(f"[Alert] Sent {sent} instant alerts.")
    return sent


# ─── PDF Weekly Report ────────────────────────────────────────────────────────

def generate_pdf_report(output_path: str = "reports/weekly_briefing.pdf") -> str:
    """Generate a weekly PDF intelligence briefing."""
    from fpdf import FPDF

    os.makedirs("reports", exist_ok=True)

    insights = get_recent_insights(hours=168)
    signals = get_recent_signals(hours=168)

    # Group signals by competitor
    by_competitor = {}
    for s in signals:
        key = s.get("competitor", "Unknown")
        by_competitor.setdefault(key, []).append(s)

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    # ── Header ──
    pdf.set_font("Helvetica", "B", 20)
    pdf.set_fill_color(30, 30, 80)
    pdf.set_text_color(255, 255, 255)
    pdf.cell(0, 14, "  FINTECH COMPETITIVE INTELLIGENCE BRIEFING", fill=True, ln=True)

    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(100, 100, 100)
    week_str = datetime.utcnow().strftime("Week of %B %d, %Y")
    pdf.cell(0, 8, f"  {week_str}  |  Autonomous Intelligence System", ln=True)
    pdf.ln(6)

    # ── Executive Summary ──
    pdf.set_font("Helvetica", "B", 13)
    pdf.set_text_color(30, 30, 80)
    pdf.cell(0, 8, "EXECUTIVE SUMMARY", ln=True)
    pdf.set_draw_color(30, 30, 80)
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(3)

    urgent = [i for i in insights if i.get("is_urgent") or i.get("importance_score", 0) >= 8]
    medium = [i for i in insights if 5 <= i.get("importance_score", 0) < 8]

    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(0, 0, 0)
    pdf.multi_cell(0, 6,
        f"This week: {len(signals)} signals collected across {len(by_competitor)} competitors. "
        f"{len(urgent)} high-priority items require attention. "
        f"{len(medium)} medium-priority items for awareness."
    )
    pdf.ln(4)

    # ── High Priority Items ──
    if urgent:
        pdf.set_font("Helvetica", "B", 12)
        pdf.set_text_color(180, 0, 0)
        pdf.cell(0, 8, "HIGH PRIORITY", ln=True)
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        pdf.ln(2)

        for insight in urgent[:5]:
            pdf.set_font("Helvetica", "B", 10)
            pdf.set_text_color(0, 0, 0)
            title = f"[{insight.get('competitor', '?')}] {insight.get('insight_title', '')}"
            pdf.cell(0, 7, title[:90], ln=True)

            pdf.set_font("Helvetica", "", 9)
            pdf.set_text_color(60, 60, 60)
            pdf.multi_cell(0, 5, insight.get("insight_body", "")[:300])

            pdf.set_font("Helvetica", "I", 9)
            pdf.set_text_color(0, 100, 0)
            pdf.multi_cell(0, 5, f"→ {insight.get('so_what', '')}")
            pdf.ln(3)

    # ── Per-Competitor Breakdown ──
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 13)
    pdf.set_text_color(30, 30, 80)
    pdf.cell(0, 8, "COMPETITOR BREAKDOWN", ln=True)
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(4)

    for competitor, comp_signals in by_competitor.items():
        pdf.set_font("Helvetica", "B", 11)
        pdf.set_text_color(30, 30, 80)
        pdf.cell(0, 7, f"{competitor}  ({len(comp_signals)} signals)", ln=True)

        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(0, 0, 0)
        for sig in comp_signals[:4]:
            summary = sig.get("summary") or sig.get("title", "")
            if summary:
                pdf.multi_cell(0, 5, f"  • {summary[:120]}")
        pdf.ln(3)

    # ── Footer ──
    pdf.set_y(-20)
    pdf.set_font("Helvetica", "I", 8)
    pdf.set_text_color(150, 150, 150)
    pdf.cell(0, 5, "Generated by Autonomous Fintech Intelligence System  |  Confidential", align="C")

    pdf.output(output_path)
    print(f"[Alert] PDF report saved: {output_path}")
    return output_path


def send_weekly_briefing_telegram(pdf_path: str) -> bool:
    """Send the weekly briefing summary via Telegram."""
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    chat_id = os.getenv("TELEGRAM_CHAT_ID")

    if not token or not chat_id:
        return False

    insights = get_recent_insights(hours=168)
    signals = get_recent_signals(hours=168)

    urgent = [i for i in insights if i.get("is_urgent") or i.get("importance_score", 0) >= 8]

    lines = [
        "📊 <b>WEEKLY FINTECH INTEL BRIEFING</b>",
        f"Week of {datetime.utcnow().strftime('%B %d, %Y')}",
        "",
        f"📈 {len(signals)} signals collected",
        f"🚨 {len(urgent)} high-priority items",
        "",
    ]

    if urgent:
        lines.append("<b>Top Alerts:</b>")
        for i in urgent[:3]:
            lines.append(f"• [{i.get('competitor')}] {i.get('insight_title', '')}")

    lines.append("")
    lines.append("Full PDF report attached above ↑")

    message = "\n".join(lines)

    # Send PDF document
    try:
        url = f"https://api.telegram.org/bot{token}/sendDocument"
        with open(pdf_path, "rb") as f:
            resp = requests.post(
                url,
                data={"chat_id": chat_id, "caption": message, "parse_mode": "HTML"},
                files={"document": f},
                timeout=30,
            )
        resp.raise_for_status()
        return True
    except Exception as e:
        print(f"[Alert] Failed to send PDF: {e}")
        # Fallback: send text only
        return send_telegram(message)


def run_alert_agent(send_weekly: bool = False) -> dict:
    """Run the alert agent — instant alerts + optional weekly report."""
    result = {"instant_alerts_sent": 0, "weekly_report": None}

    result["instant_alerts_sent"] = send_instant_alerts()

    if send_weekly:
        pdf_path = generate_pdf_report()
        send_weekly_briefing_telegram(pdf_path)
        result["weekly_report"] = pdf_path

    return result
