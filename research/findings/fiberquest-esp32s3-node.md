# Research: fiberquest-esp32s3-node

**Date:** 2026-03-05  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/toastmanAu/NerdMiner_CKB/main/README.md, https://raw.githubusercontent.com/toastmanAu/ckb-light-esp/main/README.md, https://raw.githubusercontent.com/espressif/esp-idf/master/examples/peripherals/usb/device/tusb_serial_device/README.md, https://raw.githubusercontent.com/espressif/arduino-esp32/master/libraries/BLE/README.md

---

## Research Note: fiberquest-esp32s3-node

**Date:** 2026-03-05

### Summary
This research investigates the feasibility of using an ESP32-S3 as a FiberQuest companion device. It concludes that running a full CKB light client or Fiber node on an ESP32-S3 is unlikely given its memory constraints and the lack of existing implementations in the provided content. A more realistic approach is to use the ESP32-S3 as a dedicated hardware wallet/signer, connecting to a gaming machine via USB Serial or BLE. Existing projects like NerdMiner_CKB demonstrate CKB-related cryptographic capabilities (Eaglesong hashing) and basic address management, forming a potential foundation for a signing device, though a full transaction signing implementation is not detailed.

### 1. Can the ESP32-S3 run a CKB light client or Fiber node? It has 512KB SRAM + up to 8MB PSRAM + 16MB flash — is that enough for a light client? Probably not for a full node. What's the minimum viable embedded CKB implementation?

Based on the provided content, there is no information to suggest that an ESP32-S3 can run a CKB light client or a Fiber node. The `NerdMiner_CKB` project is an "ESP32 solo lottery miner for Nervos Network (CKB)". It focuses on implementing the Eaglesong Proof-of-Work hash function and the CKB Stratum mining protocol (`mining.notify`, `mining.submit`) to submit nonces to a mining pool. It does not store blockchain state, verify transactions, or manage a full UTXO set, which are core functions of a light client or full node.

The provided content does not offer insights into the memory requirements for a CKB light client or Fiber node, nor does it describe a minimum viable embedded CKB implementation beyond the mining-specific functions. Therefore, based *solely* on the provided content, it is not possible to determine if the ESP32-S3's memory (512KB SRAM + up to 8MB PSRAM + 16MB flash) is sufficient for these roles.

### 2. Alternative: ESP32-S3 as a HARDWARE WALLET / SIGNER only — it holds the private key and signs Fiber channel transactions, but the actual node runs on the gaming machine or cloud. This is more realistic. What would this look like?

Using the ESP32-S3 as a hardware wallet/signer only is a more realistic approach. The `NerdMiner_CKB` project demonstrates the capability to handle CKB-related cryptographic operations and manage a CKB address. Specifically:
- It uses a CKB `ckb1...` address for pool configuration, implying the device can store and utilize a CKB private key associated with this address.
- It implements the Eaglesong hash function in C, which is fundamental to CKB's Proof-of-Work. While Eaglesong is used for mining in this context, the existence of a verified C implementation for a CKB-specific cryptographic primitive is a positive indicator for broader CKB crypto capabilities.

A hardware wallet/signer implementation would involve:
1.  **Secure Private Key Storage:** The ESP32-S3 would securely generate and store a CKB private key (e.g., in NVS or encrypted flash).
2.  **Transaction Data Reception:** The device would receive unsigned Fiber channel transaction data from the gaming machine or cloud node via a communication interface (e.g., USB Serial or BLE).
3.  **Transaction Signing:** Using the stored private key and a CKB signing library (which would need to be implemented or adapted, as the provided content doesn't detail a full CKB transaction signing library), the ESP32-S3 would sign the received transaction data.
4.  **Signed Transaction Transmission:** The signed transaction would then be sent back to the gaming machine/cloud node for broadcast to the CKB network.
5.  **User Confirmation (Optional but Recommended):** For enhanced security, a small display or LED could be used to prompt the user for confirmation before signing, especially for critical transactions.

### 3. USB HID / USB Serial approach: ESP32-S3 connected via USB to a gaming machine — acts as a hardware wallet dongle. User plugs it in, it identifies as a USB serial device, FiberQuest sidecar communicates with it to sign transactions.

The provided `TinyUSB Serial Device Example` for ESP-IDF explicitly supports setting up an ESP32-S3 as a USB Serial Device. This directly enables the proposed USB Serial approach.

**Key points from the example:**
-   **Supported Targets:** ESP32-S3 is explicitly listed as a supported target.
-   **Functionality:** The example shows how to configure the ESP32 chip to work as a USB Serial Device, using the TinyUSB component.
-   **Configuration:** It can be configured for single or double serial devices via `idf.py menuconfig` under `Component config → TinyUSB Stack → Communication Device Class (CDC) → CDC Channel Count`.
-   **Identification:** Upon connection, it identifies with `idVendor: 0x303a` and `idProduct: 0x4001` (default values shown in example output).
-   **Communication:** The example demonstrates echoing data received on the serial port, confirming bidirectional communication.

This confirms that an ESP32-S3 can readily function as a USB serial device, allowing a FiberQuest sidecar application on a gaming machine to communicate with it to request and receive signed transactions. The content does not specifically mention USB HID, but USB Serial (CDC) is a well-established and suitable protocol for this purpose.

### 4. BLE approach: ESP32-S3 with BLE — acts as a wireless hardware wallet. FiberQuest sidecar on gaming machine connects via BLE to request signatures.

The `BLE for ESP32 Arduino Core` documentation provides comprehensive support for implementing BLE on the ESP32, including the ESP32-S3 (as it's part of the Arduino Core for ESP32). This makes the BLE approach highly feasible.

**Key aspects supporting this:**
-   **BLE Library:** The `BLE` library for ESP32 Arduino Core offers extensive functionality for BLE pairing and security.
-   **Security Implementation:** It covers `BLESecurity` class methods, `ESP_IO_CAP_*` constants for defining IO capabilities, and various pairing types (Legacy Pairing, Secure Connections) and security levels (Just Works, Passkey Entry, Numeric Comparison) to protect against MITM attacks and ensure secure key exchange.
-   **Bonding:** The library supports bonding, which allows storing encryption keys for persistent pairing and future reconnections, crucial for a hardware wallet.
-   **Communication Scenarios:** The documentation outlines common scenarios, including "Mobile App ↔ ESP32 Sensor Node" or "ESP32 Smart Lock ↔ Mobile App," which are analogous to a gaming machine (client) connecting to an ESP32 (server/signer). For a hardware wallet, `ESP_IO_CAP_IO` (Display Yes/No) or `ESP_IO_CAP_KBDISP` (Keyboard Display) would be ideal for user confirmation of signing requests, enabling Numeric Comparison or Passkey Entry for strong MITM protection.

The ESP32-S3 can act as a BLE peripheral, advertising its service, and a FiberQuest sidecar on the gaming machine can act as a BLE central, connecting to it to exchange data (unsigned transaction requests and signed transaction responses).

### 5. What existing CKB/crypto signing implementations exist for ESP32? Can we use the existing ESP32 CKB key management from the NerdMiner CKB project or ckb-light-esp?

**NerdMiner_CKB Project:**
-   **Eaglesong Implementation:** The `NerdMiner_CKB` project provides a verified C implementation of the Eaglesong hash function, which is a core cryptographic primitive for CKB's Proof-of-Work. This demonstrates the ability to perform CKB-specific hashing on the ESP32.
-   **Key Management (Limited):** It uses a CKB `ckb1...` address for pool configuration, implying basic key management for this address (likely generation and storage). However, the project's scope is limited to mining, and it *does not* provide a general CKB transaction signing implementation or a comprehensive cryptographic library for CKB on ESP32. It focuses on generating and submitting nonces, not constructing and signing full CKB transactions.

**ckb-light-esp Project:**
-   The content for `ckb-light-esp` resulted in a `[FETCH ERROR: HTTP Error 404: Not Found]`. Therefore, no information about its CKB/crypto signing implementations or key management can be extracted from the provided sources.

**Conclusion:** While `NerdMiner_CKB` provides a C implementation of Eaglesong and implies basic CKB address management, it does not offer a full CKB transaction signing implementation for ESP32. A dedicated library for CKB transaction serialization, hashing for signing, and signature generation (e.g., using secp256k1) would likely need to be developed or adapted for the ESP32.

### 6. Physical form factor ideas: small PCB that clips onto a controller, or fits in a cartridge slot, or acts as a "FiberQuest cartridge". Rate feasibility for hackathon timeline.

The provided source content does not contain any information regarding physical form factors or the feasibility of such designs within a hackathon timeline. This question cannot be answered based on the given documents.

### Gaps / Follow-up
1.  **CKB Light Client/Node Memory Requirements:** The provided content does not specify the memory footprint required for a CKB light client or Fiber node. Further research into CKB client implementations (e.g., Rust, C++) and their memory usage would be needed to assess ESP32-S3's viability.
2.  **CKB Transaction Signing Library for ESP32:** While `NerdMiner_CKB` handles Eaglesong and CKB addresses, it lacks a full implementation for CKB transaction serialization, hashing for signing, and signature generation (e.g., secp256k1). This would be a significant development effort for a hardware wallet.
3.  **`ckb-light-esp` Content:** The `ckb-light-esp` project's content was unavailable. Accessing this content could provide crucial insights into existing CKB client or signing implementations for ESP32.
4.  **Hardware Wallet Security Best Practices:** The content confirms communication channels (USB, BLE) and basic BLE security, but a full hardware wallet implementation would require adherence to specific security best practices for key generation, storage, and isolation on the ESP32.
5.  **Physical Form Factor & Hackathon Feasibility:** This aspect was not covered by the provided content and requires external design and project management considerations.

### Relevant Code/API Snippets

**USB Serial Device (from `espressif/esp-idf/examples/peripherals/usb/device/tusb_serial_device/README.md`):**
```bash
# Build and Flash command
idf.py -p PORT flash monitor

# Menuconfig option for CDC Channel Count
idf.py menuconfig # then navigate to Component config → TinyUSB Stack → Communication Device Class (CDC) → CDC Channel Count

# Example output showing device identification
I (285) tusb_desc: ┌─────────────────────────────────┐
│ USB Device Descriptor Summary │
├───────────────────┬─────────────┤
│idVendor │ 0x303a │
├───────────────────┼─────────────┤
│idProduct │ 0x4001 │
└───────────────────┴─────────────┘
```

**BLE Security (from `espressif/arduino-esp32/master/libraries/BLE/README.md`):**
```cpp
#include <BLESecurity.h> // Assuming BLESecurity class is part of the BLE library

// Example of choosing IO capabilities for BLE security
pSecurity->setCapability(ESP_IO_CAP_NONE);    // Just Works only
pSecurity->setCapability(ESP_IO_CAP_IO);      // Just Works or Numeric Comparison
pSecurity->setCapability(ESP_IO_CAP_KBDISP);  // All pairing methods
```

**NerdMiner_CKB Eaglesong Self-Test (from `toastmanAu/NerdMiner_CKB/main/README.md`):**
```
// Verified Eaglesong hash outputs
eaglesong("") → 9e4452fc7aed93d7240b7b55263792befd1be09252b456401122ba71a56f62a0
eaglesong("1111...\\n") (35 bytes) → a50a3310f78cbaeadcffe2d46262119eeeda9d6568b4df1b636399742c867aca
```