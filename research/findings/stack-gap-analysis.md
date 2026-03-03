# Stack Gap Analysis

**Date:** 2026-03-03  
**Status:** SYNTHESIS  
**Sources:** All research findings + MEMORY.md

---

## Stack Gap Analysis

### Executive Summary
Phill's blockchain/embedded systems stack demonstrates significant strengths, particularly his deep involvement in the Nervos ecosystem, hands-on hardware expertise with ESP32 and Raspberry Pi, and proactive approach to local LLM inference and cost optimization. The core infrastructure for CKB nodes, embedded miners, and initial agent deployments is largely in place. However, critical gaps exist in power stability for local LLMs, specific technical details for several embedded integration projects (SPHINCS+ on ESP32-P4, car OBD2), and comprehensive LLM pricing/rate limit data for optimal cost routing. Addressing these will enhance reliability, unblock key projects, and refine operational efficiency.

### 1. Immediately Actionable Next Steps
These are findings with clear next build actions not yet started:

1.  **OPi5+ Ollama PSU Upgrade:** The `qwen2.5:7b` model causes power-related crashes on the Orange Pi 5+. A better 5A+ PSU is immediately needed to enable stable operation of larger local LLMs, which is crucial for reducing cloud costs and improving agent capabilities.
2.  **Agent Collective (Wyltek) HF Token Provision:** The deployment of the first agent, Wyltek, on the N100 is blocked by the lack of a HuggingFace token from Phill. This token is required to complete the setup and enable Wyltek to access free HF models.
3.  **OPi3B Agent Host OpenClaw Console Setup:** The new Orange Pi 3B agent board has OpenClaw installed and a gateway token, but requires physical terminal interaction to complete the console setup. This is a prerequisite for it to function as a fully operational agent host.
4.  **Binance Bot Grid Strategy Development:** Phill's Binance bot currently uses an RSI/EMA strategy which is sitting out the current ranging market. The next step is to build a grid strategy to capitalize on these market conditions, allowing the bot to become active and generate returns.
5.  **NerdMiner CKB Final Testing & Deployment:** The core implementation of the ESP32 Eaglesong miner is complete. The next step is to flash it to the target ESP32-2432S028R (CYD) and conduct thorough testing to ensure stable operation and mining.
6.  **CKB Whale Alert Bot `config.json` Management:** The `config.json` file, which contains sensitive information like the Telegram bot token, is gitignored. Phill needs to ensure a robust local management strategy for this file to maintain security and allow for easy deployment/reconfiguration.
7.  **OPi3B CKB Node DSI Display Reboot Test:** The DSI display overlay and reprobe service are configured on the Orange Pi 3B CKB node. A critical next step is to test the display output after a full system reboot to confirm persistence and reliability.
8.  **Binance Bot API Key Configuration:** Once the grid strategy is developed and tested in paper mode, Phill will need to obtain and configure Binance API keys to enable the bot to operate with real funds (after setting `BOT_MODE=live`).
9.  **N100 `orangepi-build` Verification:** The `orangepi-build` repository is cloned on the N100, which is an x86 host. Phill needs to verify that the build environment is correctly set up and functional for generating Orange Pi images.

### 2. Critical Missing Bridges
These are specific missing connections between components that prevent full functionality or integration:

1.  **ESP32 to CKB DOB Minting Flow:** While the `ckb-dob-minter` project and a schema for hardware provenance DOBs exist, the precise technical flow for an ESP32 device to securely sign a payload and initiate the minting of a DOB on the CKB chain is not detailed. This is a fundamental bridge for establishing on-chain hardware provenance.
2.  **CKB Chess Relayer Fiber RPC Integration:** The `ckb-chess` project relies on Fiber payment channels for state transport and balance adjustments. However, the specific Fiber RPCs required for the Node.js relayer to interact with the Fiber node (e.g., for opening channels, embedding game state in payments, and managing settlement) are not clearly defined due to previous research limitations. This is a critical functional gap for the relayer.
3.  **ESP32-P4 SPHINCS+ Feasibility & Implementation:** There is a complete lack of information regarding the feasibility, performance, and API exposure for SPHINCS+ post-quantum signing on the ESP32-P4, largely due to inaccessible research sources. This is a major blocker for any plans to integrate post-quantum cryptography into embedded devices.
4.  **Renault Clio RS 172 OBD2/K-Line Protocol Details:** The `obd2-canbus-esp32` project lacks specific information on the Renault Clio RS 172's OBD2 port (K-Line vs. CAN), ECU type, and the exact protocol (e.g., Renault Link v1.99 KKL) needed for ESP32 integration. Without these details, reading and writing to the vehicle's ECU remains speculative.

### 3. Projects Closest to Shippable Milestone
Ranked by proximity to completion, with blocking factors:

1.  **NerdMiner CKB:**
    *   **Status:** Core implementation DONE.
    *   **Blocking:** Requires flashing to target ESP32-2432S028R and final testing.
2.  **CKB Node Dashboard:**
    *   **Status:** Live, Node.js proxy + HTML polling dashboard.
    *   **Blocking:** None apparent; appears stable and functional.
3.  **CKB Whale Alert Bot:**
    *   **Status:** Running, monitors local CKB node, sends Telegram alerts.
    *   **Blocking:** Robust management of `config.json` (gitignored) and ensuring reliable CoinGecko price feed.
4.  **Fan Controller:**
    *   **Status:** Systemd service, GPIO-controlled software PWM.
    *   **Blocking:** None apparent; appears stable and functional.
5.  **Agent Collective (Wyltek on N100):**
    *   **Status:** Free-agent kit deployed, OpenClaw installed, N100 ready.
    *   **Blocking:** Phill providing the HuggingFace token for agent deployment.
6.  **OPi3B CKB Node / Agent Host:**
    *   **Status:** CKB node running, DSI display mostly configured, OpenClaw installed.
    *   **Blocking:** Testing DSI display persistence on reboot, completing OpenClaw console setup, and configuring as a full agent host.
7.  **Binance Bot:**
    *   **Status:** Python venv, dependencies installed, paper trading mode, RSI/EMA strategy implemented.
    *   **Blocking:** Development of a grid trading strategy for current market conditions, and later, configuration of Binance API keys for live trading.

### 4. Findings That Change Existing Priorities
These research findings should reshuffle the work queue:

*   **OPi5+ Power Stability (from `MEMORY.md` & `ollama-status`):** The repeated brownouts when attempting to run `qwen2.5:7b` on the OPi5+ highlight a critical hardware limitation. **Priority Shift:** Acquiring a more robust PSU for the OPi5+ should be elevated to a high priority. This directly impacts the reliability of the local LLM fallback chain and the ability to reduce reliance on costly cloud APIs.
*   **Complete Research Blockage (from `esp32-p4-sphincs-plus.md`, `obd2-canbus-esp32.md`, `ckb-chess-relayer.md`, `ckb-snapshot-infra.md`, `handheld-gaming-ckb-integration.md`):** Multiple critical research topics resulted in 404 errors or lacked specific information. **Priority Shift:** Re-running these research tasks with updated and verified seeds is essential. Without this foundational knowledge, several key projects (post-quantum embedded security, car integration, CKB chess, CKB snapshot hosting, gaming handheld integration) are effectively stalled at the design phase.
*   **LLM Cost Optimization Gaps (from `llm-cost-optimisation.md`):** While LiteLLM is a good tool, the absence of concrete pricing, rate limits, and free tier details for various LLM models prevents truly informed and optimized routing decisions. **Priority Shift:** Completing the LLM cost optimization research to gather specific pricing and usage limits is crucial to fully leverage LiteLLM and minimize ongoing API expenses.

### 5. Build Priority Matrix

| Priority | Project/Task | Impact | Effort | Blocking? |
| :------- | :---------------------------------- | :----- | :----- | :-------- |
| 1        | OPi5+ Ollama PSU Upgrade            | High   | Medium | Yes       |
| 2        | Agent Collective (Wyltek) HF Token  | High   | Low    | Yes       |
| 3        | OPi3B Agent Host OpenClaw Console Setup | High   | Medium | Yes       |
| 4        | Binance Bot Grid Strategy Dev       | Medium | High   | No        |
| 5        | NerdMiner CKB Final Testing/Deploy  | Medium | Medium | No        |
| 6        | CKB Whale Alert Bot `config.json` Management | Medium | Low    | No        |
| 7        | OPi3B CKB Node DSI Reboot Test      | Medium | Low    | No        |
| 8        | Binance Bot API Key Configuration   | Medium | Low    | Yes       |
| 9        | N100 `orangepi-build` Verification  | Low    | Medium | No        |
| 10       | ESP32 to CKB DOB Minting Flow Design | High   | High   | Yes       |

### 6. New Research Tasks Needed

## [NEW_TASK] esp32-p4-sphincs-plus-revisit
**Priority:** HIGH
**Output:** findings/esp32-p4-sphincs-plus-revisit.md
**Goal:** Re-evaluate the feasibility of SPHINCS+ post-quantum signing on ESP32-P4, addressing previous 404 errors and gathering specific technical details.
**Seeds:**
- https://docs.espressif.com/projects/esp-idf/en/latest/esp32p4/api-reference/peripherals/sha.html
- https://github.com/espressif/esp-idf/blob/master/components/esp_hw_support/include/esp_sha.h
- https://www.espressif.com/sites/default/files/documentation/esp32-p4_datasheet_en.pdf
- https://github.com/pq-crystals/sphincsplus
- https://github.com/RustCrypto/signatures/tree/master/sphincsplus
- https://github.com/RustCrypto/hashes
- https://eprint.iacr.org/2023/1231.pdf
**Questions to answer:**
1. Does ESP-IDF expose SHA-256/512 hardware acceleration via a simple API on ESP32-P4?
2. Which SPHINCS+ parameter set (e.g., sphincs-sha2-128s, 256s) is practical on an ESP32-P4 microcontroller, considering memory and performance?
3. Is there a Rust SPHINCS+ crate with a configurable hash backend that can leverage ESP32-P4 hardware acceleration?
4. What's the expected sign time on ESP32-P4 for a practical SPHINCS+ parameter set, both in pure software and with hardware acceleration (extrapolate from similar MCU benchmarks if direct data is unavailable)?
5. Are there any prior art implementations or benchmarks of SPHINCS+ on ESP32 or similar Xtensa/RISC-V MCUs?

## [NEW_TASK] ckb-snapshot-infra-revisit
**Priority:** MEDIUM
**Output:** findings/ckb-snapshot-infra-revisit.md
**Goal:** Determine best practices for CKB snapshot hosting on Cloudflare R2, addressing previous 404 errors and missing community context.
**Seeds:**
- https://docs.nervos.org/docs/basics/guides/run-ckb-node
- https://github.com/nervosnetwork/ckb/tree/develop/docs
- https://forum.nervos.org/
- https://developers.cloudflare.com/r2/examples/rclone/
- https://developers.cloudflare.com/r2/api/s3/presigned-urls/
- https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-compression.html
- https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-versioning.html
**Questions to answer:**
1. What compression format does the CKB community expect or commonly use for node snapshots (e.g., zstd, lz4, gz, tar.zst)?
2. How do other major blockchain projects (e.g., Bitcoin, Substrate, Ethereum) typically handle snapshot versioning and provide a "latest" pointer for easy access?
3. Is there an existing CKB community snapshot already hosted somewhere, and what are its characteristics (size, update frequency, format)?
4. What's the optimal `Cache-Control` header strategy for R2-hosted CKB snapshots, balancing freshness and download performance?

## [NEW_TASK] obd2-clio-rs172-esp32-revisit
**Priority:** HIGH
**Output:** findings/obd2-clio-rs172-esp32-revisit.md
**Goal:** Gather specific technical details for integrating an ESP32 with the Renault Clio RS 172's OBD2/K-Line, addressing previous 404 errors and missing information.
**Seeds:**
- https://www.renaultforums.co.uk/
- https://www.cliosport.net/
- https://www.outilsobdfacile.com/liste-vehicules-compatibles-obd2/renault-clio-ii.php
- https://github.com/P1kachu/talking-with-cars
- https://github.com/merecarvill/OBD2-KLine-Reader
- https://www.nxp.com/docs/en/data-sheet/L9637D.pdf
- https://github.com/collin80/esp32_can
**Questions to answer:**
1. Does the Renault Clio RS 172 (Clio II Sport) use K-Line or CAN bus on its OBD2 port? What is the primary ECU type (e.g., Bosch ME7.4.6)? What diagnostic protocol does Renault Clip typically use for this vehicle?
2. Can the Renault Link v1.99 KKL protocol (or equivalent diagnostic protocol for Clio RS 172) be replicated on an ESP32 using an L9637D K-Line transceiver? What are the specific communication parameters (baud rate, data bits, parity, stop bits, initialization sequence)?
3. What specific data (live PIDs, fault codes, immobiliser status, VIN, mileage) can typically be READ from a Clio RS 172 via K-Line or CAN?
4. What specific parameters or functions (e.g., key programming, idle speed adjustment, ignition timing, throttle adaptation reset, service interval reset) can typically be WRITTEN to a Clio RS 172 ECU via K-Line or CAN, and what are the associated risks?

## [NEW_TASK] ckb-chess-fiber-rpcs-revisit
**Priority:** MEDIUM
**Output:** findings/ckb-chess-fiber-rpcs-revisit.md
**Goal:** Identify the specific Fiber RPCs required for the ckb-chess relayer, addressing previous 404 errors and clarifying the payment/state transport flow.
**Seeds:**
- https://github.com/nervosnetwork/fiber/tree/main/docs
- https://github.com/nervosnetwork/fiber/tree/main/crates/fiber-lib/src/rpc
- https://github.com/nervosnetwork/fiber/tree/main/tests/bruno/fiber
- https://github.com/toastmanAu/ckb-chess/blob/main/README.md
**Questions to answer:**
1. What are the specific Fiber RPCs (e.g., `open_channel`, `send_payment`, `new_invoice`, `get_invoice`, `list_channels`, `close_channel`) required for the ckb-chess relayer to manage game state and balance adjustments?
2. How can game state hashes be reliably embedded within Fiber payment messages or other channel update mechanisms?
3. What is the precise sequence of Fiber RPC calls for a full ckb-chess game lifecycle, from channel opening to final settlement, including handling moves and timeouts?

## [NEW_TASK] handheld-gaming-rk3566-deep-dive
**Priority:** MEDIUM
**Output:** findings/handheld-gaming-rk3566-deep-dive.md
**Goal:** Determine the best handheld gaming OS for RK3566 devices to run CKB/Fiber nodes and custom Linux apps, and gather specifics on target devices.
**Seeds:**
- https://github.com/ArkOS/ArkOS
- https://github.com/JELOS/JELOS
- https://wiki.batocera.org/hardware_compatibility
- https://wiki.batocera.org/system_architecture
- https://www.anbernic.com/
- https://www.retroidpocket.com/
- https://forum.xda-developers.com/
**Questions to answer:**
1. For RK3566-based handhelds, which gaming Linux distributions (e.g., ArkOS, JELOS, Batocera.linux) definitively support running arbitrary Linux applications, custom scripts, and `systemd` services alongside the emulator frontend?
2. What is the default operating system (Android or Linux distro) for the Anbernic RG-ARC-D, and what is its root/ADB accessibility situation?
3. For the Retroid Pocket 4 Pro, what is its default Android version, does it support ADB over WiFi, and can full APKs (including custom launchers) be sideloaded without root?

## [NEW_TASK] hispo-s8-android-deep-dive
**Priority:** LOW
**Output:** findings/hispo-s8-android-deep-dive.md
**Goal:** Gather specific details on Hispo S8/MTK/Qualcomm Android head units to assess integration feasibility for CKB light clients and background services.
**Seeds:**
- https://forum.xda-developers.com/f/android-head-units.4325/
- https://forum.xda-developers.com/f/mtk-android-development.2878/
- https://developer.android.com/guide/components/services
- https://developer.android.com/guide/components/activities/background-limits
- https://termux.dev/
**Questions to answer:**
1. What is the typical Android version range for Hispo S8 and similar MTK/Qualcomm car head units, and is root access generally available or easily achievable?
2. Is ADB accessible by default on these head units, and what are the common methods for enabling it (e.g., developer options, specific codes)?
3. What are the specific limitations for running persistent background services (like a CKB light client or Fiber node) on these head units, especially concerning Android's process killing mechanisms on newer versions?

## [NEW_TASK] llm-cost-optimisation-pricing-update
**Priority:** HIGH
**Output:** findings/llm-cost-optimisation-pricing-update.md
**Goal:** Obtain current pricing, rate limits, and free tier details for key LLM models to inform LiteLLM routing and cost optimization.
**Seeds:**
- https://www.anthropic.com/api
- https://cloud.google.com/vertex-ai/pricing#generative_ai_models
- https://openai.com/pricing
- https://openrouter.ai/docs#pricing
- https://huggingface.co/docs/api-inference/pricing
- https://huggingface.co/docs/api-inference/detailed_parameters#rate-limits
- https://litellm.ai/docs/routing
**Questions to answer:**
1. What are the current prices per million input/output tokens for: Claude Sonnet 4.5, Claude Haiku 3.5, Gemini 2.5 Flash, Gemini 2.5 Pro, GPT-4o mini, Llama 3.3 70B (via HF Inference API), DeepSeek V3 (via HF Inference API or OpenRouter)?
2. What are the actual rate limits, typical queue times, and reliability expectations for sustained use of the HuggingFace free inference tier?
3. What are the specific RPM/TPD limits for the Gemini 2.5 Flash free tier, and how do they compare to paid tiers?
4. Does OpenRouter offer a meaningful cost difference compared to direct API access for Claude and Gemini models, considering their aggregation and potential bulk discounts?
5. Can LiteLLM be configured to automatically route requests to the *cheapest capable model* based on real-time pricing and model capabilities, and what is the setup complexity for this?

## [NEW_TASK] esp32-ckb-dob-signing-flow
**Priority:** MEDIUM
**Output:** findings/esp32-ckb-dob-signing-flow.md
**Goal:** Detail the technical flow for an ESP32 device to sign a payload for minting a hardware provenance DOB on CKB.
**Seeds:**
- https://github.com/toastmanAu/ckb-dob-minter/blob/main/README.md
- https://github.com/nervosnetwork/ckb-sdk-js
- https://github.com/nervosnetwork/ckb-sdk-rust
- https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/system/esp_system.html#_CPPv418esp_efuse_read_mac6uint8_tP
- https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/system/mbedtls.html
- https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/system/esp_random.html
**Questions to answer:**
1. What is the recommended cryptographic primitive (e.g., secp256k1, Ed25519) for an ESP32 to sign a CKB transaction payload, considering CKB-VM compatibility and ESP32 hardware capabilities?
2. What are the steps for an ESP32 to generate a private key, sign a JSON payload (representing the DOB data), and produce a signature compatible with CKB transaction structure?
3. How can the ESP32 securely store and manage its private key for signing DOBs?
4. What is the full end-to-end flow, from ESP32 generating a signed payload to a CKB node minting the DOB, including any necessary relay services?

## [NEW_TASK] github-raw-rate-limits-and-semantic-search
**Priority:** LOW
**Output:** findings/github-raw-rate-limits-and-semantic-search.md
**Goal:** Understand GitHub `raw.githubusercontent.com` rate limits and explore advanced semantic search tools for local code mirrors.
**Seeds:**
- https://docs.github.com/en/rest/overview/rate-limits
- https://docs.github.com/en/rest/repos/contents
- https://github.com/BurntSushi/ripgrep
- https://docs.github.com/en/github/searching-for-information-on-github/searching-code
- https://sourcegraph.com/
- https://docs.ollama.com/concepts/embeddings
- https://github.com/ggerganov/llama.cpp/tree/master/examples/embedding
**Questions to answer:**
1. What are the specific rate limits (requests per hour/minute) for accessing `raw.githubusercontent.com` content, both authenticated and unauthenticated?
2. Beyond `ripgrep`, what advanced semantic code search tools or techniques (e.g., based on local embeddings, AST parsing) are suitable for a local Git repository mirror to enhance AI-assisted code search?
3. What is the setup complexity and resource overhead for implementing such advanced semantic search capabilities on Phill's existing hardware (e.g., N100, OPi5+)?
## [/NEW_TASK]