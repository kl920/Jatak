import duckdb
con = duckdb.connect()
p = r"C:\AI\Jatak\backend\data\jatak.parquet"
r = con.execute(f"SELECT COUNT(*) FROM read_parquet('{p}') WHERE YEAR(created_date) = 2025").fetchone()
print(f"Opslag i 2025: {r[0]:,}")
