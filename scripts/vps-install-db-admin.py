# -*- coding: utf-8 -*-
"""Instala Adminer en el VPS (dashboard Postgres)."""
from __future__ import annotations

import os
import sys
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parents[1]
HOST = os.environ.get("CR_SSH_HOST", "2.25.159.127")
USER = os.environ.get("CR_SSH_USER", "root")


def log(msg: str) -> None:
    print(f"[vps-db-admin] {msg}", file=sys.stderr)


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


def upload_tree(sftp: paramiko.SFTPClient, local: Path, remote: str) -> None:
    remote = remote.rstrip("/")

    def ensure_dir(path: str) -> None:
        parts = [p for p in path.split("/") if p]
        cur = ""
        for p in parts:
            cur += "/" + p
            try:
                sftp.stat(cur)
            except OSError:
                sftp.mkdir(cur)

    for root, _, files in os.walk(local):
        rel = Path(root).relative_to(local)
        rdir = remote if str(rel) == "." else remote + "/" + rel.as_posix()
        ensure_dir(rdir.lstrip("/"))
        for name in files:
            sftp.put(str(Path(root) / name), rdir + "/" + name)


def run_ssh(client: paramiko.SSHClient, cmd: str) -> None:
    log("> " + cmd[:140] + ("…" if len(cmd) > 140 else ""))
    _, stdout, stderr = client.exec_command(cmd, get_pty=True)
    out = stdout.read().decode("utf-8", errors="replace")
    if out.strip():
        sys.stdout.write(out)
    err = stderr.read().decode("utf-8", errors="replace")
    if err.strip():
        sys.stderr.write(err)
    if stdout.channel.recv_exit_status() != 0:
        raise RuntimeError("Comando remoto falló")


def main() -> None:
    load_dotenv()
    password = os.environ.get("CR_SSH_PASSWORD", "")
    if not password:
        log("Falta CR_SSH_PASSWORD")
        sys.exit(1)

    front_remote = os.environ.get("CR_FRONT_REMOTE", "/var/www/competencia-robots")
    public_url = os.environ.get("CR_PUBLIC_URL", "https://utarena.online").rstrip("/")
    db_user = os.environ.get("CR_DB_ADMIN_USER", "crdb")
    db_pass = os.environ.get("CR_DB_ADMIN_PASSWORD", "cr-db-utarena-x7k9m2")
    db_path = os.environ.get("CR_DB_ADMIN_PATH", "/cr-internal/db-console-q8m2")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    log(f"Conectando a {USER}@{HOST} …")
    client.connect(HOST, username=USER, password=password, timeout=60)

    sftp = client.open_sftp()
    for sub in ("deploy/nginx", "deploy/vps"):
        local = ROOT / sub
        remote = f"{front_remote}/{sub}"
        log(f"Subiendo {sub}/ …")
        upload_tree(sftp, local, remote)
    sftp.close()

    install = (
        f'export CR_FRONT_ROOT="{front_remote}" CR_PUBLIC_URL="{public_url}" '
        f'CR_DB_ADMIN_USER="{db_user}" CR_DB_ADMIN_PASSWORD="{db_pass}" '
        f'CR_DB_ADMIN_PATH="{db_path}" && '
        f'chmod +x "{front_remote}/deploy/vps/install-db-admin-on-server.sh" && '
        f'bash "{front_remote}/deploy/vps/install-db-admin-on-server.sh"'
    )
    run_ssh(client, install)
    client.close()
    log(f"Listo → {public_url}{db_path}/")


if __name__ == "__main__":
    main()
