# 05 – Python Dependencies

## requirements.txt

| Package | Version | Purpose | Notes |
|---------|---------|---------|-------|
| `fastapi` | 0.111.0 | Web framework | Current stable |
| `uvicorn[standard]` | 0.29.0 | ASGI server | Includes `uvloop`, `httptools` |
| `duckdb` | 0.10.3 | Query engine | Reads Parquet directly, no database file |
| `polars` | 0.20.31 | DataFrame library | Used only in `seed.py` (test data generation) |
| `pyarrow` | 16.1.0 | Parquet I/O | Required by DuckDB for Parquet reading |
| `pydantic` | 2.7.1 | Data validation | Models defined but barely used by endpoints |
| `python-dotenv` | 1.0.1 | .env file loading | Listed but not actually used (no .env file) |
| `cachetools` | 5.3.3 | Caching utilities | Listed but **not imported anywhere** |
| `faker` | 25.0.1 | Fake data generation | Only used in `seed.py` (test data) |
| `numpy` | 1.26.4 | Numeric arrays | Only used in `seed.py` |
| `openpyxl` | ≥3.1.0 | Excel reader | Used by `churn.py` to read store lists |
| `openai` | ≥1.30.0 | GPT-4o API | Lazy-imported in `ai_jatak.py` |

## Unused or development-only dependencies

These packages are installed in production but not needed for the runtime API:

| Package | Reason |
|---------|--------|
| `polars` | Only for `seed.py` (data generation) |
| `faker` | Only for `seed.py` |
| `numpy` | Only for `seed.py` |
| `python-dotenv` | No `.env` file exists |
| `cachetools` | Imported nowhere in current code |

## Security concerns

- No known CVEs for these specific versions as of March 2026
- `openai` uses unpinned lower bound (`>=1.30.0`) — could get breaking update

## Recommendations

1. Split into `requirements.txt` (runtime) and `requirements-dev.txt` (seed/test)
2. Remove `cachetools` and `python-dotenv` (unused)
3. Pin `openai` to exact version
