# -*- coding: utf-8 -*-
"""Sube reglas-restricciones.xlsx al VPS y ejecuta go run ./cmd/import-rules."""
from __future__ import annotations

import os
import sys
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_XLSX = ROOT / "reglas-restricciones.xlsx"
ROBOT_REMOTE = os.environ.get("CR_ROBOT_REMOTE", "/var/www/robot")
REMOTE_XLSX = f"{ROBOT_REMOTE}/internal/excel/reglas-restricciones.xlsx"
LOCAL_PARSER = ROOT / "deploy" / "robot" / "internal" / "excel" / "parser.go"
PARSER_REMOTE = f"{ROBOT_REMOTE}/internal/excel/parser.go"


def log(msg: str) -> None:
    print(f"[vps-import-rules] {msg}", file=sys.stderr)


def load_dotenv() -> None:
    env_path = ROOT / ".env"
    if not env_path.is_file():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, val = line.split("=", 1)
        os.environ.setdefault(key.strip(), val.strip().strip('"').strip("'"))


def run_ssh(client: paramiko.SSHClient, cmd: str) -> str:
    log("> " + cmd[:160] + ("…" if len(cmd) > 160 else ""))
    _, stdout, stderr = client.exec_command(cmd, get_pty=True)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    if out.strip():
        sys.stdout.write(out)
    if err.strip():
        sys.stderr.write(err)
    code = stdout.channel.recv_exit_status()
    if code != 0:
        raise RuntimeError(f"Comando remoto falló ({code})")
    return out


def main() -> None:
    load_dotenv()
    password = os.environ.get("CR_SSH_PASSWORD", "")
    if not password:
        log("Falta CR_SSH_PASSWORD en .env")
        sys.exit(1)

    local_xlsx = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_XLSX
    if not local_xlsx.is_file():
        log(f"No existe el Excel: {local_xlsx}")
        sys.exit(1)

    host = os.environ.get("CR_SSH_HOST", "2.25.159.127")
    user = os.environ.get("CR_SSH_USER", "root")
    container = os.environ.get("CR_PG_CONTAINER", "robot-postgres")
    pg_user = os.environ.get("POSTGRES_USER", "robot")
    pg_db = os.environ.get("POSTGRES_DB", "robot")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=password, timeout=60)

    sftp = client.open_sftp()
    try:
        sftp.stat(f"{ROBOT_REMOTE}/internal/excel")
    except OSError:
        run_ssh(client, f"mkdir -p {ROBOT_REMOTE}/internal/excel")
    sftp.put(str(local_xlsx), REMOTE_XLSX)
    log(f"Subido → {REMOTE_XLSX}")
    if LOCAL_PARSER.is_file():
        sftp.put(str(LOCAL_PARSER), PARSER_REMOTE)
        log(f"Subido parser.go (categorías alineadas con la BD)")
    sftp.close()

    run_ssh(
        client,
        f'cd {ROBOT_REMOTE} && go run ./cmd/import-rules "{REMOTE_XLSX}"',
    )

    verify = (
        f'docker exec -i {container} psql -U {pg_user} -d {pg_db} -c '
        '"SELECT c.name, COUNT(r.id) AS reglas FROM category c '
        "LEFT JOIN rule r ON r.category_id = c.id "
        'GROUP BY c.name ORDER BY c.name;"'
    )
    run_ssh(client, verify)
    client.close()
    log("Listo.")


if __name__ == "__main__":
    main()
