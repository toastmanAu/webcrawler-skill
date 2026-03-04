# Research: stack-gap-analysis-2

**Date:** 2026-03-04  
**Status:** SYNTHESIS  
**Seeds:** local findings + MEMORY.md

---

## Fresh Synthesis: Wyltek/Kernel Stack - March 2026

**Executive Summary:**
The Wyltek/Kernel stack demonstrates robust progress, particularly in core Nervos infrastructure, embedded systems, and the foundational agent collective. Phill's deep hardware expertise and proactive approach to local LLM inference are significant assets. Key projects like NerdMiner CKB, CKB Node Dashboard, and the Research Crawler are nearing completion or fully operational. However, critical gaps exist in power stability for local LLMs, the foundational understanding of CKB DID, specific technical details for embedded automotive integration, and comprehensive LLM pricing/rate limit data for optimal cost routing. Addressing these will enhance reliability, unblock key projects, and refine operational efficiency.

### 1. Which projects are closest to a shippable/launchable milestone and what's the last blocker?

1.  **NerdMiner CKB:**
    *   **Status:** Core implementation DONE (2026-02-22). Worker Name field + password field added. Default pool configured.
    *   **Last Blocker:** Final flashing to the target ESP32-2432S028R (CYD) and thorough testing for stable operation.
2.  **CKB Node Dashboard:**
    *   **Status:** Live, Node.js proxy + HTML polling dashboard.
    *   **Last Blocker:** None apparent; appears stable and functional.
3.  **CKB Whale Alert Bot:**
    *   **Status:** Running, monitors local CKB node, sends Telegram alerts (threshold $200k USD or 10M CKB).
    *   **Last Blocker:** Ensuring robust local management of `config.json` (which is gitignored) and confirming reliable CoinGecko price feed integration.
4.  **Fan Controller:**
    *   **Status:** Systemd service, GPIO-controlled software PWM (GPIO1_C4).
    *   **Last Blocker:** None apparent; appears stable and functional.
5.  **Agent Collective (Wyltek on N100):**
    *   **Status:** Free-agent kit deployed, OpenClaw installed, N100 (wyltek-n100) paired.
    *   **Last Blocker:** Phill providing the HuggingFace token to complete deployment and enable Wyltek to access free HF models.
6.  **CKB Stratum Proxy:**
    *   **Status:** Running, port 3333 for miners, 8081 for stats. Handles ViaBTC quirks, per-miner extranonce.
    *   **Last Blocker:** None apparent; appears stable and functional.
7.  **Research Crawler System:**
    *   **Status:** Built (2026-03-03), `scripts/research-crawl.py` running, auto-picks tasks, ~18 tasks completed.
    *   **Last Blocker:** None apparent; self-extending and functional.
8.  **Research Dashboard:**
    *   **Status:** Live, http.server, dark UI, mobile-responsive.
    *   **Last Blocker:** None apparent; functional.
9.  **DOB Minter (Web UI):**
    *   **Status:** ClusterPanel and FilesPanel committed (commit 55ec5ed), dev server running.
    *   **Last Blocker:** Integration with the ESP32 signing flow for actual on-chain minting (a critical missing bridge).
10. **Wyltek Membership System:**
    *   **Status:** Supabase backend configured, JoyID @joyid/ckb@1.1.3 ES module integration for CKB address auth being tested.
    *   **Last Blocker:** Full testing and hardening of the JoyID connect and Supabase auth flow.
11. **Fiber Nodes (ckbnode & N100):**
    *   **Status:** Both `ckbnode` and `N100` Fiber nodes are running as systemd services.
    *   **Last Blocker:** N100 Fiber node needs funding (99+ CKB) to auto-accept channels, which is blocking the PENDING channel between `ckbnode` and `N100`.

### 2. What are the critical missing bridges between components that would unlock the most value?

1.  **ESP32 DOB Signing Flow:** The secure communication and transaction signing mechanism between the `ckb-dob-minter` (web UI/relay) and the ESP32. This bridge is essential for enabling on-chain hardware provenance, allowing ESP32 devices to attest to their own manufacturing and firmware. (`esp32-ckb-dob-signing-flow.md`)
2.  **CKB Chess Relayer <-> Fiber Node RPC Integration:** The Node.js relayer's implementation of Fiber RPC calls to manage game channels, embed game state hashes within `send_payment` `custom_records`, and handle settlement. This bridge is crucial for the `ckb-chess` dApp to function as intended, leveraging Fiber for off-chain state updates. (`ckb-chess-fiber-rpcs-revisit.md`)
3.  **Wyltek Embedded Builder <-> DID Identity (`WyDID.h`):** The planned ESP32 component (`WyDID.h`) for `did:ckb` identity needs to be built and integrated into the `wyltek-embedded-builder`. This bridge will allow embedded devices to establish and use their own decentralized identities. (MEMORY.md)
4.  **`ckb-light-esp` <-> BitChat BLE Mesh Integration:** The integration of the NimBLE-Arduino library into `ckb-light-esp` to enable BLE mesh networking, allowing ESP32 devices to act as both BLE Central and Peripheral for BitChat communication. This unlocks local, off-grid communication capabilities for `ckb-light-esp`. (`bitchat-ble-transport.md`)
5.  **CKB Node Dashboard <-> Fiber Node RPC:** The existing CKB Node Dashboard could be extended to display Fiber node status, channel information, and payment activity, providing a unified view of the Nervos ecosystem presence.

### 3. Which completed research findings have immediately actionable next steps not yet started?

1.  **OPi5+ Ollama PSU Upgrade:** The `qwen2.5:7b` model causes power-related crashes on the Orange Pi 5+. A better 5A+ PSU is immediately needed to enable stable operation of larger local LLMs, which is crucial for reducing cloud costs and improving agent capabilities. (MEMORY.md, `stack-gap-analysis.md`)
2.  **Agent Collective (Wyltek) HF Token Provision:** The deployment of the first agent, Wyltek, on the N100 is blocked by the lack of a HuggingFace token from Phill. This token is required to complete the setup and enable Wyltek to access free HF models. (MEMORY.md)
3.  **OPi3B Agent Host OpenClaw Console Setup:** The new Orange Pi 3B agent board has OpenClaw installed and a gateway token, but requires physical terminal interaction to complete the console setup. This is a prerequisite for it to function as a fully operational agent host. (MEMORY.md)
4.  **Binance Bot Grid Strategy Development:** Phill's Binance bot currently uses an RSI/EMA strategy which is sitting out the current ranging market. The next step is to build a grid strategy to capitalize on these market conditions, allowing the bot to become active and generate returns. (MEMORY.md)
5.  **NerdMiner CKB Final Testing & Deployment:** The core implementation of the ESP32 Eaglesong miner is complete. The next step is to flash it to the target ESP32-2432S028R (CYD) and conduct thorough testing to ensure stable operation and mining. (MEMORY.md)
6.  **CKB Whale Alert Bot `config.json` Management:** The `config.json` file, which contains sensitive information like the Telegram bot token, is gitignored. Phill needs to ensure a robust local management strategy for this file to maintain security and allow for easy deployment/reconfiguration. (MEMORY.md)
7.  **OPi3B CKB Node DSI Display Reboot Test:** The DSI display overlay and reprobe service are configured on the Orange Pi 3B CKB node. A critical next step is to test the display output after a full system reboot to confirm persistence and reliability. (MEMORY.md)
8.  **Binance Bot API Key Configuration:** Once the grid strategy is developed and tested in paper mode, Phill will need to obtain and configure Binance API keys to enable the bot to operate with real funds (after setting `BOT_MODE=live`). (MEMORY.md)
9.  **N100 `orangepi-build` Verification:** The `orangepi-build` repository is cloned on the N100, which is an x86 host. Phill needs to verify that the build environment is correctly set up and functional for generating Orange Pi images.