# FiberQuest — Installation & Deployment Guide

## What is FiberQuest?

A **decentralized tournament platform** for retro games on CKB blockchain. Works in two modes:

1. **GUI Mode** (Default) — Electron app + RetroArch (like RetroPie)
2. **Daemon Mode** — Background service behind existing RetroArch setup

## Installation

### One-Command Setup

```bash
# Download installer
curl -fsSL https://raw.githubusercontent.com/toastmanAu/fiberquest/main/install.sh | bash

# Or local:
bash fiberquest-installer.sh
```

### GUI Mode (Demo Machine)

```bash
bash fiberquest-installer.sh --config ./fiberquest.config.json

# Then:
cd fiberquest && npm start
```

**Result:**
- Electron window (1024x640) on HDMI
- RetroArch auto-installed if needed
- Website + daemon both running
- All configured automatically

### Daemon Mode (Behind Existing RetroArch)

```bash
bash fiberquest-installer.sh --headless --config ./fiberquest.config.json

# Enable services:
sudo systemctl enable fiberquest-website fiberquestd
sudo systemctl start fiberquest-website fiberquestd

# Status:
sudo systemctl status fiberquest-website
sudo systemctl status fiberquestd
```

**Result:**
- Website runs on localhost:3000
- Daemon API on localhost:3001
- Works with your existing RetroArch install
- No Electron dependency

## Configuration

Edit `fiberquest.config.json`:

```json
{
  "mode": "gui",                    // or "daemon"
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
    "path": "/usr/bin/retroarch",   // Auto-detected
    "udpPort": 55355,               // RAM Viewer
    "allowRemote": false            // Security
  },
  "inference": {
    "primary": "http://192.168.68.79:11434",  // Local NucBox
    "fallback": "huggingface"                  // Cloud fallback
  },
  "tournament": {
    "games": ["mk2", "pokefr", "mk64"],
    "maxPlayers": 8,
    "testnetMode": true
  }
}
```

## Usage Modes

### Mode 1: Demo Machine (GUI)

**Best for:** Showing off at hackathons, living room setup, kiosk display

```bash
bash install.sh                    # Default GUI mode
cd fiberquest && npm start         # Launches fullscreen Electron
```

**On the screen:**
1. Electron window opens with FiberQuest
2. User registers with JoyID
3. Joins tournament
4. RetroArch launches with game
5. Plays → Validates → Wins prize

### Mode 2: Existing RetroArch User

**Best for:** People with 200+ games in RetroArch

```bash
bash install.sh --headless        # Don't install RetroArch
sudo systemctl start fiberquestd   # Run as daemon

# Configure your RetroArch:
# - Point RAM Viewer to localhost:3001
# - Enable UDP notifications on port 55355
```

**Flow:**
1. Open your RetroArch as usual
2. Visit http://localhost:3000 on another machine/phone
3. Register + join tournament
4. Launch game via RetroArch
5. RAM Viewer notifies daemon → validation happens automatically

### Mode 3: Server Installation

**Best for:** Hosting tournaments for multiple players

```bash
bash install.sh --headless --config /etc/fiberquest/config.json

# Systemd services auto-manage:
sudo systemctl enable fiberquest-website fiberquestd

# Access remotely:
# http://your-ip:3000  → Website
# http://your-ip:3001  → Daemon API
```

## What Gets Installed

### Always
- ✅ Node.js & npm (if missing)
- ✅ FiberQuest website (Next.js)
- ✅ PostgreSQL + database setup
- ✅ FiberQuest daemon (Express API)
- ✅ Game directories (~/fiberquest/games/)

### GUI Mode
- ✅ Electron framework
- ✅ RetroArch + cores
- ✅ Display drivers (if headless=false)

### Daemon Mode
- ✅ Only backend services
- ✅ Assumes RetroArch exists elsewhere

## Typical Workflows

### Workflow A: Pi 5 Demo Machine
```
bash install.sh                      # Installs everything
npm start                            # Fullscreen Electron on HDMI
User joins tournament on-screen      # Plays game → Wins
```

### Workflow B: Laptop + Existing RetroArch
```
bash install.sh --headless           # Website + daemon only
~/RetroArch/retroarch &              # Launch your RetroArch separately
curl http://localhost:3000           # Browse tournaments in browser
```

### Workflow C: Remote Server
```
bash install.sh --headless           # Server setup
sudo systemctl start fiberquestd     # Background services
# Users visit http://server-ip:3000  # From anywhere
# Play on their RetroArch locally    # Validation happens remotely
```

## Customization

### Change RetroArch Path
```bash
bash install.sh --retroarch /path/to/retroarch
```

### Use Existing Database
```json
{
  "database": {
    "host": "db.example.com",
    "user": "prod_user",
    "password": "secure_pass",
    "database": "fiberquest_prod"
  }
}
```

### Custom Inference Provider
```json
{
  "inference": {
    "primary": "http://your-inference-server:8000",
    "fallback": "http://backup-inference:8000"
  }
}
```

## Troubleshooting

### Website won't start
```bash
# Check ports:
lsof -i :3000
lsof -i :3001

# Check database:
psql -h localhost -U fiberquest -d fiberquest -c "SELECT 1"

# Restart:
sudo systemctl restart fiberquest-website
```

### Daemon won't connect to RetroArch
```bash
# Check UDP port:
netstat -u | grep 55355

# Check config:
cat fiberquest.config.json | grep udpPort

# Test connection:
curl http://localhost:3001/api/system
```

### Games directory missing
```bash
mkdir -p ~/fiberquest/games/{snes,gba,n64,genesis}

# Copy your ROMs:
cp my-games/*.zip ~/fiberquest/games/snes/
```

## Uninstall

```bash
# Daemon mode:
sudo systemctl stop fiberquest-website fiberquestd
sudo systemctl disable fiberquest-website fiberquestd

# Remove systemd services:
sudo rm /etc/systemd/system/fiberquest-*
sudo systemctl daemon-reload

# Remove files:
rm -rf ~/fiberquest

# Keep database (optional):
sudo -u postgres dropdb fiberquest
```

## Support

- Issues: https://github.com/toastmanAu/fiberquest/issues
- Docs: https://fiberquest.wyltek.dev
- Chat: Discord #fiberquest-support

---

**FiberQuest v1.0 — Play Retro, Win Crypto.** 🎮
