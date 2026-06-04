# 08 – Backend Architecture

## Request flow

```
Client request
  → Uvicorn (ASGI)
    → Basic Auth middleware (checks every request except /health)
      → CORS middleware
        → FastAPI router dispatch
          → Router function
            → get_conn() (thread-local DuckDB)
              → Raw SQL on Parquet view
            → Return dict (auto-serialised to JSON)
```

## Layers

| Layer | Location | Pattern |
|-------|----------|---------|
| HTTP server | Uvicorn | Single-process, multi-threaded |
| Auth | `main.py` middleware | HTTP Basic Auth (hardcoded default credentials) |
| Routing | `backend/routers/*.py` | 7 router modules, each with APIRouter prefix |
| Database | `database.py` | Thread-local DuckDB connection, Parquet view |
| Models | `models/schemas.py` | Pydantic models (defined but mostly unused) |
| Cache | `utils/cache.py` | TTL-based cache decorator (defined but unused) |

## Router modules

| Module | Prefix | Responsibilities |
|--------|--------|-----------------|
| `kpi.py` | `/api/kpi` | Dashboard KPIs, store list, date range |
| `trend.py` | `/api/trend` | Weekly aggregate trend data |
| `stores.py` | `/api/stores` | Store ranking (top N by Ja Tak count) |
| `categories.py` | `/api/categories` | Category performance, price buckets |
| `churn.py` | `/api/stores/churn` | 2025→2026 store churn analysis |
| `inspiration.py` | `/api/inspiration` | Top titles, seasonal, tips, search |
| `ai_jatak.py` | `/api/ai` | GPT-4o offer generation |

## Code patterns

### Shared filter logic (duplicated in 4 routers)

Every router that supports filtering has an identical copy of:

```python
_ISO = re.compile(r'^\d{4}-\d{2}-\d{2}$')
_DDM = re.compile(r'^(\d{1,2})/(\d{1,2})/(\d{4})$')

def _norm(d): ...    # Normalize date format
def _where(store, date_from, date_to): ...  # Build WHERE clause
```

This exact code is copy-pasted in: `kpi.py`, `trend.py`, `stores.py`, `categories.py`.

### Query pattern

All endpoints follow the same pattern:
1. Call `get_conn()` to get a DuckDB connection
2. Build a WHERE clause with string interpolation
3. Execute raw SQL with f-strings
4. Map tuples to dicts manually
5. Return the list of dicts

### No async

Despite FastAPI being async-capable, all endpoints (except `ai_jatak.suggest`) are synchronous `def` functions. This means they block the event loop thread, but DuckDB queries are so fast (~50ms) that it's not a real problem at this scale.

## Architectural issues

1. **SQL injection risk** — `_where()` uses string interpolation with only single-quote escaping (`store.replace("'", "''")`). Not parameterised.
2. **DRY violation** — `_norm()` and `_where()` are duplicated in 4 files
3. **No service layer** — business logic lives directly in route handlers
4. **Unused code** — `schemas.py` models and `cache.py` decorator are dead code
5. **No input validation** — beyond basic FastAPI Query() type checking
6. **No error handling** — no try/catch in most endpoints, relies on FastAPI default 500
