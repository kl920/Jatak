import duckdb

con = duckdb.connect()
parquet = r"C:\AI\Jatak\backend\data\jatak.parquet"

# Price distribution 2026
result = con.execute(f"""
SELECT 
    COUNT(*) as total_opslag,
    COUNT(CASE WHEN price IS NULL THEN 1 END) as price_null,
    COUNT(CASE WHEN price = 0 THEN 1 END) as price_zero,
    COUNT(CASE WHEN price > 0 THEN 1 END) as price_positive,
    MIN(price) as min_price,
    MAX(price) as max_price,
    ROUND(AVG(price), 2) as avg_price
FROM read_parquet('{parquet}')
WHERE YEAR(created_date) = 2026
""").fetchone()

print("=== PRIS-DISTRIBUTION 2026 ===")
print(f"Total opslag 2026:    {result[0]}")
print(f"price IS NULL:        {result[1]}")
print(f"price = 0:            {result[2]}")
print(f"price > 0:            {result[3]}")
print(f"Min pris:             {result[4]}")
print(f"Max pris:             {result[5]}")
print(f"Avg pris:             {result[6]}")
if result[0] > 0:
    print(f"Andel pris > 0:       {result[3]/result[0]*100:.1f}%")

print()

# Also check 2025 for comparison
result2 = con.execute(f"""
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN price IS NULL THEN 1 END) as price_null,
    COUNT(CASE WHEN price = 0 THEN 1 END) as price_zero,
    COUNT(CASE WHEN price > 0 THEN 1 END) as price_positive
FROM read_parquet('{parquet}')
WHERE YEAR(created_date) = 2025
""").fetchone()

print("=== PRIS-DISTRIBUTION 2025 (sammenligning) ===")
print(f"Total opslag 2025:    {result2[0]}")
print(f"price IS NULL:        {result2[1]}")
print(f"price = 0:            {result2[2]}")
print(f"price > 0:            {result2[3]}")
if result2[0] > 0:
    print(f"Andel pris > 0:       {result2[3]/result2[0]*100:.1f}%")
