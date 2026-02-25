# CKB LoRa Client — T-Impulse + C6 Gateway

## Hardware

| Device | Role |
|---|---|
| LilyGO T-Impulse | End device / query client (STM32 + SX1276) |
| ESP32-C6 + SX1276 | Gateway (WiFi backhaul + LoRa listener) |

## Critical: SX1276 Version Fix

The S76G in the T-Impulse reports SX1276 version `0x13`, not `0x12`.
Most Arduino LoRa libraries reject this. **Must fix before flashing.**

In `Arduino/libraries/LoRa/src/LoRa.cpp`, find:
```cpp
uint8_t version = readRegister(REG_VERSION);
if (version != 0x12) { return 0; }
```
Change to:
```cpp
uint8_t version = readRegister(REG_VERSION);
if (version != 0x12 && version != 0x13) { return 0; }
```

## T-Impulse Setup (PlatformIO)

```ini
# platformio.ini
[env:t_impulse]
platform = ststm32
board = nucleo_l073rz
framework = arduino
lib_deps = sandeepmistry/LoRa @ ^0.8.0
upload_protocol = dfu
```

Hold BOOT button → plug USB → release → `pio run -t upload`

## ESP32-C6 Gateway Setup

Arduino-ESP32 v3.x (supports C6):
```
Board: ESP32C6 Dev Module
Upload Speed: 921600
```

Or PlatformIO:
```ini
[env:c6_gateway]
platform = espressif32
board = esp32-c6-devkitc-1
framework = arduino
lib_deps = sandeepmistry/LoRa @ ^0.8.0
```

## SX1276 Wiring — ESP32-C6

| SX1276 | C6 GPIO |
|---|---|
| SCK | 6 |
| MOSI | 7 |
| MISO | 2 |
| CS/NSS | 10 |
| DIO0 | 3 |
| RST | 4 |
| 3.3V | 3.3V |
| GND | GND |

## Protocol

```
Magic: 0xCB  (CKB identifier — also used as LoRa sync word)
Freq:  915MHz AU / 868MHz EU
SF:    7  (fastest, ~5km range)
BW:    125kHz
```

Packet: `[magic][version][type][seq][len x4][payload][crc32 x4]`

| Type | Direction | Description |
|---|---|---|
| 0x01 | → Gateway | GET_BLOCK_HEIGHT |
| 0x02 | → Gateway | GET_CHAIN_TIP |
| 0x03 | → Gateway | VERIFY_TX (32B hash) |
| 0x81 | ← Gateway | height[8] + tip_hash[32] |
| 0x82 | ← Gateway | tip_hash[32] + total_diff[32] |
| 0x83 | ← Gateway | confirmed[1] + block[8] |
| 0xE0 | ← Gateway | ERROR + code |

## Next Steps

1. Flash T-Impulse with `t_impulse_ckb_query.ino`
2. Flash C6 with `c6_gateway.ino`  
3. Verify communication over serial monitor
4. Replace mock CKB data in gateway with real `ckb-light-esp` data
5. Add secp256k1 packet signing (device private key → CKB-compatible)
6. Implement CKBFS TypeID trigger (11-byte SF12 Bitcoin relay packet)
