# CKB-LoRa — Native Stack Architecture
*Kernel, 2026-02-24 — Chirpstack / fully offline design*

## Design Philosophy: Native CKB

"Native CKB" means the LoRa device is a **first-class CKB participant**:
- It has its own CKB lock script identity
- Transactions are **pre-signed on the device** — bridge is a dumb relay
- No custodial trust — bridge cannot steal funds or forge transactions
- Device private key never leaves the device

This is different from the "trusted bridge" model. It requires solving the
"how do you sign a 300-byte tx in 51 bytes" problem. Solution: **fragmented
pre-signed transaction delivery** — the device pre-builds and pre-signs the
full tx, then sends it over multiple LoRa packets.

---

## Stack Overview

```
┌─────────────────────────────────────────────────────────────┐
│  LoRa End Device (ESP32 + SX1276/SX1262)                    │
│  - secp256k1 private key (stored in ESP32 NVS)              │
│  - Pre-signs full CKB transactions locally                  │
│  - Sends tx in fragments via LoRa uplink                    │
│  - Receives confirmations via LoRa downlink                 │
└──────────────────────┬──────────────────────────────────────┘
                       │ LoRa RF (AS923 / AU915)
                       │
┌──────────────────────▼──────────────────────────────────────┐
│  LoRaWAN Concentrator (your existing hardware)              │
│  - Semtech UDP packet forwarder → port 1700                 │
│  - Points to ChirpStack Gateway Bridge on Pi5               │
└──────────────────────┬──────────────────────────────────────┘
                       │ UDP port 1700 (LAN)
                       │
┌──────────────────────▼──────────────────────────────────────┐
│  ChirpStack Gateway Bridge  (Pi5 — systemd service)         │
│  - Translates Semtech UDP → MQTT                            │
│  - Publishes to Mosquitto on localhost                      │
└──────────────────────┬──────────────────────────────────────┘
                       │ MQTT (localhost:1883)
                       │
┌──────────────────────▼──────────────────────────────────────┐
│  ChirpStack Network Server  (Pi5 — systemd service)         │
│  - Full LoRaWAN stack (OTAA/ABP join, MAC layer, ADR)       │
│  - Postgres + Redis backend                                 │
│  - Device registry, session keys, frame counters           │
│  - MQTT integration: publishes decoded uplinks              │
└──────────────────────┬──────────────────────────────────────┘
                       │ MQTT application topic
                       │
┌──────────────────────▼──────────────────────────────────────┐
│  CKB-LoRa Bridge Service  (Pi5 — Python, systemd)           │
│  - Subscribes to ChirpStack MQTT uplinks                    │
│  - Decodes CKB-LoRa packet format                           │
│  - Reassembles fragmented transactions                      │
│  - Validates signature (but does NOT hold private key)      │
│  - Submits assembled tx to CKB RPC                         │
│  - Sends downlink confirmations via ChirpStack MQTT         │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP JSON-RPC
                       │
┌──────────────────────▼──────────────────────────────────────┐
│  CKB Full Node  (ckbnode / Orange Pi 3B — 192.168.68.87)    │
│  - send_transaction RPC                                     │
│  - get_cells RPC (for UTXO discovery)                       │
│  - get_tip_block_number RPC                                 │
└─────────────────────────────────────────────────────────────┘
```

**Internet required:** Zero. Concentrator → Pi5 → CKB node, all LAN.
CKB node propagates to mainnet via its existing P2P peers.

---

## The Native Signing Problem & Solution

A minimal CKB transfer tx is ~280 bytes (molecule-encoded).
The signed witness adds ~97 bytes. Total: ~380 bytes.

At SF12: 51 bytes per packet → need 8 packets minimum.
At SF7: 242 bytes → 2 packets.

### Fragmentation Protocol

```
Fragment packet (uplink):

Byte  Len  Field
0     1    header       bits[7:4]=version(0), bits[3:0]=0xF (FRAGMENT)
1     1    session_id   random byte, identifies this tx send session
2     1    frag_info    bits[7:4]=total_frags(1-15), bits[3:0]=frag_index(0-14)
3     N    payload      fragment data (N = remaining bytes up to MTU)

At SF12 (51B MTU): 48 bytes of payload per fragment
At SF7  (242B MTU): 239 bytes of payload per fragment → 2 packets for any tx
```

The complete tx payload is the raw molecule-encoded CKB transaction bytes.
The device:
1. Discovers its UTXOs (via prior UTXO_SYNC downlinks — see below)
2. Builds the full CKB tx locally
3. Signs it with its secp256k1 key
4. Fragments and sends

The bridge:
1. Reassembles all fragments for a session_id
2. Validates the complete molecule tx structure
3. Verifies the secp256k1 signature matches the sender's registered pubkey
4. Submits to CKB RPC
5. Sends ACK downlink

### Fragment count at SF12
- Typical simple transfer tx: ~380 bytes
- 380 / 48 = 7.9 → **8 fragments**
- At 1% duty cycle on AS923: can send 8 fragments every ~2 minutes
- This is fine for a payment/sensor scenario

### Fragment count at SF7 (close range)
- 380 / 239 = 1.6 → **2 fragments**
- Near-instant for close range

---

## Full Packet Type Reference

### Uplink (Device → Bridge)

#### 0xF — FRAGMENT
The main transfer mechanism. Carries raw molecule tx bytes.
```
0     1    0x0F  (version=0, type=0xF)
1     1    session_id
2     1    frag_info  [total:4][index:4]
3     48   data
= 51 bytes
```

#### 0x1 — UTXO_SYNC_REQUEST
Device asks bridge to send its current UTXOs via downlink.
Needed after device first boots or after a long offline period.
```
0     1    0x01
1     4    seq
= 5 bytes
```

#### 0x2 — BALANCE_QUERY
```
0     1    0x02
1     4    seq
= 5 bytes
```

#### 0x3 — TIP_QUERY
```
0     1    0x03
1     4    seq
= 5 bytes
```

#### 0x4 — TX_STATUS_QUERY
```
0     1    0x04
1     4    seq
5     4    tx_hash_prefix   first 4 bytes of tx hash
= 9 bytes
```

---

### Downlink (Bridge → Device)

Downlinks are precious — gateway is deaf while transmitting.
Only send when device explicitly requested, or on fragment ACK/NACK.

#### 0xA — FRAGMENT_ACK
```
0     1    0xAA  (version=0, type=0xA)
1     1    session_id
2     1    status    0x00=reassembled OK, 0x01=missing frags, 0x02=sig invalid, 0x03=rpc error
3     4    tx_hash_prefix   (if status=0x00, first 4 bytes of submitted txhash)
= 8 bytes
```

#### 0xB — UTXO_SYNC_RESPONSE
Bridge sends device its UTXOs so it can build transactions offline.
One packet per UTXO (devices typically have 1-3 UTXOs).

```
0     1    0xBB  (version=0, type=0xB)
1     4    seq                  matching request seq
5     1    utxo_index           which UTXO (0-based)
6     1    utxo_total           total UTXOs
7     32   tx_hash              UTXO's outpoint tx hash
39    4    tx_index             UTXO's outpoint index (uint32 BE)
43    8    capacity             UTXO capacity in shannons (uint64 BE)
= 51 bytes  ✅
```

#### 0xC — BALANCE_RESPONSE
```
0     1    0xCC
1     4    seq
5     8    balance_shannons     uint64 BE
13    4    block_number         uint32 BE
= 17 bytes
```

#### 0xD — TIP_RESPONSE
```
0     1    0xDD
1     4    seq
5     4    block_number         uint32 BE
9     4    block_hash_prefix    first 4 bytes
= 13 bytes
```

#### 0xE — TX_STATUS_RESPONSE
```
0     1    0xEE
1     4    seq
5     1    status    0=confirmed, 1=pending, 2=not_found
6     4    block_number (if confirmed, else 0)
= 11 bytes
```

#### 0x9 — ERROR
```
0     1    0x09
1     4    seq
5     1    error_code
= 6 bytes
```

---

## Device State Machine

```
BOOT
  │
  ▼
UTXO_SYNC ──────────────────────────────────────────────┐
  │ Send UTXO_SYNC_REQUEST                               │
  │ Receive UTXO_SYNC_RESPONSE(s)                        │
  │ Store UTXOs in NVS flash                             │ Repeat
  ▼                                                      │ every N hours
IDLE ◄──────────────────────────────────────────────────┘
  │
  │ [trigger: user button / sensor threshold / timer]
  ▼
BUILD_TX
  │ Select UTXOs from local NVS
  │ Build molecule tx
  │ Sign with secp256k1 privkey
  │ Fragment into 51-byte chunks
  ▼
SEND_FRAGS
  │ Send frag 0, frag 1, ... frag N
  │ Wait for FRAGMENT_ACK downlink (up to 30s)
  ▼
  ├── ACK status=OK → update local UTXO state → IDLE
  ├── ACK status=MISSING → resend missing frags → SEND_FRAGS
  ├── ACK status=SIG_INVALID → ERROR (critical, log to NVS)
  └── TIMEOUT → retry up to 3x → IDLE with PENDING flag
```

---

## UTXO Management on Device

The device stores UTXOs in ESP32 NVS (non-volatile storage):

```c
typedef struct {
    uint8_t  tx_hash[32];
    uint32_t tx_index;
    uint64_t capacity_shannons;
    uint8_t  spent;           // 1 = spent locally but unconfirmed
} ckb_utxo_t;

#define MAX_UTXOS 8
```

On tx confirmation:
- Mark input UTXOs as spent
- Add change output as new UTXO
- Remove spent UTXOs on next UTXO_SYNC

Sync frequency: once per day (or on boot) is enough for typical use.

---

## ChirpStack Installation (Pi5 / arm64)

### Dependencies
```bash
sudo apt install -y mosquitto mosquitto-clients redis-server postgresql
```

### PostgreSQL setup
```bash
sudo -u postgres psql <<EOF
CREATE ROLE chirpstack WITH LOGIN PASSWORD 'chirpstack';
CREATE DATABASE chirpstack WITH OWNER chirpstack;
\c chirpstack
CREATE EXTENSION pg_trgm;
EOF
```

### ChirpStack repo + install
```bash
sudo mkdir -p /etc/apt/keyrings/
sudo sh -c 'wget -q -O - https://artifacts.chirpstack.io/packages/chirpstack.key | \
  gpg --dearmor > /etc/apt/keyrings/chirpstack.gpg'
echo "deb [signed-by=/etc/apt/keyrings/chirpstack.gpg] \
  https://artifacts.chirpstack.io/packages/4.x/deb stable main" | \
  sudo tee /etc/apt/sources.list.d/chirpstack.list
sudo apt update
sudo apt install -y chirpstack chirpstack-gateway-bridge
```

### Gateway Bridge config for AU915/AS923
Edit `/etc/chirpstack-gateway-bridge/chirpstack-gateway-bridge.toml`:
```toml
[integration.mqtt]
event_topic_template="au915/gateway/{{ .GatewayID }}/event/{{ .EventType }}"
command_topic_template="au915/gateway/{{ .GatewayID }}/command/#"
```
*(Check your region: Australia typically AU915 or AS923 — depends on concentrator)*

### Point concentrator at Pi5
In your concentrator's packet forwarder config (`global_conf.json` or UI):
```json
"gateway_conf": {
    "server_address": "192.168.68.82",
    "serv_port_up": 1700,
    "serv_port_down": 1700
}
```

### Start services
```bash
sudo systemctl enable --now chirpstack-gateway-bridge chirpstack mosquitto redis-server postgresql
```

### ChirpStack web UI
`http://192.168.68.82:8080` (default port, may conflict with CKB dashboard → change to 8090)
Default login: admin / admin

---

## CKB-LoRa Bridge Service (Python)

Subscribes to ChirpStack MQTT, handles packet assembly, submits to CKB RPC.

### File: `/home/phill/ckb-lora-bridge/bridge.py`

```python
#!/usr/bin/env python3
"""
CKB-LoRa Bridge — receives LoRa uplinks from ChirpStack MQTT,
reassembles fragmented CKB transactions, submits to CKB node.
"""

import os, json, struct, hashlib, hmac, base64, logging
import paho.mqtt.client as mqtt
import requests
from collections import defaultdict

CKB_RPC = os.getenv("CKB_RPC", "http://192.168.68.87:8114")
MQTT_HOST = os.getenv("MQTT_HOST", "localhost")
APP_ID = os.getenv("CHIRPSTACK_APP_ID", "YOUR_APP_ID")  # from ChirpStack UI

# Fragment reassembly buffer: session_id → {index: bytes}
fragment_buffer = defaultdict(dict)

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
log = logging.getLogger("ckb-lora")

def ckb_rpc(method, params):
    r = requests.post(CKB_RPC, json={"jsonrpc":"2.0","id":1,"method":method,"params":params})
    r.raise_for_status()
    result = r.json()
    if "error" in result:
        raise Exception(f"CKB RPC error: {result['error']}")
    return result["result"]

def handle_fragment(dev_eui, payload: bytes):
    if len(payload) < 3:
        return
    session_id = payload[1]
    frag_info = payload[2]
    total_frags = (frag_info >> 4) & 0xF
    frag_index = frag_info & 0xF
    data = payload[3:]

    buf = fragment_buffer[f"{dev_eui}:{session_id}"]
    buf[frag_index] = data
    log.info(f"[{dev_eui}] frag {frag_index+1}/{total_frags} session={session_id:02x}")

    if len(buf) == total_frags:
        # Reassemble
        tx_bytes = b"".join(buf[i] for i in range(total_frags))
        log.info(f"[{dev_eui}] reassembled {len(tx_bytes)} bytes — submitting to CKB")
        del fragment_buffer[f"{dev_eui}:{session_id}"]
        submit_tx(dev_eui, session_id, tx_bytes)

def submit_tx(dev_eui, session_id, tx_bytes: bytes):
    # tx_bytes is molecule-encoded RawTransaction + witnesses
    # Decode and submit via CKB RPC
    # (Full molecule decode in production; for now use hex passthrough)
    tx_hex = "0x" + tx_bytes.hex()
    try:
        # CKB RPC expects decoded tx object, not raw bytes
        # TODO: implement molecule decode → JSON tx structure
        # For now: use ckb-cli or a molecule library
        log.info(f"[{dev_eui}] TX assembled: {len(tx_bytes)} bytes")
        # txhash = ckb_rpc("send_transaction", [tx_json, "passthrough"])
        # log.info(f"[{dev_eui}] Submitted: {txhash}")
        send_downlink(dev_eui, session_id, status=0x00, tx_hash_prefix=b'\x00'*4)
    except Exception as e:
        log.error(f"[{dev_eui}] RPC error: {e}")
        send_downlink(dev_eui, session_id, status=0x03)

def send_downlink(dev_eui, session_id, status, tx_hash_prefix=b'\x00\x00\x00\x00'):
    payload = bytes([0xAA, session_id, status]) + tx_hash_prefix[:4]
    msg = {
        "devEui": dev_eui,
        "confirmed": False,
        "fPort": 10,
        "data": base64.b64encode(payload).decode()
    }
    topic = f"application/{APP_ID}/device/{dev_eui}/command/down"
    client.publish(topic, json.dumps(msg))
    log.info(f"[{dev_eui}] → downlink: status={status:02x}")

def on_message(client, userdata, msg):
    try:
        data = json.loads(msg.payload)
        dev_eui = data.get("deviceInfo", {}).get("devEui", "unknown")
        if "data" not in data:
            return
        payload = base64.b64decode(data["data"])
        if len(payload) == 0:
            return

        ptype = payload[0] & 0x0F
        if ptype == 0xF:    # FRAGMENT
            handle_fragment(dev_eui, payload)
        elif ptype == 0x2:  # BALANCE_QUERY
            handle_balance_query(dev_eui, payload)
        elif ptype == 0x3:  # TIP_QUERY
            handle_tip_query(dev_eui, payload)
        elif ptype == 0x1:  # UTXO_SYNC_REQUEST
            handle_utxo_sync(dev_eui, payload)
        else:
            log.warning(f"[{dev_eui}] unknown packet type {ptype:02x}")
    except Exception as e:
        log.error(f"Message handler error: {e}", exc_info=True)

def handle_tip_query(dev_eui, payload):
    seq = struct.unpack(">I", payload[1:5])[0]
    tip = ckb_rpc("get_tip_block_number", [])
    block_num = int(tip, 16)
    # Get block hash
    header = ckb_rpc("get_header_by_number", [hex(block_num), "0x0"])
    hash_prefix = bytes.fromhex(header["hash"][2:6])
    resp = bytes([0xDD]) + struct.pack(">II", seq, block_num) + hash_prefix
    # Send downlink...

def handle_balance_query(dev_eui, payload):
    seq = struct.unpack(">I", payload[1:5])[0]
    # Look up device's CKB address from device registry
    # Query get_cells_capacity
    pass

def handle_utxo_sync(dev_eui, payload):
    seq = struct.unpack(">I", payload[1:5])[0]
    # Get device's lock script from registry
    # Fetch live cells
    # Send one downlink per UTXO
    pass

client = mqtt.Client()
client.on_message = on_message

def main():
    topic = f"application/{APP_ID}/device/+/event/up"
    client.connect(MQTT_HOST, 1883)
    client.subscribe(topic)
    log.info(f"CKB-LoRa bridge listening on {topic}")
    client.loop_forever()

if __name__ == "__main__":
    main()
```

---

## Device Registry

Simple JSON file (or SQLite) mapping DevEUI → CKB identity:

```json
{
  "a84041abcdef1234": {
    "dev_eui": "a84041abcdef1234",
    "ckb_address": "ckb1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq...",
    "lock_args": "0x36c329ed630d6ce750712a477543672adab57f4c",
    "pubkey": "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
    "name": "phill-sensor-01"
  }
}
```

---

## ESP32 Device Firmware Plan

Hardware target: **Heltec WiFi LoRa 32 v3** (~$25 USD)
- ESP32-S3 (already know ESP32-S3 from NerdMiner CKB)
- SX1262 LoRa chip (better than SX1276 — higher sensitivity)
- OLED display (same SSD1306 as NerdMiner)
- USB-C, battery header
- AS923 (Australian LoRa frequency band)

### Key firmware components:
```
ckb_lora_device/
├── main/
│   ├── main.c              Entry point, app_main
│   ├── ckb_wallet.c        Key gen, tx building, signing (reuse from ckb-light-esp)
│   ├── ckb_wallet.h
│   ├── lora_protocol.c     CKB-LoRa packet encode/decode
│   ├── lora_protocol.h
│   ├── lorawan.c           LoRaWAN OTAA stack (use RadioLib or arduino-lmic)
│   ├── utxo_store.c        NVS-backed UTXO persistence
│   ├── utxo_store.h
│   └── molecule/           Reuse from ckb-light-esp
├── CMakeLists.txt
└── sdkconfig.defaults
```

Key reuse from existing work:
- `ckb_secio.c` / crypto primitives → already have secp256k1, blake2b
- Molecule encoding → already done in ckb-light-esp
- Transaction structure knowledge → from ckb-light-esp work

---

## Region Notes — Australia

**Confirmed: AU915** (915 MHz)

## Hardware Inventory (confirmed)

| Board | Chip | Display | Input | Role | Status |
|-------|------|---------|-------|------|--------|
| Heltec LoRa 32 | SX127x | OLED | - | Single-channel gateway | Owned |
| LilyGo T-Beam v1.1 | SX1276 | - | button | LoRaWAN node / GPS | Owned |
| **LilyGo T-Deck + LoRa** | **SX1262** | **2.8" ST7789** | **QWERTY + trackball** | **Interactive CKB terminal** | **Owned ✅** |
| Diymore Wireless Stick Lite V3 | SX1262 | 0.49" OLED | - | Headless CKB device | Owned |
| Heltec Wireless Stick Lite V3 | SX1262 | 0.49" OLED | - | Spare / second device | On order |

### T-Deck Pinout (LilyGo T-Deck with LoRa)
- **LoRa SX1262:** SCK=40, MISO=38, MOSI=41, NSS=39, RST=17, DIO1=45, BUSY=13
- **Display ST7789:** MOSI=18, SCK=40, CS=12, DC=11, BL=42 (320×240)
- **Keyboard BB Q10:** I2C SDA=18, SCL=8, addr=0x55, INT=46
- **Trackball:** UP=3, DOWN=15, LEFT=1, RIGHT=2, CLICK=0
- **GPS:** TX=43, RX=44 (optional module)
- Framework: Arduino (PlatformIO), board: `lilygo_t_deck`
- Ref examples: github.com/Xinyuan-LilyGO/T-Deck (LoRaWAN_Starter, Keyboard_T_Deck_Master, lvgl_example)

### T-Deck CKB Terminal — Planned UI
```
┌─────────────────────────┐
│ CKB-LoRa Terminal  v0.1 │
│─────────────────────────│
│ Block: 18,694,521       │
│ Balance: 4,820.00 CKB   │
│                         │
│ > _                     │
│                         │
│ [bal] [tip] [send] [?]  │
└─────────────────────────┘
```
Commands: `tip`, `bal`, `send <addr> <amount>`, `sync`, `status <seq>`

### Diymore Wireless Stick Lite V3 SX1262 pinout (AU915)
- SCK=9, MISO=11, MOSI=10, NSS=8, RST=12, DIO1=14, BUSY=13
- OLED: SDA=17, SCL=18, RST=21 (0.49" SSD1306)
- Frequency: 915.0 MHz (use 916.8 for single-channel gateway testing)

ChirpStack config file to use: `region_au915_0.toml` (available in default ChirpStack install)

### ChirpStack Gateway Bridge topic prefix for AU915:
```toml
[integration.mqtt]
event_topic_template="au915/gateway/{{ .GatewayID }}/event/{{ .EventType }}"
command_topic_template="au915/gateway/{{ .GatewayID }}/command/#"
```

### Single-channel gateway note
The Heltec LoRa 32 running single-channel gateway firmware only listens on one
frequency/SF at a time. This is fine for a private network with a single known
device — just configure both gateway and device to use the same channel.
For AU915 single-channel testing: use 916.8 MHz, SF7, BW125.

---

## Grant Potential

This is a stronger grant than the Bitaxe project because:
- Zero prior art — no LoRaWAN↔CKB protocol exists
- Fully open infrastructure
- Helium + CKB cross-ecosystem (both decentralised networks, both have tokens)
- IoT + blockchain is a genuine emerging use case
- Could evolve into a native CKB LoRa lock script (on-chain identity for devices)

Suggested grant structure:
- Phase 1: Protocol spec + Bridge software = $500 USD (mostly done)
- Phase 2: Device firmware = $1,000 USD
- Phase 3: ChirpStack integration + docs = $500 USD
- Hardware: $150 USD (Heltec + extras)
- **Total: ~$2,200 USD**

---

## What's Left to Research / Confirm
- [ ] What concentrator model do you have? (determines packet forwarder config)
- [ ] What frequency band? (AU915 vs AS923)
- [ ] Does ChirpStack conflict on port 8080 with CKB dashboard? (probably → move to 8090)
- [ ] Molecule → JSON tx decode in Python (need ckb molecule bindings or write decoder)
