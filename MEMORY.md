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

## NucBox K8 Plus (Ryzen 7 8845HS — Primary Inference Node)
- IP: 192.168.68.79 · hostname: phill-NucBox-K8-Plus · user: phill · NOPASSWD sudo
- Always-on local inference machine
- AMD Ryzen 7 8845HS · Radeon 780M iGPU · 32GB RAM
- Ollama: http://192.168.68.79:11434 (LAN accessible)
- Models: minicpm-v (vision), qwen2.5:14b, deepseek-r1:14b, gemma3:12b, qwen2.5-coder:14b, llama3.1:8b + more
- OpenClaw provider: "ryzen" → imageModel = ryzen/minicpm-v:latest
- Auto-suspend permanently masked (sleep.target → /dev/null)

## driveThree (i7-14700K — Secondary Inference Node, on-demand)
- IP: 192.168.68.88 · user: phill · NOPASSWD sudo
- On when Phill is using it, not always on
- RTX 3060 Ti (8GB VRAM) — faster GPU inference than NucBox when available
- Ollama: http://192.168.68.88:11434 · model: qwen2.5:14b (confirmed working)
- Auto-suspend set to 2hr idle timeout (not masked — intentional)

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
- **N100** fiber: RUNNING — systemd service, dir /home/phill/.fiber/ (moved from ~/fiber/run/ 2026-03-11)
  - P2P port 8229, RPC 127.0.0.1:8226
  - Node ID: 03e920df66ed3ff214cb58cd65213ec1dc695091c177927e2a9b14f1679d87cc9e ← NEW (identity reset 2026-03-11)
  - PeerId: (auto-derived from new key)
  - Wallet: ckb1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqvsg2ha206ae5lhjaxg9mp3mscg4s0k8ncy4ej9u ← NEW, NEEDS FUNDING
  - Key: ~/.fiber/ckb/key (raw hex, no 0x), encrypted at first start to ~/.fiber/data/key
  - Key password: n100-fiber-2026
  - Config: ~/.fiber/data/config.yml (private_key_path: ~/.fiber/ckb/key)
  - Log: ~/.fiber/data/fiber.log (StandardOutput in service unit)
  - OLD wallet (Phill sent CKB here — needs redirecting): ckb1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqgzxfhhs329hf0lr3gnwxnzyn270drqr3csvq7pn
  - NEEDS 99+ CKB at new wallet before channel with ckbnode will open
- Channel between ckbnode↔N100: PENDING (new wallet unfunded)
- Fiber dashboard: http://192.168.68.91:9091
- SSH tunnel: N100:8237 → ckbnode:127.0.0.1:8227 (autossh service)
- PeerId formula: base58(bytes([0x12,0x20]) + sha256(raw_compressed_pubkey))
- IMPORTANT: always pkill -9 fnn before restarting service (DB lock issue)
- **CKB node MUST have `Indexer` module enabled for fnn to fund channels** — without it, fnn fails with `error decoding response body` when calling send_transaction. Add `"Indexer"` to modules list in ckb.toml: `modules = ["Net", "Pool", "Miner", "Chain", "Stats", "Subscription", "Experiment", "Indexer"]`
- ckbnode v0.204.0 Indexer enabled: done 2026-03-11 ✅
- Channel funding still failing: `error decoding response body` on send_transaction — likely fnn v0.7.1 vs CKB v0.204.0 API mismatch. Options: downgrade ckbnode to v0.203.0, or wait for fnn v0.7.2
- fnn store path must be correct: `store.path` in config.yml should point to where RocksDB data actually is (`~/.fiber/fiber/store` not `~/.fiber/data/store`)

## ckb-access umbrella repository (2026-03-11)
- URL: https://github.com/toastmanAu/ckb-access
- One-command installers for Nervos CKB network tools
- **fiber/**: v0.7.1 — payment channel node (Linux/macOS/Windows)
- **ckb-light/**: v0.5.4 — light client (~50MB), arm64 build-from-source fallback
- **ckb-node/**: v0.204.0 — full node (200GB+), all platforms prebuilt
- **ckb-cli/**: v2.0.0 — command-line wallet tools
- **ckb-miner/**: v0.25.0 — CPU/GPU miner (Eaglesong), CUDA/OpenCL variants
- All installers: PS5.1 compliant, smoke-tested, auto-install dependencies
- Platform support matrix in README.md
- Upstream issue filed: nervosnetwork/ckb-light-client#272 (arm64 binary request)

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

## Research Crawler System (built 2026-03-03)
- `scripts/research-crawl.py` — Gemini 2.5 Flash, auto-picks next PENDING task from research/queue.md
- HEARTBEAT: fires every 15min idle, HIGH→MEDIUM→LOW→SYNTHESIS priority order
- SYNTHESIS tasks: read all findings + MEMORY.md, produce gap analysis, auto-queue new tasks via [NEW_TASK] blocks
- ~18 tasks completed 2026-03-03, queue self-extends from synthesis output
- Seed URL rule: always raw.githubusercontent.com, never github.com/blob/ (in AGENTS.md)

## Research Dashboard
- http://192.168.68.82:9989 — Python http.server, dark UI, mobile-responsive
- Shows all research tasks, findings rendered as HTML, progress bar
- HEARTBEAT monitors + auto-restarts. Port 9977 = Wyltek site (conflict avoided)

## DOB Minter — Collection/Batch Mint (2026-03-03)
- ClusterPanel: create new cluster OR use existing (paste ID / pick from wallet)
- FilesPanel: multi-file, batch mint with progress bar
- Committed: github.com/toastmanAu/ckb-dob-minter commit 55ec5ed
- Dev server: http://192.168.68.82:5173 (HEARTBEAT auto-restarts)

## Kernel's Web5 / CKB DID Identity (2026-03-03)
- DID: did:ckb:z53xucm6dnqreuil33e2w5uyg5flzfcp (CKB testnet)
- Handle: kernel.web5.bbsfans.dev
- Wallet: ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq0ek0pprdkzl7dj0z3qq7dw8clf0xx3tqsp8phrw
- Account: ~/.web5-cli/account.json, network: ckb_testnet, PDS: web5.bbsfans.dev
- web5-cli installed globally (npm)
- WyDID.h planned: ESP32 component for did:ckb identity in wyltek-embedded-builder
- PDS use cases: agent memory, ckb-chess records, hardware provenance, devlog, whale feed

## Chat Bridge — Channel Update (2026-03-03)
- Now bridges: Nervos Nation TG ↔ #nervos-nation-bridge (Discord ID: 1476621586571460700)
- Was: 👾│general (657799690552606745)

## Tailscale (2026-03-03 — ACTIVE)
- Installed v1.94.2 on Pi5
- Auth link sent to Phill — not yet authenticated
- Goal: remote access to Pi services without port forwarding
- Pi5 Tailscale IP: 100.115.197.42 (hostname: opi5-oc)
- iPhone already on same Tailnet (toastmanAu@)
- Access any Pi service remotely: http://100.115.197.42:<port>

## Tailscale (2026-03-03 — ACTIVE)
- Installed v1.94.2 on Pi5
- Auth link sent to Phill — not yet authenticated
- Goal: remote access to Pi services without port forwarding
- Pi5 Tailscale IP: 100.115.197.42 (hostname: opi5-oc)
- iPhone already on same Tailnet (toastmanAu@)
- Access any Pi service remotely: http://100.115.197.42:<port>

## Wyltek Membership System (2026-03-03)
- Supabase: yhntwgjzrzyhyxpiqcts.supabase.co
- Anon key in auth-test.html (public/safe)
- Service role key: sb_secret_8tdKeoNYfnaSEqrkhwYDqw_B6qJMkEq (PRIVATE)
- Tables: profiles, comments, likes (RLS enabled)
- Storage bucket: avatars (public)
- Auth: JoyID @joyid/ckb@1.1.3 ES module → CKB address → Supabase auth
- Like button: toastman lobster PNG (kernel-avatar.png, background removed)
- Test page: wyltekindustries.com/auth-test.html
- Status: JoyID connect flow being tested

## Founding Member DOB NFT (2026-03-03 — PLANNED)
- 50 DOBs via Spore Protocol, CKB mainnet
- Image: RUN CKB Pepe with hardware logos, optimized to ~89KB
- Cost: ~5,200 CKB total (~$26 AUD)
- Trigger: first 50 website signups
- Mint: manual from Pi, minting wallet to be funded
- Images: /home/phill/.openclaw/workspace/founding-member-dob*.jpg
- Status: PENDING auth flow confirmation

## 14700K Ubuntu Inference Node (2026-03-03 — PLANNED)
- Phill's main machine: i7-14700K, 64GB RAM, RTX 3060 Ti (8GB)
- Plan: dedicated drive, Ubuntu 24.04 Desktop, Ollama + Open WebUI
- Model: qwen2.5:14b (fits 8GB VRAM, ~45 tok/s)
- Will be wired as Pi's local inference backend
- Status: waiting on Phill to install Ubuntu

## Wyltek Founding Member DOB — Mainnet (2026-03-04 LIVE ✅)
- Cluster ID: 0x54ba3ee23016ab6e2e20792d8fd69057c62392ca1997b622147a5bd98979f4e8
- CKBFS TypeID (V2, image published): 0xbdf595ff79548ab67c5d852968ffa0d2491b28ea52687e736d52e661c9cdb76a
- CKBFS tx: 0xd824b272df0e6ec2cee6eeb353a418174ff52150f4643aa06642d7236b141d0e
- Cluster tx: 0x38c70187783653b56e117393f9a7c7b4f58eaa18575667824ed5071be8e12c28
- Member #1 (Phill): Minted ✅ Spore 0x11365ac4d46ff9741fc34250c0159ba6844fa15cd7ded44a4011b4cb6d75e458
  - Tx: 0x222fc2d3acabe4e28efb2c0d95d95fef6620ad8b9e666b7f8ade4f3e4fb6b0f0
- Minting wallet: ~10,075 CKB remaining (13,000 - cluster - CKBFS - DOB #1)
- Queue runner: /home/phill/ckb-dob-minter-script/mint-queue-runner.js (run --mainnet)
- Members page: wyltekindustries.com/members.html (0/100 public counter, member #1 already minted)
- Supabase: mint_queue table, member_number from live count
- JoyID fix: must set joyidAppURL: 'https://app.joy.id' — SDK default is testnet.joyid.dev

## DOB Minting Wallet (generated 2026-03-03)
- Testnet: ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqv5emmruh9u256aaa4l2a4nw3qf3n8fksq60duk9
- Mainnet: ckb1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqv5emmruh9u256aaa4l2a4nw3qf3n8fksq5axnua
- Key file: /home/phill/.openclaw/workspace/secrets/minting-wallet.txt (chmod 600, never commit)
- Purpose: Wyltek Founding Member DOB minting (50 Spore cells, mainnet)
- Status: testnet CKB being claimed from faucet; testnet dry run first

## WyVault Hardware Update (2026-03-08)
- **Target board changed**: ESP32-P4 4.3" IPS dev board (ordered, arriving post-hackathon)
- 4.3" IPS capacitive touch display — proper wallet signing UI
- Onboard ESP32-C6 = WiFi 6 + BT5 (C6 is comms coprocessor, P4 does crypto)
- Replaces WT9932P4-TINY plan (too small display for wallet UX)
- AliExpress link: https://a.aliexpress.com/_m0xhu9X

## Wyltek Telegram Mini App (2026-03-09 — SCAFFOLDED)
- Repo: https://github.com/toastmanAu/wyltek-miniapp
- Vite + vanilla JS, 5 tabs: Home, Chain, Research, Lounge, Members
- Auth: `@joyid/miniapp` SDK (JoyID workaround for Telegram's passkey restrictions)
- Chain tab: live CKB + BTC node data via Cloudflare Worker RPC proxy (`workers/rpc-proxy.js`)
- Lounge: realtime Supabase subscription, same `lounge_messages` table as site
- To go live: BotFather bot → deploy Worker `wyltek-rpc.toastmanau.workers.dev` → deploy app → set Menu Button URL
- Worker needs: `CKB_RPC_URL`, `BTC_RPC_URL`, `BTC_RPC_USER`, `BTC_RPC_PASS` env vars
- Lounge send Worker (`wyltek-lounge.toastmanau.workers.dev`) not yet created
- Pi Tailscale IP (100.115.197.42) is the cleanest way to expose nodes to the Worker

## WyTerminal v4.2 FFat Key Lesson (2026-03-09)
- **FFat.mkdir/exists use paths WITHOUT mount prefix**: `"/.ssh"` not `"/spiffs/.ssh"`
- libssh VFS functions still use full path `/spiffs/.ssh/id_ed25519` (correct — goes through OS VFS layer)
- After fix: `key=ok` ✅ — FFat persisting keypair across reboots
- TCP timeout to 192.168.68.87 (wlan0) still failing — next test: ethernet IP 192.168.68.105
- `UseDNS no` enabled on ckbnode sshd (was commented out, may have defaulted to yes)
- Current pubkey on ckbnode: `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAILZvSo7Et3uOBh+v4h+EGrkzXduk+4Z849+yTu6aZHXy WyTerminal`

## WyTerminal (2026-03-08 — SHIPPED ✅)
- Firmware: T-Display S3 AMOLED (RM67162 1.91", ESP32-S3)
- Repo: https://github.com/toastmanAu/WyRelay (firmware/WyTerminal_AMOLED.ino)
- Features: USB HID keyboard + Telegram bot + live AMOLED terminal display
- Library: Arduino_GFX + Arduino_RM67162 (QSPI)
- Compiled + flashed from Pi via arduino-cli — confirmed showing as USB HID keyboard
- Commands: /run /type /key /enter /paste /clear /status /help
- Daemon (wyrelay-daemon.py): shell bridge, screenshot→TG, file upload, sysinfo

## Wyltek Mini App — Fiber Tab (2026-03-09)
- Fiber tab built: Channels / Network / Probe sub-views
- Liquidity bar, open/close channel, route probe via `build_router`
- Latest commit: `d67c2b3` — full commit list in memory/2026-03-09.md
- Biscuit auth disabled on ckbnode fiber (localhost-only, safe)
- Worker `/fiber` route added to `rpc-proxy.js` → `http://192.168.68.79:8237`
- Mini App deployed: `https://toastmanau.github.io/wyltek-miniapp/`

## Fiber Tunnel (N100) — Persisted as Systemd Service (2026-03-09)
- `/etc/systemd/system/fiber-tunnel.service` — autossh, enabled, starts on boot
- Root SSH key of N100 (`root@phill-NucBox-K8-Plus`) added to ckbnode `authorized_keys`
- Tunnel confirmed: `localhost:8237` → ckbnode `127.0.0.1:8227` ✅
- Previously was just a manual process — now survives reboots

## Site Stats Git Conflict Pattern
- `update-site-stats.sh` uses `/home/phill/workspace/wyltek-industries-site`
- Main dev checkout is `/tmp/wyltek-site-tmp`
- Two repos diverge → push conflict when both commit
- Fix: `git reset --hard origin/master` in the stats repo, then re-run script
- Long-term: consolidate to one checkout

## Fiber Node — FiberQuest Pi (192.168.68.65) (2026-03-15 — TESTNET)
- **TESTNET** node using official testnet config (bootnodes, scripts, RPC URL `https://testnet.ckbapp.dev/`)
- Binary: `/home/phill/.fiber-mainnet/bin/fnn` (v0.7.1)
- Config: `/home/phill/.fiber-mainnet/data/config.yml.template` (official testnet config from fiber repo)
- RPC: `127.0.0.1:8227` (biscuit auth enabled — returns "Unauthorized" for missing/invalid token)
- Dashboard: port 8229 (fiber-dash.py)
- **Security setup completed 2026-03-15:**
  - Biscuit secrets in `~/.fiber-mainnet/.secrets/` (chmod 700) — never hardcoded
  - `fnn-wrapper.sh`: reads pubkey from secrets, generates temp config, launches fnn
  - `fiber-dash-wrapper.sh`: reads token from secrets, passes as CLI arg to dashboard
  - Both wrappers set FIBER_SECRET_KEY_PASSWORD env var needed to decrypt key file
  - Systemd services updated to use wrappers instead of direct binary calls
- **Known issue:** Biscuit token validation failing (RPC returns "Unauthorized"). Likely token generation mismatch or biscuit public key missing from config. N100 config also lacks biscuit_public_key but works — may be due to token caveats or expiration.
- **Next:** Deploy testnet CKB full node on ckbnode, update fiber config to local testnet RPC, debug biscuit auth.
