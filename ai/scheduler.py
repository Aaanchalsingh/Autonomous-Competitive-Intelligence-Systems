"""
Scheduler — runs agents on a 24/7 schedule using APScheduler.
Run this once and leave it running (e.g., on a free Render/Railway instance).

Schedule:
  Every 6 hours  → News & funding scan
  Every 12 hours → Full scan (scraper + news + jobs + analyst + alerts)
  Every Monday   → Full scan + weekly PDF report
"""

import logging
import os
from datetime import datetime

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger(__name__)


def job_news_scan():
    log.info("⏰ Scheduled: News scan starting...")
    try:
        from orchestrator import run_news_only
        signals = run_news_only()
        log.info(f"News scan done. {len(signals)} signals.")
    except Exception as e:
        log.error(f"News scan failed: {e}")


def job_full_scan():
    log.info("⏰ Scheduled: Full scan starting...")
    try:
        from orchestrator import run_full_scan
        result = run_full_scan(send_weekly_report=False)
        log.info(f"Full scan done. {len(result['signals'])} signals, {len(result['insights'])} insights.")
    except Exception as e:
        log.error(f"Full scan failed: {e}")


def job_weekly_briefing():
    log.info("⏰ Scheduled: Weekly briefing starting...")
    try:
        from orchestrator import run_full_scan
        result = run_full_scan(send_weekly_report=True)
        log.info("Weekly briefing sent.")
    except Exception as e:
        log.error(f"Weekly briefing failed: {e}")


def main():
    scheduler = BlockingScheduler(timezone="Asia/Kolkata")

    # News scan every 6 hours
    scheduler.add_job(
        job_news_scan,
        IntervalTrigger(hours=6),
        id="news_scan",
        name="News & Funding Scan",
        replace_existing=True,
    )

    # Full scan every 12 hours
    scheduler.add_job(
        job_full_scan,
        IntervalTrigger(hours=12),
        id="full_scan",
        name="Full Intelligence Scan",
        replace_existing=True,
    )

    # Weekly briefing every Monday at 8am IST
    scheduler.add_job(
        job_weekly_briefing,
        CronTrigger(day_of_week="mon", hour=8, minute=0),
        id="weekly_briefing",
        name="Weekly PDF Briefing",
        replace_existing=True,
    )

    log.info("=" * 50)
    log.info("  Fintech Intel Scheduler started")
    log.info("  News scan:    every 6 hours")
    log.info("  Full scan:    every 12 hours")
    log.info("  Weekly brief: Monday 8am IST")
    log.info("=" * 50)

    # Run an immediate scan on startup
    log.info("Running initial scan on startup...")
    job_full_scan()

    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        log.info("Scheduler stopped.")


if __name__ == "__main__":
    main()
