# FiberQuest Pi 5 — Complete Demo Machine Setup

## Installed ✅
- Node.js 18, npm, PostgreSQL 16, Git
- RetroArch + emulator cores
- (In progress) OpenClaw

## Full Stack Planned

### 1. RetroArch (Emulation Layer)
- Games directory: ~/retro-games/
- BIOS path: ~/.config/retroarch/system/
- Cores: Genesis, SNES, GBA, N64
- UDP control: port 55355 (for RAM Viewer)

### 2. FiberQuest Website (Next.js)
- Port: 3000
- Repo: clone from GitHub
- Database: PostgreSQL
- Auth: JoyID

### 3. FiberQuest Agent (Background Service)
- Escrow monitoring (polls every 6s)
- Auto-publish logic
- Fiber channel management
- Local inference: qwen2.5:14b via NucBox Ollama (192.168.68.79:11434)
- Systemd service: fiberquest-agent.service

### 4. OpenClaw
- Gateway + plugin system
- Telegram integration for control
- Agent spawning for subagents
- Dashboard on port TBD

### 5. RAM Viewer (Optional Demo)
- Port: 8767
- Connect RetroArch for live memory capture
- Game address discovery

## Setup Order

1. ✅ System packages (Node, Postgres, Git)
2. ⏳ RetroArch + cores
3. ⏳ OpenClaw installation
4. ⏳ FiberQuest website clone + setup
5. ⏳ FiberQuest Agent build + systemd
6. ⏳ Inference routing config (to NucBox)
7. ⏳ Systemd services startup
8. ⏳ Configuration + testing

## Time Estimate
- RetroArch setup: 30 min (download cores)
- OpenClaw deploy: 1 hour
- Website clone + npm install: 20 min
- Agent build: 2-3 hours (building now)
- Database setup: 30 min
- Integration testing: 1-2 hours

**Total: 5-6 hours for full working demo**

## Key Notes
- All services run on single Pi 5 with NVMe
- Inference calls routed to NucBox (192.168.68.79:11434) for speed
- Agent runs as background systemd service (always-on)
- Website accessible at http://localhost:3000 (or http://192.168.68.65:3000 from other machines)
- RetroArch can emulate games for testing + demo
