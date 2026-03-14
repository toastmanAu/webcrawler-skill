#!/bin/bash
# FiberQuest Demo Machine Launcher
# Auto-starts all services + dashboard on login

set -e

echo "=== FiberQuest Demo Machine ==="
echo "Booting demo environment..."
echo ""

# Wait for network
sleep 3

# Start PostgreSQL
sudo systemctl start postgresql
echo "✅ Database ready"

# Start website (port 3000)
cd ~/fiberquest
npm run dev > ~/fiberquest-website.log 2>&1 &
WEBSITE_PID=$!
echo "✅ Website starting (port 3000, PID: $WEBSITE_PID)"

# Start RetroArch if games exist
if [ -d ~/retro-games ]; then
    retroarch > ~/retroarch.log 2>&1 &
    RETRO_PID=$!
    echo "✅ RetroArch ready (PID: $RETRO_PID)"
fi

# Create demo dashboard launcher
cat > ~/demo-dashboard.sh << 'DASH'
#!/bin/bash
# Open browser to local demo
sleep 5  # Wait for website to start
firefox http://localhost:3000 2>/dev/null &
DASH
chmod +x ~/demo-dashboard.sh
bash ~/demo-dashboard.sh &

echo ""
echo "=== Demo Services Running ==="
echo "Website:   http://localhost:3000 (+ accessible on network)"
echo "RetroArch: Ready on desktop"
echo "Database:  PostgreSQL running"
echo ""
echo "For remote access from another machine:"
echo "  Browser: http://192.168.68.65:3000"
echo "  Inference: Local NucBox (192.168.68.79:11434)"
echo ""
echo "Logs:"
echo "  Website:   ~/fiberquest-website.log"
echo "  RetroArch: ~/retroarch.log"
echo ""
