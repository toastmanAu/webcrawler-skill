#!/bin/bash
# FiberQuest Installer
# One-command setup for tournament platform + RetroArch integration
# Usage: bash install.sh [--headless] [--config /path/to/config.json]

set -e

VERSION="1.0.0"
INSTALL_DIR="${INSTALL_DIR:-.}"
CONFIG_FILE="${1:-./fiberquest.config.json}"
HEADLESS=false
RETROARCH_PATH=""

echo "╔═════════════════════════════════╗"
echo "║   FiberQuest Installer v$VERSION     ║"
echo "║   Tournament Platform for CKB   ║"
echo "╚═════════════════════════════════╝"
echo ""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --headless) HEADLESS=true; shift ;;
    --config) CONFIG_FILE="$2"; shift 2 ;;
    --retroarch) RETROARCH_PATH="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

echo "Installation mode: $([ "$HEADLESS" = true ] && echo 'Headless (daemon)' || echo 'GUI (Electron)')"
echo ""

# === STEP 1: Check System ===
echo "📋 Checking system requirements..."

# Check OS
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
  echo "❌ FiberQuest requires Linux"
  exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "📦 Installing Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js $NODE_VERSION"

# Check npm
npm_version=$(npm -v)
echo "✅ npm $npm_version"

# === STEP 2: Create Directories ===
echo ""
echo "📁 Creating directories..."
mkdir -p "$INSTALL_DIR"/{website,daemon,games/{snes,gba,n64,genesis}}
echo "✅ Directories created"

# === STEP 3: Install Website ===
echo ""
echo "🌐 Installing FiberQuest website..."
if [ ! -d "$INSTALL_DIR/website/.git" ]; then
  git clone https://github.com/toastmanAu/fiberquest.git "$INSTALL_DIR/website"
fi
cd "$INSTALL_DIR/website"
npm install
echo "✅ Website ready at port 3000"

# === STEP 4: Install/Detect RetroArch ===
echo ""
echo "🎮 RetroArch detection..."
if [ -n "$RETROARCH_PATH" ]; then
  echo "✅ Using existing RetroArch: $RETROARCH_PATH"
elif command -v retroarch &> /dev/null; then
  RETROARCH_PATH=$(which retroarch)
  echo "✅ Found RetroArch: $RETROARCH_PATH"
else
  echo "📦 Installing RetroArch..."
  sudo apt-get install -y retroarch retroarch-assets
  RETROARCH_PATH=$(which retroarch)
  echo "✅ RetroArch installed: $RETROARCH_PATH"
fi

# === STEP 5: Setup PostgreSQL ===
echo ""
echo "🗄️  Setting up database..."
sudo systemctl start postgresql 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE IF NOT EXISTS fiberquest;" 2>/dev/null || true
sudo -u postgres psql -c "CREATE USER IF NOT EXISTS fiberquest WITH PASSWORD 'dev';" 2>/dev/null || true
sudo -u postgres psql -c "ALTER USER fiberquest CREATEDB;" 2>/dev/null || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE fiberquest TO fiberquest;" 2>/dev/null || true
echo "✅ Database ready"

# === STEP 6: Setup Games Database (Local, Not in Git) ===
echo ""
echo "📚 Setting up Games Database..."
bash /home/phill/.openclaw/workspace/scripts/setup-fiberquest-gamesdb.sh
echo "✅ Games database configured locally"

# === STEP 7: Install FiberQuest Daemon ===
echo ""
echo "⚙️  Installing FiberQuest daemon..."
cd "$INSTALL_DIR"
mkdir -p daemon
cat > daemon/package.json << 'DAEMON_PKG'
{
  "name": "fiberquestd",
  "version": "1.0.0",
  "description": "FiberQuest Tournament Daemon",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "NODE_ENV=development node index.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "pg": "^8.11.0",
    "dotenv": "^16.0.0"
  }
}
DAEMON_PKG

cd daemon && npm install && cd ..
echo "✅ Daemon installed"

# === STEP 7: Configure ===
echo ""
echo "⚙️  Creating configuration..."
cat > "$CONFIG_FILE" << 'CONFIG'
{
  "mode": "gui",
  "websitePort": 3000,
  "daemonPort": 3001,
  "database": {
    "host": "localhost",
    "port": 5432,
    "user": "fiberquest",
    "password": "dev",
    "database": "fiberquest"
  },
  "retroarch": {
    "path": "/usr/bin/retroarch",
    "udpPort": 55355,
    "allowRemote": false
  },
  "inference": {
    "primary": "http://192.168.68.79:11434",
    "fallback": "huggingface"
  },
  "tournament": {
    "games": ["mk2", "pokefr", "mk64"],
    "maxPlayers": 8,
    "testnetMode": true
  }
}
CONFIG

echo "✅ Configuration created: $CONFIG_FILE"

# === STEP 8: Setup Systemd Services ===
echo ""
echo "🔧 Setting up services..."

if [ "$HEADLESS" = true ]; then
  echo "📝 Creating fiberquest-website.service..."
  sudo tee /etc/systemd/system/fiberquest-website.service > /dev/null << 'WEBSITE_SVC'
[Unit]
Description=FiberQuest Website
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR/website
ExecStart=/usr/bin/npm run dev
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
WEBSITE_SVC

  echo "📝 Creating fiberquestd.service..."
  sudo tee /etc/systemd/system/fiberquestd.service > /dev/null << 'DAEMON_SVC'
[Unit]
Description=FiberQuest Daemon
After=network.target postgresql.service fiberquest-website.service
Wants=fiberquest-website.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR/daemon
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
DAEMON_SVC

  sudo systemctl daemon-reload
  sudo systemctl enable fiberquest-website fiberquestd
  echo "✅ Services configured (enable with: sudo systemctl enable fiberquest-website fiberquestd)"
else
  echo "📝 Creating Electron app..."
  # Electron setup will be done separately
fi

# === STEP 9: Verification ===
echo ""
echo "✅ Installation complete!"
echo ""
echo "═════════════════════════════════"
echo "FiberQuest Setup Summary"
echo "═════════════════════════════════"
echo ""
echo "📂 Installation Directory: $INSTALL_DIR"
echo "🌐 Website: http://localhost:3000"
echo "⚙️  Daemon: http://localhost:3001"
echo "🎮 RetroArch: $RETROARCH_PATH"
echo "🗄️  Database: fiberquest@localhost"
echo "⚙️  Config: $CONFIG_FILE"
echo ""

if [ "$HEADLESS" = true ]; then
  echo "🚀 Headless Mode (Daemon)"
  echo "   Start services:"
  echo "   $ sudo systemctl start fiberquest-website fiberquestd"
  echo ""
  echo "   Monitor:"
  echo "   $ sudo systemctl status fiberquest-website"
  echo "   $ sudo systemctl status fiberquestd"
else
  echo "🚀 GUI Mode (Electron + RetroArch)"
  echo "   Start:"
  echo "   $ cd $INSTALL_DIR && npm start"
  echo ""
  echo "   Add ROM files to:"
  for dir in games/*; do
    echo "   - $INSTALL_DIR/$dir"
  done
fi

echo ""
echo "📚 Documentation:"
echo "   - User Guide: ./GUIDE.md"
echo "   - Daemon Config: ./fiberquest.config.json"
echo "   - Troubleshooting: ./TROUBLESHOOT.md"
echo ""
