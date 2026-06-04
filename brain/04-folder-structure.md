# 04 – Folder Structure

```
Jatak/
│
├── .gitattributes               # Git LFS for *.parquet
├── .gitignore                   # Python, Node, DuckDB, OS ignores
├── README.md                    # Project documentation
├── start.ps1                    # Start backend + frontend
├── setup.ps1                    # First-time setup (venv, pip, npm)
├── export_static.py             # Export all API endpoints → static JSON
│
├── backend/
│   ├── main.py                  # FastAPI app + auth middleware + static serving
│   ├── database.py              # DuckDB thread-safe connection manager
│   ├── check.py                 # Quick CLI sanity check for parquet data
│   ├── requirements.txt         # Python dependencies (12 packages)
│   │
│   ├── data/
│   │   ├── jatak.parquet        # 680K rows, 139 MB (Git LFS tracked)
│   │   ├── api_stores_list.xlsx # Official active store list
│   │   ├── active_stores_list_2026.xlsx  # 2026 active stores (HK classification)
│   │   └── seed.py              # Test data generator (2M rows, not production data)
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py           # Pydantic models (mostly unused)
│   │
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── kpi.py               # /api/kpi, /api/kpi/stores, /api/kpi/date-range
│   │   ├── trend.py             # /api/trend/weekly
│   │   ├── stores.py            # /api/stores/ranking
│   │   ├── categories.py        # /api/categories/performance, /pricepoints
│   │   ├── churn.py             # /api/stores/churn/summary, /stores
│   │   ├── inspiration.py       # /api/inspiration/* (5 endpoints)
│   │   └── ai_jatak.py          # /api/ai/suggest, /ai/categories
│   │
│   └── utils/
│       ├── __init__.py
│       └── cache.py             # TTL in-memory cache decorator (unused)
│
├── frontend/
│   ├── index.html               # HTML entry (Vite inserts scripts)
│   ├── package.json             # Node dependencies
│   ├── vite.config.ts           # Vite config (proxy, static alias, base path)
│   ├── tsconfig.json            # TypeScript config
│   ├── tsconfig.node.json       # Node-side TS config for Vite
│   ├── tailwind.config.js       # Tailwind CSS config
│   ├── postcss.config.js        # PostCSS → Tailwind + Autoprefixer
│   │
│   └── src/
│       ├── main.tsx             # React entry point (React Query, BrowserRouter)
│       ├── App.tsx              # Routes + PasswordGate wrapper
│       ├── index.css            # Tailwind directives + base styles
│       ├── vite-env.d.ts        # Vite types reference
│       │
│       ├── api/
│       │   ├── client.ts        # Live API client (Axios, 30+ exported functions)
│       │   └── client.static.ts # Static JSON client (GitHub Pages fallback)
│       │
│       ├── components/
│       │   ├── PasswordGate.tsx  # Client-side username/password gate
│       │   └── layout/
│       │       ├── Sidebar.tsx   # Fixed left sidebar with nav links
│       │       └── GlobalFilter.tsx # Store picker + date range + year tabs
│       │
│       ├── context/
│       │   └── FilterContext.tsx # Global filter state (store, date_from, date_to)
│       │
│       └── pages/
│           ├── DashboardPage.tsx      # KPIs, channel pie, trend charts (~230 lines)
│           ├── CategoriesPage.tsx     # Category bars, price buckets (~260 lines)
│           ├── ChurnPage.tsx          # Churn KPIs, chain accordion, rankings (~500 lines)
│           ├── ButiksuniversPage.tsx   # Search, tips, top titles, seasonal (~600 lines)
│           └── AIJatakPage.tsx         # AI generator form, results (~570 lines)
│
└── data/                        # Empty directory (previously held Excel files)
```

## Key observations

- `backend/models/schemas.py` defines Pydantic models that are **largely unused** — endpoints return plain dicts
- `backend/utils/cache.py` defines a `@cached` decorator that is **imported by no file**
- `backend/data/seed.py` generates **test data** (2M rows), not the actual production data
- `frontend/src/components/charts/` directory exists but is **empty**
- No `__pycache__/` is committed (properly gitignored)
