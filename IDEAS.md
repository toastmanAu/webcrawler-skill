# IDEAS.md — Project & Business Ideas

Last updated: 2026-02-23

A running log of ideas worth building. Kernel adds to this over time.
Status: 💡 idea | 🔨 in progress | ✅ done | ❌ dropped

---

## 🟦 BLACKBOX / CKB POS

### ✅ Landing page — blackboxdata.xyz
Repo: https://github.com/toastmanAu/blackboxdata-site
ESP32 HMI POS terminal with thermal printer + barcode scanner. Accepts CKB.
Next: Cloudflare Worker for on-chain payment confirmation monitoring.

### 💡 Fiber Network integration
Once BlackBox is solid, add Fiber Network (CKB L2) for instant micropayments.
No on-chain fee for sub-$5 transactions. Ideal for café / market stall use case.

### 💡 Multi-merchant mode
Currently single merchant address. Add a merchant directory — businesses register
a CKB address + name, BlackBox selects at boot. Config via web UI (ESP32 hotspot).

### 💡 Cloudflare Worker payment monitor
Lightweight worker that watches a CKB address for incoming transactions,
webhooks back to BlackBox to trigger receipt print. No self-hosted server required.

---

## 🟩 REVENUE-GENERATING APPS

### 💡 Fiber Network Dashboard (SaaS) — HIGH PRIORITY
First-mover advantage. No proper tooling exists yet for Fiber node operators.
- Show channel balances, routing fees earned, liquidity health, rebalance suggestions
- Free tier (basic stats) → $10–20/mo advanced analytics + alerts
- Already have working fiber dashboard at http://192.168.68.91:9091
- Needs: auth layer, hosted version, marketing post in Nervos community
Estimate: 2-3 weeks to billable MVP

### 💡 On-Chain Alert Service (SaaS)
Productise the whale bot. Self-serve alerts for any CKB address/event.
- Web UI to configure alerts: address watcher, threshold, tx type
- Delivery: Telegram / email / webhook
- Free (3 alerts) → $5/mo unlimited
- 100 paying users = $500/mo recurring passive income
- Tech already exists in whale-bot.js — needs web UI + Stripe
Estimate: 2-3 weeks for MVP

### 💡 ESP32 Crypto Ticker — Premium Firmware + Web Configurator
Polish the NerdMiner concept into a consumer product:
- Web configurator (no flashing required — WiFi OTA)
- Support 10+ coins/exchanges
- Alert when price crosses threshold (buzzer + display flash)
- Sell: firmware license $5-15, hardware kit $30-60, configurator sub $3/mo
- Existing code base: NerdMiner_CKB is a head start
Moat: ease of use. Most alternatives require flashing CLI.

### 💡 CKB Node-in-a-Box
Pre-configured OPi3B or Pi image that boots into a running CKB full node.
Dashboard, auto-updates, health monitoring included.
- Digital product: $20 image download
- Hardware kit: $149-249 (board + image + setup guide)
- Already have: dashboard, node setup scripts, image builder
Estimate: 1-2 weeks to productise

### 💡 AI Crypto Transaction Explainer API (B2B)
"What did this transaction do?" — plain English, one sentence.
- Embed as widget in exchanges, wallets, block explorers
- API pricing: $0.001/call or $29/mo for 50k calls
- Domain knowledge (CKB cell model, UTXO) is the moat
- High margin, B2B = fewer customers needed

---

## 🟨 TOOLS & INFRASTRUCTURE

### 💡 CKB Twitter/X Bot — @NervosDaily or @CKBPulse
Monitors Twitter, Reddit r/NervosNetwork, Discord for top Nervos content.
Reposts + original CKB stats (block height, hashrate, price).
Needs: Twitter dev account (manual), then bot logic is ready to build.
Note: Phill creating account manually when ready.

### ✅ CKB Whale Alert Bot
Running at /home/phill/ckb-whale-bot/whale-bot.js
Posts to @NervosUnofficial on transactions > $200k USD

### 💡 NerdMiner v2 — CKB Edition (proper product)
Take NerdMiner_CKB, add:
- Web UI for pool/wallet config (no serial required)
- OTA firmware updates
- Pool stats on display (estimated earnings, shares/day)
- Multi-pool failover
- Sell as "CKB Miner Kit" — ESP32-2432S028R + firmware flashed + guide

### 💡 OPi Image Builder — Pre-baked CKB + Neuron images
Custom OPi Zero 3 / 3B images with CKB node + Neuron pre-installed.
Target: Nervos community members who want to run a node without the setup pain.
Build environment: N100 (x86_64), orangepi-build cloned.
Note: in progress — hitting python2 build dependency issues on Noble.

---

## 🟥 GAMING / COMMUNITY

### 🔨 CKB Tower Defense Game
Browser-based tower defense with CKB/Nervos theme.
Lobster hero 🦞, blockchain-named towers (Crystal, Neuron, Eaglesong, Fiber).
On-chain weekly leaderboard — top 3 get CKB rewards.
Repo: /home/phill/workspace/ckb-tower-defense/
Stack: Vanilla JS canvas, Node.js/SQLite backend, Express API
Status: partially built — game logic done, rendering truncated mid-build.
TODO: finish render loop, complete server.js, test, push to GitHub.

### 💡 CKB Arcade — leaderboard-as-a-service
Generalise the tower defense leaderboard into a reusable service.
Any game can POST scores, display weekly rankings, pay top players in CKB.
SDK: JS library devs embed. Backend: Node.js hosted. Revenue: take small % of prize pool.

---

## 🟪 HARDWARE PROJECTS

### 🔨 OPi3B Retro Game Machine (Raspberry Pi 5)
ES-DE frontend + RetroArch + up to PS2 (PCSX2).
Controllers: 8BitDo Ultimate, 8BitDo Pro 2, generic arcade USB pads.
Status: RetroArch 1.21.0 installed on OPi5 (wrong machine — Pi 5 not yet connected).
TODO: Pi 5 needs SSH access, then proceed with full setup.

### 💡 CKB Hardware Wallet Display
Small e-ink or OLED display that connects to a hardware wallet and shows:
- Current CKB balance
- Last 3 transactions
- Live USD value
- Low-power, always-on, bedside/desk display
Hardware: ESP32 + OLED or waveshare e-ink

### 💡 Mining Profitability Dashboard
Real-time dashboard for small-scale CKB miners:
- Hashrate, shares, estimated daily earnings
- CKB price ticker
- Pool comparison (ViaBTC vs solo vs others)
- Hardware: Pi + small display, or web-only
Already have stratum proxy stats — this is a thin layer on top.

---

## 📝 NOTES & RANDOM IDEAS

- **Nervos community is under-served with tooling** — almost anything built for
  the ecosystem has early adopter advantage. Fiber is brand new.
- **Hardware + software combos** are hard to copy and command premium prices.
- **Open source first, monetise the hosted/managed version** — good strategy for
  node/infrastructure tooling (see: Fiber dashboard, alert service).
- **CKB micropayments via Fiber** will unlock a whole category of apps once
  channels are live and funded. Think: pay-per-API-call, tipping, microtransactions
  in games. BlackBox is perfectly positioned for this.
- Phill's unique position: runs infrastructure, understands hardware AND blockchain,
  active community member. That's rare. Use it.

---

*Kernel adds ideas here during heartbeats and conversations. Phill reviews.*
