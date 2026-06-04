# 07 – Database Structure

## Engine

**DuckDB 0.10.3** — in-process columnar analytics engine.

There is **no traditional database**, no database file, no server. DuckDB reads the Parquet file directly into memory-mapped columnar storage.

## Connection management

File: `backend/database.py`

```python
_local = threading.local()

def get_conn() -> duckdb.DuckDBPyConnection:
    conn = getattr(_local, 'conn', None)
    if conn is None:
        conn = duckdb.connect(':memory:')
        conn.execute(
            f"CREATE VIEW jatak AS SELECT * FROM read_parquet('{PARQUET_PATH}')"
        )
        _local.conn = conn
    return conn
```

- Each thread gets its own in-memory DuckDB connection (thread-safe via `threading.local()`)
- Parquet file is registered as a virtual `VIEW` named `jatak`
- No connection pooling, no close logic, no cleanup

## Data source

**`backend/data/jatak.parquet`** — 680,694 rows, ~139 MB (Git LFS tracked)

## Schema (Parquet columns)

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT | Row identifier |
| `created_date` | DATE | Date the offer was created |
| `store_name` | VARCHAR | Chain name (self-chosen, e.g. "Kvickly Hovedkontor") |
| `kardex_id` | INT | Unique physical store identifier |
| `category` | VARCHAR | Product category |
| `title` | VARCHAR | Offer title text |
| `description` | VARCHAR | Offer description text |
| `price` | DOUBLE | Product price in DKK (0 = no price) |
| `jatak_count` | INT | Number of "Ja Tak" comments (primary metric) |
| `total_sold` | INT | Actual items sold / picked up |
| `initial_stock` | INT | Items allocated for the offer |
| `items_unsold` | INT | Unsold items remaining |
| `in_stock` | BOOLEAN | Whether stock was available |
| `image_url` | VARCHAR | Product image URL |
| `has_emoji` | BOOLEAN | Whether title contains emojis |
| `published_hour` | INT | Hour of day the offer was published (0-23) |
| `fb_orders` | INT | Orders from Facebook |
| `sms_orders` | INT | Orders from SMS |
| `coop_orders` | INT | Orders from Coop app |
| `turnover` | DOUBLE | `price × total_sold` |
| `total_orders` | INT | `fb_orders + sms_orders + coop_orders` |

## Supplementary data (Excel files)

| File | Purpose | Used by |
|------|---------|---------|
| `api_stores_list.xlsx` | Official active store list (Name, Kardex_id) | `churn.py` |
| `active_stores_list_2026.xlsx` | 2026 active stores for HK classification | `churn.py` |

## No ORM

All queries are raw SQL strings executed via `conn.execute(f"SELECT ... FROM jatak {w}")`.

## No migrations

Data is read-only. There is no schema evolution, no ALTER TABLE, no migration tool.

## No indexes

DuckDB creates no explicit indexes. It uses min/max statistics per column chunk for predicate pushdown.

## Performance

DuckDB is very fast for analytical queries — 680K rows aggregated in ~50ms typically. The Parquet columnar format means only needed columns are scanned.
