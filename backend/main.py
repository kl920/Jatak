"""
Jatak Dashboard – FastAPI Backend
Run:  uvicorn main:app --reload --port 8000
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import overview, market, products, correlation, kpi, trend, stores, categories, ai_jatak, inspiration

app = FastAPI(
    title="Jatakportalen Dashboard API",
    version="1.0.0",
    description="Analytisk API til 2M+ Ja Tak-tilbud fra Facebook",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Legacy routers
app.include_router(overview.router)
app.include_router(market.router)
app.include_router(products.router)
app.include_router(correlation.router)

# New dashboard routers
app.include_router(kpi.router)
app.include_router(trend.router)
app.include_router(stores.router)
app.include_router(categories.router)
app.include_router(ai_jatak.router)
app.include_router(inspiration.router)


@app.get("/health")
def health():
    return {"status": "ok"}
