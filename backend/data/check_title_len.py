import duckdb
con = duckdb.connect()
p = r"C:\AI\Jatak\backend\data\jatak.parquet"

r = con.execute(f"""
SELECT
    ROUND(AVG(CASE WHEN LENGTH(title) <= 40 THEN jatak_count END), 1) AS short_avg,
    ROUND(AVG(CASE WHEN LENGTH(title) >  40 THEN jatak_count END), 1) AS long_avg,
    COUNT(CASE WHEN LENGTH(title) <= 40 THEN 1 END) AS short_count,
    COUNT(CASE WHEN LENGTH(title) >  40 THEN 1 END) AS long_count,
    -- try different thresholds
    ROUND(AVG(CASE WHEN LENGTH(title) <= 30 THEN jatak_count END), 1) AS t30_avg,
    ROUND(AVG(CASE WHEN LENGTH(title) <= 50 THEN jatak_count END), 1) AS t50_avg,
    ROUND(AVG(CASE WHEN LENGTH(title) <= 60 THEN jatak_count END), 1) AS t60_avg,
    ROUND(AVG(CASE WHEN LENGTH(title) >  60 THEN jatak_count END), 1) AS t60plus_avg,
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY LENGTH(title)), 0) AS median_title_len,
    ROUND(AVG(LENGTH(title)), 1) AS avg_title_len
FROM read_parquet('{p}')
WHERE jatak_count > 0 AND title IS NOT NULL
""").fetchone()

print(f"=== TITEL LAENGDE VS JA TAK ===")
print(f"Grænse 40 tegn:")
print(f"  kort (<=40): {r[0]} avg jatak  ({r[2]:,} opslag)")
print(f"  lang (>40):  {r[1]} avg jatak  ({r[3]:,} opslag)")
print(f"  forskel:     {((r[0]-r[1])/r[1]*100):.1f}%")
print()
print(f"Andre grænser:")
print(f"  <=30: {r[4]} avg jatak")
print(f"  <=50: {r[5]} avg jatak")
print(f"  <=60: {r[6]} avg jatak")
print(f"  >60:  {r[7]} avg jatak")
print()
print(f"Median titel-længde: {r[8]} tegn")
print(f"Avg titel-længde:    {r[9]} tegn")
