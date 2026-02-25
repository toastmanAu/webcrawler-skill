#!/bin/bash
# Model limit monitor — checks provider health and alerts on degradation
# Uses OpenClaw's own auth-profiles.json for keys + live ping of each provider
# Returns: 0 if primary OK, 1 if degraded (caller should alert Phill)

PROFILES="/home/phill/.openclaw/agents/main/agent/auth-profiles.json"
ENV_FILE="$HOME/.openclaw/.env"

# Load keys
ANTHROPIC_KEY=$(python3 -c "
import json
with open('$PROFILES') as f: d = json.load(f)
p = d.get('profiles', {}).get('anthropic:default', {})
print(p.get('key',''))
" 2>/dev/null)

CKBDEV_KEY=$(grep "CKBDEV_API_KEY" "$ENV_FILE" 2>/dev/null | cut -d= -f2)

PING_BODY='{"model":"claude-sonnet-4-6","max_tokens":1,"messages":[{"role":"user","content":"hi"}]}'
PRIMARY_OK=false
ISSUES=()

# ── Check 1: OpenClaw's own error stats (free, no API call) ─────────────
ERROR_INFO=$(python3 -c "
import json, time
with open('$PROFILES') as f: d = json.load(f)
stats = d.get('usageStats', {}).get('anthropic:default', {})
ec = stats.get('errorCount', 0)
last_fail = stats.get('lastFailureAt', 0)
last_used = stats.get('lastUsed', 0)
age_fail = int(time.time()*1000) - last_fail
age_used = int(time.time()*1000) - last_used
# Flag if errors in last 10 mins and errorCount > 0
recent_fail = last_fail > 0 and age_fail < 600000
print(f'{ec}|{recent_fail}|{int(age_fail/1000)}|{int(age_used/1000)}')
" 2>/dev/null)

IFS='|' read -r ERR_COUNT RECENT_FAIL FAIL_AGE_S USED_AGE_S <<< "$ERROR_INFO"

if [[ "$RECENT_FAIL" == "True" && "$ERR_COUNT" -gt 0 ]]; then
    ISSUES+=("Anthropic had $ERR_COUNT error(s) ~${FAIL_AGE_S}s ago")
fi

# ── Check 2: Live ping Anthropic ────────────────────────────────────────
if [[ -n "$ANTHROPIC_KEY" ]]; then
    RESP=$(curl -s --max-time 10 -X POST https://api.anthropic.com/v1/messages \
        -H "x-api-key: $ANTHROPIC_KEY" \
        -H "anthropic-version: 2023-06-01" \
        -H "content-type: application/json" \
        -d "$PING_BODY" 2>/dev/null)

    if echo "$RESP" | grep -q '"type":"message"'; then
        PRIMARY_OK=true
        echo "✅ Anthropic (primary): OK"
    elif echo "$RESP" | grep -qiE "billing|limit|credit|quota|overload"; then
        ERROR=$(echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('error',{}).get('message','quota/billing')[:80])" 2>/dev/null)
        ISSUES+=("Anthropic PRIMARY LIMIT: $ERROR")
        echo "❌ Anthropic (primary): $ERROR"
    else
        echo "⚠️  Anthropic (primary): unexpected — $(echo "$RESP" | head -c 80)"
    fi
else
    ISSUES+=("Anthropic key not found in profiles")
    echo "❌ Anthropic: no key"
fi

# ── Check 3: Live ping CKBDev shared ───────────────────────────────────
if [[ -n "$CKBDEV_KEY" ]]; then
    RESP2=$(curl -s --max-time 10 -X POST https://share-ai.ckbdev.com/v1/messages \
        -H "x-api-key: $CKBDEV_KEY" \
        -H "anthropic-version: 2023-06-01" \
        -H "content-type: application/json" \
        -d "$PING_BODY" 2>/dev/null)

    if echo "$RESP2" | grep -q '"type":"message"'; then
        echo "✅ CKBDev shared (fallback 1): OK"
    elif echo "$RESP2" | grep -qiE "billing|limit|credit|quota|rate"; then
        ISSUES+=("CKBDev fallback also rate-limited")
        echo "❌ CKBDev shared (fallback 1): limited"
    else
        echo "⚠️  CKBDev shared (fallback 1): $(echo "$RESP2" | head -c 80)"
    fi
fi

# ── Check 4: HuggingFace free (no key) ─────────────────────────────────
HF_RESP=$(curl -s --max-time 10 -X POST https://router.huggingface.co/v1/chat/completions \
    -H "content-type: application/json" \
    -d '{"model":"meta-llama/Llama-3.1-8B-Instruct","max_tokens":1,"messages":[{"role":"user","content":"hi"}]}' 2>/dev/null)

if echo "$HF_RESP" | grep -q '"choices"'; then
    echo "✅ HuggingFace free (fallback 2): OK"
elif echo "$HF_RESP" | grep -qiE "rate|limit|quota|429"; then
    ISSUES+=("HuggingFace rate limited")
    echo "❌ HuggingFace (fallback 2): rate limited"
else
    echo "⚠️  HuggingFace (fallback 2): needs auth (expected)"
fi

# ── Result ────────────────────────────────────────────────────────────────
if [[ ${#ISSUES[@]} -gt 0 ]]; then
    echo ""
    echo "ISSUES: ${ISSUES[*]}"
fi

$PRIMARY_OK && exit 0 || exit 1
