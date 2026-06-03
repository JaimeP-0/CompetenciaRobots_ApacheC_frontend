# -*- coding: utf-8 -*-
"""Reconecta Postgres a robot-net y reinicia Adminer (tras restart de postgres)."""
from __future__ import annotations

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


def main() -> None:
    load_dotenv()
    pw = os.environ.get("CR_SSH_PASSWORD", "")
    if not pw:
        sys.exit("CR_SSH_PASSWORD requerida en .env")

    host = os.environ.get("CR_SSH_HOST", "2.25.159.127")
    user = os.environ.get("CR_SSH_USER", "root")
    public = os.environ.get("CR_PUBLIC_URL", "https://utarena.online").rstrip("/")
    path = os.environ.get("CR_DB_ADMIN_PATH", "/cr-internal/db-console-q8m2")

    cmd = """
set -e
docker network create robot-net 2>/dev/null || true
docker network connect robot-net robot-postgres 2>/dev/null || true
docker restart cr-adminer
sleep 2
docker exec cr-adminer sh -c 'getent hosts robot-postgres && nc -zv robot-postgres 5432'
echo "Adminer OK"
"""
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(host, username=user, password=pw, timeout=30)
    _, stdout, stderr = c.exec_command(cmd, get_pty=True)
    sys.stdout.write(stdout.read().decode("utf-8", errors="replace"))
    err = stderr.read().decode("utf-8", errors="replace")
    if err.strip():
        sys.stderr.write(err)
    code = stdout.channel.recv_exit_status()
    c.close()
    if code != 0:
        sys.exit(code)
    print(f"Dashboard: {public}{path}/", file=sys.stderr)


if __name__ == "__main__":
    main()
