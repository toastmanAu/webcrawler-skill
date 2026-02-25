# [DRAFT] Grant Proposal: CKB-LoRa — Native LoRaWAN Protocol for Nervos CKB

**Status:** DRAFT — not submitted  
**Proposer:** toastmanAu (Phill)  
**Category:** CKB Community Fund DAO  
**Requested amount:** ~2,200 USD equivalent in CKB  
**Timeline:** 2–3 months  

---

## Summary

This proposal funds the design and implementation of a native LoRaWAN protocol for Nervos CKB — enabling ESP32-class IoT devices to send and receive CKB transactions over LoRa radio with **no internet connection on the device**. The deliverables are a published open protocol specification, open-source bridge software (Python), and open-source ESP32 device firmware, all built on a self-hosted ChirpStack LoRaWAN network server.

This would be the **first LoRaWAN↔CKB integration in existence**.

---

## The Problem: Blockchain Needs a Radio

Every existing method of interacting with CKB requires internet:
- Full node: requires always-on broadband
- Light client: requires broadband
- Mobile wallet: requires mobile data
- Hardware wallet: requires USB to a connected computer

None of these work for:
- Remote IoT sensors that need to log data to a blockchain
- Off-grid or disaster-scenario payments
- Low-power devices that can't maintain WiFi connections
- Areas with LoRa coverage but no reliable internet (rural AU, developing regions)

LoRaWAN solves the physical layer. CKB's Cell Model — with its flexible lock scripts and arbitrary data cells — is uniquely suited to IoT data anchoring. The combination is natural. Nobody has built it yet.

---

## Why CKB Is the Right Chain for This

Most blockchains are a poor fit for LoRa because their transactions are large (Ethereum: 100–200+ bytes for a simple transfer; Bitcoin: 250+ bytes). CKB's molecule-encoded transactions for a simple transfer are ~280–380 bytes — still larger than a single LoRa packet, but manageable with a purpose-designed fragmentation protocol.

More importantly, CKB's **Cell Model** enables genuinely novel IoT applications:
- A cell can store arbitrary data — sensor readings, GPS coordinates, status flags — anchored to the chain with a cryptographic proof
- Lock scripts can enforce device-specific rules (e.g., only this device's secp256k1 key can spend)
- Type scripts can validate IoT data format on-chain
- Future: a native CKB LoRa lock script could make devices first-class chain citizens with on-chain identity

CKB's PoW security model also means the chain keeps running even in adversarial conditions — which matters for infrastructure that might be deployed in remote or contested environments.

---

## Who I Am

I'm Phill — a hardware hobbyist and CKB community member with ~4 years of active involvement in the Nervos ecosystem. My relevant background for this proposal:

**Completed work directly applicable here:**
- **NerdMiner CKB** (github.com/toastmanAu/NerdMiner_CKB) — ESP32 Eaglesong miner in pure ESP-IDF C. Demonstrates competence with ESP32 firmware, secp256k1 crypto, and CKB protocol primitives
- **CKB Stratum Proxy** (github.com/toastmanAu/ckb-stratum-proxy) — Node.js proxy handling ViaBTC's non-standard Stratum protocol; used by solo CKB miners today
- **CKB Light Client in C** (github.com/toastmanAu/ckb-light-esp) — currently implementing the full CKB P2P stack (SecIO, Yamux, Tentacle, Molecule) in C for eventual ESP32 deployment. This work has already produced working secp256k1, blake2b, and molecule encoding implementations that will be reused directly in this project's device firmware
- **Running infrastructure:** 2 CKB full nodes, 1 Bitcoin node, CKB Fiber Network node, CKB Node Dashboard, Whale Alert bot

**LoRaWAN infrastructure I already own:**
- A LoRaWAN concentrator currently connected to the Helium network
- This proposal moves it to a self-hosted ChirpStack stack — no Helium dependency

I am a self-taught developer, not a professional. This is an honest community project, and I will publish all work openly regardless of outcome.

---

## Technical Design

### Architecture

```
[ESP32 + LoRa]  →(LoRa RF)→  [Concentrator]  →(UDP)→  [ChirpStack on Pi]
                                                              ↓ (MQTT)
                                                    [CKB-LoRa Bridge]
                                                              ↓ (JSON-RPC)
                                                    [CKB Full Node]
                                                              ↓ (P2P)
                                                        [CKB Mainnet]
```

Everything from the concentrator inward runs on a self-hosted Raspberry Pi or equivalent. **Zero internet required for the end device.** Zero Helium dependency. The CKB node propagates transactions to mainnet via its existing P2P peers.

### The Core Protocol Challenge

A minimal CKB transfer transaction is ~380 bytes (molecule-encoded, signed). A LoRa packet at maximum range (SF12) carries 51 bytes. The protocol solves this with **signed transaction fragmentation**:

1. The ESP32 device holds its own secp256k1 private key (generated on-device, never leaves)
2. It builds the full CKB transaction locally (using UTXOs cached from a prior sync)
3. Signs it with its private key
4. Splits the signed transaction into 51-byte FRAGMENT packets
5. Sends each fragment over LoRa
6. The bridge reassembles, validates the signature, and submits to the CKB node

**The bridge cannot steal funds or forge transactions.** It is a dumb relay — it only submits what the device signed. This is true native CKB ownership.

At SF12 (maximum range, ~10km+): 8 packets per transaction  
At SF7 (close range, ~1-2km): 2 packets per transaction

### Packet Format (SF12 budget: 51 bytes)

FRAGMENT packet:
```
0     1B   header (version=0, type=FRAGMENT)
1     1B   session_id (random, identifies this tx send attempt)
2     1B   frag_info [total_frags:4][frag_index:4]
3     48B  payload (raw molecule tx bytes, this fragment)
```

Query packets (BALANCE, TIP, UTXO_SYNC, TX_STATUS): 5–9 bytes each  
Response downlinks (ACK, BALANCE, TIP, UTXO data): 6–17 bytes each

The full protocol specification is already drafted and available at github.com/toastmanAu (will be published with this proposal).

### Device UTXO Management

Since the device builds transactions offline, it must know its available UTXOs. A lightweight UTXO_SYNC mechanism allows the device to request its current live cells from the bridge (which queries the CKB node). The bridge returns one 51-byte UTXO_SYNC_RESPONSE per cell. A typical device has 1–3 cells, so sync costs 1–3 downlinks — well within LoRaWAN duty cycle limits.

UTXOs are stored in ESP32 NVS (non-volatile flash). Between syncs, the device tracks its own spend state locally.

---

## Deliverables

All published to github.com/toastmanAu under MIT licence (software) / CERN-OHL-S (any hardware files):

**Protocol Specification:**
- [ ] Complete CKB-LoRa packet format spec (markdown + diagrams)
- [ ] UTXO sync protocol
- [ ] Fragment reassembly algorithm
- [ ] Error handling and retry behaviour

**Bridge Software (Python):**
- [ ] ChirpStack MQTT integration
- [ ] Fragment reassembly engine
- [ ] CKB RPC client (cell queries, transaction submission)
- [ ] Device registry (DevEUI → CKB lock script mapping)
- [ ] Downlink dispatch (ACK, UTXO sync responses, balance responses)
- [ ] systemd service file for Pi deployment
- [ ] Installation guide

**Device Firmware (ESP32 / ESP-IDF):**
- [ ] LoRaWAN OTAA join (using existing LoRaWAN library, SX1262 driver)
- [ ] CKB-LoRa packet encoder/decoder
- [ ] Transaction builder (reusing molecule + secp256k1 from ckb-light-esp)
- [ ] UTXO store (NVS-backed)
- [ ] Device state machine (sync → idle → build → send → confirm)
- [ ] Simple demo: button press sends 1 CKB to hardcoded address

**Infrastructure Guide:**
- [ ] ChirpStack installation on Raspberry Pi (arm64)
- [ ] Concentrator configuration (Semtech UDP packet forwarder)
- [ ] End-to-end setup walkthrough
- [ ] Tested on: Pi 5 + [concentrator model] + Heltec WiFi LoRa 32 v3

---

## Budget

| Item | Purpose | Cost (USD) |
|------|---------|-----------|
| Heltec Wireless Stick Lite V3 (×2, 863-928MHz AU915) | ESP32-S3 + SX1262 end device for dev + testing | ~$30 |
| Heltec LoRa 32 (already owned) | Single-channel gateway for development phase | $0 |
| RAK WisGate Lite 2 (RAK7268C) or equivalent 8-channel LoRaWAN gateway | Production-grade concentrator — AU915, SSH accessible, no cloud dependency, enables full LoRaWAN spec (multi-SF, ADR) | ~$150 |
| Misc components (antennas, cables, connectors) | Testing setup | ~$30 |
| **Hardware total** | | **~$360 USD** |

> Development uses the Heltec LoRa 32 (already owned) as a single-channel gateway.
> The RAK WisGate is for production-grade deployment — 8-channel, full AU915 spectrum,
> no Helium/cloud dependency, SSH accessible for configuration.

**Revised ask: 2,500 USD equivalent in CKB**

---

## Connection to Other Nervos Projects

**CKB Light Client (ckb-light-esp):** The device firmware reuses secp256k1, blake2b, and molecule encoding already built for this project. If the light client work completes during this project's timeline, devices could eventually do their own chain validation rather than trusting the bridge for UTXO data — full self-sovereignty.

**Fiber Network:** A LoRa-connected device could, in principle, open a Fiber payment channel via the bridge and make near-instant micropayments over LoRa. This is a longer-term vision but the CKB-LoRa protocol is designed to accommodate it.

**CKB Eaglesong Bitaxe (separate proposal):** Another hardware project in progress — establishing a pattern of open hardware development in the CKB ecosystem.

---

## Why This Deserves Funding

1. **Novel:** No LoRaWAN↔CKB integration exists anywhere. First-mover.
2. **Decentralised by design:** Self-hosted ChirpStack, no Helium, no third-party LNS. You own the whole stack.
3. **Trustless:** Device signs its own transactions. Bridge is a relay, not a custodian.
4. **Low cost ask:** I already own most of the infrastructure. Asking only for hardware and modest recognition.
5. **Built on proven work:** Not starting from scratch — secp256k1, molecule encoding, and CKB protocol knowledge are all in hand from prior projects.
6. **Genuine use case:** Remote sensors, off-grid payments, IoT data anchoring — all real applications that become possible.
7. **Open forever:** MIT licence. Community can fork, extend, productionise.

---

## Risks

| Risk | Likelihood | Mitigation |
|------|-----------|-----------|
| LoRaWAN duty cycle limits fragment delivery | Low | Retry protocol built into spec; SF7 reduces to 2 fragments |
| ESP32 molecule tx build is too slow | Low | Already have working molecule encoder from ckb-light-esp |
| ChirpStack MQTT integration changes | Low | ChirpStack v4 API is stable |
| CKB RPC molecule decode complexity | Medium | Python molecule library exists (ckb-py SDK); worst case write minimal decoder |
| Project takes longer than estimated | Medium | All intermediate artifacts (spec, bridge) are useful independently |

---

## Timeline

| Month | Milestone |
|-------|-----------|
| Month 1 | ChirpStack stack deployed on Pi5, concentrator connected, MQTT bridge skeleton, protocol spec published |
| Month 2 | Device firmware: OTAA join, packet encode/decode, UTXO sync, fragment send |
| Month 3 | End-to-end test: device sends real CKB transfer, confirmed on-chain. All code published + guide written |

---

*Draft prepared for review — not yet submitted to Nervos Talk*  
*Contact: toastmanAu on Nervos Talk / GitHub*
