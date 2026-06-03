#!/bin/bash
# Adminer (dashboard Postgres) + nginx ruta oculta. Ejecutar en el VPS como root.
set -euo pipefail

FRONT_ROOT="${CR_FRONT_ROOT:-/var/www/competencia-robots}"
ROBOT_ROOT="${CR_ROBOT_ROOT:-/var/www/robot}"
PUBLIC_URL="${CR_PUBLIC_URL:-https://utarena.online}"
DB_ADMIN_PATH="${CR_DB_ADMIN_PATH:-/cr-internal/db-console-q8m2}"
DB_ADMIN_USER="${CR_DB_ADMIN_USER:-crdb}"
DB_ADMIN_PASSWORD="${CR_DB_ADMIN_PASSWORD:-cr-db-utarena-x7k9m2}"
NGINX_SITE="/etc/nginx/sites-available/competencia-robots"
HTPASSWD="/etc/nginx/cr-db-admin.htpasswd"

echo "==> Red Docker robot-net…"
docker network create robot-net 2>/dev/null || true
docker network connect robot-net robot-postgres 2>/dev/null || true

echo "==> Adminer (127.0.0.1:8081)…"
docker rm -f cr-adminer 2>/dev/null || true
ADMINER_DB_PASSWORD="$(docker exec robot-postgres printenv POSTGRES_PASSWORD 2>/dev/null || true)"
if [ -z "$ADMINER_DB_PASSWORD" ]; then
    ADMINER_DB_PASSWORD="$(grep -E '^POSTGRES_PASSWORD=' "$ROBOT_ROOT/.env" 2>/dev/null | cut -d= -f2- | tr -d '"' || true)"
fi
ADMINER_DB_PASSWORD="${ADMINER_DB_PASSWORD:-robot}"
export ADMINER_DB_PASSWORD
(cd "$FRONT_ROOT/deploy/vps" && docker compose -f docker-compose.adminer.yml up -d)

echo "==> Credenciales nginx (auth_basic)…"
if ! command -v htpasswd >/dev/null; then
    apt-get update -qq || true
    apt-get install -y -qq apache2-utils || apt-get install -y apache2-utils
fi
htpasswd -cb "$HTPASSWD" "$DB_ADMIN_USER" "$DB_ADMIN_PASSWORD"
chgrp www-data "$HTPASSWD" 2>/dev/null || true
chmod 640 "$HTPASSWD"

echo "==> Postgres solo localhost (cierra 5432 público)…"
if [ -f "$ROBOT_ROOT/docker-compose.yml" ]; then
    if grep -q '0.0.0.0:5432' "$ROBOT_ROOT/docker-compose.yml" 2>/dev/null || \
       grep -q '"${POSTGRES_PORT}:5432"' "$ROBOT_ROOT/docker-compose.yml"; then
        sed -i 's/- "${POSTGRES_PORT}:5432"/- "127.0.0.1:${POSTGRES_PORT}:5432"/' "$ROBOT_ROOT/docker-compose.yml" || true
        (cd "$ROBOT_ROOT" && docker compose up -d postgres) || true
        docker network connect robot-net robot-postgres 2>/dev/null || true
    fi
fi

echo "==> nginx…"
cp "$FRONT_ROOT/deploy/nginx/competencia-robots.conf" "$NGINX_SITE"
nginx -t
systemctl reload nginx

echo ""
echo "Dashboard BD: ${PUBLIC_URL}${DB_ADMIN_PATH}/"
echo "  HTTP auth: usuario=${DB_ADMIN_USER}"
echo "  Tras auth HTTP entra directo a la BD robot (auto-login; nginx ya protege la ruta)"
