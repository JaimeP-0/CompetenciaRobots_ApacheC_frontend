# -*- coding: utf-8 -*-
"""Ajusta createSoloQueueMatch para heredar is_internal del equipo."""
import os
import sys
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parents[1]
REMOTE = "/var/www/robot/internal/service/robot_service.go"

OLD = """func (svc *RobotService) createSoloQueueMatch(ctx context.Context, teamID domain.TeamID) (domain.MatchID, error) {
\tteam, err := svc.teamRepository.FindByID(ctx, teamID)
\tif err != nil {
\t\treturn 0, err
\t}
\tmatch, err := domain.NewQueueMatch(team.CategoryID, []domain.Team{*team})
\tif err != nil {
\t\treturn 0, err
\t}
\treturn svc.matchRepository.Insert(ctx, match)
}"""

NEW = """func (svc *RobotService) createSoloQueueMatch(ctx context.Context, teamID domain.TeamID) (domain.MatchID, error) {
\tteam, err := svc.teamRepository.FindByID(ctx, teamID)
\tif err != nil {
\t\treturn 0, err
\t}
\tmatch, err := domain.NewQueueMatch(team.CategoryID, []domain.Team{*team})
\tif err != nil {
\t\treturn 0, err
\t}
\tmatch.IsInternal = team.IsInternal
\tmatch.BracketID = groupedBracketID("queue", team.IsInternal)
\tmatch.BracketRound = 1
\tmatch.BracketSlot = 0
\tmatch.BracketKey = "r1-m0"
\tmatch.Status = domain.MatchStatusReady
\treturn svc.matchRepository.Insert(ctx, match)
}"""


def load_dotenv():
    p = ROOT / ".env"
    if not p.is_file():
        return
    for line in p.read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.strip().startswith("#"):
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def main():
    load_dotenv()
    pw = os.environ.get("CR_SSH_PASSWORD", "")
    if not pw:
        sys.exit("CR_SSH_PASSWORD requerida")
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(
        os.environ.get("CR_SSH_HOST", "2.25.159.127"),
        username=os.environ.get("CR_SSH_USER", "root"),
        password=pw,
        timeout=60,
    )
    sftp = c.open_sftp()
    with sftp.open(REMOTE, "r") as f:
        text = f.read().decode("utf-8")
    if "match.IsInternal = team.IsInternal" in text:
        print("Ya está aplicado.")
        c.close()
        return
    if OLD not in text:
        sys.exit("No se encontró createSoloQueueMatch esperado.")
    text = text.replace(OLD, NEW, 1)
    with sftp.open(REMOTE, "w") as f:
        f.write(text.encode("utf-8"))
    sftp.close()
    cmd = "cd /var/www/robot && go build -o /usr/local/bin/robot-api ./cmd/server && systemctl restart robot-api && sleep 1 && systemctl is-active robot-api"
    _, stdout, stderr = c.exec_command(cmd, get_pty=True)
    print(stdout.read().decode("utf-8", errors="replace"))
    err = stderr.read().decode("utf-8", errors="replace")
    if err.strip():
        print(err, file=sys.stderr)
    code = stdout.channel.recv_exit_status()
    c.close()
    sys.exit(code)


if __name__ == "__main__":
    main()
