# WyLora — USB LoRa Dongle Concept

## Summary
A USB dongle that adds LoRa gateway functionality to any node machine. Plug into a CKB node's USB port → instant LoRa bridge. No Helium hardware, no cloud dependency.

## Architecture
```
SMA antenna
    ↓
SX1262 LoRa radio (915/868 MHz)
    ↓
ESP32-S3 (USB NCM + LoRa driver + bridge logic)
    ↓
USB-A plug → host machine (CKB node, Pi, anything)
```

## How It Works
1. Plug dongle into USB port
2. Host sees USB ethernet adapter (CDC-NCM) — no driver install needed on Linux/Mac/Win10+
3. Dongle gets assigned 192.168.7.1 from its own DHCP server
4. Bridge software on host calls `http://192.168.7.1/lora/send` and polls `/lora/recv`
5. LoRa packets forwarded to/from CKB network

## API (on dongle)
- `POST /lora/send` — transmit LoRa packet
- `GET /lora/recv` — poll received packets
- `GET /health` — dongle status, RSSI, SNR
- `POST /config` — set frequency, SF, BW, CR

## Form Factor
- ESP32-S3 mini module
- SX1262 LoRa transceiver
- SMA edge connector for external antenna
- USB-A plug (or USB-C with adapter)
- Single PCB, ~40×20mm
- Flash via USB (UF2 bootloader)

## Foundation
Built on WyTerminal v3 USB NCM code (`usb_ncm.cpp/h`). The same USB-as-ethernet-adapter pattern, with LoRa radio API instead of shell relay.

## Why Better Than SenseCAP Hack
- No proprietary hardware to acquire
- No Helium OS to strip
- Works with any machine, any OS
- Sellable product — node operators just buy the dongle
- Firmware updatable via USB

## Status
CONCEPT — ready to prototype once ESP32-S3 + SX1262 breakout is sourced.

## Related
- WyTerminal USB NCM: `usb-ncm-composite-esp32s3`
- SenseCAP repurpose: `sensecap-m1-repurpose-ckb-lora`
