#!/bin/bash
# Instalación completa en el VPS (Postgres, API Go en /var/www/robot, nginx).
# No lo ejecuta npm run deploy:vps — solo sube ESTE repo. Usar manualmente si hace falta.
set -euo pipefail

FRONT_ROOT="${CR_FRONT_ROOT:-/var/www/competencia-robots}"
ROBOT_ROOT="${CR_ROBOT_ROOT:-/var/www/robot}"
PUBLIC_URL="${CR_PUBLIC_URL:-http://2.25.159.127}"
DIAG_KEY="${CR_DIAG_KEY:-cr-diag-utarena-x7k9m2}"
NGINX_SITE="/etc/nginx/sites-available/competencia-robots"

export DEBIAN_FRONTEND=noninteractive

install_pkg() {
    apt-get install -y -qq "$@" 2>/dev/null || apt-get install -y "$@" || true
}

echo "==> Paquetes…"
apt-get update -qq || true
command -v nginx >/dev/null || install_pkg nginx
command -v go >/dev/null || install_pkg golang-go
if ! command -v docker >/dev/null; then
    install_pkg docker.io
    systemctl enable --now docker 2>/dev/null || true
fi

echo "==> Postgres (docker compose)…"
cd "$ROBOT_ROOT"
if [ ! -f .env ]; then
  cat > .env <<EOF
POSTGRES_USER=robot
POSTGRES_PASSWORD=robot
POSTGRES_DB=robot
POSTGRES_PORT=5432
POSTGRES_HOST=localhost
EOF
fi
if docker compose version >/dev/null 2>&1; then
  docker compose up -d
elif command -v docker-compose >/dev/null; then
  docker-compose up -d
else
  echo "AVISO: sin docker compose; instala docker-compose-plugin o levanta Postgres a mano."
fi

echo "==> Compilar API Go…"
cd "$ROBOT_ROOT"
go build -o /usr/local/bin/robot-api ./cmd/server

echo "==> systemd robot-api…"
cp "$FRONT_ROOT/deploy/systemd/robot-api.service" /etc/systemd/system/robot-api.service
systemctl daemon-reload
systemctl enable robot-api
systemctl restart robot-api

echo "==> nginx…"
if ! command -v nginx >/dev/null; then
  echo "ERROR: nginx no instalado. En el VPS ejecuta: apt-get install -y nginx"
  exit 1
fi
cp "$FRONT_ROOT/deploy/nginx/competencia-robots.conf" "$NGINX_SITE"
rm -f /etc/nginx/sites-enabled/default
ln -sf "$NGINX_SITE" /etc/nginx/sites-enabled/competencia-robots
nginx -t
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

echo "==> config.local.js (perfil VPS)…"
cat > "$FRONT_ROOT/www/js/config.local.js" <<EOF
(function (w) {
    'use strict';
    w.CR_API_OVERRIDES = {
        apiProfile: 'vps',
        publicUrl: '${PUBLIC_URL}',
        diagFeedKey: '${DIAG_KEY}'
    };
})(window);
EOF

echo ""
echo "Listo. App: ${PUBLIC_URL}/"
echo "API: ${PUBLIC_URL}/categorias"
systemctl is-active robot-api nginx || true
