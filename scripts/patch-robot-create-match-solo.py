# -*- coding: utf-8 -*-
"""Parchea CreateMatch en el VPS para aceptar cola de un solo equipo (Velocista)."""
import os
import sys
from pathlib import Path

import paramiko

ROOT = Path(__file__).resolve().parents[1]
REMOTE = "/var/www/robot/internal/service/robot_service.go"

OLD = """func (svc *RobotService) CreateMatch(ctx context.Context, teamAID, teamBID domain.TeamID, queueIDs []domain.TeamID) (domain.MatchID, error) {
\tteamA, err := svc.teamRepository.FindByID(ctx, teamAID)
\tif err != nil {
\t\treturn 0, err
\t}

\tteamB, err := svc.teamRepository.FindByID(ctx, teamBID)
\tif err != nil {
\t\treturn 0, err
\t}

\tmatch, err := domain.NewMatch(*teamA, *teamB, teamA.CategoryID)
\tif err != nil {
\t\treturn 0, err
\t}

\tfor _, teamID := range queueIDs {
\t\tteam, err := svc.teamRepository.FindByID(ctx, teamID)
\t\tif err != nil {
\t\t\treturn 0, err
\t\t}
\t\tif err := match.AddToQueue(*team); err != nil {
\t\t\treturn 0, err
\t\t}
\t}

\treturn svc.matchRepository.Insert(ctx, match)
}"""

NEW = """func (svc *RobotService) CreateMatch(ctx context.Context, teamAID, teamBID domain.TeamID, queueIDs []domain.TeamID) (domain.MatchID, error) {
\tif teamBID == 0 && teamAID == 0 && len(queueIDs) == 1 {
\t\treturn svc.createSoloQueueMatch(ctx, queueIDs[0])
\t}
\tif teamBID == 0 && teamAID != 0 && len(queueIDs) == 0 {
\t\treturn svc.createSoloQueueMatch(ctx, teamAID)
\t}

\tteamA, err := svc.teamRepository.FindByID(ctx, teamAID)
\tif err != nil {
\t\treturn 0, err
\t}

\tteamB, err := svc.teamRepository.FindByID(ctx, teamBID)
\tif err != nil {
\t\treturn 0, err
\t}

\tmatch, err := domain.NewMatch(*teamA, *teamB, teamA.CategoryID)
\tif err != nil {
\t\treturn 0, err
\t}

\tfor _, teamID := range queueIDs {
\t\tteam, err := svc.teamRepository.FindByID(ctx, teamID)
\t\tif err != nil {
\t\t\treturn 0, err
\t\t}
\t\tif err := match.AddToQueue(*team); err != nil {
\t\t\treturn 0, err
\t\t}
\t}

\treturn svc.matchRepository.Insert(ctx, match)
}

func (svc *RobotService) createSoloQueueMatch(ctx context.Context, teamID domain.TeamID) (domain.MatchID, error) {
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
    c.connect(os.environ.get("CR_SSH_HOST", "2.25.159.127"), username=os.environ.get("CR_SSH_USER", "root"), password=pw, timeout=60)
    sftp = c.open_sftp()
    with sftp.open(REMOTE, "r") as f:
        text = f.read().decode("utf-8")
    if "createSoloQueueMatch" in text:
        print("Ya parcheado.")
        c.close()
        return
    if OLD not in text:
        sys.exit("CreateMatch no coincide; revisar robot_service.go en el VPS.")
    text = text.replace(OLD, NEW, 1)
    with sftp.open(REMOTE, "w") as f:
        f.write(text.encode("utf-8"))
    sftp.close()
    cmd = f'cd /var/www/robot && go build -o /usr/local/bin/robot-api ./cmd/server && systemctl restart robot-api && sleep 1 && systemctl is-active robot-api'
    _, stdout, stderr = c.exec_command(cmd, get_pty=True)
    print(stdout.read().decode())
    err = stderr.read().decode()
    if err.strip():
        print(err, file=sys.stderr)
    code = stdout.channel.recv_exit_status()
    c.close()
    sys.exit(code)


if __name__ == "__main__":
    main()
