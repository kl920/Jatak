"""
Jatak Dashboard – FastAPI Backend
Run:  uvicorn main:app --reload --port 8000
"""
import os
import secrets
import base64
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, FileResponse
from fastapi.staticfiles import StaticFiles

from routers import kpi, trend, stores, categories, ai_jatak, inspiration, churn

# ── Auth config ────────────────────────────────────────────────────────────────
AUTH_USER = os.getenv("AUTH_USER", "Coop")
AUTH_PASS = os.getenv("AUTH_PASS", "Jatak12+")

app = FastAPI(
    title="Jatakportalen Dashboard API",
    version="1.0.0",
    description="Analytisk API til 2M+ Ja Tak-tilbud fra Facebook",
)

# ── HTTP Basic Auth middleware ─────────────────────────────────────────────────
@app.middleware("http")
async def basic_auth_middleware(request: Request, call_next):
    # Health check is public (for uptime monitors)
    if request.url.path == "/health":
        return await call_next(request)

    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Basic "):
        try:
            decoded = base64.b64decode(auth_header[6:]).decode()
            username, password = decoded.split(":", 1)
            if (secrets.compare_digest(username, AUTH_USER)
                    and secrets.compare_digest(password, AUTH_PASS)):
                return await call_next(request)
        except Exception:
            pass

    return Response(
        content="Unauthorized",
        status_code=401,
        headers={"WWW-Authenticate": 'Basic realm="Jatakportalen"'},
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(kpi.router)
app.include_router(trend.router)
app.include_router(stores.router)
app.include_router(categories.router)
app.include_router(ai_jatak.router)
app.include_router(inspiration.router)
app.include_router(churn.router)


@app.get("/health")
def health():
    return {"status": "ok"}


# ── Serve built frontend (production) ─────────────────────────────────────────
DIST_DIR = Path(__file__).resolve().parent / "static"

if DIST_DIR.exists():
    # Serve /assets (JS, CSS, images)
    app.mount("/assets", StaticFiles(directory=DIST_DIR / "assets"), name="spa-assets")

    @app.get("/{path:path}")
    async def spa_fallback(path: str):
        """Serve static files or fall back to index.html for SPA routing."""
        file = (DIST_DIR / path).resolve()
        if file.is_relative_to(DIST_DIR) and file.is_file():
            return FileResponse(file)
        return FileResponse(DIST_DIR / "index.html")
