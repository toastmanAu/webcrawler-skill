#!/bin/bash
# FiberQuest Pi Startup Script
# Run this to start all services

set -e

echo "=== FiberQuest Pi Startup ==="
echo ""

# Check PostgreSQL
echo "Checking PostgreSQL..."
sudo systemctl start postgresql || true
sleep 2

# Check if database exists
if ! psql -h localhost -U fiberquest -d fiberquest -c "SELECT 1;" 2>/dev/null; then
    echo "Database not initialized. Running setup..."
    bash /home/phill/.openclaw/workspace/scripts/setup-fiberquest-db.sh
fi

# Start website (port 3000)
echo ""
echo "Starting FiberQuest website..."
cd ~/fiberquest
npm run dev &
WEBSITE_PID=$!
echo "Website running on http://localhost:3000 (PID: $WEBSITE_PID)"

# Start agent (when built)
if [ -d ~/fiberquest-agent/dist ]; then
    echo ""
    echo "Starting FiberQuest agent..."
    sudo systemctl start fiberquest-agent || npm start --prefix ~/fiberquest-agent &
    AGENT_PID=$!
    echo "Agent running (PID: $AGENT_PID)"
else
    echo ""
    echo "⚠️ Agent not yet built. Run: npm run build in ~/fiberquest-agent"
fi

echo ""
echo "=== Services Running ==="
echo "Website: http://localhost:3000"
echo "PostgreSQL: localhost:5432"
echo "Agent: (waiting for build)"
echo ""
echo "Press Ctrl+C to stop all services"
wait
