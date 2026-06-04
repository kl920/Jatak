import duckdb

conn = duckdb.connect()
conn.execute("CREATE TABLE jatak AS SELECT * FROM read_parquet('backend/data/jatak.parquet')")

# Check turnover vs price*sold for Kvickly #1110
result = conn.execute("""
    SELECT 
        COUNT(*) as tilbud,
        SUM(total_sold) as total_sold,
        SUM(price * total_sold) as beregnet_oms,
        SUM(turnover) as turnover_kolonne,
        SUM(COALESCE(turnover, price * total_sold)) as vores_beregning
    FROM jatak
    WHERE kardex_id = 1110 
      AND created_date >= '2025-11-07' 
      AND created_date <= '2026-05-07'
""").fetchone()

print(f"Kvickly #1110 (sidste 6 mdr):")
print(f"  Tilbud: {result[0]}")
print(f"  Solgt: {result[1]:,} varer")
print(f"  Beregnet oms (price * sold): {result[2]:,.0f} kr")
print(f"  Turnover kolonne: {result[3]:,.0f} kr" if result[3] else "  Turnover kolonne: NULL")
print(f"  Vores beregning: {result[4]:,.0f} kr")

# Check a few sample rows
print("\nEksempel rækker:")
samples = conn.execute("""
    SELECT title, price, total_sold, turnover, price * total_sold as calc
    FROM jatak
    WHERE kardex_id = 1110 
      AND created_date >= '2025-11-07' 
      AND created_date <= '2026-05-07'
    LIMIT 5
""").fetchall()

for row in samples:
    print(f"  {row[0][:40]:40} | pris: {row[1]:6.2f} | solgt: {row[2]:4} | turnover: {row[3] if row[3] else 'NULL':>10} | calc: {row[4]:,.0f}")
