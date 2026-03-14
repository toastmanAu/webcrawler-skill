#!/bin/bash
# Final NucBox setup with RetroArch at 192.168.68.73
# Kill everything and start fresh

echo "🔧 Final NucBox RAM viewer setup..."
echo "RetroArch: 192.168.68.73:55355"
echo "Dashboard: 8767 (accessible on network)"

ssh phill@192.168.68.79 << 'EOF'
cd ~/ram-viewer

# Kill everything
pkill -f "node server.js" 2>/dev/null
pkill -f "ram-watcher.js" 2>/dev/null
sleep 1

# Start dashboard with explicit 0.0.0.0 binding
echo "🌐 Starting dashboard on 0.0.0.0:8767..."
PORT=8767 HOST=0.0.0.0 nohup node server.js > dashboard.log 2>&1 &
DASH_PID=$!
echo $DASH_PID > /tmp/ram-dash.pid
sleep 2

# Check if listening
echo "📡 Checking network binding..."
if netstat -tln 2>/dev/null | grep -q ":8767 "; then
  echo "✅ Dashboard listening on port 8767"
  echo "📱 URL: http://$(hostname -I | awk '{print $1}'):8767"
else
  echo "❌ Dashboard NOT listening"
  echo "📝 Logs:"
  tail -5 dashboard.log
  exit 1
fi

# Start agent pointing to RetroArch at 192.168.68.73
echo "🤖 Starting agent (RetroArch: 192.168.68.73:55355)..."
echo "   Model: phi3:mini"
echo "   Game: dkc"

nohup node ram-watcher.js \
  --game dkc \
  --host 192.168.68.73 \
  --port 55355 \
  --ollama http://localhost:11434 \
  --model phi3:mini \
  --interval 500 \
  > agent.log 2>&1 &
AGENT_PID=$!
echo $AGENT_PID > /tmp/ram-agent.pid

echo "✅ Agent started (PID: $AGENT_PID)"
echo "🎯 Target: 192.168.68.73:55355 (RG35XXH RetroArch)"

# Show logs
echo ""
echo "📊 Setup complete!"
echo "Dashboard: http://$(hostname -I | awk '{print $1}'):8767"
echo "RetroArch: 192.168.68.73:55355"
echo "Model: phi3:mini"
echo ""
echo "📝 Logs:"
echo "   tail -f ~/ram-viewer/dashboard.log"
echo "   tail -f ~/ram-viewer/agent.log"
echo ""
echo "🛑 To stop: kill $DASH_PID $AGENT_PID"
EOF

echo ""
echo "✅ Setup complete!"
echo "📱 Try connecting to: http://192.168.68.79:8767"
echo "🎮 RetroArch: 192.168.68.73:55355"