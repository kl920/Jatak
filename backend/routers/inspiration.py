"""
/api/inspiration  –  Butiksunivers: top titles, seasonal categories, data tips.

Endpoints:
  GET /api/inspiration/top-titles?category=X&limit=15&min_uses=2
  GET /api/inspiration/seasonal?month=3
  GET /api/inspiration/tips
  GET /api/inspiration/categories
"""
from __future__ import annotations

from datetime import date
from fastapi import APIRouter, Query
from database import get_conn

router = APIRouter(prefix="/api/inspiration", tags=["inspiration"])


# ── /top-titles ──────────────────────────────────────────────────────────────

@router.get("/top-titles")
def top_titles(
    category: str  = Query(...),
    limit:    int  = Query(15),
    min_uses: int  = Query(2),
):
    """
    Top performing offer titles in a category, ranked by avg jatak_count.
    Groups identical titles so patterns used by multiple stores float to the top.
    """
    conn = get_conn()
    safe_cat = category.replace("'", "''")

    rows = conn.execute(f"""
        SELECT
            TRIM(title)                AS clean_title,
            ROUND(AVG(jatak_count), 1) AS avg_jatak,
            COUNT(*)                   AS use_count,
            ROUND(AVG(price), 0)       AS avg_price,
            BOOL_OR(has_emoji)         AS has_emoji,
            ANY_VALUE(description)     AS sample_desc
        FROM jatak
        WHERE category = '{safe_cat}'
          AND title IS NOT NULL
          AND LENGTH(TRIM(title)) > 3
          AND jatak_count > 0
        GROUP BY TRIM(title)
        HAVING COUNT(*) >= ?
        ORDER BY avg_jatak DESC
        LIMIT ?
    """, [min_uses, limit]).fetchall()

    return [
        {
            "rank":               i + 1,
            "title":              r[0],
            "avg_jatak":          float(r[1]),
            "use_count":          int(r[2]),
            "avg_price":          float(r[3] or 0),
            "has_emoji":          bool(r[4]),
            "sample_description": (r[5] or "").split("\n")[0].strip()[:200],
        }
        for i, r in enumerate(rows)
    ]


# ── /seasonal ────────────────────────────────────────────────────────────────

@router.get("/seasonal")
def seasonal(
    month: int = Query(default=None),
):
    """
    Category ranking for a given calendar month, based on all historical data.
    Defaults to current month.
    """
    if month is None:
        month = date.today().month

    conn = get_conn()

    total_row = conn.execute("""
        SELECT COUNT(*) FROM jatak
        WHERE EXTRACT(MONTH FROM created_date) = ?
          AND category != 'Other'
          AND category IS NOT NULL
          AND jatak_count > 0
    """, [month]).fetchone()
    total_month = int(total_row[0]) if total_row and total_row[0] else 1

    rows = conn.execute("""
        SELECT
            category,
            ROUND(AVG(jatak_count), 1) AS avg_jatak,
            COUNT(*)                   AS offer_count,
            ROUND(AVG(price), 0)       AS avg_price,
            COUNT(DISTINCT kardex_id)  AS unique_stores
        FROM jatak
        WHERE EXTRACT(MONTH FROM created_date) = ?
          AND category != 'Other'
          AND category IS NOT NULL
          AND jatak_count > 0
        GROUP BY category
        HAVING COUNT(*) >= 20
        ORDER BY avg_jatak DESC
        LIMIT 8
    """, [month]).fetchall()

    return [
        {
            "rank":          i + 1,
            "category":      r[0],
            "avg_jatak":     float(r[1]),
            "offer_count":   int(r[2]),
            "avg_price":     float(r[3] or 0),
            "unique_stores": int(r[4]),
            "pct_of_total":  round(int(r[2]) / total_month * 100, 1),
        }
        for i, r in enumerate(rows)
    ]


# ── /tips ────────────────────────────────────────────────────────────────────

@router.get("/tips")
def tips():
    """
    Data-backed actionable tips computed from aggregate statistics.
    Used for the 'smart tips' section in Butiksunivers.
    """
    conn = get_conn()

    # Emoji effect
    e = conn.execute("""
        SELECT
            ROUND(AVG(CASE WHEN has_emoji     THEN jatak_count END), 1),
            ROUND(AVG(CASE WHEN NOT has_emoji THEN jatak_count END), 1)
        FROM jatak WHERE jatak_count > 0
    """).fetchone()

    # Publish time: morning (6-9) vs midday (11-14)
    pt = conn.execute("""
        SELECT
            ROUND(AVG(CASE WHEN published_hour BETWEEN 6  AND 9  THEN jatak_count END), 1),
            ROUND(AVG(CASE WHEN published_hour BETWEEN 11 AND 14 THEN jatak_count END), 1)
        FROM jatak WHERE jatak_count > 0 AND published_hour IS NOT NULL
    """).fetchone()

    # Price buckets
    b = conn.execute("""
        SELECT
            ROUND(AVG(CASE WHEN price > 0   AND price < 50   THEN jatak_count END), 1),
            ROUND(AVG(CASE WHEN price >= 50 AND price < 100  THEN jatak_count END), 1),
            ROUND(AVG(CASE WHEN price >= 100                 THEN jatak_count END), 1)
        FROM jatak WHERE jatak_count > 0
    """).fetchone()

    # Top 3 categories by avg jatak
    cats = conn.execute("""
        SELECT category, ROUND(AVG(jatak_count), 1) AS avg_j
        FROM jatak
        WHERE category != 'Other' AND jatak_count > 0
        GROUP BY category
        HAVING COUNT(*) >= 50
        ORDER BY avg_j DESC
        LIMIT 3
    """).fetchall()

    with_emoji    = float(e[0] or 0)
    without_emoji = float(e[1] or 0)
    morning_avg   = float(pt[0] or 0)
    midday_avg    = float(pt[1] or 0)

    return {
        "emoji": {
            "with":       with_emoji,
            "without":    without_emoji,
            "delta_pct":  round((with_emoji - without_emoji) / max(without_emoji, 1) * 100, 1),
        },
        "publish_time": {
            "morning":    morning_avg,
            "midday":     midday_avg,
            "delta_pct":  round((morning_avg - midday_avg) / max(midday_avg, 1) * 100, 1),
        },
        "price_bucket": {
            "under_50":  float(b[0] or 0),
            "50_to_100": float(b[1] or 0),
            "over_100":  float(b[2] or 0),
        },
        "top_categories": [
            {"category": r[0], "avg_jatak": float(r[1])}
            for r in cats
        ],
    }


# ── /categories ──────────────────────────────────────────────────────────────

@router.get("/categories")
def categories():
    """List of distinct categories (excluding 'Other'), sorted alphabetically."""
    conn = get_conn()
    rows = conn.execute("""
        SELECT DISTINCT category
        FROM jatak
        WHERE category IS NOT NULL AND category != 'Other'
        ORDER BY category
    """).fetchall()
    return [r[0] for r in rows]


# ── /search ───────────────────────────────────────────────────────────────────

@router.get("/search")
def search_offers(
    q:     str = Query(..., min_length=2),
    limit: int = Query(10),
):
    """
    Full-text search on title (case-insensitive).
    Returns best-performing matching offers ranked by jatak_count DESC.
    """
    conn = get_conn()
    rows = conn.execute("""
        SELECT
            TRIM(title)                        AS title,
            description,
            category,
            jatak_count,
            total_sold,
            initial_stock,
            items_unsold,
            ROUND(price, 0)                    AS price,
            store_name,
            CAST(created_date AS VARCHAR)      AS created_date
        FROM jatak
        WHERE LOWER(title) LIKE LOWER(CONCAT('%', ?, '%'))
          AND title IS NOT NULL
          AND LENGTH(TRIM(title)) > 2
          AND jatak_count > 0
        ORDER BY jatak_count DESC
        LIMIT ?
    """, [q, limit]).fetchall()
    return [
        {
            "title":         r[0],
            "description":   r[1] or "",
            "category":      r[2] or "",
            "jatak_count":   int(r[3]),
            "total_sold":    int(r[4] or 0),
            "initial_stock": int(r[5] or 0),
            "items_unsold":  int(r[6] or 0),
            "price":         float(r[7] or 0),
            "store_name":    r[8] or "",
            "created_date":  r[9] or "",
        }
        for r in rows
    ]
