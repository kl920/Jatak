import duckdb
con = duckdb.connect()
p = r"C:\AI\Jatak\backend\data\jatak.parquet"

r = con.execute(f"""
SELECT
    SUM(total_sold)      AS total_sold,
    SUM(turnover)        AS total_turnover,
    SUM(total_orders)    AS total_orders,
    SUM(total_sold) / NULLIF(SUM(total_orders), 0) AS avg_items_per_order,
    SUM(turnover)  / NULLIF(SUM(total_orders), 0)  AS avg_order_value_kr,
    MIN(turnover)        AS min_turnover_per_post,
    MAX(turnover)        AS max_turnover_per_post,
    AVG(turnover)        AS avg_turnover_per_post,
    -- check if turnover looks like total kr or per-item
    SUM(turnover) / NULLIF(SUM(total_sold), 0)     AS kr_per_sold_item
FROM read_parquet('{p}')
WHERE total_sold > 0
""").fetchone()

print(f"total_sold:              {r[0]:>15,.0f}")
print(f"total_turnover:          {r[1]:>15,.0f} kr")
print(f"total_orders:            {r[2]:>15,.0f}")
print(f"avg_items_per_order:     {r[3]:>15.2f}")
print(f"avg_order_value_kr:      {r[4]:>15.2f} kr")
print(f"min_turnover_per_post:   {r[5]:>15.2f}")
print(f"max_turnover_per_post:   {r[6]:>15,.2f}")
print(f"avg_turnover_per_post:   {r[7]:>15,.2f}")
print(f"kr_per_sold_item:        {r[8]:>15.2f}")

print()
# Show 5 sample rows to understand the field
rows = con.execute(f"""
SELECT title, price, total_sold, total_orders, turnover,
       ROUND(turnover / NULLIF(total_orders,0), 2) AS turnover_per_order,
       ROUND(turnover / NULLIF(total_sold,0), 2)   AS turnover_per_item
FROM read_parquet('{p}')
WHERE total_sold > 10 AND turnover > 0
ORDER BY total_sold DESC
LIMIT 8
""").fetchall()

print("=== EKSEMPLER ===")
print(f"{'titel':<35} {'pris':>6} {'solgt':>6} {'ordre':>6} {'turnover':>10} {'kr/ordre':>9} {'kr/item':>8}")
for row in rows:
    print(f"{str(row[0])[:35]:<35} {row[1]:>6.0f} {row[2]:>6} {row[3]:>6} {row[4]:>10,.0f} {str(row[5]):>9} {str(row[6]):>8}")
