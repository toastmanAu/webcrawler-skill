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

# Sync research findings — exclude private/strategic files
FINDINGS_SRC="/home/phill/.openclaw/workspace/research/findings"
FINDINGS_DEST="$SITE/research"
mkdir -p "$FINDINGS_DEST"
rsync -a --delete \
  --exclude="stack-gap-analysis*.md" \
  --exclude="*-synthesis*.md" \
  --exclude="*-gap-analysis*.md" \
  --exclude="nervos-wyltek-*.md" \
  --exclude="supabase-*.md" \
  --exclude="wyltek-membership-*.md" \
  --exclude="sidecar-secure-key-*.md" \
  --exclude="fiberquest-hackathon-*.md" \
  --exclude="fiber-hackathon-*.md" \
  "$FINDINGS_SRC"/ "$FINDINGS_DEST"/
echo "[stats] Research findings synced (private files excluded)"

# Remove any already-committed sensitive files
for pattern in "stack-gap-analysis" "synthesis" "gap-analysis" "nervos-wyltek" "supabase-" "wyltek-membership" "sidecar-secure-key" "hackathon"; do
  find "$FINDINGS_DEST" -name "*${pattern}*" -delete 2>/dev/null || true
done

# Filename normalization — ensure every DONE queue task ID has a matching findings file on site.
# Some findings are named differently to their queue ID (e.g. ckb-snapshot-infra vs ckb-snapshot-infrastructure).
# Map: queue-id → local findings filename (without .md)
QUEUE_SRC="/home/phill/.openclaw/workspace/research/queue.md"
python3 << NORMEOF
import re, os, shutil

queue = open('$QUEUE_SRC').read()
findings_src = '$FINDINGS_SRC'
findings_dest = '$FINDINGS_DEST'

# Parse all DONE task IDs from queue
task_ids = []
for block in re.split(r'\n(?=## \[)', queue):
    m = re.match(r'## \[DONE\] (.+)', block.strip())
    if m:
        task_ids.append(m.group(1).strip())
# last-occurrence wins
seen = {}
for tid in task_ids:
    seen[tid] = True
task_ids = list(seen.keys())

# For each DONE task, if site doesn't have <id>.md, find closest match in findings_src
private = ['stack-gap-analysis','synthesis','gap-analysis','nervos-wyltek',
           'supabase-','wyltek-membership','sidecar-secure-key','hackathon']

fixed = 0
for tid in task_ids:
    dest_file = os.path.join(findings_dest, tid + '.md')
    if os.path.exists(dest_file):
        continue  # already there
    # Skip private
    if any(p in tid for p in private):
        continue
    # Find best match in source: exact, then prefix, then longest common prefix
    src_files = [f for f in os.listdir(findings_src) if f.endswith('.md')]
    match = None
    # Try prefix match (queue id starts with findings filename stem)
    for sf in src_files:
        stem = sf[:-3]
        if tid.startswith(stem) or stem.startswith(tid[:12]):
            match = sf
            break
    if match:
        shutil.copy(os.path.join(findings_src, match), dest_file)
        print(f'[norm] {match} → {tid}.md')
        fixed += 1
    else:
        # Write a thin stub so viewer never 404s
        with open(dest_file, 'w') as f:
            f.write(f'# {tid}\n\n> Findings file pending — research completed but source file not yet matched.\n> Will be populated on next crawler run.\n')
        print(f'[norm] stub written: {tid}.md')
        fixed += 1

print(f'[norm] Normalized {fixed} filename mismatches')
NORMEOF

# Regenerate research-tasks.js from queue.md
QUEUE_SRC="/home/phill/.openclaw/workspace/research/queue.md"
python3 << RESEOF
import re, json

with open('$QUEUE_SRC') as f:
    content = f.read()

tasks = {}
blocks = re.split(r'\n(?=## \[)', content)
for block in blocks:
    m = re.match(r'## \[([A-Z_]+)\] (.+)', block.strip())
    if not m: continue
    status_raw, task_id = m.group(1), m.group(2).strip()
    if status_raw == 'DONE': status = 'DONE'
    elif status_raw in ('PENDING', 'NEW_TASK'): status = 'PENDING'
    else: continue
    goal_m = re.search(r'^- goal:\s*(.+)$', block, re.MULTILINE)
    tags_m = re.search(r'^- tags:\s*(.+)$', block, re.MULTILINE)
    prio_m = re.search(r'^- priority:\s*(.+)$', block, re.MULTILINE)
    goal = goal_m.group(1).strip() if goal_m else task_id.replace('-', ' ').title()
    tags = [t.strip() for t in tags_m.group(1).split(',')] if tags_m else []
    priority = prio_m.group(1).strip().upper() if prio_m else 'MEDIUM'
    tasks[task_id] = {'id': task_id, 'status': status, 'priority': priority, 'goal': goal, 'tags': tags}

order = {'HIGH': 0, 'MEDIUM': 1, 'LOW': 2, 'SYNTHESIS': 3}
done = sorted([t for t in tasks.values() if t['status']=='DONE'], key=lambda t: order.get(t['priority'],2))
pending = sorted([t for t in tasks.values() if t['status']=='PENDING'], key=lambda t: order.get(t['priority'],2))
all_tasks = done + pending

lines = [
    "// research-tasks.js — auto-generated from research/queue.md",
    f"// {len(all_tasks)} tasks ({len(done)} done, {len(pending)} pending)",
    "const RESEARCH_TASKS = ["
]
for t in all_tasks:
    lines.append(f"  {json.dumps(t)},")
lines.append("];")

out = '$SITE/js/research-tasks.js'
with open(out, 'w') as f:
    f.write('\n'.join(lines))
print(f"[stats] research-tasks.js: {len(all_tasks)} tasks ({len(done)} done, {len(pending)} pending)")
RESEOF

if ! git diff --quiet || git status --short | grep -q "research/\|js/research-tasks"; then
    git add index.html research/ js/research-tasks.js
    git commit -m "stats: boards=$BOARDS sensors=$SENSORS repos=$REPOS + findings + tasks sync [auto]"
    git push
    echo "[stats] Pushed update to GitHub"
else
    echo "[stats] No changes, skipping commit"
fi
