# MEMORY.md - Long-Term Memory

## Identity
- My name is **Kernel** 🐧
- Named by Phill on first boot, 2026-02-22
- Calm, capable, dry. Close to the metal.

## Phill
- Self-taught dev with dormant C background (20+ years ago)
- Returned to coding 4 years ago via ESP32 microcontrollers — built a crypto price tracker
- Heavily involved in **Nervos (CKB)** community for ~4 years
- Runs: 2 Nervos nodes, 1 Bitcoin node, multiple Raspberry Pis
- This machine: Pi 5 (arm64)
- Based in Adelaide, Australia (GMT+10:30)
- Motivated by opportunity in the blockchain/crypto space
- Loves hardware — ESP32, Pi ecosystem, physical infrastructure

## Environment
- All skill binaries installed and verified (2026-02-22)
- `sonoscli` (`sonos`) installed fresh via Go on first boot
- `obsidian-cli` binary name is `obsidian-cli` (not `obsidian`)
- GitHub CLI authenticated as **toastmanAu**

## CKB Node (Orange Pi 3B)
- Hostname: `ckbnode` · IP: 192.168.68.87 (WiFi) · User: `orangepi`
- SSH: `ssh ckbnode` (key auth, NOPASSWD sudo configured)
- Kernel: 5.10.160-rockchip-rk356x · RK3566 · aarch64
- CKB v0.202.0 running as process (not systemd service yet)
- GPU: Mali `/dev/mali0` + `/dev/dri/renderD128` — working on BSP driver
- DSI display: Waveshare 5" clone, `raspberrypi,7inch-touchscreen-panel` compatible
  - Panel on DSI1 (fe070000), i2c1 (fe5a0000), touch ft5426 @ 0x38
  - Overlay: `rk356x-raspi-7inch-touchscreen` — just enables pre-defined DTB nodes
  - Mainline driver `panel-raspberrypi-touchscreen` exists since 5.15 — portabe to Armbian
- WiFi: power save disabled (modprobe.d + udev rule applied)
- DSI overlay written and loaded: `/boot/overlay-user/opi3b-waveshare5-dsi.dts` (.dtbo compiled)
- `card1-DSI-1: connected` after manual re-probe — display recognised by kernel
- Re-probe service: `dsi-panel-reprobe.service` (systemd, enabled) — unbind/bind after 3s delay
- Next: test display output on reboot, install OpenClaw, set up as agent host

## Standing Rules
- **Always keep GitHub repos in sync** — any local fix or change to a file that lives in a repo must be committed and pushed immediately. No exceptions.

## Projects
- **CKB Node Dashboard** → https://github.com/toastmanAu/ckb-node-dashboard — live, Node.js proxy + HTML polling dashboard
- **NerdMiner CKB** → https://github.com/toastmanAu/NerdMiner_CKB — ESP32 Eaglesong miner. Core implementation DONE 2026-02-22. PlatformIO installed at /home/phill/.platformio-venv/, `pio` on PATH. Target: ESP32-2432S028R (CYD). Added Worker Name field + fixed password field. Default pool: ckb.viabtc.com:3333. Push needs `gh auth refresh -s workflow` (workflow scope) then `git push`. Flash: `pio run -e ESP32-2432S028R -t upload` (from terminal with dialout group).
- **Fan controller** → /home/phill/fan-control/ — systemd service, GPIO1_C4 (gpio52), software PWM 25Hz

## OPi5+ Ollama Status (confirmed working 2026-02-25)
- **qwen2.5:3b WORKING** — inference confirmed, ~2.5s load, ~39s cold start for 10 tokens
- **qwen2.5:7b causes power-related crashes** — PSU claims 5A but browns out under heavy CPU load
- Service: systemd, OLLAMA_NOPRUNE=1, OLLAMA_LOAD_TIMEOUT=15m0s (override in /etc/systemd/system/ollama.service.d/timeout.conf)
- Models at: /usr/share/ollama/.ollama/models/ (ollama user)
- Manifest fix applied: downloaded missing blobs (75357d... 28B, 9bebd7... 1.4KB) for qwen2.5:7b
- Config blob 2f15b... is legitimately 487 bytes (valid JSON) — not corrupted
- Power: get a better PSU before attempting 7b again. No software voltage monitoring available on OPi5+ — watch for clean reboots + dmesg errors as brownout indicators
- IP: 192.168.68.100, SSH: phill@192.168.68.100
- Filesystem corruption incident 2026-02-25: BusyBox on boot after crash, fixed with e2fsck -y /dev/nvme0n1p1

## Orange Pi 5 Hardware Notes
- 26-pin header (not 40)
- pwmchip0=PWM2(fd8b0020), pwmchip1=PWM6(febd0020) — both in use internally, not on header
- Hardware PWM pins on header: GPIO1_C4=PWM1_M2, GPIO1_D3=PWM0_M1
- Boot: U-Boot + extlinux; DTB: rk3588s-orangepi-5.dtb

## CKB Whale Alert Bot
- Repo: https://github.com/toastmanAu/ckb-whale-bot
- Running at /home/phill/ckb-whale-bot/whale-bot.js (PID saved in whale-bot.pid)
- Monitors local node (192.168.68.87:8114), skips cellbase, filters self-transfers
- Threshold: $200,000 USD (live CKB price from CoinGecko, 5-min cache) — falls back to 10M CKB
- Sends to Telegram group @NervosUnofficial (chat_id: -1001338982855)
- Bot token: 8446459270:AAFltgKPOgFc0FX4PjKJNPUxTRoRzayKAlE
- Config: /home/phill/ckb-whale-bot/config.json (gitignored, must exist locally)
- Restart: bash /home/phill/ckb-whale-bot/start.sh

## Model Fallback Chain
- **Primary: ckbdev/claude-sonnet-4-6** — shared builders API (CKBDEV_API_KEY in .env) ← promoted 2026-02-25
- Fallback 1: anthropic/claude-sonnet-4-6 — billing limit hit, needs top-up
- Fallback 2-4: HuggingFace free — Llama 3.3 70B, DeepSeek V3.2, Qwen3 32B (no key needed)
- Fallback 5: ollama/qwen2.5:3b — OPi5+ local inference (192.168.68.100:11434)
- CKBDev API: https://share-ai.ckbdev.com — Anthropic-compatible, Claude models only, no image gen
- Health check: bash /home/phill/.openclaw/workspace/scripts/check-models.sh
- OpenAI key (sk-proj-Zgm...): billing limit hit — image gen + whisper-api unavailable until credit added
- Memory search: switched to local embedding model (embeddinggemma-300m, ~600MB GGUF, no API key needed)
- For image gen: use nano-banana-pro skill (Gemini, free OAuth). For transcription: use openai-whisper skill (local)

## Agent Collective
- Free-agent kit at `/home/phill/.openclaw/workspace/free-agent-kit/` — ready to deploy
- First agent: **Wyltek** on N100 (192.168.68.91) — free HF models only
- Kit copied to n100 at `~/free-agent-kit/`
- Waiting on: HF token from Phill to complete deployment
- **Collective group: -1003828360343** — both bots added (@Wyltek_PoPo_Bot + @Wyltek_n100_bot)
- After deploy: flip `dry_run: false` on antiscam once confirmed working in both groups
- Orange Pi 5+ (16GB, dormant, running EmulationStation) — future agent candidate once N100 is up
- Design doc: `free-agent-kit/COLLECTIVE-DESIGN.md`
- At /home/phill/binance-bot/ — Python venv, all deps installed
- Paper trading by default (set BOT_MODE=live for real money)
- Primary strategy: RSI(14) + EMA50/200 trend filter on 4h candles
  - Price must be above EMA-200 (strict filter), RSI < 30 = entry
  - Only SL/TP exits (no trend-reversal exit — reduces chop noise)
- Backtest results (Feb 2026, bear market conditions):
  - ETH 4h 365d: 66.7% win rate, +1.31% ROI
  - BTC 1h 365d (RSI<30): 42.9% win rate, +0.59% ROI
  - Grid trading: ~10% APY on deployed capital (best in ranging market)
- Current market: BTC ~$68k (corrected from $121k), ETH ~$1985 (below EMA-200)
- Strategy correctly sitting out — will activate on bull trend resumption
- Next: build grid strategy for current ranging market
- Run: cd /home/phill/binance-bot && source venv/bin/activate && python bot.py

## N100 Mini PC (Wyltek — PAIRED ✅)
- Hostname: wyltek-n100, IP: 192.168.68.91, user: phill, SSH alias: n100
- Intel N100, 4 cores, 15GB RAM, 237GB free, Ubuntu 24.04, x86_64
- NOPASSWD sudo configured
- Has existing CKB node at ~/ckb/
- Trading dashboard: http://192.168.68.91:9090 (systemd service)
- Trading bot: ~/binance-bot/ (Python 3.12 venv, paper mode, awaiting Binance API keys)
- Fiber build: ~/fiber/ (building from source for x86_64)
- Image builds: orangepi-build cloned at /home/phill/orangepi-build/ (needs x86 host = N100)

## OPi3B (new agent board)
- IP: 192.168.68.93, user: orangepi, SSH alias: opi3b-armbian
- BSP 5.10.160 kernel, Mali G52 GPU working, DSI display
- OpenClaw 2026.2.21-2 installed, gateway on LAN port 18789
- Gateway token: 3b8ab4efee68e4f69d0a129aa4893174e8e728e6db30d7ac
- OpenClaw console setup still needed at physical terminal
- Running from eMMC (233GB), SD card (58GB) also present but unused

## Fiber Network Node
- Repo: https://github.com/nervosnetwork/fiber — v0.7.0, built from source
- **ckbnode** fiber: RUNNING — systemd service, dir /home/orangepi/fiber/run/
  - P2P port 8228, RPC 127.0.0.1:8227 (localhost only)
  - Node ID: 026a9dd1bae2e7c9ee5acaf7ad8e2e7a89fcca183740f9c9f761e402ad1da70da0
  - PeerId: QmNjUaQCETkKvH4aWFTJEBEBfpHPx8JH9JoSsPPQXr6iGZ
  - Wallet: ckb1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqtj5ses5f88ggyeggrz7f9zh0kch40ctxsas20ze
  - Key password: ckbnode-fiber-2026
  - 10,000 CKB funded and confirmed
- **N100** fiber: RUNNING — systemd service, dir /home/phill/fiber/run/
  - P2P port 8229, RPC 127.0.0.1:8226
  - Node ID: 0301ae73e52494ecb09d3cadad9ed164276662016862f7ba1c9cbe6a150d3ab07a
  - PeerId: QmTh1V2gHqXKs59sGL24XpRHFGLch4J6wT4sdGB7EhRgAm
  - Wallet: ckb1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqg0dg5q5dpt0ww2exefvx4f68vffqa670gnhk9ej
  - Key password: n100-fiber-2026
  - NEEDS FUNDING (99+ CKB) to auto-accept channels
- Channel between ckbnode↔N100: PENDING (N100 insufficient balance)
- Fiber dashboard: http://192.168.68.91:9091
- SSH tunnel: N100:8237 → ckbnode:127.0.0.1:8227 (autossh service)
- PeerId formula: base58(bytes([0x12,0x20]) + sha256(raw_compressed_pubkey))
- IMPORTANT: always pkill -9 fnn before restarting service (DB lock issue)

## CKB Stratum Proxy
- Repo: https://github.com/toastmanAu/ckb-stratum-proxy
- Running at /home/phill/ckb-stratum-proxy/proxy.js
- Stratum server: port 3333 (all miners connect here)
- Stats HTTP: port 8081 (GET / for JSON stats, /health for uptime check)
- Config: /home/phill/ckb-stratum-proxy/config.json (gitignored — has pool creds)
- Upstream: mining.viabtc.io:3001 as ProxyWorker
- Handles ViaBTC 5-param mining.notify + mining.set_target quirks
- Per-miner extranonce allocation (1-byte prefix per miner, non-overlapping nonce space)
- Restart: bash /home/phill/ckb-stratum-proxy/start.sh
- Point NerdMiner at: stratum+tcp://<pi-ip>:3333

## Phill's POS System (ESP32)
- Elecrow ESP32 HMI 3.5", ST7789 480x320, LovyanGFX
- QR204 thermal printer, Grow GM861S barcode scanner, Arduino
- Single merchant CKB address loaded; generates QR invoices
- Next: Cloudflare Worker to track CKB payment confirmations

## OpenClaw Telegram Plugin Deploy Notes (CRITICAL)
When deploying OpenClaw with Telegram on a fresh machine (`onboard --non-interactive`):
1. **Plugin must be explicitly enabled**: Add `plugins.entries.telegram: { enabled: true }` to `openclaw.json` — `channels.telegram.enabled: true` alone is NOT enough
2. **Node 22 network fix**: Set `channels.telegram.network: { autoSelectFamily: false }` — fixes Happy Eyeballs IPv6 timeouts
3. **Pairing**: DM the bot → get code → `openclaw pairing approve telegram <CODE>` on the host
4. Without step 1, the plugin loads but never initialises (zero `[telegram]` log lines)

## EliteDesk Build Box
- HP EliteDesk 800 G1 DM, i5-4670 @ 3.40GHz, 16GB RAM, 229GB NVMe (58GB free)
- Ubuntu 22.04 x86_64
- SSH alias: `elitedesk` · IP: 192.168.68.97 · user: phill
- Role: dedicated build node — ESP-IDF, arm64 cross-compile, Docker, orangepi-build
- No OpenClaw (build box only)
