"""
/api/overview  –  KPI summary cards
"""
from fastapi import APIRouter
from database import get_conn
from models.schemas import KPI
from utils.cache import cached

router = APIRouter(prefix="/api/overview", tags=["overview"])


@cached(ttl=300)
def _fetch_kpis() -> dict:
    conn = get_conn()
    row = conn.execute("""
        SELECT
            COUNT(*)                             AS total_offers,
            COUNT(DISTINCT kardex_id)            AS total_stores,
            SUM(jatak_count)                     AS total_jatak,
            AVG(jatak_count)                     AS avg_jatak,
            ROUND(AVG(price), 2)                 AS avg_price
        FROM jatak
    """).fetchone()

    top_cat = conn.execute("""
        SELECT category
        FROM jatak
        GROUP BY category
        ORDER BY SUM(jatak_count) DESC
        LIMIT 1
    """).fetchone()

    # month-over-month growth (last full month vs previous)
    growth = conn.execute("""
        WITH monthly AS (
            SELECT
                DATE_TRUNC('month', created_date) AS mo,
                COUNT(*) AS cnt
            FROM jatak
            GROUP BY 1
            ORDER BY 1 DESC
            LIMIT 2
        )
        SELECT
            (MAX(CASE WHEN rn=1 THEN cnt END) - MAX(CASE WHEN rn=2 THEN cnt END))
            * 100.0
            / NULLIF(MAX(CASE WHEN rn=2 THEN cnt END), 0)
        FROM (SELECT *, ROW_NUMBER() OVER () AS rn FROM monthly)
    """).fetchone()

    return {
        "total_offers": int(row[0]),
        "total_stores": int(row[1]),
        "total_jatak": int(row[2]),
        "avg_jatak_per_offer": round(float(row[3]), 1),
        "avg_price": round(float(row[4] or 0), 2),
        "top_category": top_cat[0] if top_cat else "–",
        "growth_pct": round(float(growth[0] or 0), 1),
    }


@router.get("", response_model=KPI)
def get_kpis():
    return _fetch_kpis()
