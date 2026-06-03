# -*- coding: utf-8 -*-
"""Aplica deploy/vps/seed-users.sql en Postgres del VPS."""
import os
import sys
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parents[1]
SQL_FILE = ROOT / "deploy" / "vps" / "seed-users.sql"
REMOTE = "/var/www/competencia-robots/deploy/vps/seed-users.sql"


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
    pw = os.environ.get("CR_SSH_PASSWORD", "")
    if not pw:
        sys.exit("CR_SSH_PASSWORD requerida en .env")
    if not SQL_FILE.is_file():
        sys.exit(f"No existe {SQL_FILE}")

    host = os.environ.get("CR_SSH_HOST", "2.25.159.127")
    container = os.environ.get("CR_PG_CONTAINER", "robot-postgres")
    pg_user = os.environ.get("POSTGRES_USER", "robot")
    pg_db = os.environ.get("POSTGRES_DB", "robot")

    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(host, username=os.environ.get("CR_SSH_USER", "root"), password=pw, timeout=60)

    sftp = c.open_sftp()
    sftp.put(str(SQL_FILE), REMOTE)
    sftp.close()

    cmd = (
        f'docker exec -i {container} psql -U {pg_user} -d {pg_db} '
        f'-v ON_ERROR_STOP=1 < "{REMOTE}"'
    )
    print("==> Aplicando seed-users.sql…", file=sys.stderr)
    _, stdout, stderr = c.exec_command(cmd, get_pty=True)
    for line in stdout:
        sys.stdout.buffer.write(line.encode("utf-8", errors="replace"))
    err = stderr.read().decode("utf-8", errors="replace")
    if err.strip():
        sys.stderr.write(err)
    code = stdout.channel.recv_exit_status()
    if code != 0:
        c.close()
        sys.exit(code)

    verify = (
        f'docker exec -i {container} psql -U {pg_user} -d {pg_db} -c '
        f'"SELECT username, role FROM user_account ORDER BY role, username;"'
    )
    _, stdout, _ = c.exec_command(verify)
    print(stdout.read().decode())
    c.close()
    print("Usuarios actualizados (contraseñas + asignaciones).", file=sys.stderr)


if __name__ == "__main__":
    main()
