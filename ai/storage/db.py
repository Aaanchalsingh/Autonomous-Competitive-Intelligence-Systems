"""
Storage layer using ChromaDB (local, free, no account needed).
Stores signals, snapshots, job counts, and insights.
"""

import json
import os
import uuid
from datetime import datetime, timedelta
from typing import Optional

import chromadb
from chromadb.config import Settings

# ─── ChromaDB setup ───────────────────────────────────────────────────────────

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "chromadb")
os.makedirs(DB_PATH, exist_ok=True)

_client = None


def get_client() -> chromadb.Client:
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path=DB_PATH)
    return _client


def get_collection(name: str):
    client = get_client()
    return client.get_or_create_collection(name=name)


# ─── Signals ─────────────────────────────────────────────────────────────────

def store_signal(signal: dict) -> str:
    """Store a raw intelligence signal. Returns the signal ID."""
    col = get_collection("signals")
    signal_id = signal.get("id") or str(uuid.uuid4())
    signal["id"] = signal_id

    # ChromaDB requires string documents
    doc = signal.get("summary") or signal.get("title") or json.dumps(signal)[:200]

    col.upsert(
        ids=[signal_id],
        documents=[doc],
        metadatas=[{
            "competitor": signal.get("competitor", ""),
            "competitor_key": signal.get("competitor_key", ""),
            "signal_type": signal.get("signal_type", ""),
            "source": signal.get("source", ""),
            "importance": str(signal.get("importance", 5)),
            "is_high_priority": str(signal.get("is_high_priority", False)),
            "alerted": "false",
            "timestamp": signal.get("timestamp", datetime.utcnow().isoformat()),
            "url": signal.get("url", ""),
            "raw": json.dumps(signal)[:1000],
        }],
    )
    return signal_id


def get_recent_signals(
    hours: int = 168,
    min_importance: int = 0,
    alerted: Optional[bool] = None,
    competitor_key: Optional[str] = None,
) -> list[dict]:
    """Retrieve signals from the last N hours."""
    col = get_collection("signals")
    cutoff = (datetime.utcnow() - timedelta(hours=hours)).isoformat()

    try:
        results = col.get(include=["metadatas", "documents"])
    except Exception:
        return []

    signals = []
    for i, meta in enumerate(results.get("metadatas", [])):
        ts = meta.get("timestamp", "")
        if ts < cutoff:
            continue
        if int(meta.get("importance", "5")) < min_importance:
            continue
        if alerted is not None:
            if alerted and meta.get("alerted") != "true":
                continue
            if not alerted and meta.get("alerted") == "true":
                continue
        if competitor_key and meta.get("competitor_key") != competitor_key:
            continue

        raw = meta.get("raw", "{}")
        try:
            signal = json.loads(raw)
        except Exception:
            signal = dict(meta)
            signal["summary"] = results["documents"][i]

        signal["id"] = results["ids"][i]
        signals.append(signal)

    return sorted(signals, key=lambda x: x.get("timestamp", ""), reverse=True)


def mark_signal_alerted(signal_id: str):
    col = get_collection("signals")
    try:
        existing = col.get(ids=[signal_id], include=["metadatas", "documents"])
        if existing["metadatas"]:
            meta = existing["metadatas"][0]
            meta["alerted"] = "true"
            col.update(
                ids=[signal_id],
                documents=existing["documents"],
                metadatas=[meta],
            )
    except Exception as e:
        print(f"[DB] mark_signal_alerted error: {e}")


# ─── Snapshots ───────────────────────────────────────────────────────────────

def store_snapshot(key: str, content_hash: str, text_snippet: str):
    col = get_collection("snapshots")
    col.upsert(
        ids=[key],
        documents=[text_snippet],
        metadatas=[{
            "hash": content_hash,
            "updated_at": datetime.utcnow().isoformat(),
        }],
    )


def get_last_snapshot(key: str) -> Optional[dict]:
    col = get_collection("snapshots")
    try:
        result = col.get(ids=[key], include=["metadatas", "documents"])
        if result["metadatas"]:
            return {
                "hash": result["metadatas"][0]["hash"],
                "text": result["documents"][0],
                "updated_at": result["metadatas"][0]["updated_at"],
            }
    except Exception:
        pass
    return None


# ─── Job Counts ──────────────────────────────────────────────────────────────

def store_job_count(competitor_key: str, count: int):
    col = get_collection("job_counts")
    entry_id = f"{competitor_key}_{datetime.utcnow().strftime('%Y%m%d')}"
    col.upsert(
        ids=[entry_id],
        documents=[str(count)],
        metadatas=[{
            "competitor_key": competitor_key,
            "count": str(count),
            "date": datetime.utcnow().strftime("%Y-%m-%d"),
        }],
    )


def get_job_count_history(competitor_key: str, days: int = 30) -> list[dict]:
    col = get_collection("job_counts")
    cutoff = (datetime.utcnow() - timedelta(days=days)).strftime("%Y-%m-%d")

    try:
        results = col.get(include=["metadatas"])
    except Exception:
        return []

    history = []
    for meta in results.get("metadatas", []):
        if meta.get("competitor_key") == competitor_key and meta.get("date", "") >= cutoff:
            history.append({
                "date": meta["date"],
                "count": int(meta.get("count", 0)),
            })

    return sorted(history, key=lambda x: x["date"])


# ─── Insights ────────────────────────────────────────────────────────────────

def store_insight(insight: dict) -> str:
    col = get_collection("insights")
    insight_id = str(uuid.uuid4())
    doc = insight.get("insight_body", insight.get("insight_title", ""))[:500]

    col.upsert(
        ids=[insight_id],
        documents=[doc],
        metadatas=[{
            "competitor": insight.get("competitor", ""),
            "insight_title": insight.get("insight_title", "")[:200],
            "importance_score": str(insight.get("importance_score", 5)),
            "is_urgent": str(insight.get("is_urgent", False)),
            "so_what": insight.get("so_what", "")[:300],
            "predicted_move": insight.get("predicted_move", "")[:200],
            "generated_at": insight.get("generated_at", datetime.utcnow().isoformat()),
            "raw": json.dumps(insight)[:1000],
        }],
    )
    return insight_id


def get_recent_insights(hours: int = 168) -> list[dict]:
    col = get_collection("insights")
    cutoff = (datetime.utcnow() - timedelta(hours=hours)).isoformat()

    try:
        results = col.get(include=["metadatas", "documents"])
    except Exception:
        return []

    insights = []
    for i, meta in enumerate(results.get("metadatas", [])):
        if meta.get("generated_at", "") < cutoff:
            continue
        raw = meta.get("raw", "{}")
        try:
            insight = json.loads(raw)
        except Exception:
            insight = dict(meta)
            insight["insight_body"] = results["documents"][i]
        insight["id"] = results["ids"][i]
        insights.append(insight)

    return sorted(
        insights,
        key=lambda x: int(x.get("importance_score", 5)),
        reverse=True,
    )
