# 22 – How to Run Locally

## Prerequisites

| Requirement | Version | Check |
|-------------|---------|-------|
| Python | 3.12+ | `python --version` |
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| Git LFS | any | `git lfs version` |

## Data file

The database is a single Parquet file:

```
backend/data/jatak.parquet   (139 MB, tracked by Git LFS)
```

After cloning, run `git lfs pull` if the file shows as a pointer instead of actual data.

## Quick start (recommended)

```powershell
cd C:\AI\Jatak
.\start.ps1
```

`start.ps1` does everything:
1. Activates Python venv in `backend/.venv`
2. Starts Uvicorn on port **8000**
3. Starts Vite dev server on port **5173**
4. Verifies both servers respond
5. Opens `http://localhost:5173` in the browser

## Manual start

### 1. Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend is now at `http://localhost:8000`. API docs at `http://localhost:8000/docs`.

### 2. Frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend is now at `http://localhost:5173`.

## Login credentials

The API uses HTTP Basic Auth:

- **Username:** `Coop`
- **Password:** `Jatak12+`

The frontend includes a `PasswordGate` that asks for a password before showing the app. Use: `Jatak12+`

## First-time setup

If you haven't set up venvs yet:

```powershell
cd C:\AI\Jatak
.\setup.ps1
```

This creates the Python virtual environment and installs all dependencies.

## Environment variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `OPENAI_API_KEY` | Only for AI page | none | GPT-4o post generation |
| `VITE_STATIC` | No | `""` | Set to `"true"` for static build |

## Ports

| Service | Port | URL |
|---------|------|-----|
| Backend | 8000 | http://localhost:8000 |
| Frontend | 5173 | http://localhost:5173 |
| API docs | 8000 | http://localhost:8000/docs |

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 8000 in use | `Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess \| Stop-Process` |
| Port 5173 in use | Same as above but with 5173 |
| Parquet file missing | Run `git lfs pull` |
| Python venv missing | Run `.\setup.ps1` |
| npm packages missing | `cd frontend && npm install` |
