import duckdb

conn = duckdb.connect()
conn.execute("CREATE TABLE j AS SELECT * FROM read_parquet('backend/data/jatak.parquet')")
cols = conn.execute("DESCRIBE j").fetchall()

print("Kolonner i jatak.parquet:")
print("=" * 60)
for col in cols:
    print(f"{col[0]:25} {col[1]}")

# Check if reach exists
print("\n\nTjek reach data:")
result = conn.execute("SELECT COUNT(*), SUM(CASE WHEN reach IS NOT NULL THEN 1 ELSE 0 END) as has_reach FROM j").fetchone()
print(f"Total rows: {result[0]:,}")
print(f"Rows with reach: {result[1]:,}")

if result[1] > 0:
    sample = conn.execute("SELECT reach FROM j WHERE reach IS NOT NULL LIMIT 5").fetchall()
    print(f"\nSample reach values: {sample}")
