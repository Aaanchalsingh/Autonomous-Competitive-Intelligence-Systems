"""
Analyst Agent — takes raw signals and generates strategic insights using Gemini.
Scores signals, finds patterns, and produces "So what?" analysis.
"""

import os
import json
from datetime import datetime, timedelta
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

import google.genai as genai

from storage.db import get_recent_signals, store_insight


def get_gemini():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not set in .env")
    client = genai.Client(api_key=api_key)
    return client


ANALYSIS_PROMPT = """
You are a senior fintech competitive intelligence analyst.

Below are raw signals collected from monitoring Indian fintech competitors over the past {time_window}.

Your job:
1. Group signals by competitor
2. Identify patterns (e.g., hiring surge + new landing page = product launch incoming)
3. Score each insight 1-10 for strategic importance
4. Write a "So what?" for each — what should the reader DO with this information?
5. Flag any URGENT items that need immediate attention

Raw signals:
{signals_json}

Output a JSON array of insights with this structure:
[
  {{
    "competitor": "Company Name",
    "insight_title": "Short title",
    "insight_body": "2-3 sentence analysis",
    "so_what": "Recommended action for the reader",
    "importance_score": 8,
    "is_urgent": false,
    "supporting_signals": ["signal1", "signal2"],
    "predicted_move": "What competitor is likely planning"
  }}
]

Be specific, be actionable, avoid generic statements.
"""


def run_analyst_agent(time_window_hours: int = 168) -> list[dict]:
    """
    Pull recent signals, send to Gemini for analysis, return structured insights.
    Default window: 168 hours = 1 week.
    """
    signals = get_recent_signals(hours=time_window_hours)

    if not signals:
        print("[Analyst] No signals to analyze.")
        return []

    print(f"[Analyst] Analyzing {len(signals)} signals with Gemini...")

    # Trim signals to avoid token limits — keep most important
    signals_sorted = sorted(signals, key=lambda x: x.get("importance", 0), reverse=True)
    top_signals = signals_sorted[:50]  # Gemini flash handles this easily

    # Simplify for prompt
    simplified = []
    for s in top_signals:
        simplified.append({
            "competitor": s.get("competitor"),
            "type": s.get("signal_type"),
            "source": s.get("source"),
            "summary": s.get("summary") or s.get("title", ""),
            "importance": s.get("importance", 5),
            "timestamp": s.get("timestamp"),
        })

    prompt = ANALYSIS_PROMPT.format(
        time_window=f"{time_window_hours} hours",
        signals_json=json.dumps(simplified, indent=2),
    )

    client = get_gemini()
    try:
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt,
        )
        raw = response.text.strip()

        # Extract JSON from response
        if "```json" in raw:
            raw = raw.split("```json")[1].split("```")[0].strip()
        elif "```" in raw:
            raw = raw.split("```")[1].split("```")[0].strip()

        insights = json.loads(raw)

        # Store each insight
        for insight in insights:
            insight["generated_at"] = datetime.utcnow().isoformat()
            store_insight(insight)

        print(f"[Analyst] Generated {len(insights)} insights.")
        return insights

    except json.JSONDecodeError as e:
        print(f"[Analyst] JSON parse error: {e}")
        return [{
            "competitor": "Multiple",
            "insight_title": "Weekly Signal Summary",
            "insight_body": response.text[:500],
            "so_what": "Review raw signals for details.",
            "importance_score": 5,
            "is_urgent": False,
            "supporting_signals": [],
            "predicted_move": "Unknown",
            "generated_at": datetime.utcnow().isoformat(),
        }]
    except Exception as e:
        print(f"[Analyst] Error: {e}")
        return []


def create_analyst_crewai_agent() -> Agent:
    return Agent(
        role="Senior Fintech Competitive Intelligence Analyst",
        goal=(
            "Transform raw competitor signals into strategic insights. "
            "Find patterns across hiring, news, and website changes. "
            "Tell the reader exactly what a competitor is planning and what to do about it."
        ),
        backstory=(
            "You are a 15-year veteran fintech analyst who has called every major "
            "product launch before it happened — by reading the signals. You combine "
            "hiring data, website changes, and news into a coherent strategic picture."
        ),
        llm="gemini/gemini-1.5-flash",
        verbose=True,
        allow_delegation=False,
    )
