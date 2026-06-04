# 16 – External Integrations

## Active integrations

### 1. OpenAI GPT-4o

- **Used by:** `backend/routers/ai_jatak.py` → `POST /api/ai/suggest`
- **SDK:** `openai` Python package (lazy-imported)
- **Model:** `gpt-4o`
- **Key management:** User provides their own API key via form input → stored in `localStorage`
- **Key is sent per-request** as `api_key` form field (not stored on server)
- **Features used:** Chat completions, JSON response format, image input (vision)
- **Temperature:** 0.85
- **Max tokens:** 1200
- **Timeout:** None configured (relies on OpenAI SDK defaults)

### 2. DuckDB + Apache Parquet

- **Used by:** `backend/database.py` → all data queries
- **Type:** Local file (in-process, no network calls)
- **File:** `backend/data/jatak.parquet` (139 MB, 680K rows)
- **Git LFS:** Tracked via `.gitattributes`

### 3. Excel files (openpyxl)

- **Used by:** `backend/routers/churn.py`
- **Files:** `api_stores_list.xlsx`, `active_stores_list_2026.xlsx`
- **Purpose:** Cross-reference active store lists for churn classification
- **Read-only:** Never written

## Frontend-only integrations

### 4. GitHub Pages CDN

- **Used by:** `client.static.ts` for static JSON data delivery
- **Pattern:** `fetch(BASE_URL + 'data/' + name + '.json')`
- **48 pre-baked JSON files** in `frontend/public/data/`

## Not integrated

| Service | Status |
|---------|--------|
| Any traditional database | Not used (DuckDB is in-process) |
| Email / notifications | Not used |
| Analytics (GA, Mixpanel) | Not used |
| Error tracking (Sentry) | Not used |
| Logging service | Not used |
| Payment system | Not used |
| File storage (S3, etc.) | Not used |

## Data source mystery

The origin of `jatak.parquet` is unknown from the codebase. The `seed.py` script generates **synthetic test data** with random store names and categories. The production Parquet file contains real Coop store data that was likely exported from an internal system.
