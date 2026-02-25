#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# setup.sh — Free Agent Kit bootstrap
# Usage: bash setup.sh <HF_TOKEN> <TELEGRAM_BOT_TOKEN> [BRAVE_API_KEY]
#
# Idempotent — safe to re-run.
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

HF_TOKEN="${1:-}"
TG_TOKEN="${2:-}"
BRAVE_KEY="${3:-}"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[✓]${NC} $*"; }
warn()  { echo -e "${YELLOW}[!]${NC} $*"; }
error() { echo -e "${RED}[✗]${NC} $*"; exit 1; }

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Free Agent Kit — Zero-Cost OpenClaw Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── Validate inputs ──────────────────────────────────────────────────────────
[[ -z "$HF_TOKEN" ]]  && error "HuggingFace token required.\n  Get one free: https://huggingface.co/settings/tokens\n  Usage: bash setup.sh <HF_TOKEN> <TELEGRAM_BOT_TOKEN>"
[[ -z "$TG_TOKEN" ]]  && error "Telegram bot token required.\n  Get one free: message @BotFather on Telegram\n  Usage: bash setup.sh <HF_TOKEN> <TELEGRAM_BOT_TOKEN>"

# ── Check Node.js ────────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
    warn "Node.js not found. Installing..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

NODE_VER=$(node --version | sed 's/v//' | cut -d. -f1)
[[ "$NODE_VER" -lt 22 ]] && error "Node.js 22+ required. Found: $(node --version)"
info "Node.js $(node --version)"

# ── Check/install OpenClaw ───────────────────────────────────────────────────
# ── npm global prefix (no root required) ─────────────────────────────────────
# If npm is configured to use /usr as prefix (system install), redirect to
# a user-local prefix so openclaw installs without sudo.
NPM_PREFIX=$(npm config get prefix 2>/dev/null)
if [[ "$NPM_PREFIX" == "/usr" || "$NPM_PREFIX" == "/usr/local" ]]; then
    warn "npm prefix is $NPM_PREFIX (system). Setting user-local prefix..."
    mkdir -p "$HOME/.npm-global"
    npm config set prefix "$HOME/.npm-global"
    export PATH="$HOME/.npm-global/bin:$PATH"
    # Persist to shell rc
    for RC in ~/.bashrc ~/.profile; do
        if [[ -f "$RC" ]] && ! grep -q 'npm-global' "$RC"; then
            echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> "$RC"
        fi
    done
    info "npm prefix set to ~/.npm-global"
fi

# ── systemd linger (survive logout) ──────────────────────────────────────────
if command -v loginctl &>/dev/null; then
    LINGER=$(loginctl show-user "$USER" 2>/dev/null | grep "^Linger=" | cut -d= -f2)
    if [[ "$LINGER" != "yes" ]]; then
        warn "Enabling systemd linger for $USER (services survive logout)..."
        sudo loginctl enable-linger "$USER" && info "Linger enabled"
    fi
fi

info "OpenClaw $(openclaw --version 2>/dev/null || echo 'installed')"

# ── Swap (Pi 3 / low-RAM boards) ─────────────────────────────────────────────
TOTAL_RAM_MB=$(awk '/MemTotal/ {printf "%d", $2/1024}' /proc/meminfo)
if [[ "$TOTAL_RAM_MB" -lt 2048 ]]; then
    warn "Low RAM detected (${TOTAL_RAM_MB}MB). Checking swap..."
    SWAP_MB=$(free -m | awk '/Swap/ {print $2}')
    if [[ "$SWAP_MB" -lt 512 ]]; then
        warn "Adding 1GB swap file..."
        sudo fallocate -l 1G /swapfile 2>/dev/null || sudo dd if=/dev/zero of=/swapfile bs=1M count=1024 status=none
        sudo chmod 600 /swapfile
        sudo mkswap /swapfile -q
        sudo swapon /swapfile
        grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
        info "Swap enabled (1GB)"
    else
        info "Swap already present (${SWAP_MB}MB)"
    fi
fi

# ── Write .env ───────────────────────────────────────────────────────────────
OPENCLAW_HOME="${OPENCLAW_HOME:-$HOME/.openclaw}"
mkdir -p "$OPENCLAW_HOME"
ENV_FILE="$OPENCLAW_HOME/.env"

# Build env file — preserve existing entries, add/update ours
touch "$ENV_FILE"
update_env() {
    local key="$1" val="$2"
    if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
        sed -i "s|^${key}=.*|${key}=${val}|" "$ENV_FILE"
    else
        echo "${key}=${val}" >> "$ENV_FILE"
    fi
}

update_env "HUGGINGFACE_HUB_TOKEN" "$HF_TOKEN"
[[ -n "$BRAVE_KEY" ]] && update_env "BRAVE_API_KEY" "$BRAVE_KEY"
info "Environment written to $ENV_FILE"

# ── Merge agent config ────────────────────────────────────────────────────────
CONFIG_FILE="$OPENCLAW_HOME/openclaw.json"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Build the config using Node — safe merge that preserves existing settings
node - "$CONFIG_FILE" "$TG_TOKEN" "$BRAVE_KEY" << 'NODEEOF'
const fs   = require('fs');
const path = require('path');

const configPath = process.argv[2];
const tgToken    = process.argv[3];
const braveKey   = process.argv[4] || '';

// Load existing config or start fresh
let cfg = {};
if (fs.existsSync(configPath)) {
    try { cfg = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch {}
}

// Deep merge helper
function merge(target, source) {
    for (const [k, v] of Object.entries(source)) {
        if (v && typeof v === 'object' && !Array.isArray(v) && target[k] && typeof target[k] === 'object') {
            merge(target[k], v);
        } else {
            target[k] = v;
        }
    }
    return target;
}

const freeConfig = {
    agents: {
        defaults: {
            model: {
                primary: "huggingface/deepseek-ai/DeepSeek-V3.2",
                fallbacks: [
                    "huggingface/meta-llama/Llama-3.3-70B-Instruct",
                    "huggingface/Qwen/Qwen3-32B",
                    "huggingface/openai/gpt-oss-120b",
                    "huggingface/moonshotai/Kimi-K2.5",
                    "qwen-portal/coder-model",
                    "google-gemini-cli/gemini-2.0-flash"
                ]
            },
            imageModel: {
                primary: "google-gemini-cli/gemini-2.0-flash",
                fallbacks: ["google-gemini-cli/gemini-2.5-pro"]
            },
            models: {
                "huggingface/deepseek-ai/DeepSeek-V3.2":              { alias: "DeepSeek V3.2 (free)" },
                "huggingface/deepseek-ai/DeepSeek-R1":                { alias: "DeepSeek R1 — reasoning (free)" },
                "huggingface/meta-llama/Llama-3.3-70B-Instruct":      { alias: "Llama 3.3 70B (free)" },
                "huggingface/meta-llama/Llama-3.1-8B-Instruct":       { alias: "Llama 3.1 8B — light (free)" },
                "huggingface/Qwen/Qwen3-32B":                         { alias: "Qwen3 32B (free)" },
                "huggingface/Qwen/Qwen3-8B":                          { alias: "Qwen3 8B — light (free)" },
                "huggingface/openai/gpt-oss-120b":                    { alias: "GPT-OSS 120B (free)" },
                "huggingface/moonshotai/Kimi-K2.5":                   { alias: "Kimi K2.5 (free)" },
                "qwen-portal/coder-model":                            { alias: "Qwen Coder (free OAuth)" },
                "qwen-portal/vision-model":                           { alias: "Qwen Vision (free OAuth)" },
                "google-gemini-cli/gemini-2.5-pro":                   { alias: "Gemini 2.5 Pro (free OAuth)" },
                "google-gemini-cli/gemini-2.0-flash":                 { alias: "Gemini 2.0 Flash (free OAuth)" }
            },
            compaction: { mode: "safeguard" },
            maxConcurrent: 2,
            subagents: { maxConcurrent: 4 }
        }
    },
    models: { mode: "merge" },
    channels: {
        telegram: {
            enabled: true,
            dmPolicy: "pairing",
            botToken: tgToken,
            groupPolicy: "allowlist",
            allowedGroups: ["-1003730870122"],
            streamMode: "partial"
        }
    }
};

if (braveKey) {
    freeConfig.search = { braveApiKey: braveKey };
}

merge(cfg, freeConfig);

// Backup existing config
if (fs.existsSync(configPath)) {
    fs.copyFileSync(configPath, configPath + '.bak.' + Date.now());
}
fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2));
console.log('Config written: ' + configPath);
NODEEOF

info "OpenClaw config updated"

# ── Seed workspace files ──────────────────────────────────────────────────────
WORKSPACE="${OPENCLAW_HOME}/workspace"
mkdir -p "$WORKSPACE/memory"

# Only write workspace files if they don't already exist
seed_file() {
    local dest="$WORKSPACE/$1"
    local src="$SCRIPT_DIR/workspace/$1"
    if [[ ! -f "$dest" ]]; then
        if [[ -f "$src" ]]; then
            cp "$src" "$dest"
            info "Seeded $1"
        fi
    else
        info "Skipped $1 (already exists)"
    fi
}

seed_file "AGENTS.md"
seed_file "SOUL.md"
seed_file "IDENTITY.md"
seed_file "USER.md"
seed_file "TOOLS.md"
seed_file "HEARTBEAT.md"

# ── (Optional) Qwen OAuth ─────────────────────────────────────────────────────
echo ""
echo "━━ Optional: Free model upgrades ━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Qwen Coder (2,000 req/day free):"
echo "    openclaw plugins enable qwen-portal-auth"
echo "    openclaw gateway restart"
echo "    openclaw models auth login --provider qwen-portal"
echo ""
echo "  Gemini CLI (generous free quota + image analysis):"
echo "    openclaw plugins enable google-gemini-cli-auth"
echo "    openclaw gateway restart"
echo "    openclaw models auth login --provider google-gemini-cli"
echo ""

# ── Start / restart gateway ───────────────────────────────────────────────────
echo "━━ Starting OpenClaw ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Install as systemd service if not already
if systemctl --user is-enabled openclaw-gateway &>/dev/null; then
    info "Gateway service already installed — restarting..."
    systemctl --user restart openclaw-gateway
else
    warn "Installing gateway as systemd service..."
    openclaw gateway install 2>/dev/null || true
    systemctl --user enable --now openclaw-gateway 2>/dev/null || openclaw gateway start
fi

sleep 3
openclaw status 2>/dev/null | grep -E "Gateway|Channel|Agents" || true

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
info "Done! Your free agent is running."
echo ""
echo "  Next: Open Telegram, find your bot, send it a message."
echo "  The bot needs you to initiate a DM first (Telegram requirement)."
echo ""
echo "  Logs: journalctl --user -u openclaw-gateway -f"
echo "  Status: openclaw status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
