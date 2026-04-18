# 🔍 Autonomous Fintech Competitive Intelligence System

Monitors Indian fintech competitors 24/7 — tracks websites, news, hiring trends, and funding.
Sends instant Telegram alerts and weekly PDF briefings. **100% free to run.**

## What It Monitors

| Source | Frequency | What it detects |
|--------|-----------|-----------------|
| Competitor websites | Every 12h | Pricing changes, new product pages |
| News & RSS feeds | Every 6h | Funding rounds, product launches, regulatory news |
| Competitor blogs | Every 6h | New announcements |
| Job postings | Every 12h | Hiring surges → predicts product moves |

## Competitors Tracked (default)

Razorpay, PhonePe, Groww, Zerodha, Paytm, CRED — edit `config/competitors.py` to add/remove.

## Setup (5 minutes)

### 1. Clone & install

```bash
git clone <your-repo>
cd fintech-intel
pip install -r requirements.txt
playwright install chromium
```

### 2. Get free API keys

| Key | Where to get | Free tier |
|-----|-------------|-----------|
| `GEMINI_API_KEY` | [aistudio.google.com](https://aistudio.google.com) | 15 req/min |
| `NEWS_API_KEY` | [newsapi.org](https://newsapi.org) | 100 req/day |
| `TELEGRAM_BOT_TOKEN` | Message `@BotFather` on Telegram | Free forever |
| `TELEGRAM_CHAT_ID` | Message `@userinfobot` on Telegram | Free forever |

### 3. Configure

```bash
cp .env.example .env
# Edit .env with your keys
```

### 4. Run

```bash
# One-time full scan
python orchestrator.py

# Full scan + weekly PDF report
python orchestrator.py --weekly

# 24/7 scheduled mode
python scheduler.py

# Visual dashboard
streamlit run dashboard.py
```

## Free Deployment Options

### Option A — GitHub Actions (recommended, zero cost)
1. Push this repo to GitHub
2. Add your API keys as repository secrets (Settings → Secrets)
3. The workflow runs automatically on schedule

### Option B — Render / Railway free tier
```bash
# Start command
python scheduler.py
```

## Project Structure

```
├── agents/
│   ├── scraper_agent.py    # Website change detection
│   ├── news_agent.py       # RSS + NewsAPI monitoring
│   ├── jobs_agent.py       # Hiring trend analysis
│   ├── analyst_agent.py    # Gemini-powered insights
│   └── alert_agent.py      # Telegram + PDF reports
├── config/
│   └── competitors.py      # Add/remove competitors here
├── storage/
│   └── db.py               # ChromaDB local storage
├── orchestrator.py         # Run all agents
├── scheduler.py            # 24/7 scheduling
├── dashboard.py            # Streamlit UI
└── .github/workflows/      # GitHub Actions automation
```

## Adding a Competitor

Edit `config/competitors.py`:

```python
COMPETITORS["slice"] = {
    "name": "Slice",
    "category": "Credit Card",
    "website": "https://sliceit.com",
    "pricing_page": "https://sliceit.com/pricing",
    "blog": "https://sliceit.com/blog",
    "careers": "https://sliceit.com/careers",
    "twitter": "sliceit_app",
    "linkedin_id": "sliceit",
    "rss_feeds": [],
}
```

## Sample Telegram Alert

```
🚨 URGENT — Fintech Intel

📰 Razorpay

Razorpay raises $75M Series F at $7.5B valuation to expand 
into Southeast Asia markets.

🔗 Read more
⏰ 2026-04-18 09:30 UTC
```
