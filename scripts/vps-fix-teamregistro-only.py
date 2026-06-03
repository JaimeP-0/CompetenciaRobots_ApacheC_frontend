# -*- coding: utf-8 -*-
"""Restaura solo teamregistro en Postgres del VPS y verifica POST /login."""
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parents[1]
SQL = ROOT / "deploy" / "vps" / "fix-teamregistro-only.sql"


def load_dotenv() -> None:
    p = ROOT / ".env"
    if not p.is_file():
        return
    for line in p.read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.strip().startswith("#"):
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def test_login(user: str, pwd: str) -> None:
    base = os.environ.get("CR_PUBLIC_URL", "https://utarena.online").rstrip("/")
    req = urllib.request.Request(
        f"{base}/login",
        data=json.dumps({"username": user, "password": pwd}).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            body = json.loads(resp.read().decode())
            print(f"LOGIN {user}: OK role={body.get('role')} name={body.get('name')}")
    except urllib.error.HTTPError as exc:
        print(f"LOGIN {user}: FALLO HTTP {exc.code} {exc.read().decode()[:160]}")
        sys.exit(1)


def main() -> None:
    load_dotenv()
    pw = os.environ.get("CR_SSH_PASSWORD", "")
    if not pw:
        sys.exit("CR_SSH_PASSWORD requerida (.env o $env:CR_SSH_PASSWORD)")
    if not SQL.is_file():
        sys.exit(f"No existe {SQL}")

    container = os.environ.get("CR_PG_CONTAINER", "robot-postgres")
    pg_user = os.environ.get("POSTGRES_USER", "robot")
    pg_db = os.environ.get("POSTGRES_DB", "robot")
    front = os.environ.get("CR_FRONT_REMOTE", "/var/www/competencia-robots")
    remote = f"{front}/deploy/vps/fix-teamregistro-only.sql"

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        os.environ.get("CR_SSH_HOST", "2.25.159.127"),
        username=os.environ.get("CR_SSH_USER", "root"),
        password=pw,
        timeout=60,
    )
    sftp = client.open_sftp()
    sftp.put(str(SQL), remote)
    sftp.close()

    cmd = (
        f'docker exec -i {container} psql -U {pg_user} -d {pg_db} '
        f'-v ON_ERROR_STOP=1 < "{remote}"'
    )
    print("==> fix-teamregistro-only.sql", file=sys.stderr)
    _, stdout, stderr = client.exec_command(cmd, get_pty=True)
    out = stdout.read().decode("utf-8", errors="replace")
    if out.strip():
        sys.stdout.write(out)
    err = stderr.read().decode("utf-8", errors="replace")
    if err.strip():
        sys.stderr.write(err)
    if stdout.channel.recv_exit_status() != 0:
        client.close()
        sys.exit("SQL falló")
    client.close()

    test_login("teamregistro", "41683")


if __name__ == "__main__":
    main()
