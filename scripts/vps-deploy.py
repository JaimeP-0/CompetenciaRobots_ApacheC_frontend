# -*- coding: utf-8 -*-
"""
Sube SOLO este proyecto (Competencia de Robots) al VPS.
No clona ni actualiza otros repos (p. ej. robot en /var/www/robot).
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parents[1]
HOST = os.environ.get("CR_SSH_HOST", "2.25.159.127")
USER = os.environ.get("CR_SSH_USER", "root")
PASSWORD = os.environ.get("CR_SSH_PASSWORD", "")
PUBLIC_URL = os.environ.get("CR_PUBLIC_URL", "https://utarena.online").rstrip("/")
FRONT_REMOTE = os.environ.get("CR_FRONT_REMOTE", "/var/www/competencia-robots")

# Solo lo que nginx y install-front necesitan (evita subir todo el repo).
UPLOAD_DIRS = ("www", "deploy")

SKIP_DIRS = {
    "node_modules",
    ".git",
    "platforms",
    ".cursor",
    ".vscode",
    "backend",
}


def log(msg: str) -> None:
    print(f"[vps-deploy] {msg}", file=sys.stderr)


def should_skip(rel: Path) -> bool:
    parts = rel.parts
    if parts and parts[0] in SKIP_DIRS:
        return True
    if parts and parts[0] == "plugins" and "www" not in parts:
        return True
    return any(p in SKIP_DIRS for p in parts)


def build_front() -> None:
    import subprocess

    log("npm run build:vps …")
    r = subprocess.run(
        ["npm", "run", "build:vps"],
        cwd=ROOT,
        shell=True,
        check=False,
    )
    if r.returncode != 0:
        sys.exit(r.returncode or 1)


def upload_tree(sftp: paramiko.SFTPClient, local: Path, remote: str) -> int:
    remote = remote.rstrip("/")
    count = 0

    def ensure_dir(path: str) -> None:
        parts = [p for p in path.split("/") if p]
        cur = ""
        for p in parts:
            cur += "/" + p
            try:
                sftp.stat(cur)
            except OSError:
                sftp.mkdir(cur)

    for root, dirs, files in os.walk(local):
        rel_root = Path(root).relative_to(local)
        if should_skip(rel_root):
            dirs[:] = []
            continue
        dirs[:] = [d for d in dirs if not should_skip(rel_root / d)]
        rdir = remote if str(rel_root) == "." else remote + "/" + rel_root.as_posix()
        ensure_dir(rdir.lstrip("/"))
        for name in files:
            rel = rel_root / name
            if should_skip(rel):
                continue
            local_file = Path(root) / name
            remote_file = rdir + "/" + name
            sftp.put(str(local_file), remote_file)
            count += 1
    return count


def run_ssh(client: paramiko.SSHClient, cmd: str) -> None:
    log("> " + cmd[:120] + ("…" if len(cmd) > 120 else ""))
    _, stdout, stderr = client.exec_command(cmd, get_pty=True)
    for line in stdout:
        sys.stdout.buffer.write(line.encode("utf-8", errors="replace"))
    err = stderr.read().decode("utf-8", errors="replace")
    if err.strip():
        sys.stderr.write(err)
    code = stdout.channel.recv_exit_status()
    if code != 0:
        raise RuntimeError(f"Comando remoto falló ({code})")


def load_dotenv() -> None:
    env_path = ROOT / ".env"
    if not env_path.is_file():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, val = line.split("=", 1)
        key = key.strip()
        val = val.strip().strip('"').strip("'")
        os.environ.setdefault(key, val)


def main() -> None:
    load_dotenv()
    password = os.environ.get("CR_SSH_PASSWORD", PASSWORD)
    if not password:
        log("Falta CR_SSH_PASSWORD (contraseña SSH del VPS).")
        log('  PowerShell: $env:CR_SSH_PASSWORD="..."; npm run deploy:vps')
        sys.exit(1)

    build_front()

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    log(f"Conectando a {USER}@{HOST} …")
    client.connect(
        HOST,
        username=USER,
        password=password,
        timeout=60,
        allow_agent=True,
        look_for_keys=True,
    )

    run_ssh(client, f"mkdir -p {FRONT_REMOTE}")

    sftp = client.open_sftp()
    total = 0
    for sub in UPLOAD_DIRS:
        local_dir = ROOT / sub
        if not local_dir.is_dir():
            log(f"Omitido (no existe): {sub}/")
            continue
        remote_dir = f"{FRONT_REMOTE.rstrip('/')}/{sub}"
        log(f"Subiendo {sub}/ → {remote_dir}")
        total += upload_tree(sftp, local_dir, remote_dir)
    sftp.close()
    log(f"Archivos subidos: {total}")

    install = (
        f'export CR_FRONT_ROOT="{FRONT_REMOTE}" '
        f'CR_PUBLIC_URL="{PUBLIC_URL}" && '
        f'chmod +x "{FRONT_REMOTE}/deploy/vps/install-front-on-server.sh" && '
        f'bash "{FRONT_REMOTE}/deploy/vps/install-front-on-server.sh"'
    )
    run_ssh(client, install)

    client.close()
    log("")
    log(f"Listo (solo front) → {PUBLIC_URL}/")


if __name__ == "__main__":
    main()
