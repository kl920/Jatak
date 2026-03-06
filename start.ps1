# ============================================================
#  Jatakportalen Dashboard 2026 – Start script
#  Kør: powershell -ExecutionPolicy Bypass -File START.ps1
#  eller højreklik → "Kør med PowerShell"
# ============================================================

$root    = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = "$root\backend"
$frontend= "$root\frontend"
$python  = "$backend\.venv\Scripts\python.exe"

Write-Host ""
Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Jatakportalen Dashboard 2026 – Start  ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ── Stop eventuelle gamle processer ─────────────────────────
Write-Host "► Stopper gamle processer..." -ForegroundColor Yellow
Get-Process python* -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep 1

# ── Start backend (FastAPI på port 8000) ─────────────────────
Write-Host "► Starter backend  (port 8000)..." -ForegroundColor Green
Start-Process -NoNewWindow -FilePath $python `
    -ArgumentList "-m","uvicorn","main:app","--port","8000","--app-dir","$backend" `
    -RedirectStandardOutput "$backend\uvicorn.log" `
    -RedirectStandardError  "$backend\uvicorn_err.log"

Start-Sleep 3

# Verificer backend
try {
    $kpi = Invoke-RestMethod "http://localhost:8000/api/kpi" -ErrorAction Stop
    Write-Host "  ✓ Backend OK – $($kpi.total_offers) tilbud, $($kpi.total_stores) butikker" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Backend fejl – tjek $backend\uvicorn_err.log" -ForegroundColor Red
}

# ── Start frontend (Vite på port 5173) ───────────────────────
Write-Host "► Starter frontend (port 5173)..." -ForegroundColor Green
Start-Process -NoNewWindow -FilePath "cmd.exe" `
    -ArgumentList "/c","cd /d $frontend && npm run dev"

Start-Sleep 3

Write-Host ""
Write-Host "══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Dashboard:  http://localhost:5173       " -ForegroundColor White
Write-Host "  API docs:   http://localhost:8000/docs  " -ForegroundColor White
Write-Host "  Backend log: $backend\uvicorn_err.log" -ForegroundColor Gray
Write-Host "══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tryk en tast for at åbne dashboardet..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Start-Process "http://localhost:5173"
