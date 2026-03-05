#!/usr/bin/env bash
# update-site-stats.sh — Updates wyltek-industries landing page stats daily
# Counts: board targets, sensor drivers, public repos
# Run from HEARTBEAT once per day

set -e

SITE="/home/phill/workspace/wyltek-industries-site"
BUILDER="/home/phill/workspace/wyltek-embedded-builder"
INDEX="$SITE/index.html"

echo "[stats] Counting..."

# Board targets: WY_BOARD_NAME entries in boards.h
BOARDS=$(grep -c "WY_BOARD_NAME" "$BUILDER/src/boards.h" 2>/dev/null || echo 0)

# Sensor drivers: .h files in sensors/drivers/ minus template
SENSOR_ALL=$(ls "$BUILDER/src/sensors/drivers/"*.h 2>/dev/null | wc -l)
SENSORS=$((SENSOR_ALL - 1))  # subtract WyDriverTemplate.h

# Public repos via gh CLI
REPOS=$(gh repo list toastmanAu --limit 200 --json isPrivate 2>/dev/null | \
  python3 -c "import json,sys; repos=json.load(sys.stdin); print(sum(1 for r in repos if not r['isPrivate']))" 2>/dev/null || echo 0)

echo "[stats] Boards: $BOARDS | Sensors: $SENSORS | Public repos: $REPOS"

# Update hero stat cards (lines ~401-410)
python3 << PYEOF
import re

with open('$INDEX', 'r') as f:
    content = f.read()

boards = $BOARDS
sensors = $SENSORS
repos = $REPOS

# Patch stat-card numbers — match the label to find the right card
def patch_stat(html, label, new_val):
    # Find stat-num immediately before the given stat-label
    pattern = r'(<div class="stat-num">)([^<]+)(</div>\s*<div class="stat-label">' + re.escape(label) + r'</div>)'
    replacement = rf'\g<1>{new_val}\g<3>'
    return re.sub(pattern, replacement, html)

content = patch_stat(content, 'Sensor drivers', f'{sensors}+')
content = patch_stat(content, 'Board targets', str(boards))
content = patch_stat(content, 'Public repos', f'{repos}+')

# Also patch the feature description line in the embedded-builder card
content = re.sub(
    r'\d+\+ sensor drivers, \d+ board targets',
    f'{sensors}+ sensor drivers, {boards} board targets',
    content
)

# Patch feat-point line too
content = re.sub(
    r'\d+ board targets —',
    f'{boards} board targets —',
    content
)

with open('$INDEX', 'w') as f:
    f.write(content)

print(f'[stats] Patched: {sensors}+ sensors, {boards} boards, {repos}+ repos')
PYEOF

# Commit and push if anything changed
cd "$SITE"

# Sync research findings
FINDINGS_SRC="/home/phill/.openclaw/workspace/research/findings"
FINDINGS_DEST="$SITE/research"
mkdir -p "$FINDINGS_DEST"
rsync -a --delete "$FINDINGS_SRC"/ "$FINDINGS_DEST"/
echo "[stats] Research findings synced"

if ! git diff --quiet || git status --short | grep -q "research/"; then
    git add index.html research/
    git commit -m "stats: boards=$BOARDS sensors=$SENSORS repos=$REPOS + findings sync [auto]"
    git push
    echo "[stats] Pushed update to GitHub"
else
    echo "[stats] No changes, skipping commit"
fi
