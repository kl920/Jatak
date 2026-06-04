import duckdb

conn = duckdb.connect()
conn.execute("CREATE TABLE jatak AS SELECT * FROM read_parquet('backend/data/jatak.parquet')")

# Test for Kvickly chain only
kvickly_result = conn.execute("""
    SELECT 
        AVG(offer_count) as avg_offers,
        AVG(total_turnover) as avg_turnover,
        COUNT(DISTINCT kardex_id) as store_count
    FROM (
        SELECT 
            kardex_id, 
            COUNT(*) as offer_count, 
            SUM(COALESCE(turnover, price * total_sold)) as total_turnover
        FROM jatak 
        WHERE created_date >= '2025-11-07' 
          AND created_date <= '2026-05-07'
          AND REPLACE(store_name, ' Hovedkontor', '') = 'Kvickly'
        GROUP BY kardex_id
    )
""").fetchone()

print(f"Kvickly kæde gennemsnit ({kvickly_result[2]} butikker):")
print(f"  Gnm tilbud: {kvickly_result[0]:.1f}")
print(f"  Gnm omsætning: {kvickly_result[1]:,.0f} kr")

# Kvickly #1110
store_result = conn.execute("""
    SELECT 
        COUNT(*) as offer_count,
        SUM(COALESCE(turnover, price * total_sold)) as total_turnover
    FROM jatak
    WHERE kardex_id = 1110 
      AND created_date >= '2025-11-07' 
      AND created_date <= '2026-05-07'
""").fetchone()

print(f"\nKvickly #1110:")
print(f"  Tilbud: {store_result[0]}")
print(f"  Omsætning: {store_result[1]:,.0f} kr")
