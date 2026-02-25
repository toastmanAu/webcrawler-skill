# CKB-LoRa Protocol — Research & Design Notes
*Kernel, 2026-02-24*

## The Fundamental Constraints

### LoRaWAN Payload Budget
This is the hardest constraint. Everything else bends around it.

| Spreading Factor | Max Payload | Airtime (typical) | Use case |
|-----------------|-------------|-------------------|----------|
| SF7 (closest range, fastest) | **242 bytes** | ~50ms | Ideal — urban, within 1-2km |
| SF8 | 125 bytes | ~90ms | |
| SF9 | 115 bytes | ~165ms | |
| SF10 | 51 bytes | ~330ms | Medium range |
| SF11 | 51 bytes | ~660ms | Long range |
| SF12 (max range) | **51 bytes** | ~1300ms | Rural, 10+ km |

**Duty cycle limit: 1% in most regions (AU915/AS923)**
This means a device can transmit for only ~36 seconds per hour.
At SF12 (51 bytes): ~27 packets max per hour.
At SF7 (242 bytes): still ~720 packets/hour but range is reduced.

**Design target: all ops MUST work in ≤51 bytes** (SF12 compatible = works everywhere)
**Stretch target: optimised ops for SF7 (242 bytes)** for close-range / gateway-owned scenarios

### CKB Transaction Minimum Size
A minimal CKB transfer (1 input, 1 output, secp256k1 witness):
- Version: 4B
- Cell deps: ~37B (1 dep = 32B outpoint hash + 4B index + 1B dep_type)
- Header deps: 4B (empty)
- Inputs: ~48B (32B tx hash + 4B index + 4B since = 40B + molecule overhead)
- Outputs: ~57B (8B capacity + 32B lock code_hash + 1B lock hash_type + 20B lock args + molecule)
- Outputs data: 4B (empty)
- Witnesses: ~97B (65B secp256k1 sig + molecule overhead ~32B)

**Minimum raw tx ≈ 280–350 bytes** in molecule encoding.

This is **way too big** for a LoRa packet. The solution: **don't send the full transaction over LoRa**.

---

## Architecture: The CKB-LoRa Bridge Model

```
[LoRa Device]                    [Your CKB Node / Pi]
     |                                    |
     |--- 51-byte LoRa packet ----------->|  (via Helium/concentrator)
     |                                    |
     |                         [CKB-LoRa Bridge]
     |                           - Validates intent
     |                           - Constructs full tx
     |                           - Submits to CKB RPC
     |                           - Returns result
     |                                    |
     |<-- 51-byte ACK/NACK/TXHASH --------|
```

The LoRa device sends a **compact signed intent** — not a full transaction.
The bridge (running on a Pi or any internet-connected CKB node) receives the intent, validates the signature, constructs the actual CKB transaction, and broadcasts it.

This is safe because:
1. The LoRa device signs with its secp256k1 private key
2. The bridge CANNOT forge or modify the transaction (secp256k1 signature covers all fields)
3. The bridge is a relay, not a custodian

---

## Packet Format Design

### Core Principles
- **Everything is binary, nothing is JSON/text**
- **Big-endian integers** (natural for network protocols)
- **Version byte first** (allows future upgrades)
- **Minimal field widths** (every bit counts at SF12)

### Packet Types

```
Byte 0: [version:4][type:4]
  Version = 0x0 (current)
  Types:
    0x0 = TRANSFER_INTENT    (device → bridge, send CKB)
    0x1 = TX_STATUS_QUERY    (device → bridge, check tx)
    0x2 = BALANCE_QUERY      (device → bridge, get balance)
    0x3 = BLOCK_TIP_QUERY    (device → bridge, get chain tip)
    0x4 = TX_CONFIRMED ACK   (bridge → device, confirmed)
    0x5 = TX_PENDING ACK     (bridge → device, in mempool)
    0x6 = TX_FAILED ACK      (bridge → device, rejected)
    0x7 = BALANCE_RESPONSE   (bridge → device)
    0x8 = BLOCK_TIP_RESPONSE (bridge → device)
    0x9 = ERROR              (bridge → device)
    0xA = SCRIPT_CALL_INTENT (device → bridge, invoke CKB script) [future]
    0xB–0xF = reserved
```

---

## Packet Definitions (51-byte budget)

### 0x00 TRANSFER_INTENT (uplink, device → bridge)
**Purpose:** Send CKB from the device's address to another address.

```
Offset  Len  Field
0       1    version_type        (0x00)
1       4    nonce               (monotonic counter, replay protection)
5       4    capacity_ckbytes    (amount in CKBytes, NOT shannons — 1 CKByte = 10^8 shannons)
              Max value: 4,294,967,295 CKByte = way more than enough
9       20   to_lock_args        (recipient lock args — secp256k1 = blake160(pubkey))
29      8    fee_rate            (shannons per byte, uint32 LE at bytes 29-32, zeros at 33-36)
              Typical: 1000 shannons/byte → just use 4B
33      4    fee_rate            (shannons/byte as uint32 BE)
              -- rethink: just use 2B for fee_rate, 0–65535 shannons/byte is enough --

Revised layout:
0       1    version_type        0x00
1       4    nonce               uint32 BE, monotonic
5       4    capacity_ckbytes    uint32 BE, amount in CKByte (NOT shannons)
9       20   to_lock_args        20-byte blake160 hash of recipient pubkey
29      2    fee_rate            uint16 BE, shannons per byte (0–65535, typical 1000)
31      16   signature_partial   first 16 bytes of secp256k1 signature (HMAC pre-auth)
             OR: use full 51 bytes differently:

BETTER: Use the device's own secp256k1 key to sign a deterministic message
The bridge knows the device's pubkey → knows its CKB address → knows which UTXOs to spend.
Signature covers: nonce + capacity + to_lock_args + fee_rate = 31 bytes of intent
Full 65-byte secp256k1 sig doesn't fit in one packet → need compact scheme.

SOLUTION: Use secp256k1 SCHNORR or use HMAC-SHA256 with a shared secret.
BUT CKB uses secp256k1 ECDSA. For auth we can use a separate MAC.
```

### Revised Authentication Strategy

**Option A — HMAC Pre-authentication (recommended for v1)**

The device and bridge share a 16-byte session key derived at pairing time (out-of-band).
Packets use HMAC-SHA256-truncated-to-8-bytes for MAC.
The bridge then constructs and signs the actual CKB transaction with the device's full key.

Wait — this requires the bridge to hold the private key. That's a custodial bridge.

**Option B — Pre-signed Transaction Hash Commitment (trustless)**

1. Device pre-computes the CKB transaction locally (needs to know its UTXOs — requires prior sync)
2. Device signs the tx hash with secp256k1 (65 bytes) — but we can't send 65 bytes in 51
3. Send the signature in 2 packets (split protocol)

**Option C — Delegated Key with Script (best long-term)**

Deploy a custom CKB script (lock script) that accepts a LoRa-compact signature format.
The device's lock script verifies a 48-byte compact signature directly on-chain.
This is the cleanest solution but requires a CKB script deployment.

**Option D — Helium Bridge Trust Model (pragmatic for v1)**

Your own concentrator → your own bridge server (Pi5) → your private key held on Pi5.
The LoRa device is "your device" — you trust your own infrastructure.
Authentication is HMAC with shared secret.
**This is the right starting point.** Full trustless later.

---

## Final v1 Packet Spec (Option D — Trusted Bridge)

### TRANSFER_INTENT (51 bytes)
```
Byte  Len  Field                Description
0     1    header               bits[7:4]=version(0), bits[3:0]=type(0x0)
1     4    seq                  uint32 BE sequence number (replay protection)
5     4    amount               uint32 BE, in CKByte (10^8 shannons each)
9     20   recipient            lock args (blake160 of recipient pubkey, 20 bytes)
29    2    fee_rate             uint16 BE, shannons/byte (default 1000 = 0x03E8)
31    8    hmac                 HMAC-SHA256(key, header||seq||amount||recipient||fee_rate)[0:8]
39    12   padding              zeros (reserved for future use)
TOTAL: 51 bytes ✅ SF12 compatible
```

### TX_STATUS_QUERY (10 bytes)
```
0     1    header               0x01
1     4    seq                  query seq (matches original TRANSFER_INTENT seq)
5     4    tx_hash_prefix       first 4 bytes of tx hash (bridge knows full hash from seq)
TOTAL: 9 bytes ✅
```

### BALANCE_QUERY (5 bytes)
```
0     1    header               0x02
1     4    seq                  uint32 BE (for response matching)
TOTAL: 5 bytes ✅ (bridge knows device's address from device ID)
```

### BLOCK_TIP_QUERY (5 bytes)
```
0     1    header               0x03
1     4    seq                  for response matching
TOTAL: 5 bytes ✅
```

---

## Downlink (Bridge → Device) Responses

LoRaWAN downlinks are limited and expensive (blocks gateway receive).
Responses should be minimal and only sent when device explicitly queries.

### TX_CONFIRMED (10 bytes)
```
0     1    header               0x04
1     4    seq                  matching request seq
5     4    block_number         uint32 BE, block where tx was confirmed
TOTAL: 9 bytes ✅
```

### TX_PENDING (6 bytes)
```
0     1    header               0x05
1     4    seq                  matching seq
5     1    mempool_age          seconds in mempool / 10 (approximate)
TOTAL: 6 bytes ✅
```

### TX_FAILED (6 bytes)
```
0     1    header               0x06
1     4    seq                  matching seq
5     1    error_code           (see error codes below)
TOTAL: 6 bytes ✅
```

### BALANCE_RESPONSE (17 bytes)
```
0     1    header               0x07
1     4    seq                  matching seq
5     8    balance_shannons     uint64 BE, balance in shannons (÷10^8 = CKByte)
13    4    block_number         uint32 BE, balance as-of block
TOTAL: 17 bytes ✅
```

### BLOCK_TIP_RESPONSE (13 bytes)
```
0     1    header               0x08
1     4    seq                  matching seq
5     4    block_number         uint32 BE current tip
9     4    block_hash_prefix    first 4 bytes of tip block hash
TOTAL: 13 bytes ✅
```

### ERROR (6 bytes)
```
0     1    header               0x09
1     4    seq
5     1    error_code
TOTAL: 6 bytes ✅
```

### Error Codes
```
0x00  OK / success
0x01  Invalid HMAC
0x02  Replay (seq too old)
0x03  Insufficient balance
0x04  Insufficient fee
0x05  Invalid recipient
0x06  UTXO not found
0x07  RPC error
0x08  Bridge overloaded
0x09  Unknown command
0xFF  Generic error
```

---

## HMAC Key Derivation & Device Pairing

Pairing process (done once, out-of-band):
1. Device generates a random 16-byte device secret at first boot
2. Device and bridge exchange keys via USB serial / QR code scan
3. Bridge stores: `{ device_eui: [8 bytes], ckb_address: "ckb1...", hmac_key: [16 bytes] }`
4. HMAC key = HKDF-SHA256(device_secret, "ckb-lora-v1", device_eui) truncated to 16 bytes
5. All future packets authenticated with HMAC-SHA256(hmac_key, packet[0:31])[0:8]

---

## The "No Internet" Use Case — Pure Private LoRa

Phill's concentrator → connects to Helium network (which has internet).
But the goal is "no internet" for the end device.

**Scenario A: Helium-Connected Gateway (current setup)**
- Device sends LoRa packet → your concentrator → Helium Packet Router → your Bridge (Pi5 on LAN) → CKB node
- The device itself has NO internet. Your gateway has internet but that's infrastructure, not the device.
- This is what Helium is designed for. ✅

**Scenario B: Fully Offline (no internet anywhere)**
- Device → your concentrator (running local LNS, no Helium) → Pi5 (local) → CKB node (local)
- Requires: local LoRaWAN server (e.g., ChirpStack) on your Pi5
- The CKB node IS your gateway to the blockchain
- Works if Pi5 has a CKB full node (which you do! ckbnode at 192.168.68.87)
- Transactions are submitted to your local node → propagated to mainnet via normal P2P
- This is completely viable ✅

**Scenario C: Fully Offline P2P (no existing node)**
- Requires light client on the bridge
- The ckb-light-esp project we're building would be ideal here eventually
- Bridge validates via light client, submits when P2P connectivity exists

---

## Implementation Roadmap

### Phase 1: Bridge Server (Python, ~2 days)
- Flask/FastAPI HTTP server on Pi5
- Receives LoRa payloads from Helium/ChirpStack via webhook
- Decodes TRANSFER_INTENT packets
- Verifies HMAC
- Queries device's UTXOs via CKB RPC
- Constructs and signs minimal CKB transfer transaction
- Broadcasts via CKB RPC `send_transaction`
- Stores seq→txhash mapping
- Sends downlink response

### Phase 2: LoRa Device Firmware (ESP32 + LoRa module, ~1 week)
- Target hardware: ESP32 + SX1276/SX1262 LoRa module (e.g., TTGO LoRa32, Heltec WiFi LoRa 32)
- ESP-IDF or Arduino SDK
- Packet encoder/decoder for above spec
- HMAC-SHA256 (mbedTLS, already in ESP-IDF)
- Monotonic sequence number in NVS flash
- Simple API: `ckb_send(recipient_lock_args, amount_ckbyte)` → returns seq for later query

### Phase 3: ChirpStack Integration (optional, ~1 day)
- Run ChirpStack on Pi5 as local LNS
- Connect your concentrator to it instead of/alongside Helium
- Pure LAN operation with no Helium dependency
- Still internet-free end device

### Phase 4: Enhanced Protocol (future)
- Script-based trustless mode (custom CKB lock script)
- Multi-sig with compact signature scheme
- Balance-triggered actions (e.g., "pay when balance > X")
- UDT token transfers (requires understanding token cell structure)

---

## Hardware You Already Have

- **Concentrator**: Running on Helium ✅ — already has internet backhaul, handles RF layer
- **Pi5**: Runs the bridge + CKB node connectivity ✅
- **ckbnode (Orange Pi 3B)**: Full CKB node, RPC at 192.168.68.87:8114 ✅

### Hardware Needed
- **LoRa end device**: ESP32 + SX1276 LoRa module
  - TTGO LoRa32 v2.1: ~$20 USD (ESP32 + SX1276 + OLED + battery header)
  - Heltec WiFi LoRa 32 v3: ~$25 USD (ESP32-S3 + SX1262 + OLED)
  - Or bare SX1276 module + your existing ESP32: ~$5

---

## CKB Transaction Construction (Bridge Side)

For a simple CKB transfer (what the bridge builds from TRANSFER_INTENT):

```python
# Pseudocode for bridge
def handle_transfer_intent(packet, device_info):
    # Verify HMAC
    expected_mac = hmac_sha256(device_info.key, packet[:31])[:8]
    if packet[31:39] != expected_mac:
        return send_downlink(TX_FAILED, 0x01)  # Invalid HMAC
    
    seq = unpack_uint32(packet[1:5])
    amount_ckbyte = unpack_uint32(packet[5:9])
    recipient_args = packet[9:29]
    fee_rate = unpack_uint16(packet[29:31])
    
    # Check replay
    if seq <= device_info.last_seq:
        return send_downlink(TX_FAILED, 0x02)
    
    # Fetch device's UTXOs via CKB RPC
    cells = ckb_rpc.get_cells(device_info.lock_script)
    
    # Select input cells (simple greedy selection)
    amount_shannons = amount_ckbyte * 100_000_000
    selected, change = select_cells(cells, amount_shannons, fee_rate)
    
    # Build transaction
    tx = CKBTransaction(
        inputs=[cell_input(c) for c in selected],
        outputs=[
            cell_output(amount_shannons, lock_script(recipient_args)),  # to recipient
            cell_output(change, device_info.lock_script),                # change back
        ],
        cell_deps=[SECP256K1_CELL_DEP],
    )
    
    # Sign with device's private key (held by bridge in trusted model)
    sig = secp256k1_sign(device_info.privkey, tx_hash(tx))
    tx.witnesses = [witness(sig)]
    
    # Broadcast
    txhash = ckb_rpc.send_transaction(tx)
    
    # Store for later query
    store_pending(seq, txhash)
    device_info.last_seq = seq
    
    # Send downlink (TX_PENDING)
    send_downlink(TX_PENDING, seq, mempool_age=0)
```

---

## Grant Angle

This is also fundable via CKB Community Fund DAO:
- First LoRaWAN → CKB bridge protocol
- Enables IoT devices to interact with CKB with no internet
- Open source bridge software + device firmware
- Practical use case: pay-per-use sensors, remote monitoring, off-grid CKB transfers
- Helium + CKB cross-ecosystem story (both decentralised networks)
- Could be combined with the Bitaxe proposal or submitted separately

---

## Sources
- LoRaWAN payload limits: thethingsnetwork.org/docs/lorawan/limitations
- Helium LoRaWAN architecture: docs.helium.com/iot/lorawan-on-helium
- CKB RPC: github.com/nervosnetwork/ckb/tree/develop/rpc
- CKB molecule encoding: (from ckb-light-esp project work)
- Bitaxe architecture: github.com/bitaxeorg (reference for embedded crypto hardware)
