# -*- coding: utf-8 -*-
"""
Despliegue del front al VPS (flujo habitual).

1. npm run build:vps  (CSS, config.local.js, cordova browser en www/)
2. git pull en el servidor (scripts/vps-pull-front.py)

Requiere: commit + push antes, y CR_SSH_PASSWORD en .env o entorno.
No toca Postgres ni /var/www/robot — solo el front estático.
"""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PULL_SCRIPT = ROOT / "scripts" / "vps-pull-front.py"


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


def log(msg: str) -> None:
    print(f"[deploy:vps] {msg}", file=sys.stderr)


def run_npm(script: str) -> None:
    log(f"npm run {script} …")
    r = subprocess.run(
        ["npm", "run", script],
        cwd=ROOT,
        shell=True,
        check=False,
    )
    if r.returncode != 0:
        sys.exit(r.returncode or 1)


def main() -> None:
    load_dotenv()
    if not os.environ.get("CR_SSH_PASSWORD", "").strip():
        log("Falta CR_SSH_PASSWORD (SSH del VPS).")
        log('  PowerShell: $env:CR_SSH_PASSWORD="..."; npm run deploy:vps')
        log("  O ponla en .env (no la subas a git).")
        sys.exit(1)

    run_npm("build:vps")

    log("Actualizando front en el VPS (git pull) …")
    r = subprocess.run(
        [sys.executable, str(PULL_SCRIPT)],
        cwd=ROOT,
        check=False,
    )
    if r.returncode != 0:
        sys.exit(r.returncode or 1)

    url = os.environ.get("CR_PUBLIC_URL", "https://utarena.online").rstrip("/")
    log(f"Listo → {url}/")


if __name__ == "__main__":
    main()
