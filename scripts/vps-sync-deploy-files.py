# -*- coding: utf-8 -*-
import os
import sys
from pathlib import Path
import paramiko

ROOT = Path(__file__).resolve().parents[1]
FILES = [
    "deploy/vps/install-on-server.sh",
    "deploy/nginx/competencia-robots.conf",
    "deploy/systemd/robot-api.service",
]


def main():
    p = ROOT / ".env"
    if p.is_file():
        for line in p.read_text(encoding="utf-8").splitlines():
            if "=" in line and not line.strip().startswith("#"):
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"'))
    pw = os.environ.get("CR_SSH_PASSWORD", "")
    if not pw:
        sys.exit("CR_SSH_PASSWORD requerida")
    host = os.environ.get("CR_SSH_HOST", "2.25.159.127")
    front = os.environ.get("CR_FRONT_REMOTE", "/var/www/competencia-robots")
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(host, username="root", password=pw, timeout=60)
    sftp = c.open_sftp()
    for rel in FILES:
        local = ROOT / rel
        remote = front + "/" + rel.replace("\\", "/")
        sftp.put(str(local), remote)
        print("ok", remote)
    sftp.close()
    c.close()


if __name__ == "__main__":
    main()
