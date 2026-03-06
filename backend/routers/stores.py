"""
/api/stores  –  Store benchmark endpoints
"""
from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from database import get_conn
import re

router = APIRouter(prefix="/api/stores", tags=["stores"])

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


@router.get("/ranking")
def get_store_ranking(
    limit:     int          = Query(20, ge=1, le=100),
    date_from: Optional[str] = Query(None),
    date_to:   Optional[str] = Query(None),
):
    """Top individual stores (kardex level) by total Ja Tak count.
    store_name is the chain (e.g. 'Kvickly Hovedkontor'); kardex_id is the
    unique identifier for each physical store.  We label each bar as
    '<ShortChain> #<kardex_id>' so the chart is readable.
    """
    conn = get_conn()
    w = _where(None, date_from, date_to)

    rows = conn.execute(f"""
        SELECT
            kardex_id,
            REPLACE(store_name, ' Hovedkontor', '') AS chain,
            COUNT(*)                                                              AS offer_count,
            COALESCE(SUM(jatak_count), 0)                                        AS total_jatak,
            COALESCE(AVG(jatak_count), 0)                                        AS avg_jatak,
            COALESCE(SUM(total_sold) * 100.0 / NULLIF(SUM(initial_stock), 0), 0) AS sell_through,
            COALESCE(SUM(turnover), 0)                                            AS total_turnover
        FROM jatak
        {w}
        GROUP BY kardex_id, store_name
        ORDER BY total_jatak DESC
        LIMIT {limit}
    """).fetchall()

    return [
        {
            "kardex_id":      str(r[0]),
            "chain":          r[1],
            "label":          f"{r[1]} #{r[0]}",
            "offer_count":    int(r[2]),
            "total_jatak":    int(r[3]),
            "avg_jatak":      round(float(r[4]), 1),
            "sell_through":   round(float(r[5] or 0), 1),
            "total_turnover": round(float(r[6] or 0), 0),
        }
        for r in rows
    ]


@router.get("/heatmap")
def get_hour_heatmap(
    date_from: Optional[str] = Query(None),
    date_to:   Optional[str] = Query(None),
):
    """Average Ja Tak per published hour (0–23)."""
    conn = get_conn()
    w = _where(None, date_from, date_to)

    rows = conn.execute(f"""
        SELECT
            published_hour,
            COUNT(*)                        AS offer_count,
            COALESCE(AVG(jatak_count), 0)  AS avg_jatak,
            COALESCE(SUM(jatak_count), 0)  AS total_jatak
        FROM jatak
        {w}
        GROUP BY published_hour
        ORDER BY published_hour
    """).fetchall()

    # Fill all 24 hours even if no data
    data = {r[0]: {"offer_count": int(r[1]), "avg_jatak": round(float(r[2]), 1), "total_jatak": int(r[3])} for r in rows}
    return [
        {
            "hour":        h,
            "offer_count": data.get(h, {}).get("offer_count", 0),
            "avg_jatak":   data.get(h, {}).get("avg_jatak", 0.0),
            "total_jatak": data.get(h, {}).get("total_jatak", 0),
        }
        for h in range(24)
    ]
