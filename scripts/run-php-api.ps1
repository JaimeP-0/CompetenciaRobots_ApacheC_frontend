# API Go local (reemplaza el PHP de prueba antiguo)
# Terminal 1: npm run local:api
# Terminal 2: npm run local

Write-Host "Usa el backend Go:" -ForegroundColor Yellow
Write-Host "  npm run local:api" -ForegroundColor Cyan
Write-Host "  npm run local" -ForegroundColor Cyan
Write-Host ""
Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Path)
npm run local:api
