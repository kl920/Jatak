"""
/api/trend  –  Weekly trend data for the Trend page
"""
from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from database import get_conn
import re

router = APIRouter(prefix="/api/trend", tags=["trend"])

_ISO = re.compile(r'^\d{4}-\d{2}-\d{2}$')
_DDM = re.compile(r'^(\d{1,2})/(\d{1,2})/(\d{4})$')

def _norm(d: Optional[str]) -> Optional[str]:
    if not d: return d
    if _ISO.match(d): return d
    m = _DDM.match(d)
    if m:
        day, mon, yr = m.groups()
        return f"{yr}-{mon.zfill(2)}-{day.zfill(2)}"
    raise HTTPException(422, f"Ukendt datoformat: {d!r}")


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


@router.get("/weekly")
def get_weekly_trend(
    store:     Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to:   Optional[str] = Query(None),
):
    conn = get_conn()
    w = _where(store, date_from, date_to)

    rows = conn.execute(f"""
        SELECT
            strftime(DATE_TRUNC('week', created_date), '%Y-%m-%d')          AS week_start,
            COUNT(*)                                                         AS offer_count,
            COALESCE(SUM(jatak_count), 0)                                   AS total_jatak,
            COALESCE(AVG(jatak_count), 0)                                   AS avg_jatak,
            COALESCE(
                SUM(total_sold) * 1.0 / NULLIF(SUM(total_orders), 0), 0
            )                                                                AS avg_order_size,
            COALESCE(SUM(total_sold) * 100.0 / NULLIF(SUM(initial_stock), 0), 0) AS sell_through,
            COUNT(DISTINCT kardex_id)                                             AS active_stores
        FROM jatak
        {w}
        GROUP BY 1
        ORDER BY 1
    """).fetchall()

    result = [
        {
            "week_start":    r[0],
            "offer_count":   int(r[1]),
            "total_jatak":   int(r[2]),
            "avg_jatak":     round(float(r[3]), 1),
            "avg_order_size":  round(float(r[4] or 0), 2),
            "sell_through":   round(float(r[5] or 0), 1),
            "active_stores":  int(r[6]),
        }
        for r in rows
    ]

    # Tag top-3 weeks by total_jatak
    if result:
        sorted_by_jatak = sorted(result, key=lambda x: x["total_jatak"], reverse=True)
        top3 = {r["week_start"] for r in sorted_by_jatak[:3]}
        for r in result:
            r["is_top3"] = r["week_start"] in top3

    return result


@router.get("/monthly")
def get_monthly_trend(
    store:     Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to:   Optional[str] = Query(None),
):
    """Monthly trend — used for year-over-year comparison charts."""
    conn = get_conn()
    w = _where(store, date_from, date_to)

    rows = conn.execute(f"""
        SELECT
            strftime(DATE_TRUNC('month', created_date), '%Y-%m')             AS month,
            YEAR(created_date)                                               AS year,
            MONTH(created_date)                                              AS month_num,
            COUNT(*)                                                         AS offer_count,
            COALESCE(SUM(jatak_count), 0)                                   AS total_jatak,
            COALESCE(AVG(jatak_count), 0)                                   AS avg_jatak,
            COALESCE(
                SUM(total_sold) * 100.0 / NULLIF(SUM(initial_stock), 0), 0
            )                                                                AS sell_through,
            COUNT(DISTINCT kardex_id)                                        AS active_stores,
            COALESCE(AVG(total_sold * price), 0)                            AS avg_revenue
        FROM jatak
        {w}
        GROUP BY 1, 2, 3
        ORDER BY 1
    """).fetchall()

    return [
        {
            "month":         r[0],
            "year":          int(r[1]),
            "month_num":     int(r[2]),
            "offer_count":   int(r[3]),
            "total_jatak":   int(r[4]),
            "avg_jatak":     round(float(r[5]), 1),
            "sell_through":  round(float(r[6] or 0), 1),
            "active_stores": int(r[7]),
            "avg_revenue":   round(float(r[8] or 0), 0),
        }
        for r in rows
    ]
