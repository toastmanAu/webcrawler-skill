# [DRAFT] Grant Proposal: CKB Eaglesong Bitaxe — Open-Source ASIC Miner for Nervos

**Status:** DRAFT — not submitted  
**Proposer:** toastmanAu (Phill)  
**Category:** CKB Community Fund DAO  
**Requested amount:** ~2,800 USD equivalent in CKB  
**Timeline:** 3–6 months  

---

## Summary

The Eaglesong ASIC chip used in the Antminer K7 has been identified as the **BM2042AA** — a 5nm Bitmain chip available as a bare component from hashboard repair suppliers. This changes the project from "buy a K7 and hope we can extract the chip" to a defined, lower-risk engineering task: reverse-engineer the ASIC command protocol on a live K7 board, then design an open-source carrier PCB around bare BM2042AA chips sourced directly.

This proposal funds that work: protocol RE via logic analyser, PCB design in KiCad, and ESP32 firmware — producing a fully open-source single-chip Eaglesong miner. Every deliverable (protocol spec, PCB files, firmware) will be published on GitHub under open-source licence, giving the CKB community a permanent foundation to build on — the same way the Bitaxe project did for Bitcoin with the BM1366.

---

## Background and Motivation

### The Problem: CKB Mining is Centralised

CKB (Nervos) uses the Eaglesong proof-of-work algorithm — a custom hash function designed to be ASIC-friendly but unique to CKB. This uniqueness, while good for preventing mining dilution, has a side effect: there is currently **only one commercially available Eaglesong ASIC miner** — the Bitmain Antminer K7.

This means:
- A single manufacturer controls 100% of efficient CKB ASIC production
- No open-source ASIC miner exists for CKB (unlike Bitcoin, which has the Bitaxe project)
- Hobbyist and small-scale miners are limited to software mining on general-purpose hardware (GPUs, FPGAs) or the BM1366-based NerdMiner approach — which has no Eaglesong ASIC equivalent
- Decentralisation of mining infrastructure depends entirely on Bitmain's continued interest in the K7 market

### The Opportunity: Open Source Mining Hardware

The **Bitaxe project** (bitaxe.org) has demonstrated that a small, open-source team can reverse-engineer commercial ASIC chips and build viable open-source mining hardware. The bitaxeUltra uses the BM1366 chip from the Antminer S19XP — the exact same approach we propose for Eaglesong. The Bitaxe project has received funding from OpenSats, the Human Rights Foundation, and the 256 Foundation precisely because open-source mining infrastructure matters for network security and decentralisation.

We want to do the same for CKB.

---

## Who I Am

I'm Phill — a hardware hobbyist and CKB community member with approximately 4 years of active involvement in the Nervos ecosystem. My relevant technical background:

- **Implemented Eaglesong in C** for the NerdMiner CKB project (ESP32-based software miner, open source at github.com/toastmanAu/NerdMiner_CKB)
- **Built and operate CKB Stratum Proxy** — open-source pool-to-solo proxy that handles ViaBTC's non-standard Stratum protocol (github.com/toastmanAu/ckb-stratum-proxy)
- **Running infrastructure**: 2 active CKB full nodes, 1 Bitcoin node, CKB Fiber Network node
- **Deep C/ESP32 experience**: The NerdMiner CKB project involved implementing SHA256, Eaglesong, and the Stratum protocol in pure ESP-IDF C
- Currently implementing **CKB Light Client protocol in C** (SecIO, Yamux, Tentacle stack — for an ESP32-based light client node)
- **Hardware background**: PCB design, ESP32 ecosystem, microcontroller work

I am not a professional PCB engineer — but the Bitaxe community has demonstrated that an enthusiast with the right tools and motivation can do this work. This proposal is also an honest research project, not a guaranteed product delivery.

---

## Technical Plan

### Overview
The project has five phases:

**Phase 1: Chip Sourcing and Board Setup** (Weeks 1–2)
- Acquire 1× Antminer K7 (secondhand) for protocol RE
- Order bare BM2042AA chips from repair suppliers
- The chip model is already confirmed: **BM2042AA** (identified from K7 hashboard repair documentation and part markings)
- Document power rail architecture for reference during PCB design

**Phase 2: Protocol Reverse Engineering** (Weeks 4–10)
- Intercept UART/SPI communications between the management controller and ASIC chips using a logic analyser
- Decode the command protocol: work submission format, nonce return format, frequency/voltage control, chip addressing
- Compare findings against the BM1366 protocol (documented by Bitaxe community) for insight into Bitmain conventions
- Publish protocol documentation as open-source spec

**Phase 3: Driver Development** (Weeks 8–14)
- Write an ESP-IDF compatible ASIC driver in C
- Implement work submission, nonce polling, chip initialisation, frequency control
- The Eaglesong algorithm is already implemented from NerdMiner CKB work — integrate with new driver
- Stratum protocol (pool + solo) already implemented in NerdMiner CKB — reuse directly

**Phase 4: PCB Design** (Weeks 10–18)
- Design a minimal carrier board for the Eaglesong ASIC
- Reference bitaxeUltra hardware design (power delivery, thermal, ESP32 integration)
- 4-layer KiCad design, JLCPCB-compatible Gerbers
- Iterate 2–3 PCB revisions as expected
- Target: ESP32-S3 + single Eaglesong ASIC chip + USB-C power, fan header, OLED display

**Phase 5: Firmware and Documentation** (Weeks 16–24)
- Fork ESP-Miner (AxeOS) or write clean firmware from scratch
- Web dashboard for hashrate monitoring, pool/solo switching, frequency tuning
- All source published to GitHub under open-source licence
- Write build guide (component sources, assembly instructions, flashing guide)

### What Success Looks Like
The minimum viable success is: **a single-chip Eaglesong ASIC miner running on an open-source PCB, hashing at measurable rate, submitting work to a CKB stratum pool, with all designs and firmware published open-source.**

Even a board doing 100 GH/s (tiny fraction of the K7's 63.5 TH/s) would be a success — because the value is in the **open design**, not the hashrate. A community could then iterate, add chips, improve efficiency.

---

## Hardware Budget

### Chip Strategy

The ASIC chip used in the Antminer K7 has been identified as the **BM2042AA** (Bitmain, 5nm Eaglesong). Crucially, this chip is available as a **bare component** from hashboard repair suppliers (e.g. zeusbtc.com, AliExpress repair parts), eliminating the need to purchase a full K7 unit solely to obtain chips. One K7 is still budgeted for protocol reverse engineering — intercepting the ASIC command protocol requires a live, operational board. Once the protocol is documented, further chip work uses the bare BM2042AA parts directly.

This mirrors exactly how the Bitaxe project began: Skot sourced bare BM1366 chips from K7 repair markets and designed a carrier board around them. We follow the same proven path.

| Item | Purpose | Est. Cost (USD) |
|------|---------|----------------|
| Antminer K7 (×1, secondhand) | Protocol RE — logic-analyse live ASIC comms | ~$900–$1,200 |
| BM2042AA bare chips (×10) | PCB prototyping — direct chip-on-board design | ~$150–$300 |
| Saleae Logic 8 | Protocol capture (UART/SPI) — Logic 8 sufficient for 2-wire comms | ~$150 |
| Digital microscope (60× USB) | PCB inspection + BGA pad mapping | ~$80 |
| Hot air rework station | BGA chip placement/reflow | ~$90 |
| Lab bench PSU (programmable) | Controlled ASIC power during bring-up | ~$90 |
| JLCPCB prototype PCBs (×3 runs) | PCB iterations — 4-layer, BGA footprint | ~$400 |
| Electronic components (passives, ESP32-S3, regulators) | Per prototype batch | ~$200 |
| Contingency (15%) | Unknown unknowns | ~$280 |
| **Total** | | **~$2,340–$2,790 USD** |

*The K7 is not consumed by this project — it remains operational throughout and retains resale value. Bare BM2042AA chips are the actual consumable prototyping material.*

**Requested: 2,800 USD equivalent in CKB** (conservative mid-range estimate with contingency)

---

## Why This Deserves CKB Community Funding

1. **Direct benefit to CKB network security**: More diverse mining hardware = less centralised production risk
2. **Open-source precedent**: The designs will be permanently open-source, enabling the community to iterate forever without depending on this proposal or Bitmain
3. **Community participation**: A cheap open-source CKB ASIC miner would allow thousands of hobbyists to participate in CKB mining — the same reason Bitaxe matters for Bitcoin
4. **Built on existing work**: This isn't starting from scratch. The Eaglesong C implementation, Stratum proxy, and ESP-IDF toolchain are all already working. The missing piece is the ASIC driver and PCB.
5. **Honest about risk**: This is a research project. If the chip is encrypted or undocumentable, we'll say so and return unused funds. The community deserves honest expectations.

---

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|-----------|
| Chip is encrypted/locked | Medium | BM1366, BM1397 and similar Bitmain chips have been successfully RE'd; protocol is typically accessible via UART without decapping. BM2042AA follows same Bitmain conventions. |
| Bare BM2042AA chips unavailable | Low | Already confirmed available from repair suppliers (zeusbtc.com). AliExpress/Taobao backup. If supply dries up, fall back to K7 donor board approach. |
| BGA placement difficulty | Medium | BM2042AA is BGA-style; budgeted hot-air station handles reflow. Community rework guides exist for similar Bitmain BGAs. 3 PCB runs give room to iterate. |
| PCB/power delivery doesn't work | Medium | 3 PCB iterations budgeted; power delivery is well-understood from Bitaxe reference designs |
| K7 price rises or availability drops | Low | Buy secondhand immediately on grant approval; K7 retains resale value as it stays operational |
| The work takes longer than estimated | High | This is a hobby project; timeline is best-effort. All intermediate work (protocol docs, RE notes) will be published openly regardless |

---

## Deliverables

All deliverables published to github.com/toastmanAu under open-source licence (CERN-OHL-S for hardware, MIT/GPL for firmware):

- [ ] K7 teardown documentation + photos
- [ ] Eaglesong ASIC protocol specification (command set, packet format)
- [ ] ESP-IDF ASIC driver (C source)
- [ ] KiCad PCB design files (schematic + layout + Gerbers)
- [ ] Firmware (AxeOS fork or custom)
- [ ] Build guide (sourcing, assembly, flashing)
- [ ] Progress updates on Nervos Talk throughout project

---

## What Comes Next (Beyond This Proposal)

A working open design opens doors for:
- Community-built hobbyist CKB miners (imagine a $100 CKB Bitaxe)
- Multi-chip designs for higher hashrate
- Eventual collaboration with Bitaxe community to add Eaglesong support to AxeOS
- Potential for small-batch manufacturing runs (self-funded or via future proposal)

---

*Draft prepared for review — not yet submitted to Nervos Talk*  
*Contact: toastmanAu on Nervos Talk / GitHub*
