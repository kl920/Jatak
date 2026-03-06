"""
/api/categories  –  Category & price-point analysis
"""
from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from database import get_conn
import re

router = APIRouter(prefix="/api/categories", tags=["categories"])

_ISO = re.compile(r'^\d{4}-\d{2}-\d{2}$')
_DDM = re.compile(r'^(\d{1,2})/(\d{1,2})/(\d{4})$')

def _norm(d: Optional[str]) -> Optional[str]:
    """Accept YYYY-MM-DD or DD/MM/YYYY, always return YYYY-MM-DD."""
    if not d:
        return d
    if _ISO.match(d):
        return d
    m = _DDM.match(d)
    if m:
        day, mon, yr = m.groups()
        return f"{yr}-{mon.zfill(2)}-{day.zfill(2)}"
    raise HTTPException(422, f"Ukendt datoformat: {d!r} – brug YYYY-MM-DD")


def _where(store: Optional[str], date_from: Optional[str], date_to: Optional[str]) -> str:
    date_from = _norm(date_from)
    date_to   = _norm(date_to)
    clauses = []
    if store:
        safe = store.replace("'", "''")
        clauses.append(f"store_name = '{safe}'")
    if date_from:
        clauses.append(f"created_date >= '{date_from}'")
    if date_to:
        clauses.append(f"created_date <= '{date_to}'")
    return ("WHERE " + " AND ".join(clauses)) if clauses else ""


@router.get("/performance")
def get_category_performance(
    store:     Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to:   Optional[str] = Query(None),
):
    """Category performance: avg_jatak, sell-through, offer count."""
    conn = get_conn()
    w = _where(store, date_from, date_to)

    rows = conn.execute(f"""
        SELECT
            category,
            COUNT(*)                                                              AS offer_count,
            COALESCE(SUM(jatak_count), 0)                                        AS total_jatak,
            COALESCE(AVG(jatak_count), 0)                                        AS avg_jatak,
            COALESCE(AVG(price), 0)                                              AS avg_price,
            COALESCE(AVG(total_sold * price), 0)                                AS avg_revenue
        FROM jatak
        {w}
        GROUP BY category
        ORDER BY avg_jatak DESC
    """).fetchall()

    return [
        {
            "category":    r[0],
            "offer_count": int(r[1]),
            "total_jatak": int(r[2]),
            "avg_jatak":   round(float(r[3]), 1),
            "avg_price":   round(float(r[4] or 0), 1),
            "avg_revenue": round(float(r[5] or 0), 0),
        }
        for r in rows
    ]


@router.get("/pricepoints")
def get_price_points(
    store:     Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to:   Optional[str] = Query(None),
):
    """Price bucket analysis vs Ja Tak and sell-through."""
    conn = get_conn()
    w = _where(store, date_from, date_to)

    rows = conn.execute(f"""
        WITH bucketed AS (
            SELECT
                CASE
                    WHEN price < 50              THEN '< 50 kr'
                    WHEN price < 100             THEN '50-100 kr'
                    WHEN price < 250             THEN '100-250 kr'
                    ELSE                              '250+ kr'
                END AS bucket,
                CASE
                    WHEN price < 50              THEN 1
                    WHEN price < 100             THEN 2
                    WHEN price < 250             THEN 3
                    ELSE                              4
                END AS sort_order,
                jatak_count,
                price,
                total_sold
            FROM jatak
            {w}
            WHERE price > 0
        )
        SELECT
            bucket,
            sort_order,
            COUNT(*)                                                               AS offer_count,
            COALESCE(AVG(jatak_count), 0)                                         AS avg_jatak,
            COALESCE(AVG(price), 0)                                               AS avg_price,
            COALESCE(AVG(total_sold * price), 0)                                  AS avg_revenue
        FROM bucketed
        GROUP BY bucket, sort_order
        ORDER BY sort_order
    """).fetchall()

    return [
        {
            "bucket":      r[0],
            "offer_count": int(r[2]),
            "avg_jatak":   round(float(r[3]), 1),
            "avg_price":   round(float(r[4] or 0), 1),
            "avg_revenue": round(float(r[5] or 0), 0),
        }
        for r in rows
    ]
