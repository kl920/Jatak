# 02 – Backend Framework

## Framework

**FastAPI 0.111.0** with **Uvicorn 0.29.0** as ASGI server.

## Architecture

- **API-only** — no HTML templates, no server-side rendering
- **Monolithic** single-process application (one `main.py`, one app instance)
- **Modular routers** — 7 router files under `backend/routers/`
- **No background jobs** — no Celery, RQ, Dramatiq, or any task queue
- **No ORM** — raw SQL via DuckDB Python client
- **No migrations** — data is read-only from a Parquet file

## Entry point

`backend/main.py` → `app = FastAPI(...)` → run with `uvicorn main:app --port 8000`

## Middleware stack

1. **HTTP Basic Auth** — custom middleware checking every request except `/health`
2. **CORS** — allows `localhost:5173` and `localhost:3000`

## Router registration

```python
app.include_router(kpi.router)          # /api/kpi
app.include_router(trend.router)        # /api/trend
app.include_router(stores.router)       # /api/stores
app.include_router(categories.router)   # /api/categories
app.include_router(ai_jatak.router)     # /api/ai
app.include_router(inspiration.router)  # /api/inspiration
app.include_router(churn.router)        # /api/stores/churn
```

## Static file serving

If `backend/static/` directory exists, it serves the built frontend as an SPA with fallback to `index.html`.

## Key observations

- All endpoints are **synchronous** (`def`, not `async def`) except the AI suggest endpoint
- No dependency injection for database connections — each function calls `get_conn()` directly
- No request validation via Pydantic for query parameters (uses `Query()` directly)
- No pagination on any endpoint
- No rate limiting
