# 19 – Security Review

## Critical issues

### 1. SQL injection via string interpolation (CRITICAL)

**Location:** `kpi.py`, `trend.py`, `stores.py`, `categories.py` — `_where()` function

```python
def _where(store, date_from, date_to):
    if store:
        safe = store.replace("'", "''")
        clauses.append(f"store_name = '{safe}'")
```

The `store` parameter comes from user input (`Query(None)`). While single-quote escaping provides basic protection, this is **not parameterised SQL**. DuckDB supports parameterised queries (`conn.execute("... WHERE x = ?", [value])`), which should be used instead.

**Also in `inspiration.py`:**
```python
safe_cat = category.replace("'", "''")
f"WHERE category = '{safe_cat}'"
```

**And `churn.py`:**
```python
safe = chain.replace("'", "''")
f"WHERE store_name LIKE '{safe}%'"
```

**Risk:** Medium. The single-quote escaping prevents the most basic SQL injection, but it's not defense-in-depth. DuckDB's limited attack surface (no system tables to exfiltrate, read-only data) reduces the impact.

**Fix:** Use parameterised queries everywhere.

### 2. Hardcoded credentials in source code (HIGH)

Three locations contain the same hardcoded credentials:
- `backend/main.py` (Python)
- `frontend/src/components/PasswordGate.tsx` (TypeScript — visible in browser)
- `export_static.py` (Python)

**Risk:** Anyone with repo access knows the credentials. The frontend credentials are visible in the JS bundle.

### 3. Client-side authentication is cosmetic (MEDIUM)

`PasswordGate.tsx` checks credentials in JavaScript. Any user can bypass by:
- Opening DevTools → `sessionStorage.setItem('jatak_auth', '1')`
- Reading the bundle source to find credentials
- The static JSON files are publicly accessible without any authentication

### 4. OpenAI API key stored in localStorage (MEDIUM)

The user's OpenAI API key is persisted in `localStorage` and sent to the backend over HTTP in development mode.

**Risk:** Any XSS vulnerability would expose the key. The key is sent in a form field (not a header), so it may appear in server logs.

### 5. No rate limiting (LOW)

No protection against brute-force login attempts or API abuse. The middleware checks credentials on every request but never throttles.

### 6. No CSRF protection (LOW)

The API uses HTTP Basic Auth (stateless), so CSRF is not a concern for API calls. However, the frontend PasswordGate uses sessionStorage, which is not CSRF-vulnerable.

## Medium issues

### 7. No input validation beyond basic types

Query parameters are typed (`str`, `int`) but no length limits, no regex validation on store names, no maximum `limit` beyond 100.

### 8. No Content Security Policy

No CSP headers configured. The static site on GitHub Pages has no security headers.

### 9. CORS allows localhost only

`allow_origins=["http://localhost:5173", "http://localhost:3000"]` — appropriate for development, but the production static site doesn't use the API.

### 10. Error messages may leak internals

The AI endpoint returns raw OpenAI error messages:
```python
detail=f"OpenAI-fejl: {str(exc)}"
```

## Positive security practices

| Practice | Status |
|----------|--------|
| Timing-safe credential comparison | ✅ `secrets.compare_digest()` |
| No database file exposed | ✅ DuckDB is in-memory only |
| Git LFS for large binary | ✅ Parquet not in regular git |
| OpenAI key validation | ✅ Checks `sk-` prefix |
| Read-only data | ✅ No write operations on Parquet/Excel |
| No eval/exec usage | ✅ Clean |
| No pickle/deserialisation | ✅ Clean |

## Recommendations (priority order)

1. **Switch to parameterised SQL queries** — eliminate injection risk
2. **Move credentials to environment variables** — remove from source
3. **Add rate limiting** — at minimum on auth failure
4. **Add CSP headers** for the production site
5. **Document that PasswordGate is cosmetic** — not real security
