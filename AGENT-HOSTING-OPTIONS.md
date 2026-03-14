# FiberQuest Agent — Hosting Options Analysis

## Your Hardware Available

```
1. Raspberry Pi 5 (arm64) — Current machine (OpenClaw host)
   - CPU: Broadcom BCM2712 @ 2.4GHz
   - RAM: 8GB
   - Role: Main OpenClaw runtime
   - Load: Light (polling, logging)

2. NucBox K8 Plus (Ryzen 7 8845HS)
   - CPU: 8 cores, Radeon 780M iGPU
   - RAM: 32GB
   - Ollama: qwen2.5:14b (always on)
   - Role: Primary inference node
   - Load: Available (mainly idle)

3. driveThree (i7-14700K, RTX 3060 Ti)
   - CPU: 14 cores, RTX 3060 Ti 8GB VRAM
   - RAM: 64GB
   - Ollama: qwen2.5:14b (on-demand, 2h timeout)
   - Role: Secondary inference node
   - Load: Used during active work

4. OPi5+ (Rockchip RK3588)
   - CPU: 8 cores, Mali G52 GPU
   - RAM: 16GB
   - Ollama: qwen2.5:3b (working, power-limited)
   - Role: Test/hobby board
   - Load: Can run 3b model

5. Orange Pi 3B (New agent board)
   - CPU: Rockchip RK3566, Mali GPU
   - RAM: 2GB
   - Status: OpenClaw installed, not yet used
   - Role: Could be dedicated agent host

6. N100 Mini PC (Intel N100)
   - CPU: 4 cores, iGPU
   - RAM: 15GB
   - Role: Fiber node, trading bot host
   - Load: Moderate (Fiber + crons)
```

---

## Option 1: Agent on Pi 5 (Current OpenClaw Host)

**Setup:**
```
Pi 5 (OpenClaw + Agent as subagent/background process)
├─ HTTP server (website backend)
├─ FiberQuest Agent process
└─ Database (SQLite or client for Postgres)

Inference:
├─ Call NucBox Ollama (SSH tunnel or HTTP)
└─ Or use HuggingFace free tier (qwen2.5, llama, deepseek)
```

**Pros:**
- ✅ Single machine (simpler deploy)
- ✅ No additional hardware needed
- ✅ Shared database (SQLite local)
- ✅ Agent code stays on your network

**Cons:**
- ❌ Pi 5 CPU limited (~2.4GHz single-thread)
- ❌ Agent polling + website serving = contention
- ❌ If Pi reboots, agent stops
- ❌ No redundancy

**Inference Sources:**
- NucBox Ollama (HTTP: 192.168.68.79:11434)
- HuggingFace free tier (no key needed)
- Local LLM if needed (lightweight)

---

## Option 2: Agent on Orange Pi 3B (Dedicated)

**Setup:**
```
OPi3B (Dedicated FiberQuest Agent)
├─ FiberQuest Agent service
├─ Database client (connect to Pi 5 Postgres)
└─ Inference via NucBox or HF

Pi 5 (OpenClaw + Website)
├─ Next.js website
└─ Postgres database
```

**Pros:**
- ✅ Dedicated hardware (no contention)
- ✅ Agent independent of OpenClaw
- ✅ Survives Pi 5 reboot
- ✅ Easy to restart/debug independently
- ✅ Already has OpenClaw installed

**Cons:**
- ⚠️ OPi3B only 2GB RAM (lightweight agent only)
- ⚠️ Another machine to manage
- ✅ But already on network, minimal power

**Inference Sources:**
- NucBox Ollama (shared, fast)
- HuggingFace free tier (fallback)

---

## Option 3: Agent on NucBox (Co-Located with Inference)

**Setup:**
```
NucBox (Ryzen 7 + Ollama)
├─ FiberQuest Agent service
├─ Ollama (local inference)
└─ Database client (connect to Pi 5 Postgres)

Pi 5 (OpenClaw + Website)
├─ Next.js website
└─ Postgres database
```

**Pros:**
- ✅ Agent + inference on same machine (no network hops)
- ✅ Fastest inference (GPU RTX 3060 Ti available)
- ✅ Always-on hardware
- ✅ Plenty of RAM (32GB)
- ✅ Proven Ollama setup

**Cons:**
- ⚠️ Inference competes with agent CPU
- ⚠️ But NucBox has plenty of cores (8)

**Inference Sources:**
- Local Ollama (instant, no latency)
- Fallback to HuggingFace free tier

---

## Option 4: Agent on N100 (Fiber Node Host)

**Setup:**
```
N100 (Trading bot + Fiber + Agent)
├─ FiberQuest Agent service
├─ Fiber node (already running)
├─ Trading bot (already running)
└─ Database client (connect to Pi 5 Postgres)

Pi 5 (OpenClaw + Website)
├─ Next.js website
└─ Postgres database
```

**Pros:**
- ✅ N100 already has Fiber node (can use local Fiber RPC)
- ✅ Always-on, proven stable
- ✅ Similar to NucBox option

**Cons:**
- ⚠️ Already running trading bot + Fiber = contention
- ⚠️ 4-core N100 is getting busy

---

## Option 5: Inference from Multiple Sources (Recommended for Hackathon)

**Agent calls inference intelligently:**

```javascript
const agent = {
  async callInference(prompt) {
    try {
      // 1. Try NucBox Ollama (fast, local)
      return await fetch('http://192.168.68.79:11434/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          model: 'qwen2.5:14b',
          prompt,
          stream: false
        })
      });
    } catch {
      try {
        // 2. Fallback to HuggingFace free tier (slow but free)
        return await huggingFaceAPI.generate(prompt);
      } catch {
        // 3. Fallback to local 3b if available
        return await fetch('http://localhost:11434/api/generate', {...});
      }
    }
  }
};
```

**Pros:**
- ✅ Redundancy (if NucBox down, use HuggingFace)
- ✅ Load balancing (heavy tasks → GPU, light → free tier)
- ✅ Cost optimization (free until needed)
- ✅ Never blocked on inference

---

## Recommendation for Hackathon (2-Week Timeline)

### **Simplest: Agent on Pi 5 (with NucBox fallback)**

```
Pi 5:
├─ OpenClaw (main)
├─ Next.js website (port 3000)
├─ FiberQuest Agent (background process)
├─ SQLite or Postgres client
└─ Systemd service: `fiberquest-agent.service`

Inference:
├─ NucBox Ollama (primary, 192.168.68.79:11434)
└─ HuggingFace free tier (fallback)
```

**Why:**
- ✅ Minimal setup (1 machine)
- ✅ Fast deployment (1-2 hours)
- ✅ Proven NucBox inference
- ✅ Can iterate quickly
- ✅ Works for demo/hackathon

**After Hackathon:** Move to dedicated OPi3B or N100

---

## Most Robust: Agent on OPi3B (Dedicated)

```
Pi 5 (Website + Database):
├─ Next.js website
└─ Postgres

OPi3B (Agent + Monitoring):
├─ FiberQuest Agent service
└─ Health checks

Inference (Shared):
├─ NucBox Ollama (192.168.68.79:11434)
└─ HuggingFace (fallback)
```

**Why:**
- ✅ Dedicated agent hardware
- ✅ Independent restart/debug
- ✅ OPi3B already on network
- ✅ Minimal cost (~$0 power)
- ✅ Clean separation

**Setup time:** 2-3 hours

---

## Safety: Is Remote Inference Safe?

**Your Question:** Can the agent call external inference? Is that safe for fund operations?

**Answer:**

✅ **Safe if:**
- Agent only calls inference for **non-critical logic** (logging, analysis)
- Agent **NEVER sends CKB_ESCROW_PRIVATE_KEY** to external service
- Inference is **read-only** (no decision-making with fund transfers)
- Fallback chain exists (local → paid → free)

❌ **NOT Safe if:**
- Agent sends private key to external service
- Inference results determine fund transfers (e.g., "should I refund this player?")
- No fallback (blocks on external service)

**For FiberQuest Agent:**
- Agent logic should be **deterministic** (block height, payment detection)
- Inference only for **monitoring/logging** (optional, not critical path)
- Fund decisions based on **blockchain state** (immutable), not inference

✅ **Recommendation:** Use inference for **optional features** (anomaly detection, alerts) but **never for fund logic**.

---

## Choice: What Should We Do?

### **For the Hackathon (March 25 deadline)**

```
PRIMARY (Simplest):
└─ Pi 5: Agent as background service
   ├─ Calls NucBox Ollama (192.168.68.79:11434)
   └─ Fallback: HuggingFace free tier

SECONDARY (More Robust):
└─ OPi3B: Dedicated agent
   ├─ Calls NucBox Ollama
   └─ Fallback: HuggingFace free tier
```

**Time to deploy:**
- Pi 5 option: **1-2 hours**
- OPi3B option: **3-4 hours**

**My recommendation:** Start with **Pi 5** (faster), move to **OPi3B** after hackathon if needed.

---

## Implementation Plan (If You Choose Pi 5)

```bash
# 1. Create agent code
/home/phill/fiberquest-agent/src/
├─ index.ts (main loop)
├─ escrow-monitor.ts (polling)
├─ auto-publisher.ts (block cutoff)
└─ inference-client.ts (call NucBox + HF fallback)

# 2. Create systemd service
/etc/systemd/system/fiberquest-agent.service
├─ ExecStart: /usr/bin/node /home/phill/fiberquest-agent/dist/index.js
├─ Restart: always
└─ Environment: (load from .env.agent)

# 3. Deploy
npm install
npm run build
sudo systemctl start fiberquest-agent
sudo systemctl enable fiberquest-agent

# 4. Verify
tail -f /var/log/fiberquest-agent.log
# Should show: "Escrow monitor started, polling every 6s"
```

---

## Network Diagram (Pi 5 Option)

```
Internet
├─ HuggingFace Free Tier (inference fallback)
└─ CKB RPC (testnet.ckb.dev)

Pi 5 (localhost)
├─ Next.js website (port 3000)
├─ FiberQuest Agent (port 9000, internal)
└─ Postgres (port 5432, internal)
    ↓
    ↓ SSH to 192.168.68.79 (NucBox)
    │
NucBox
└─ Ollama (port 11434)
   └─ qwen2.5:14b (inference)

CKBNode (192.168.68.87)
└─ CKB RPC (port 8114)

Fiber Network
└─ RPC (port 8227)
```

---

## Final Recommendation

**For hackathon (fastest path):**

```
Host Agent on: Pi 5
Inference from: NucBox Ollama (primary) + HuggingFace (fallback)
Database: Postgres (shared with website)
Systemd service: auto-restart on failure
Deploy time: 1-2 hours
```

**After hackathon (if needed):**

```
Host Agent on: OPi3B (dedicated)
Same inference + database setup
Better isolation, independent lifecycle
```

**Does this work for you, or want to adjust?**
