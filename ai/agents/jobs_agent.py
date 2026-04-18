"""
Jobs Tracker Agent — scrapes competitor career pages and LinkedIn RSS
to detect hiring surges and strategic role patterns.
"""

import os
import re
from datetime import datetime
from typing import Optional

import feedparser
import requests
from bs4 import BeautifulSoup
from crewai import Agent
from dotenv import load_dotenv

from config.competitors import COMPETITORS, STRATEGIC_JOB_SIGNALS
from storage.db import store_signal, get_job_count_history, store_job_count

load_dotenv()


def scrape_careers_page(competitor_key: str) -> list[dict]:
    """Scrape the competitor's careers page for open roles."""
    comp = COMPETITORS.get(competitor_key)
    if not comp or not comp.get("careers"):
        return []

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
        )
    }

    try:
        resp = requests.get(comp["careers"], headers=headers, timeout=15)
        soup = BeautifulSoup(resp.text, "lxml")
        text = soup.get_text(separator=" ").lower()

        jobs = []
        # Look for job title patterns
        for title_signal, meaning in STRATEGIC_JOB_SIGNALS.items():
            count = text.count(title_signal)
            if count > 0:
                jobs.append({
                    "role_keyword": title_signal,
                    "count": count,
                    "strategic_meaning": meaning,
                })

        return jobs

    except Exception as e:
        print(f"[Jobs] Error scraping {comp['name']} careers: {e}")
        return []


def fetch_linkedin_rss(competitor_key: str) -> list[dict]:
    """
    LinkedIn RSS for job postings (public, no auth needed).
    Format: https://www.linkedin.com/jobs/search/?keywords=COMPANY&f_TPR=r604800
    We parse the count from the page title/meta.
    """
    comp = COMPETITORS.get(competitor_key)
    if not comp:
        return []

    company_name = comp["name"].replace(" ", "%20")
    url = f"https://www.linkedin.com/jobs/search/?keywords={company_name}&f_C={comp.get('linkedin_id', '')}"

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
        )
    }

    try:
        resp = requests.get(url, headers=headers, timeout=15)
        soup = BeautifulSoup(resp.text, "lxml")

        # Try to extract job count from page
        count_el = soup.find("span", class_=re.compile(r"job.*count|result.*count", re.I))
        if count_el:
            numbers = re.findall(r"\d+", count_el.text)
            if numbers:
                return [{"source": "linkedin", "count": int(numbers[0])}]

        # Fallback: count job cards
        job_cards = soup.find_all("div", class_=re.compile(r"job-card|result-card", re.I))
        return [{"source": "linkedin", "count": len(job_cards)}]

    except Exception as e:
        print(f"[Jobs] LinkedIn error for {comp['name']}: {e}")
        return []


def analyze_hiring_trend(competitor_key: str, current_count: int) -> dict:
    """Compare current job count to historical average."""
    history = get_job_count_history(competitor_key, days=30)

    if not history:
        store_job_count(competitor_key, current_count)
        return {
            "trend": "baseline",
            "change_pct": 0,
            "note": "First reading — baseline stored",
        }

    avg = sum(h["count"] for h in history) / len(history)
    change_pct = ((current_count - avg) / avg * 100) if avg > 0 else 0
    store_job_count(competitor_key, current_count)

    trend = "stable"
    if change_pct > 50:
        trend = "surge"
    elif change_pct > 20:
        trend = "increase"
    elif change_pct < -20:
        trend = "decrease"

    return {
        "trend": trend,
        "current_count": current_count,
        "avg_count": round(avg, 1),
        "change_pct": round(change_pct, 1),
        "note": f"{change_pct:+.0f}% vs 30-day average",
    }


def run_jobs_agent() -> list[dict]:
    """Run jobs tracking for all competitors."""
    all_signals = []

    for key, comp in COMPETITORS.items():
        print(f"[Jobs] Scanning {comp['name']}...")

        # Scrape careers page for strategic roles
        strategic_roles = scrape_careers_page(key)
        total_strategic = sum(r["count"] for r in strategic_roles)

        # Analyze trend
        trend_info = analyze_hiring_trend(key, total_strategic)

        if strategic_roles:
            importance = 5
            if trend_info["trend"] == "surge":
                importance = 8
            elif trend_info["trend"] == "increase":
                importance = 6

            # Build human-readable summary
            role_summary = ", ".join(
                f"{r['count']}x {r['role_keyword']}" for r in strategic_roles[:5]
            )
            strategic_meanings = list({r["strategic_meaning"] for r in strategic_roles})

            signal = {
                "source": "jobs_tracker",
                "competitor": comp["name"],
                "competitor_key": key,
                "signal_type": "hiring_trend",
                "importance": importance,
                "is_high_priority": trend_info["trend"] == "surge",
                "summary": (
                    f"{comp['name']} hiring: {role_summary}. "
                    f"Trend: {trend_info['note']}. "
                    f"Signals: {'; '.join(strategic_meanings)}"
                ),
                "strategic_roles": strategic_roles,
                "trend": trend_info,
                "timestamp": datetime.utcnow().isoformat(),
            }
            all_signals.append(signal)
            store_signal(signal)

            if trend_info["trend"] == "surge":
                print(f"[Jobs] ⚡ HIRING SURGE at {comp['name']}! {trend_info['note']}")

    print(f"[Jobs] Done. {len(all_signals)} hiring signals.")
    return all_signals


def create_jobs_crewai_agent() -> Agent:
    return Agent(
        role="Jobs & Hiring Intelligence Agent",
        goal=(
            "Track competitor hiring patterns to predict strategic moves. "
            "A surge in ML engineers means AI product. Compliance hires mean regulatory expansion."
        ),
        backstory=(
            "You are a talent intelligence analyst who reads job postings like tea leaves. "
            "You know that what a company hires for today reveals what they'll launch in 90 days."
        ),
        llm="gemini/gemini-1.5-flash",
        verbose=True,
        allow_delegation=False,
    )
