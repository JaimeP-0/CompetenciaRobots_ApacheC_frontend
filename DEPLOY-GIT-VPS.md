# Despliegue obligatorio (Git + VPS)

Tras **cualquier** cambio de código o assets en este repo:

1. `git add` (sin credenciales `*.private.md`, `.env`)
2. `git commit` + `git push`
3. `npm run vps:pull` (actualiza `/var/www/competencia-robots` desde git)

Cambios en la API Go (`deploy/robot/`): además `npm run deploy:robot`.

**Login / contraseñas:** `vps:pull` **no** toca Postgres ni reinicia `robot-api`. Si los logins dejan de funcionar tras reiniciar la API o Postgres, suele ser la migración embebida en `robot-api` (pisaba `password_hash`). Parche una vez: `npm run vps:patch-robot-migrate`. Restaurar claves del evento: `npm run vps:restore-passwords`. **No uses** `vps:schema` en producción con datos reales salvo que sepas que ya no incluye seeds de usuarios.

No usar solo subidas manuales (SFTP / `vps-upload-js.py`) como despliegue final.

La misma política está en `.cursor/rules/deploy-git-vps.mdc` para el agente de Cursor.
