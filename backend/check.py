import duckdb
c = duckdb.connect()
c.execute("CREATE VIEW j AS SELECT * FROM read_parquet('data/jatak.parquet')")
row = c.execute("SELECT COUNT(*), MIN(created_date), MAX(created_date), ROUND(AVG(jatak_count),1) FROM j").fetchone()
print(f"Rækker: {row[0]:,}")
print(f"Periode: {row[1]} → {row[2]}")
print(f"Gns. Ja Tak: {row[3]}")
top = c.execute("SELECT store_name, SUM(jatak_count) FROM j GROUP BY 1 ORDER BY 2 DESC LIMIT 5").fetchall()
print("Top 5 kæder:")
for r in top:
    print(f"  {r[0]}: {r[1]:,}")
