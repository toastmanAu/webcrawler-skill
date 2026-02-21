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

## Projects
- **CKB Node Dashboard** → https://github.com/toastmanAu/ckb-node-dashboard — live, Node.js proxy + HTML polling dashboard
- **NerdMiner CKB** → https://github.com/toastmanAu/NerdMiner_CKB — ESP32 Eaglesong miner. Core implementation DONE 2026-02-22. eaglesong.cpp verified correct (both test vectors pass). Pushed via GitHub API (OAuth token lacks `workflow` scope for git push — run `gh auth refresh -s workflow` in terminal first for future pushes). PR queue: memory/nerdminer-ckb-pr-queue.md. Next: IRAM_ATTR on eaglesong_permutation(), test vs live CKB pool, BTC→CKB display labels.
- **Fan controller** → /home/phill/fan-control/ — systemd service, GPIO1_C4 (gpio52), software PWM 25Hz

## Orange Pi 5 Hardware Notes
- 26-pin header (not 40)
- pwmchip0=PWM2(fd8b0020), pwmchip1=PWM6(febd0020) — both in use internally, not on header
- Hardware PWM pins on header: GPIO1_C4=PWM1_M2, GPIO1_D3=PWM0_M1
- Boot: U-Boot + extlinux; DTB: rk3588s-orangepi-5.dtb

## CKB Whale Alert Bot
- Running at /home/phill/ckb-whale-bot/whale-bot.js (PID saved in whale-bot.pid)
- Monitors local node (192.168.68.87:8114), skips cellbase, alerts on any tx ≥ 10M CKB
- Sends to Telegram group @NervosUnofficial (chat_id: -1001338982855)
- Bot token: 8446459270:AAFltgKPOgFc0FX4PjKJNPUxTRoRzayKAlE
- @reboot crontab installed. Systemd service file at whale-bot.service (needs sudo to install)
- Restart: /home/phill/ckb-whale-bot/start.sh
- 3 whales found in last 350 blocks (17M / 19.8M / 33.9M CKB)

## Phill's POS System (ESP32)
- Elecrow ESP32 HMI 3.5", ST7789 480x320, LovyanGFX
- QR204 thermal printer, Grow GM861S barcode scanner, Arduino
- Single merchant CKB address loaded; generates QR invoices
- Next: Cloudflare Worker to track CKB payment confirmations
