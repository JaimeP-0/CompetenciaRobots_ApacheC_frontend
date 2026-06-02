# -*- coding: utf-8 -*-
"""Elimina la base robot y la recrea vacía (espera schema.sql después)."""
import os
import sys
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parents[1]


def load_dotenv() -> None:
    p = ROOT / ".env"
    if not p.is_file():
        return
    for line in p.read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.strip().startswith("#"):
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def run(client: paramiko.SSHClient, cmd: str) -> None:
    _, stdout, stderr = client.exec_command(cmd, get_pty=True)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    if out.strip():
        print(out)
    if err.strip():
        print(err, file=sys.stderr)
    code = stdout.channel.recv_exit_status()
    if code != 0:
        raise RuntimeError(f"Comando falló ({code})")


def main() -> None:
    load_dotenv()
    pw = os.environ.get("CR_SSH_PASSWORD", "")
    if not pw:
        sys.exit("CR_SSH_PASSWORD requerida")

    host = os.environ.get("CR_SSH_HOST", "2.25.159.127")
    container = os.environ.get("CR_PG_CONTAINER", "robot-postgres")
    pg_db = os.environ.get("POSTGRES_DB", "robot")
    pg_user = os.environ.get("POSTGRES_USER", "robot")
    superuser = os.environ.get("POSTGRES_SUPERUSER", pg_user)

    sql = f"""
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '{pg_db}' AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS {pg_db};
CREATE DATABASE {pg_db} OWNER {pg_user};
"""

    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(host, username=os.environ.get("CR_SSH_USER", "root"), password=pw, timeout=60)

    remote_sql = "/tmp/cr-drop-db.sql"
    sftp = c.open_sftp()
    with sftp.file(remote_sql, "w") as f:
        f.write(sql)
    sftp.close()

    print("==> Deteniendo robot-api (evita migraciones al recrear la BD)…", file=sys.stderr)
    run(c, "systemctl stop robot-api || true")

    print(f"==> DROP + CREATE DATABASE {pg_db}…", file=sys.stderr)
    run(
        c,
        f'docker exec -i {container} psql -U {superuser} -d postgres -v ON_ERROR_STOP=1 < "{remote_sql}"',
    )

    print("==> Tablas actuales:", file=sys.stderr)
    run(
        c,
        f"docker exec {container} psql -U {pg_user} -d {pg_db} -c "
        f"\"SELECT COUNT(*) AS tables FROM pg_tables WHERE schemaname='public';\"",
    )

    c.close()
    print(
        f"Listo: BD '{pg_db}' vacía. robot-api está detenido; aplica schema.sql y luego: systemctl start robot-api",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
