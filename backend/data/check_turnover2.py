import duckdb, sys
con = duckdb.connect()
p = r"C:\AI\Jatak\backend\data\jatak.parquet"

# Check outliers in turnover
print("=== TURNOVER OUTLIERS (top 10 opslag) ===")
rows = con.execute(f"""
SELECT 
    kardex_id,
    LEFT(title, 40) AS title,
    price,
    total_sold,
    total_orders,
    turnover,
    ROUND(turnover / NULLIF(total_orders,0), 0) AS kr_per_order,
    ROUND(price * total_sold, 0)                AS expected_turnover
FROM read_parquet('{p}')
WHERE turnover > 0
ORDER BY turnover DESC
LIMIT 10
""").fetchall()

for r in rows:
    sys.stdout.buffer.write(f"  kardex={r[0]}  solgt={r[3]}  ordre={r[4]}  turnover={r[5]:,.0f}  kr/ordre={r[6]:,.0f}  pris={r[2]:.0f}  forv={r[7]:,.0f}\n  titel: {str(r[1])}\n\n".encode('utf-8'))

# What does turnover look like without top 1% outliers?
print()
r2 = con.execute(f"""
SELECT 
    COUNT(*) AS opslag,
    SUM(total_sold) AS total_sold,
    SUM(total_orders) AS total_orders,
    SUM(turnover) AS total_turnover,
    SUM(turnover) / NULLIF(SUM(total_orders),0) AS avg_kr_per_order,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY turnover/NULLIF(total_orders,0)) AS p99_kr_per_order
FROM read_parquet('{p}')
WHERE total_orders > 0
""").fetchone()

sys.stdout.buffer.write(f"\n=== ALLE DATA ===\n".encode('utf-8'))
sys.stdout.buffer.write(f"  total_sold:       {r2[1]:>15,.0f}\n".encode('utf-8'))
sys.stdout.buffer.write(f"  total_orders:     {r2[2]:>15,.0f}\n".encode('utf-8'))
sys.stdout.buffer.write(f"  total_turnover:   {r2[3]:>15,.0f} kr\n".encode('utf-8'))
sys.stdout.buffer.write(f"  avg kr/ordre:     {r2[4]:>15,.2f} kr\n".encode('utf-8'))
sys.stdout.buffer.write(f"  P99 kr/ordre:     {r2[5]:>15,.2f} kr\n".encode('utf-8'))

# Now check user's calculation
r3 = con.execute(f"""
SELECT 
    SUM(total_sold)                            AS total_sold,
    SUM(total_orders)                          AS total_orders,
    ROUND(AVG(price), 2)                       AS avg_price,
    SUM(price * total_sold)                    AS price_x_sold,
    SUM(price * total_orders)                  AS price_x_orders
FROM read_parquet('{p}')
WHERE total_sold > 0
""").fetchone()

sys.stdout.buffer.write(f"\n=== BRUGERENS BEREGNING (pris x solgte) ===\n".encode('utf-8'))
sys.stdout.buffer.write(f"  avg_price:        {r3[2]:>15,.2f} kr\n".encode('utf-8'))
sys.stdout.buffer.write(f"  price x total_sold:  {r3[3]:>15,.0f} kr  = {r3[3]/1e9:.3f} mia\n".encode('utf-8'))
sys.stdout.buffer.write(f"  price x total_orders:{r3[4]:>15,.0f} kr  = {r3[4]/1e9:.3f} mia\n".encode('utf-8'))
