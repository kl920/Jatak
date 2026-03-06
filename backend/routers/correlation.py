"""
/api/correlation  –  Korrelation mellem tekst/format og Ja Tak-svar
"""
from fastapi import APIRouter, Query
from database import get_conn
from models.schemas import CorrelationPoint
from utils.cache import cached

router = APIRouter(prefix="/api/correlation", tags=["correlation"])


@cached(ttl=300)
def _fetch_text_length() -> list[dict]:
    """Buckets offers by description length and calculates avg. Ja Tak."""
    conn = get_conn()
    rows = conn.execute("""
        SELECT
            CASE
                WHEN LENGTH(description) < 50   THEN '0-49 chars'
                WHEN LENGTH(description) < 100  THEN '50-99 chars'
                WHEN LENGTH(description) < 150  THEN '100-149 chars'
                WHEN LENGTH(description) < 250  THEN '150-249 chars'
                WHEN LENGTH(description) < 400  THEN '250-399 chars'
                ELSE '400+ chars'
            END                                  AS bucket,
            ROUND(AVG(jatak_count), 1)           AS avg_jatak,
            COUNT(*)                             AS offer_count
        FROM jatak
        GROUP BY 1
        ORDER BY MIN(LENGTH(description))
    """).fetchall()
    return [{"bucket": r[0], "avg_jatak": r[1], "offer_count": r[2]} for r in rows]


@cached(ttl=300)
def _fetch_has_price() -> list[dict]:
    """Compare offers with and without an explicit price."""
    conn = get_conn()
    rows = conn.execute("""
        SELECT
            CASE WHEN price > 0 THEN 'With price' ELSE 'No price' END AS bucket,
            ROUND(AVG(jatak_count), 1)                               AS avg_jatak,
            COUNT(*)                                                  AS offer_count
        FROM jatak
        GROUP BY 1
    """).fetchall()
    return [{"bucket": r[0], "avg_jatak": r[1], "offer_count": r[2]} for r in rows]


@cached(ttl=300)
def _fetch_has_image() -> list[dict]:
    """Offers with vs. without an image URL."""
    conn = get_conn()
    rows = conn.execute("""
        SELECT
            CASE WHEN image_url IS NOT NULL AND image_url != '' THEN 'With image' ELSE 'No image' END AS bucket,
            ROUND(AVG(jatak_count), 1)  AS avg_jatak,
            COUNT(*)                    AS offer_count
        FROM jatak
        GROUP BY 1
    """).fetchall()
    return [{"bucket": r[0], "avg_jatak": r[1], "offer_count": r[2]} for r in rows]


@cached(ttl=300)
def _fetch_title_length() -> list[dict]:
    """Buckets on title character count."""
    conn = get_conn()
    rows = conn.execute("""
        SELECT
            CASE
                WHEN LENGTH(title) < 20  THEN '< 20 chars'
                WHEN LENGTH(title) < 40  THEN '20-39 chars'
                WHEN LENGTH(title) < 60  THEN '40-59 chars'
                ELSE '60+ chars'
            END                              AS bucket,
            ROUND(AVG(jatak_count), 1)       AS avg_jatak,
            COUNT(*)                         AS offer_count
        FROM jatak
        GROUP BY 1
        ORDER BY MIN(LENGTH(title))
    """).fetchall()
    return [{"bucket": r[0], "avg_jatak": r[1], "offer_count": r[2]} for r in rows]


@router.get("/text-length", response_model=list[CorrelationPoint])
def text_length():
    return _fetch_text_length()


@router.get("/title-length", response_model=list[CorrelationPoint])
def title_length():
    return _fetch_title_length()


@router.get("/has-price", response_model=list[CorrelationPoint])
def has_price():
    return _fetch_has_price()


@router.get("/has-image", response_model=list[CorrelationPoint])
def has_image():
    return _fetch_has_image()


@cached(ttl=300)
def _fetch_has_emoji() -> list[dict]:
    """Compare offers with vs. without emojis in the title."""
    conn = get_conn()
    rows = conn.execute("""
        SELECT
            CASE WHEN has_emoji THEN 'With emoji' ELSE 'No emoji' END AS bucket,
            ROUND(AVG(jatak_count), 1)  AS avg_jatak,
            COUNT(*)                    AS offer_count
        FROM jatak
        GROUP BY 1
    """).fetchall()
    return [{"bucket": r[0], "avg_jatak": r[1], "offer_count": r[2]} for r in rows]


@router.get("/has-emoji", response_model=list[CorrelationPoint])
def has_emoji():
    return _fetch_has_emoji()
