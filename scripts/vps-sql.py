# -*- coding: utf-8 -*-
"""Ejecuta SQL en Postgres del VPS. Uso: python scripts/vps-sql.py "INSERT ..." """
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
            os.environ.setdefault(k.strip(), v.strip().strip('"'))


def main():
    load_dotenv()
    sql = sys.argv[1] if len(sys.argv) > 1 else ""
    if not sql:
        print("Uso: python scripts/vps-sql.py \"SQL\"", file=sys.stderr)
        sys.exit(1)
    pw = os.environ.get("CR_SSH_PASSWORD", "")
    if not pw:
        sys.exit("CR_SSH_PASSWORD requerida")
    host = os.environ.get("CR_SSH_HOST", "2.25.159.127")
    user = os.environ.get("CR_SSH_USER", "root")
    container = os.environ.get("CR_PG_CONTAINER", "robot-postgres")
    pg_user = os.environ.get("POSTGRES_USER", "robot")
    pg_db = os.environ.get("POSTGRES_DB", "robot")
    escaped = sql.replace("\\", "\\\\").replace('"', '\\"')
    cmd = f'docker exec -i {container} psql -U {pg_user} -d {pg_db} -c "{escaped}"'
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(host, username=user, password=pw, timeout=60)
    _, stdout, stderr = c.exec_command(cmd)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    print(out)
    if err.strip():
        print(err, file=sys.stderr)
    code = stdout.channel.recv_exit_status()
    c.close()
    sys.exit(code)


if __name__ == "__main__":
    main()
