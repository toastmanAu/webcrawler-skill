# FiberQuest Installation — Quick Reference

## One Command to Rule Them All

```bash
bash fiberquest-installer.sh
```

## Three Installation Profiles

| Profile | Command | Use Case | RetroArch |
|---------|---------|----------|-----------|
| **GUI** | `bash install.sh` | Demo machine, Pi 5, kiosk | Auto-install |
| **Daemon** | `bash install.sh --headless` | Existing RetroArch user | Use existing |
| **Server** | `bash install.sh --headless --config /etc/fiberquest/config.json` | Hosted tournaments | Remote |

## What Installer Does

1. ✅ Checks Node.js (installs if missing)
2. ✅ Creates directories (~fiberquest/games/, daemon/)
3. ✅ Clones website from GitHub
4. ✅ Installs npm dependencies
5. ✅ Detects/installs RetroArch
6. ✅ Sets up PostgreSQL + database
7. ✅ Installs daemon (Express API)
8. ✅ Configures systemd services (daemon mode only)
9. ✅ Creates config file (fiberquest.config.json)

## After Installation

### GUI Mode
```bash
cd fiberquest && npm start    # Launches Electron fullscreen
```

### Daemon Mode
```bash
sudo systemctl start fiberquest-website fiberquestd
# Services run in background
# Access at http://localhost:3000 + http://localhost:3001
```

## What You Get

✅ **Website** — Tournament browser + registration (localhost:3000)
✅ **Daemon** — Validation + scoring API (localhost:3001)
✅ **RetroArch** — Game emulation (auto or existing)
✅ **Database** — PostgreSQL with schema pre-created
✅ **Config** — fiberquest.config.json (fully customizable)
✅ **Games Dir** — ~/fiberquest/games/{snes,gba,n64,genesis}/
✅ **Systemd** — Auto-start on boot (daemon mode)

## Configuration Override

```bash
# Use custom config:
bash install.sh --config /etc/fiberquest/prod.config.json

# Specify RetroArch location:
bash install.sh --retroarch /home/user/.config/RetroArch/retroarch

# Headless (no Electron):
bash install.sh --headless
```

## Typical User Flow

### Demo Machine (Pi 5 + HDMI)
1. `bash install.sh` ← Installs everything
2. `npm start` ← Electron window opens fullscreen
3. User sees FiberQuest on TV
4. Joins tournament → Plays game → Wins CKB

### Existing RetroArch User
1. `bash install.sh --headless` ← Just backend
2. Launch your RetroArch normally
3. Open http://localhost:3000 in browser
4. Join tournament → Game launches in RetroArch → Validation automatic

### Hosting a Tournament Server
1. `bash install.sh --headless --config /etc/fiberquest/prod.json`
2. `sudo systemctl enable fiberquest-{website,d}`
3. Users worldwide access http://your-server:3000
4. Play on their own RetroArch → Validate on your server

## Customization

**Config file: `fiberquest.config.json`**
```json
{
  "mode": "gui|daemon",
  "websitePort": 3000,
  "daemonPort": 3001,
  "database": { /* PostgreSQL connection */ },
  "retroarch": { "path": "/usr/bin/retroarch", ... },
  "inference": { "primary": "...", "fallback": "..." },
  "tournament": { "games": [...], "maxPlayers": 8, ... }
}
```

Edit before or after installation. Changes take effect on restart.

## Uninstall

```bash
# Stop services:
sudo systemctl stop fiberquest-{website,d}

# Remove:
rm -rf ~/fiberquest
sudo systemctl disable fiberquest-{website,d}
sudo rm /etc/systemd/system/fiberquest-*

# Clean DB (optional):
sudo -u postgres dropdb fiberquest
```

## Key Insight

**FiberQuest is not a fixed application — it's a toolkit.**

- **Install GUI mode** → Demo machine (like RetroPie)
- **Install daemon mode** → Runs behind your existing setup
- **Use config file** → Customize everything (ports, inference, games, etc.)
- **Add `--params`** → Override config per instance

One installer. Three use cases. Infinite flexibility.

---

**FiberQuest: Play Retro Games, Win CKB Prizes** 🎮💰
