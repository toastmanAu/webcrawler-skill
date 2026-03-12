#!/usr/bin/env bash
# switch-profile.sh — swap OpenClaw model profile
#
# Usage:
#   ./switch-profile.sh default        # CKBDev Claude primary (current prod)
#   ./switch-profile.sh cheap-coder    # OpenRouter DeepSeek/Qwen for coding loops
#   ./switch-profile.sh local-only     # driveThree/NucBox local inference only (no API costs)
#   ./switch-profile.sh status         # show current primary model
#
# Profiles:
#   default      → anthropic/claude-sonnet-4-6 (primary)
#                  fallbacks: openrouter/deepseek → openrouter/qwen-coder → ckbdev/haiku → driveThree → NucBox
#   cheap-coder  → openrouter/deepseek/deepseek-v3-2 (primary)
#                  fallbacks: openrouter/qwen-coder → openrouter/gemini-flash → ckbdev/claude-haiku → driveThree → NucBox
#   local-only   → drivethree/minicpm-v:latest (primary)
#                  fallbacks: ollama/qwen2.5:14b (NucBox) — no external APIs

set -euo pipefail

CONFIG="$HOME/.openclaw/openclaw.json"
BACKUP_DIR="$HOME/.openclaw/workspace/config-backups"
mkdir -p "$BACKUP_DIR"

PROFILE="${1:-status}"

case "$PROFILE" in
  status)
    python3 -c "
import json
with open('$CONFIG') as f: d=json.load(f)
m=d['agents']['defaults']['model']
print('PRIMARY:', m.get('primary','?'))
print('FALLBACKS:')
for fb in m.get('fallbacks',[]): print(' ', fb)
"
    ;;

  default)
    echo "Switching to DEFAULT profile (Anthropic Claude primary)..."
    # Back up current
    cp "$CONFIG" "$BACKUP_DIR/openclaw-$(date +%Y%m%d-%H%M%S).json"

    python3 - <<'EOF'
import json, sys

CONFIG = "/home/phill/.openclaw/openclaw.json"
with open(CONFIG) as f:
    d = json.load(f)

d['agents']['defaults']['model']['primary'] = 'anthropic/claude-sonnet-4-6'
d['agents']['defaults']['model']['fallbacks'] = [
    'openrouter/deepseek/deepseek-v3.2',
    'openrouter/qwen/qwen3-coder:free',
    'openrouter/meta-llama/llama-3.3-70b-instruct:free',
    'ckbdev/claude-haiku-4-5-20251001',
    'openrouter/google/gemini-2.0-flash-001',
    'drivethree/minicpm-v:latest',
    'ollama/qwen2.5:14b',
]

with open(CONFIG, 'w') as f:
    json.dump(d, f, indent=2)
print("✅ Profile: DEFAULT — anthropic/claude-sonnet-4-6 primary")
EOF
    ;;

  cheap-coder)
    echo "Switching to CHEAP-CODER profile (OpenRouter DeepSeek primary)..."
    # Check OpenRouter key is set
    if ! grep -q "OPENROUTER_API_KEY" "$HOME/.openclaw/.env" 2>/dev/null; then
      echo "⚠️  WARNING: OPENROUTER_API_KEY not found in ~/.openclaw/.env"
      echo "   Add it with: echo 'OPENROUTER_API_KEY=sk-or-...' >> ~/.openclaw/.env"
      echo "   Get a key at: https://openrouter.ai/keys"
      echo "   Continuing anyway (will fail on first API call)..."
    fi

    cp "$CONFIG" "$BACKUP_DIR/openclaw-$(date +%Y%m%d-%H%M%S).json"

    python3 - <<'EOF'
import json, sys

CONFIG = "/home/phill/.openclaw/openclaw.json"
with open(CONFIG) as f:
    d = json.load(f)

d['agents']['defaults']['model']['primary'] = 'openrouter/deepseek/deepseek-v3.2'
d['agents']['defaults']['model']['fallbacks'] = [
    'openrouter/qwen/qwen3-coder:free',
    'openrouter/meta-llama/llama-3.3-70b-instruct:free',
    'openrouter/qwen/qwen2.5-coder-7b-instruct',
    'openrouter/google/gemini-2.0-flash-001',
    'ckbdev/claude-haiku-4-5-20251001',
    'ckbdev/claude-sonnet-4-6',
    'drivethree/minicpm-v:latest',
    'ollama/qwen2.5:14b',
]

with open(CONFIG, 'w') as f:
    json.dump(d, f, indent=2)
print("✅ Profile: CHEAP-CODER — openrouter/deepseek primary")
print("   ~$0.27/M input tokens vs $3-8/M for Claude")
print("   Claude as fallback for when reasoning matters")
EOF
    ;;

  local-only)
    echo "Switching to LOCAL-ONLY profile (driveThree MiniCPM-V primary)..."
    echo "⚠️  WARNING: This uses local Ollama instances only — no API calls."
    echo "   Quality will be lower but zero cost."

    cp "$CONFIG" "$BACKUP_DIR/openclaw-$(date +%Y%m%d-%H%M%S).json"

    python3 - <<'EOF'
import json, sys

CONFIG = "/home/phill/.openclaw/openclaw.json"
with open(CONFIG) as f:
    d = json.load(f)

d['agents']['defaults']['model']['primary'] = 'drivethree/minicpm-v:latest'
d['agents']['defaults']['model']['fallbacks'] = [
    'ollama/qwen2.5:14b',
]

with open(CONFIG, 'w') as f:
    json.dump(d, f, indent=2)
print("✅ Profile: LOCAL-ONLY — drivethree/minicpm-v:latest primary")
print("   Zero API cost, runs on driveThree GPU + NucBox CPU")
print("   Use when APIs are down or for low-stakes debugging")
EOF
    ;;

  *)
    echo "Usage: $0 [default|cheap-coder|status]"
    exit 1
    ;;
esac
