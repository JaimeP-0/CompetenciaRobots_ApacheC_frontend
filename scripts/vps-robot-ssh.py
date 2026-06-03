# -*- coding: utf-8 -*-
import os
import sys
from pathlib import Path
import paramiko

ROOT = Path(__file__).resolve().parents[1]

def load_dotenv():
    p = ROOT / ".env"
    if p.is_file():
        for line in p.read_text(encoding="utf-8").splitlines():
            if "=" in line and not line.strip().startswith("#"):
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"'))

def main():
    load_dotenv()
    cmd = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "ls -la /var/www/robot/internal/excel/"
    pw = os.environ.get("CR_SSH_PASSWORD", "")
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(os.environ.get("CR_SSH_HOST", "2.25.159.127"), username="root", password=pw, timeout=60)
    _, stdout, stderr = c.exec_command(cmd)
    print(stdout.read().decode())
    err = stderr.read().decode()
    if err:
        print(err, file=sys.stderr)
    sys.exit(stdout.channel.recv_exit_status())

if __name__ == "__main__":
    main()
