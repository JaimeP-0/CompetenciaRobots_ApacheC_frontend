# API PHP local (misma URL que usa el proxy con npm run browser)
# Terminal 1: .\scripts\run-php-api.ps1
# Terminal 2: $env:CR_API_TARGET='http://127.0.0.1:8080'; npm run browser

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$phpDir = Join-Path $root 'backend\php'
Write-Host "API PHP en http://127.0.0.1:8080 (carpeta $phpDir)"
Write-Host "Prueba: http://127.0.0.1:8080/health"
Set-Location $phpDir
php -S 127.0.0.1:8080
