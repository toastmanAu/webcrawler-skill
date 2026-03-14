# FiberQuest Pi 5 — Ready for Agent Build

## ✅ Completed Setup (18:20-18:40 GMT+10:30)

**System:**
- Ubuntu Desktop → converted to headless (multi-user.target)
- Node.js 18, npm 9, PostgreSQL 16, Git
- RetroArch + assets (available when needed)

**Website:**
- ✅ Cloned: `/home/phill/fiberquest`
- ✅ npm install: 479 packages (with 33 vulnerabilities flagged, non-critical)
- ✅ .env.local created with defaults

**Database:**
- ✅ PostgreSQL running
- ✅ Database `fiberquest` created
- ✅ User `fiberquest` with password `fiberquest_dev`
- ✅ Connection string: `postgres://fiberquest:fiberquest_dev@localhost:5432/fiberquest`

**Agent Infrastructure:**
- ✅ Directory created: `/home/phill/fiberquest-agent`
- ✅ Systemd service template ready
- ✅ Startup script ready

## IP & Access

- **Hostname:** fiberquest (192.168.68.65)
- **SSH:** `ssh fiberquest` (key auth)
- **Website:** http://192.168.68.65:3000 (when running)
- **PostgreSQL:** localhost:5432

## Power Status

⚠️ **Crashed during GUI + RetroArch load**
- Root cause: Inadequate power supply (likely <15W when peak load)
- Solution: Official Pi 5 27W USB-C PSU or equivalent
- Mitigation: Disabled GUI (headless mode) to reduce idle load

## Next Steps (When Ready)

### 1. Build FiberQuest Agent (2-3 hours)
```bash
cd ~/fiberquest-agent
npm install
npm run build
```

### 2. Deploy Agent as Systemd Service
```bash
sudo cp ./fiberquest-agent.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable fiberquest-agent
sudo systemctl start fiberquest-agent
```

### 3. Start Website
```bash
cd ~/fiberquest
npm run dev
# Runs on http://localhost:3000
```

### 4. Testing
- Verify database connectivity
- Test website loads
- Test agent starts and monitors escrow
- Verify inference routing to NucBox (192.168.68.79:11434)

## Files Ready

- Systemd service: `/home/phill/.openclaw/workspace/scripts/fiberquest-agent.service`
- DB setup: Commands executed directly on Pi
- Startup guide: Documented above

## Environment Variables

### Website (.env.local)
```
NEXT_PUBLIC_CKB_RPC_URL=https://testnet.ckb.dev
NEXT_PUBLIC_CKB_ESCROW_ADDRESS=ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqv5emmruh9u256aaa4l2a4nw3qf3n8fksq60duk9
JOYID_CLIENT_SECRET=YOUR_SECRET
DATABASE_URL=postgres://fiberquest:fiberquest_dev@localhost:5432/fiberquest
NEXT_PUBLIC_FIBER_RPC_URL=http://192.168.68.79:8227
```

### Agent (.env.agent — to be created)
```
CKB_ESCROW_PRIVATE_KEY=0x...
FIBER_NODE_PRIVATE_KEY=0x...
CKB_RPC_URL=https://testnet.ckb.dev
FIBER_RPC_URL=http://192.168.68.79:8227
DATABASE_URL=postgres://fiberquest:fiberquest_dev@localhost:5432/fiberquest
INFERENCE_URL=http://192.168.68.79:11434
```

## Mountain to Climb

✅ System ready
✅ Website scaffolded
✅ Database initialized
🔴 Agent code: Need to build
🔴 Integration: Need to test

**Time remaining before March 25:** 11 days
**Estimated agent build + test:** 4-6 hours
**Estimated integration + debugging:** 2-4 hours

**Status: On Track** 🎯
