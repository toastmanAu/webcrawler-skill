#!/bin/bash
# Test RAM viewer setup on NucBox
# Checks everything works, even without RetroArch running

echo "🧪 RAM Viewer NucBox Test Setup"
echo "================================"

# 1. SSH to NucBox
echo "1. Connecting to NucBox (192.168.68.79)..."
ssh phill@192.168.68.79 << 'EOF'

echo "✅ Connected to NucBox: $(hostname)"

# 2. Check Ollama
echo "2. Checking Ollama..."
if ! curl -sf http://localhost:11434/api/tags >/dev/null; then
  echo "❌ Ollama not running"
  echo "   Start: systemctl start ollama"
else
  echo "✅ Ollama running at localhost:11434"
  echo "   Models:"
  ollama list 2>/dev/null | sed 's/^/     /'
fi

# 3. Check RAM viewer repo
echo "3. Checking RAM viewer repo..."
if [ -d ~/ram-viewer ]; then
  echo "✅ RAM viewer repo at ~/ram-viewer"
  cd ~/ram-viewer
  if [ -f "server.js" ]; then
    echo "✅ server.js found"
    # Install deps if needed
    if [ ! -d "node_modules" ]; then
      echo "📦 Installing Node.js dependencies..."
      npm install --silent
    fi
    echo "✅ Dependencies ready"
  else
    echo "❌ server.js missing"
  fi
else
  echo "❌ RAM viewer repo not found"
  echo "   Clone: git clone https://github.com/toastmanAu/ram-viewer.git"
fi

# 4. Check network access
echo "4. Network configuration..."
echo "   NucBox IP: $(hostname -I | awk '{print \$1}')"
echo "   Dashboard port: 8766 (will be available on network)"

# 5. Test RetroArch connectivity
echo "5. RetroArch check..."
RA_HOST="127.0.0.1"
RA_PORT="55355"
if timeout 2 bash -c "echo > /dev/udp/\$RA_HOST/\$RA_PORT" 2>/dev/null; then
  echo "✅ UDP port $RA_PORT reachable (RetroArch might be running)"
else
  echo "⚠️  UDP port $RA_PORT not open — RetroArch not running locally"
  echo "   Use --host <retroarch-ip> to point to another machine"
fi

echo ""
echo "📋 Setup summary:"
echo "   - To run dashboard: cd ~/ram-viewer && PORT=8766 node server.js"
echo "   - To run agent: cd ~/ram-viewer && node ram-watcher.js --game dkc --ollama http://localhost:11434"
echo "   - RetroArch target: Enter IP when prompted"
echo ""
echo "🚀 Quick start command:"
echo "   cd ~/ram-viewer && RA_HOST=<retroarch-ip> RA_PORT=55355 \\"
echo "   OLLAMA_MODEL=qwen2.5:14b GAME_ID=dkc \\"
echo "   node ram-watcher.js --game dkc --host <retroarch-ip> --ollama http://localhost:11434 --model qwen2.5:14b"
EOF

echo ""
echo "🧪 Test complete!"
echo "📱 Dashboard will be at: http://192.168.68.79:8766"
echo "🔧 RetroArch IP needed: Enter the machine running RetroArch"