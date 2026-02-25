# PROJECTS.md — Master Project Index
> Maintained by Kernel 🐧 | Last updated: 2026-02-25

---

## 🟢 Active / Running

### CKB Node Dashboard
- **What:** Node.js proxy + HTML polling dashboard for CKB node stats
- **Repo:** https://github.com/toastmanAu/ckb-node-dashboard
- **Live at:** http://localhost:8080 (Pi 5) → node 192.168.68.87:8114
- **Status:** Running, monitored in heartbeat
- **Notes:** Health endpoint at /health, alerts if block stuck >2h

---

### CKB Whale Alert Bot
- **What:** Monitors CKB node for large transactions, alerts Telegram
- **Repo:** https://github.com/toastmanAu/ckb-whale-bot
- **Live at:** /home/phill/ckb-whale-bot/whale-bot.js
- **Status:** Running (PID in whale-bot.pid), monitored in heartbeat
- **Config:** config.json (gitignored) — threshold $200k USD, group @NervosUnofficial
- **Notes:** start.sh pkills old process before starting

---

### TG↔Discord Chat Bridge
- **What:** Custom Node.js bridge — Nervos Nation TG ↔ Nervos Network Discord
- **Repo:** https://github.com/toastmanAu/ckb-chat-bridge
- **Live at:** systemd --user service `ckb-chat-bridge.service`
- **Status:** Running, monitored in heartbeat
- **Features:** General-topic filter, image relay (8MB direct / 8-50MB resized), silent error drops, daily error digest at 9am
- **Config:** /home/phill/ckb-chat-bridge/.env (gitignored)
- **Notes:** IPv4 forced for all fetches (Pi Happy Eyeballs fix)

---

### PoPo Anti-Scam Bot
- **What:** Telegram bot that analyses join patterns and detects scammers/bots
- **Live at:** /home/phill/ckb-antiscam/
- **Status:** Running (dry_run mode), monitored in heartbeat 2x/day
- **Notes:** libsimdjson.so.29 fix applied (linuxbrew path in ld.so.conf.d). Flip dry_run false when ready.

---

### CKB Stratum Proxy
- **What:** Stratum mining proxy — connects NerdMiner to ViaBTC pool
- **Repo:** https://github.com/toastmanAu/ckb-stratum-proxy
- **Live at:** /home/phill/ckb-stratum-proxy/ — port 3333 (stratum) / 8081 (stats)
- **Status:** Running, monitored in heartbeat
- **Config:** config.json (gitignored)
- **Notes:** Solo mode direct to ckbnode. NerdMiner (nerd1) at 192.168.68.86.

---

### Matterbridge → Custom Bridge Migration
- **What:** Replaced Matterbridge with custom Node.js bridge
- **Status:** ✅ COMPLETE — Matterbridge removed

---

### Workspace Backup System
- **What:** Daily backup — GitHub push + EliteDesk rsync
- **Script:** /home/phill/.openclaw/workspace/scripts/backup.sh
- **Status:** Running via heartbeat ~4pm ACST daily
- **Targets:** GitHub toastmanAu/kernel-workspace + EliteDesk 192.168.68.97:~/backups/pi5/

---

### Binance Trading Bot
- **What:** RSI + EMA strategy, paper trading by default
- **Live at:** /home/phill/binance-bot/
- **Status:** Running (paper mode), dashboard http://192.168.68.91:9090
- **Strategy:** RSI(14) + EMA50/200 on 4h. Entry: above EMA200 + RSI<30
- **Notes:** Currently sitting out (ETH below EMA200). Next: grid strategy for ranging market.

---

### Fiber Network Nodes
- **What:** CKB Lightning-style payment channel network
- **Status:** Running on ckbnode + N100
- **ckbnode fiber:** P2P 8228, RPC 127.0.0.1:8227, 10,000 CKB funded
- **N100 fiber:** P2P 8229, RPC 127.0.0.1:8226, NEEDS FUNDING (99+ CKB)
- **Dashboard:** http://192.168.68.91:9091
- **Notes:** pkill -9 fnn before restart (DB lock). SSH tunnel N100:8237→ckbnode:8227 via autossh.

---

## 🟡 In Progress / Stalled

### NerdMiner CKB (ESP32 Eaglesong Miner)
- **What:** ESP32-based CKB solo miner using Eaglesong algorithm
- **Repo:** https://github.com/toastmanAu/NerdMiner_CKB (dev branch)
- **Target:** ESP32-2432S028R (CYD board)
- **Status:** Core implementation done. Push blocked on `gh auth refresh -s workflow`
- **Next:** Restore workflow scope, push dev branch, test flash

---

### CKB Light Client for ESP32 (ckb-light-esp)
- **What:** C99 CKB light client for ESP32-P4, RFC 0044 compliant
- **Repo:** https://github.com/toastmanAu/ckb-light-esp
- **Status:** Core crypto done, networking layer not implemented
- **Hardware:** W5500 Ethernet shield ordered (SPI, ESP-IDF compatible)
- **Board:** WT9932P4-TINY ordered from AliExpress
- **Notes:** ESP32-P4 + W5500 = ~0.6-0.8W average, <$2/year electricity

---

### CKB LLM Benchmark
- **What:** Tests 6 models on 25 CKB-flavoured tasks, cost/quality analysis
- **Live at:** /home/phill/.openclaw/workspace/ckb-llm-benchmark/
- **Status:** Harness built, not yet run
- **Models:** Claude Sonnet 4.6 (CKBDev + Anthropic), Llama 3.3 70B, DeepSeek V3.2, Qwen3 32B, Qwen2.5:3b
- **Next:** npm install, fill .env, run `node runner.js`
- **Output:** Report with hardware comparison, break-even analysis, community grant proposal

---

### CKB Node Monitor Alexa Skill
- **What:** Echo Show APL dashboard for CKB node stats, voice queries
- **Live at:** /home/phill/.openclaw/workspace/ckb-node-skill/
- **Status:** Built, not deployed
- **Next:** `ask deploy` — requires Amazon Developer account + AWS setup
- **Notes:** Dark APL theme, asks for node IP, falls back to public RPC

---

### OPi3B Agent Node
- **What:** Orange Pi 3B running OpenClaw as agent
- **IP:** 192.168.68.93, SSH: opi3b-armbian
- **Status:** OpenClaw installed, gateway running, not fully configured
- **Next:** Console setup at physical terminal
- **Gateway token:** 3b8ab4efee68e4f69d0a129aa4893174e8e728e6db30d7ac

---

### Agent Collective
- **What:** Multi-agent group — Kernel (Pi5) + Wyltek (N100) coordinating
- **Group:** Telegram -1003828360343
- **Status:** Group created, bots added, posting not automated yet
- **Kit:** /home/phill/.openclaw/workspace/free-agent-kit/ (deployed to N100)
- **Next:** HF token from Phill to complete N100 Wyltek deployment

---

## 🔵 Concept / Early Design

### LoRa PoC Network on CKB (Unnamed)
- **What:** Proof-of-Coverage LoRa IoT network architecturally inseparable from CKB L1
- **Docs:** /home/phill/.openclaw/workspace/projects/lora-poc-ckb/DISCUSSION.md
- **Status:** Concept — detailed architecture designed 2026-02-25
- **Core idea:** Coverage map = CKB cells. More coverage = more CKB capacity locked. Migration impossible by design.
- **Stack:** CKB L1 (coverage cells + xUDT) + Axon L2 (high-frequency proofs) + ECC608 hardware identity
- **Next:** Validate Axon maintenance status, prototype type script, draft grant proposal

---

### BitAxe Eaglesong ASIC
- **What:** Open-source Eaglesong ASIC design for community CKB mining
- **Docs:** /home/phill/.openclaw/workspace/projects/ckb-eaglesong-bitaxe/GRANT_PROPOSAL_DRAFT.md
- **Status:** Grant proposal drafted, ~$2,800 USD ask
- **Target chip:** BM2042AA (5nm Bitmain, from K7)
- **Next:** Community liaison may fund via budget directly — word in 2 weeks

---

### RGB++ on Other UTXO Chains (BCH/DOGE)
- **What:** Port RGB++ isomorphic binding to Bitcoin Cash or Dogecoin
- **Status:** Research/concept — discussed 2026-02-25
- **Key insight:** BCH easiest (same SHA256 PoW, same header format, larger OP_RETURN). DOGE hard (AuxPoW).
- **Next:** No immediate action — opportunity flagged for future

---

## 🏗️ Infrastructure

| Component | Host | IP | Status |
|---|---|---|---|
| CKB Node | OrangePi 3B (ckbnode) | 192.168.68.87 | ✅ Running |
| Bitcoin Node | (ckbnode) | 192.168.68.87 | ✅ Running |
| Ollama (inference) | OPi5+ | 192.168.68.100 | ✅ qwen2.5:3b |
| OpenClaw (Kernel) | Pi 5 | 192.168.68.82 | ✅ Primary |
| OpenClaw (Wyltek) | N100 | 192.168.68.91 | ✅ Running |
| OpenClaw (OPi3B) | OPi3B | 192.168.68.93 | 🟡 Partial |
| EliteDesk (build) | EliteDesk | 192.168.68.97 | ✅ SSH ready |

---

## 📝 Notes

- **GitHub:** All repos under toastmanAu
- **Primary model:** ckbdev/claude-sonnet-4-6 (free shared key)
- **Anthropic direct:** billing limit hit — top up when ready
- **OpenAI:** billing limit hit — image gen via nano-banana-pro, transcription via local whisper
- **OPi5+ PSU:** marginal 5A — qwen2.5:7b causes brownouts, use 3b only until better PSU
