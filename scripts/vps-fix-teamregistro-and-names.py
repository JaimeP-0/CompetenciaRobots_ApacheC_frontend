# -*- coding: utf-8 -*-
"""Restaura teamregistro + nombres oficiales staff; verifica login."""
import json
import os
import sys
import urllib.error
import urllib.request
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


def run_sql_files(client: paramiko.SSHClient, files: list[Path]) -> None:
    container = os.environ.get("CR_PG_CONTAINER", "robot-postgres")
    pg_user = os.environ.get("POSTGRES_USER", "robot")
    pg_db = os.environ.get("POSTGRES_DB", "robot")
    front = os.environ.get("CR_FRONT_REMOTE", "/var/www/competencia-robots")
    sftp = client.open_sftp()
    for local in files:
        rel = local.relative_to(ROOT).as_posix()
        remote = f"{front}/{rel}"
        sftp.put(str(local), remote)
        cmd = (
            f'docker exec -i {container} psql -U {pg_user} -d {pg_db} '
            f'-v ON_ERROR_STOP=1 < "{remote}"'
        )
        print(f"==> {local.name}", file=sys.stderr)
        _, stdout, stderr = client.exec_command(cmd, get_pty=True)
        out = stdout.read().decode("utf-8", errors="replace")
        if out.strip():
            sys.stdout.write(out)
        err = stderr.read().decode("utf-8", errors="replace")
        if err.strip():
            sys.stderr.write(err)
        if stdout.channel.recv_exit_status() != 0:
            raise RuntimeError(f"Falló {local.name}")
    sftp.close()


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
        print(f"LOGIN {user}: FALLO HTTP {exc.code} {exc.read().decode()[:120]}")


def main() -> None:
    load_dotenv()
    pw = os.environ.get("CR_SSH_PASSWORD", "")
    if not pw:
        sys.exit("CR_SSH_PASSWORD requerida")

    files = [
        ROOT / "deploy" / "vps" / "fix-teamregistro-only.sql",
        ROOT / "deploy" / "vps" / "restore-event-passwords.sql",
        ROOT / "deploy" / "vps" / "update-user-names.sql",
    ]
    for f in files:
        if not f.is_file():
            sys.exit(f"No existe {f}")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        os.environ.get("CR_SSH_HOST", "2.25.159.127"),
        username=os.environ.get("CR_SSH_USER", "root"),
        password=pw,
        timeout=60,
    )
    run_sql_files(client, files)
    client.close()

    test_login("teamregistro", "41683")
    test_login("felix.macias", "91740")


if __name__ == "__main__":
    main()
