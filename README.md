# Jatakportalen Dashboard 2026

Management dashboard over **47.002 Ja Tak-tilbud** fra 453 Coop-butikker i 2026.  
Bygget med FastAPI + DuckDB + React + Tailwind CSS.

---

## Hurtig start

```powershell
powershell -ExecutionPolicy Bypass -File START.ps1
```

Åbn **http://localhost:5173** i browseren.  
API docs: **http://localhost:8000/docs**

---

## Tech stack

| Lag | Teknologi |
|---|---|
| Query engine | DuckDB 0.10 (kolonnebaseret SQL på Parquet) |
| Backend API | FastAPI + Uvicorn, Python 3.12 |
| Frontend | React 18 + Vite 5 + Tailwind CSS 3 |
| Grafer | Recharts 2 |
| Data fetching | TanStack Query 5 |
| Sprog | TypeScript (frontend), Python (backend) |

---

## Dashboard-sider

| Side | URL | Indhold |
|---|---|---|
| **KPI Oversigt** | `/` | 6 KPI-kort, Gns. kurvværdi-ring, kanal-fordeling (FB/SMS/COOP) |
| **Ugentlig Trend** | `/trend` | Tilbud & Ja Tak pr. uge, top-3 uger, aktive butikker, salgsprocent |
| **Butik Benchmark** | `/butikker` | Top 20 butikker (kardex-niveau), publiceringstidspunkt-heatmap |
| **Kategorier** | `/kategorier` | Kategori-performance, prisbrønd-analyse, avg. omsætning pr. tilbud |

---

## KPI-definitioner

| Metric | Formel | Forklaring |
|---|---|---|
| Ja Tak | `SUM(jatak_count)` | Antal Ja Tak-tilsagn |
| Solgte varer | `SUM(total_sold)` | Faktisk solgte stk |
| Gns. kurv (stk) | `SUM(total_sold) / SUM(total_orders)` | Stk pr. ordre |
| Gns. kurvværdi | `SUM(total_sold × price) / SUM(total_orders)` | Kr pr. ordre |
| Avg. omsætning | `AVG(total_sold × price)` | Pr. tilbud (kategorisiden) |
| Aktive butikker | `COUNT(DISTINCT kardex_id)` | Unikke butikker pr. uge |

> **OBS:** `turnover`-kolonnen i rådata er upålidelig (kun 4.6% af rækker matcher `price × orders`).  
> Alle omsætningsberegninger bruger `total_sold × price` i stedet.

---

## Projektstruktur

```
Jatak/
├── START.ps1                    ← Start alt herfra
├── backend/
│   ├── main.py                  FastAPI app
│   ├── database.py              DuckDB (thread-safe, threading.local)
│   ├── requirements.txt
│   ├── data/
│   │   └── jatak.parquet        47.002 rækker, 2026-data
│   └── routers/
│       ├── kpi.py               /api/kpi, /api/kpi/stores, /api/kpi/date-range
│       ├── trend.py             /api/trend/weekly
│       ├── stores.py            /api/stores/ranking, /api/stores/heatmap
│       └── categories.py        /api/categories/performance, /api/categories/pricepoints
└── frontend/
    └── src/
        ├── api/client.ts        Axios + TypeScript-interfaces + date-normalisering
        ├── context/FilterContext.tsx   Global filter (kæde + datointerval)
        ├── components/layout/
        │   ├── Sidebar.tsx
        │   └── GlobalFilter.tsx
        └── pages/
            ├── KPIPage.tsx
            ├── TrendPage.tsx
            ├── StoresPage.tsx
            └── CategoriesPage.tsx
```

---

## Kendte dataforhold

- **Datoformat:** Windows dansk locale kan give `DD/MM/YYYY` fra datovælger.  
  Håndteres af `toISODate()` i `client.ts` (frontend) og `_norm()` i alle routere (backend).
- **DuckDB thread-safety:** Løst med `threading.local()` i `database.py` — hver request-tråd får sin egen forbindelse.
- **Pris-outliers:** 1 række med pris 13.000 kr (sandsynlig fejl), men negligibel effekt på gennemsnit.
- **total_sold max:** 10.878 stk på én runde — reelt edge case, ikke fjernet.


---

## Tech Stack

| Lag | Teknologi | Hvorfor |
|---|---|---|
| **Query engine** | DuckDB | Kolonnebaseret, vektoriseret SQL direkte på Parquet – 2M rækker på under 1 sek. |
| **Data format** | Apache Parquet + ZSTD | 5-10× komprimering ift. CSV, DuckDB læser kun de kolonner der efterspørges |
| **Backend API** | FastAPI + Uvicorn | Asynkron, type-sikker, auto-genererede Swagger/OpenAPI docs |
| **Caching** | In-memory TTL-cache | Dashboard-kald rammes hyppigt; resultater caches i 5 min. |
| **Frontend** | React 18 + Vite | HMR under udvikling, lynhurtigt build |
| **Styling** | Tailwind CSS | Utility-first – intet CSS-bloat |
| **Grafer** | Recharts | Let, deklarativt, fuld kontrol over farver og stil |
| **State/data** | TanStack Query | Automatisk caching, re-fetch og loading-states |

---

## Projekt-struktur

```
Jatak/
├── backend/
│   ├── main.py               FastAPI app
│   ├── database.py           DuckDB forbindelseshåndtering
│   ├── requirements.txt
│   ├── routers/
│   │   ├── overview.py       KPI-kort
│   │   ├── market.py         Markedsudvikling over tid
│   │   ├── products.py       Top kategorier & produkter
│   │   └── correlation.py    Tekst/format korrelationer
│   ├── models/schemas.py     Pydantic-modeller
│   ├── utils/cache.py        TTL in-memory cache
│   └── data/
│       ├── seed.py           Genererer 2M realistiske testrækker
│       └── jatak.parquet     (auto-genereret)
│
├── frontend/
│   ├── src/
│   │   ├── api/client.ts     Axios-klient + TypeScript-typer
│   │   ├── components/
│   │   │   ├── layout/Sidebar.tsx
│   │   │   └── charts/
│   │   │       ├── KPICards.tsx
│   │   │       ├── MarketGrowthChart.tsx
│   │   │       ├── TopCategoriesChart.tsx
│   │   │       └── CorrelationChart.tsx
│   │   ├── pages/
│   │   │   ├── OverviewPage.tsx
│   │   │   ├── MarketPage.tsx
│   │   │   ├── ProductsPage.tsx
│   │   │   └── CorrelationPage.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── tailwind.config.js
│   └── vite.config.ts        Proxy /api → localhost:8000
│
├── setup.ps1                 Installer alt + generer testdata
└── start.ps1                 Start backend + frontend
```

---

## Hurtig start

### 1. Forudsætninger
- Python 3.11+
- Node.js 20+

### 2. Setup (kun én gang)
```powershell
.\setup.ps1
```
Dette:
- Opretter Python venv og installerer backend-pakker
- Genererer `jatak.parquet` med 2.000.000 realistiske testrækker (~150 MB, tager ~60 sek.)
- Installerer npm-pakker til frontend

### 3. Start
```powershell
.\start.ps1
```
Åbn **http://localhost:5173** i din browser.

---

## Brug med rigtig data

Erstat `backend/data/jatak.parquet` med din rigtige Parquet-fil.  
Kolonne-navne den forventer:

| Kolonne | Type | Eksempel |
|---|---|---|
| `id` | INTEGER | 1234 |
| `created_date` | DATE | 2024-03-15 |
| `store_name` | VARCHAR | "ABC Handel ApS" |
| `category` | VARCHAR | "Elektronik" |
| `title` | VARCHAR | "iPhone 14 billig" |
| `description` | VARCHAR | "God stand, sælges da..." |
| `price` | DOUBLE | 1299.00 |
| `jatak_count` | INTEGER | 47 |
| `in_stock` | BOOLEAN | true |
| `image_url` | VARCHAR | "https://..." |

---

## API dokumentation
Swagger UI: **http://localhost:8000/docs**

## Dashboard sider
| Side | URL | Indhold |
|---|---|---|
| Overblik | `/` | KPI-kort, månedsgraf, top kategorier, 4× korrelationsøjeblikke |
| Markedsudvikling | `/marked` | Interaktiv tidsseriegraf med dag/uge/måned-granularitet |
| Produkter | `/produkter` | Kategorioversigt + filtrerbar top-20 produkttabel |
| Korrelation | `/korrelation` | 4 akser: tekstlængde, titellængde, pris, billede |
