# Research: esp32p4-emulator-payment-synthesis

**Date:** 2026-03-05  
**Status:** SYNTHESIS  
**Seeds:** local findings + MEMORY.md

---

As a technical architect and project advisor, I've synthesized the provided research findings and project memory for the FiberQuest hackathon project.

### Executive Summary

FiberQuest is an ambitious hackathon project aiming to integrate retro gaming with Nervos Fiber micropayments, with a stretch goal of a self-contained ESP32-P4 device. The core CKB and Fiber infrastructure is largely functional, and initial game RAM addresses have been identified. While a self-contained ESP32-P4 device is technically feasible as a "signer-only" node, it presents significant resource management challenges. Critical gaps remain in programmatic access to RetroAchievements RAM maps, comprehensive Fiber RPC documentation, and the development of a dedicated Node.js Fiber client library, all of which are crucial for a successful MVP.

---

### (1) Is a self-contained FiberQuest device on ESP32-P4 (emulator + signer + WiFi payment) technically feasible? Give a concrete yes/no with reasoning.

**Yes, it is technically feasible, but with significant caveats and a focused scope.**

**Reasoning:**
1.  **Emulator Viability:** The ESP32-P4's dual-core 400MHz RISC-V CPU, 768KB SRAM, and PSRAM support make NES emulation viable, and SNES emulation potentially achievable, as confirmed by `esp32p4-snes-emulator-viability.md`. Its MIPI DSI interface is suitable for display output.
2.  **Signer Capabilities:** The ESP32-P4 can act as a cryptographic signer for CKB transactions using `secp256k1`, as indicated by `esp32-ckb-dob-signing-flow.md`. This aligns with the "Signer Only" architecture proposed in `esp32p4-fiber-signer-vs-lightclient.md`, where the ESP32-P4 signs transaction hashes but delegates CKB Layer 1 transaction construction and state verification to an external server (e.g., the Node.js sidecar running on the Pi5).
3.  **WiFi Connectivity:** The ESP32-P4 includes WiFi, enabling it to communicate with the external Fiber node and relay signed payment messages, as detailed in `fiberquest-esp32p4-capabilities.md`.
4.  **Challenges:** Running a full Fiber Network Node (FNN) or a CKB light client directly on the ESP32-P4 is likely too resource-intensive given its memory constraints (`esp32p4-fiber-signer-vs-lightclient.md`, `fiberquest-esp32s3-node.md`). The "Signer Only" approach necessitates a robust external relay service. Additionally, CPU headroom for concurrently running the emulator, WiFi stack, and signing operations will be tight and requires careful FreeRTOS task management (`esp32p4-snes-emulator-viability.md`).

---

### (2) Best architecture for a standalone device: which tasks run on which core, what's the memory budget, what gets cut if RAM is tight.

**Best Architecture for ESP32-P4 Standalone Device (Signer-Only Model):**

*   **Core 0 (High-Priority/Real-time):**
    *   **Tasks:** NES/SNES Emulator (Libretro core), Audio processing, Video output (MIPI DSI driver), Controller input polling (USB Host or GPIO).
    *   **Reasoning:** These tasks are time-critical for a smooth gaming experience and should minimize interruptions.
*   **Core 1 (Background/Network):**
    *   **Tasks:** WiFi stack management, UDP communication with RetroArch (for `READ_CORE_MEMORY` polling), Fiber transaction signing (secp256k1 operations), Communication with external Node.js sidecar/Fiber node (e.g., sending signed payment hashes).
    *   **Reasoning:** Network operations and cryptographic signing can tolerate slightly higher latency and can run in the background without directly impacting game frame rates.
*   **LP-Core (Optional, Low Power):**
    *   **Tasks:** Potentially for very low-frequency, non-critical system monitoring or specific event-driven triggers if the main cores are overloaded.
    *   **Reasoning:** Leveraging the LP-Core and Event-Task Service (ETM) could offload minimal tasks, but its utility for the core FiberQuest loop is limited.

**Memory Budget:**
*   The ESP32-P4 has 768KB on-chip SRAM and supports external PSRAM. For SNES emulation, PSRAM will be **mandatory**. The total memory budget will be 768KB SRAM + available external PSRAM. This is a tight budget for an emulator, FreeRTOS, WiFi, and crypto libraries.

**What gets cut if RAM is tight:**
1.  **SNES Emulation:** Prioritize NES emulation over SNES. NES cores are significantly lighter on RAM and CPU.
2.  **On-device UI/Display Elements:** Reduce or eliminate any custom UI elements beyond the game display itself. Rely on the external Node.js sidecar for any payment status dashboards or configuration.
3.  **CKBFS Integration:** Any on-device CKBFS content storage or retrieval would be cut. CKBFS is separate from Fiber and can be fully handled by the Node.js sidecar.
4.  **Complex Payment Logic:** Further offload payment trigger logic and channel management to the external Node.js sidecar, making the ESP32 purely an "event reporter" and "transaction signer."

---

### (3) If RetroAchievements rich presence / achievement data gives us pre-verified RAM maps, how does this change our development speed? Quantify: instead of manually finding RAM addresses for 5 games, we get community-verified maps for 1000s of games instantly.

If RetroAchievements (RA) rich presence or achievement data provided easily accessible, programmatic, and real-time pre-verified RAM maps, it would **drastically accelerate** our development speed.

**Quantification:**
*   **Current Manual Process:** As demonstrated by `fiberquest-game-catalog.md` (e.g., for Street Fighter II Turbo, Mortal Kombat), manually identifying RAM addresses for game events (like player health, score, KO state) is a time-consuming process. This involves using memory editors, playing the game, observing changes, and often requires deep game-specific knowledge. For 5 games, this phase could easily consume **several days to a week per game** for robust and reliable triggers.
*   **With Programmatic RA Access:** If we had an API that allowed us to query RA for achievement conditions (which directly map to memory addresses and logic, as noted in `retroachievements-live-api-payment-triggers.md`), we could potentially automate the generation of RAM maps for thousands of games. This would reduce the "RAM mapping" phase from **weeks of manual effort to hours or a day of integration and parsing script development**.

**Crucial Caveat:** The current research (`retroachievements-live-api-payment-triggers.md`, `retroachievements-ram-maps.md`, `fiberquest-sf2-ram-map.md`) indicates that the RetroAchievements public API **does not expose achievement conditions (RAM addresses) without authentication**, and Rich Presence updates are too infrequent (every two minutes) for live payment triggers. Therefore, while the *data exists* within the RA ecosystem, programmatic access for our real-time, unauthenticated use case is currently a significant blocker. We would still need to find a way to access and parse this data, or continue with manual mapping.

---

### (4) The boldest possible demo: a single ESP32-P4 device running NES/SNES, connected to a TV via HDMI/composite, two controllers plugged in, WiFi connected to Fiber, payments triggered by in-game events — is this achievable in the 2-week hackathon? What's the minimum hardware BOM?

**Achievability:** **Yes, this bold demo is achievable for a *very focused MVP* within the 2-week hackathon timeframe, but it will be extremely challenging and relies heavily on Phill's existing ESP32/firmware expertise.**

**Reasoning:**
*   **Feasibility:** The `esp32p4-emulator-payment-synthesis.md` finding confirms the technical feasibility of a self-contained ESP32-P4 device. NES emulation is well-established on ESP32 platforms, and SNES is plausible on the P4 (`esp32p4-snes-emulator-viability.md`).
*   **Fiber Integration:** The "Signer Only" model for the ESP32-P4 (`esp32p4-fiber-signer-vs-lightclient.md`) is critical. The ESP32-P4 would detect game events via RetroArch's UDP memory interface (`retroarch-memory-interface.md`), sign a payment hash, and send it over WiFi to an external Node.js sidecar (running on the Pi5 or N100) which would handle the full Fiber node RPC calls and CKB Layer 1 transaction construction.
*   **Challenges:**
    *   **SNES Controller Protocol:** The lack of precise SNES controller protocol details in the provided research (`snes-controller-protocol-deep-dive.md`, `snes-controller-protocol-raw.md`) is a significant blocker. Using USB controllers would be a much safer and faster alternative for the hackathon.
    *   **CPU Headroom:** Running a full emulator, handling display output, managing WiFi, and performing cryptographic signing concurrently on a single chip is a demanding task. Stability under load will be a concern.
    *   **Display Output:** The ESP32-P4 has MIPI DSI. If the chosen dev board doesn't have native HDMI/composite, an adapter will be required, adding complexity.
    *   **Scope Management:** The demo must be highly focused on one game (e.g., Street Fighter II Turbo, with its identified RAM addresses for health in `fiberquest-game-catalog.md`) and one simple payment trigger (e.g., per HP lost).

**Minimum Hardware Bill of Materials (BOM):**
1.  **ESP32-P4 Development Board:** An Espressif ESP32-P4 dev board with external PSRAM (e.g., ESP32-P4-DevKitC-1 or similar). This is the core compute unit.
2.  **Display:** A MIPI DSI display compatible with the dev board, OR an HDMI/Composite adapter if the board supports it and a standard TV is used.
3.  **Controllers:**
    *   **Recommended for Hackathon:** 2x USB Gamepads (to leverage ESP32-P4's USB Host capabilities, avoiding custom protocol implementation).
    *   **Stretch Goal:** 2x SNES controllers + necessary GPIO wiring and 3.3V/5V logic level shifters (if SNES protocol can be quickly implemented).
4.  **Power Supply:** High-quality 5V, 2A+ USB-C power supply for stable ESP32-P4 operation.
5.  **WiFi Access Point/Router:** For network connectivity to the external Fiber node.
6.  **External Fiber Node/Relay Host:** A Raspberry Pi 5 (192.168.68.82) or N100 (192.168.68.91) running the Node.js sidecar and a Fiber Network Node (FNN). This is a *required backend component* for the ESP32-P4's "signer-only" model, not part of the single device itself.

---

### Build Priority Matrix

| Action Item                                   | Impact | Effort | Priority |
| :-------------------------------------------- | :----- | :----- | :------- |
| **Develop Node.js Fiber Client Library**      | High   | High   | **High** |
| **Programmatic RA RAM Map Access Strategy**   | High   | Medium | **High** |
| **Implement SNES Controller Protocol on ESP32-P4** | High   | Medium | **High** |
| **CKB-CCC External Signing Flow (Node.js)**   | High   | Medium | **High** |
| **Finalize RetroArch UDP RAM Polling Integration** | High   | Low    | **High** |
| **Integrate Fiber RPC calls into Node.js Sidecar** | High   | Medium | **High** |
| **Implement Game Event Detection Logic (SF2)** | High   | Low    | **High** |
| **Set up ESP32-P4 as "Signer Only" Device**   | High   | Medium | **High** |
| **Configure ESP32-P4 for NES/SNES Emulation** | High   | Medium | **High** |
| **Fiber Testnet Reliability Assessment**      | Medium | Medium | **Medium** |
| **ESP32-P4 Emulator/Fiber CPU Headroom Benchmarking** | Medium | Medium | **Medium** |
| **Source ESP32-P4 Dev Board + Peripherals**   | Medium | Low    | **Medium** |
| **Fund N100 Fiber Node**                      | Medium | Low    | **Medium** |

---

### Critical Bridges

1.  **Node.js Sidecar ↔ Fiber Network Node:** The absence of an official Node.js Fiber client library (`fiber-node-js-client-library-search.md`) means a custom client must be built to interact with the Fiber RPC. This is a fundamental communication bridge.
2.  **ESP32-P4 (Signer) ↔ Node.js Sidecar (Relay/Fiber Node):** The ESP32-P4's "signer-only" architecture (`esp32p4-fiber-signer-vs-lightclient.md`) requires a robust, secure communication channel (e.g., WiFi + custom protocol) to send signed transaction hashes to the Node.js sidecar for broadcast.
3.  **RetroArch ↔ Node.js Sidecar (Game Event Detection):** The `READ_CORE_MEMORY` UDP protocol (`retroarch-memory-interface.md`) is the bridge for game state, but its performance and stability on the Pi5 need to be fully verified for continuous polling.
4.  **RetroAchievements Data ↔ FiberQuest Game Logic:** While RA contains valuable RAM map data, the current lack of programmatic, real-time access (`retroachievements-ram-maps.md`) means this bridge is currently broken for automated integration. Manual mapping or a new access strategy is required.
5.  **Physical SNES Controllers ↔ ESP32-P4:** The missing SNES controller protocol details (`snes-controller-protocol-deep-dive.md`) prevent the direct integration of physical controllers, necessitating a fallback to USB gamepads or dedicated research.
6.  **Node.js Sidecar ↔ JoyID/External Signer:** The `ckb-ccc` SDK is key for transaction building, but the precise flow for requesting external signatures from a Node.js backend to a browser-based wallet like JoyID (`sidecar-secure-key-management.md`) needs to be clarified.

---

### New Research Tasks

## [NEW_TASK] fiber-nodejs-client-library-development
**Priority:** HIGH
**Output:** findings/fiber-nodejs-client-library-development.md
**Goal:** Investigate the best approach to develop a robust Node.js/TypeScript client library for the Fiber Network RPC, given the absence of an official one. This is critical for the Node.js sidecar to interact with Fiber nodes.
**Seeds:**
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/channel.rs
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/payment.rs
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/invoice.rs
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/mod.rs
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/types.rs
- https://www.npmjs.com/search?q=json-rpc+client
**Questions to answer:**
1. What are the full JSON-RPC method signatures (method name, parameters, return types) for `open_channel`, `send_payment`, `new_invoice`, `list_channels`, and `get_invoice`?
2. What HTTP client (e.g., `axios`, `node-fetch`) and JSON-RPC library (if any) are best suited for building this client?
3. What authentication mechanisms (if any) are required for Fiber RPC calls?
4. Should the client library be generated from the Rust source (e.g., using `ts-rs` or similar) or manually written?
## [/NEW_TASK]

## [NEW_TASK] retroachievements-ram-map-access-strategy
**Priority:** HIGH
**Output:** findings/retroachievements-ram-map-access-strategy.md
**Goal:** Determine a viable strategy to programmatically access RetroAchievements' community-verified RAM maps and achievement conditions for a large number of games, bypassing current API authentication/rate limit issues for live triggers. This is crucial for scaling FiberQuest beyond manually mapped games.
**Seeds:**
- https://retroachievements.org/devoops.php
- https://api.retroachievements.org/API/API_GetGameInfoAndUserProgress.php
- https://docs.retroachievements.org/developer-docs/achievement-development-overview.html
- https://docs.retroachievements.org/developer-docs/condition-syntax.html
- https://raw.githubusercontent.com/RetroAchievements/rcheevos/master/README.md
**Questions to answer:**
1. Is there an unauthenticated or developer-level API endpoint that exposes achievement conditions (including RAM addresses and logic) for a given game ID?
2. Can we scrape or parse the achievement definition pages (if accessible) to extract RAM map data? What are the legal/ethical implications?
3. Are there any community-maintained databases or tools that aggregate RA RAM map data that we could leverage?
4. What is the exact format of achievement conditions (e.g., `0xH0000=0xV`) and how can it be parsed into a usable structure for event detection?
## [/NEW_TASK]

## [NEW_TASK] snes-controller-protocol-implementation-details
**Priority:** MEDIUM
**Output:** findings/snes-controller-protocol-implementation-details.md
**Goal:** Obtain precise technical specifications for the SNES controller serial protocol (timing, bit order, voltage levels, button mapping) to enable direct connection and reading of physical SNES controllers via ESP32-P4 GPIO. This is critical for the "boldest demo" if USB controllers are not used.
**Seeds:**
- https://www.raphnet.net/electronique/snes_usb/snes_usb_en.php (try to find an archived version or alternative)
- https://www.retroleum.com/snes-controller-pinout (try to find an archived version or alternative)
- https://www.cs.columbia.edu/~sedwards/classes/2013/4840/reports/SNES.pdf (try to find an archived version or alternative)
- https://raw.githubusercontent.com/MickGyver/DaemonBite-Retro-Controllers-USB/master/SNEStoUSB/SNEStoUSB.ino (if accessible)
- Search for "SNES controller protocol timing" on reputable electronics/retro gaming forums.
**Questions to answer:**
1. What are the precise timing requirements (in microseconds) for the Latch and Clock pulses?
2. What is the exact bit order for the 16 data bits sent by the controller (e.g., MSB first, which button corresponds to which bit)?
3. What are the signal voltage levels (e.g., 5V, 3.3V) and are logic level shifters required for ESP32-P4 (3.3V)?
4. What is the full button-to-bit mapping for a standard SNES controller?
## [/NEW_TASK]

## [NEW_TASK] ckb-ccc-external-signing-node-js-flow
**Priority:** MEDIUM
**Output:** findings/ckb-ccc-external-signing-node-js-flow.md
**Goal:** Clarify the exact data flow and API calls for a Node.js backend using `@ckb-ccc/core` to facilitate external signing of CKB transactions (specifically for Fiber channel open/close) by a browser-based wallet like JoyID. This is crucial for secure key management in the Node.js sidecar.
**Seeds:**
- https://github.com/ckb-ccc/ccc (re-attempt access)
- https://docs.joy.id/
- https://raw.githubusercontent.com/ckb-ccc/ccc/main/packages/core/src/signer/signer.ts (re-attempt access)
- https://raw.githubusercontent.com/ckb-ccc/ccc/main/packages/core/src/transaction/transaction.ts (re-attempt access)
**Questions to answer:**
1. What `ckb-ccc` methods are used by a Node.js backend to prepare a transaction for external signing?
2. What is the exact payload format sent to an external signer (e.g., JoyID) for signature?
3. How does the Node.js backend receive and integrate the signature back into the transaction for broadcasting?
4. Are there any specific `ckb-ccc` helpers or examples for this Node.js-to-browser signing flow?
## [/NEW_TASK]

## [NEW_TASK] fiber-testnet-reliability-assessment
**Priority:** MEDIUM
**Output:** findings/fiber-testnet-reliability-assessment.md
**Goal:** Conduct a practical assessment of Fiber testnet reliability, focusing on channel opening/closing success rates, payment routing stability, and common failure modes. This is critical for ensuring a smooth hackathon demo.
**Seeds:**
- Existing Fiber nodes on `ckbnode` and `N100` (local testing)
- `nervosnetwork/fiber` GitHub issues and discussions
- `fiber-channel-funding-ux.md` (revisit for any clues on common issues)
**Questions to answer:**
1. What is the observed success rate for `open_channel` and `send_payment` on the Fiber testnet over a sustained period (e.g., 1 hour of continuous operations)?
2. What are the most common error messages or failure modes encountered during channel operations or payments?
3. How quickly do channels settle on-chain when closed?
4. Are there any known issues with the current Fiber testnet (e.g., network instability, peer discovery problems)?
## [/NEW_TASK]

## [NEW_TASK] esp32-p4-emulator-fiber-cpu-headroom-benchmarking
**Priority:** LOW
**Output:** findings/esp32-p4-emulator-fiber-cpu-headroom-benchmarking.md
**Goal:** Benchmark the ESP32-P4's CPU and memory usage when running a NES/SNES emulator, WiFi stack, and `secp256k1` signing operations concurrently. This will validate the architectural assumptions and identify potential performance bottlenecks.
**Seeds:**
- ESP32-P4 development board (physical testing)
- ESP-IDF documentation on FreeRTOS task monitoring and profiling
- Existing NES/SNES emulator projects for ESP32 (e.g., `nofrendo-esp32`)
- `esp32p4-snes-emulator-viability.md`
- `esp32p4-fiber-signer-vs-lightclient.md`
**Questions to answer:**
1. What is the average CPU utilization of the emulator core(s) when running NES/SNES at target frame rates?
2. What is the CPU overhead of the WiFi stack during active network communication (e.g., UDP polling, sending signed messages)?
3. What is the execution time and CPU impact of a `secp256k1` signing operation on the ESP32-P4?
4. What is the remaining CPU headroom for other tasks, and are there any observed performance degradation or stuttering when all components run concurrently?
## [/NEW_TASK]