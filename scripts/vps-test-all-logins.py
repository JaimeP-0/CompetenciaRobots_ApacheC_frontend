# -*- coding: utf-8 -*-
"""Prueba POST /login para todos los usuarios del evento."""
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from credenciales_parse import parse_credentials


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
