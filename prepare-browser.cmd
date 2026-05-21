@echo off
setlocal
cd /d "%~dp0"
echo [prepare-browser] Copiando www a platforms\browser\www ...
call npm run prepare:browser
if errorlevel 1 (
  echo [prepare-browser] Error al ejecutar prepare.
  exit /b 1
)
echo [prepare-browser] Listo. Recarga el navegador si el servidor ya esta en marcha.
endlocal
