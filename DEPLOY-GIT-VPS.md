# Despliegue obligatorio (Git + VPS)

Tras **cualquier** cambio de código o assets en este repo:

1. `git add` (sin credenciales `*.private.md`, `.env`)
2. `git commit` + `git push`
3. `npm run vps:pull` (actualiza `/var/www/competencia-robots` desde git)

Cambios en la API Go (`deploy/robot/`): además `npm run deploy:robot`.

**Login / contraseñas:** `vps:pull` no modifica Postgres. Si falla `teamregistro` u otro usuario: `npm run vps:fix-teamregistro` o `npm run vps:restore-passwords` (requiere `CR_SSH_PASSWORD` en `.env`).

No usar solo subidas manuales (SFTP / `vps-upload-js.py`) como despliegue final.

La misma política está en `.cursor/rules/deploy-git-vps.mdc` para el agente de Cursor.
