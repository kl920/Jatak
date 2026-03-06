"""
DuckDB connection manager.
Uses a single in-process DuckDB instance that queries Parquet files directly –
this gives columnar, vectorised execution over 2 M rows without loading them
all into RAM at once.
"""
import threading
import duckdb
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"
PARQUET_PATH = DATA_DIR / "jatak.parquet"

_local = threading.local()


def get_conn() -> duckdb.DuckDBPyConnection:
    """Return a per-thread in-memory DuckDB connection (thread-safe, no file contention)."""
    conn = getattr(_local, 'conn', None)
    if conn is None:
        conn = duckdb.connect(':memory:')
        # Register the Parquet file as a virtual table so every query can
        # reference it as  FROM jatak  without re-scanning the file header.
        if PARQUET_PATH.exists():
            conn.execute(
                f"CREATE VIEW jatak AS SELECT * FROM read_parquet('{PARQUET_PATH.as_posix()}')"
            )
        _local.conn = conn
    return conn
