"""
/api/market  –  Markedsudvikling over tid
"""
from fastapi import APIRouter, Query
from database import get_conn
from models.schemas import MarketPoint
from utils.cache import cached

router = APIRouter(prefix="/api/market", tags=["market"])


@cached(ttl=300)
def _fetch_market(granularity: str) -> list[dict]:
    conn = get_conn()
    trunc = {
        "day":   "DATE_TRUNC('day',   created_date)",
        "week":  "DATE_TRUNC('week',  created_date)",
        "month": "DATE_TRUNC('month', created_date)",
    }.get(granularity, "DATE_TRUNC('month', created_date)")

    rows = conn.execute(f"""
        SELECT
            CAST({trunc} AS VARCHAR)         AS date,
            COUNT(DISTINCT kardex_id)        AS store_count,
            COUNT(*)                         AS offer_count,
            COALESCE(SUM(jatak_count), 0)    AS total_jatak
        FROM jatak
        GROUP BY 1
        ORDER BY 1
    """).fetchall()

    return [
        {"date": r[0], "store_count": r[1], "offer_count": r[2], "total_jatak": r[3]}
        for r in rows
    ]


@router.get("", response_model=list[MarketPoint])
def get_market(
    granularity: str = Query("month", pattern="^(day|week|month)$"),
):
    return _fetch_market(granularity)
