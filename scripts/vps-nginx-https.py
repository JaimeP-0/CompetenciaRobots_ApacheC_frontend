# -*- coding: utf-8 -*-
"""Backup, aplica HTTPS en nginx, prueba y verifica :443."""
import os
import sys
from datetime import datetime
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parents[1]
CONF_LOCAL = ROOT / "deploy" / "nginx" / "competencia-robots.conf"
REMOTE_SITE = "/etc/nginx/sites-available/competencia-robots"
PUBLIC_URL = os.environ.get("CR_PUBLIC_URL", "https://utarena.online").rstrip("/")


def load_dotenv():
    p = ROOT / ".env"
    if not p.is_file():
        return
    for line in p.read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.strip().startswith("#"):
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"'))


def run(client, cmd):
    print(">", cmd[:100], file=sys.stderr)
    _, stdout, stderr = client.exec_command(cmd, get_pty=True)
    for line in stdout:
        sys.stdout.buffer.write(line.encode("utf-8", errors="replace"))
    err = stderr.read().decode("utf-8", errors="replace")
    if err.strip():
        sys.stderr.write(err)
    code = stdout.channel.recv_exit_status()
    if code != 0:
        raise RuntimeError(f"Falló ({code}): {cmd}")


def main():
    load_dotenv()
    pw = os.environ.get("CR_SSH_PASSWORD", "")
    host = os.environ.get("CR_SSH_HOST", "2.25.159.127")
    if not pw:
        sys.exit("CR_SSH_PASSWORD requerida")
    if not CONF_LOCAL.is_file():
        sys.exit(f"No existe {CONF_LOCAL}")

    ts = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    backup = f"{REMOTE_SITE}.bak-{ts}"

    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(host, username="root", password=pw, timeout=60)

    sftp = c.open_sftp()
    run(c, f"cp -a {REMOTE_SITE} {backup} 2>/dev/null || true")
    print(f"Backup: {backup}", file=sys.stderr)
    sftp.put(str(CONF_LOCAL), REMOTE_SITE)
    sftp.close()

    run(c, "nginx -t")
    run(
        c,
        "systemctl enable nginx && "
        "( systemctl is-active --quiet nginx && systemctl reload nginx || systemctl restart nginx )",
    )
    run(c, "ss -tulpn | grep ':443' || true")
    run(c, "systemctl is-active nginx")

    # config.local.js con URL HTTPS
    front = os.environ.get("CR_FRONT_REMOTE", "/var/www/competencia-robots")
    run(
        c,
        f"""cat > {front}/www/js/config.local.js <<'EOF'
(function (w) {{
    'use strict';
    w.CR_API_OVERRIDES = {{
        apiProfile: 'vps',
        publicUrl: '{PUBLIC_URL}',
        diagFeedKey: 'cr-diag-utarena-x7k9m2'
    }};
}})(window);
EOF""",
    )

    c.close()
    print(f"\nOK → {PUBLIC_URL}/", file=sys.stderr)


if __name__ == "__main__":
    main()
