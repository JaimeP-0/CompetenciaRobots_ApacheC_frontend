# -*- coding: utf-8 -*-
"""
Parchea /var/www/robot/internal/store/migration/schema.sql para que Migrate
NO sobrescriba password_hash al arrancar robot-api.
Luego restaura contraseñas del evento si CR_RESTORE_PASSWORDS=1 (default).
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parents[1]
MIGRATION = "/var/www/robot/internal/store/migration/schema.sql"


def load_dotenv() -> None:
    p = ROOT / ".env"
    if not p.is_file():
        return
    for line in p.read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.strip().startswith("#"):
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def main() -> None:
    load_dotenv()
    pw = os.environ.get("CR_SSH_PASSWORD", "")
    if not pw:
        sys.exit("CR_SSH_PASSWORD requerida")
    host = os.environ.get("CR_SSH_HOST", "2.25.159.127")
    user = os.environ.get("CR_SSH_USER", "root")
    restore = os.environ.get("CR_RESTORE_PASSWORDS", "1") != "0"
    front = os.environ.get("CR_FRONT_REMOTE", "/var/www/competencia-robots")

    patch_cmd = (
        f"sed -i 's/password_hash = EXCLUDED.password_hash;/-- password_hash: no pisar en migrate/' "
        f'"{MIGRATION}" && grep -n "password_hash" "{MIGRATION}" || true'
    )

    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(host, username=user, password=pw, timeout=60)
    print("[patch] Parcheando migration del API…", file=sys.stderr)
    _, stdout, _ = c.exec_command(patch_cmd, get_pty=True)
    sys.stdout.write(stdout.read().decode("utf-8", errors="replace"))

    if restore:
        sql = f"{front}/deploy/vps/restore-event-passwords.sql"
        container = os.environ.get("CR_PG_CONTAINER", "robot-postgres")
        pg_user = os.environ.get("POSTGRES_USER", "robot")
        pg_db = os.environ.get("POSTGRES_DB", "robot")
        print("[patch] Restaurando contraseñas evento…", file=sys.stderr)
        cmd = (
            f'docker exec -i {container} psql -U {pg_user} -d {pg_db} '
            f'-v ON_ERROR_STOP=1 < "{sql}"'
        )
        _, stdout, _ = c.exec_command(cmd, get_pty=True)
        sys.stdout.write(stdout.read().decode("utf-8", errors="replace"))

    print("[patch] Reiniciando robot-api (migrate ya no pisa passwords)…", file=sys.stderr)
    _, stdout, _ = c.exec_command("systemctl restart robot-api && sleep 1 && systemctl is-active robot-api", get_pty=True)
    out = stdout.read().decode("utf-8", errors="replace")
    sys.stdout.write(out)
    if "active" not in out:
        sys.exit(1)
    c.close()
    print("Listo.", file=sys.stderr)


if __name__ == "__main__":
    main()
