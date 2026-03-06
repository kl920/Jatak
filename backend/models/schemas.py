from pydantic import BaseModel
from typing import Optional


class MarketPoint(BaseModel):
    date: str
    store_count: int
    offer_count: int
    total_jatak: int


class CategoryStat(BaseModel):
    category: str
    offer_count: int
    total_jatak: int
    avg_jatak: float
    avg_price: float


class ProductStat(BaseModel):
    title: str
    store: str
    category: str
    total_jatak: int
    avg_price: float
    in_stock_ratio: float


class CorrelationPoint(BaseModel):
    bucket: str
    avg_jatak: float
    offer_count: int


class KPI(BaseModel):
    total_offers: int
    total_stores: int
    total_jatak: int
    avg_jatak_per_offer: float
    avg_price: float
    top_category: str
    growth_pct: float  # month-over-month growth
