#!/bin/bash
# Actualiza el front en el VPS con git pull (rápido). Ejecutar en /var/www/competencia-robots.
set -euo pipefail

FRONT_ROOT="${CR_FRONT_ROOT:-/var/www/competencia-robots}"
REPO_URL="${CR_FRONT_GIT_URL:-https://github.com/JaimeP-0/CompetenciaRobots_ApacheC_frontend.git}"
BRANCH="${CR_FRONT_BRANCH:-master}"
PUBLIC_URL="${CR_PUBLIC_URL:-https://utarena.online}"

cd "$FRONT_ROOT"

if ! command -v git >/dev/null; then
    echo "ERROR: git no instalado."
    exit 1
fi

if [ ! -d .git ]; then
    echo "==> Inicializando repositorio en $FRONT_ROOT …"
    git init
    git remote add origin "$REPO_URL"
    git fetch origin "$BRANCH"
    git checkout -B "$BRANCH" "origin/$BRANCH"
else
    echo "==> git pull origin $BRANCH …"
    git fetch origin "$BRANCH"
    git checkout "$BRANCH" 2>/dev/null || git checkout -B "$BRANCH" "origin/$BRANCH"
    git pull --ff-only origin "$BRANCH"
fi

if command -v npm >/dev/null && [ -f package.json ]; then
    echo "==> build:css (+ cordova browser si aplica) …"
    if [ ! -d node_modules ]; then
        npm install --no-audit --no-fund
    fi
    export CR_PUBLIC_URL="$PUBLIC_URL"
    npm run build:css
    if [ -d node_modules/@cordova ]; then
        npx cordova prepare browser 2>/dev/null || true
        node scripts/sync-cordova-browser.cjs 2>/dev/null || true
    fi
fi

if [ -x "$FRONT_ROOT/deploy/vps/install-front-on-server.sh" ]; then
    export CR_FRONT_ROOT="$FRONT_ROOT" CR_PUBLIC_URL="$PUBLIC_URL"
    bash "$FRONT_ROOT/deploy/vps/install-front-on-server.sh"
else
    echo "AVISO: falta install-front-on-server.sh; config.local.js no actualizado."
fi

echo "Listo (git pull front). App: ${PUBLIC_URL}/"
