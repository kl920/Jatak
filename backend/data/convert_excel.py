"""
Convert Excel files to jatak.parquet.

Cleaning rules applied:
  - Stray rows outside the file's expected year → removed
  - Null/empty titles                           → removed
  - Placeholder stock > 500,000                 → removed
  - FaktaGermany rows                           → removed (foreign test data)
  - Exact duplicate rows (all columns equal)    → removed
  - Sold > stock (stock > 0)                    → kept, flagged as oversold=True

Run:  python data/convert_excel.py
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import polars as pl

DATA_DIR = Path(__file__).parent.parent.parent / "data"
OUT_PATH  = Path(__file__).parent / "jatak.parquet"

EXCEL_FILES = sorted(DATA_DIR.glob("*.xlsx")) + sorted(DATA_DIR.glob("*.xls"))

if not EXCEL_FILES:
    print(f"No Excel files found in {DATA_DIR}")
    sys.exit(1)

frames = []
for f in EXCEL_FILES:
    # Derive expected year from filename (e.g. "2026.xlsx" → "2026")
    expected_year = f.stem if f.stem.isdigit() else None

    print(f"Loading {f.name} …")
    df = pl.read_excel(f, read_options={"header_row": 1})

    # Cast every column to string first so diagonal concat is safe
    df = df.with_columns([pl.col(c).cast(pl.Utf8, strict=False) for c in df.columns])

    # Select & rename — only pick columns that exist in this file
    # (Price and Is Variant were added in the 2026 export)
    col_map = {
        "JA TAK title":                     "title",
        "JA TAK description":               "description",
        "Is Variant":                       "is_variant",
        "Chain":                            "store_name",
        "Kardex ID":                        "kardex_id",
        "Published At":                     "created_date",
        "Price":                            "price_raw",
        "Turnover":                         "turnover",
        "No. of customers":                 "jatak_count",
        "Total no. of sold items":          "total_sold",
        "Initial stock":                    "initial_stock",
        "Number of items remaining unsold": "items_unsold",
        "Total no. of orders":              "total_orders",
        "No. of orders":                    "fb_orders",
        "No. of items sold":                "fb_items_sold",
        "No. of items marked as Picked up": "fb_picked_up",
        "Average items per order":          "fb_avg_items",
        "No. of orders_1":                  "sms_orders",
        "No. of items sold_1":              "sms_items_sold",
        "No. of orders_2":                  "coop_orders",
        "No. of items sold_2":              "coop_items_sold",
    }

    available = {src: dst for src, dst in col_map.items() if src in df.columns}
    df = df.select([pl.col(src).alias(dst) for src, dst in available.items()])

    # ── Cleaning #1: remove stray rows outside the expected year ─────────────
    if expected_year and "created_date" in df.columns:
        before = len(df)
        df = df.filter(pl.col("created_date").str.starts_with(expected_year))
        removed = before - len(df)
        if removed:
            print(f"  Removed {removed} stray rows outside {expected_year}")

    frames.append(df)
    print(f"  {len(df):,} rows")

print("\nCombining all years …")
full = pl.concat(frames, how="diagonal")
print(f"Total before cleaning: {len(full):,} rows")

# ── Step 1: cast to proper types ─────────────────────────────────────────────
full = full.with_columns([
    # Extract hour BEFORE casting to Date (format: "2026-01-01 08:00:00")
    pl.col("created_date")
        .str.slice(11, 2)
        .cast(pl.Int8, strict=False)
        .fill_null(-1)
        .alias("published_hour"),
    pl.col("created_date")
        .str.strptime(pl.Datetime, format="%Y-%m-%d %H:%M:%S", strict=False)
        .cast(pl.Date)
        .alias("created_date"),
    pl.col("jatak_count")    .cast(pl.Int64,   strict=False).fill_null(0),
    pl.col("total_sold")     .cast(pl.Int64,   strict=False).fill_null(0),
    pl.col("initial_stock")  .cast(pl.Int64,   strict=False).fill_null(0),
    pl.col("items_unsold")   .cast(pl.Int64,   strict=False).fill_null(0),
    pl.col("total_orders")   .cast(pl.Int64,   strict=False).fill_null(0),
    pl.col("turnover")       .cast(pl.Float64, strict=False).fill_null(0.0),
    pl.col("price_raw")      .cast(pl.Float64, strict=False).fill_null(0.0),
    pl.col("fb_orders")      .cast(pl.Int64,   strict=False).fill_null(0),
    pl.col("fb_items_sold")  .cast(pl.Int64,   strict=False).fill_null(0),
    pl.col("fb_picked_up")   .cast(pl.Int64,   strict=False).fill_null(0),
    pl.col("fb_avg_items")   .cast(pl.Float64, strict=False).fill_null(0.0),
    pl.col("sms_orders")     .cast(pl.Int64,   strict=False).fill_null(0),
    pl.col("sms_items_sold") .cast(pl.Int64,   strict=False).fill_null(0),
    pl.col("coop_orders")    .cast(pl.Int64,   strict=False).fill_null(0),
    pl.col("coop_items_sold").cast(pl.Int64,   strict=False).fill_null(0),
])

# ── Step 2: calculated / derived columns ─────────────────────────────────────
full = full.with_columns([
    # Use direct Price column when available, fall back to turnover / sold
    pl.when(pl.col("price_raw") > 0)
        .then(pl.col("price_raw"))
        .when(pl.col("total_sold") > 0)
        .then((pl.col("turnover") / pl.col("total_sold")).round(2))
        .otherwise(0.0)
        .alias("price"),

    (pl.col("items_unsold") > 0).alias("in_stock"),

    # oversold: sold exceeds initial stock (stock > 0)
    ((pl.col("total_sold") > pl.col("initial_stock")) & (pl.col("initial_stock") > 0)).alias("oversold"),

    # has_emoji: true if title contains any emoji (U+1F000 and above)
    pl.col("title")
        .str.contains(r"[\U0001F000-\U0010FFFF]")
        .fill_null(False)
        .alias("has_emoji"),

    # Normalise is_variant to boolean
    pl.col("is_variant")
        .str.to_lowercase()
        .str.contains("true|yes|1|ja")
        .fill_null(False)
        .alias("is_variant"),

    pl.lit("").alias("image_url"),

    # ── Category from title + description keyword matching ────────────────
    pl.when(
        (pl.col("title").fill_null("") + " " + pl.col("description").fill_null(""))
        .str.to_lowercase()
        .str.contains(r"k\u00f8d|b\u00f8f|okse|kylling|bacon|fl\u00e6sk|kotelet|frikadel|kebab|roastbeef|pulled|svine|skink|fars|p\u00f8lse|slagter|hamburger|entrecote|ossobuco|laks|\bfisk\b|rejer|h\u00f8ns|and\b|ribeye|schnitz")
    ).then(pl.lit("K\u00f8d & Slagter"))
    .when(
        (pl.col("title").fill_null("") + " " + pl.col("description").fill_null(""))
        .str.to_lowercase()
        .str.contains(r"br\u00f8d|birkes|flute|bolle|wienerpekaner|snegl|bageri|franskbr\u00f8d|rugbr\u00f8d|kanelsnegl|croissant|grovbr\u00f8d|pita|tortilla|baguette")
    ).then(pl.lit("Bageri"))
    .when(
        (pl.col("title").fill_null("") + " " + pl.col("description").fill_null(""))
        .str.to_lowercase()
        .str.contains(r"\bost\b|danbo|m\u00e6lk|sm\u00f8r|\b\u00e6g\b|fl\u00f8de|ostehaps|arla|yoghurt|havarti|skyr|kvark|cremefraiche")
    ).then(pl.lit("Mejeri & Ost"))
    .when(
        (pl.col("title").fill_null("") + " " + pl.col("description").fill_null(""))
        .str.to_lowercase()
        .str.contains(r"\bvin\b|hvidvin|r\u00f8dvin|ros\u00e9|\b\u00f8l\b|sodavand|pellegrino|\bjuice\b|cider|\bkaffe\b|energidrik|drikkedunk|\bvand\b|staropramen|carlsberg|tuborg")
    ).then(pl.lit("Drikkevarer"))
    .when(
        (pl.col("title").fill_null("") + " " + pl.col("description").fill_null(""))
        .str.to_lowercase()
        .str.contains(r"\bis\b|magnum|t\u00e6rte|\bkage\b|dessert|chokolade|slik|wienbr\u00f8d|lagkage|milkshake|smoothie")
    ).then(pl.lit("Is & Dessert"))
    .when(
        (pl.col("title").fill_null("") + " " + pl.col("description").fill_null(""))
        .str.to_lowercase()
        .str.contains(r"ketchup|tomat|\bpasta\b|sauce|\bolie\b|d\u00e5se|krydderi|\bris\b|\bmel\b|konserves|mayonnaise|dressing|pesto|suppe|bouillon|nutella|marmelade")
    ).then(pl.lit("Kolonial"))
    .when(
        (pl.col("title").fill_null("") + " " + pl.col("description").fill_null(""))
        .str.to_lowercase()
        .str.contains(r"stegepande|\bgryde\b|\bkniv\b|rivejern|k\u00f8kkenrulle|\bpande\b|bestik|sk\u00e6rebr\u00e6t|opvask|reng\u00f8ring|neutral|s\u00e6be|vaskemiddel|skyllemiddel|opvaskemiddel")
    ).then(pl.lit("Non-food: K\u00f8kken & Hjem"))
    .when(
        (pl.col("title").fill_null("") + " " + pl.col("description").fill_null(""))
        .str.to_lowercase()
        .str.contains(r"sokker|\bplante\b|blomst|tulipan|leget\u00f8j|\bgave\b|\bt\u00f8j\b|\blampe\b|neon|\bpotte\b|monstera|bamse|dukke|teddybj\u00f8rn|accessori")
    ).then(pl.lit("Non-food: Gave & Andet"))
    .otherwise(pl.lit("Other"))
    .alias("category"),
])

# ── Cleaning #2: remove null/empty titles ────────────────────────────────────
before = len(full)
full = full.filter(
    pl.col("title").is_not_null() & (pl.col("title").str.strip_chars() != "")
)
print(f"  Removed {before - len(full):,} rows with null/empty title")

# ── Cleaning #3: remove placeholder stock > 500,000 ──────────────────────────
before = len(full)
full = full.filter(pl.col("initial_stock") <= 500_000)
print(f"  Removed {before - len(full):,} rows with placeholder stock > 500,000")

# ── Cleaning #3b: remove FaktaGermany (foreign test data) ────────────────────
before = len(full)
full = full.filter(
    pl.col("store_name").is_null() | ~pl.col("store_name").str.contains("FaktaGermany", literal=True)
)
print(f"  Removed {before - len(full):,} FaktaGermany rows")

# ── Cleaning #4: remove exact duplicate rows ─────────────────────────────────
before = len(full)
full = full.unique(keep="first")
print(f"  Removed {before - len(full):,} exact duplicate rows")

# ── Cleaning #5: remove rows without a valid date or store ───────────────────
before = len(full)
full = full.filter(
    pl.col("created_date").is_not_null() & pl.col("store_name").is_not_null()
)
print(f"  Removed {before - len(full):,} rows with null date or store")

# ── Final column selection & ordering ────────────────────────────────────────
full = full.select([
    "title", "description", "is_variant",
    "store_name", "kardex_id", "category",
    "created_date", "published_hour",
    "price", "turnover",
    "jatak_count", "total_sold", "total_orders",
    "initial_stock", "items_unsold", "in_stock", "oversold",
    "fb_orders", "fb_items_sold", "fb_picked_up", "fb_avg_items",
    "sms_orders", "sms_items_sold",
    "coop_orders", "coop_items_sold",
    "has_emoji", "image_url",
])

# Add unique row id
full = full.with_row_index("id")

print(f"\nFinal rows: {len(full):,}")
print(f"Columns:    {full.columns}")

full.write_parquet(OUT_PATH, compression="zstd")
size_mb = OUT_PATH.stat().st_size / 1e6
print(f"\nSaved → {OUT_PATH}  ({size_mb:.1f} MB)")
print("Done! Start the dashboard with:  .\\start.ps1")
