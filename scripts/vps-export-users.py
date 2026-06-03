# -*- coding: utf-8 -*-
"""Exporta user_account (+ user_category) del VPS a local-db/."""
from __future__ import annotations

import os
import sys
from datetime import date
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parents[1]
# Carpeta local tuya (raíz del repo), visible en el explorador
LOCAL_DIR = ROOT / "local-db"


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
    container = os.environ.get("CR_PG_CONTAINER", "robot-postgres")
    pg_user = os.environ.get("POSTGRES_USER", "robot")
    pg_db = os.environ.get("POSTGRES_DB", "robot")
    stamp = date.today().isoformat()

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=pw, timeout=60)

    dump_cmd = (
        f"docker exec {container} pg_dump -U {pg_user} -d {pg_db} "
        "--data-only --inserts -t user_account -t user_category"
    )
    _, stdout, stderr = client.exec_command(dump_cmd)
    sql_body = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    if stdout.channel.recv_exit_status() != 0:
        client.close()
        sys.exit(err or "pg_dump falló")

    header = (
        "-- Snapshot user_account + user_category (VPS). NO subir a git.\n"
        f"-- Generado: {stamp}\n\n"
    )
    LOCAL_DIR.mkdir(parents=True, exist_ok=True)
    archive_sql = LOCAL_DIR / f"export-user_account-{stamp}.sql"
    latest_sql = LOCAL_DIR / "user_account-export.sql"
    full_sql = header + sql_body
    archive_sql.write_text(full_sql, encoding="utf-8")
    latest_sql.write_text(full_sql, encoding="utf-8")

    copy_sql = (
        "\\copy (SELECT u.id, u.username, u.name, u.role, u.password_hash, "
        "c.name AS category, uc.is_internal FROM user_account u "
        "LEFT JOIN user_category uc ON uc.user_id = u.id "
        "LEFT JOIN category c ON c.id = uc.category_id "
        "ORDER BY u.id, c.name) TO STDOUT WITH CSV HEADER"
    )
    csv_cmd = (
        f"docker exec -i {container} psql -U {pg_user} -d {pg_db} "
        f'-c "{copy_sql}"'
    )
    _, stdout2, stderr2 = client.exec_command(csv_cmd)
    csv_body = stdout2.read().decode("utf-8", errors="replace")
    if stdout2.channel.recv_exit_status() != 0:
        client.close()
        sys.exit(stderr2.read().decode("utf-8", errors="replace") or "CSV falló")

    csv_path = OUT_DIR / f"export-user_account-{stamp}.csv"
    latest_csv = LOCAL_DIR / "user_account-export.csv"
    deploy_csv = OUT_DIR / "user_account-export.csv"
    csv_path.write_text(csv_body, encoding="utf-8")
    latest_csv.write_text(csv_body, encoding="utf-8")
    deploy_csv.write_text(csv_body, encoding="utf-8")
    client.close()

    print(f"LOCAL (tuya): {latest_sql.resolve()}")
    print(f"LOCAL CSV:    {latest_csv.resolve()}")
    print(f"Copia fecha:  {sql_path.relative_to(ROOT)} ({sql_path.stat().st_size} bytes)")
    print(f"Filas CSV (sin header): {max(0, len(csv_body.strip().splitlines()) - 1)}")


if __name__ == "__main__":
    main()
