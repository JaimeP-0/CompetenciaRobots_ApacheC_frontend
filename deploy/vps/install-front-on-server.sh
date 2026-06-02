#!/bin/bash
# Solo front (este repo): nginx + config.local.js. No toca /var/www/robot ni otros repos.
set -euo pipefail

FRONT_ROOT="${CR_FRONT_ROOT:-/var/www/competencia-robots}"
PUBLIC_URL="${CR_PUBLIC_URL:-https://utarena.online}"
DIAG_KEY="${CR_DIAG_KEY:-cr-diag-utarena-x7k9m2}"
NGINX_SITE="/etc/nginx/sites-available/competencia-robots"

if ! command -v nginx >/dev/null; then
    echo "ERROR: nginx no instalado. Instálalo en el VPS o usa deploy completo manual."
    exit 1
fi

echo "==> nginx (solo front)…"
cp "$FRONT_ROOT/deploy/nginx/competencia-robots.conf" "$NGINX_SITE"
rm -f /etc/nginx/sites-enabled/default
ln -sf "$NGINX_SITE" /etc/nginx/sites-enabled/competencia-robots
nginx -t
# enable: arranque al boot; start/restart: si estaba apagado, reload no lo levanta
systemctl enable nginx
if systemctl is-active --quiet nginx; then
    systemctl reload nginx
else
    systemctl start nginx
fi
if ! systemctl is-active --quiet nginx; then
    echo "ERROR: nginx no quedó activo. Revisa: systemctl status nginx"
    exit 1
fi

echo "==> config.local.js…"
VIEW_BUST="$(git -C "$FRONT_ROOT" rev-parse --short HEAD 2>/dev/null || date +%s)"
cat > "$FRONT_ROOT/www/js/config.local.js" <<EOF
(function (w) {
    'use strict';
    w.CR_API_OVERRIDES = {
        apiProfile: 'vps',
        publicUrl: '${PUBLIC_URL}',
        diagFeedKey: '${DIAG_KEY}',
        viewCacheBust: '${VIEW_BUST}'
    };
})(window);
EOF

echo "Listo (front). App: ${PUBLIC_URL}/"
