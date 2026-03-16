"""
Generer ~2.000.000 rækker realistisk Ja Tak testdata og gem som Parquet.
Kør én gang:  python data/seed.py
Tager ca. 30-60 sek. afhængig af maskine.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import numpy as np
import polars as pl
from datetime import date, timedelta
import random
import string

SEED = 42
N = 2_000_000
rng = np.random.default_rng(SEED)

# ── Stamdata ────────────────────────────────────────────────────────────────

CATEGORIES = [
    "Elektronik", "Tøj & Mode", "Møbler", "Legetøj", "Sport & Fritid",
    "Bøger & Medier", "Køkken & Hjem", "Skønhed & Sundhed",
    "Bil & Motor", "Mad & Drikke", "Havemøbler", "Babyprodukter",
    "Computere", "Telefoner", "Cykler",
]

STORE_TEMPLATES = [
    "Butik {}", "Shop {} ApS", "Online Store {}", "{} Marked",
    "Handel {}", "KøbHub {}", "DealZone {}", "PrisFald {}",
]

N_STORES = 8_000
store_names = [
    random.choice(STORE_TEMPLATES).format(
        "".join(random.choices(string.ascii_uppercase, k=3))
    )
    for _ in range(N_STORES)
]

TITLE_WORDS = [
    "Ny", "Brugt", "Billig", "Eksklusiv", "Unik", "Sjælden", "OBO",
    "iPhone", "Samsung", "Lego", "Nike", "Adidas", "IKEA", "Sofa",
    "Cykel", "Stol", "Bord", "Lampe", "Kamera", "Højtaler", "Tablet",
    "Jakke", "Sko", "Tørklæde", "Støvsuger", "Kaffemaskine", "Blender",
]

DESC_SENTENCES = [
    "God stand, ikke brugt meget.",
    "Sælges da vi er ved at flytte.",
    "Prisen er fast, ingen bytte.",
    "Kvittering haves, købt i {}.",
    "Perfekt til hjemmet eller kontoret.",
    "Gratis levering i lokalområdet.",
    "Afhentning i {} foretrækkes.",
    "Nypris var {}kr, sælges til {}kr.",
    "Fejler ingenting, virker som det skal.",
    "Kontakt for mere info eller billeder.",
]

CITIES = ["København", "Aarhus", "Odense", "Aalborg", "Esbjerg", "Randers", "Kolding"]

# ── Generér data chunk-wise for low memory ──────────────────────────────────

def random_title(r: np.random.Generator) -> list[str]:
    n = len(store_names)
    w1 = [TITLE_WORDS[i] for i in r.integers(0, len(TITLE_WORDS), n)]
    w2 = [TITLE_WORDS[i] for i in r.integers(0, len(TITLE_WORDS), n)]
    return [f"{a} {b}" for a, b in zip(w1, w2)]


def random_description(size: int, rng2: np.random.Generator) -> list[str]:
    descs = []
    for _ in range(size):
        k = rng2.integers(1, 5)
        sents = []
        for _ in range(k):
            s = random.choice(DESC_SENTENCES)
            if "{}" in s:
                placeholders = s.count("{}")
                fills = [random.choice(CITIES if "i {}" in s else ["2023", "2024"])]
                if placeholders == 2:
                    fills = [rng2.integers(500, 5000), rng2.integers(100, 3000)]
                try:
                    s = s.format(*fills)
                except Exception:
                    s = s.replace("{}", "her")
            sents.append(s)
        descs.append(" ".join(sents))
    return descs


print(f"Genererer {N:,} rækker …")

CHUNK = 200_000
chunks = []

start_date = date(2023, 1, 1)
end_date   = date(2026, 3, 1)
date_range = (end_date - start_date).days

for chunk_start in range(0, N, CHUNK):
    size = min(CHUNK, N - chunk_start)
    chunk_rng = np.random.default_rng(SEED + chunk_start)

    # Dates – skewed toward recent months (growth trend)
    day_offsets = chunk_rng.integers(0, date_range, size)
    dates = [str(start_date + timedelta(days=int(d))) for d in day_offsets]

    cat_idx   = chunk_rng.integers(0, len(CATEGORIES), size)
    store_idx = chunk_rng.integers(0, N_STORES, size)

    # Jatak count – lognormal so most offers have few but some go viral
    jatak_raw = chunk_rng.lognormal(mean=2.5, sigma=1.4, size=size).astype(int) + 1
    jatak_raw = np.clip(jatak_raw, 1, 5000)

    prices = chunk_rng.uniform(0, 8000, size).round(2)
    # 15 % has no price
    no_price_mask = chunk_rng.random(size) < 0.15
    prices[no_price_mask] = 0.0

    in_stock = chunk_rng.random(size) > 0.2

    image_present = chunk_rng.random(size) > 0.35
    image_urls = [
        f"https://cdn.jatak.dk/img/{chunk_rng.integers(100000,999999)}.jpg"
        if has_img else ""
        for has_img in image_present
    ]

    df = pl.DataFrame({
        "id":          list(range(chunk_start, chunk_start + size)),
        "created_date": pl.Series(dates).str.to_date(),
        "store_name":  [store_names[i] for i in store_idx],
        "category":    [CATEGORIES[i] for i in cat_idx],
        "title":       [f"{TITLE_WORDS[chunk_rng.integers(0,len(TITLE_WORDS))]} {TITLE_WORDS[chunk_rng.integers(0,len(TITLE_WORDS))]}" for _ in range(size)],
        "description": random_description(size, chunk_rng),
        "price":       prices.tolist(),
        "jatak_count": jatak_raw.tolist(),
        "in_stock":    in_stock.tolist(),
        "image_url":   image_urls,
    })
    chunks.append(df)
    print(f"  {chunk_start + size:>9,} / {N:,} rækker klar …")

print("Sammensætter og gemmer Parquet …")
full = pl.concat(chunks)
out = Path(__file__).parent / "jatak.parquet"
full.write_parquet(out, compression="zstd")
print(f"Gemt → {out}  ({out.stat().st_size / 1e6:.1f} MB)")
print("Færdig!")
