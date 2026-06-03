# -*- coding: utf-8 -*-
"""Sube schema.sql al VPS y lo aplica en Postgres (Docker)."""
import os
import sys
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parents[1]
SCHEMA = ROOT / "deploy" / "vps" / "schema.sql"
REMOTE_SCHEMA = "/var/www/competencia-robots/deploy/vps/schema.sql"
CONTAINER = os.environ.get("CR_PG_CONTAINER", "robot-postgres")
PG_USER = os.environ.get("POSTGRES_USER", "robot")
PG_DB = os.environ.get("POSTGRES_DB", "robot")


def load_dotenv():
    p = ROOT / ".env"
    if not p.is_file():
        return
    for line in p.read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.strip().startswith("#"):
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"'))


def run(client, cmd):
    print(">", cmd[:100], file=sys.stderr)
    _, stdout, stderr = client.exec_command(cmd, get_pty=True)
    for line in stdout:
        sys.stdout.buffer.write(line.encode("utf-8", errors="replace"))
    err = stderr.read().decode("utf-8", errors="replace")
    if err.strip():
        sys.stderr.write(err)
    code = stdout.channel.recv_exit_status()
    if code != 0:
        raise RuntimeError(f"Falló ({code}): {cmd}")


def main():
    load_dotenv()
    pw = os.environ.get("CR_SSH_PASSWORD", "")
    host = os.environ.get("CR_SSH_HOST", "2.25.159.127")
    user = os.environ.get("CR_SSH_USER", "root")
    if not pw:
        print("CR_SSH_PASSWORD requerida", file=sys.stderr)
        sys.exit(1)
    if not SCHEMA.is_file():
        print("No existe", SCHEMA, file=sys.stderr)
        sys.exit(1)

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=pw, timeout=60)

    sftp = client.open_sftp()
    sftp.put(str(SCHEMA), REMOTE_SCHEMA)
    sftp.close()

    print("==> Aplicando schema.sql en Postgres…", file=sys.stderr)
    apply = (
        f'docker exec -i {CONTAINER} psql -U {PG_USER} -d {PG_DB} -v ON_ERROR_STOP=1 '
        f'< "{REMOTE_SCHEMA}"'
    )
    run(client, apply)

    verify = (
        f'docker exec -i {CONTAINER} psql -U {PG_USER} -d {PG_DB} -c '
        f'"\\dt"'
    )
    print("==> Tablas:", file=sys.stderr)
    run(client, verify)

    run(client, "systemctl restart robot-api")
    client.close()
    print("\nSchema aplicado y API reiniciada.", file=sys.stderr)


if __name__ == "__main__":
    main()
