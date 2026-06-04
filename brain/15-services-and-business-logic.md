# 15 – Services and Business Logic

## Overview

There is **no service layer**. All business logic lives directly in router endpoint functions.

## Business logic by domain

### 1. KPI aggregation (`kpi.py`)

- Computes totals: offers, jatak_count, sold, turnover
- Computes averages: basket quantity, basket value
- Computes channel split percentages (Facebook / SMS / Coop)
- All in a single SQL query

### 2. Date normalization (duplicated in 4 routers)

Accepts both `YYYY-MM-DD` and `DD/MM/YYYY` formats. Normalizes to ISO. This is duplicated in `kpi.py`, `trend.py`, `stores.py`, `categories.py`.

### 3. Churn analysis (`churn.py`)

Most complex business logic:

1. Find stores active in 2025 (have rows with `YEAR(created_date) = 2025`)
2. Find stores active in 2026
3. "Inactive" = active in 2025 but not in 2026
4. Cross-reference with Excel files:
   - `api_stores_list.xlsx` → if present, store is still "active" (status = "Pause")
   - `active_stores_list_2026.xlsx` → if present, store receives offers via HK (headquarters)
5. If NOT in Excel → status = "Ophørt" (closed)
6. If in Excel but not in HK list → "Ikke aktive" (truly lost)
7. Aggregate by chain for summary view

### 4. Inspiration analytics (`inspiration.py`)

- **Top titles:** Groups identical offer titles, calculates avg jatak, ranks by performance
- **Seasonal:** Category ranking by calendar month, filtered to categories with ≥ 20 offers
- **Tips:** Computes data-backed insights:
  - Emoji effect: avg jatak with vs without emoji
  - Publish time: morning (6-9) vs midday (11-14)
  - Price buckets: under 50 kr vs 50-100 vs 100+
  - Top 3 categories
- **Search:** ILIKE full-text search on title column

### 5. AI offer generation (`ai_jatak.py`)

1. Fetch top 15 examples from same category (above median jatak_count)
2. Build system prompt with examples as few-shot context
3. Build user prompt with product name, price, extra info
4. Optionally include product image (base64 encoded for GPT-4o vision)
5. Call OpenAI GPT-4o with JSON response format
6. Return 3 style variants

### 6. Store name normalization (`churn.py`)

```python
def _norm_chain(store_name: str) -> str:
    for prefix in ("Kvickly", "Superbrugsen"):
        if store_name.startswith(prefix):
            return prefix
    return store_name
```

Used to group stores by chain. Only handles 2 chain names explicitly.

## Shared utilities

| Module | Function | Status |
|--------|----------|--------|
| `database.py` | `get_conn()` | Active — used by all routers |
| `utils/cache.py` | `@cached(ttl=300)` | **Unused** — no router imports it |
| `models/schemas.py` | Pydantic models | **Mostly unused** — only `ai_jatak.py` uses `JatakExample` and `SuggestResponse` |
