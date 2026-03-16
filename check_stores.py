import duckdb
conn = duckdb.connect(':memory:')
conn.execute("CREATE VIEW jatak AS SELECT * FROM read_parquet('C:/AI/Jatak/backend/data/jatak.parquet')")
rows = conn.execute("SELECT DISTINCT store_name FROM jatak LIMIT 30").fetchall()
for r in rows:
    print(repr(r[0]))
