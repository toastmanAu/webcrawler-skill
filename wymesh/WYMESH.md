# WyMesh

> A decentralised IoT mesh network where physical relay nodes earn CKB for useful work — with hardware-level trust anchored on-chain.

**Status:** Concept / Pre-prototype  
**Created:** 2026-03-11  
**Author:** Phill + Kernel

---

## Vision

The blockchain transport layer has always been software. WyMesh makes the physical world a first-class participant.

A $15 solar-powered LoRa node sits on a rooftop, a fence post, a mountain. It relays messages across a mesh, extends WiFi-free authentication to remote devices, and earns CKB for every packet it forwards. Its identity is unforgeable — burned into a secure element at manufacture. Its firmware is verifiable — hashed into a DOB on CKB mainnet. Its coverage is provable — witnessed by neighbours and anchored on-chain.

No central authority. No trusted firmware server. No manufacturer backdoor. Just hardware, cryptography, and CKB.

---

## Stack

### Hardware
- **MCU + Radio**: ESP32 + SX1276 LoRa (TTGO LoRa32 v2, ~$15 AliExpress)
- **Secure Element**: ATECC608A (~$1, I2C, factory-burned keypair, tamper-resistant)
- **Optional Sensor**: BME280 (temp/humidity/pressure, ~$2)
- **Power**: 3.7V LiPo + 5V/1W solar panel — years of autonomous operation
- **Mesh Protocol**: Meshtastic (open source, ESP32-native, LoRa 915MHz AU)

### Identity Layer
- Each device has a unique keypair in its ATECC608A — private key never leaves the chip
- At first flash: firmware hash computed, DOB minted on CKB mainnet
- DOB cell contains:
  - `device_pubkey` (from secure element)
  - `firmware_hash` (SHA256 of flashed binary)
  - `hw_revision` (board + BOM version)
  - `mint_timestamp`
  - `manufacturer_sig` (optional — Wyltek signing key)

### On-Chain Trust (CKB)
- **Device DOB**: Spore cell — transferable, permanent device identity + provenance
- **Firmware Whitelist Cell**: governed by multisig — list of approved `(firmware_hash, version)` pairs
- **Node Registry Cell**: active nodes, staked CKB, coverage region
- **Coverage Proof Cell**: signed witness reports from neighbouring nodes

### Proof of Coverage / Proof of Relay
```
Device A sends beacon → Device B hears it
Device B signs: {heard: A.pubkey, rssi: -87, snr: 4.2, timestamp: T, my_pubkey: B.pubkey}
Device B submits witness to CKB via WiFi gateway
Type script validates:
  1. B.firmware_hash IN whitelist_cell.approved_hashes
  2. A.firmware_hash IN whitelist_cell.approved_hashes  
  3. B.signature valid over witness data
  4. timestamp within acceptable window
  5. RSSI plausible (not spoofed — cross-checked with other witnesses)
→ Reward released via Fiber micropayment to B.payment_address
```

### Firmware Trust Model
```
flash time:  firmware_hash → DOB cell on CKB
runtime:     type script checks DOB.firmware_hash IN whitelist
update:      new hash added to whitelist; old versions optionally revoked
governance:  whitelist cell controlled by multisig (Wyltek + community)
```

**Attack prevention**: modified firmware to fake RSSI = hash not in whitelist = proof rejected = no reward.

### WyAuth Integration
WyMesh nodes become transport for WyAuth sign requests:
```
Remote ESP32 device (no WiFi)
  → WyAuth sign request packet → LoRa mesh
  → hop by hop to gateway node (has WiFi)
  → gateway forwards to JoyID
  → signed credential returns same path
  → device authenticated, can transact on CKB
```
Relay nodes earn CKB for forwarding WyAuth packets. Economic incentive = better auth infrastructure.

### Payment Layer
- **Fiber channels**: micropayments per packet relayed or per uptime epoch
- **Per-packet**: ~1 satoshi CKB equivalent — high frequency, Fiber handles throughput
- **Per-epoch**: hourly/daily uptime proofs — simpler, less overhead
- **Gateway bonus**: nodes with WiFi uplink that bridge mesh↔internet earn extra
- **L1 settlement**: Fiber channels settle to CKB mainnet periodically

---

## Why CKB

| Need | CKB Feature |
|------|------------|
| Compact proof cells | Cell model — data is first-class |
| Permanent coverage map | CKBFS — content-addressed, permanent |
| Micropayment throughput | Fiber Network |
| Transferable device identity | Spore DOBs |
| Trustless firmware verification | Type scripts |
| Community governance of whitelist | Multisig + type scripts |
| Light client on ESP32 | CKB-ESP32 light client (existing project) |

---

## Comparison to Helium

| | Helium | WyMesh |
|---|---|---|
| Consensus | Proof of Coverage (HoneyBadger BFT) | CKB type scripts |
| Chain | Solana (migrated) | CKB native |
| Firmware trust | None | ATECC608A + DOB hash |
| Device identity | Manufacturer cert | On-chain DOB |
| Governance | Helium Inc / Nova Labs | Multisig + community |
| Reward token | HNT | CKB |
| Payment channels | None | Fiber |
| Open source | Partial | Full |

**Key improvements over Helium:**
- Hardware-rooted firmware trust (Helium has no firmware verification)
- Truly decentralised — no company controls whitelist or rewards
- Payment channels (Fiber) enable sub-cent micropayments Helium never had
- Device provenance transferable via DOB

---

## Known Attack Vectors (from Helium research)

- **RSSI spoofing**: fake high signal strength → cross-witness validation + geographic plausibility checks
- **Virtual nodes**: running software-only fake devices → ATECC608A requirement (can't be virtualised)
- **Colluding witnesses**: two devices owned by same person → staking + slashing, geographic distribution requirements
- **Replay attacks**: reuse old valid proofs → timestamp window + nonce in proof cell
- **Firmware downgrade**: flash old vulnerable firmware → whitelist can revoke old hashes

---

## Prototype Plan

### Phase 1 — Proof of Concept (1-2 weeks)
- [ ] TTGO LoRa32 + ATECC608A wired up
- [ ] Meshtastic firmware modified to sign packets with secure element
- [ ] CKB testnet type script: validate signed beacon + pay testnet CKB
- [ ] Two nodes, one gateway, one coverage proof on testnet

### Phase 2 — DOB Identity (2-3 weeks)
- [ ] Firmware hash computed at flash time
- [ ] DOB minting integrated into flash toolchain
- [ ] Type script checks DOB.firmware_hash
- [ ] Whitelist cell created and governed

### Phase 3 — Fiber Micropayments (3-4 weeks)
- [ ] Fiber channels between gateway nodes
- [ ] Per-packet reward logic
- [ ] Payment routing through mesh

### Phase 4 — WyAuth Transport (4-6 weeks)
- [ ] WyAuth packets routed over LoRa mesh
- [ ] Gateway bridges mesh↔JoyID
- [ ] End-to-end auth test: remote device, no WiFi

---

## BOM (per node)

| Component | Part | Cost |
|-----------|------|------|
| MCU + LoRa | TTGO LoRa32 v2.1 (SX1276, 915MHz) | ~$15 |
| Secure element | ATECC608A-MAHDA-S (I2C, SOIC-8) | ~$1 |
| Sensor (optional) | BME280 breakout | ~$2 |
| Battery | 3.7V 2000mAh LiPo | ~$5 |
| Solar | 5V 1W panel | ~$5 |
| Enclosure | Weatherproof IP65 box | ~$8 |
| **Total** | | **~$36 deployed** |

---

## Repos

- WyMesh firmware: `toastmanAu/wymesh-firmware` (TBD)
- WyMesh type scripts: `toastmanAu/wymesh-contracts` (TBD)
- WyAuth: `toastmanAu/WyAuth` (existing)
- CKB-ESP32: `toastmanAu/ckb-light-esp` (existing)

---

## Notes

- 915MHz LoRa band for AU — check local regulations for TX power limits
- Meshtastic has an active community — worth engaging early
- ATECC608A requires Microchip provisioning for production; dev uses default config
- Consider Zigbee as secondary mesh protocol for indoor/short-range use cases
- WyMesh nodes could also host CKB light client — full SPV verification without a server

---

*"Not a validator, not a traditional miner — a physical infrastructure participant. The transport layer has geography."*
