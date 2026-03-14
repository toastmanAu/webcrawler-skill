#!/bin/bash
# RAM Viewer NucBox — Single‑machine test (Ollama + Dashboard on NucBox)
# RetroArch can be anywhere on network (default 127.0.0.1 = same machine)

set -e

echo "╔══════════════════════════════════════════════════════╗"
echo "║   RAM Viewer — NucBox Single‑Machine Test            ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "This runs everything on NucBox:"
echo "1. Ollama inference (qwen2.5:3b or phi3:mini)"
echo "2. RAM agent (watches RetroArch)"
echo "3. Dashboard server (viewable on phone)"
echo ""
echo "📡 RetroArch can be on any machine (enter IP)"
echo ""

# ──────────────────────────────────────────────────────────────
# 1. Configuration
# ──────────────────────────────────────────────────────────────
read -p "🔧 RetroArch IP/hostname (default: 127.0.0.1 = NucBox): " RA_HOST
RA_HOST=${RA_HOST:-127.0.0.1}
read -p "🔧 RetroArch UDP port (default: 55355): " RA_PORT
RA_PORT=${RA_PORT:-55355}

read -p "🔧 Dashboard port (default: 8766): " DASH_PORT
DASH_PORT=${DASH_PORT:-8766}

read -p "🔧 Ollama model (qwen2.5:3b/phi3:mini, default: qwen2.5:3b): " OLLAMA_MODEL
OLLAMA_MODEL=${OLLAMA_MODEL:-qwen2.5:3b}

read -p "🔧 Game JSON ID or 'discover' (default: dkc): " GAME_ID
GAME_ID=${GAME_ID:-dkc}

read -p "🔧 Poll interval ms (default: 500): " POLL_INTERVAL
POLL_INTERVAL=${POLL_INTERVAL:-500}

# Check Ollama
echo "🔍 Checking Ollama on localhost:11434..."
if ! curl -sf http://localhost:11434/api/tags >/dev/null 2>&1; then
  echo "❌ Ollama not running on localhost:11434"
  echo "   Start it: systemctl start ollama"
  exit 1
fi

# Check model availability
echo "🔍 Checking model $OLLAMA_MODEL..."
if ! curl -sf http://localhost:11434/api/show -d "{\"name\":\"$OLLAMA_MODEL\"}" >/dev/null 2>&1; then
  echo "⚠️  Model $OLLAMA_MODEL not found locally"
  read -p "📥 Pull it now? (y/n): " PULL_MODEL
  if [[ "$PULL_MODEL" =~ ^[Yy]$ ]]; then
    echo "📦 Pulling $OLLAMA_MODEL (2-3 minutes)..."
    ollama pull "$OLLAMA_MODEL"
    echo "✅ Model pulled"
  else
    echo "❌ Need model to continue"
    exit 1
  fi
fi

# ──────────────────────────────────────────────────────────────
# 2. Get RAM viewer repo
# ──────────────────────────────────────────────────────────────
REPO_DIR="$HOME/ram-viewer"
if [ -d "$REPO_DIR" ]; then
  echo "📦 Using existing RAM viewer at $REPO_DIR"
  cd "$REPO_DIR"
  git pull origin main 2>/dev/null || echo "⚠️  Could not update, using existing"
else
  echo "📦 Cloning RAM viewer repo..."
  git clone https://github.com/toastmanAu/ram-viewer.git "$REPO_DIR"
  cd "$REPO_DIR"
  npm install
fi

# ──────────────────────────────────────────────────────────────
# 3. Create simple single‑agent script
# ──────────────────────────────────────────────────────────────
cat > "$REPO_DIR/nucbox-agent.js" << 'EOF'
#!/usr/bin/env node
// RAM Agent — Single‑machine version (Ollama + RetroArch + Dashboard)
'use strict';

const { spawn } = require('child_process');
const path = require('path');

// Get config from env
const RA_HOST = process.env.RA_HOST || '127.0.0.1';
const RA_PORT = process.env.RA_PORT || 55355;
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b';
const GAME_ID = process.env.GAME_ID || 'dkc';
const POLL_INTERVAL = process.env.POLL_INTERVAL || 500;
const DASH_PORT = process.env.DASH_PORT || 8766;

console.log(`
╔══════════════════════════════════════════╗
║   RAM Agent (Single‑Machine)            ║
╚══════════════════════════════════════════╝
RetroArch: ${RA_HOST}:${RA_PORT}
Ollama: localhost:11434 (${OLLAMA_MODEL})
Dashboard: http://0.0.0.0:${DASH_PORT}
Game: ${GAME_ID}
Poll: ${POLL_INTERVAL}ms
`);

// Start dashboard server
console.log('[Dashboard] Starting server...');
const server = spawn('node', ['server.js'], {
  cwd: __dirname,
  env: { ...process.env, PORT: DASH_PORT, HOST: '0.0.0.0' }
});

server.stdout.on('data', data => console.log(`[Server] ${data.toString().trim()}`));
server.stderr.on('data', data => console.error(`[Server ERR] ${data.toString().trim()}`));

// Start RAM watcher after 2s
setTimeout(() => {
  console.log('[Agent] Starting RAM watcher...');
  const agent = spawn('node', [
    'ram-watcher.js',
    '--game', GAME_ID,
    '--host', RA_HOST,
    '--port', RA_PORT,
    '--ollama', 'http://localhost:11434',
    '--model', OLLAMA_MODEL,
    '--interval', POLL_INTERVAL.toString()
  ], { cwd: __dirname });

  agent.stdout.on('data', data => console.log(`[Agent] ${data.toString().trim()}`));
  agent.stderr.on('data', data => console.error(`[Agent ERR] ${data.toString().trim()}`));
  
  agent.on('close', code => {
    console.log(`[Agent] Exited with code ${code}`);
    process.exit(code);
  });
}, 2000);

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('\n[Shutdown] Stopping all processes...');
  server.kill('SIGINT');
  process.exit(0);
});

console.log(`✅ Dashboard: http://$(hostname -I | awk '{print $1}'):${DASH_PORT}`);
console.log(`📱 View on phone: same URL`);
EOF

chmod +x "$REPO_DIR/nucbox-agent.js"

# ──────────────────────────────────────────────────────────────
# 4. Run everything
# ──────────────────────────────────────────────────────────────
echo ""
echo "🚀 Starting single‑machine RAM viewer..."
echo ""

cd "$REPO_DIR"
export RA_HOST RA_PORT OLLAMA_MODEL GAME_ID POLL_INTERVAL DASH_PORT

node nucbox-agent.js

# If script exits, show reminder
echo ""
echo "💡 Quick restart:"
echo "   cd $REPO_DIR"
echo "   RA_HOST=$RA_HOST RA_PORT=$RA_PORT OLLAMA_MODEL=$OLLAMA_MODEL \\"
echo "   GAME_ID=$GAME_ID POLL_INTERVAL=$POLL_INTERVAL DASH_PORT=$DASH_PORT \\"
echo "   node nucbox-agent.js"
echo ""
echo "📱 Dashboard URL: http://$(hostname -I | awk '{print $1}'):$DASH_PORT"