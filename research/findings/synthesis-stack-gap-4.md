# Stack Gap Analysis — Synthesis IV

## Summary
Fourth synthesis pass across all completed research. Identifies remaining gaps in the Wyltek embedded CKB stack and queues new research tasks.

## Key Gaps Identified

### 1. CKB Chess — Relayer Architecture
Full Fiber payment flow for chess moves needs a relayer pattern to handle invoice generation, payment routing, and game state sync. Research needed on how to implement without centralised server.

### 2. ESP32-P4 Emulator + Payment Integration
SNES emulator viability confirmed, payment triggers via RetroAchievements confirmed — gap is the end-to-end integration: emulator pause → payment UI → resume flow on ESP32-P4 specifically.

### 3. OTA Security
WiFi OTA partition safety researched. Gap: secure boot + flash encryption for production WyVault deployments.

### 4. WyLora Protocol Design
USB NCM dongle pattern established. Gap: LoRa packet format for CKB-specific data (light client headers, transaction broadcast, node discovery).

### 5. Biometric Auth
SPHINCS+ + secp256k1 hybrid confirmed viable. Gap: tamper-proof biometric unlock (fingerprint sensor integration on WyVault for PIN/biometric gate before key access).

## New Tasks Queued
- `ckb-chess-fiber-relayer-design`
- `esp32p4-emulator-payment-integration`
- `wylora-ckb-packet-protocol`
- `tamperproof-biometric-auth`
- `wyrelay-usb-hid-keyboard-esp32`
