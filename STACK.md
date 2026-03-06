# STACK.md — What We've Built

Canonical reference for all Wyltek projects. Read this before suggesting we build something.
**If it's listed here as SHIPPED — it exists. Don't rebuild it, don't research it as missing.**

Last updated: 2026-03-05

---

## 🟢 Shipped & Live

### ckb-light-esp
- **Repo:** github.com/toastmanAu/ckb-light-esp
- **What:** Full CKB light client protocol stack for ESP32 (C/ESP-IDF)
- **Protocol:** TCP → SecIO → Yamux → Identify → LightClient → GetLastState → SendLastState
- **Status:** 178/178 tests passing. ESP32-P4 binary: 214KB, 79% flash free.
- **Targets:** ESP32-P4 (W5500 SPI Ethernet), ESP32-S3, C3, C6, H2
- **Performance:** Boot sync 10k headers ~0.8s (P4). Live tracking 0.08–0.40ms CPU.
- **Also in repo:** bitchat_mesh.h/cpp — BLE mesh relay + packet codec (WIP, NimBLE-Arduino target)

### NerdMiner CKB
- **Repo:** github.com/toastmanAu/NerdMiner_CKB
- **What:** ESP32 Eaglesong solo miner for CKB. Fork of NerdMiner_v2.
- **Targets:** ESP32-2432S028R (CYD) primary. Many others via PlatformIO envs.
- **Features:** Stratum protocol, multi-board, Worker Name field, Telegram OTA (FastBot, TELEGRAM_OTA build flag)
- **Pool default:** ckb.viabtc.com:3333 (or our local stratum proxy)
- **Flash:** `pio run -e ESP32-2432S028R-TelegramOTA -t upload`

### ckb-stratum-proxy
- **Repo:** github.com/toastmanAu/ckb-stratum-proxy
- **What:** Node.js Stratum proxy — miners connect, proxy forwards to pool
- **Running:** Pi5 port 3333 (Stratum), port 8081 (stats HTTP)
- **Upstream:** mining.viabtc.io:3001
- **Features:** ViaBTC quirk handling, per-miner extranonce allocation, solo mode

### ckb-dob-minter
- **Repo:** github.com/toastmanAu/ckb-dob-minter
- **What:** React/Vite DOB (Spore NFT) minting app
- **Live:** wyltekindustries.com/mint/ (GitHub Pages, Cloudflare CDN)
- **Features:** Cluster creation/selection, CKBFS V2/V3 image upload, batch mint, burn (meltSpore)
- **Stack:** @ckb-ccc/connector-react + @ckb-ccc/spore + @ckbfs/api, JoyID wallet
- **Mainnet cluster:** 0x54ba3ee23016ab6e2e20792d8fd69057c62392ca1997b622147a5bd98979f4e8
- **CKBFS V3 mainnet TypeID:** 0xbdf595ff79548ab67c5d852968ffa0d2491b28ea52687e736d52e661c9cdb76a
- **Dev server:** Pi5 port 5173 (LOCAL TESTBED ONLY — not public)

### @wyltek/ckbfs-browser
- **Repo:** github.com/toastmanAu/ckbfs-browser
- **What:** Browser-side JS SDK for CKBFS V3 on-chain file storage
- **Features:** Chunking, cell building, type script construction, publish transaction
- **Used by:** ckb-dob-minter for image uploads

### wyltek-embedded-builder
- **Repo:** github.com/toastmanAu/wyltek-embedded-builder (private)
- **What:** C framework for ESP32 embedded CKB/blockchain apps
- **Features:** Board targets (boards.h — 43 boards), sensor drivers (40+ drivers)
- **Site stats:** updated daily by update-site-stats.sh

### ckb-node-dashboard
- **Repo:** github.com/toastmanAu/ckb-node-dashboard
- **What:** Node.js proxy + HTML polling dashboard for CKB node
- **Running:** Pi5 port 8080 (LOCAL, Tailscale accessible)
- **Node:** ckbnode 192.168.68.87:8114

### ckb-whale-bot
- **Repo:** github.com/toastmanAu/ckb-whale-bot
- **What:** Telegram bot — monitors CKB node, alerts on txs >$200k USD
- **Running:** Pi5, posts to @NervosUnofficial (-1001338982855)
- **Bot token:** 8446459270:AAFltgKPOgFc0FX4PjKJNPUxTRoRzayKAlE

### Wyltek Industries Site
- **Repo:** github.com/toastmanAu/wyltek-industries
- **Live:** wyltekindustries.com (GitHub Pages / Cloudflare CDN — NOT Pi hosted)
- **Member system:** JoyID CKB address → Supabase (yhntwgjzrzyhyxpiqcts.supabase.co), RLS
- **Member features:** DOB minter, CKBFS viewer, research page, devlog, flasher, ckb-sync, tests
- **Bug reporter:** floating 🪲 button on all pages → bug-report.html → Cloudflare Worker → GitHub Issues (private: toastmanAu/wyltek-bug-reports)
- **Founding members:** 100 max, DOB #1 minted for Phill

### Fiber Nodes (running infrastructure)
- **ckbnode fiber:** mainnet, P2P 8228, RPC 127.0.0.1:8227, 10,000 CKB funded
- **N100 fiber:** mainnet, P2P 8229, RPC 127.0.0.1:8226, NEEDS FUNDING (99+ CKB)
- **SSH tunnel:** N100:8237 → ckbnode:127.0.0.1:8227

### Matterbridge Chat Bridge
- **Service:** ckb-chat-bridge.service (Pi5 systemd user service)
- **Bridges:** Nervos Nation TG (-1001623077152) ↔ #nervos-nation-bridge Discord (1476621586571460700)

### CKB Founding Member DOB Queue Runner
- **Script:** /home/phill/ckb-dob-minter-script/mint-queue-runner.js --mainnet
- **Trigger:** Supabase mint_queue table, member signups from site
- **Member #1:** Spore 0x11365ac4d46ff9741fc34250c0159ba6844fa15cd7ded44a4011b4cb6d75e458 (Phill)

---

## 🟡 In Progress / WIP

### FiberQuest (PRIVATE until hackathon starts ~March 11)
- **What:** Retro gaming + Fiber micropayments hackathon project
- **Architecture:** RetroArch → UDP RAM polling → Node.js sidecar → Fiber payments
- **Stack:** RetroArch READ_CORE_MEMORY (UDP 55355), Node.js sidecar, Fiber FNN RPC
- **Stretch goal:** ESP32-P4 running emulator + light client + signer concurrently
- **Key gap:** No official Node.js Fiber client library — must build from Rust RPC source
- **Research:** Running privately on Pi (Pi handles fiberquest-* tasks, NucBox handles general)

### BitChat BLE Mesh (in ckb-light-esp)
- **What:** BLE mesh relay engine for ESP32 → bitchat_mesh.h/cpp
- **Status:** Packet codec + relay engine done. NimBLE-Arduino GATT wiring WIP.
- **Next:** NimBLE server/client setup, advertise + scan + connect flow

### Telegram OTA (NerdMiner CKB)
- **Status:** Code merged, compiled, CYD flashed today (2026-03-05)
- **Waiting on:** WiFi config via NerdMinerAP (Phill to do from phone)
- **Bot:** @WyltekTestBot (8667821408:AAG6ikR71mD2AmTWErj9kuzVkvfNP_QAlQ8)
- **Allowed chat ID:** 1790655432

### Cloudflare Bug Reporter Worker
- **Repo:** github.com/toastmanAu/wyltek-bug-worker
- **Status:** Code written, GH Issues pipeline tested. Needs CF login + wrangler deploy.
- **Deploy:** bash /home/phill/workspace/wyltek-bug-worker/deploy.sh (needs wrangler auth first)

---

## 📋 Planned / Researched

### WyDID.h
- ESP32 component for did:ckb identity on-device
- Kernel's DID: did:ckb:z53xucm6dnqreuil33e2w5uyg5flzfcp (testnet, proof of concept)

### LoRa PoC Network
- Two-token model: POC Token (RF payment) + CKB escrow
- 4KB RAM = full chain state via MMR. Gateway cells with governance multisig firmware allowlist.
- Status: Design complete, implementation not started

### CKB POS Terminal (ESP32)
- Elecrow ESP32 HMI 3.5", thermal printer, barcode scanner
- Generates QR CKB payment invoices
- Status: Hardware in hand, Cloudflare Worker for payment confirmation planned

---

## 🏗️ Infrastructure / Scripts

| Script | Purpose | Schedule |
|--------|---------|----------|
| update-site-stats.sh | Update site stat cards + sync research findings | Daily ~9am |
| update-test-results.py | Run ckb-esp32 + ckb-light-esp tests, push results | Daily ~8am |
| backup.sh | Push workspace to GitHub + rsync to EliteDesk | Daily ~4pm |
| check-models.sh | Verify model API health (Anthropic, CKBDev, HF) | Every ~1hr |
| check-bug-reports.js | Check GitHub for open bug reports | Every 4hrs |
| research-crawl.py | Idle research crawler (Gemini 2.5 Flash) | Pi: fiberquest tasks on heartbeat; NucBox: general every 15min |

## Common Knowledge Hub (CKH)
| Item | Detail |
|------|--------|
| Repo | https://github.com/toastmanAu/common-knowledge-hub |
| Stack | Electron, vanilla JS, Node.js |
| Purpose | Cross-platform desktop app — Nervos stack launcher (full node, Fiber, light client, stratum proxy) |
| UI pattern | App-store style: component list → click → detail page with all config options inline |
| Config | Writes TOML/YAML directly to ~/.ckh/<service>-data/ — CKH owns all config |
| Install | Download-on-demand per component (no bundled binaries — keeps app tiny) |
| Platforms | linux-arm64 (primary/SBC), linux-x64, macOS, Windows |
| Services | ckbNode (120GB), fiberNode (0.5GB), lightClient (0.2GB), stratum (bundled) |
| Key files | src/main.js, src/index.html, src/preload.js, services/registry.js, services/installer.js, services/monitor.js, services/config-writer.js |
| Status | Active development — scaffold + component store + console + config writing done |
| SBC angle | Board images boot straight into CKH kiosk mode — zero setup |
