# NerdMiner_CKB — Upstream PR Queue

Triaged from BitMaker-hub/NerdMiner_v2 open PRs as of 2026-02-22.
These are candidates to review and apply to `toastmanAu/NerdMiner_CKB`.

---

## 🔴 High Priority — CKB-Specific Adaptation Needed

### PR #727 — IRAM_ATTR for hot-path functions
**Title**: Add IRAM_ATTR to critical SHA256 functions  
**Source**: `kasperaitis:increasehash`  
**Why relevant**: Demonstrated +7.5% hashrate improvement (345→371 KH/s) by moving SHA256 wrapper functions from flash to IRAM. For CKB, we should apply `IRAM_ATTR` to **`eaglesong_permutation()`** in `eaglesong.cpp`. The 43-round permutation is our hot path — same principle applies.  
**CKB adaptation**: Add `IRAM_ATTR` to `eaglesong_permutation()` and possibly the `eaglesong()` function itself.  
**Effort**: Small (1–2 file change, add attribute to 2 functions)  
**Link**: https://github.com/BitMaker-hub/NerdMiner_v2/pull/727

---

## 🟡 Medium Priority — Apply Mostly As-Is

### PR #747 — Screen timeout / Energy Saver
**Title**: feat: add screen timeout & Energy Saver  
**Source**: `emaza:feature/screen-timeout`  
**Why relevant**: Useful for ESP32 devices running off battery or in low-power setups. Display-only change, no mining logic involved.  
**CKB adaptation**: Apply directly — no CKB-specific changes needed.  
**Effort**: Small  
**Link**: https://github.com/BitMaker-hub/NerdMiner_v2/pull/747

### PR #701 — Headless dashboard (web GUI)
**Title**: headless dashboard for miner  
**Source**: `vandsh:feature/add_headless`  
**Why relevant**: Adds a web-based dashboard to monitor a single miner via HTTP. Useful for CKB miners running without a screen. Would show hash rate, shares, connection status.  
**CKB adaptation**: Stats labels (currently "BTC") would need updating to "CKB" — but that's cosmetic.  
**Effort**: Medium (review + update display strings)  
**Link**: https://github.com/BitMaker-hub/NerdMiner_v2/pull/701

### PR #741 — NerdMiner Fleet Dashboard (UDP)
**Title**: NerdMiner Dashboard  
**Source**: `WeisTekEng:dashboard`  
**Why relevant**: Local web dashboard for monitoring a fleet of NerdMiners via UDP broadcast. Different from #701 — this is for multi-device monitoring.  
**CKB adaptation**: Apply and update "BTC"→"CKB" labels.  
**Effort**: Medium  
**Link**: https://github.com/BitMaker-hub/NerdMiner_v2/pull/741

---

## 🟢 Low Priority — Hardware/Board Support (Apply As-Is)

These are pure hardware board additions with no mining logic changes. Safe to cherry-pick when you have specific hardware to target.

| PR | Board | Notes |
|----|-------|-------|
| #754 | Waveshare ESP32-S3-LCD-1.47 | New board env |
| #759 | Adafruit Feather ESP32-S3 TFT | New board env |
| #734 | ESP32-C3 with WiseChip 0.42" OLED | New board env |
| #733 | ESP32-C3-Core LuatOS | New board env |
| #737 | M5Stack Core2 (4-chart screen) | Display variant |

---

## 🗑️ Skip / Not Applicable

| PR | Reason |
|----|--------|
| #760 | Duplicate Free_Fonts.h removal — already clean in our fork |
| #765 | I2C slave mode — Bitcoin-specific (SHA256 offload via I2C), not applicable to Eaglesong |
| #715 | Clock face screen — cosmetic, low value |
| #753 | platformio.ini tweak — check if relevant |

---

## Our Own TODOs for NerdMiner_CKB

- [ ] **Apply IRAM_ATTR to eaglesong_permutation()** — biggest performance win
- [ ] **Test against a live CKB Stratum pool** (f2pool, upool, etc.)
- [ ] **Update display labels**: "BTC" → "CKB" in monitor.cpp / display drivers
- [ ] **Verify nonce submission format** matches pool expectations
- [ ] **Benchmark Eaglesong hash rate** on target ESP32 hardware
- [ ] **Close the loop**: Does pool's extranonce1 actually fit in 8 bytes? Some pools use longer prefixes — may need to adjust nonce layout

---

*Last updated: 2026-02-22 by Kernel*
