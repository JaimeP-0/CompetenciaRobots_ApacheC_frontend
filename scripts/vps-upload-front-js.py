# -*- coding: utf-8 -*-
"""Sube archivos JS concretos al front en el VPS."""
import os
import sys
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parents[1]
FILES = sys.argv[1:] or [
    "www/js/auth/staff-auth.js",
    "www/js/auth/staff-sesion.js",
    "www/js/core/team-origin.js",
    "www/js/core/queue-routes.js",
]


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
    base = os.environ.get("CR_FRONT_REMOTE", "/var/www/competencia-robots")
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(host, username="root", password=pw, timeout=60)
    sftp = c.open_sftp()
    for rel in FILES:
        local = ROOT / rel
        if not local.is_file():
            print("omitido (no existe):", rel)
            continue
        remote = base + "/" + rel.replace("\\", "/")
        parent = remote.rsplit("/", 1)[0]
        try:
            sftp.stat(parent)
        except OSError:
            c.exec_command(f"mkdir -p '{parent}'")
        sftp.put(str(local), remote)
        print("ok", remote)
    sftp.close()
    c.close()


if __name__ == "__main__":
    main()
