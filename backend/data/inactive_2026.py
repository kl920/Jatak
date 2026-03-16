"""
Find kardex_id der var aktive i 2025 men IKKE i 2026.
Gemmer resultatet som inactive_2026.csv
"""
import duckdb
import csv
from pathlib import Path

parquet = Path(__file__).parent / "jatak.parquet"
conn = duckdb.connect(':memory:')
conn.execute(f"CREATE VIEW jatak AS SELECT * FROM read_parquet('{parquet.as_posix()}')")

# Vis kolonner
cols = conn.execute("DESCRIBE jatak").fetchall()
print("Kolonner:", [c[0] for c in cols])
print()

# Kardex aktive i 2025
in_2025 = {r[0] for r in conn.execute("""
    SELECT DISTINCT kardex_id FROM jatak
    WHERE YEAR(created_date) = 2025 AND kardex_id IS NOT NULL
""").fetchall()}

# Kardex aktive i 2026
in_2026 = {r[0] for r in conn.execute("""
    SELECT DISTINCT kardex_id FROM jatak
    WHERE YEAR(created_date) = 2026 AND kardex_id IS NOT NULL
""").fetchall()}

only_2025 = sorted(in_2025 - in_2026)

print(f"Aktive i 2025:          {len(in_2025):>5}")
print(f"Aktive i 2026:          {len(in_2026):>5}")
print(f"Kun i 2025 (ikke 2026): {len(only_2025):>5}")
print()

# Detaljer for disse kardex i 2025
details = conn.execute("""
    SELECT
        kardex_id,
        MAX(store_name)            AS store_name,
        COUNT(*)                   AS opslag_2025,
        ROUND(AVG(jatak_count), 1) AS avg_jatak_2025,
        MAX(created_date)::VARCHAR AS seneste_opslag
    FROM jatak
    WHERE YEAR(created_date) = 2025
      AND kardex_id IS NOT NULL
    GROUP BY kardex_id
""").fetchall()

detail_map = {r[0]: r[1:] for r in details}

rows = []
for kid in only_2025:
    d = detail_map.get(kid, ('', 0, 0.0, ''))
    rows.append({
        'kardex_id':       kid,
        'store_name':      d[0],
        'opslag_2025':     d[1],
        'avg_jatak_2025':  d[2],
        'seneste_opslag':  d[3],
    })

rows.sort(key=lambda r: r['opslag_2025'], reverse=True)

out = Path(__file__).parent / "inactive_2026.csv"
with open(out, 'w', newline='', encoding='utf-8-sig') as f:
    writer = csv.DictWriter(f, fieldnames=['kardex_id','store_name','opslag_2025','avg_jatak_2025','seneste_opslag'])
    writer.writeheader()
    writer.writerows(rows)

print(f"Gemt: {out}")
print()
print(f"{'kardex_id':<12} {'store_name':<30} {'opslag':>7} {'avg_jatak':>10} {'seneste':>12}")
print("-" * 75)
for r in rows[:25]:
    print(f"{str(r['kardex_id']):<12} {str(r['store_name']):<30} {r['opslag_2025']:>7} {float(r['avg_jatak_2025'] or 0):>10.1f} {str(r['seneste_opslag'])[:10]:>12}")

# ── Eksempler på opslag uden pris ──────────────────────────────────────────
no_price = conn.execute("""
    SELECT title, description, jatak_count, store_name, created_date::VARCHAR
    FROM jatak
    WHERE (price IS NULL OR price = 0)
      AND jatak_count > 0
      AND title IS NOT NULL
      AND description IS NOT NULL
      AND LENGTH(TRIM(description)) > 20
    ORDER BY jatak_count DESC
    LIMIT 5
""").fetchall()

ex_out = Path(__file__).parent / "no_price_examples.txt"
with open(ex_out, 'w', encoding='utf-8') as f:
    f.write("EKSEMPLER PÅ OPSLAG UDEN PRIS (price = 0 eller NULL)\n")
    f.write("=" * 70 + "\n")
    for i, r in enumerate(no_price, 1):
        f.write(f"\n--- Opslag {i} ({r[2]} Ja Tak | {r[3]} | {str(r[4])[:10]}) ---\n")
        f.write(f"TITEL:       {r[0]}\n")
        f.write(f"BESKRIVELSE: {r[1][:400]}\n")

print(f"Eksempler gemt: {ex_out}")
