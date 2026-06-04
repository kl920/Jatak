# 00 – Project Overview

## What is this?

**Jatakportalen** is an analytics dashboard for Coop Denmark's "Ja Tak" programme.

Customers write "Ja Tak" (Danish for "Yes Please") in Facebook comments on store posts to claim promotional offers. This system **collects, analyses, and visualises** data from 680,000+ such offers across 549 Coop stores (2024–2026).

## Who is it for?

- **Coop Marketing** — campaign performance, category insights, churn analysis
- **Store managers** — inspiration for better-performing offer titles
- **AI-assisted copywriting** — generate offer texts using GPT-4o

## What does it do?

| Page | Purpose |
|------|---------|
| Dashboard (`/`) | KPIs, weekly trend, channel split (Facebook / SMS / Coop app) |
| Kategorier (`/kategorier`) | Category performance, price-bucket breakdown |
| Butiksudvikling (`/butiksudvikling`) | Store churn 2025→2026, chain breakdown, top 10/20 stores |
| Butiksunivers (`/butiksunivers`) | Inspiration: top titles, search 680K offers, seasonal trends, tips |
| AI Ja Tak (`/ai-jatak`) | GPT-4o offer generator (user provides their own OpenAI key) |

## Live deployment

- **URL:** https://kl920.github.io/Jatak/
- **Login:** `Coop` / `Jatak12+`
- **Method:** Static JSON pre-baked from API → GitHub Pages (no live backend)

## Repo

- **GitHub:** https://github.com/kl920/Jatak (private)
- **Branch `main`:** source code
- **Branch `gh-pages`:** built static site

## Key metrics in the data

| Field | Meaning |
|-------|---------|
| `jatak_count` | Number of customers who wrote "Ja Tak" in Facebook comments |
| `total_sold` | Actual items sold / picked up |
| `initial_stock` | Items allocated for the offer |
| `kardex_id` | Unique physical store identifier |
| `store_name` | Self-chosen chain name (can be misleading) |
| `turnover` | `price × total_sold` |

## Languages

- Backend: **Python** (Danish variable names in some places, comments mostly Danish)
- Frontend: **TypeScript** (UI labels all Danish)
- Documentation: Mixed Danish/English
