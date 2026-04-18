"""
News & Funding Agent — monitors RSS feeds, NewsAPI, and funding signals.
"""

import os
from datetime import datetime, timedelta
from typing import Optional

import feedparser
import requests
from crewai import Agent
from dotenv import load_dotenv

from config.competitors import COMPETITORS, NEWS_SOURCES, HIGH_PRIORITY_KEYWORDS
from storage.db import store_signal

load_dotenv()


def fetch_rss_signals(max_age_hours: int = 48) -> list[dict]:
    """Pull articles from all configured RSS feeds."""
    signals = []
    cutoff = datetime.utcnow() - timedelta(hours=max_age_hours)
    competitor_names = {v["name"].lower(): k for k, v in COMPETITORS.items()}

    for feed_url in NEWS_SOURCES:
        try:
            feed = feedparser.parse(feed_url)
            for entry in feed.entries[:20]:
                # Parse publish date
                published = None
                if hasattr(entry, "published_parsed") and entry.published_parsed:
                    published = datetime(*entry.published_parsed[:6])
                    if published < cutoff:
                        continue

                title = entry.get("title", "")
                summary = entry.get("summary", "")
                link = entry.get("link", "")
                full_text = f"{title} {summary}".lower()

                # Match to a competitor
                matched_competitor = None
                for name, key in competitor_names.items():
                    if name in full_text:
                        matched_competitor = key
                        break

                if not matched_competitor:
                    continue

                # Score importance
                importance = 4
                is_high_priority = False
                for kw in HIGH_PRIORITY_KEYWORDS:
                    if kw in full_text:
                        importance = 9
                        is_high_priority = True
                        break

                signal = {
                    "source": "rss_feed",
                    "feed_url": feed_url,
                    "competitor": COMPETITORS[matched_competitor]["name"],
                    "competitor_key": matched_competitor,
                    "signal_type": "news_article",
                    "importance": importance,
                    "is_high_priority": is_high_priority,
                    "title": title,
                    "summary": summary[:400],
                    "url": link,
                    "published": published.isoformat() if published else None,
                    "timestamp": datetime.utcnow().isoformat(),
                }
                signals.append(signal)
                store_signal(signal)

        except Exception as e:
            print(f"[News] RSS feed error {feed_url}: {e}")

    return signals


def fetch_newsapi_signals(max_age_days: int = 2) -> list[dict]:
    """Pull from NewsAPI free tier (100 req/day)."""
    api_key = os.getenv("NEWS_API_KEY")
    if not api_key:
        print("[News] No NEWS_API_KEY set, skipping NewsAPI")
        return []

    signals = []
    from_date = (datetime.utcnow() - timedelta(days=max_age_days)).strftime("%Y-%m-%d")

    for key, comp in COMPETITORS.items():
        try:
            url = "https://newsapi.org/v2/everything"
            params = {
                "q": comp["name"],
                "from": from_date,
                "sortBy": "publishedAt",
                "language": "en",
                "pageSize": 10,
                "apiKey": api_key,
            }
            resp = requests.get(url, params=params, timeout=10)
            data = resp.json()

            for article in data.get("articles", []):
                title = article.get("title", "")
                description = article.get("description", "")
                full_text = f"{title} {description}".lower()

                importance = 4
                is_high_priority = False
                for kw in HIGH_PRIORITY_KEYWORDS:
                    if kw in full_text:
                        importance = 9
                        is_high_priority = True
                        break

                signal = {
                    "source": "newsapi",
                    "competitor": comp["name"],
                    "competitor_key": key,
                    "signal_type": "news_article",
                    "importance": importance,
                    "is_high_priority": is_high_priority,
                    "title": title,
                    "summary": description[:400] if description else "",
                    "url": article.get("url", ""),
                    "published": article.get("publishedAt"),
                    "timestamp": datetime.utcnow().isoformat(),
                }
                signals.append(signal)
                store_signal(signal)

        except Exception as e:
            print(f"[News] NewsAPI error for {comp['name']}: {e}")

    return signals


def fetch_competitor_rss(max_age_hours: int = 48) -> list[dict]:
    """Pull from each competitor's own blog RSS feed."""
    signals = []
    cutoff = datetime.utcnow() - timedelta(hours=max_age_hours)

    for key, comp in COMPETITORS.items():
        for feed_url in comp.get("rss_feeds", []):
            try:
                feed = feedparser.parse(feed_url)
                for entry in feed.entries[:5]:
                    published = None
                    if hasattr(entry, "published_parsed") and entry.published_parsed:
                        published = datetime(*entry.published_parsed[:6])
                        if published < cutoff:
                            continue

                    title = entry.get("title", "")
                    summary = entry.get("summary", "")
                    full_text = f"{title} {summary}".lower()

                    importance = 5
                    is_high_priority = False
                    for kw in HIGH_PRIORITY_KEYWORDS:
                        if kw in full_text:
                            importance = 8
                            is_high_priority = True
                            break

                    signal = {
                        "source": "competitor_blog",
                        "competitor": comp["name"],
                        "competitor_key": key,
                        "signal_type": "blog_post",
                        "importance": importance,
                        "is_high_priority": is_high_priority,
                        "title": title,
                        "summary": summary[:400],
                        "url": entry.get("link", ""),
                        "published": published.isoformat() if published else None,
                        "timestamp": datetime.utcnow().isoformat(),
                    }
                    signals.append(signal)
                    store_signal(signal)

            except Exception as e:
                print(f"[News] Blog RSS error {feed_url}: {e}")

    return signals


def run_news_agent() -> list[dict]:
    """Run all news monitoring sources."""
    signals = []
    print("[News] Fetching RSS feeds...")
    signals.extend(fetch_rss_signals())
    print("[News] Fetching competitor blogs...")
    signals.extend(fetch_competitor_rss())
    print("[News] Fetching NewsAPI...")
    signals.extend(fetch_newsapi_signals())
    print(f"[News] Done. {len(signals)} signals collected.")
    return signals


def create_news_crewai_agent() -> Agent:
    return Agent(
        role="News & Funding Intelligence Agent",
        goal=(
            "Monitor Indian fintech news sources, RSS feeds, and funding databases "
            "to detect competitor announcements, funding rounds, and regulatory changes."
        ),
        backstory=(
            "You are a fintech news analyst who reads Inc42, YourStory, Entrackr, "
            "and global sources daily. You have a nose for signals that matter — "
            "funding rounds, product launches, regulatory approvals — and you filter "
            "out the noise."
        ),
        llm="gemini/gemini-1.5-flash",
        verbose=True,
        allow_delegation=False,
    )
