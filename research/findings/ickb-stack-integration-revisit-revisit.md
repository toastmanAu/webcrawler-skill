# Research: ickb-stack-integration-revisit-revisit

**Date:** 2026-03-08  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** 

---

## Research Note: ickb-stack-integration-revisit-revisit

**Date:** 2026-03-08

### Summary
Wyltek Industries has established a robust integration of Nervos CKB technologies across embedded ESP32 hardware and web/server-side applications. This includes a full CKB light client on ESP32-P4, Eaglesong mining, on-chain file storage (CKBFS V3), Spore NFT minting, and a payment channel network (Fiber). Key integration points leverage custom C/ESP-IDF frameworks, Node.js proxies, React/Vite frontends, and specific CKB SDKs. A primary focus is the ambitious FiberQuest project, aiming to integrate in-game events with Fiber micropayments on ESP32-P4, highlighting the ongoing challenge of concurrent execution and the need for custom Fiber client development.

### 1. Core Technical Details of this Topic

The core technical details of CKB stack integration for Wyltek Industries revolve around bridging the Nervos CKB Layer 1 blockchain with diverse hardware and software environments, particularly ESP32 embedded systems and web applications.

*   **Embedded CKB Light Client:** The `ckb-light-esp` project implements the full CKB light client protocol stack on ESP32 hardware (ESP32-P4, -S3, -C3, -C6, -H2). This stack includes TCP, SecIO, Yamux, Identify, LightClient, GetLastState, and SendLastState, enabling the ESP32 to sync and track CKB headers efficiently.
*   **Embedded Mining:** The `NerdMiner CKB` project demonstrates Eaglesong solo mining on ESP32, utilizing the Stratum protocol.
*   **On-chain File Storage (CKBFS V3):** CKBFS V3 is used for storing arbitrary files chunked across CKB cells. Integration is handled browser-side by `@wyltek/ckbfs-browser`, which manages chunking, cell building, and type script construction for image uploads in the DOB minter.
*   **Spore NFT Minting:** The `ckb-dob-minter` application enables the creation and management of DOB (Spore NFT) clusters and individual NFTs. It integrates with `@ckb-ccc/connector-react` and `@ckb-ccc/spore` for wallet interaction (JoyID) and Spore protocol operations.
*   **Fiber Payment Channel Network:** Fiber is integrated for off-chain payment routing. Channels are opened/closed via CKB L1 transactions, with payments handled off-chain via FNN binary RPC methods. Wyltek runs two Fiber nodes.
*   **FiberQuest Integration:** This project aims to link RetroArch emulator events (e.g., health damage, score) to Fiber micropayments. The architecture involves UDP RAM polling from the emulator, a Node.js sidecar for processing, and subsequent Fiber transactions. A stretch goal is to run the emulator, light client, and signer concurrently on an ESP32-P4.
*   **Infrastructure:** Integration is supported by a local infrastructure including a Pi5 (running `ckb-stratum-proxy`, `ckb-node-dashboard`, `ckb-whale-bot`), NucBox K8 Plus, N100 (CKB/testnet light clients, Fiber node), ckbnode (mainnet full node + Fiber node), and an EliteDesk build box.
*   **Embedded Framework:** `wyltek-embedded-builder` provides a C framework for ESP32 embedded CKB/blockchain applications, including sensor drivers and board targets.

### 2. Specific APIs, Protocols, or Interfaces Available

Based on the provided content, the following specific APIs, protocols, and interfaces are available and utilized:

*   **CKB Light Client Protocol:** Implemented in `ckb-light-esp` (TCP → SecIO → Yamux → Identify → LightClient → GetLastState → SendLastState).
*   **Stratum Protocol:** Used by `NerdMiner CKB` for mining and handled by `ckb-stratum-proxy` for pool communication.
*   **Fiber Network (FNN) Binary RPC:** Methods include `open_channel`, `send_payment`, `list_channels`, `new_invoice`, `get_invoice`, etc., for managing payment channels.
*   **CKBFS V3:** Identified by `code_hash: 0xb5d13ffe0547c78021c01fe24dce2e959a1ed8edbca3cb93dd2e9f57fb56d695` and `type_id: 0xcc5411e8b70e551d7a3dd806256533cff6bc12118b48dd7b2d5d2292c3651add`. Interacted with via `@wyltek/ckbfs-browser` SDK.
*   **Spore Protocol:** The underlying standard for DOB NFTs, integrated via `@ckb-ccc/spore`.
*   **CKB Layer 1 Cell Model:** Interacted with via `capacity`, `lock script`, `optional type`, and `data` fields.
*   **JoyID Wallet:** Primary wallet for CKB transactions, integrated via `@ckb-ccc/connector-react`.
*   **CKB-CCC SDK (`@ckb-ccc/core`):** Primary JS SDK for CKB transaction building.
*   **UDP Protocol:** Used in FiberQuest for RAM polling (`READ_CORE_MEMORY`, port 55355) from RetroArch.
*   **BLE Mesh:** `bitchat_mesh.h/cpp` in `ckb-light-esp` uses NimBLE-Arduino for ESP32, confirming GATT notify flow and NimBLE server/client patterns.
*   **CKB Node RPC:** Polled by `ckb-node-dashboard` (e.g., `192.168.68.87:8114`).
*   **Telegram Bot API:** Used by `NerdMiner CKB` (FastBot for OTA) and `ckb-whale-bot` for notifications.

### 3. Known Limitations or Failure Modes

The provided content explicitly mentions several limitations and potential failure modes:

*   **Fiber Node.js Client Library Gap:** A "key gap" is that "no official Node.js Fiber client library exists — must build from Rust RPC source." This implies a significant development effort and potential for integration challenges for Node.js-based projects interacting with Fiber.
*   **ESP32-P4 Concurrent Performance:** The "ESP32-P4 stretch goal: runs emulator + light client + signer concurrently" highlights a potential limitation regarding CPU headroom. While the light client is confirmed to run efficiently, the combined load of an emulator, light client, and secp256k1 signing on the dual-core 400MHz RISC-V processor is an open question and a potential failure point if performance targets are not met.
*   **Fiber Data Storage Limitation:** Fiber "CANNOT store arbitrary data or files — only routes payments (CKB, UDTs)." This is a fundamental design limitation, meaning Fiber cannot be used for general-purpose data storage.
*   **Fiber Node Funding:** The N100 Fiber node "needs funding," indicating a operational dependency and potential failure point if not maintained.
*   **Abandoned Fiber Archive:** `nervosnetwork/fiber-archive` is explicitly stated as "OLD ABANDONED (2021) — NOT a storage protocol," which could be a source of confusion or misdirection if not properly noted.

### 4. Working Examples or Reference Implementations

Wyltek Industries has numerous working examples and reference implementations for CKB stack integration:

*   **CKB Light Client on ESP32:** `ckb-light-esp` (github.com/toastmanAu/ckb-light-esp)
*   **ESP32 Eaglesong Miner:** `NerdMiner CKB` (github.com/toastmanAu/NerdMiner_CKB)
*   **Node.js Stratum Proxy:** `ckb-stratum-proxy` (github.com/toastmanAu/ckb-stratum-proxy)
*   **DOB (Spore NFT) Minter:** `ckb-dob-minter` (github.com/toastmanAu/ckb-dob-minter), deployed at wyltekindustries.com/mint/
*   **Browser-side CKBFS V3 SDK:** `@wyltek/ckbfs-browser` (github.com/toastmanAu/ckbfs-browser)
*   **ESP32 Embedded CKB Framework:** `wyltek-embedded-builder` (private, github.com/toastmanAu/wyltek-embedded-builder)
*   **CKB Node Monitoring Dashboard:** `ckb-node-dashboard` (github.com/toastmanAu/ckb-node-dashboard), live at Pi5 port 8080
*   **CKB Whale Transaction Telegram Bot:** `ckb-whale-bot` (github.com/toastmanAu/ckb-whale_bot)
*   **Wyltek Industries Website:** (github.com/toastmanAu/wyltek-industries), live at wyltekindustries.com, featuring DOB minter, CKBFS viewer, and JoyID member system.
*   **BitChat Mesh (WIP):** `bitchat_mesh.h/cpp` within `ckb-light-esp` demonstrates BLE mesh relay engine and packet codec for ESP32.

### Gaps / Follow-up

*   **Node.js Fiber Client Development:** The explicit "key gap" regarding the lack of an official Node.js Fiber client library requires a dedicated effort to build one from the Rust RPC source. Further research into existing Rust Fiber RPC interfaces and potential FFI/binding strategies for Node.js would be beneficial.
*   **ESP32-P4 Concurrent Performance Benchmarking:** While the light client performance is known, the "stretch goal" of running RetroArch emulator, light client, and signer concurrently needs rigorous benchmarking on the ESP32-P4 to confirm feasibility and identify any bottlenecks. This would involve profiling CPU usage, memory, and task scheduling under full load.
*   **FiberQuest UDP RAM Polling Details:** More specific details on the `READ_CORE_MEMORY` command and the exact data format expected over UDP port 55355 from RetroArch would be needed for the Node.js sidecar development.
*   **Fiber Node Funding Strategy:** A clear strategy for ensuring the N100 Fiber node remains funded is needed to prevent service interruptions.

### Relevant Code/API Snippets

*   **CKB Light Client Protocol Stack (Conceptual):**
    ```
    TCP → SecIO → Yamux → Identify → LightClient → GetLastState → SendLastState
    ```
    (Implemented in `ckb-light-esp`)

*   **CKBFS V3 Identifiers:**
    *   `code_hash`: `0xb5d13ffe0547c78021c01fe24dce2e959a1ed8edbca3cb93dd2e9f57fb56d695`
    *   `type_id`: `0xcc5411e8b70e551d7a3dd806256533cff6bc12118b48dd7b2d5d2292c3651add`
    (Used by `@wyltek/ckbfs-browser`)

*   **Fiber Network (FNN) Binary RPC Methods (Examples):**
    *   `open_channel`
    *   `send_payment`
    *   `list_channels`
    *   `new_invoice`
    *   `get_invoice`

*   **FiberQuest UDP RAM Polling:**
    *   `READ_CORE_MEMORY` command
    *   `port 55355`

*   **CKB-CCC SDKs:**
    *   `@ckb-ccc/core`
    *   `@ckb-ccc/connector-react`
    *   `@ckb-ccc/spore`