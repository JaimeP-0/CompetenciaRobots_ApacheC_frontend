# -*- coding: utf-8 -*-
"""Sube config.local.js de producción al VPS."""
import os
import re
import sys
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "deploy" / "vps" / "config.local.vps.js"
REMOTE = "/var/www/competencia-robots/www/js/config.local.js"


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
    if not SRC.is_file():
        sys.exit(f"No existe {SRC}")

    url = os.environ.get("CR_PUBLIC_URL", "https://utarena.online").rstrip("/")
    text = SRC.read_text(encoding="utf-8")
    text = re.sub(r"https?://[^'\"]+", url, text)
    import time

    bust = str(int(time.time()))
    text = re.sub(r"viewCacheBust:\s*'[^']*'", f"viewCacheBust: '{bust}'", text)

    host = os.environ.get("CR_SSH_HOST", "2.25.159.127")
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(host, username=os.environ.get("CR_SSH_USER", "root"), password=pw, timeout=60)
    sftp = c.open_sftp()
    with sftp.open(REMOTE, "w") as f:
        f.write(text.encode("utf-8"))
    sftp.close()
    c.close()
    print(f"OK → {REMOTE} (adminLoginMock: false, cache {bust})")


if __name__ == "__main__":
    main()
