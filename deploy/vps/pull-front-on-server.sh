#!/bin/bash
# Post-pull en VPS: build opcional + nginx/config. El git lo hace vps-pull-front.py.
set -euo pipefail

FRONT_ROOT="${CR_FRONT_ROOT:-/var/www/competencia-robots}"
PUBLIC_URL="${CR_PUBLIC_URL:-https://utarena.online}"

cd "$FRONT_ROOT"

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

INSTALL="$FRONT_ROOT/deploy/vps/install-front-on-server.sh"
if [ -f "$INSTALL" ]; then
    export CR_FRONT_ROOT="$FRONT_ROOT" CR_PUBLIC_URL="$PUBLIC_URL"
    bash "$INSTALL"
else
    echo "AVISO: falta install-front-on-server.sh; config.local.js no actualizado."
fi

echo "Listo (front). App: ${PUBLIC_URL}/"
