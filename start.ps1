$root     = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend  = "$root\backend"
$frontend = "$root\frontend"
$python   = "$backend\.venv\Scripts\python.exe"

Write-Host ""
Write-Host "=== Jatak Dashboard – starter ===" -ForegroundColor Cyan
Write-Host ""

# Stop gamle processer
Get-Process python* -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process node*   -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep 1

# Start backend
Write-Host ">> Backend (port 8000)..." -ForegroundColor Green
Start-Process -NoNewWindow -FilePath $python `
    -ArgumentList "-m","uvicorn","main:app","--port","8000" `
    -WorkingDirectory $backend `
    -RedirectStandardOutput "$backend\uvicorn.log" `
    -RedirectStandardError "$backend\uvicorn_err.log"

Start-Sleep 3

# Tjek backend
try {
    $kpi = Invoke-RestMethod "http://localhost:8000/api/kpi" -ErrorAction Stop
    Write-Host "   OK – $($kpi.total_offers) tilbud / $($kpi.total_stores) butikker" -ForegroundColor Green
} catch {
    Write-Host "   FEJL – tjek $backend\uvicorn_err.log" -ForegroundColor Red
}

# Start frontend
Write-Host ">> Frontend (port 5173)..." -ForegroundColor Green
Start-Process -NoNewWindow -FilePath "cmd.exe" `
    -ArgumentList "/c","cd /d $frontend && npm run dev"

Start-Sleep 3

Write-Host ""
Write-Host "Dashboard: http://localhost:5173" -ForegroundColor White
Write-Host "API docs:  http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "Tryk en tast for at aabne i browser..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Start-Process "http://localhost:5173"
