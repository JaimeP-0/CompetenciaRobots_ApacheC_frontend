# -*- coding: utf-8 -*-
"""Sube JS al VPS y actualiza viewCacheBust."""
import os
import re
import sys
import time
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parents[1]
FILES = [
    "www/js/routes.js",
    "www/js/app.js",
    "www/js/core/queue-routes.js",
    "www/js/core/nav-history.js",
    "www/js/auth/staff-auth.js",
    "www/js/catalog/vista-login-staff.js",
    "www/js/catalog/catalog.js",
    "www/js/admin/admin.js",
    "www/js/registro/pantalla-registrar.js",
    "www/index.html",
    "www/views/public/match.html",
    "www/views/registro/registrar.html",
]
REMOTE_ROOT = "/var/www/competencia-robots"
CONFIG = f"{REMOTE_ROOT}/www/js/config.local.js"


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
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(os.environ.get("CR_SSH_HOST", "2.25.159.127"), username="root", password=pw, timeout=60)
    sftp = c.open_sftp()
    for rel in FILES:
        local = ROOT / rel
        remote = f"{REMOTE_ROOT}/{rel.replace(chr(92), '/')}"
        sftp.put(str(local), remote)
        print("OK", rel)
    sftp.close()
    bust = str(int(time.time()))
    _, stdout, _ = c.exec_command(f"cat {CONFIG}")
    text = stdout.read().decode("utf-8", errors="replace")
    text = re.sub(r"viewCacheBust:\s*'[^']*'", f"viewCacheBust: '{bust}'", text)
    sftp = c.open_sftp()
    with sftp.open(CONFIG, "w") as f:
        f.write(text.encode("utf-8"))
    sftp.close()
    c.close()
    print("cache", bust)


if __name__ == "__main__":
    main()
