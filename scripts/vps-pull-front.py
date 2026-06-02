# -*- coding: utf-8 -*-
"""En el VPS: git fetch + reset del front (solo este repo). No SFTP."""
import os
import sys
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parents[1]


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
    host = os.environ.get("CR_SSH_HOST", "2.25.159.127")
    front = os.environ.get("CR_FRONT_REMOTE", "/var/www/competencia-robots")
    public = os.environ.get("CR_PUBLIC_URL", "https://utarena.online").rstrip("/")
    repo = os.environ.get(
        "CR_FRONT_GIT_URL",
        "https://github.com/JaimeP-0/CompetenciaRobots_ApacheC_frontend.git",
    )
    branch = os.environ.get("CR_FRONT_BRANCH", "master")

    git_sync = (
        f'cd "{front}" && '
        f'if [ ! -d .git ]; then '
        f'  echo "==> Primera vez: enlazando con origin/{branch} …"; '
        f'  git init && git remote add origin "{repo}" 2>/dev/null '
        f'    || git remote set-url origin "{repo}"; '
        f'  git fetch origin "{branch}" && '
        f'  git reset --hard "origin/{branch}" && git clean -fd; '
        f'else '
        f'  echo "==> git fetch + reset --hard origin/{branch} …"; '
        f'  git fetch origin "{branch}" && '
        f'  git checkout "{branch}" 2>/dev/null '
        f'    || git checkout -B "{branch}" "origin/{branch}"; '
        f'  git reset --hard "origin/{branch}"; '
        f'fi'
    )

    post = (
        f'export CR_FRONT_ROOT="{front}" CR_PUBLIC_URL="{public}" && '
        f'bash "{front}/deploy/vps/pull-front-on-server.sh"'
    )

    cmd = git_sync + " && " + post

    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"Conectando a {host} …", file=sys.stderr)
    c.connect(host, username=os.environ.get("CR_SSH_USER", "root"), password=pw, timeout=120)
    _, stdout, stderr = c.exec_command(cmd, get_pty=True)
    for line in stdout:
        sys.stdout.write(line)
    err = stderr.read().decode("utf-8", errors="replace")
    if err.strip():
        sys.stderr.write(err)
    code = stdout.channel.recv_exit_status()
    c.close()
    if code != 0:
        sys.exit(code)
    print(f"\nOK → {public}/", file=sys.stderr)


if __name__ == "__main__":
    main()
