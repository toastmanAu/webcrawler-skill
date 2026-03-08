# SenseCAP M1 Repurpose — CKB LoRa Bridge

## Summary
Decommissioned SenseCAP M1 Helium gateways contain an MT7628 SoC + SX1302 LoRa concentrator. Goal: strip Helium OS, run Raspberry Pi OS or OpenWrt, turn them into CKB LoRa bridges.

## Hardware
- MT7628 MIPS SoC (580MHz, 128MB RAM, 32MB Flash)
- SX1302 LoRa concentrator (8-channel)
- Ethernet + WiFi
- USB port

## Approach
1. Swap SD card with Raspberry Pi OS Lite 64-bit (Samsung 128GB Pro Plus)
2. Boot into fresh RPi OS
3. Install sx1302_hal (Semtech's open LoRa packet forwarder)
4. Run CKB light client alongside
5. Bridge LoRa packets to CKB network

## Progress
- Samsung 128GB flashed with RPi OS Lite 64-bit ✅
- Boots as Raspberry Pi at 192.168.68.85 ✅
- SSH access setup (key-based) ✅
- sx1302_hal install + bridge script: **deferred**

## Current Blocker
SSH access was initially refused on .85. Physical access needed to confirm boot and enable SSH properly.

## Alternative
**WyLora USB dongle** may supersede this approach — cleaner, works with any machine, no hardware hacking required. SenseCAP repurpose still viable as a secondary path for operators who already have the hardware.

## Key Finding
MT7628 is MIPS — not ARM. Check architecture compatibility before installing arm64 binaries. Use MIPS builds of sx1302_hal or cross-compile.
