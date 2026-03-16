# Jatakportalen Dashboard 2026

Analytics dashboard for **680.000+ Ja Tak offers** from 549 Coop stores (2024–2026).  
Built with FastAPI + DuckDB + React + Tailwind CSS.

**Live demo:** [kl920.github.io/Jatak](https://kl920.github.io/Jatak/) (login: Coop / Jatak12+)

---

## Quick start

```powershell
cd C:\AI\Jatak
.\setup.ps1    # First time: creates venv, installs packages
.\start.ps1    # Starts backend + frontend, opens browser
```

- Frontend: **http://localhost:5173**
- API docs: **http://localhost:8000/docs**

---

## Tech stack

| Layer | Technology |
|---|---|
| Query engine | DuckDB 0.10 (columnar SQL on Parquet) |
| Backend API | FastAPI + Uvicorn, Python 3.12 |
| Frontend | React 18 + Vite 5 + Tailwind CSS 3 |
| Charts | Recharts 2 |
| Data fetching | TanStack React Query 5 |
| Language | TypeScript (frontend), Python (backend) |
| Deployment | GitHub Pages (static JSON) |
| Auth | HTTP Basic Auth (backend), client-side PasswordGate (GitHub Pages) |

---

## Dashboard pages

| Page | Route | Content |
|---|---|---|
| **Dashboard** | `/` | KPIs, weekly trend chart, channel split (FB/SMS/COOP), basket metrics |
| **Kategorier** | `/kategorier` | Category performance, price-bucket analysis |
| **Butiksudvikling** | `/butiksudvikling` | Store churn analysis, chain breakdown, weekly top 10, all-time top 20 |
| **Butiksunivers** | `/butiksunivers` | Inspiration for stores: top titles, search, seasonal trends, smart tips |
| **AI Ja Tak** | `/ai-jatak` | AI-powered offer text generator (requires OpenAI key + local backend) |

---

## Project structure

```
Jatak/
├── start.ps1                     Start backend + frontend
├── setup.ps1                     First-time setup (venv + npm install)
├── export_static.py              Export API → static JSON for GitHub Pages
│
├── backend/
│   ├── main.py                   FastAPI app + auth middleware
│   ├── database.py               DuckDB connection (thread-safe)
│   ├── requirements.txt
│   ├── data/
│   │   ├── jatak.parquet         680K rows, 139 MB (Git LFS)
│   │   ├── api_stores_list.xlsx  Official active store list
│   │   └── active_stores_list_2026.xlsx  2026 active stores (HK)
│   ├── models/
│   │   └── schemas.py            Pydantic models
│   └── routers/
│       ├── kpi.py                /api/kpi, /api/kpi/stores, /api/kpi/date-range
│       ├── trend.py              /api/trend/weekly
│       ├── stores.py             /api/stores/ranking
│       ├── categories.py         /api/categories/performance, /api/categories/pricepoints
│       ├── churn.py              /api/stores/churn/summary, /api/stores/churn/stores
│       ├── inspiration.py        /api/inspiration/top-titles, /seasonal, /tips, /search
│       └── ai_jatak.py           /api/ai/suggest, /api/ai/categories
│
└── frontend/
    └── src/
        ├── api/
        │   ├── client.ts              Live API client (Axios)
        │   └── client.static.ts       Static JSON client (GitHub Pages)
        ├── components/
        │   ├── layout/
        │   │   ├── Sidebar.tsx
        │   │   └── GlobalFilter.tsx
        │   └── PasswordGate.tsx        Client-side auth for GitHub Pages
        ├── context/
        │   └── FilterContext.tsx        Global filter state (store, date range)
        └── pages/
            ├── DashboardPage.tsx
            ├── CategoriesPage.tsx
            ├── ChurnPage.tsx
            ├── ButiksuniversPage.tsx
            └── AIJatakPage.tsx
```

---

## Key data concepts

| Field | Meaning |
|---|---|
| `jatak_count` | Number of customers who wrote "Ja Tak" in FB comments |
| `total_sold` | Actual items sold / picked up |
| `initial_stock` | Items allocated for the offer |
| `kardex_id` | Unique store identifier |
| `store_name` | Self-chosen name (can be misleading) |

---

## GitHub Pages deployment

The live site serves pre-baked static JSON (no backend required).

To update:

```powershell
.\start.ps1                                        # Start local backend
python export_static.py                             # Export 48 JSON files
cd frontend
$env:VITE_STATIC = "true"; npm run build            # Build with static client
npx gh-pages -d dist --dotfiles --no-history        # Deploy
```

---

## Known data notes

- **Date format:** Danish locale may give `DD/MM/YYYY` from date pickers. Handled by `toISODate()` in `client.ts`.
- **DuckDB thread-safety:** Solved with `threading.local()` in `database.py`.
- **Churn logic:** Compares 2025 active stores vs 2026 activity. Excel files provide official store list + HK classification.
