# FiberQuest Electron Sidecar — Complete Setup

## What It Does

The Electron sidecar is a **local desktop UI** that:
- Connects to the website backend (running on localhost:3000)
- Displays the tournament interface on the HDMI screen
- Provides system status (PostgreSQL, website, inference)
- Launches RetroArch for game selection
- Runs fullscreen for demo presentation

## Architecture

```
┌─────────────────────────────────────┐
│     Electron App (main.js)          │
│  1024x640 HDMI Display              │
└──────────────┬──────────────────────┘
               │
               ├─→ http://localhost:3000 (Website API)
               ├─→ RetroArch (subprocess launch)
               ├─→ System Status (PostgreSQL check)
               └─→ Renderer (preload.js bridge)
```

## Installation

### 1. Copy Files to Pi
```bash
scp fiberquest-electron-main.js fiberquest@192.168.68.65:~/fiberquest-electron/main.js
scp fiberquest-electron-preload.js fiberquest@192.168.68.65:~/fiberquest-electron/preload.js
scp fiberquest-electron-index.html fiberquest@192.168.68.65:~/fiberquest-electron/index.html
scp fiberquest-electron-package.json fiberquest@192.168.68.65:~/fiberquest-electron/package.json
```

### 2. Install on Pi
```bash
ssh fiberquest "cd ~/fiberquest-electron && npm install"
```

### 3. Start Electron App
```bash
# Development (with DevTools):
npm run dev

# Production:
npm start
```

## Usage Flow

1. **Boot Pi** → Desktop loads → Electron app auto-launches
2. **Electron window** → Displays FiberQuest demo UI (1024x640)
3. **User clicks "Open Website"** → Website (http://localhost:3000) loads in Electron
4. **Registration** → User signs in with JoyID
5. **Browse tournaments** → List of games
6. **Join tournament** → Select game (e.g., Mortal Kombat II)
7. **Launch game** → Electron triggers RetroArch with game ROM
8. **Play** → RAM Viewer captures gameplay
9. **Submit** → Validator checks, winner determined
10. **Prize** → Claimed via Fiber channel (testnet)

## File Structure

```
fiberquest-electron/
├── main.js           → Electron main process
├── preload.js        → Secure IPC bridge
├── index.html        → Fallback dashboard UI
├── package.json      → Dependencies
└── node_modules/     → Installed packages
```

## Key Features

### 1. Website Bridge
- Auto-connects to http://localhost:3000
- Falls back to local HTML dashboard if website unavailable
- Dev mode shows DevTools for debugging

### 2. System Status Monitoring
```javascript
{
  postgresql: '✅ Running',
  website: '✅ Running',
  inference: '✅ Available',
  timestamp: '18:45:32'
}
```

### 3. RetroArch Integration
- Button to launch RetroArch
- Passes game ROM path to emulator
- Monitors game state for tournament

### 4. Security (Preload Bridge)
- No direct Node.js access from renderer
- IPC channels for privileged operations
- Safe subprocess launching

## Demo Talking Points

1. **"This is running on a Raspberry Pi 5"**
   - Website backend (Node.js)
   - Database (PostgreSQL)
   - Electron UI (this window)
   - Game emulation (RetroArch)
   - All on one $50 computer

2. **"The UI adapts to whatever we need"**
   - Shows website if available
   - Falls back to dashboard if not
   - Shows system health in real-time

3. **"Games run locally, but inference can come from anywhere"**
   - Local NucBox (192.168.68.79) - fast
   - Or cloud HuggingFace - resilient

4. **"The whole thing is trustless"**
   - Validator checks for cheating
   - Proof stored on CKB
   - Settlement via Fiber channels

## Troubleshooting

### Electron won't start
```bash
# Check Node.js/npm installed:
node --version
npm --version

# Check main.js exists:
ls ~/fiberquest-electron/main.js

# Rebuild:
cd ~/fiberquest-electron
npm install --force
```

### Website not loading
```bash
# Check website is running:
curl http://localhost:3000

# Check logs:
tail -f ~/fiberquest-website.log
```

### DevTools not opening
- Press Ctrl+Shift+I in Electron window
- Or update preload.js to add menu option

### High CPU usage
- Disable DevTools in production
- Check RetroArch process isn't running background
- Monitor with: `top -p $(pgrep -f electron)`

## Customization

### Change Window Size
Edit `main.js`:
```javascript
mainWindow = new BrowserWindow({
  width: 1280,    // Change this
  height: 720,    // And this
  ...
});
```

### Change Default URL
Edit `main.js`:
```javascript
const startUrl = isDev
  ? 'http://localhost:3000'  // Change this
  : `file://${path.join(__dirname, 'dist/index.html')}`;
```

### Add Menu Items
Edit `main.js` template and add under 'View':
```javascript
{
  label: 'Games',
  submenu: [
    { label: 'Mortal Kombat II', click: () => launchGame('mk2') },
    { label: 'Pokemon Fire Red', click: () => launchGame('pokefr') },
  ]
}
```

## Production Build

```bash
# Build AppImage for Linux ARM64:
cd ~/fiberquest-electron
npm run build

# Output: dist/FiberQuestDemo-*.AppImage
```

## Auto-Launch on Boot

Add to `~/.config/autostart/fiberquest-electron.desktop`:
```ini
[Desktop Entry]
Type=Application
Name=FiberQuest Electron
Exec=npm start --prefix /home/phill/fiberquest-electron
Terminal=false
X-GNOME-Autostart-enabled=true
```

---

**Electron sidecar complete. Ready for demo.** 🎮
