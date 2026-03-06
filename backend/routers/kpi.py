"""
/api/kpi  –  Master KPI endpoint for dashboard Overview page
"""
from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from database import get_conn
import re

router = APIRouter(prefix="/api/kpi", tags=["kpi"])

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


@router.get("")
def get_kpi(
    store:     Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to:   Optional[str] = Query(None),
):
    conn = get_conn()
    w = _where(store, date_from, date_to)

    row = conn.execute(f"""
        SELECT
            COUNT(*)                                                        AS total_offers,
            COALESCE(SUM(jatak_count), 0)                                   AS total_jatak,
            COALESCE(SUM(total_sold), 0)                                    AS total_sold,
            COALESCE(SUM(turnover), 0)                                      AS total_turnover,
            COALESCE(SUM(total_sold) * 1.0 / NULLIF(SUM(total_orders), 0), 0)       AS avg_basket_qty,
            COALESCE(SUM(total_sold * price) / NULLIF(SUM(total_orders), 0), 0)     AS avg_basket_value,
            COALESCE(SUM(fb_orders), 0)                                     AS fb_orders,
            COALESCE(SUM(sms_orders), 0)                                    AS sms_orders,
            COALESCE(SUM(coop_orders), 0)                                   AS coop_orders,
            COUNT(DISTINCT kardex_id)                                        AS total_stores
        FROM jatak
        {w}
    """).fetchone()

    if row is None:
        return {"total_offers": 0, "total_jatak": 0, "total_sold": 0,
                "total_turnover": 0, "avg_basket_qty": 0, "avg_basket_value": 0,
                "total_stores": 0, "fb_pct": 0, "sms_pct": 0, "coop_pct": 0,
                "fb_orders": 0, "sms_orders": 0, "coop_orders": 0}

    fb_o   = float(row[6] or 0)
    sms_o  = float(row[7] or 0)
    coop_o = float(row[8] or 0)
    total_ch = fb_o + sms_o + coop_o

    def pct(x):
        return round(x * 100.0 / total_ch, 1) if total_ch > 0 else 0.0

    return {
        "total_offers":    int(row[0]),
        "total_jatak":     int(row[1]),
        "total_sold":      int(row[2]),
        "total_turnover":    round(float(row[3] or 0), 0),
        "avg_basket_qty":    round(float(row[4] or 0), 2),
        "avg_basket_value":  round(float(row[5] or 0), 2),
        "total_stores":      int(row[9]),
        "fb_pct":          pct(fb_o),
        "sms_pct":         pct(sms_o),
        "coop_pct":        pct(coop_o),
        "fb_orders":       int(fb_o),
        "sms_orders":      int(sms_o),
        "coop_orders":     int(coop_o),
    }


@router.get("/stores")
def get_store_list():
    """All unique store names for the filter dropdown."""
    conn = get_conn()
    rows = conn.execute(
        "SELECT DISTINCT store_name FROM jatak WHERE store_name IS NOT NULL ORDER BY store_name"
    ).fetchall()
    return [r[0] for r in rows]


@router.get("/date-range")
def get_date_range():
    """Min / max date in the dataset for the date pickers."""
    conn = get_conn()
    row = conn.execute(
        "SELECT MIN(created_date)::VARCHAR, MAX(created_date)::VARCHAR FROM jatak"
    ).fetchone()
    return {"date_min": row[0], "date_max": row[1]}


@router.get("/yearly")
def get_yearly_kpi(store: Optional[str] = Query(None)):
    """KPI aggregated per year — used for 2024 vs 2025 comparison."""
    conn = get_conn()
    w = _where(store, None, None)

    rows = conn.execute(f"""
        SELECT
            YEAR(created_date)                                                    AS year,
            COUNT(*)                                                              AS total_offers,
            COALESCE(SUM(jatak_count), 0)                                        AS total_jatak,
            COALESCE(SUM(total_sold), 0)                                         AS total_sold,
            COALESCE(SUM(total_sold) * 1.0 / NULLIF(SUM(total_orders), 0), 0)   AS avg_basket_qty,
            COALESCE(SUM(total_sold * price) / NULLIF(SUM(total_orders), 0), 0) AS avg_basket_value,
            COALESCE(SUM(total_sold) * 100.0 / NULLIF(SUM(initial_stock), 0), 0) AS sell_through,
            COUNT(DISTINCT kardex_id)                                             AS total_stores,
            COALESCE(SUM(fb_orders), 0)                                          AS fb_orders,
            COALESCE(SUM(sms_orders), 0)                                         AS sms_orders,
            COALESCE(SUM(coop_orders), 0)                                        AS coop_orders
        FROM jatak
        {w}
        GROUP BY 1
        ORDER BY 1
    """).fetchall()

    result = []
    for r in rows:
        fb_o   = float(r[8] or 0)
        sms_o  = float(r[9] or 0)
        coop_o = float(r[10] or 0)
        total_ch = fb_o + sms_o + coop_o
        def pct(x): return round(x * 100.0 / total_ch, 1) if total_ch > 0 else 0.0
        result.append({
            "year":             int(r[0]),
            "total_offers":     int(r[1]),
            "total_jatak":      int(r[2]),
            "total_sold":       int(r[3]),
            "avg_basket_qty":   round(float(r[4] or 0), 2),
            "avg_basket_value": round(float(r[5] or 0), 2),
            "sell_through":     round(float(r[6] or 0), 1),
            "total_stores":     int(r[7]),
            "fb_pct":           pct(fb_o),
            "sms_pct":          pct(sms_o),
            "coop_pct":         pct(coop_o),
        })
    return result
