# LoRa PoC on CKB — Discussion Log

**Started:** 2026-02-25
**Status:** Concept / Early Design

---

## Core Thesis

A LoRa Proof-of-Coverage network where the coverage infrastructure IS CKB L1 — not hosted on CKB, not using CKB as a database, but architecturally inseparable from it.

Inverse of Helium/Solana: Helium uses Solana as infrastructure rental. This idea uses CKB as the reason the network is possible at all. Every gateway that joins is an argument for CKB's utility in the real world.

**Key constraint:** Architecture must make migration to another chain technically impossible, not just inconvenient. We win here.

---

## Why CKB's Cell Model is Uniquely Suited

CKB cells map to physical things naturally:
- Bitcoin UTXOs too rigid
- Ethereum accounts too account-centric  
- CKB cells = generalised state containers with programmable ownership

Perfect for:
- Gateway coverage territory (owned by a Cell, updated by proof)
- Signal measurements (immutable historical record)
- Device identity (lock script = hardware key)

---

## Core Architecture

### Coverage Cells (L1 primitive)
Each H3 hex tile with verified coverage = a CKB Cell.
Type script enforces Cell can only be updated by valid PoC proof.
The coverage map IS the UTXO set.

```
Coverage Cell:
  lock: gateway_owner_lock
  type: poc_coverage_type_script
  data: {hex_id, last_proof_block, rssi_history, uptime_score}
  capacity: ~200 CKB (locked as stake)
```

### Proof Transaction
Spending beacon Cell + witness Cell → new coverage Cell (updated state) + reward Cell.
Pure CKB transaction. No L2 required for settlement.

### Reward Mechanism
Base: rewards as CKB capacity released back to gateway owner as coverage score improves.
More coverage = more CKB unlocked. Ties reward to CKB's native asset directly.
Optional: xUDT governance/utility token on top if needed.

### L2 Layer (Axon) — for high-frequency ops
- Daily proof submissions (thousands/day)
- Coverage scoring computation
- Reward calculation
- Batched settlement back to CKB L1

Axon chosen because:
- Native CKB bridge (cryptographically verified, not third-party)
- Staking on CKB L1 (validators can't operate without CKB stake)
- IBC support for future connectivity
- If Axon dies: CKB L1 holds canonical state, L2 is replaceable

---

## Anti-Gaming Design

Lessons from Helium/Crankk/Chirp/Nonocoy:

| Project | Lesson |
|---|---|
| Helium | Too generous early → gaming → death spiral. Moved to Solana = community revolt |
| Crankk | Simpler anti-gaming (witness pairs) works but small network |
| Chirp | Dual-token (CHIRP + GCHIRP), closed firmware |
| Nonocoy | Multi-radio promising but complex |

**Physics-based verification:**
- RSSI/distance check: if two gateways claim RSSI -60dBm but 50km apart → reject
- TDoA (Time-Difference-of-Arrival): position fix from multiple witnesses = mathematically hard to fake
- Max witnesses per beacon (cap like Helium's 14)
- Cooldown between proof pairs
- Chain VRF selects who beacons (randomised, unpredictable)

**Transmit scale:** penalise oversaturated hexes (Helium's biggest lesson)

---

## Hardware

- ECC608 secure element in every gateway (~$0.80) — key burned at manufacture, CKB-anchored identity, physically unextractable
- RAK Wireless / Dragino / Seeed gateways: sub-$150
- DIY: Pi + SX1302 LoRa hat (~$80)
- Pi zero 2W as minimal gateway node

---

## The Narrative

"We built a LoRa IoT network where every square kilometre of coverage is a CKB cell. The network's security is CKB's PoW. The network's value is CKB's programmability. You can't run this network without CKB existing — and CKB becomes more valuable every gateway that joins."

More coverage = more CKB capacity locked = more value in the network. The connection is architectural, not just incentive design. CKB IS the network's collateral.

---

## What Makes It Immovable

1. **Coverage history as provenance** — 12 months of PoC proofs anchored to CKB block hashes. "This gateway has provided verified coverage since block 18,000,000" is a CKB-native statement with no meaning on another chain.
2. **Hardware binding** — ECC608 provisioned with CKB-anchored identity at manufacture. Can't re-key to a different chain without physical access.
3. **xUDT composability** — token composable with CKB DeFi, RGB++, Fiber. Value network effects accrue to CKB.
4. **Governance on CKB** — protocol upgrades require CKB cell votes. Fork + governance migration required to move — effectively impossible.

---

## PoC vs Other Chains Comparison

| Option | Effort | Lock-in | Notes |
|---|---|---|---|
| Axon L2 + CKB L1 | Medium-High | Maximum | Recommended for full vision |
| Base/Arbitrum | Low | None | Fast to testnet, no CKB moat |
| CKB Scripts only | Medium | Maximum | Hard dev, scaling issues |
| Cosmos SDK | High | Medium | IBC but no CKB native |
| Fiber only | Low-Med | High | No smart contract logic |

---

## Grant Potential

Exactly the kind of project CKB Foundation funds:
- Real-world infrastructure
- Crypto-economic security
- Ecosystem showcase
- Novel — nobody building LoRa PoC on CKB/Axon

---

## Open Questions / Next Steps

- [ ] Validate Axon is still actively maintained before committing
- [ ] Design tokenomics: pure CKB capacity vs xUDT hybrid
- [ ] Prototype CKB type script for coverage cell
- [ ] Evaluate TDoA anti-gaming feasibility with available LoRa hardware
- [ ] Identify potential co-founders / hardware partners
- [ ] Draft grant proposal for CKB Foundation
- [ ] Talk to Axon team / Nervos Foundation about infrastructure support

---

## Discussion Sessions

- **2026-02-25 ~22:00 ACST** — Initial concept discussed. Established CKB-native architecture, anti-gaming lessons from Helium, hardware options, L2 options comparison, "L1 empowerment" framing, immovable architecture design.

