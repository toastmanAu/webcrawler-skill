#!/bin/bash
# FiberQuest Pi Setup Script
# Run on fiberquest Pi after apt update/upgrade completes

set -e

echo "=== FiberQuest Pi Setup ==="
echo ""

# Install Node.js 20+ if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# Install PostgreSQL if not present
if ! command -v psql &> /dev/null; then
    echo "Installing PostgreSQL..."
    sudo apt install -y postgresql postgresql-contrib
fi

echo ""
echo "Versions:"
node --version
npm --version
psql --version
git --version

echo ""
echo "Creating FiberQuest directories..."
mkdir -p ~/fiberquest
mkdir -p ~/fiberquest-agent
mkdir -p ~/fiberquest-data

echo ""
echo "Cloning repositories..."
cd ~/fiberquest
git clone https://github.com/toastmanAu/fiberquest.git . || echo "Repo already exists"

echo ""
echo "Installing Node dependencies..."
npm install

echo ""
echo "PostgreSQL status:"
sudo systemctl status postgresql | grep Active

echo ""
echo "✅ FiberQuest Pi setup complete!"
echo ""
echo "Next steps:"
echo "1. Set up database: npm run db:setup"
echo "2. Start website: npm run dev"
echo "3. Start agent: npm run agent"
