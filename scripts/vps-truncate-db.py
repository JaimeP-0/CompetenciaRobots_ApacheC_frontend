# -*- coding: utf-8 -*-
"""Vacía todas las tablas public de Postgres en el VPS."""
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


def run(client, cmd):
    _, stdout, stderr = client.exec_command(cmd, get_pty=True)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    if out.strip():
        print(out)
    if err.strip():
        print(err, file=sys.stderr)
    code = stdout.channel.recv_exit_status()
    if code != 0:
        raise RuntimeError(f"Comando falló ({code}): {cmd[:120]}")


def main():
    load_dotenv()
    pw = os.environ.get("CR_SSH_PASSWORD", "")
    if not pw:
        sys.exit("CR_SSH_PASSWORD requerida")

    host = os.environ.get("CR_SSH_HOST", "2.25.159.127")
    container = os.environ.get("CR_PG_CONTAINER", "robot-postgres")
    pg_user = os.environ.get("POSTGRES_USER", "robot")
    pg_db = os.environ.get("POSTGRES_DB", "robot")

    truncate_sql = """
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT LIKE 'pg_%'
  ) LOOP
    EXECUTE format('TRUNCATE TABLE %I RESTART IDENTITY CASCADE', r.tablename);
  END LOOP;
END $$;
"""

    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(host, username=os.environ.get("CR_SSH_USER", "root"), password=pw, timeout=60)

    remote_sql = "/tmp/cr-truncate-all.sql"
    sftp = c.open_sftp()
    with sftp.file(remote_sql, "w") as f:
        f.write(truncate_sql)
    sftp.close()

    print("==> Vaciando tablas…", file=sys.stderr)
    run(
        c,
        f'docker exec -i {container} psql -U {pg_user} -d {pg_db} -v ON_ERROR_STOP=1 < "{remote_sql}"',
    )

    print("==> Conteo por tabla:", file=sys.stderr)
    run(
        c,
        f"""docker exec {container} psql -U {pg_user} -d {pg_db} -c "
SELECT relname AS table, n_live_tup AS rows
FROM pg_stat_user_tables
ORDER BY relname;" """,
    )
    c.close()
    print("Listo: todas las tablas vacías.", file=sys.stderr)


if __name__ == "__main__":
    main()
