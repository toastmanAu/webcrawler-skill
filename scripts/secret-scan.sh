#!/usr/bin/env bash
# secret-scan.sh — daily check for accidentally committed secrets
# Scans all git repos under ~/workspace/ for secrets in recent commits.
# Silent on clean runs. Sends Telegram alert on findings.
# Usage: secret-scan.sh [days_back=1]

WORKSPACE="${HOME}/workspace"
CHAT_ID="1790655432"
ENV_FILE="${HOME}/.openclaw/.env"
SCAN_DAYS="${1:-1}"
FOUND_ISSUES=()

# ── Bot token ────────────────────────────────────────────────────────────────
BOT_TOKEN=""
[[ -f "$ENV_FILE" ]] && {
  BOT_TOKEN=$(grep -oP '(?<=TELEGRAM_BOT_TOKEN=)[^\s]+' "$ENV_FILE" 2>/dev/null || true)
  [[ -z "$BOT_TOKEN" ]] && BOT_TOKEN=$(grep -oP '(?<=PINCHY_BOT_TOKEN=)[^\s]+' "$ENV_FILE" 2>/dev/null || true)
}

notify() {
  [[ -z "$BOT_TOKEN" ]] && { echo "$1"; return; }
  curl -sf -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
    -d "chat_id=${CHAT_ID}" \
    --data-urlencode "text=$1" \
    -d "parse_mode=HTML" > /dev/null 2>&1 || true
  echo "$1"
}

# ── Patterns ─────────────────────────────────────────────────────────────────
# label|pattern pairs — grep -aE applied to added lines (+) in git diffs
declare -A PATTERNS=(
  ["Private Key"]="-----BEGIN (RSA|EC|DSA|OPENSSH) PRIVATE KEY"
  ["AWS Key"]="AKIA[0-9A-Z]{16}"
  ["Telegram Bot Token"]="[0-9]{8,10}:AA[a-zA-Z0-9_-]{33}"
  ["GitHub Token"]="gh[pos]_[a-zA-Z0-9]{36}"
  ["Anthropic Key"]="sk-ant-[a-zA-Z0-9_-]{40,}"
  ["OpenAI Key"]="sk-proj-[a-zA-Z0-9_-]{48,}"
  ["HuggingFace Token"]="hf_[a-zA-Z0-9]{34,}"
  ["Cloudflare API Token"]="cf_[a-zA-Z0-9_-]{37,}"
  ["Cloudflare R2 Key"]="(account_id|access_key_id|secret_access_key).*[0-9a-f]{32}"
)

SINCE=$(date -d "${SCAN_DAYS} days ago" '+%Y-%m-%d' 2>/dev/null || \
        date -v-${SCAN_DAYS}d '+%Y-%m-%d' 2>/dev/null || \
        echo "1 day ago")

echo "[secret-scan] $(date '+%Y-%m-%d %H:%M') — scanning ${SCAN_DAYS}d back"

# ── Per-repo scan ─────────────────────────────────────────────────────────────
REPOS=0
for repo in "$WORKSPACE"/*/; do
  [[ -d "$repo/.git" ]] || continue
  name=$(basename "$repo")
  REPOS=$((REPOS+1))

  # Get all added lines from recent commits in one pass, skip generated/vendor paths
  PATCH=$(git -C "$repo" log \
    --since="$SINCE" \
    --patch \
    --unified=0 \
    --no-color \
    -- \
    ':!node_modules/' ':!vendor/' ':!*.lock' ':!*.sum' \
    ':!*/test*/*.pem' ':!*/fixtures/*' ':!*/test_vectors/*' \
    2>/dev/null | grep -a "^+" | grep -av "^+++" || true)

  [[ -z "$PATCH" ]] && continue

  for label in "${!PATTERNS[@]}"; do
    pattern="${PATTERNS[$label]}"
    matches=$(echo "$PATCH" | grep -iaE -- "$pattern" \
      | grep -av "example\|dummy\|fake\|test\|fixture\|placeholder\|YOUR_" \
      | head -3 || true)

    if [[ -n "$matches" ]]; then
      # Get commit context
      ctx=$(git -C "$repo" log --since="$SINCE" --format="%h %s" \
        --all-match 2>/dev/null | head -3 || true)

      issue="⚠️ ${label} in ${name}
$(echo "$matches" | head -1 | cut -c1-100)
Recent commits: $(echo "$ctx" | head -1)"

      FOUND_ISSUES+=("$issue")
      echo "[FOUND] $label in $name"
    fi
  done
done

echo "[secret-scan] Scanned $REPOS repos — ${#FOUND_ISSUES[@]} issue(s)"

# ── Report ────────────────────────────────────────────────────────────────────
if [[ ${#FOUND_ISSUES[@]} -gt 0 ]]; then
  msg="🔐 Secret scan alert — $(date '+%Y-%m-%d')
${#FOUND_ISSUES[@]} potential secret(s) found:

"
  for issue in "${FOUND_ISSUES[@]}"; do
    msg+="${issue}

"
  done
  msg+="⚡ Rotate any exposed credentials immediately.
Remove from history: git rebase -i or git filter-branch"

  notify "$msg"
  exit 1
else
  echo "[secret-scan] All clear ✓"
fi
