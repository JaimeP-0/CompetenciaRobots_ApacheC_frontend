# -*- coding: utf-8 -*-
"""Prueba POST /login para todos los usuarios del evento."""
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CRED = ROOT / "deploy" / "vps" / "credenciales-evento.private.md"


def parse_credentials():
    text = CRED.read_text(encoding="utf-8")
    users = {}
    for line in text.splitlines():
        m = re.match(r"\|\s*`([^`]+)`\s*\|[^|]+\|\s*`([^`]+)`\s*\|", line)
        if m:
            users[m.group(1)] = m.group(2)
    return users


def try_login(base: str, username: str, password: str):
    url = base.rstrip("/") + "/login"
    req = urllib.request.Request(
        url,
        data=json.dumps({"username": username, "password": password}).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            body = json.loads(resp.read().decode())
            return True, body.get("role", "?")
    except urllib.error.HTTPError as exc:
        return False, f"HTTP {exc.code}"


def main():
    base = os.environ.get("CR_PUBLIC_URL", "https://utarena.online")
    creds = parse_credentials()
    fail = []
    for user, pwd in sorted(creds.items()):
        ok, detail = try_login(base, user, pwd)
        mark = "OK" if ok else "FALLO"
        print(f"  {user}: {mark} ({detail})")
        if not ok:
            fail.append(user)
    if fail:
        sys.exit(1)
    print(f"\n{len(creds)} logins OK en {base}")


if __name__ == "__main__":
    main()
