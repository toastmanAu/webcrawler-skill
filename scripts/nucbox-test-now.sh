#!/bin/bash
# Start RAM viewer test on NucBox NOW
# Dashboard: port 8767, Agent: discovery mode (no RetroArch needed for UI test)

echo "🚀 Starting RAM viewer test on NucBox..."

# Start dashboard in background
ssh phill@192.168.68.79 << 'EOF'
cd ~/ram-viewer

# Kill any existing server on 8767
pkill -f "node server.js.*8767" 2>/dev/null || true

# Start dashboard
echo "🌐 Starting dashboard on port 8767..."
nohup node server.js > dashboard.log 2>&1 &
DASH_PID=$!
echo $DASH_PID > /tmp/ram-dash.pid

sleep 2
echo "✅ Dashboard started (PID: $DASH_PID)"
echo "📱 URL: http://$(hostname -I | awk '{print $1}'):8767"
echo "📝 Logs: ~/ram-viewer/dashboard.log"

# Start agent in discovery mode (no RetroArch needed)
echo "🤖 Starting agent in discovery mode..."
nohup node ram-watcher.js --discover --game-name "Test Game" --ollama http://localhost:11434 --model qwen2.5:14b > agent.log 2>&1 &
AGENT_PID=$!
echo $AGENT_PID > /tmp/ram-agent.pid

echo "✅ Agent started (PID: $AGENT_PID)"
echo "🔍 Discovery mode: Scanning for RAM patterns"
echo "📝 Logs: ~/ram-viewer/agent.log"

echo ""
echo "📊 Test setup complete!"
echo "Dashboard: http://$(hostname -I | awk '{print $1}'):8767"
echo "Agent: Discovery mode (no RetroArch connection needed)"
echo "Ollama: qwen2.5:14b"
echo ""
echo "🛑 To stop:"
echo "   kill \$(cat /tmp/ram-dash.pid) \$(cat /tmp/ram-agent.pid)"
EOF

echo ""
echo "🧪 Test started!"
echo "📱 Open in browser: http://192.168.68.79:8767"
echo "🔍 Agent scanning in discovery mode (will timeout without RetroArch)"