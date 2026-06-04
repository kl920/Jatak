# 20 – Performance Review

## Backend performance

### DuckDB query speed

DuckDB processes 680K Parquet rows in **~20-100ms per query**. This is extremely fast for analytical workloads. No performance issues at current data size.

### Thread model

Uvicorn runs a single process with multi-threading. Each thread gets its own DuckDB connection (via `threading.local()`). At typical dashboard traffic (few concurrent users), this is fine.

### Potential bottleneck: AI endpoint

`POST /api/ai/suggest` calls OpenAI GPT-4o synchronously. This takes **5-15 seconds** and blocks the thread. Under concurrent load, this could exhaust the thread pool.

**Fix:** Make the endpoint truly async (it already uses `async def` but calls `OpenAI()` synchronously).

### Unused cache

`utils/cache.py` implements a TTL-based cache decorator, but **no endpoint uses it**. For queries that never change (the data is a static Parquet file), caching would provide zero benefit anyway — DuckDB is already fast.

### Churn endpoint

`/api/stores/churn/summary` is the most expensive endpoint:
- 3 separate DuckDB queries + Excel file reading
- Excel files are cached in module-level globals (loaded once)
- Still executes in <500ms typically

## Frontend performance

### Bundle size

| Concern | Assessment |
|---------|-----------|
| Recharts | ~300 KB min+gzip — largest dep, but only loaded once |
| Lucide React | Tree-shakes well — only imported icons are bundled |
| Axios | ~14 KB — reasonable |
| date-fns | Imported but unused — dead weight |
| Tailwind | Purged in production — only used classes remain |

### Render performance

| Issue | Location | Severity |
|-------|----------|----------|
| Large monolithic pages | ChurnPage (500 lines), ButiksuniversPage (600 lines) | Low — React handles this fine |
| Charts on initial load | DashboardPage loads 2 charts immediately | Low — data is small |
| No code splitting | All pages loaded eagerly (no `React.lazy()`) | Low — total bundle is small |
| No virtualisation | Store lists render all rows | Low — max ~100 items |

### React Query caching

- `staleTime: 5 min` global default — good for static data
- Some queries use `staleTime: Infinity` (store list, categories) — appropriate
- Churn and AI data also use 5-min stale time

### Missing optimisations

| Optimization | Status |
|-------------|--------|
| `React.lazy()` + `Suspense` | Not used — would help if bundle grows |
| `useMemo` on chart data | Partially used — `scoreChecks` in AIJatakPage |
| `useCallback` | Not used (not needed at current scale) |
| Image lazy loading | No images in the dashboard |
| Service worker / PWA | Not configured |

## Static site performance

On GitHub Pages:
- 48 JSON files loaded on-demand per page
- No pre-loading of data for other pages
- GitHub CDN handles global distribution
- Total data size: ~2-5 MB across all JSON files

## Recommendations

1. **Low priority:** Remove `date-fns` dep (unused, saves ~10KB)
2. **Low priority:** Add `React.lazy()` for page routes if bundle size grows
3. **Medium priority:** Make AI endpoint properly async to avoid thread blocking
4. **No action needed:** DuckDB performance is excellent — no query optimization required
