# setup.ps1 – Én gang: installer afhængigheder + generer testdata
# Kør fra roden:  .\setup.ps1

$ErrorActionPreference = "Stop"

Write-Host "=== 1/3  Python venv & backend packages ===" -ForegroundColor Cyan
Push-Location backend
if (-not (Test-Path ".venv")) {
    python -m venv .venv
}
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt | Out-Null
Write-Host "Backend pakker installeret." -ForegroundColor Green

Write-Host "=== 2/3  Generer 2M testdata (jatak.parquet) ===" -ForegroundColor Cyan
python data/seed.py
Pop-Location

Write-Host "=== 3/3  Frontend npm install ===" -ForegroundColor Cyan
Push-Location frontend
npm install | Out-Null
Pop-Location

Write-Host ""
Write-Host "Alt klar!  Start nu med:  .\start.ps1" -ForegroundColor Green
