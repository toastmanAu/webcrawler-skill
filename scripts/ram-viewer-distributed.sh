#!/bin/bash
# RAM Viewer Distributed — Easy redistributable setup
# User enters setup details, runs this script
# Creates: 1) Agent (Ollama + RAM watcher), 2) Dashboard server

set -e

echo "╔══════════════════════════════════════════════════════╗"
echo "║   RAM Viewer Distributed Setup                       ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "This sets up:"
echo "1. Local inference agent (watches RetroArch via RAM logger)"
echo "2. Central browser dashboard (view on any device)"
echo "3. Game data routing (agent → browser console)"
echo ""

# ──────────────────────────────────────────────────────────────
# 1. User Configuration
# ──────────────────────────────────────────────────────────────
read -p "🔧 Enter RetroArch IP/hostname (default: 127.0.0.1): " RA_HOST
RA_HOST=${RA_HOST:-127.0.0.1}
read -p "🔧 Enter RetroArch UDP port (default: 55355): " RA_PORT
RA_PORT=${RA_PORT:-55355}

read -p "🔧 Enter dashboard IP to bind (default: 0.0.0.0): " DASH_IP
DASH_IP=${DASH_IP:-0.0.0.0}
read -p "🔧 Enter dashboard port (default: 8766): " DASH_PORT
DASH_PORT=${DASH_PORT:-8766}

read -p "🔧 Ollama model for inference (qwen2.5:3b/phi3:mini, default: qwen2.5:3b): " OLLAMA_MODEL
OLLAMA_MODEL=${OLLAMA_MODEL:-qwen2.5:3b}
read -p "🔧 Ollama server URL (default: http://localhost:11434): " OLLAMA_URL
OLLAMA_URL=${OLLAMA_URL:-http://localhost:11434}

read -p "🔧 Game JSON ID (or 'discover' for auto-detect): " GAME_ID
read -p "🔧 Poll interval in ms (default: 500): " POLL_INTERVAL
POLL_INTERVAL=${POLL_INTERVAL:-500}

# Write config
CONFIG_DIR="$HOME/.ram-viewer"
mkdir -p "$CONFIG_DIR"
cat > "$CONFIG_DIR/config.json" << EOF
{
  "retroarch": {
    "host": "$RA_HOST",
    "port": $RA_PORT
  },
  "dashboard": {
    "bind": "$DASH_IP",
    "port": $DASH_PORT
  },
  "ollama": {
    "url": "$OLLAMA_URL",
    "model": "$OLLAMA_MODEL"
  },
  "game": "$GAME_ID",
  "pollInterval": $POLL_INTERVAL
}
EOF

echo "✅ Config saved to $CONFIG_DIR/config.json"

# ──────────────────────────────────────────────────────────────
# 2. Clone/update RAM viewer
# ──────────────────────────────────────────────────────────────
REPO_DIR="$HOME/ram-viewer"
if [ -d "$REPO_DIR" ]; then
  echo "📦 Updating existing RAM viewer repo..."
  cd "$REPO_DIR"
  git pull origin main 2>/dev/null || true
else
  echo "📦 Cloning RAM viewer repo..."
  git clone https://github.com/toastmanAu/ram-viewer.git "$REPO_DIR"
fi

cd "$REPO_DIR"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing Node.js dependencies..."
  npm install
fi

# ──────────────────────────────────────────────────────────────
# 3. Create systemd services (optional)
# ──────────────────────────────────────────────────────────────
read -p "🔧 Install as systemd services? (y/n, default: n): " INSTALL_SYSTEMD
if [[ "$INSTALL_SYSTEMD" =~ ^[Yy]$ ]]; then
  echo "📦 Creating systemd services..."
  
  # Agent service
  cat > /tmp/ram-viewer-agent.service << EOF
[Unit]
Description=RAM Viewer Agent (Ollama + RetroArch watcher)
After=network.target ollama.service
Wants=ollama.service

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$REPO_DIR
Environment="NODE_ENV=production"
ExecStart=/usr/bin/node ram-watcher.js --game "$GAME_ID" --host "$RA_HOST" --port $RA_PORT --ollama "$OLLAMA_URL" --model "$OLLAMA_MODEL" --interval $POLL_INTERVAL
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
  
  # Dashboard service  
  cat > /tmp/ram-viewer-dashboard.service << EOF
[Unit]
Description=RAM Viewer Dashboard Server
After=network.target

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$REPO_DIR
Environment="NODE_ENV=production"
Environment="PORT=$DASH_PORT"
Environment="HOST=$DASH_IP"
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
  
  sudo cp /tmp/ram-viewer-agent.service /etc/systemd/system/
  sudo cp /tmp/ram-viewer-dashboard.service /etc/systemd/system/
  sudo systemctl daemon-reload
  
  echo "✅ Services created. To start:"
  echo "   sudo systemctl start ram-viewer-agent"
  echo "   sudo systemctl start ram-viewer-dashboard"
  echo "   sudo systemctl enable ram-viewer-agent ram-viewer-dashboard"
else
  echo "⏭️  Skipping systemd install"
fi

# ──────────────────────────────────────────────────────────────
# 4. Start services directly (if not systemd)
# ──────────────────────────────────────────────────────────────
read -p "🔧 Start services now? (y/n, default: n): " START_NOW
if [[ "$START_NOW" =~ ^[Yy]$ ]]; then
  echo "🚀 Starting dashboard server on $DASH_IP:$DASH_PORT..."
  nohup node server.js > dashboard.log 2>&1 &
  DASH_PID=$!
  
  echo "🚀 Starting agent (game: $GAME_ID, RetroArch: $RA_HOST:$RA_PORT)..."
  nohup node ram-watcher.js --game "$GAME_ID" --host "$RA_HOST" --port $RA_PORT --ollama "$OLLAMA_URL" --model "$OLLAMA_MODEL" --interval $POLL_INTERVAL > agent.log 2>&1 &
  AGENT_PID=$!
  
  echo "✅ Services started (PID: dashboard=$DASH_PID, agent=$AGENT_PID)"
  echo "📊 Dashboard: http://$(hostname -I | awk '{print $1}'):$DASH_PORT"
  echo "📝 Logs: dashboard.log, agent.log"
fi

# ──────────────────────────────────────────────────────────────
# 5. Summary
# ──────────────────────────────────────────────────────────────
cat << EOF

╔══════════════════════════════════════════════════════╗
║   Setup Complete!                                   ║
╚══════════════════════════════════════════════════════╝

📋 Configuration:
├─ RetroArch: $RA_HOST:$RA_PORT
├─ Dashboard: http://$(hostname -I | awk '{print $1}'):$DASH_PORT
├─ Ollama: $OLLAMA_URL (model: $OLLAMA_MODEL)
├─ Game: $GAME_ID
└─ Poll interval: ${POLL_INTERVAL}ms

🚀 Quick start commands:
1. Start dashboard: cd $REPO_DIR && node server.js
2. Start agent: cd $REPO_DIR && node ram-watcher.js --game "$GAME_ID" --host "$RA_HOST" --port $RA_PORT

📱 View on phone/tablet:
   Open http://$(hostname -I | awk '{print $1}'):$DASH_PORT in any browser

📝 For auto‑discovery (no game JSON):
   node ram‑watcher.js --discover --game‑name "Game Name"

🔧 Edit config: $CONFIG_DIR/config.json

EOF