# App en el VPS (front + backend juntos)

En el servidor **no hace falta tu PC**. Nginx sirve el Cordova (`www`) y reenvía `/categorias`, `/partidas`, etc. al API Go en `127.0.0.1:8080`.

## Arquitectura

```text
Internet :80
    └── nginx (/var/www/competencia-robots/www)
            ├── /*.html, js, css  → archivos estáticos
            └── /categorias, /partidas, … → proxy → Go :8080
    └── robot-api (systemd) + Postgres (docker)
```

**URL de la app:** http://2.25.159.127/

## Desde tu PC (flujo habitual — solo front)

1. Copia `.env.example` → `.env` y revisa `CR_PUBLIC_URL` / `CR_SSH_HOST`.

2. Genera assets que el VPS no compila (no hay Node en el servidor):

```powershell
npm run build:vps
git add -f www/css/app.css www/cordova.js www/cordova_plugins.js www/plugins
```

3. Commit → push:

```powershell
git add …
git commit -m "…"
git push origin master
```

4. Despliega en el VPS (build local + git pull en el servidor):

```powershell
$env:CR_SSH_PASSWORD = "tu-contraseña-root"
npm run deploy:vps
```

Equivale a `npm run build:vps` + `npm run vps:pull`: actualiza `/var/www/competencia-robots` desde git y ejecuta `install-front-on-server.sh` (nginx + `config.local.js`). **No toca Postgres ni contraseñas.**

Si ya hiciste `build:vps` y solo quieres pull:

```powershell
npm run vps:pull
```

El backend Go vive en **otro repo** (`/var/www/robot`); actualízalo con `npm run deploy:robot`.

## Solo en el VPS (sin PC)

Solo front (este proyecto):

```bash
bash /var/www/competencia-robots/deploy/vps/install-front-on-server.sh
```

API + Postgres (otro repo, **manual** en el servidor):

```bash
bash /var/www/competencia-robots/deploy/vps/install-on-server.sh
```

## Base de datos (schema)

El esquema está en `deploy/vps/schema.sql`. Para aplicarlo (o reaplicarlo) en el VPS:

```powershell
$env:CR_SSH_PASSWORD = "tu-contraseña"
npm run vps:schema
```

Eso aplica el SQL en Postgres (no sube otros repos).

## Comandos útiles en el VPS

```bash
systemctl status robot-api nginx
systemctl restart robot-api
curl -s http://127.0.0.1:8080/categorias | head
curl -s http://127.0.0.1/categorias | head
docker compose -f /var/www/robot/docker-compose.yml ps
```

## APK Android

El perfil `vps` en `config.local.js` usa `publicUrl` del VPS. Tras cambiar la IP, `npm run build:vps`, commit, push y `npm run deploy:vps` (o edita `www/js/config.local.js` en el servidor).

## Desarrollo en PC (opcional)

En `www/js/config.local.js` pon `apiProfile: 'local'` y usa `npm run local:stack`.
