# 09 – API Endpoints

## Overview

16 endpoints across 7 routers. All require HTTP Basic Auth except `/health`.

## Endpoints

### KPI (`kpi.py`)

| Method | Path | Query params | Returns |
|--------|------|-------------|---------|
| GET | `/api/kpi` | `store?`, `date_from?`, `date_to?` | KPI summary: totals, channel split, basket metrics |
| GET | `/api/kpi/stores` | — | `string[]` of unique store names |
| GET | `/api/kpi/date-range` | — | `{date_min, date_max}` |

### Trend (`trend.py`)

| Method | Path | Query params | Returns |
|--------|------|-------------|---------|
| GET | `/api/trend/weekly` | `store?`, `date_from?`, `date_to?` | `WeekPoint[]` grouped by week |

### Stores (`stores.py`)

| Method | Path | Query params | Returns |
|--------|------|-------------|---------|
| GET | `/api/stores/ranking` | `limit=20`, `date_from?`, `date_to?` | Top stores by Ja Tak count (kardex-level) |

### Categories (`categories.py`)

| Method | Path | Query params | Returns |
|--------|------|-------------|---------|
| GET | `/api/categories/performance` | `store?`, `date_from?`, `date_to?` | Category-level avg_jatak, avg_price, avg_revenue |
| GET | `/api/categories/pricepoints` | `store?`, `date_from?`, `date_to?` | Price bucket analysis (< 50 kr, 50-100, 100-250, 250+) |

### Churn (`churn.py`)

| Method | Path | Query params | Returns |
|--------|------|-------------|---------|
| GET | `/api/stores/churn/summary` | — | Full churn analysis: KPIs + chain breakdown |
| GET | `/api/stores/churn/stores` | `chain` (required) | Individual stores for a specific chain |

### Inspiration (`inspiration.py`)

| Method | Path | Query params | Returns |
|--------|------|-------------|---------|
| GET | `/api/inspiration/top-titles` | `category` (required), `limit=15`, `min_uses=2` | Top-performing offer titles |
| GET | `/api/inspiration/seasonal` | `month?` (defaults to current) | Category ranking for calendar month |
| GET | `/api/inspiration/tips` | — | Data-backed tips (emoji, timing, price) |
| GET | `/api/inspiration/categories` | — | Distinct category list |
| GET | `/api/inspiration/search` | `q` (required, min 2 chars), `limit=10` | Full-text search (ILIKE) on titles |

### AI (`ai_jatak.py`)

| Method | Path | Body params | Returns |
|--------|------|------------|---------|
| POST | `/api/ai/suggest` | `category`, `product_name`, `api_key`, `price?`, `extra_info?`, `image?` (multipart) | 3 GPT-4o generated suggestions + examples used |
| GET | `/api/ai/categories` | — | Categories with example counts and median jatak |

### Health

| Method | Path | Returns |
|--------|------|---------|
| GET | `/health` | `{status: "ok"}` — no auth required |

## Common filter pattern

Endpoints supporting filters accept:
- `store` — exact match on `store_name`
- `date_from` — `created_date >= date` (YYYY-MM-DD or DD/MM/YYYY)
- `date_to` — `created_date <= date`

## Response format

All endpoints return raw JSON dicts/arrays. No envelope, no pagination, no HATEOAS.

## Authentication

HTTP Basic Auth: `Authorization: Basic base64(Coop:Jatak12+)`

Applied to every request via middleware in `main.py`. `/health` is exempt.
