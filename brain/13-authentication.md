# 13 – Authentication

## Backend authentication

### Method

**HTTP Basic Auth** via custom middleware in `main.py`.

### Credentials

```python
AUTH_USER = os.getenv("AUTH_USER", "Coop")
AUTH_PASS = os.getenv("AUTH_PASS", "Jatak12+")
```

- Defaults are hardcoded in source code
- Can be overridden via environment variables
- Uses `secrets.compare_digest()` for timing-safe comparison (good)

### Scope

- Every request is checked except `GET /health`
- No per-route or per-role authorization
- No session management — every request must include the Basic Auth header

### Implementation

```python
@app.middleware("http")
async def basic_auth_middleware(request: Request, call_next):
    if request.url.path == "/health":
        return await call_next(request)
    
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Basic "):
        decoded = base64.b64decode(auth_header[6:]).decode()
        username, password = decoded.split(":", 1)
        if (secrets.compare_digest(username, AUTH_USER)
                and secrets.compare_digest(password, AUTH_PASS)):
            return await call_next(request)
    
    return Response(status_code=401, headers={"WWW-Authenticate": 'Basic realm="Jatakportalen"'})
```

## Frontend authentication

### Live mode (local development)

Vite dev server proxies `/api` → `localhost:8000`. Browser native HTTP Basic Auth dialog appears on first request.

### Static mode (GitHub Pages)

Client-side `PasswordGate` component wraps the app:

```tsx
const EXPECTED_USER = 'Coop'
const EXPECTED_PASS = 'Jatak12+'
```

- Credentials are **hardcoded in JavaScript** (visible to anyone with browser DevTools)
- Auth state stored in `sessionStorage['jatak_auth']` (per tab)
- This is purely cosmetic/deterrent — not real security

## Security assessment

| Concern | Status |
|---------|--------|
| Credentials in source code | **YES** — hardcoded in `main.py` and `PasswordGate.tsx` |
| Timing-safe comparison | ✅ Yes (`secrets.compare_digest`) |
| HTTPS required | ❌ Not enforced (GitHub Pages uses HTTPS, but local dev is HTTP) |
| Brute force protection | ❌ No rate limiting, no lockout |
| Client-side gate | ❌ Trivially bypassable (inspect JS, or just `sessionStorage.setItem('jatak_auth', '1')`) |
| Session management | None (stateless Basic Auth) |
| Token expiration | N/A (no tokens) |

## Recommendations

1. Move credentials to environment variables (remove hardcoded defaults)
2. Add rate limiting on auth failures
3. If real security needed, switch to JWT or OAuth2
4. The GitHub Pages PasswordGate should be documented as a UX gate, not security
