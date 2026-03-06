"""
/api/products  –  Top kategorier og produkter
"""
from fastapi import APIRouter, Query
from database import get_conn
from models.schemas import CategoryStat, ProductStat
from utils.cache import cached

router = APIRouter(prefix="/api/products", tags=["products"])


@cached(ttl=300)
def _fetch_categories(limit: int) -> list[dict]:
    conn = get_conn()
    rows = conn.execute(f"""
        SELECT
            category,
            COUNT(*)                             AS offer_count,
            SUM(jatak_count)                     AS total_jatak,
            ROUND(AVG(jatak_count), 1)           AS avg_jatak,
            ROUND(AVG(price), 2)                 AS avg_price
        FROM jatak
        GROUP BY category
        ORDER BY total_jatak DESC
        LIMIT {limit}
    """).fetchall()
    return [
        {"category": r[0], "offer_count": r[1], "total_jatak": r[2],
         "avg_jatak": r[3], "avg_price": r[4]}
        for r in rows
    ]


@cached(ttl=300)
def _fetch_top_products(limit: int, category: str | None) -> list[dict]:
    conn = get_conn()
    where = f"WHERE category = '{category}'" if category else ""
    rows = conn.execute(f"""
        SELECT
            title,
            store_name || ' #' || CAST(kardex_id AS VARCHAR)  AS store,
            category,
            SUM(jatak_count)                     AS total_jatak,
            ROUND(AVG(price), 2)                 AS avg_price,
            ROUND(AVG(CASE WHEN in_stock THEN 1.0 ELSE 0.0 END), 3) AS in_stock_ratio
        FROM jatak
        {where}
        GROUP BY title, store_name, kardex_id, category
        ORDER BY total_jatak DESC
        LIMIT {limit}
    """).fetchall()
    return [
        {"title": r[0], "store": r[1], "category": r[2],
         "total_jatak": r[3], "avg_price": r[4], "in_stock_ratio": r[5]}
        for r in rows
    ]


@router.get("/categories", response_model=list[CategoryStat])
def get_categories(limit: int = Query(15, ge=5, le=50)):
    return _fetch_categories(limit)


@router.get("/top", response_model=list[ProductStat])
def get_top_products(
    limit: int = Query(20, ge=5, le=100),
    category: str | None = Query(None),
):
    return _fetch_top_products(limit, category)
