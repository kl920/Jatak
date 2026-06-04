# 17 – Deployment

## Current deployment: GitHub Pages

The live site is deployed as a **static build** to GitHub Pages.

### How it works

1. Backend runs locally → serves API at `localhost:8000`
2. `export_static.py` calls every API endpoint and saves responses as JSON files
3. Vite builds the frontend with `VITE_STATIC=true`:
   - Sets `base: '/Jatak/'`
   - Aliases `client.ts` → `client.static.ts`
4. `client.static.ts` reads data from `/Jatak/data/*.json` (no API calls)
5. `gh-pages` npm package deploys `dist/` to `gh-pages` branch

### Deploy commands

```powershell
.\start.ps1                                         # Start backend
python export_static.py                              # Export 48 JSON files
cd frontend
$env:VITE_STATIC = "true"; npm run build             # Static build
npx gh-pages -d dist --dotfiles --no-history         # Deploy
```

### Limitations

- AI Generator is disabled in static mode (no OpenAI calls without backend)
- Filters are ignored in static mode (data is pre-baked, not filtered live)
- Search only works for 10 pre-baked queries (kærnemælk, flæskesteg, etc.)

## Previous deployment: Render

A Dockerfile and `render.yaml` existed but were **removed during cleanup**. The project was briefly deployed to Render but pivoted to GitHub Pages to avoid hosting costs and data on external servers.

## No current infrastructure

| Component | Status |
|-----------|--------|
| Docker | Removed |
| CI/CD | None |
| NGINX | Not used |
| Gunicorn | Not used (Uvicorn only) |
| Cloud hosting | None (GitHub Pages only) |
| Database server | None (DuckDB is in-process) |
| Environment files | No `.env` file exists |
| SSL/TLS | GitHub Pages provides HTTPS automatically |

## Local development

| Service | Command | Port |
|---------|---------|------|
| Backend | `uvicorn main:app --port 8000` | 8000 |
| Frontend | `npm run dev` | 5173 |
| Combined | `.\start.ps1` | Both |

Vite dev server proxies `/api` → `localhost:8000` (configured in `vite.config.ts`).
