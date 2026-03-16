import duckdb
con = duckdb.connect()
p = r"C:\AI\Jatak\backend\data\jatak.parquet"

# Check image_url (with vs without image)
r1 = con.execute(f"""
SELECT
    ROUND(AVG(CASE WHEN image_url IS NOT NULL AND image_url != '' THEN jatak_count END), 1) AS with_image,
    ROUND(AVG(CASE WHEN image_url IS NULL OR image_url = ''       THEN jatak_count END), 1) AS no_image,
    COUNT(CASE WHEN image_url IS NOT NULL AND image_url != '' THEN 1 END) AS n_with,
    COUNT(CASE WHEN image_url IS NULL OR image_url = ''       THEN 1 END) AS n_without
FROM read_parquet('{p}')
WHERE jatak_count > 0
""").fetchone()
print(f"BILLEDE: med={r1[0]} ({r1[2]:,})  uden={r1[1]} ({r1[3]:,})  diff={((float(r1[0] or 0)-float(r1[1] or 0))/max(float(r1[1] or 1),1)*100):.1f}%")

# Check published_hour - morning vs afternoon vs evening
r2 = con.execute(f"""
SELECT
    published_hour,
    ROUND(AVG(jatak_count), 1) AS avg_jatak,
    COUNT(*) AS n
FROM read_parquet('{p}')
WHERE jatak_count > 0 AND published_hour IS NOT NULL
GROUP BY published_hour
ORDER BY published_hour
""").fetchall()
print(f"\nTIDSPUNKT (time -> avg jatak):")
for row in r2:
    print(f"  {row[0]:02d}:00  {row[1]:5.1f} avg  ({row[2]:,} opslag)")

# Best hour vs worst hour
best = max(r2, key=lambda x: x[1])
worst = min(r2, key=lambda x: x[1])
print(f"\nBedste time: {best[0]}:00 -> {best[1]} avg ({best[2]:,} opslag)")
print(f"Dårligste:   {worst[0]}:00 -> {worst[1]} avg ({worst[2]:,} opslag)")
print(f"Forskel:     {((best[1]-worst[1])/worst[1]*100):.1f}%")

# Morning (6-11) vs evening (18-22)
r3 = con.execute(f"""
SELECT
    ROUND(AVG(CASE WHEN published_hour BETWEEN 6 AND 11  THEN jatak_count END), 1) AS morning,
    ROUND(AVG(CASE WHEN published_hour BETWEEN 18 AND 22 THEN jatak_count END), 1) AS evening,
    ROUND(AVG(CASE WHEN published_hour BETWEEN 11 AND 14 THEN jatak_count END), 1) AS middag
FROM read_parquet('{p}')
WHERE jatak_count > 0
""").fetchone()
print(f"\nTIDSZONER: morgen(6-11)={r3[0]}  middag(11-14)={r3[2]}  aften(18-22)={r3[1]}")
