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
            "total_turnover": round(float(r[5] or 0), 0),
        }
        for r in rows
    ]


@router.get("/list")
def get_stores_list(
    date_from: Optional[str] = Query(None),
    date_to:   Optional[str] = Query(None),
):
    """List all stores (kardex_id + chain) that have offers in the selected period."""
    conn = get_conn()
    w = _where(None, date_from, date_to)
    
    rows = conn.execute(f"""
        SELECT DISTINCT
            kardex_id,
            REPLACE(store_name, ' Hovedkontor', '') AS chain
        FROM jatak
        {w}
        ORDER BY chain, kardex_id
    """).fetchall()
    
    return [
        {"kardex_id": int(r[0]), "chain": r[1], "label": f"{r[1]} #{r[0]}"}
        for r in rows
    ]


@router.get("/overview")
def get_store_overview(
    kardex_id: int          = Query(...),
    date_from: Optional[str] = Query(None),
    date_to:   Optional[str] = Query(None),
):
    """Complete overview dashboard for a single store."""
    conn = get_conn()
    date_from = _norm(date_from)
    date_to   = _norm(date_to)
    
    # Build WHERE clause for this store
    clauses = [f"kardex_id = {kardex_id}"]
    if date_from:
        clauses.append(f"created_date >= '{date_from}'")
    if date_to:
        clauses.append(f"created_date <= '{date_to}'")
    w_store = "WHERE " + " AND ".join(clauses)
    
    # For chain comparison, use same date filter
    w_chain = ""
    if date_from or date_to:
        w_chain = "WHERE " + " AND ".join(
            [f"created_date >= '{date_from}'" if date_from else "",
             f"created_date <= '{date_to}'" if date_to else ""]
        ).replace("  ", " ").strip()
    
    # Store stats
    store_row = conn.execute(f"""
        SELECT
            REPLACE(store_name, ' Hovedkontor', '') AS chain,
            COUNT(*) AS offer_count,
            COALESCE(AVG(jatak_count), 0) AS avg_jatak,
            COALESCE(SUM(total_sold) * 100.0 / NULLIF(SUM(initial_stock), 0), 0) AS sell_through_pct,
            COALESCE(SUM(jatak_count), 0) AS total_jatak,
            COALESCE(SUM(total_sold), 0) AS total_sold,
            COALESCE(SUM(price * total_sold), 0) AS total_turnover
        FROM jatak
        {w_store}
        GROUP BY store_name
    """).fetchone()
    
    if not store_row:
        raise HTTPException(404, f"Ingen data for butik {kardex_id} i perioden")
    
    chain, offer_count, avg_jatak, sell_through_pct, total_jatak, total_sold, total_turnover = store_row
    
    # Chain averages (same chain only)
    chain_clauses = [f"REPLACE(store_name, ' Hovedkontor', '') = '{chain}'"]
    if date_from:
        chain_clauses.append(f"created_date >= '{date_from}'")
    if date_to:
        chain_clauses.append(f"created_date <= '{date_to}'")
    w_same_chain = "WHERE " + " AND ".join(chain_clauses)
    
    chain_row = conn.execute(f"""
        SELECT
            COALESCE(AVG(avg_jatak), 0) AS chain_avg_jatak,
            COALESCE(AVG(sell_through_pct), 0) AS chain_avg_sellthrough,
            COALESCE(AVG(offer_count_per_store), 0) AS chain_avg_offers,
            COALESCE(AVG(turnover_per_store), 0) AS chain_avg_turnover
        FROM (
            SELECT 
                kardex_id,
                AVG(jatak_count) as avg_jatak,
                COUNT(*) as offer_count_per_store,
                SUM(price * total_sold) as turnover_per_store,
                SUM(total_sold) * 100.0 / NULLIF(SUM(initial_stock), 0) as sell_through_pct
            FROM jatak
            {w_same_chain}
            GROUP BY kardex_id
        )
    """).fetchone()
    
    chain_avg_jatak, chain_avg_sellthrough, chain_avg_offers, chain_avg_turnover = chain_row
    
    # Store ranking (percentile)
    rank_row = conn.execute(f"""
        WITH store_scores AS (
            SELECT
                kardex_id,
                AVG(jatak_count) AS avg_jatak
            FROM jatak
            {w_chain}
            GROUP BY kardex_id
        )
        SELECT
            PERCENT_RANK() OVER (ORDER BY avg_jatak) AS percentile
        FROM store_scores
        WHERE kardex_id = {kardex_id}
    """).fetchone()
    
    percentile = (1.0 - float(rank_row[0] or 0)) * 100 if rank_row else 50.0
    
    # Overall score (simple weighted formula)
    jatak_score = min((avg_jatak / max(chain_avg_jatak, 1)) * 5, 5)
    sellthrough_score = min((sell_through_pct / max(chain_avg_sellthrough, 1)) * 3, 3)
    offer_score = min((offer_count / 30.0) * 2, 2)  # 30 offers/month = full score
    overall_score = jatak_score + sellthrough_score + offer_score
    
    # Top 10% benchmark
    top10_row = conn.execute(f"""
        WITH store_avgs AS (
            SELECT AVG(jatak_count) AS avg_jatak
            FROM jatak
            {w_chain}
            GROUP BY kardex_id
        )
        SELECT PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY avg_jatak) AS top10_jatak
        FROM store_avgs
    """).fetchone()
    
    top10_avg_jatak = float(top10_row[0] or 0) if top10_row else 0
    
    return {
        "store": {
            "kardex_id": kardex_id,
            "chain": chain,
            "period": {"from": date_from, "to": date_to}
        },
        "kpis": {
            "total_offers": int(offer_count),
            "avg_jatak": round(float(avg_jatak), 1),
            "sell_through_pct": round(float(sell_through_pct), 1),
            "overall_score": round(float(overall_score), 1),
            "ranking_pct": round(percentile, 0),
            "total_jatak": int(total_jatak),
            "total_turnover": round(float(total_turnover), 0),
            "total_sold": int(total_sold)
        },
        "comparison": {
            "jatak_vs_chain": round(float(avg_jatak - chain_avg_jatak), 1),
            "sellthrough_vs_chain": round(float(sell_through_pct - chain_avg_sellthrough), 1)
        },
        "benchmark": {
            "chain_avg_jatak": round(float(chain_avg_jatak), 1),
            "chain_avg_sellthrough": round(float(chain_avg_sellthrough), 1),
            "chain_avg_offers": round(float(chain_avg_offers), 1),
            "chain_avg_turnover": round(float(chain_avg_turnover), 0),
            "top10_avg_jatak": round(float(top10_avg_jatak), 1)
        }
    }


@router.get("/{kardex_id}/top-offers")
def get_top_offers(
    kardex_id: int,
    limit:     int          = Query(5, ge=1, le=20),
    date_from: Optional[str] = Query(None),
    date_to:   Optional[str] = Query(None),
):
    """Top offers for a specific store by Ja Tak count."""
    conn = get_conn()
    date_from = _norm(date_from)
    date_to   = _norm(date_to)
    
    clauses = [f"kardex_id = {kardex_id}"]
    if date_from:
        clauses.append(f"created_date >= '{date_from}'")
    if date_to:
        clauses.append(f"created_date <= '{date_to}'")
    w = "WHERE " + " AND ".join(clauses)
    
    rows = conn.execute(f"""
        SELECT
            title,
            category,
            jatak_count,
            total_sold,
            COALESCE(total_sold * 100.0 / NULLIF(initial_stock, 0), 0) AS sell_through_pct,
            price,
            created_date
        FROM jatak
        {w}
        ORDER BY jatak_count DESC
        LIMIT {limit}
    """).fetchall()
    
    return [
        {
            "title": r[0],
            "category": r[1] or "Andet",
            "jatak_count": int(r[2] or 0),
            "total_sold": int(r[3] or 0),
            "sell_through_pct": round(float(r[4]), 1),
            "price": round(float(r[5] or 0), 2),
            "created_date": str(r[6])
        }
        for r in rows
    ]


@router.get("/{kardex_id}/category-performance")
def get_category_performance(
    kardex_id: int,
    date_from: Optional[str] = Query(None),
    date_to:   Optional[str] = Query(None),
):
    """Category performance comparison vs. chain average."""
    conn = get_conn()
    date_from = _norm(date_from)
    date_to   = _norm(date_to)
    
    # Store categories
    clauses = [f"kardex_id = {kardex_id}"]
    if date_from:
        clauses.append(f"created_date >= '{date_from}'")
    if date_to:
        clauses.append(f"created_date <= '{date_to}'")
    w_store = "WHERE " + " AND ".join(clauses)
    
    # Chain filter
    w_chain = ""
    if date_from or date_to:
        filters = []
        if date_from:
            filters.append(f"created_date >= '{date_from}'")
        if date_to:
            filters.append(f"created_date <= '{date_to}'")
        w_chain = "WHERE " + " AND ".join(filters)
    
    store_cats = conn.execute(f"""
        SELECT
            COALESCE(category, 'Andet') AS category,
            COUNT(*) AS offer_count,
            AVG(jatak_count) AS avg_jatak
        FROM jatak
        {w_store}
        GROUP BY category
    """).fetchall()
    
    # Chain averages per category
    chain_cats = conn.execute(f"""
        SELECT
            COALESCE(category, 'Andet') AS category,
            AVG(jatak_count) AS chain_avg_jatak
        FROM jatak
        {w_chain}
        GROUP BY category
    """).fetchall()
    
    chain_dict = {r[0]: float(r[1] or 0) for r in chain_cats}
    
    result = []
    for cat, offer_count, avg_jatak in store_cats:
        chain_avg = chain_dict.get(cat, 0)
        diff_pct = ((avg_jatak - chain_avg) / chain_avg * 100) if chain_avg > 0 else 0
        
        # Percentile within this category
        percentile_row = conn.execute(f"""
            WITH cat_scores AS (
                SELECT
                    kardex_id,
                    AVG(jatak_count) AS avg_jatak
                FROM jatak
                WHERE COALESCE(category, 'Andet') = '{cat.replace("'", "''")}'
                    {' AND ' + ' AND '.join(clauses[1:]) if len(clauses) > 1 else ''}
                GROUP BY kardex_id
            )
            SELECT PERCENT_RANK() OVER (ORDER BY avg_jatak) AS pct
            FROM cat_scores
            WHERE kardex_id = {kardex_id}
        """).fetchone()
        
        percentile = (1.0 - float(percentile_row[0] or 0)) * 100 if percentile_row else 50.0
        
        # Status classification
        if percentile >= 80:
            status = "top"
        elif percentile >= 40:
            status = "average"
        else:
            status = "below"
        
        result.append({
            "category": cat,
            "offer_count": int(offer_count),
            "avg_jatak": round(float(avg_jatak), 1),
            "chain_avg_jatak": round(chain_avg, 1),
            "diff_pct": round(diff_pct, 1),
            "percentile": round(percentile, 0),
            "status": status
        })
    
    return sorted(result, key=lambda x: x["percentile"], reverse=True)


@router.get("/{kardex_id}/insights")
def get_store_insights(
    kardex_id: int,
    date_from: Optional[str] = Query(None),
    date_to:   Optional[str] = Query(None),
):
    """Auto-generated insights: strengths and improvement areas."""
    conn = get_conn()
    date_from = _norm(date_from)
    date_to   = _norm(date_to)
    
    # Use category performance data
    cat_perf = get_category_performance(kardex_id, date_from, date_to)
    
    strengths = []
    improvements = []
    
    # Category insights
    for cat in cat_perf[:3]:  # Top 3
        if cat["status"] == "top" and cat["diff_pct"] > 10:
            strengths.append({
                "text": f"{cat['category']}-tilbud klarer sig {abs(cat['diff_pct']):.0f}% bedre end gennemsnittet",
                "category": cat["category"]
            })
    
    # Timing insight (best performing hour)
    clauses = [f"kardex_id = {kardex_id}"]
    if date_from:
        clauses.append(f"created_date >= '{date_from}'")
    if date_to:
        clauses.append(f"created_date <= '{date_to}'")
    w = "WHERE " + " AND ".join(clauses)
    best_hour = conn.execute(f"""
        SELECT
            published_hour,
            AVG(jatak_count) AS avg_jatak
        FROM jatak
        {w}
        GROUP BY published_hour
        ORDER BY avg_jatak DESC
        LIMIT 1
    """).fetchone()
    
    if best_hour and best_hour[1] > 0:
        hour = int(best_hour[0])
        avg_jatak_at_hour = float(best_hour[1])
        overall_avg = conn.execute(f"""
            SELECT AVG(jatak_count) FROM jatak {w}
        """).fetchone()[0]
        
        if avg_jatak_at_hour > overall_avg * 1.2:
            diff_pct = ((avg_jatak_at_hour - overall_avg) / overall_avg * 100)
            strengths.append({
                "text": f"Tilbud oprettet kl. {hour}:00-{hour+1}:00 får {diff_pct:.0f}% flere Ja Tak",
                "metric": "timing"
            })
    
    return {
        "strengths": strengths[:4],  # Max 4
        "improvements": []  # Skjult per brugerønsker
    }



