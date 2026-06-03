# -*- coding: utf-8 -*-
"""Ejecuta install-on-server.sh (API+DB+nginx). No sube archivos. Uso puntual en el VPS."""
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


def main():
    load_dotenv()
    host = os.environ.get("CR_SSH_HOST", "2.25.159.127")
    user = os.environ.get("CR_SSH_USER", "root")
    pw = os.environ.get("CR_SSH_PASSWORD", "")
    front = os.environ.get("CR_FRONT_REMOTE", "/var/www/competencia-robots")
    public = os.environ.get("CR_PUBLIC_URL", "http://2.25.159.127").rstrip("/")
    if not pw:
        print("CR_SSH_PASSWORD requerida", file=sys.stderr)
        sys.exit(1)
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(host, username=user, password=pw, timeout=60)
    cmd = (
        f'export CR_FRONT_ROOT="{front}" CR_PUBLIC_URL="{public}" && '
        f'chmod +x "{front}/deploy/vps/install-on-server.sh" && '
        f'bash "{front}/deploy/vps/install-on-server.sh"'
    )
    _, stdout, stderr = c.exec_command(cmd, get_pty=True)
    for line in stdout:
        sys.stdout.buffer.write(line.encode("utf-8", errors="replace"))
    err = stderr.read().decode()
    if err:
        sys.stderr.write(err)
    code = stdout.channel.recv_exit_status()
    c.close()
    sys.exit(code)


if __name__ == "__main__":
    main()
