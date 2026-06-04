# 18 – Environment Variables

## Used variables

| Variable | Default | Location | Purpose |
|----------|---------|----------|---------|
| `AUTH_USER` | `"Coop"` | `backend/main.py` | HTTP Basic Auth username |
| `AUTH_PASS` | `"Jatak12+"` | `backend/main.py` | HTTP Basic Auth password |
| `VITE_STATIC` | `undefined` | `frontend/vite.config.ts` | When `"true"`, enables static build mode |
| `BASE_URL` | auto | Vite | Set to `/Jatak/` when VITE_STATIC=true |

## Environment file

**No `.env` file exists.** No `.env.example` either.

`python-dotenv` is listed in `requirements.txt` but never imported.

## Frontend environment

Vite exposes `import.meta.env`:
- `import.meta.env.VITE_STATIC` — controls static client alias
- `import.meta.env.BASE_URL` — set by Vite `base` config

## Client-side "secrets"

| Key | Storage | Value |
|-----|---------|-------|
| `jatak_auth` | `sessionStorage` | `"1"` when user passes PasswordGate |
| `jatak_openai_key` | `localStorage` | User's OpenAI API key (sk-...) |

## Hardcoded credentials

| Location | Credentials |
|----------|------------|
| `backend/main.py` line 17-18 | `AUTH_USER="Coop"`, `AUTH_PASS="Jatak12+"` |
| `frontend/src/components/PasswordGate.tsx` line 3-4 | `EXPECTED_USER='Coop'`, `EXPECTED_PASS='Jatak12+'` |
| `export_static.py` line 9 | `base64.b64encode(b"Coop:Jatak12+")` |

## Recommendations

1. Create `.env.example` documenting all variables
2. Move all credentials to environment variables
3. Remove hardcoded defaults from source code
4. Add `OPENAI_API_KEY` server-side instead of client-provided keys
