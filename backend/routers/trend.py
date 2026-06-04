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
            COUNT(DISTINCT kardex_id)                                        AS active_stores
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
            "active_stores":  int(r[4]),
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


@router.get("/test")
def test_endpoint():
    """Simple test endpoint."""
    return {"status": "test endpoint works"}


@router.get("/stores-inactive")
def get_inactive_stores(
    date_from: Optional[str] = Query(None),
    date_to:   Optional[str] = Query(None),
):
    """
    Butikker uden aktivitet i 90+ eller 180+ dage inden for valgt periode.
    
    Query params:
    - date_from: Start dato for periode (YYYY-MM-DD eller DD/MM/YYYY)
    - date_to: Slut dato for periode (YYYY-MM-DD eller DD/MM/YYYY)
    
    Returnerer:
    - inactive_90d: Butikker uden tilbud i 90+ dage (count + liste)
    - inactive_180d: Butikker uden tilbud i 180+ dage (count + liste)
    
    For hver butik:
    - kardex_id: Unikt butiks-ID
    - store_name: Butiksnavn
    - last_active_date: Seneste tilbud oprettet
    - days_inactive: Antal dage uden aktivitet
    - historical_offers: Historisk antal tilbud
    - avg_jatak: Gennemsnitligt engagement historisk
    """
    conn = get_conn()
    date_from = _norm(date_from)
    date_to = _norm(date_to)
    
    # Build WHERE clause for the period filter
    period_filter = ""
    if date_from and date_to:
        period_filter = f"WHERE created_date BETWEEN '{date_from}' AND '{date_to}'"
    elif date_from:
        period_filter = f"WHERE created_date >= '{date_from}'"
    elif date_to:
        period_filter = f"WHERE created_date <= '{date_to}'"
    
    # Get last activity date for each store within the filtered period
    query = f"""
        WITH store_activity AS (
            SELECT 
                kardex_id,
                store_name,
                MAX(created_date) AS last_active_date,
                COUNT(*) AS historical_offers,
                COALESCE(AVG(jatak_count), 0) AS avg_jatak
            FROM jatak
            {period_filter}
            GROUP BY kardex_id, store_name
        ),
        dataset_max AS (
            SELECT MAX(created_date) AS max_date FROM jatak {period_filter}
        ),
        store_with_inactivity AS (
            SELECT 
                sa.kardex_id,
                sa.store_name,
                sa.last_active_date,
                sa.historical_offers,
                sa.avg_jatak,
                CAST(DATE_DIFF('day', sa.last_active_date::DATE, (SELECT max_date FROM dataset_max)::DATE) AS INT) AS days_inactive
            FROM store_activity sa
        )
        SELECT 
            kardex_id,
            store_name,
            last_active_date,
            historical_offers,
            avg_jatak,
            days_inactive
        FROM store_with_inactivity
        WHERE days_inactive >= 90
        ORDER BY days_inactive DESC, historical_offers DESC
    """
    
    rows = conn.execute(query).fetchall()
    
    inactive_90 = []
    inactive_180 = []
    
    for r in rows:
        store_data = {
            "kardex_id": str(r[0]),
            "store_name": r[1],
            "last_active_date": r[2],
            "days_inactive": int(r[5]),
            "historical_offers": int(r[3]),
            "avg_jatak": round(float(r[4]), 1),
        }
        
        if r[5] >= 180:
            inactive_180.append(store_data)
        if r[5] >= 90:
            inactive_90.append(store_data)
    
    return {
        "inactive_90d": {
            "count": len(inactive_90),
            "stores": inactive_90[:50],  # Limit to top 50 for performance
        },
        "inactive_180d": {
            "count": len(inactive_180),
            "stores": inactive_180[:50],
        },
    }



