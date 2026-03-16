"""
Export every API endpoint to static JSON files in frontend/public/data/.
Requires running backend on localhost:8000 with auth Coop/Jatak12+.
"""
import json, os, re, time, urllib.request, urllib.error, base64

OUT = os.path.join(os.path.dirname(__file__), "frontend", "public", "data")
BASE = "http://localhost:8000"
AUTH = base64.b64encode(b"Coop:Jatak12+").decode()

os.makedirs(OUT, exist_ok=True)

def fetch(path: str) -> bytes:
    url = BASE + path
    req = urllib.request.Request(url, headers={"Authorization": f"Basic {AUTH}"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read()
        except (urllib.error.URLError, ConnectionError) as e:
            print(f"  retry {attempt+1} for {path}: {e}")
            time.sleep(2)
    raise RuntimeError(f"Failed after 3 retries: {path}")

def save(name: str, data: bytes):
    path = os.path.join(OUT, f"{name}.json")
    with open(path, "wb") as f:
        f.write(data)
    print(f"  ✓ {name}.json ({len(data):,} bytes)")

def cat_slug(cat: str) -> str:
    return cat.lower().replace(" ", "_").replace("/", "_").replace(":", "").replace("&", "and")

def chain_slug(chain: str) -> str:
    return chain.lower().replace("'", "").replace(" ", "_")

# ── Simple endpoints ──────────────────────────────────────────────
simple = {
    "kpi":                     "/api/kpi",
    "stores":                  "/api/kpi/stores",
    "date_range":              "/api/kpi/date-range",
    "trend_weekly":            "/api/trend/weekly",
    "categories_perf":         "/api/categories/performance",
    "categories_prices":       "/api/categories/pricepoints",
    "ranking_20":              "/api/stores/ranking?limit=20",
    "ai_categories":           "/api/ai/categories",
    "inspiration_tips":        "/api/inspiration/tips",
    "inspiration_categories":  "/api/inspiration/categories",
    "churn_summary":           "/api/stores/churn/summary",
}

print("=== Simple endpoints ===")
for name, path in simple.items():
    save(name, fetch(path))

# ── Week ranking (limit=10, current week) ─────────────────────────
from datetime import date, timedelta
today = date.today()
monday = today - timedelta(days=today.weekday())
sunday = monday + timedelta(days=6)
save("ranking_week", fetch(f"/api/stores/ranking?limit=10&date_from={monday}&date_to={sunday}"))

# ── Churn stores per chain ────────────────────────────────────────
print("\n=== Churn stores per chain ===")
summary = json.loads(fetch("/api/stores/churn/summary"))
for ch in summary.get("chains", []):
    chain = ch["chain"]
    slug = chain_slug(chain)
    save(f"churn_stores_{slug}", fetch(f"/api/stores/churn/stores?chain={urllib.parse.quote(chain)}"))

import urllib.parse

# ── Inspiration titles per category ───────────────────────────────
print("\n=== Top titles per category ===")
categories = json.loads(fetch("/api/inspiration/categories"))
for cat in categories:
    slug = cat_slug(cat)
    save(f"titles_{slug}", fetch(f"/api/inspiration/top-titles?category={urllib.parse.quote(cat)}"))

# ── Seasonal ──────────────────────────────────────────────────────
print("\n=== Seasonal ===")
current_month = date.today().month
save("seasonal_default", fetch(f"/api/inspiration/seasonal"))
for m in range(1, 13):
    save(f"seasonal_{m}", fetch(f"/api/inspiration/seasonal?month={m}"))

# ── Search pre-baked queries ──────────────────────────────────────
print("\n=== Search queries ===")
SEARCH_MAP = {
    "kærnemælk": "search_kaernemaelk", "flæskesteg": "search_flaeskesteg",
    "kaffe": "search_kaffe", "æg": "search_aeg", "mælk": "search_maelk",
    "ost": "search_ost", "brød": "search_broed", "slik": "search_slik",
    "øl": "search_oel", "vin": "search_vin",
}
for q, name in SEARCH_MAP.items():
    save(name, fetch(f"/api/inspiration/search?q={urllib.parse.quote(q)}"))

n = len([f for f in os.listdir(OUT) if f.endswith(".json")])
print(f"\n✅ Done — {n} JSON files in {OUT}")
