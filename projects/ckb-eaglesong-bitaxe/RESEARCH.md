# CKB Eaglesong Bitaxe — Research Notes
*Compiled by Kernel, 2026-02-24*

## 1. The Idea
Port the Bitaxe open-source ASIC miner concept (currently Bitcoin-only) to CKB's Eaglesong algorithm by reverse-engineering the Eaglesong ASIC from a Bitmain Antminer K7 and designing an ESP32-controlled single-chip open-source miner board.

---

## 2. Antminer K7 — What We Know

### Specs
- Released: January 2023 (latest revision)
- Algorithm: Eaglesong (CKB/Nervos specific)
- Hashrate: 58 TH/s (original) / 63.5 TH/s (current production)
- Power: ~3,080W
- Efficiency: ~0.049 J/GH
- Current price: $799–$1,750 USD (discounted from original ~$3,000+, market is soft)
- Form factor: Full rack ASIC with 2 fans, Ethernet management
- Noise: 75dB

### The ASIC Chip
- Chip model: Unknown (Bitmain proprietary, unlabelled in public docs)
- Bitmain has NOT published a datasheet for the Eaglesong ASIC used in the K7
- The chip is almost certainly a custom Bitmain part (likely "BM" series, similar to BM1397 for SHA256)
- No community reverse-engineering work found (unlike BM1366/BM1397 which have extensive RE docs)
- Multiple chips per board (exact count unknown without teardown — SHA256 K7 class typically uses 4–6 chips)

### 🚨 KEY FINDING: Chip is already commercially available!
**The K7 ASIC chip is the BM2042AA** — confirmed from zeusbtc.com parts listing.
It is sold standalone as a hashboard repair part.
- Chip model: **BM2042 / BM2042AA**
- Available from: zeusbtc.com (ASIC miner repair shop), likely also AliExpress/Taobao
- The K7 chip is to Eaglesong as BM1366 is to SHA256 — same situation Bitaxe exploited
- Replacement guide published: shows chip uses BGA-style pads, heated platform for removal
- The K7 hashboard contains multiple BM2042AA chips in a chain (exact count to confirm)

This fundamentally changes the project:
- No need to buy a K7 to get chips (though still useful for protocol RE)
- Can source bare BM2042AA chips for PCB design directly
- Parallels exactly how bitaxeUltra was built (BM1366 from AliExpress repair sellers)

### Key Difference from SHA256 Bitaxe
The Bitaxe project works because:
1. The BM1366/BM1397 ASIC chips became commercially available from AliExpress at ~$15 each
2. The SHA256 protocol is documented — the chip interface was reverse-engineered from the Antminer S9/S17 by skot and community
3. A large community exists (Open Source Miners United) to iterate on PCB designs

For Eaglesong/K7, condition #1 is now met:
- ✅ BM2042AA chips ARE available standalone (from repair shops)
- ❌ Protocol not yet documented — main RE task remaining
- ❌ No existing community working on this — opportunity to start one

---

## 3. Bitaxe Architecture — How It Works

### Hardware stack (e.g., bitaxeUltra = BM1366):
- **ESP32-S3-WROOM-1** (16MB flash, 8MB PSRAM) — main controller
- **ASIC chip** (BM1366, BM1368, etc) — does the actual hashing
- **TPS40305 buck regulator** — steps 5V down to ASIC core voltage (~0.3V range)
- **DS4432U+ current DAC** — digitally adjusts ASIC core voltage
- **INA260 power meter** — measures input voltage/current
- **EMC2101** — PWM fan controller + temp sensor
- **SSD1306 OLED** — tiny status display
- PCB: 4-layer, 6mil trace/space, 1oz outer copper

### Firmware (ESP-Miner / AxeOS):
- ESP-IDF based (same toolchain as NerdMiner CKB)
- Communicates with ASIC over SPI or UART (chip-specific protocol)
- Implements Stratum v2 mining protocol
- Web dashboard (AxeOS) for config/monitoring
- Open source: github.com/bitaxeorg/esp-miner

### What we'd need to replicate for Eaglesong:
1. **ASIC interface protocol** — how the ESP32 talks to the K7's Eaglesong chip (SPI/UART commands, work submission format, nonce return format)
2. **Eaglesong algorithm implementation** — already done in our NerdMiner CKB work (the Eaglesong C implementation is complete)
3. **PCB design** — new KiCad schematic + layout matching the K7 chip pinout
4. **Power delivery** — K7 chips likely need ~0.8–1.2V core with significant current (needs proper buck/LDO design)
5. **Thermal management** — ASIC dies run hot; heatsink + fan solution

---

## 4. The Reverse Engineering Problem

### What RE actually involves:

**Phase 1: Chip identification + teardown**
- Purchase 1–2 K7 units (or source dead/damaged boards)
- Physical teardown: remove PCB cover, photograph board
- Identify chip part number (usually printed on die)
- Document chip count, interconnects, power rails

**Phase 2: Protocol capture**
- Intercept UART/SPI communications between the management controller and the ASIC chips
- Use a logic analyser (Saleae Logic Pro 16 is ideal — ~$500 AUD)
- Decode the packet format: work submission, nonce return, frequency setting, voltage commands

**Phase 3: Protocol RE and documentation**
- Understand the command set (similar to how BM1366 was decoded — documented at github.com/skot/bitaxe)
- Write an open-source driver (C, for ESP-IDF compatibility)

**Phase 4: PCB design**
- Design a minimal carrier board (similar to bitaxeUltra PCB)
- Power delivery design (switching regulator, core voltage DAC)
- Thermal solution

**Phase 5: Firmware**
- Fork ESP-Miner (AxeOS), replace SHA256 with Eaglesong
- The Stratum protocol work already done in NerdMiner CKB (significant head start)

### Tools required:
| Tool | Purpose | Est. Cost |
|------|---------|-----------|
| Antminer K7 unit | RE subject + chip source | $800–$1,750 USD |
| Saleae Logic Pro 16 | UART/SPI protocol capture | ~$500 AUD |
| Hot air rework station | Chip removal/reflow | ~$150 AUD (we may already have this) |
| Digital microscope / USB scope | PCB inspection, fine pitch pads | $50–$300 AUD |
| KiCad (free) | PCB design | $0 |
| JLCPCB prototype runs | PCB fabrication + assembly | ~$200–$500 AUD per iteration |
| Lab bench PSU | Controlled power for testing | ~$100–$200 AUD |
| Multimeter + oscilloscope | Basic debugging | likely already owned |

**Rough hardware budget: $1,500–$2,500 AUD** (excluding K7 unit itself)

---

## 5. Feasibility Assessment

### What we already have (significant head start):
✅ Eaglesong algorithm fully implemented in C (NerdMiner CKB)
✅ Stratum protocol for CKB (solo proxy + pool mining — NerdMiner CKB work)
✅ ESP32 ESP-IDF development environment set up
✅ PlatformIO toolchain + build system
✅ CKB node access + infrastructure (running nodes)
✅ Deep CKB protocol knowledge (active in community 4 years)
✅ Bitaxe firmware is open source (good reference)

### What's genuinely hard:
❌ No existing RE work on the K7 chip — we'd be first
❌ Chip may be locked/encrypted (some modern ASICs resist RE)
❌ Chip pinout unknown — would need decapping or careful trace following
❌ If chip isn't available bare, need to desolder from K7 (risky, requires skill)
❌ ASIC interface protocol completely undocumented
❌ Power delivery for a proper ASIC is non-trivial (unlike NerdMiner which is pure software)

### Probability of success:
- **Protocol capture**: High (90%) — logic analyser on UART/SPI lines is well-understood
- **PCB/driver development**: Medium-high (70%) — hard but documented process with Bitaxe as reference
- **Getting chips**: Medium (60%) — depends on whether K7 ASIC can be cleanly removed and sourced
- **Full working product**: Medium (50%) — ambitious but realistic over 3–6 months

### What would make this easier:
1. If Bitmain ever releases the K7 chip independently (unlikely but possible — they sell BM1366)
2. If another community member has done early teardown work (check OSMU Discord)
3. If the K7 uses a chip variant that shares protocol with an existing documented chip

---

## 6. Community + Grant Landscape

### CKB Community Fund DAO
The CKB Community Fund DAO is the primary grant mechanism for Nervos ecosystem projects. From what's visible on talk.nervos.org:
- Active grant category exists (confirmed by successful proposals like "Mobile-Ready CKB Light Client (Pocket Node) for Android")
- Process appears to involve: Discussion post → community feedback → formal proposal → DAO vote
- Grants appear to range from small (few thousand USD) to substantial
- Hardware projects have precedent in the broader crypto DAO space

### Grant fit assessment:
This proposal fits well because:
1. **Directly benefits CKB mining decentralisation** — K7 dominance by Bitmain is centralising; an open-source alternative matters
2. **Tangible deliverable** — open-source hardware design + firmware, not just software
3. **Community benefit** — hobbyist miners could participate in CKB security
4. **Technical credibility** — proposer has running nodes, existing NerdMiner CKB implementation, years in community
5. **Precedent**: Bitaxe project (Bitcoin) received OpenSats + HRF funding for exactly this reason

### Potential concerns from DAO:
- Hardware RE is uncertain — may not succeed
- Budget is primarily hardware (not developer time for ecosystem software)
- Low-hashrate single-chip miner won't meaningfully impact network security on its own
- Counter: the *open-source design* is the deliverable, not the miner itself

---

## 7. Rough Cost Estimate for Grant Proposal

| Item | Cost (AUD) | Notes |
|------|-----------|-------|
| Antminer K7 (for RE) | $1,200–$2,200 | Buy 2 if budget allows — one to keep running, one to RE |
| Saleae Logic Pro 16 | $520 | Best-in-class protocol analyser |
| Digital microscope | $150 | For PCB inspection |
| Hot air station | $150 | If not already owned |
| Lab bench PSU | $150 | |
| JLCPCB prototype PCBs x3 | $600 | 3 iterations expected |
| Components (passive + ICs) | $300 | Per prototype batch |
| Contingency (20%) | $500 | |
| **Total hardware** | **~$3,600 AUD** | **~$2,300 USD** |
| Developer time (optional) | $0 | Self-funded by proposer |

**Recommended ask: ~$3,000–$4,000 USD in CKB** — keeps it modest and achievable

---

## 8. Next Steps Before Proposal

1. **Check OSMU Discord** (opensourceminers.org) — anyone working on Eaglesong ASIC RE?
2. **Check if K7 chips are available bare** on AliExpress/Taobao — would massively simplify things
3. **Look at existing K7 teardown photos** on mining forums (BitcoinTalk, etc.)
4. **Post a "[DIS]" (Discussion) thread** on talk.nervos.org first — gauge community interest before formal proposal
5. **Draft formal proposal** once DIS thread gets traction

---

## 9. Sources
- bitaxe hardware: github.com/skot/bitaxe + github.com/bitaxeorg
- ESP-Miner firmware: github.com/bitaxeorg/esp-miner
- K7 specs: asicminervalue.com/miners/bitmain/antminer-k7-63-5th
- K7 price: jinglemining.com, aslminer.com ($799–$1,750 range as of Feb 2026)
- Nervos Talk grants: talk.nervos.org (Grants category, CKB Community Fund DAO)
- NerdMiner CKB: github.com/toastmanAu/NerdMiner_CKB (Phill's existing work)
