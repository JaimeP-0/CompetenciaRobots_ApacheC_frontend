# -*- coding: utf-8 -*-
"""Compara hashes en VPS con los esperados y prueba POST /login."""
from __future__ import annotations

import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parents[1]
CRED = ROOT / "deploy" / "vps" / "credenciales-evento.private.md"
SEED = ROOT / "deploy" / "vps" / "seed-users.sql"


def load_dotenv() -> None:
    p = ROOT / ".env"
    if not p.is_file():
        return
    for line in p.read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.strip().startswith("#"):
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def expected_hashes() -> dict[str, str]:
    text = SEED.read_text(encoding="utf-8")
    out: dict[str, str] = {}
    pat = re.compile(
        r"\(\s*(?:\d+,\s*)?'([^']+)',\s*'[^']*',\s*'[^']*',\s*'(\$2b\$[^']+)'\)"
    )
    for m in pat.finditer(text):
        out[m.group(1)] = m.group(2)
    return out


def expected_passwords() -> dict[str, str]:
    text = CRED.read_text(encoding="utf-8")
    out: dict[str, str] = {}
    for line in text.splitlines():
        if not line.startswith("|") or "`" not in line:
            continue
        parts = [p.strip() for p in line.split("|")]
        if len(parts) < 7 or not parts[1].isdigit():
            continue
        user_m = re.search(r"`([^`]+)`", parts[2])
        pwd_m = re.search(r"`([^`]+)`", parts[5])
        if user_m and pwd_m:
            out[user_m.group(1)] = pwd_m.group(1)
    return out


def fetch_db_hashes(client: paramiko.SSHClient) -> dict[str, str]:
    container = os.environ.get("CR_PG_CONTAINER", "robot-postgres")
    pg_user = os.environ.get("POSTGRES_USER", "robot")
    pg_db = os.environ.get("POSTGRES_DB", "robot")
    cmd = (
        f"docker exec -i {container} psql -U {pg_user} -d {pg_db} -t -A -F'|' "
        "-c \"SELECT username, password_hash FROM user_account ORDER BY username;\""
    )
    _, stdout, _ = client.exec_command(cmd)
    out: dict[str, str] = {}
    for line in stdout.read().decode("utf-8", errors="replace").splitlines():
        if "|" not in line:
            continue
        user, h = line.split("|", 1)
        out[user.strip()] = h.strip()
    return out


def try_login(base: str, username: str, password: str) -> tuple[bool, str]:
    url = base.rstrip("/") + "/login"
    body = json.dumps({"username": username, "password": password}).encode()
    req = urllib.request.Request(
        url, data=body, headers={"Content-Type": "application/json"}, method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return 200 <= resp.status < 300, f"HTTP {resp.status}"
    except urllib.error.HTTPError as exc:
        return False, f"HTTP {exc.code}"
    except Exception as exc:  # noqa: BLE001
        return False, str(exc)


def main() -> None:
    load_dotenv()
    pw = os.environ.get("CR_SSH_PASSWORD", "")
    if not pw:
        sys.exit("CR_SSH_PASSWORD requerida")
    host = os.environ.get("CR_SSH_HOST", "2.25.159.127")
    api_base = os.environ.get("CR_PUBLIC_URL", "https://utarena.online")

    exp_h = expected_hashes()
    exp_p = expected_passwords()
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=os.environ.get("CR_SSH_USER", "root"), password=pw, timeout=60)
    db = fetch_db_hashes(client)
    client.close()

    mismatch = []
    missing = []
    for user, eh in sorted(exp_h.items()):
        if user not in db:
            missing.append(user)
            continue
        if db[user] != eh:
            mismatch.append(user)

    print("=== Hashes en BD vs seed-users.sql ===")
    if missing:
        print("Faltan en BD:", ", ".join(missing))
    if mismatch:
        print("Hash distinto:", ", ".join(mismatch))
    if not missing and not mismatch:
        print("OK: todos los hashes coinciden con seed-users.sql")

    samples = ["admin", "felix.macias", "teamregistro", "visitante"]
    print("\n=== Prueba POST /login ===")
    for user in samples:
        pwd = exp_p.get(user, "")
        ok, detail = try_login(api_base, user, pwd)
        status = "OK" if ok else "FALLO"
        print(f"  {user}: {status} ({detail})")

    if mismatch or missing:
        sys.exit(1)


if __name__ == "__main__":
    main()
