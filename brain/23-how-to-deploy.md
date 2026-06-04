# 23 – How to Deploy

## Current deployment: GitHub Pages (static)

The dashboard is deployed as a **fully static site** on GitHub Pages. There is no live backend — all API responses are pre-baked into JSON files at build time.

**Live URL:** https://kl920.github.io/Jatak/

## Deployment flow

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────┐     ┌──────────────┐
│ Start backend│ ──▶ │ export_static.py │ ──▶ │ Vite build  │ ──▶ │ gh-pages     │
│ (port 8000)  │     │ fetches 48 JSON  │     │ VITE_STATIC │     │ push to GH   │
└──────────────┘     └──────────────────┘     └─────────────┘     └──────────────┘
```

### Step by step

#### 1. Start the backend

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn main:app --port 8000
```

#### 2. Export static API data

```powershell
cd frontend
python export_static.py
```

This fetches all 48 API endpoints (with Basic Auth `Coop:Jatak12+`) and saves JSON files to:

```
frontend/public/api/
├── overview.json
├── kpi.json
├── kpi/store-ranking.json
├── trend/monthly.json
├── trend/weekday.json
├── ...
└── inspiration/seasonal.json
```

#### 3. Build the static frontend

```powershell
$env:VITE_STATIC="true"; npm run build
```

The `VITE_STATIC=true` flag makes the frontend read from `/api/*.json` files instead of calling the live backend. Build output goes to `frontend/dist/`.

#### 4. Fix .gitignore in dist

The `dist/` folder needs a `.gitignore` override so that the `api/` subfolder is included:

```
# Already handled by export_static.py which copies files,
# but verify dist/api/ exists with all JSON files
```

A `.nojekyll` file must exist in `dist/` to prevent GitHub Pages from ignoring files starting with underscore.

#### 5. Push to GitHub Pages

```powershell
npx gh-pages -d dist --dotfiles --no-history
```

- `--dotfiles` includes `.nojekyll` and `.gitignore`
- `--no-history` force-pushes a single commit (keeps the `gh-pages` branch clean)

## What the static build changes

| Feature | Live (dev) | Static (deployed) |
|---------|------------|-------------------|
| API calls | `fetch("http://localhost:8000/api/...")` | `fetch("/Jatak/api/...json")` |
| Auth | HTTP Basic Auth on every request | None (public JSON files) |
| AI Generator | Works (calls OpenAI) | **Disabled** (no backend) |
| Filters | Update API calls with params | **All data pre-fetched** (no filtering) |
| Base path | `/` | `/Jatak/` (Vite `base` config) |

## Static client detection

`client.ts` checks `import.meta.env.VITE_STATIC`. If truthy, it imports `client.static.ts` which maps each API path to a static JSON file path under `/Jatak/api/`.

## Previous deployment (removed)

A `render.yaml` file previously existed for deploying to Render.com as a live backend+frontend service. This was removed — GitHub Pages is the only active deployment.

## Alternative: deploy with live backend

To serve the dashboard with a live backend (enabling filters and AI):

1. Deploy `backend/` as a Python web service (Render, Railway, etc.)
2. Set `OPENAI_API_KEY` as an environment variable
3. Build frontend without `VITE_STATIC` and configure `VITE_API_URL` to point to the backend
4. Deploy `frontend/dist/` to any static host

This path is **not currently set up** — it would require new code for `VITE_API_URL` handling.
