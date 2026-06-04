# 21 – Technical Debt

## Critical debt

### 1. SQL injection risk — string interpolation instead of parameterised queries

**Files:** `kpi.py`, `trend.py`, `stores.py`, `categories.py`, `inspiration.py`, `churn.py`

All user input is interpolated into SQL via f-strings with only `replace("'", "''")` escaping. Should use DuckDB parameterised queries (`conn.execute("SELECT ... WHERE x = ?", [value])`).

**Effort to fix:** Medium (2-3 hours). Requires rewriting `_where()` and all query strings.

### 2. Hardcoded credentials in 3 locations

**Fix:** Extract to env vars, create `.env.example`.

**Effort:** Small (30 minutes).

## High debt

### 3. DRY violation — `_norm()` and `_where()` duplicated in 4 routers

Identical date normalization and WHERE-clause builder code is copy-pasted in `kpi.py`, `trend.py`, `stores.py`, `categories.py`.

**Fix:** Extract to a shared `utils/query.py` module.

**Effort:** Small (1 hour).

### 4. Dead code — unused models and cache

| File | Status |
|------|--------|
| `models/schemas.py` | Defines `MarketPoint`, `CategoryStat`, `ProductStat`, `CorrelationPoint`, `KPI` — **none used by any endpoint** |
| `utils/cache.py` | Defines `@cached()` decorator — **imported by nothing** |

**Fix:** Delete unused models, delete or use cache.

**Effort:** Trivial (15 minutes).

### 5. `CopyBtn` / `CopyButton` duplicated across pages

`ButiksuniversPage` defines `CopyBtn`, `AIJatakPage` defines `CopyButton`. Same functionality.

**Fix:** Extract to shared component.

**Effort:** Small (30 minutes).

## Medium debt

### 6. Page components are too large

| Page | Lines | Internal components |
|------|-------|-------------------|
| `ButiksuniversPage.tsx` | ~600 | 13 internal components |
| `AIJatakPage.tsx` | ~570 | 6 internal components |
| `ChurnPage.tsx` | ~500 | 4 internal components |

All sub-components are defined in the same file. Extracting to separate files would improve maintainability.

### 7. No tests

No test framework, no test files, no CI/CD pipeline. Zero test coverage.

**Impact:** Any change to business logic (especially churn) has no safety net.

### 8. No linting or formatting config

No `.eslintrc`, no `.prettierrc`, no pre-commit hooks. Code style is consistent but enforced only by convention.

### 9. `seed.py` generates unrelated test data

The seed script generates 2M rows with categories like "Elektronik", "Tøj & Mode" — completely different from the real data which has "Kød & Slagter", "Bageri", etc. If someone runs `setup.ps1`, the seed data won't work with the dashboard.

### 10. `check.py` is a loose debug script

`backend/check.py` is a quick CLI check script that doesn't use `database.py` and has a different path to the Parquet file.

## Low debt

### 11. Unused npm dependency: `date-fns`

Listed in `package.json`, not imported in any source file.

### 12. Empty directories

- `frontend/src/components/charts/` — empty
- `data/` (root) — empty

### 13. No `.env.example` file

Environment variables exist but aren't documented in a template file.

### 14. No TypeScript strict mode

`tsconfig.json` uses `"strict": true` but no `noUncheckedIndexedAccess` or other advanced checks.

## Debt summary

| Priority | Count | Estimated total effort |
|----------|-------|----------------------|
| Critical | 2 | 3 hours |
| High | 3 | 2 hours |
| Medium | 4 | 8-16 hours |
| Low | 4 | 1 hour |
