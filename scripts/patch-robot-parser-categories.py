# -*- coding: utf-8 -*-
"""Alinea nombres de categoría en parser.go con la BD tras import de equipos."""
import os
import sys
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parents[1]
LOCAL = ROOT / "deploy" / "robot" / "internal" / "excel" / "parser.go"
REMOTE = "/var/www/robot/internal/excel/parser.go"

REPLACEMENTS = (
    ('Category: "Velocista"', 'Category: "Seguidor de línea velocista"'),
    ('Category: "Futbol"', 'Category: "Fútbol"'),
)


def load_dotenv() -> None:
    p = ROOT / ".env"
    if not p.is_file():
        return
    for line in p.read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.strip().startswith("#"):
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"'))


def patch_text(text: str) -> str:
    out = text
    for old, new in REPLACEMENTS:
        out = out.replace(old, new)
    return out


def main() -> None:
    load_dotenv()
    pw = os.environ.get("CR_SSH_PASSWORD", "")
    if not pw:
        sys.exit("CR_SSH_PASSWORD requerida en .env")

    if not LOCAL.is_file():
        sys.exit(f"No existe {LOCAL}")

    text = LOCAL.read_text(encoding="utf-8")
    host = os.environ.get("CR_SSH_HOST", "2.25.159.127")
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(host, username=os.environ.get("CR_SSH_USER", "root"), password=pw, timeout=60)
    sftp = c.open_sftp()
    sftp.put(str(LOCAL), REMOTE)
    sftp.close()
    print(f"Subido {LOCAL.name} → {REMOTE}")
    c.close()


if __name__ == "__main__":
    main()
