# -*- coding: utf-8 -*-
"""Sube parches Go (deploy/robot/) al VPS, compila robot-api y reinicia."""
from __future__ import annotations

import os
import sys
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parents[1]
PATCH_ROOT = ROOT / "deploy" / "robot"
ROBOT_REMOTE = os.environ.get("CR_ROBOT_REMOTE", "/var/www/robot")
HOST = os.environ.get("CR_SSH_HOST", "2.25.159.127")
USER = os.environ.get("CR_SSH_USER", "root")


def log(msg: str) -> None:
    print(f"[vps-deploy-robot] {msg}", file=sys.stderr)


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


def upload_tree(sftp: paramiko.SFTPClient, local: Path, remote: str) -> int:
    count = 0
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
            local_file = Path(root) / name
            remote_file = rdir + "/" + name
            sftp.put(str(local_file), remote_file)
            count += 1
    return count


def run_ssh(client: paramiko.SSHClient, cmd: str) -> None:
    log("> " + cmd[:140] + ("…" if len(cmd) > 140 else ""))
    _, stdout, stderr = client.exec_command(cmd, get_pty=True)
    out = stdout.read().decode("utf-8", errors="replace")
    if out.strip():
        sys.stdout.write(out)
    err = stderr.read().decode("utf-8", errors="replace")
    if err.strip():
        sys.stderr.write(err)
    code = stdout.channel.recv_exit_status()
    if code != 0:
        raise RuntimeError(f"Comando remoto falló ({code})")


def main() -> None:
    load_dotenv()
    password = os.environ.get("CR_SSH_PASSWORD", "")
    if not password:
        log("Falta CR_SSH_PASSWORD")
        sys.exit(1)
    if not PATCH_ROOT.is_dir():
        log(f"No existe {PATCH_ROOT}")
        sys.exit(1)

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    log(f"Conectando a {USER}@{HOST} …")
    client.connect(HOST, username=USER, password=password, timeout=60)

    sftp = client.open_sftp()
    total = upload_tree(sftp, PATCH_ROOT, ROBOT_REMOTE)
    sftp.close()
    log(f"Archivos Go subidos: {total}")

    diag_key = os.environ.get("CR_DIAG_KEY", "cr-diag-utarena-x7k9m2")
    build_cmd = (
        f'cd "{ROBOT_REMOTE}" && '
        f'grep -q "^CR_DIAG_KEY=" .env 2>/dev/null || echo "CR_DIAG_KEY={diag_key}" >> .env && '
        f'go build -o /usr/local/bin/robot-api ./cmd/server && '
        f'systemctl restart robot-api && '
        f'sleep 1 && systemctl is-active robot-api'
    )
    run_ssh(client, build_cmd)
    client.close()
    log("robot-api reiniciado.")


if __name__ == "__main__":
    main()
