#!/bin/bash
# backup.sh — Pi 5 critical files backup
# Runs to: EliteDesk ~/backups/pi5/
# Also pushes workspace to GitHub

set -e
ELITEDESK="phill@192.168.68.97"
BACKUP_DIR="~/backups/pi5"
LOG="/tmp/backup.log"
DATE=$(date +%Y-%m-%d_%H-%M)

echo "[$DATE] Starting backup..." | tee -a $LOG

# 1. Push workspace to GitHub
echo "[1/3] Pushing workspace to GitHub..." | tee -a $LOG
cd /home/phill/.openclaw/workspace
git add -A
if git diff --cached --quiet; then
    echo "  No changes to commit" | tee -a $LOG
else
    git commit -m "auto-backup: $DATE"
    git push origin master
    echo "  Pushed to GitHub" | tee -a $LOG
fi

# 2. Rsync critical configs to EliteDesk
echo "[2/3] Rsyncing configs to EliteDesk..." | tee -a $LOG
rsync -az --delete \
    /home/phill/.openclaw/openclaw.json \
    /home/phill/.openclaw/credentials/ \
    /home/phill/.openclaw/devices/ \
    /home/phill/.openclaw/identity/ \
    ${ELITEDESK}:${BACKUP_DIR}/openclaw-config/

# Service configs (gitignored secrets)
rsync -az \
    /home/phill/ckb-stratum-proxy/config.json \
    /home/phill/ckb-whale-bot/config.json \
    /home/phill/ckb-chat-bridge/.env \
    ${ELITEDESK}:${BACKUP_DIR}/service-configs/ 2>/dev/null || true

# SSH keys
rsync -az \
    /home/phill/.ssh/ \
    ${ELITEDESK}:${BACKUP_DIR}/ssh/ 2>/dev/null || true

echo "  Rsync done" | tee -a $LOG

# 3. Verify
echo "[3/3] Verifying EliteDesk backup..." | tee -a $LOG
ssh ${ELITEDESK} "ls -la ${BACKUP_DIR}/" | tee -a $LOG

echo "[$DATE] Backup complete ✓" | tee -a $LOG
