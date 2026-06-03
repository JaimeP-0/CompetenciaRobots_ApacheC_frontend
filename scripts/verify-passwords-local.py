# -*- coding: utf-8 -*-
"""Verifica que los hashes del repo coinciden con credenciales-evento.private.md."""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from credenciales_parse import parse_credentials, parse_hashes_from_seed


def check_bcrypt(password: str, hash_: str) -> bool:
    try:
        import bcrypt
        return bcrypt.checkpw(password.encode(), hash_.encode())
    except ImportError:
        # fallback node if bcrypt not installed
        js = (
            "const b=require('bcryptjs');"
            f"console.log(b.compareSync({password!r},{hash_!r}));"
        )
        r = subprocess.run(["node", "-e", js], capture_output=True, text=True, cwd=ROOT)
        return r.stdout.strip() == "true"


def main():
    creds = parse_credentials()
    hashes = parse_hashes_from_seed()
    bad = []
    for user, pwd in sorted(creds.items()):
        h = hashes.get(user)
        if not h:
            bad.append((user, "sin hash en seed-users.sql"))
            continue
        if not check_bcrypt(pwd, h):
            bad.append((user, "hash no coincide con contraseña del .md"))
    if bad:
        print("FALLO local:")
        for u, why in bad:
            print(f"  {u}: {why}")
        sys.exit(1)
    print(f"OK: {len(creds)} usuarios — hashes del repo coinciden con credenciales-evento.private.md")


if __name__ == "__main__":
    main()
