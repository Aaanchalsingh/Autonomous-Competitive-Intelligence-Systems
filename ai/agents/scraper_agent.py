"""
Web Scraper Agent — monitors competitor websites for content changes.
Uses Playwright for JS-heavy pages, BeautifulSoup for parsing.
"""

import hashlib
import json
import time
from datetime import datetime
from typing import Optional

import requests
from bs4 import BeautifulSoup

from config.competitors import COMPETITORS
from storage.db import store_signal, get_last_snapshot, store_snapshot


def fetch_page(url: str, use_playwright: bool = False) -> Optional[str]:
    """Fetch page HTML. Falls back to requests if playwright not needed."""
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        )
    }
    try:
        if use_playwright:
            from playwright.sync_api import sync_playwright
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page()
                page.goto(url, timeout=15000, wait_until="domcontentloaded")
                content = page.content()
                browser.close()
                return content
        else:
            resp = requests.get(url, headers=headers, timeout=15)
            resp.raise_for_status()
            return resp.text
    except Exception as e:
        print(f"[Scraper] Failed to fetch {url}: {e}")
        return None


def extract_text(html: str) -> str:
    """Strip HTML tags and return clean text."""
    soup = BeautifulSoup(html, "lxml")
    # Remove scripts, styles, nav, footer noise
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()
    return " ".join(soup.get_text(separator=" ").split())


def content_hash(text: str) -> str:
    return hashlib.md5(text.encode()).hexdigest()


def detect_changes(competitor_key: str, page_type: str, current_text: str) -> dict:
    """Compare current content against stored snapshot. Returns change info."""
    snapshot_key = f"{competitor_key}_{page_type}"
    last = get_last_snapshot(snapshot_key)
    current_hash = content_hash(current_text)

    result = {
        "competitor": competitor_key,
        "page_type": page_type,
        "changed": False,
        "is_new": last is None,
        "current_hash": current_hash,
        "timestamp": datetime.utcnow().isoformat(),
    }

    if last is None:
        # First run — just store baseline
        store_snapshot(snapshot_key, current_hash, current_text[:5000])
        result["changed"] = False
        result["note"] = "Baseline stored"
    elif last["hash"] != current_hash:
        result["changed"] = True
        result["previous_hash"] = last["hash"]
        result["note"] = "Content changed since last check"
        store_snapshot(snapshot_key, current_hash, current_text[:5000])
    else:
        result["note"] = "No change detected"

    return result


def scrape_competitor(competitor_key: str) -> list[dict]:
    """Scrape all monitored pages for a single competitor."""
    comp = COMPETITORS.get(competitor_key)
    if not comp:
        return []

    signals = []
    pages_to_check = {
        "homepage": comp["website"],
        "pricing": comp.get("pricing_page"),
        "blog": comp.get("blog"),
        "careers": comp.get("careers"),
    }

    for page_type, url in pages_to_check.items():
        if not url:
            continue

        print(f"[Scraper] Checking {comp['name']} — {page_type}")
        html = fetch_page(url, use_playwright=(page_type == "pricing"))
        if not html:
            continue

        text = extract_text(html)
        change_info = detect_changes(competitor_key, page_type, text)

        if change_info["changed"]:
            signal = {
                "source": "web_scraper",
                "competitor": comp["name"],
                "competitor_key": competitor_key,
                "page_type": page_type,
                "url": url,
                "signal_type": "content_change",
                "importance": 7 if page_type == "pricing" else 5,
                "summary": f"{comp['name']} {page_type} page content changed",
                "raw_text_snippet": text[:500],
                "timestamp": change_info["timestamp"],
            }
            signals.append(signal)
            store_signal(signal)
            print(f"[Scraper] ⚡ Change detected: {comp['name']} {page_type}")

        time.sleep(2)  # polite crawl delay

    return signals


def run_scraper_agent() -> list[dict]:
    """Run scraper across all configured competitors."""
    all_signals = []
    for key in COMPETITORS:
        signals = scrape_competitor(key)
        all_signals.extend(signals)
    print(f"[Scraper] Done. {len(all_signals)} changes detected.")
    return all_signals


def create_scraper_crewai_agent() -> Agent:
    return Agent(
        role="Web Scraper Agent",
        goal=(
            "Monitor competitor fintech websites for any content changes — "
            "especially pricing pages, product pages, and blog posts."
        ),
        backstory=(
            "You are an expert web intelligence agent specializing in fintech. "
            "You detect even subtle changes in competitor websites that signal "
            "strategic moves like pricing changes, new product launches, or pivots."
        ),
        llm="gemini/gemini-1.5-flash",
        verbose=True,
        allow_delegation=False,
    )
