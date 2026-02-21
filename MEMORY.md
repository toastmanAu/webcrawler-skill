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
- **NerdMiner CKB** → https://github.com/toastmanAu/NerdMiner_CKB — ESP32 Eaglesong miner (in progress), local at /home/phill/workspace/NerdMiner_CKB/
- **Fan controller** → /home/phill/fan-control/ — systemd service, GPIO1_C4 (gpio52), software PWM 25Hz

## Orange Pi 5 Hardware Notes
- 26-pin header (not 40)
- pwmchip0=PWM2(fd8b0020), pwmchip1=PWM6(febd0020) — both in use internally, not on header
- Hardware PWM pins on header: GPIO1_C4=PWM1_M2, GPIO1_D3=PWM0_M1
- Boot: U-Boot + extlinux; DTB: rk3588s-orangepi-5.dtb

## Phill's POS System (ESP32)
- Elecrow ESP32 HMI 3.5", ST7789 480x320, LovyanGFX
- QR204 thermal printer, Grow GM861S barcode scanner, Arduino
- Single merchant CKB address loaded; generates QR invoices
- Next: Cloudflare Worker to track CKB payment confirmations
