# Common Knowledge Hub — Hardware Target Specs

## Deployment Targets

---

## Target 1: CKH Node (OPi3B) — PRIMARY PRODUCT

### Hardware
- **Board:** Orange Pi 3B
- **CPU:** Rockchip RK3566 Quad-core Cortex-A64 @ 1.8GHz
- **RAM:** 8GB LPDDR4
- **Storage:** 256GB eMMC (primary, ships pre-loaded with CKB snapshot)
- **M.2 slot:** 2242 NVMe, PCIe 2.0 x1 (~400–500 MB/s ceiling) — optional upgrade path
- **Display:** Raspberry Pi 7" DSI touchscreen (800×480) — directly attached
- **Network:** Gigabit ethernet + WiFi
- **Power:** USB-C

### Why eMMC is fine
- Ships with CKB snapshot pre-loaded — no genesis sync required
- Unit arrives pre-synced, plug in and go
- 256GB covers full chain + years of growth
- Soldered to board — no connectors to unseat, bulletproof for shipping
- NVMe is an enthusiast upgrade, not a requirement

### Wild Deployment Advantage
- **20+ OPi3B units already assembled and in the wild** with this exact hardware setup
- Once CKH image is ready, existing node operators flash and they're in the network
- Zero hardware procurement needed for early adopters — they already have the unit

### Software Stack
- Armbian (OPi3B — well supported, official builds available)
- CKH kiosk mode — fullscreen on DSI touchscreen
- CKB full node (aarch64 binary)
- Fiber node
- CKB snapshot pre-loaded at image build time
- systemd services for all components

### Display / UI — Three Modes

**Must confirm working before building for each mode.**

**Mode 1 — DSI only** (default, standalone node)
- 800×480 touchscreen is sole display, touch input
- Full CKH control UI on DSI (`localhost:3000/control`)
- ✅ Kernel recognises panel (`card1-DSI-1: connected`)
- 🔲 Pixel output on reboot NOT YET CONFIRMED — **next hardware goal**

**Mode 2 — HDMI only** (TV/WyBox style)
- HDMI to TV, no DSI attached, keyboard/remote for input
- 🔲 Not yet tested on OPi3B

**Mode 3 — Dual DSI + HDMI** (control station)
- DSI = touch control panel (`localhost:3000/control`)
- HDMI = read-only TV display (`localhost:3000/display`)
- RK3566 VOP2 supports two outputs (VP0 + VP1) — needs DTS config
- 🔲 Research task queued: `opi3b-dual-display-dsi-hdmi`
- 🔲 Do NOT build dual-display UI until Mode 1 + Mode 3 both confirmed

**Sequence:** Mode 1 confirmed → Mode 2 tested → Mode 3 researched + tested → build `/display` route

### Status
- Hardware: ✅ 4 units in hand, 20+ in wild
- DSI display: 🟡 Kernel recognises panel, pixel output not yet confirmed
- CKH image: 🔲 Not started
- Snapshot pre-load: 🔲 Pending image build system

---

## Target 2: WyBox (H96 Max RK3528) — TV APPLIANCE

### Hardware
- **Board:** H96 Max RK3528
- **CPU:** Rockchip RK3528 Quad-core Cortex-A53 @ 1.5GHz
- **RAM:** 4GB DDR4
- **Storage:** 64GB eMMC internal + external USB 3.0 SSD (required for chain data)
- **Network:** Gigabit ethernet + WiFi 6
- **Output:** HDMI 2.1 → TV
- **USB:** USB 3.0 for external SSD

### Software Stack
- Armbian (RK3528 — community/experimental, research task queued)
- CKH kiosk mode — fullscreen Chromium on HDMI output
- CKB full node (aarch64)
- Fiber node
- External SSD for chain data

### Signing Remote (ESP32-S3)
- Touchscreen handheld — "TV remote" form factor
- Holds private keys (flash encryption + eFuse)
- Screens: balance / pending tx / Fiber channels / node stats / DOBs
- Approves transactions — nothing signs without physical touch
- Communicates with node box via WiFi REST/WebSocket on LAN
- SPHINCS+ / Quantum Purse upgrade path (ESP32-S3 → P4)

### Status
- Hardware: ✅ 1 unit in hand
- Armbian: 🔬 Research task queued (rk3528-armbian-linux-path)
- CKH image: 🔲 Blocked on Armbian support confirmation
- Signing remote: 🔲 Board selection pending

---

## Signing Remote (shared concept — WyBox primary, OPi3B optional)

### ESP32-S3 Touchscreen Handheld
- Compact, hand-held, USB-C charging
- Board candidates: T-HMI, Guition ESP32-S3-4848S040, custom
- wyltek-embedded-builder firmware base
- WiFi comms to node box (LAN)
- Key storage: flash encryption + eFuse
- Future: SPHINCS+ post-quantum signing

---

## Communication Architecture

```
[OPi3B CKH Node]              [WyBox — RK3528]
  DSI touchscreen                HDMI → TV (read-only)
  direct touch input        +    [ESP32-S3 Signing Remote]
  self-contained                      ↕ WiFi LAN
        ↓                             ↓
  CKB Network / Fiber Network
```

---

## Product Line

| Product | Form Factor | Display | Keys | Status |
|---------|------------|---------|------|--------|
| CKH Node (OPi3B) | SBC + touchscreen | Built-in DSI | Software (JoyID) | 🟡 DSI unconfirmed |
| WyBox (H96 Max) | TV box | HDMI → TV | ESP32-S3 remote | 🔬 Armbian research |
| Signing Remote | Handheld ESP32-S3 | Onboard touch | Hardware (eFuse) | 🔲 Planned |

---

## Snapshot Strategy
- All CKH images ship with CKB snapshot pre-loaded at build time
- Snapshot maintained by Phill (existing snapshot apparatus — v5 in progress)
- "Arrives pre-synced, plug in and go" — key product differentiator
- Snapshot update cadence: with each new image release

## Research Tasks Queued
- `rk3528-armbian-linux-path` — WyBox OS viability
- `rk3528-ckb-node-setup` — WyBox CKB full node on Armbian
- `esp32s3-signing-remote-architecture` — signing remote comms + board selection
