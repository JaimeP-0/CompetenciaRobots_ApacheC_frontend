# VPS — scripts y SQL

## Instalación

| Archivo | Uso |
|---------|-----|
| `install-front-on-server.sh` | Nginx + `config.local.js` (tras `vps:pull`) |
| `install-on-server.sh` | API + Postgres en el servidor (manual) |
| `install-db-admin-on-server.sh` | Adminer (`npm run vps:db-admin`) |
| `pull-front-on-server.sh` | Post-pull del front |
| `docker-compose.adminer.yml` | Contenedor Adminer |
| `adminer-cr-auto-login.php` | Login Adminer |
| `config.local.vps.js` | Plantilla URL pública |

## Base de datos

| Archivo | Comando |
|---------|---------|
| `schema.sql` | `npm run vps:schema` (solo DDL) |
| `seed-users.sql` | `npm run vps:users-seed` |
| `seed-data.sql` | `npm run vps:seed` |
| `restore-event-passwords.sql` | `npm run vps:restore-passwords` |
| `update-user-names.sql` | `npm run vps:update-users` |
| `fix-teamregistro-only.sql` | `npm run vps:fix-teamregistro` |

Cualquier otro `.sql` puntual: `python scripts/vps-run-sql-file.py ruta.sql`

Export local de usuarios: `npm run vps:export-users` → carpeta `local-db/` (no aquí).
