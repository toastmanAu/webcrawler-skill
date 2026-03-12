#!/usr/bin/env bash
# switch-profile.sh — swap OpenClaw model profile
#
# Usage:
#   ./switch-profile.sh default        # CKBDev Claude primary (current prod)
#   ./switch-profile.sh cheap-coder    # OpenRouter DeepSeek/Qwen for coding loops
#   ./switch-profile.sh status         # show current primary model
#
# Profiles:
#   default      → ckbdev/claude-sonnet-4-6 (primary)
#                  fallbacks: openrouter/deepseek → openrouter/qwen-coder → ckbdev/haiku → anthropic/sonnet
#   cheap-coder  → openrouter/deepseek/deepseek-chat-v3-5 (primary)
#                  fallbacks: openrouter/qwen-coder → openrouter/gemini-flash → ckbdev/claude-haiku → ckbdev/claude-sonnet

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
    echo "Switching to DEFAULT profile (CKBDev Claude primary)..."
    # Back up current
    cp "$CONFIG" "$BACKUP_DIR/openclaw-$(date +%Y%m%d-%H%M%S).json"

    python3 - <<'EOF'
import json, sys

CONFIG = "/home/phill/.openclaw/openclaw.json"
with open(CONFIG) as f:
    d = json.load(f)

d['agents']['defaults']['model']['primary'] = 'ckbdev/claude-sonnet-4-6'
d['agents']['defaults']['model']['fallbacks'] = [
    'openrouter/deepseek/deepseek-v3.2',
    'openrouter/qwen/qwen3-coder:free',
    'openrouter/meta-llama/llama-3.3-70b-instruct:free',
    'ckbdev/claude-haiku-4-5-20251001',
    'openrouter/google/gemini-2.0-flash-001',
    'anthropic/claude-sonnet-4-6',
    'anthropic/claude-haiku-4-5',
    'ollama/qwen2.5:14b',
]

with open(CONFIG, 'w') as f:
    json.dump(d, f, indent=2)
print("✅ Profile: DEFAULT — ckbdev/claude-sonnet-4-6 primary")
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
    'ollama/qwen2.5:14b',
]

with open(CONFIG, 'w') as f:
    json.dump(d, f, indent=2)
print("✅ Profile: CHEAP-CODER — openrouter/deepseek primary")
print("   ~$0.27/M input tokens vs $3-8/M for Claude")
print("   Claude as fallback for when reasoning matters")
EOF
    ;;

  *)
    echo "Usage: $0 [default|cheap-coder|status]"
    exit 1
    ;;
esac
