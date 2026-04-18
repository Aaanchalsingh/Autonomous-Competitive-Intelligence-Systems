"""
Fintech competitors configuration.
Add or remove competitors here — no code changes needed elsewhere.
"""

COMPETITORS = {
    "razorpay": {
        "name": "Razorpay",
        "category": "Payments",
        "website": "https://razorpay.com",
        "pricing_page": "https://razorpay.com/pricing/",
        "blog": "https://razorpay.com/blog/",
        "careers": "https://razorpay.com/jobs/",
        "twitter": "razorpay",
        "linkedin_id": "razorpay",
        "app_store_id": "id1342906919",
        "play_store_id": "com.razorpay.payments.app",
        "rss_feeds": [
            "https://razorpay.com/blog/feed/",
        ],
    },
    "phonePe": {
        "name": "PhonePe",
        "category": "Payments/UPI",
        "website": "https://www.phonepe.com",
        "pricing_page": "https://www.phonepe.com/business-solutions/payment-gateway/",
        "blog": "https://www.phonepe.com/blog/",
        "careers": "https://www.phonepe.com/careers/",
        "twitter": "PhonePe_",
        "linkedin_id": "phonepe",
        "app_store_id": "id1170055821",
        "play_store_id": "com.phonepe.app",
        "rss_feeds": [],
    },
    "groww": {
        "name": "Groww",
        "category": "Investing",
        "website": "https://groww.in",
        "pricing_page": "https://groww.in/pricing",
        "blog": "https://groww.in/blog/",
        "careers": "https://groww.in/careers",
        "twitter": "GrowwApp",
        "linkedin_id": "groww",
        "app_store_id": "id1404871703",
        "play_store_id": "com.nextbillion.groww",
        "rss_feeds": [
            "https://groww.in/blog/feed",
        ],
    },
    "zerodha": {
        "name": "Zerodha",
        "category": "Stock Broking",
        "website": "https://zerodha.com",
        "pricing_page": "https://zerodha.com/pricing/",
        "blog": "https://zerodha.com/z-connect/",
        "careers": "https://zerodha.com/careers/",
        "twitter": "zerodha",
        "linkedin_id": "zerodha",
        "app_store_id": "id1449453802",
        "play_store_id": "com.zerodha.kite3",
        "rss_feeds": [
            "https://zerodha.com/z-connect/?feed=rss2",
        ],
    },
    "paytm": {
        "name": "Paytm",
        "category": "Payments/Finance",
        "website": "https://paytm.com",
        "pricing_page": "https://paytm.com/business/payment-gateway",
        "blog": "https://paytm.com/blog/",
        "careers": "https://paytm.com/careers/",
        "twitter": "Paytm",
        "linkedin_id": "paytm",
        "app_store_id": "id473941634",
        "play_store_id": "net.one97.paytm",
        "rss_feeds": [],
    },
    "cred": {
        "name": "CRED",
        "category": "Credit/Rewards",
        "website": "https://cred.club",
        "pricing_page": None,
        "blog": "https://blog.cred.club/",
        "careers": "https://careers.cred.club/",
        "twitter": "CRED_club",
        "linkedin_id": "cred-club",
        "app_store_id": "id1428580080",
        "play_store_id": "com.dreamplug.androidapp",
        "rss_feeds": [],
    },
}

# News sources focused on Indian fintech
NEWS_SOURCES = [
    "https://inc42.com/feed/",
    "https://yourstory.com/feed",
    "https://entrackr.com/feed/",
    "https://economictimes.indiatimes.com/tech/startups/rssfeeds/78570550.cms",
    "https://www.livemint.com/rss/technology",
]

# Keywords that trigger INSTANT alerts (not just weekly)
HIGH_PRIORITY_KEYWORDS = [
    "funding", "series a", "series b", "series c", "raises",
    "launches", "launch", "acquires", "acquisition", "merger",
    "rbi approval", "sebi", "license", "banned", "shutdown",
    "data breach", "hack", "penalty", "fine",
    "ipo", "valuation", "unicorn",
    "pricing change", "fee reduction", "free",
]

# Job titles that signal strategic moves
STRATEGIC_JOB_SIGNALS = {
    "ml engineer": "AI/ML product development",
    "data scientist": "Data-driven product incoming",
    "compliance officer": "Regulatory expansion",
    "country manager": "Geographic expansion",
    "blockchain developer": "Crypto/Web3 feature",
    "credit analyst": "Lending product expansion",
    "ios developer": "Mobile feature push",
    "android developer": "Mobile feature push",
    "business development": "Partnership/expansion push",
    "product manager": "New product vertical",
}
