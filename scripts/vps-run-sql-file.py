# -*- coding: utf-8 -*-
"""Ejecuta un .sql del repo en Postgres del VPS. Uso: python scripts/vps-run-sql-file.py deploy/vps/foo.sql"""
import os
import sys
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parents[1]


def load_dotenv():
    p = ROOT / ".env"
    if not p.is_file():
        return
    for line in p.read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.strip().startswith("#"):
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def main():
    load_dotenv()
    if len(sys.argv) < 2:
        sys.exit("Uso: python scripts/vps-run-sql-file.py <ruta.sql>")
    rel = sys.argv[1].replace("\\", "/")
    local = ROOT / rel
    if not local.is_file():
        sys.exit(f"No existe {local}")
    pw = os.environ.get("CR_SSH_PASSWORD", "")
    if not pw:
        sys.exit("CR_SSH_PASSWORD requerida")
    host = os.environ.get("CR_SSH_HOST", "2.25.159.127")
    front = os.environ.get("CR_FRONT_REMOTE", "/var/www/competencia-robots")
    container = os.environ.get("CR_PG_CONTAINER", "robot-postgres")
    pg_user = os.environ.get("POSTGRES_USER", "robot")
    pg_db = os.environ.get("POSTGRES_DB", "robot")
    remote = f"{front}/{rel}"

    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(host, username=os.environ.get("CR_SSH_USER", "root"), password=pw, timeout=60)
    sftp = c.open_sftp()
    sftp.put(str(local), remote)
    sftp.close()
    cmd = f'docker exec -i {container} psql -U {pg_user} -d {pg_db} -v ON_ERROR_STOP=1 < "{remote}"'
    _, stdout, _ = c.exec_command(cmd, get_pty=True)
    sys.stdout.write(stdout.read().decode("utf-8", errors="replace"))
    code = stdout.channel.recv_exit_status()
    c.close()
    sys.exit(code)


if __name__ == "__main__":
    main()
