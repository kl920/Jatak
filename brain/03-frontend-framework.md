# 03 – Frontend Framework

## Framework

- **React 18.3.1** with **Vite 5.3.1** as build tool
- **TypeScript 5.4.5**
- **Single Page Application (SPA)**

## UI framework

- **Tailwind CSS 3.4.4** — utility-first, no component library
- All styling is inline Tailwind classes (no separate CSS modules)
- Dark theme only (`bg-slate-950`, `text-slate-100`)

## Data fetching

- **TanStack React Query 5.45.0** (`@tanstack/react-query`)
- `staleTime: 5 * 60 * 1000` (5 minutes) as global default
- No global error boundary for queries

## Routing

- **React Router DOM 6.23.1** (`react-router-dom`)
- 5 routes defined in `App.tsx`
- `BrowserRouter` with dynamic `basename` for GitHub Pages (`/Jatak/`)

## Charts

- **Recharts 2.12.7** — BarChart, PieChart, LineChart, ComposedChart
- All charts are inline in page components (no shared chart wrapper)

## Icons

- **Lucide React 0.395.0** — tree-shakable SVG icons

## Other libraries

| Library | Version | Purpose |
|---------|---------|---------|
| `axios` | 1.7.2 | HTTP client for live API |
| `clsx` | 2.1.1 | Conditional className builder |
| `date-fns` | 3.6.0 | Date utilities (imported but barely used) |

## State management

- **React Context** — single `FilterContext` for global store/date filters
- **No Redux, Zustand, or MobX**
- Each page manages its own local state via `useState`
- React Query handles all server state

## Build modes

| Mode | Trigger | Effect |
|------|---------|--------|
| **Development** | `npm run dev` | Vite dev server, proxies `/api` → `localhost:8000` |
| **Static build** | `VITE_STATIC=true npm run build` | Aliases `client.ts` → `client.static.ts`, sets `base: '/Jatak/'` |
| **Normal build** | `npm run build` | Standard build, expects live API backend |

## Key observations

- No test framework configured (no Jest, Vitest, or Playwright)
- No ESLint config file in repo
- No Storybook
- Pages are large monolithic files (ChurnPage: 500+ lines, ButiksuniversPage: 600+ lines)
- `date-fns` is a dependency but barely used — could be removed
