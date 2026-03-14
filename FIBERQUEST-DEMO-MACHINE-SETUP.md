# FiberQuest Demo Machine — Complete Setup Guide

## Hardware
- **Device:** Raspberry Pi 5, NVMe SSD
- **Display:** HDMI 1024x640 screen (attached)
- **Network:** 192.168.68.65

## What's Installed

✅ **Ubuntu Desktop** (graphical UI on HDMI)
✅ **FiberQuest Website** (Next.js, port 3000)
✅ **RetroArch** (game emulation)
✅ **PostgreSQL** (tournament database)
✅ **Game Directories** (~/ retro-games/{snes,genesis,gba,n64})

## First-Time Setup

### 1. Add Game ROMs
Copy your game ROMs to:
```
~/retro-games/snes/       → Mortal Kombat II, DKC, Harvest Moon
~/retro-games/gba/        → Pokemon Fire Red
~/retro-games/n64/        → Mario Kart 64
~/retro-games/genesis/    → Any Genesis games
```

### 2. Reboot or Restart Services
```bash
# Auto-start on next reboot:
sudo reboot

# Or start manually:
bash ~/.config/autostart/fiberquest-demo.sh
```

### 3. Login to Desktop
- Desktop will boot Ubuntu with graphical interface
- Services auto-start in background
- Firefox opens to http://localhost:3000

## Demo Flow

### On the HDMI Screen
1. **Desktop appears** with Firefox showing FiberQuest website
2. **User registration** via JoyID (passkey login)
3. **Tournament browser** — shows available games
4. **Game selection** — click "Join Tournament"
5. **RetroArch launches** with selected game
6. **Player plays game** — RAM Viewer captures gameplay
7. **Submit score** — validation runs, winner determined
8. **Prize claim** — transaction via Fiber channel (testnet)

### Local Inference (Fallback)
If NucBox (192.168.68.79) is unavailable:
- Agent falls back to HuggingFace free tier
- Or uses local inference (if available)
- Website still fully functional

### Network Access
View FiberQuest from another machine:
```
Browser: http://192.168.68.65:3000
```

## Services Running on Boot

| Service | Port | Status |
|---------|------|--------|
| Website (Next.js) | 3000 | ✅ Auto-start |
| PostgreSQL | 5432 | ✅ Auto-start |
| RetroArch | — | ✅ Auto-start (desktop) |
| Agent | — | ⏳ Coming soon |

## Demo Talking Points

1. **"FiberQuest is a decentralized tournament platform"**
   - Registration happens on this machine
   - Games run locally on RetroArch
   - All via CKB blockchain

2. **"Notice the inference?"**
   - Agent uses NucBox (on network) for intelligence
   - Can switch to free cloud inference anytime
   - Privacy-first: keys stay local, only observability leaves

3. **"The validator prevents cheating"**
   - Game state validated against impossible transitions
   - Proof stored on CKB
   - Trustless settlement via Fiber channels

4. **"Everything runs on a Pi"**
   - Website, database, game emulation
   - All on this single $50 computer
   - Scales to thousands of tournaments

## Troubleshooting

### Website not loading?
```bash
# Check if running:
ps aux | grep npm | grep fiberquest

# Restart:
pkill -f "npm run dev"
cd ~/fiberquest && npm run dev &
```

### Games not detected?
- Ensure ROM files are in ~/retro-games/{system}/
- Restart RetroArch
- Check file permissions: `chmod 755 ~/retro-games/*`

### Database errors?
```bash
# Check PostgreSQL:
sudo systemctl status postgresql
sudo systemctl restart postgresql
```

### Low power warning?
- Disable RetroArch if not demoing (saves power)
- Disable Firefox if only using via network
- Get a 27W USB-C power supply for full load support

## Power Management

Current setup optimizes for demo:
- Disabled: Cups, Bluetooth, Avahi, automatic updates
- Enabled: Essential services + display
- Load: ~12-15W idle, ~18-22W with games running

**Best PSU:** Official Raspberry Pi 27W USB-C

## Customization

### Change Demo Game
Edit `~/.config/autostart/fiberquest-demo.desktop`:
```bash
Exec=bash /path/to/custom-launcher.sh
```

### Custom Dashboard
Replace Firefox launcher with your own HTML dashboard:
```bash
# Create ~/demo-dashboard.html
# Point launcher to: firefox ~/demo-dashboard.html
```

### Inference Preferences
In `~/fiberquest/.env.local`:
```bash
INFERENCE_URL=http://192.168.68.79:11434    # NucBox
# Or:
INFERENCE_URL=https://huggingface.co/api     # Cloud fallback
```

## Next: Agent Build

After demo is verified, build the agent:
```bash
cd ~/fiberquest-agent
npm install
npm run build
npm start
```

Then the system is fully autonomous (website + agent in background).

---

**Setup complete. Press reboot to start the demo.** 🎮
