# ASIC Research Notes — BM1366, BM2042AA, CK5 GS-2100
*Research compiled 2026-02-24*

---

## BM1366 (Bitaxe reference chip — Bitcoin SHA256d)

### What we know from ESP-Miner source
The BM1366 driver is the gold standard reference for our work. Key protocol findings from the Bitaxe community:

**Physical interface:**
- SPI bus: controller → ASIC (work submission, register writes)
- UART return path: ASIC → controller (nonce responses)
- Some variants use full-duplex UART for both directions
- Daisy-chainable: multiple chips on one bus, each with a chip address

**Command structure (BM1366 pattern):**
```
[PREAMBLE 0xAA 0x55] [CMD_TYPE] [CHIP_ADDR] [JOB_ID] [PAYLOAD...] [CRC5]
```

**Key commands documented:**
- `SEND_WORK` (0x01) — submits a mining job (block header + target)
- `SET_ADDRESS` (0x04) — assigns chip address during init
- `SET_BAUD` (0x18) — sets baud rate
- `SEND_INIT` (0x58) — chip initialisation sequence
- `READ_REG` / `WRITE_REG` — register R/W for frequency/voltage control
- `NONCE_RESPONSE` — chip returns `[JOB_ID][NONCE 4B][CHIP_ID]`

**Init sequence pattern:**
1. Reset line pulse
2. Broadcast `SET_ADDRESS` to all chips (they auto-address in chain)
3. `SEND_INIT` to each chip with frequency/voltage params
4. Optionally set PLL frequency via register writes
5. Begin submitting work

**Work format (SHA256d):**
- 76-byte block header (version + prev_hash + merkle_root + time + bits + nonce_template)
- Midstate optimisation used — pre-compute SHA256 of first 64 bytes
- Difficulty expressed as compact target

**Nonce response:**
- 4-byte nonce value
- Job ID to correlate response to submitted work
- Some chips return extended nonce (2 bytes extra for multi-chip nonce space partitioning)

### What this predicts for BM2042AA
Bitmain reuses protocol conventions heavily across chip generations. Differences are typically:
- Different register addresses for PLL/voltage control
- Different init parameters (frequency table, voltage levels)
- Same overall framing (AA 55 preamble, CRC5, chain addressing)

**High confidence predictions:**
- Same AA 55 preamble
- Same chain-addressing concept (each chip gets an address)
- Same job submission + nonce return pattern
- UART-based return channel
- CRC5 error checking on commands

**Unknown until logic analyser:**
- Exact register map
- Frequency/voltage init values
- Whether BM2042AA uses SPI out + UART in, or full UART
- Number of chips per K7 hashboard (K7 = 4 hashboards × ~20-24 chips each = ~80-96 total chips)

---

## Goldshell CK5 — Hardware Overview

**Specs:**
- Algorithm: Eaglesong (CKB/Nervos)
- Hashrate: 12 TH/s
- Power: 2400W
- Efficiency: 0.2 J/GH
- Release: March 2021
- Weight: 8.5kg, fans × 2
- Interface: Ethernet
- Current price: ~$199 secondhand (was $2000+ at launch)

**ASIC chip: GS-2100 (Goldshell proprietary)**
- Custom Eaglesong ASIC, not related to BM2042AA
- Less documented than Bitmain chips
- Goldshell is much smaller company — no known repair community equivalent to zeusbtc

**Architecture (known from community teardowns):**
- Multiple hashboards (typically 3-4)
- Each hashboard: multiple GS-2100 chips in daisy chain
- Controller board: runs embedded Linux (similar to Antminer — likely OpenWRT variant)
- Communication: hashboard controller talks to GS-2100 chips via SPI/UART (same Bitmain-style pattern likely borrowed)

**What a broken CK5 gives us:**

### Immediate value (no logic analyser):
1. **Physical teardown** — open it up, photograph the hashboards
   - Count chips per board
   - Identify controller chip (MCU or SoC)
   - Find UART/SPI test points
   - Look for debug headers (common on controller board)
   
2. **Controller board UART** — Goldshell miners run embedded Linux
   - Common default: 115200 baud, 8N1
   - USB-UART adapter → controller board UART header
   - May expose Linux boot log, shell, or at minimum init sequence that talks to hashboards
   - This alone could reveal the GS-2100 command format if the kernel driver is readable

3. **Network traffic capture** — if it boots at all:
   - Put it on isolated network
   - Capture Stratum traffic (TCP) + any hashboard management traffic
   - Even partial functionality reveals work format

4. **Firmware extraction** — if running embedded Linux:
   - Check for `/proc/`, look at running processes
   - `cat /proc/kconfig.gz` may reveal kernel config
   - Mining daemon binary may be extractable and reversible
   - Some Goldshell firmware is partially open (they use OpenWRT)

### Key diagnostic question: what's broken?
Common CK5 failure modes:
- **PSU failure** — hashboards fine, just need power (cheap fix)
- **One bad hashboard** — other boards still work
- **Controller board** — hashboards fine, controller dead
- **Fan failure** causing thermal shutdown (cheap fix)

If the hashboards are alive, that's the valuable part.

### Work format (Eaglesong — shared with K7)
This is where the CK5 is directly useful: **Eaglesong work format must be the same as K7** since both talk Stratum and both mine CKB. The Stratum work format is:

```json
{"method": "mining.notify", "params": [
  "job_id",
  "parent_hash",      // 32 bytes LE hex
  "timestamp",        // 4 bytes
  "compact_target",   // 4 bytes  
  "nonce",            // 4 bytes (template, miner fills this)
  "version",          // 4 bytes
  "clean_jobs"        // bool
]}
```

Eaglesong input = 144-byte CKB block header. The ASIC needs:
- Block header fields (PoW-relevant subset)
- Target difficulty
- Nonce space to search

The on-chip work submission format (controller → ASIC) will wrap these fields per the chip's native protocol, but the underlying hash input is identical regardless of manufacturer.

---

## Comparison: BM2042AA vs GS-2100

| Property | BM2042AA (K7) | GS-2100 (CK5) |
|----------|--------------|----------------|
| Algorithm | Eaglesong | Eaglesong |
| Manufacturer | Bitmain | Goldshell |
| Process node | 5nm | Unknown (~7-12nm est.) |
| Protocol docs | None public | None public |
| Repair community | zeusbtc.com (active) | Minimal |
| Bare chip available | Yes (repair market) | Unknown |
| Protocol style | BM-style (AA55 preamble, CRC5) | Unknown — possibly similar |
| Hash input | 144B CKB header | Same |

---

## Recommended next steps with your hardware

### With broken CK5 right now:
1. **Open it** — photograph everything, send me pics
2. **Find controller board UART** — usually 4-pin header near ethernet port
3. **Connect USB-UART at 115200** — see if it boots/outputs anything
4. **Check what's broken** — PSU? Hashboard? Controller?

### When K7 arrives + logic analyser:
1. Tap UART between K7 controller and one hashboard
2. Capture init sequence (power-on through first work submission)
3. Capture a nonce response
4. That's ~95% of the protocol

### What I can do next:
- Write a UART protocol capture guide for the CK5 controller board
- Map the Eaglesong block header format (what exactly gets sent to the chip)
- Start sketching the ESP32 firmware architecture for BM2042AA (based on BM1366 pattern)
- Draft the KiCad symbol/footprint spec for BM2042AA BGA once you get a chip photo

---
*Note: No BM2042AA-specific protocol documentation exists publicly as of 2026-02-24. All BM2042AA predictions are extrapolated from BM1366 documentation and Bitmain chip family conventions.*
