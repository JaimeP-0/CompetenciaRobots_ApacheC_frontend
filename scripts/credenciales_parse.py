# -*- coding: utf-8 -*-
"""Parsea deploy/vps/credenciales-evento.private.md → {username: password}."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CRED = ROOT / "deploy" / "vps" / "credenciales-evento.private.md"


def parse_credentials():
    users = {}
    for line in CRED.read_text(encoding="utf-8").splitlines():
        parts = [p.strip() for p in line.split("|")]
        if len(parts) < 6 or not parts[1].isdigit():
            continue
        username = parts[2].strip("` ").strip()
        password = parts[5].strip("` ").strip()
        if username and password:
            users[username] = password
    return users


def parse_hashes_from_seed():
    text = (ROOT / "deploy" / "vps" / "seed-users.sql").read_text(encoding="utf-8")
    hashes = {}
    pat = re.compile(
        r"\(\d+,\s*'([^']+)',\s*'[^']*',\s*'[^']*',\s*'(\$2b\$[^']+)'\)"
    )
    for m in pat.finditer(text):
        hashes[m.group(1)] = m.group(2)
    return hashes
