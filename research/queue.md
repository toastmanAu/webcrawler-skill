# Research Queue

Tasks here are picked up by the idle crawler (scripts/research-crawl.sh).
Each task has: id, status, priority, seed URLs, output file, prompt template.

Status: PENDING | IN_PROGRESS | DONE | SKIP

---

## [DONE] bitchat-ble-transport
**Priority:** HIGH
**Output:** findings/bitchat-ble-transport.md
**Goal:** Map the full BLE transport layer needed to wire our bitchat_mesh.cpp into actual BLE on ESP32. We have the packet codec + relay engine. Need: NimBLE-Arduino GATT server/client setup, advertise + scan + connect flow, characteristic notify pattern, how BitChat Android peers discover and connect.
**Seeds:**
- https://raw.githubusercontent.com/hackerhouse-opensource/bitchat-esp32/main/README.md
- https://raw.githubusercontent.com/hackerhouse-opensource/bitchat-esp32/main/bitchat_esp32.ino
- https://raw.githubusercontent.com/h2zero/NimBLE-Arduino/master/README.md
- https://raw.githubusercontent.com/h2zero/NimBLE-Arduino/master/examples/NimBLE_Server/NimBLE_Server.ino
- https://raw.githubusercontent.com/h2zero/NimBLE-Arduino/master/examples/NimBLE_Client/NimBLE_Client.ino
- https://raw.githubusercontent.com/toastmanAu/ckb-light-esp/main/src/bitchat/bitchat_mesh.h
**Questions to answer:**
1. Does BitChat Android use BLE central, peripheral, or both simultaneously?
2. What's the exact GATT notify flow for mesh relay (write vs notify vs indicate)?
3. NimBLE-Arduino: minimum sketch to advertise + accept connections + relay data?
4. Any existing ESP32 BitChat implementations or forks?
5. MTU negotiation — what does NimBLE default to, what does BitChat Android expect?

---

## [DONE] fiber-trampoline-routing
**Priority:** HIGH
**Output:** findings/fiber-trampoline-routing.md
**Goal:** Understand Fiber v0.7.0 trampoline routing — how it works, what it changes for multi-hop payments, implications for ckb-chess invoice flow and any app that routes payments through our nodes.
**Seeds:**
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/docs/specs/trampoline-routing.md
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/docs/payment-lifecycle.md
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/README.md
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/payment.rs
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/invoice.rs
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/channel.rs
**Questions to answer:**
1. What is trampoline routing and how does it differ from standard onion routing?
2. Does v0.7.0 require both endpoints to support trampoline, or just the routing nodes?
3. What RPC changes in v0.7.0 affect send_payment / new_invoice?
4. One-way channels — what exactly changed, and does it affect channel funding requirements?
5. Impact on ckb-chess: do we need to update Fiber RPC calls?

---

## [DONE] ckb-chess-relayer-design
**Priority:** HIGH
**Output:** findings/ckb-chess-relayer.md
**Goal:** Design the ckb-chess relayer — the Node.js server that sits between two players, forwards signed moves, and monitors the CKB chain for game state. Also map Fiber invoice flow for move payments.
**Seeds:**
- https://raw.githubusercontent.com/toastmanAu/ckb-chess/main/README.md
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/docs/rpc.md
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/tests/bruno/fiber/send_payment.bru
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/tests/bruno/fiber/new_invoice.bru
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/tests/bruno/fiber/open_channel.bru
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/src/fiber/channel.rs
**Questions to answer:**
1. What Fiber RPCs are needed: new_invoice, send_payment, get_invoice, list_channels?
2. Full payment flow: challenger opens channel → sends invoice per move → opponent pays?
3. How does the relayer detect a channel close / game end on-chain?
4. Are there any existing CKB game relayer patterns to reference?
5. WebSocket vs HTTP polling for the game client ↔ relayer protocol?

---

## [DONE] esp32-p4-sphincs-plus
**Priority:** MEDIUM
**Output:** findings/esp32-p4-sphincs-plus.md
**Goal:** Assess feasibility of SPHINCS+ post-quantum signing on ESP32-P4. Hardware SHA-256/512 accelerators available. Goal: sign a CKB transaction with SPHINCS+ from an ESP32-P4.
**Seeds:**
- https://raw.githubusercontent.com/espressif/esp-idf/master/components/esp_hw_support/include/esp_sha.h
- https://docs.espressif.com/projects/esp-idf/en/latest/esp32p4/api-reference/peripherals/sha.html
- https://raw.githubusercontent.com/pq-crystals/sphincsplus/master/README.md
- https://raw.githubusercontent.com/RustCrypto/signatures/master/sphincsplus/README.md
- https://raw.githubusercontent.com/espressif/esp-idf/master/components/mbedtls/port/include/sha256_alt.h
- https://raw.githubusercontent.com/nicowillis/git-mirror/main/README.md
**Questions to answer:**
1. Does ESP-IDF expose SHA-256/512 hardware acceleration via a simple API?
2. Which SPHINCS+ parameter set is practical on a microcontroller (sphincs-sha2-128s vs 256s)?
3. Is there a Rust SPHINCS+ crate with configurable hash backend?
4. What's the expected sign time on ESP32-P4 in pure software (extrapolate from Cortex-M benchmarks)?
5. Any prior art: SPHINCS+ on ESP32 or similar Xtensa/RISC-V MCU?

---

## [DONE] dob-hardware-provenance-schema
**Priority:** MEDIUM
**Output:** findings/dob-hardware-provenance.md
**Goal:** Design a JSON schema for hardware provenance DOBs — minting an on-chain cert from an ESP32 containing device serial, firmware hash, board type, test results. Map to Spore content_type and existing standards.
**Seeds:**
- https://raw.githubusercontent.com/nervosnetwork/rfcs/master/rfcs/0022-transaction-structure/0022-transaction-structure.md
- https://raw.githubusercontent.com/sporeprotocol/spore-sdk/main/docs/core/spore-data.md
- https://schema.org/Product
- https://www.ietf.org/archive/id/draft-ietf-rats-eat-21.txt
- https://raw.githubusercontent.com/toastmanAu/ckb-dob-minter/main/README.md
**Questions to answer:**
1. What content_type should hardware provenance DOBs use? (application/json? application/vnd.wyltek.provenance+json?)
2. Does EAT (Entity Attestation Token) give us a head start on field naming?
3. Minimum viable schema: what fields are non-negotiable for a hardware cert?
4. How does the ESP32 sign the payload before minting? (ckb-esp32-signer flow)
5. Any prior art: hardware attestation on blockchain (not just NFT metadata)?

---

## [DONE] ckb-snapshot-infrastructure
**Priority:** LOW
**Output:** findings/ckb-snapshot-infra.md
**Goal:** Research best practices for CKB snapshot hosting — compression formats, Cloudflare R2 serving patterns, how other node snapshot services are structured (Bitcoin, Ethereum).
**Seeds:**
- https://raw.githubusercontent.com/nervosnetwork/ckb/develop/docs/run-ckb-with-docker.md
- https://developers.cloudflare.com/r2/examples/rclone/
- https://developers.cloudflare.com/r2/api/s3/presigned-urls/
- https://raw.githubusercontent.com/bitcoin/bitcoin/master/doc/bootstrapping.md
- https://raw.githubusercontent.com/paritytech/substrate/master/docs/CONTRIBUTING.adoc
**Questions to answer:**
1. What compression format does the community expect for CKB snapshots? (zstd vs lz4 vs gz)
2. Does Cloudflare R2 need any special headers for large file resumable downloads?
3. How do other projects handle snapshot versioning + latest pointer?
4. Is there a CKB community snapshot already hosted somewhere (to avoid duplication)?
5. What's the right cache-control for R2-hosted snapshots?

---

## [DONE] handheld-gaming-ckb-integration
**Priority:** HIGH
**Output:** findings/handheld-gaming-ckb-integration.md
**Goal:** Map integration opportunities for our stack (CKB node, Fiber, ckb-chess, DOB minter, wallet) inside handheld gaming devices. Two tracks: (1) apps running inside existing gaming OS (ArkOS, JELOS, AmberELEC, Batocera, Android) — overlays, launchers, companion apps; (2) full hardware takeover — Armbian/mainline Linux on the device, running our full node stack. Focus on RK3566-based handhelds first: Anbernic RG-ARC-D, and then RK3326 (older) and Rockchip handhelds broadly. Also cover Retroid Pocket 4 Pro (Android, Dimensity 900).
**Seeds:**
- https://raw.githubusercontent.com/ArkOS/ArkOS/master/README.md
- https://raw.githubusercontent.com/JELOS/JELOS/main/README.md
- https://wiki.batocera.org/hardware_compatibility
- https://github.com/christianhaitian/arkos/wiki
- https://retrodreamer.com/retroid-pocket-4-pro
- https://raw.githubusercontent.com/spruceUI/spruceOS/main/README.md
**Questions to answer:**
1. Which gaming OSes on RK3566 handhelds support running arbitrary Linux apps alongside the emulator frontend (ports, scripts, systemd services)?
2. Does the Anbernic RG-ARC-D run stock Android or a gaming Linux distro? What's the root/ADB situation?
3. Retroid Pocket 4 Pro — Android version, ADB over WiFi support, can you sideload full APKs including custom launchers?
4. Is there prior art for running a CKB/blockchain node on a handheld gaming device? Any crypto apps in gaming OS port collections?
5. For a full hardware takeover: does mainline Linux (Armbian/Manjaro) boot on RK3566 handhelds? Which ones have working display + WiFi + controls in mainline?
6. What's the best approach for a persistent background service (CKB node, Fiber) on a gaming handheld that survives frontend restarts?
7. ckb-chess angle: could the handheld BE the game client — controller input, display output, Fiber payment channel in background?

---

## [DONE] hispo-s8-android-headunit-integration
**Priority:** HIGH
**Output:** findings/hispo-s8-headunit.md
**Goal:** Map integration opportunities for our stack on Hispo S8 Android car head units. Key areas: (1) CKB node + Fiber running as background Android service; (2) GPS data → chain monitor / dashcam-style data logger with on-chain provenance; (3) ADB/SSH access for agent control — modifying system layout, launching apps, pushing config; (4) Picture-in-picture at >4 simultaneous windows (stock limit); (5) Modifying/replacing stock Android OS or launcher; (6) CKB dashboard as always-on overlay; (7) Using their built-in PIP module architecture at higher capacity.
**Seeds:**
- https://xda-developers.com/android-auto-head-unit-root-guide/
- https://developer.android.com/guide/topics/ui/picture-in-picture
- https://developer.android.com/studio/command-line/adb
- https://raw.githubusercontent.com/termux/termux-app/master/README.md
- https://raw.githubusercontent.com/termux/termux-packages/master/README.md
- https://xda-developers.com/how-to-enable-developer-options-android/
**Questions to answer:**
1. What Android version do Hispo S8 / similar MTK/Qualcomm car headunits typically run? Is root or ADB accessible?
2. Can you SSH into an Android headunit via Termux + SSHd? What are the limitations?
3. PIP on Android — how many simultaneous windows does AOSP support? Any known way to stack more than 4 apps?
4. Can the stock launcher be replaced on a non-rooted Android headunit (HOME intent override)?
5. GPS integration: standard Android Location API — does it work in always-on background services on headunits?
6. Could a CKB light client run as an Android foreground service with wake lock on a headunit?
7. What can ADB over WiFi do: push APKs, modify settings, trigger intents, change launcher?
8. Any prior art: blockchain nodes or crypto wallets running as Android background services on low-power devices?

---

## [DONE] obd2-canbus-esp32-analysis-injection
**Priority:** HIGH
**Output:** findings/obd2-canbus-esp32.md
**Goal:** Deep research into OBD2 + CAN bus / K-Line read AND write from ESP32. Two tiers: (1) passive reading — live sensor data, fault codes, ECU parameters; (2) active injection/writing — sending frames to modify ECU behaviour, unlock hidden features, change car configuration. Specific target: Renault Clio RS 172 (~2001-2002, F7R 2.0L, Bosch Motronic ECU). Known hardware: Renault Link v1.99 KKL USB-to-K-Line adapter.
**Seeds:**
- https://raw.githubusercontent.com/iDoka/awesome-canbus/master/README.md
- https://raw.githubusercontent.com/P1kachu/talking-with-cars/master/README.md
- https://raw.githubusercontent.com/merecarvill/OBD2-KLine-Reader/master/README.md
- https://raw.githubusercontent.com/collin80/esp32_can/master/README.md
- https://raw.githubusercontent.com/ECU-tech/fome-fw/master/README.md
- https://raw.githubusercontent.com/tgsmith61591/DDT4ALL/master/README.md
**Questions to answer:**
1. Renault Clio RS 172: K-Line or CAN on OBD2 port? Which ECU (Bosch ME7.4.6?)? What protocol does Renault Clip use?
2. Can Renault Link v1.99 KKL protocol be replicated on ESP32 with L9637D K-Line transceiver?
3. What can you READ from a Clio 172 via K-Line: live PIDs, fault codes, immobiliser status?
4. What can you WRITE: key programming, idle speed, ignition timing, throttle adaptation reset?
5. Does DDT4ALL support the Clio 172 ECU / F7R Bosch Motronic? Any reversed Renault DBC files?
6. Is there a CAN bus internally on the 172 (ABS, UCH, instrument cluster)? Speed and documented frames?
7. ESP32 K-Line UART + L9637D: baud rates, init sequences, ISO 14230 KWP2000 frame format?
8. Safety: risks of bad write commands — ECU brick, immobiliser lockout, limp mode?

---

## [DONE] local-repo-mirror-strategy
**Priority:** MEDIUM
**Output:** findings/local-repo-mirror.md
**Goal:** Evaluate whether mirroring key Nervos/CKB repos locally provides meaningful cost/speed benefits for an AI agent workflow. Repos: nervosnetwork/ckb, nervosnetwork/fiber, sporeprotocol/spore-sdk, nervosnetwork/rfcs, ckb-ccc.
**Seeds:**
- https://docs.github.com/en/repositories/creating-and-managing-repositories/duplicating-a-repository
- https://raw.githubusercontent.com/nicowillis/git-mirror/main/README.md
- https://api.github.com/repos/nervosnetwork/fiber
- https://api.github.com/repos/nervosnetwork/ckb
- https://api.github.com/repos/sporeprotocol/spore-sdk
**Questions to answer:**
1. What's the actual size of key Nervos repos (ckb, fiber, rfcs, spore-sdk)? Shallow vs full clone disk cost?
2. For AI-assisted code search: local ripgrep vs web_fetch of raw files — when does each win?
3. Best cron strategy for keeping mirrors fresh — git fetch --all nightly?
4. Does GitHub rate-limit raw.githubusercontent.com at the scale of our crawler (50+ fetches/day)?
5. Would Ryzen (Ethernet, 214GB free) or Pi5 (828GB free) be the better mirror host?
6. Any tools that auto-index a local git repo for semantic search beyond grep?

---

## [DONE] llm-cost-optimisation-strategy
**Priority:** HIGH
**Output:** findings/llm-cost-optimisation.md
**Goal:** Map LLM pricing, quality, and limitations relevant to our workflow. Minimise premium token spend while maximising quality. Cover: provider prices, free tier limits, local inference, task routing, context management, caching. Output: a decision framework for model selection per task type.
**Seeds:**
- https://raw.githubusercontent.com/BerriAI/litellm/main/README.md
- https://raw.githubusercontent.com/ollama/ollama/main/README.md
- https://openrouter.ai/docs/quick-start
- https://huggingface.co/docs/api-inference/index
- https://raw.githubusercontent.com/google-gemini/cookbook/main/README.md
- https://raw.githubusercontent.com/anthropics/anthropic-sdk-python/main/README.md
**Questions to answer:**
1. Current prices per million tokens for: Claude Sonnet 4.5, Claude Haiku 3.5, Gemini 2.5 Flash, Gemini 2.5 Pro, GPT-4o mini, Llama 3.3 70B (HF free), DeepSeek V3?
2. HuggingFace free inference: actual rate limits, queue times, reliability for sustained use?
3. Gemini 2.5 Flash free tier: RPM/TPD limits vs paid?
4. OpenRouter: meaningful cost difference vs direct API for Claude/Gemini?
5. LiteLLM: can it auto-route to cheapest capable model? Setup complexity?
6. Prompt caching (Anthropic): real savings for repeated system prompts like our AGENTS.md + memory?
7. Local inference (Ryzen qwen2.5:14b): which task types can fully replace cloud?
8. Practical routing table: heartbeat / research crawl / code gen / chat / memory write — optimal model per task?
9. Realistic weekly token budget for our workload, optimised vs unoptimised?

---

## [DONE] stack-gap-analysis
**Priority:** SYNTHESIS
**Output:** findings/stack-gap-analysis.md
**Goal:** When all other research tasks are DONE, perform a synthesis analysis of our entire current stack against the findings from all completed research. Identify gaps, missing bridges, and next build priorities across: ckb-light-esp, ckb-chess, DOB minter, Fiber nodes, BitChat BLE, NerdMiner, stratum proxy, wyltek-embedded-builder, and the agent infrastructure. Then generate new research tasks for any gaps that need external research — write them back into research/queue.md as PENDING tasks with proper seeds. This is a living process, not a one-shot report.
**Seeds:** (internal — reads research/findings/*.md + workspace MEMORY.md)
**Questions to answer:**
1. Which research findings have immediately actionable next steps we haven't started?
2. What are the critical missing bridges between components (e.g. BitChat BLE ↔ ckb-light-esp payment layer)?
3. Which projects are closest to a shippable milestone and what's blocking them?
4. Are there any findings that change the priority of existing work?
5. What should Phill build next, ranked by impact/effort?
6. What new research topics should be queued — things we don't have enough info on to build yet? For each: write a full task block (id, priority, seeds, questions) ready to append to queue.md.


---

## [DONE] ckb-snapshot-community-expectations
**Priority:** HIGH
**Output:** findings/ckb-snapshot-community-expectations.md
**Goal:** Determine the CKB community's preferred snapshot compression formats, existing snapshot hosting solutions, and versioning strategies to ensure our planned R2 snapshot infrastructure aligns with user expectations and avoids duplication.
**Seeds:**
- https://raw.githubusercontent.com/nervosnetwork/ckb/develop/docs/run-ckb-with-docker.md (Re-attempt fetch)
- https://github.com/nervosnetwork/ckb/discussions (Community discussions)
- https://github.com/nervosnetwork/ckb/issues (Feature requests/discussions)
- https://docs.nervos.org/ (Official documentation for any existing snapshot guides)
**Questions to answer:**
1. What compression formats (e.g., zstd, lz4, gz) are commonly used or preferred by the CKB community for node snapshots?
2. Are there any existing, community-hosted CKB snapshots available, and if so, where are they hosted and what are their characteristics (size, update frequency, format)?
3. What versioning strategies (e.g., date-based filenames, "latest" symlinks/redirects) do other blockchain projects (Bitcoin, Ethereum, Substrate) use for their snapshots, and which would be most suitable for CKB?
4. How do CKB users currently bootstrap new nodes

---

## [DONE] esp32-p4-sphincs-plus-revisit
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

## [PENDING] ckb-snapshot-infra-revisit
**Priority:** MEDIUM
**Output:** findings/ckb-snapshot-infra-revisit.md
**Goal:** Determine best practices for CKB snapshot hosting on Cloudflare R2, addressing previous 404 errors and missing community context.
**Seeds:**
- https://raw.githubusercontent.com/nervosnetwork/ckb/develop/CHANGELOG.md
- https://raw.githubusercontent.com/nervosnetwork/ckb/develop/docs/run-ckb-with-docker.md
- https://developers.cloudflare.com/r2/reference/data-location/
- https://raw.githubusercontent.com/trufflesuite/ganache/develop/src/chains/ethereum/ethereum/README.md
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

## [PENDING] ckb-chess-fiber-rpcs-revisit
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

## [PENDING] llm-cost-optimisation-pricing-update
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
---

## [DONE] obd2-clio-rs172-esp32-revisit
**Priority:** HIGH
**Output:** findings/obd2-clio-rs172-esp32-revisit.md
**Goal:** Gather specific technical details for integrating an ESP32 with the Renault Clio RS 172's OBD2/K-Line, addressing previous 404 errors and missing information.
**Seeds:**
- https://www.cliosport.net/threads/obd2-diagnostic-on-172.html
- https://raw.githubusercontent.com/P1kachu/talking-with-cars/master/README.md
- https://raw.githubusercontent.com/merecarvill/OBD2-KLine-Reader/master/README.md
- https://www.nxp.com/docs/en/data-sheet/L9637D.pdf
- https://raw.githubusercontent.com/collin80/esp32_can/master/README.md
- https://raw.githubusercontent.com/guilherme-gm/Renault-Clip-Decrypted/master/README.md
**Questions to answer:**
1. Does the Renault Clio RS 172 use K-Line or CAN bus on OBD2? What ECU type (Bosch ME7.4.6?)?
2. Can Renault Link v1.99 KKL protocol be replicated on ESP32 + L9637D? Baud rates, init sequence?
3. What data can be READ via K-Line: live PIDs, fault codes, immobiliser status?
4. What can be WRITTEN: key programming, idle speed, ignition timing, throttle adaptation reset?

---

## [DONE] ckb-chess-fiber-rpcs-revisit
**Priority:** MEDIUM
**Output:** findings/ckb-chess-fiber-rpcs-revisit.md
**Goal:** Identify specific Fiber RPCs for the ckb-chess relayer using correct source paths found in earlier fiber research.
**Seeds:**
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/payment.rs
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/invoice.rs
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/channel.rs
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/README.md
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/docs/payment-lifecycle.md
- https://raw.githubusercontent.com/toastmanAu/ckb-chess/main/README.md
**Questions to answer:**
1. Exact RPCs needed for relayer: open_channel, send_payment, new_invoice, get_invoice, list_channels?
2. How to embed game state hash in Fiber payment messages?
3. Full RPC call sequence for a complete ckb-chess game lifecycle?

---

## [DONE] esp32-ckb-dob-signing-flow
**Priority:** MEDIUM
**Output:** findings/esp32-ckb-dob-signing-flow.md
**Goal:** Detail the technical flow for an ESP32 to sign a payload for minting a hardware provenance DOB on CKB.
**Seeds:**
- https://raw.githubusercontent.com/toastmanAu/ckb-dob-minter/main/README.md
- https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/system/esp_system.html
- https://raw.githubusercontent.com/espressif/esp-idf/master/components/mbedtls/port/include/sha256_alt.h
- https://raw.githubusercontent.com/nervosnetwork/ckb-sdk-js/develop/README.md
- https://raw.githubusercontent.com/nervosnetwork/rfcs/master/rfcs/0022-transaction-structure/0022-transaction-structure.md
**Questions to answer:**
1. Best crypto primitive for ESP32→CKB signing (secp256k1 vs Ed25519)?
2. Steps: ESP32 signs JSON payload → CKB-compatible signature?
3. Secure private key storage on ESP32 (eFuse? NVS encrypted partition?)?
4. Full relay flow: ESP32 signed payload → CKB node mints DOB?

---

## [DONE] handheld-gaming-rk3566-deep-dive
**Priority:** MEDIUM
**Output:** findings/handheld-gaming-rk3566-deep-dive.md
**Goal:** Determine best RK3566 handheld gaming OS for running CKB/Fiber nodes alongside the emulator frontend.
**Seeds:**
- https://raw.githubusercontent.com/christianhaitian/ArkOS/master/README.md
- https://raw.githubusercontent.com/JustEnoughLinuxOS/distribution/main/README.md
- https://wiki.batocera.org/hardware_compatibility
- https://raw.githubusercontent.com/AmberELEC/AmberELEC/main/README.md
- https://wiki.batocera.org/supported_games_controllers
**Questions to answer:**
1. Which RK3566 gaming distros support systemd services + arbitrary Linux apps alongside the frontend?
2. Anbernic RG-ARC-D: Android or Linux distro? Root/ADB situation?
3. Does Batocera on RK3566 have pacman or equivalent package manager accessible?
4. Best approach for persistent CKB node service that survives frontend restarts?

---

## [DONE] llm-cost-optimisation-pricing-update
**Priority:** HIGH
**Output:** findings/llm-cost-optimisation-pricing-update.md
**Goal:** Get current LLM pricing and free tier limits to build a proper routing decision table.
**Seeds:**
- https://www.anthropic.com/pricing
- https://ai.google.dev/pricing
- https://openrouter.ai/models
- https://huggingface.co/docs/api-inference/index
- https://raw.githubusercontent.com/BerriAI/litellm/main/docs/routing.md
**Questions to answer:**
1. Current $/MTok for: Claude Sonnet 4.5, Haiku 3.5, Gemini 2.5 Flash, Gemini 2.5 Pro, GPT-4o mini, Llama 3.3 70B free?
2. HuggingFace free tier: actual RPM limits and queue reliability?
3. Gemini 2.5 Flash free: RPM/TPD limits vs paid?
4. LiteLLM cost-based routing setup — complexity and config format?

---

## [DONE] ckb-did-cell-format-and-contract
**Priority:** HIGH
**Output:** findings/ckb-did-cell-format.md
**Goal:** Understand the on-chain CKB DID cell format, the smart contract that validates DID operations, and what data is stored in the cell so we can build WyDID.h — an ESP32 component that owns a did:ckb identity, signs payloads, and integrates with ckb-light-esp, BitChat, and Fiber.
**Seeds:**
- https://raw.githubusercontent.com/nervosnetwork/ckb-did/main/README.md
- https://raw.githubusercontent.com/web5-labs/ckb-did/main/README.md
- https://raw.githubusercontent.com/rink1969/ckb-did/main/README.md
- https://api.github.com/repos/rink1969/ckb-did/git/trees/main?recursive=1
- https://raw.githubusercontent.com/rink1969/web5-cli/main/README.md
- https://raw.githubusercontent.com/rink1969/web5-cli/main/src/did.ts
**Questions to answer:**
1. What is the exact CKB cell structure for a did:ckb cell — lock script, type script, data format?
2. What secp256k1 key format does the DID use — compressed pubkey? What's the derivation from key to DID string (z53x...)?
3. What does the DID type script validate — what makes a DID create/update/destroy tx valid?
4. How does DID resolution work — given did:ckb:z53x... how do you find the live cell and extract the pubkey?
5. What's the minimum CKB capacity required for a DID cell?
6. Can an ESP32 with trezor-crypto generate a compatible keypair and DID string without going on-chain first?

---

## [DONE] ckbfs-wasm-browser-adapter
**Priority:** HIGH
**Output:** findings/ckbfs-wasm-browser-adapter.md
**Goal:** Design and spec a WebAssembly adapter that compiles our CKB-ESP32 CKBFS C implementation to WASM, enabling the same codebase to run in browsers and React apps. This is the foundation for `@wyltek/ckbfs` npm package — one C codebase, two targets (ESP32 + browser).

**Context:**
- We have a complete CKBFS implementation in C: `CKB-ESP32/src/ckbfs.h` + `ckbfs.cpp`
- Pure functions (build_witness, build_cell_data, adler32, fetch_witness) compile to WASM today with zero changes
- Platform-specific layer (HTTP = HTTPClient on ESP32, signing = secp256k1 raw key) needs thin JS shims for browser
- JoyID/MetaMask signing stays in JS via CCC signer — WASM just builds the tx skeleton + witness bytes
- End goal: drop-in CKBFS storage provider in the DOB minter (`lib/storage/ckbfs.js`)

**Seeds:**
- https://raw.githubusercontent.com/code-monad/ckbfs/main/README.md
- https://raw.githubusercontent.com/code-monad/ckbfs/main/RFC.md
- https://emscripten.org/docs/porting/connecting_cpp_and_javascript/Interacting-with-code.html
- https://raw.githubusercontent.com/emscripten-core/emscripten/main/site/source/docs/porting/connecting_cpp_and_javascript/embind.rst
- https://raw.githubusercontent.com/toastmanAu/CKB-ESP32/main/src/ckbfs.h
- https://raw.githubusercontent.com/toastmanAu/CKB-ESP32/main/src/ckbfs.cpp

**Questions to answer:**
1. What is the minimal Emscripten build config to compile ckbfs.h pure functions to WASM — what flags, what stubs needed for Arduino guards?
2. How should the JS/WASM boundary be designed — embind vs cwrap vs WASM exports directly? What's the cleanest API surface?
3. For `ckbfs_publish` in browser: the signing step needs to go through a CCC signer (async, returns a signature). How do we bridge async JS signing into synchronous C signing? (Asyncify? Promise + callback?)
4. For `ckbfs_fetch_witness` in browser: HTTP calls need to use `fetch()` instead of HTTPClient. Best approach — JS fetch shim exported to C via EM_JS, or pure JS implementation calling WASM for decode only?
5. What does the full npm package structure look like — `@wyltek/ckbfs` with WASM bundle, JS bindings, TypeScript types, React hook `useChainStorage()`?
6. How does the multi-tx split work for files >480KB — what's the APPEND protocol in CKBFS and how do we expose a progress callback across multiple sequential broadcasts?
7. What's the CKB capacity cost model for CKBFS vs inline Spore? Our C code has `ckbfs_estimate_cost()` — port this to JS for the DOB minter cost panel.
8. Are there any existing CKBFS browser implementations (JS/TS) we can reference or diff against?

---

## [DONE] gameboy-hardware-wallet
**Priority:** MEDIUM
**Output:** findings/gameboy-hardware-wallet.md
**Goal:** Investigate feasibility of a retro handheld console (R36S/similar) that functions as a hardware wallet with CKB light client — disguised as a normal gaming device. Inspired by: "10,000 games and one is a wallet."

**Context:**
- R36S runs Batocera Linux (ARM, Rockchip RK3326), full Linux userspace available
- Phill has ESP32 CKB light client + signer already partially built (CKB-ESP32)
- Private key on removable micro SD (kept in safe separately from device)
- Wallet loads as a "ROM" in the game list — normal device to anyone watching
- Specific button combo unlocks wallet mode (like a cheat code)
- The "alternative mode" triggers a separate process/overlay on Batocera

**Questions to answer:**
1. What is the Batocera architecture — EmulationStation frontend, retroarch cores, Linux processes? How do custom apps get added as "games" in the UI?
2. Can a custom binary/script run as a retroarch core? What's the libretro core API — could a CKB light client + signer implement it?
3. What's the button combo interception pattern in Batocera/EmulationStation? How have others added secret modes or overlays?
4. Micro SD key storage: what's the right approach — encrypted private key file, hardware-backed keystore, or just raw key? What are the failure modes (corruption, accidental eject)?
5. What existing projects combine retro gaming hardware with crypto/blockchain (seed phrase entry on gameboy, trezor gameboy case mods, etc)?
6. RetroAchievements integration: how does it work technically? Can we use the same hooks for CKB events instead of game achievements?
7. What display/UX would the wallet screen look like in a Batocera ROM slot — full screen app, retroarch overlay, or EmulationStation scraper art?
8. R36S vs other budget handhelds (RG35XX, Miyoo Mini, Powkiddy RGB30, Anbernic RG28XX, TrimUI Smart Pro) — which have the best Linux access, fastest boot, most RAM for running a light client alongside games? Focus on devices under $60 AUD. Are there any with hardware secure elements or TPM chips?

**Seeds:**
- https://raw.githubusercontent.com/batocera-linux/batocera.linux/master/README.md
- https://wiki.batocera.org/add_games_bios (check raw/text version)
- https://raw.githubusercontent.com/libretro/RetroArch/master/README.md
- https://raw.githubusercontent.com/RetroAchievements/RAIntegration/master/README.md
- https://raw.githubusercontent.com/toastmanAu/CKB-ESP32/main/README.md

---

## [DONE] retroarch-core-blockchain
**Priority:** MEDIUM
**Output:** findings/retroarch-core-blockchain.md
**Goal:** Deep dive into the libretro/RetroArch core API to understand what's possible for blockchain-native retro games — in-game token earning, Fiber micropayments for lives/continues, on-chain leaderboards, tradeable game items as CKB DOBs.

**Context:**
- Neon's idea: handheld consoles where traditional points are tokens kids can trade for in-game or platform benefits
- RetroAchievements already tracks game events and awards badges — same hook could award CKB tokens
- A retroarch core IS just a shared library (.so/.dll) implementing the libretro API — you could write one from scratch
- Fiber Network enables sub-second micropayments — perfect for pay-per-life, tournament entry, item trades
- CKB DOBs as game items: sword found in dungeon = DOB minted to your wallet
- The "rom" is just data — a custom core could interpret any file format as a game with blockchain hooks

**Questions to answer:**
1. Full libretro core API surface: retro_run(), retro_serialize(), input polling, audio/video callbacks — what hooks exist for custom logic injection?
2. RetroAchievements technical implementation: how does rcheevos library detect game events? Same pattern usable for token triggers?
3. Can a libretro core make network calls (HTTP/WebSocket) from within retro_run()? Threading model?
4. What's the minimal libretro core that compiles for ARM (R36S/Batocera) — could our CKB light client be the network layer inside a core?
5. Fiber Network payment flow for games: what does a sub-second micropayment look like in code? Invoice → pay → confirm in <1s?
6. Existing blockchain game projects on RetroArch or similar — any prior art?
7. DOB minting from a game event: latency, UX, what does "item found = NFT minted" feel like in practice?
8. Legal/IP considerations: retro game ROMs + blockchain = two complicated areas. Custom cores with original content sidestep this entirely.

**Seeds:**
- https://raw.githubusercontent.com/libretro/RetroArch/master/libretro-common/include/libretro.h
- https://raw.githubusercontent.com/RetroAchievements/rcheevos/master/README.md
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/README.md
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/docs/architecture.md

---

## [DONE] retro-achievements-ckb-bridge
**Priority:** LOW
**Output:** findings/retro-achievements-ckb-bridge.md
**Goal:** Map RetroAchievements' existing infrastructure and API to understand what's already solved for game event tracking — then design the delta needed to route those events to CKB instead of (or alongside) RA badges.

**Context:**
- RetroAchievements (RA) is already doing what we want: tracking in-game memory addresses, firing events when conditions are met, awarding badges
- Their rcheevos C library runs inside retroarch cores and has a public API
- If we can hook into rcheevos events and route them to a CKB transaction, the game tracking work is already done
- This is the shortest path to "achievement = on-chain token"

**Questions to answer:**
1. RetroAchievements API: what endpoints exist for reading achievement definitions and submitting unlocks? Can we POST to a custom endpoint instead?
2. rcheevos library: what's the callback interface when an achievement fires? How hard is it to add a second callback that signs a CKB tx?
3. RA achievement format (.json/.cht files): could we define "CKB achievements" in the same format and run them through the same engine?
4. What CKB transaction type makes sense for an achievement unlock — a simple transfer to a "trophy" address, a DOB mint, or a Fiber micropayment?
5. RA has a community of 50,000+ users and 500,000+ achievements across thousands of games. Is there a path to propose CKB as an optional "export" destination for existing achievements?

**Seeds:**
- https://raw.githubusercontent.com/RetroAchievements/rcheevos/master/README.md
- https://api.retroachievements.org (check their public API docs URL)
- https://raw.githubusercontent.com/RetroAchievements/RAIntegration/master/README.md

---

## [DONE] stack-gap-analysis-2
**Priority:** SYNTHESIS
**Output:** findings/stack-gap-analysis-2.md
**Goal:** Fresh synthesis of the entire Wyltek/Kernel stack as of March 2026. Read all completed research findings and MEMORY.md. Identify: (1) what's built and working, (2) what's partially done and what's blocking it, (3) highest-leverage next build priorities, (4) gaps or missing bridges between components. Cover: DOB minter + membership system, Fiber nodes (ckbnode + N100), ckb-light-esp, ckb-chess, NerdMiner CKB, stratum proxy, wyltek-embedded-builder, Web5/DID identity, agent infrastructure (Kernel Pi5 + Wyltek N100), Binance trading bot, and the Wyltek website. Then generate new external research tasks for any knowledge gaps — write them as [NEW_TASK] blocks so they get auto-queued.
**Seeds:** (internal — reads research/findings/*.md + workspace MEMORY.md)
**Questions to answer:**
1. Which projects are closest to a shippable/launchable milestone and what's the last blocker?
2. What are the critical missing bridges between components that would unlock the most value?
3. Which completed research findings have immediately actionable next steps not yet started?
4. What new research topics should be queued — things we don't know enough about yet to build?
5. Are there any architecture decisions that should be reconsidered based on the accumulated findings?
6. What's the single highest-impact thing Phill should build next?

---

## [DONE] wyltek-membership-ckb-dob-social-layer
**Priority:** HIGH
**Output:** findings/wyltek-membership-ckb-dob-social-layer.md
**Goal:** Research how other CKB/Spore projects have implemented social features on top of DOB ownership — likes, comments, gated content, reputation. Map what's possible with Spore cells as social identity anchors. Compare against Wyltek's current Supabase approach and identify if/when moving social data fully on-chain makes sense.
**Seeds:**
- https://raw.githubusercontent.com/sporeprotocol/spore-sdk/main/README.md
- https://raw.githubusercontent.com/sporeprotocol/spore-sdk/main/docs/core-concepts.md
- https://raw.githubusercontent.com/nervosnetwork/docs.nervos.org/develop/docs/dapp/spore-protocol.md
- https://raw.githubusercontent.com/ckb-devrel/pausable-udt/main/README.md
- https://raw.githubusercontent.com/cryptape/kuai/main/README.md
**Questions to answer:**
1. Can Spore cell ownership (DOB) be used as a soulbound membership token — what prevents transfers?
2. Are there existing CKB social dApps storing comments/reactions on-chain? Gas cost estimates?
3. What's the practical cost of storing a 280-char comment on CKB vs Supabase?
4. Spore extensions — can we attach metadata to a Spore cell post-mint (e.g. member profile data)?
5. What does a "token-gated" architecture look like natively on CKB — without a centralised DB?

---

## [DONE] ckbfs-v3-vs-v2-migration-path
**Priority:** HIGH
**Output:** findings/ckbfs-v3-vs-v2-migration.md
**Goal:** CKBFS V3 is now the SDK default. Understand what changed, whether V3 is production-ready, and whether Wyltek should migrate. The @wyltek/ckbfs-browser package currently pins to V2 — understand the full cost/benefit of a V3 upgrade and what would break.
**Seeds:**
- https://raw.githubusercontent.com/ckb-devrel/ckbfs/main/README.md
- https://raw.githubusercontent.com/ckb-devrel/ckbfs/main/CHANGELOG.md
- https://raw.githubusercontent.com/ckb-devrel/ckbfs/main/packages/api/src/utils/constants.ts
- https://raw.githubusercontent.com/ckb-devrel/ckbfs/main/packages/api/src/ckbfs.ts
- https://raw.githubusercontent.com/ckb-devrel/ckbfs/main/packages/api/src/utils/molecule.ts
- https://raw.githubusercontent.com/ckb-devrel/ckbfs/main/docs/protocol-v3.md
**Questions to answer:**
1. What exactly changed in V3 — witness structure, molecule schema, cell layout?
2. Is V3 more affordable? The synthesis mentions "more affordable" — quantify: cost per 100KB V2 vs V3?
3. Are V2 and V3 cells readable by the same resolver, or completely separate contracts?
4. V3 code_hash `0xb5d13f...` — is it deployed and stable on mainnet?
5. What would breaking changes look like in @wyltek/ckbfs-browser if we upgraded to V3?

---

## [DONE] fiber-channel-funding-ux
**Priority:** HIGH
**Output:** findings/fiber-channel-funding-ux.md
**Goal:** The N100 Fiber node needs 99+ CKB to auto-accept channels. Research the full UX of Fiber channel lifecycle — funding, capacity, liquidity rebalancing, and closing — specifically as it applies to our ckbnode↔N100 setup. Also research what CKB amount makes sense for a "healthy" routing node vs a payment endpoint.
**Seeds:**
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/docs/specs/channel-announcement.md
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/docs/payment-lifecycle.md
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/docs/quick-start.md
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/README.md
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/tests/bruno/fiber/open_channel.bru
- https://api.github.com/repos/nervosnetwork/fiber/releases/latest
**Questions to answer:**
1. Minimum CKB to auto-accept channels — is 99 CKB correct or is it configurable?
2. What's the recommended channel capacity for a routing node vs an app endpoint?
3. How do you rebalance a channel that's become one-sided (all capacity on one end)?
4. Channel close flow: cooperative vs unilateral — time locks, on-chain fees?
5. For ckb-chess: what capacity is needed per game session (typical move payment size × expected moves)?

---

## [DONE] ccc-transaction-building-patterns
**Priority:** HIGH  
**Output:** findings/ccc-transaction-building-patterns.md
**Goal:** Deep dive into CCC (CKB Component Composer) transaction building patterns — specifically for browser dApps using JoyID. We've been debugging CCC API quirks (getAddresses vs getAddressObjs, bytesFrom vs hexFrom, depType casing, hashTypeId argument order). Document the definitive correct patterns to avoid future regressions in @wyltek/ckbfs-browser and any future CKB browser tooling.
**Seeds:**
- https://raw.githubusercontent.com/ckb-ccc/ccc/main/README.md
- https://raw.githubusercontent.com/ckb-ccc/ccc/main/packages/core/src/signer/signer.ts
- https://raw.githubusercontent.com/ckb-ccc/ccc/main/packages/core/src/transaction/transaction.ts
- https://raw.githubusercontent.com/ckb-ccc/ccc/main/packages/core/src/ckb/transaction.ts
- https://raw.githubusercontent.com/ckb-ccc/ccc/main/packages/connector-react/README.md
- https://raw.githubusercontent.com/ckb-ccc/ccc/main/examples/ckb-transfer/src/App.tsx
**Questions to answer:**
1. `getAddresses()` vs `getAddressObjs()` vs `getRecommendedAddressObj()` — when to use each?
2. `bytesFrom()` vs `hexFrom()` — when does CCC auto-convert, when does it break JoyID serialisation?
3. `depType` casing — 'depGroup' vs 'dep_group' vs 'code' — what are the valid values and their byte encodings?
4. `hashTypeId(cellInput, outputIndex)` — does it take CellInput or OutPoint? What about the index type (BigInt vs number)?
5. `completeInputsByCapacity` vs `completeInputs` vs `completeFeeBy` — correct call order and what each does?
6. How does CCC serialise a transaction for JoyID popup — what types are safe (hex string vs Uint8Array vs BigInt)?

---

## [DONE] spore-dob-rendering-standards
**Priority:** MEDIUM
**Output:** findings/spore-dob-rendering-standards.md
**Goal:** Research how DOBs/Spores with ckbfs:// URI content are rendered in wallets and explorers. When someone receives a Founding Member DOB, how does JoyID, Neuron, or the CKB explorer display it? Are there metadata standards (like ERC-721 tokenURI) that determine how the image/name/description shows up?
**Seeds:**
- https://raw.githubusercontent.com/sporeprotocol/spore-sdk/main/docs/core-concepts.md
- https://raw.githubusercontent.com/sporeprotocol/spore-sdk/main/packages/core/src/codec/spore.ts
- https://raw.githubusercontent.com/nervosnetwork/docs.nervos.org/develop/docs/dapp/spore-protocol.md
- https://raw.githubusercontent.com/ckb-devrel/ckbfs/main/README.md
- https://raw.githubusercontent.com/nervosnetwork/rfcs/main/rfcs/0046-spore-protocol/0046-spore-protocol.md
**Questions to answer:**
1. Does JoyID wallet render ckbfs:// images natively, or does it need IPFS/HTTP?
2. Is there a Spore metadata standard for name, description, attributes (like ERC-721)?
3. How does the CKB explorer (explorer.nervos.org) render Spore/DOB content?
4. What content-types are well-supported across wallets — image/jpeg, image/png, image/svg+xml?
5. For the Founding Member DOB: what's the best content strategy to maximise wallet display compatibility?

---

## [DONE] ckb-light-esp-ckbfs-integration
**Priority:** MEDIUM
**Output:** findings/ckb-light-esp-ckbfs-integration.md
**Goal:** Research how CKBFS could be integrated into ckb-light-esp — specifically using an ESP32 to publish small sensor readings, firmware hashes, or hardware provenance records to CKBFS. Understand the constraints: no browser, no JoyID, needs raw CKB transaction building on a microcontroller or lightweight proxy.
**Seeds:**
- https://raw.githubusercontent.com/toastmanAu/ckb-light-esp/main/README.md
- https://raw.githubusercontent.com/toastmanAu/ckb-light-esp/main/src/ckb/transaction.h
- https://raw.githubusercontent.com/ckb-devrel/ckbfs/main/README.md
- https://raw.githubusercontent.com/ckb-devrel/ckbfs/main/packages/api/src/ckbfs.ts
- https://raw.githubusercontent.com/nervosnetwork/ckb-sdk-rust/main/README.md
**Questions to answer:**
1. What's the minimum viable CKBFS publish flow for a constrained device (no Node.js, no browser)?
2. Can an ESP32 build and sign a CKBFS transaction directly, or does it need a proxy?
3. What's the witness size limit per CKB transaction — can a sensor reading + firmware hash fit in one tx?
4. Is there a lightweight Rust or C CKBFS implementation that could target ESP-IDF?
5. Hardware provenance pattern: ESP32 signs its own firmware hash → publishes to CKBFS → DOB references it. Feasible?

---

## [DONE] wyltek-site-seo-and-discoverability
**Priority:** MEDIUM
**Output:** findings/wyltek-site-seo.md
**Goal:** Research SEO and discoverability strategies specifically for a niche blockchain/hardware developer community site. What meta tags, structured data, and content strategies make sense for wyltekindustries.com? Also research how other Nervos ecosystem projects handle discoverability — are there community directories, awesome-lists, or aggregators worth submitting to?
**Seeds:**
- https://raw.githubusercontent.com/nervosnetwork/awesome-nervos/main/README.md
- https://raw.githubusercontent.com/ckb-community/ckb-explorer-frontend/main/README.md
- https://raw.githubusercontent.com/ckb-devrel/ckbfs/main/README.md
- https://raw.githubusercontent.com/sporeprotocol/awesome-spore/main/README.md
- https://raw.githubusercontent.com/nervosnetwork/docs.nervos.org/develop/docs/ecosystem/projects.md
**Questions to answer:**
1. What Open Graph / Twitter Card meta tags should wyltekindustries.com have?
2. Is there an official Nervos ecosystem directory or dApp registry to submit Wyltek to?
3. What structured data (JSON-LD) schema makes sense for a blockchain tools/hardware project?
4. How do successful niche crypto projects drive organic traffic — content, GitHub stars, forum presence?
5. Are there CKB-specific communities (Discord, Telegram, forums) with project showcase channels?

---

## [DONE] stack-gap-analysis-3
**Priority:** LOW
**Output:** findings/stack-gap-analysis-3.md
**Goal:** SYNTHESIS — read all completed findings since stack-gap-analysis-2 plus current MEMORY.md. Produce updated gap analysis focused on: (1) what shipped since last synthesis (membership system, DOB minter, CKBFS browser SDK, profile system), (2) new gaps revealed by shipping, (3) revised priority order for remaining work, (4) any new opportunities spotted in research findings.
**Seeds:** local
**Questions to answer:**
1. What shipped since the last synthesis and what new gaps did shipping reveal?
2. Are the Fiber channel issues still the biggest blocker for ckb-chess?
3. With @wyltek/ckbfs-browser published, what's the ecosystem opportunity — who else would use this?
4. What's the most valuable next project to start after the membership system stabilises?
5. What risks exist in the current stack that need addressing before public launch?


---

## [DONE] fiber-network-deep-dive
**Priority:** HIGH
**Output:** findings/fiber-network-deep-dive.md
**Goal:** Map Fiber Network's full capability set — what can an AI agent actually DO with it? Cover: channel open/close/update RPC API, invoice creation + payment flow, HTLC mechanics, multi-hop routing, asset support (CKB + UDT), cross-chain (BTC Lightning interop), peer discovery, fee structures, watchtower support. Focus on what's practical TODAY vs roadmap. What are the latency/throughput characteristics? What's the minimum viable agent use case?
**Seeds:**
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/README.md
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/docs/en/get-started.md
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/docs/en/architecture.md

---

## [DONE] fiber-rpc-api-reference
**Priority:** HIGH
**Output:** findings/fiber-rpc-api-reference.md
**Goal:** Extract the complete Fiber RPC API — every method, params, return types, examples. Focus on: channel management (open_channel, accept_channel, list_channels), payments (send_payment, get_invoice, list_payments), peer management (connect_peer, list_peers), node info. Build a mental model of what a JS/TS agent client would look like against this API.
**Seeds:**
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/docs/en/rpc.md
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/src/rpc/mod.rs

---

## [DONE] fiber-agent-ideas-brainstorm
**Priority:** MEDIUM
**Output:** findings/fiber-agent-ideas-brainstorm.md
**Goal:** Brainstorm novel AI agent ideas that use Fiber Network as a core primitive. Think beyond "pay for AI prompts" — what unique things does Fiber enable that no other chain does? Consider: streaming micropayments per-token/per-byte, agent escrow/dispute, multi-agent coordination via payment channels, pay-per-proof oracles, metered API access, content monetisation, autonomous market making, Lightning interop use cases. Score each idea on: novelty, technical feasibility in 2 weeks, judge appeal, real-world utility. Pick the top 3.
**Seeds:**
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/README.md
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/docs/en/architecture.md

---

## [DONE] fiber-hackathon-prior-art
**Priority:** MEDIUM
**Output:** findings/fiber-hackathon-prior-art.md
**Goal:** Survey what's already been built on Fiber Network — any demos, repos, blog posts, hackathon entries, or community projects. What ground is already covered? What gaps exist? This helps us find whitespace for a novel entry. Also survey what "agentic" CKB projects exist generally.
**Seeds:**
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/README.md
- https://api.github.com/search/repositories?q=fiber+nervos+CKB&sort=updated&per_page=10
- https://api.github.com/search/repositories?q=ckb+agent&sort=updated&per_page=10

---

## [DONE] fiber-hackathon-synthesis
**Priority:** LOW
**Output:** findings/fiber-hackathon-synthesis.md
**Goal:** SYNTHESIS — read all fiber-* findings + MEMORY.md + our existing stack (Wyltek site, DOB minter, CKBFS SDK, Fiber nodes already running on ckbnode + N100). Produce: (1) recommended hackathon project concept with clear scope, (2) technical architecture — what we build, what APIs we use, what's the agent loop, (3) 2-week build plan broken into days, (4) what differentiates our entry from others, (5) risks and mitigations.
**Seeds:**

---

## [DONE] retroarch-memory-interface
**Priority:** HIGH
**Output:** findings/retroarch-memory-interface.md
**Goal:** Deep dive on RetroArch's network control interface for memory access. Cover: READ_CORE_MEMORY / WRITE_CORE_MEMORY UDP protocol (exact byte format, response format, error handling), GET_STATUS response format, how to identify which game/core is running, polling frequency limits, latency characteristics. Also cover the libretro achievement/cheevos system — how RAM address maps work, where they're stored, format of .rAchievement files. Find 3-5 popular 2-player competitive games (Street Fighter II, Bomberman, Mario Kart, Pong variants) and their known RAM addresses for: score, health/lives, player positions, game-over state. This data drives the payment trigger logic.
**Seeds:**
- https://raw.githubusercontent.com/libretro/RetroArch/master/command.h
- https://raw.githubusercontent.com/libretro/RetroArch/master/network/netplay/netplay.h
- https://docs.libretro.com/development/retroarch/network-control-interface/
- https://raw.githubusercontent.com/RetroAchievements/RAIntegration/master/README.md
- https://api.github.com/repos/RetroAchievements/rcheevos/contents/

---

## [DONE] retroachievements-ram-maps
**Priority:** HIGH
**Output:** findings/retroachievements-ram-maps.md
**Goal:** Map out the RetroAchievements data format and find concrete RAM address maps for competitive 2-player games. Need: the .json or achievement condition format that specifies memory addresses + conditions, where to fetch game RAM maps via the RA public API (no auth needed), specific addresses for Street Fighter II (health bars, round win, game over), Bomberman (lives, kills), any Pong variant (scores). Also: does RA have a "rich presence" feature that tracks game state? Can we query it? Goal is a lookup table: game → RAM addresses → payment trigger conditions.
**Seeds:**
- https://retroachievements.org/devoops.php
- https://api.retroachievements.org/v1/game/228/achievements
- https://raw.githubusercontent.com/RetroAchievements/rcheevos/master/README.md
- https://retroachievements.org/game/228

---

## [DONE] fiber-retroarch-architecture
**Priority:** HIGH  
**Output:** findings/fiber-retroarch-architecture.md
**Goal:** Design the technical architecture for a Fiber-powered RetroArch payment sidecar. Answer: (1) What does the agent process look like — polling loop, event detection, debouncing? (2) How does player A's agent communicate with player B's agent — direct Fiber channel, hub-and-spoke, or P2P? (3) Channel lifecycle — when does it open (game start), when does it settle (game over), what happens if a player disconnects mid-game? (4) What's the minimum CKB stake per game session? (5) How do we handle the 20ms Fiber latency vs game frame timing? (6) What's the UI — overlay on RetroArch, separate terminal, web dashboard? (7) Can this work over RetroArch Netplay (2 players on different machines) or only local? Map out the full data flow from game event → RAM read → payment trigger → Fiber send_payment → opponent receives.
**Seeds:**
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/README.md
- https://raw.githubusercontent.com/libretro/RetroArch/master/command.h

---

## [DONE] fiber-retroarch-synthesis
**Priority:** LOW
**Output:** findings/fiber-retroarch-synthesis.md
**Goal:** SYNTHESIS — read ALL fiber-* and retroarch-* findings + MEMORY.md. Produce the definitive build plan: (1) Project name + one-line pitch, (2) exact feature set for a 2-week hackathon build (MVP vs stretch), (3) day-by-day build schedule for March 11-25, (4) repo structure, (5) judging criteria mapping — score our concept against each criterion (completeness, soundness, autonomy, UX abstraction, viability, novelty), (6) demo script for the video submission, (7) what makes this entry impossible to ignore.
**Seeds:**

---

## [DONE] fiberquest-target-games
**Priority:** HIGH
**Output:** findings/fiberquest-target-games.md
**Goal:** Build a catalog of the best target games for FiberQuest — retro games that naturally lend themselves to real-money micropayment mechanics. Cross-reference: (1) highly rated/beloved games on MobyGames, GameFAQs, RA game database, (2) games with clean 2-player competitive mechanics where money-per-event makes intuitive sense, (3) games with well-documented RAM maps in RetroAchievements. Categories to cover: fighting games (SF2, MK, KI), sports (NBA Jam, Tecmo Bowl, Sensible Soccer), racing (Mario Kart, F-Zero, RC Pro-Am), puzzle/versus (Tetris, Dr Mario, Columns, Puyo Puyo), arcade (Pong, Arkanoid variants, Bubble Bobble co-op), brawlers (Streets of Rage, Double Dragon co-op — "pay to revive" mechanic). For each game include: console, core (Snes9x/Genesis Plus GX/mGBA/FBNeo), payment trigger concept (what event = what payment), why it's fun with money on the line, RA game ID if known. Aim for 20+ games across 5+ categories. Prioritise games that are universally recognised even by non-gamers (judges may not be hardcore gamers).
**Seeds:**
- https://retroachievements.org/gameList.php?c=2&s=5
- https://api.retroachievements.org/API/API_GetTopTenUsers.php
- https://raw.githubusercontent.com/RetroAchievements/rcheevos/master/README.md
- https://www.mobygames.com/game/snes/street-fighter-ii-turbo-hyper-fighting/
- https://api.github.com/repos/RetroAchievements/RALibretro/contents/

---

## [DONE] fiberquest-ram-addresses
**Priority:** HIGH
**Output:** findings/fiberquest-ram-addresses.md
**Goal:** Find concrete RAM addresses for the top 10 FiberQuest target games. For each game: Player 1 HP/lives address, Player 2 HP/lives address, score addresses, round/match state address, game-over flag address. Focus on: Street Fighter II Turbo (SNES), Super Street Fighter II (SNES), Mortal Kombat (SNES + Genesis), Super Bomberman (SNES), NBA Jam (SNES + Genesis), Pong variants (Atari 2600), Dr. Mario (NES), Tetris (Game Boy), F-Zero (SNES). Sources: RetroAchievements achievement condition strings encode exact addresses — parse them. GameHacking.org RAM maps. TCRF.net game internals. Any GitHub repos with documented memory maps. Format output as a JSON-ready lookup table: { gameName, console, core, addresses: { p1hp: "0xXXXX", p2hp: "0xXXXX", ... }, paymentTriggers: [...] }
**Seeds:**
- https://gamehacking.org/system/snes
- https://raw.githubusercontent.com/RetroAchievements/RALibretro/master/README.md
- https://tcrf.net/Street_Fighter_II_Turbo:_Hyper_Fighting_(SNES)
- https://tcrf.net/Super_Bomberman_(SNES)
- https://datacrystal.romhacking.net/wiki/Street_Fighter_II_Turbo:_Hyper_Fighting:RAM_map
- https://datacrystal.romhacking.net/wiki/Super_Bomberman:RAM_map

---

## [DONE] fiberquest-payment-mechanics
**Priority:** MEDIUM
**Output:** findings/fiberquest-payment-mechanics.md
**Goal:** Design the payment mechanic models for FiberQuest — how should money map to game events in each genre? Answer: (1) Fighting games — per-damage (proportional shannons to HP lost), per-round, per-match, per-special-move? (2) Sports — per-score, per-quarter, winner-takes-all? (3) Racing — per-position-change, finish-order payout, lap splits? (4) Puzzle/versus — per-garbage-sent, per-line-clear, survival bonus? (5) Co-op brawlers — "pay to revive" model, boss-kill bounty, shared pool? Also: what's the ideal wager size? Too small = meaningless, too large = scary. Recommend default amounts in CKB shannons that feel like arcade quarters — enough to feel real, not enough to hurt. Consider: variable wager (set per session), bracket wager (tournament pot). Also research: have any other projects done game+Lightning payments? What can we learn/differentiate from?
**Seeds:**
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/README.md
- https://raw.githubusercontent.com/nicholasgasior/gsfmt/master/README.md
- https://stacker.news/items/1
- https://github.com/lightningnetwork/lnd/blob/master/docs/payments.md

---

## [DONE] fiberquest-catalog-synthesis
**Priority:** LOW
**Output:** findings/fiberquest-catalog-synthesis.md
**Goal:** SYNTHESIS — read fiberquest-target-games + fiberquest-ram-addresses + fiberquest-payment-mechanics findings. Produce: (1) Final ranked catalog of 15 launch games for FiberQuest with complete details (game, console, core, RAM addresses, payment trigger model, default wager), (2) recommended launch lineup of 5 games that cover different genres and are universally recognisable, (3) the ram-maps/ JSON files content ready to paste into the repo for top 5 games, (4) suggested UI copy for each game profile ("You lost 32 HP — that'll cost you 320 shannons"), (5) which games to feature in the demo video and why.
**Seeds:**

---

## [DONE] fiberquest-sf2-ram-map
**Priority:** HIGH
**Output:** findings/fiberquest-sf2-ram-map.md
**Goal:** Find exact SNES Street Fighter II Turbo RAM addresses via web search. Need: P1 health address, P2 health address, P1 wins counter, P2 wins counter, game state (character select / fighting / round over / game over). Also find same for Super Bomberman SNES (P1 lives, P2 lives, bomb counts if possible). These are the two launch games. Cross-reference: TCRF, DataCrystal, GameHacking.org, speedrunning resources, any GitHub repos with SNES RAM maps. Also check: does the RetroAchievements public API (no auth needed) expose achievement conditions at https://retroachievements.org/API/API_GetGameInfoAndUserProgress.php or similar?
**Seeds:**
- https://datacrystal.tcrf.net/wiki/Street_Fighter_II_Turbo:_Hyper_Fighting_(SNES)/RAM_map
- https://www.romhacking.net/games/149/
- https://gamehacking.org/game/6694
- https://gamehacking.org/game/1
- https://www.retroachievements.org/game/1273

---

## [DONE] fiberquest-poker-games
**Priority:** HIGH
**Output:** findings/fiberquest-poker-games.md
**Goal:** Find retro poker and card games compatible with RetroAchievements and suitable for Fiber payment integration. Cover: (1) Which poker/card games exist on SNES, Genesis, NES, GBA with RA achievement sets — Texas Hold'em, Video Poker, Casino games, Blackjack, any multiplayer card games. (2) Specifically look for any with 2-player vs mode or link cable multiplayer. (3) RAM map compatibility — do poker games have clean money/chip count addresses that map naturally to Fiber channel balances? (4) The ideal case: a poker game where chip stack in RAM = Fiber channel balance in shannons — completely natural 1:1 mapping. (5) Any arcade poker/gambling games on FinalBurn Neo with RA support. (6) Consider: could we make a game where the GAME ITSELF is the channel UI? Player's chip stack IS their channel balance, updated in real time via WRITE_CORE_MEMORY as payments flow. This would be unprecedented. Rate each game: RA coverage, RAM map cleanliness, multiplayer potential, Fiber integration elegance.
**Seeds:**
- https://retroachievements.org/gameList.php?c=2&s=5&f=poker
- https://www.mobygames.com/game/snes/super-caesars-palace/
- https://gamehacking.org/system/snes
- https://www.romhacking.net/games/?name=poker&system=&region=&combo=&category=&perpage=20&page=1&submit=Go

---

## [DONE] fiberquest-online-multiplayer
**Priority:** HIGH
**Output:** findings/fiberquest-online-multiplayer.md
**Goal:** Map the landscape of online multiplayer for retro games via RetroArch Netplay and other protocols. Cover: (1) RetroArch Netplay — how it works technically (rollback vs delay-based netcode, relay servers, P2P), latency requirements per game genre, which cores support it best. (2) Which games work well over Netplay — fighters, sports, puzzle — what's the competitive scene? (3) RetroAchievements + Netplay interaction — do achievements fire for both players? Does RAM state sync between clients? (4) Kaillera, GGPO, FightCade — are any of these accessible via RetroArch cores? FightCave runs FBNeo which is a libretro core — can we hook into it? (5) Latency question: Fiber send_payment is ~20ms. Netplay adds 50-150ms. Is the combined latency acceptable for real-time per-hit payments? Or do we need to batch payments per round instead? (6) Can two players on opposite sides of the world play SF2 over Netplay with Fiber payments? What's the practical distance limit?
**Seeds:**
- https://docs.libretro.com/guides/netplay/
- https://raw.githubusercontent.com/libretro/RetroArch/master/network/netplay/netplay.h
- https://fightcade.com/
- https://www.retroachievements.org/viewtopic.php?t=1234

---

## [DONE] fiberquest-custom-protocol
**Priority:** HIGH
**Output:** findings/fiberquest-custom-protocol.md
**Goal:** Research feasibility of a custom protocol layer that connects retro console emulators with Fiber payment channels reliably. Answer: (1) What existing protocols handle real-time game state sync between emulators — GGPO rollback netcode, delay-based, what are the tradeoffs? (2) Could FiberQuest implement a lightweight custom sync protocol ON TOP of RetroArch Netplay — i.e. a sidecar that augments the existing netplay connection with payment events? (3) Alternatively: could we build a standalone game-agnostic payment event bus — two machines run RetroArch independently, our sidecar syncs game state hashes and payment triggers via a separate WebSocket channel? (4) Console-level integration: is there any way to run a Fiber-aware sidecar ON the console hardware itself (e.g., Raspberry Pi running RetroArch, Pi also runs Fiber node, all local)? (5) What would a "FiberQuest Protocol" look like — a lightweight spec for: session handshake, event message format, payment acknowledgement, dispute resolution if one client disagrees on game state? (6) Robustness: what happens if the network drops mid-game? Can we use Fiber's existing channel state as a source of truth for dispute resolution? Design the protocol as if it could become an open standard other game developers adopt.
**Seeds:**
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/README.md
- https://gafferongames.com/post/what_every_programmer_needs_to_know_about_game_networking/
- https://raw.githubusercontent.com/pond3r/ggpo/master/README.md
- https://docs.libretro.com/guides/netplay/
- https://gafferongames.com/post/introduction_to_networked_physics/

---

## [DONE] fiberquest-multiplayer-synthesis
**Priority:** LOW
**Output:** findings/fiberquest-multiplayer-synthesis.md
**Goal:** SYNTHESIS — read fiberquest-poker-games + fiberquest-online-multiplayer + fiberquest-custom-protocol findings. Produce: (1) Best poker/card game recommendations with full integration details, (2) recommended online multiplayer approach for FiberQuest — Netplay hook vs custom protocol vs hybrid, (3) the FiberQuest Protocol v0.1 spec — a concrete lightweight spec we could implement in week 2 of the hackathon, (4) updated game catalog additions from poker research, (5) honest assessment: can two players across the internet reliably play SF2 with per-hit Fiber payments? What's the architecture that makes this work? (6) What's the most impressive demo we can build in 2 weeks that showcases online multiplayer + Fiber payments?
**Seeds:**

---

## [DONE] fiberquest-embedded-node
**Priority:** HIGH
**Output:** findings/fiberquest-embedded-node.md
**Goal:** Research running CKB/Fiber nodes persistently on retro gaming hardware. Cover: (1) Can a Fiber Network Node (FNN) run on ARM SBCs that also run RetroArch? Specifically: Raspberry Pi 4/5, Orange Pi 5, Odroid, Batocera/Lakka/RetroPie distros — do they have enough RAM/CPU headroom to run FNN alongside RetroArch? What are the resource requirements of FNN (RAM, CPU, storage for chain data)? (2) CKB light client vs full node — which is feasible on these devices? Light client (ckb-light-client) is ~50MB RAM — is that viable alongside RetroArch? What's the sync time? (3) Batocera/Lakka/RetroPie — can we install arbitrary binaries/services? Batocera uses a read-only squashfs overlay, Lakka similar. How do we persist a Fiber node service across reboots on these locked-down distros? Is there a user-data partition we can write to? (4) RetroArch on RetroPie (Raspberry Pi OS based) — full OS access, systemd available — this is the most viable path. How hard is it to add a systemd service to RetroPie? (5) Alternatively: dedicated companion device — a small SBC (Pi Zero 2W, ESP32-S3) that runs only the Fiber node and communicates with the gaming machine over LAN/USB. What's the minimum viable hardware for a Fiber node? (6) What does the user setup flow look like — plug in device, scan QR code, channel funded, ready to play?
**Seeds:**
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/README.md
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/docs/en/get-started.md
- https://batocera.org/os.php
- https://raw.githubusercontent.com/libretro/Lakka-LibreELEC/master/README.md
- https://retropie.org.uk/docs/Transferring-Roms/

---

## [DONE] fiberquest-esp32s3-node
**Priority:** HIGH
**Output:** findings/fiberquest-esp32s3-node.md
**Goal:** Investigate using an ESP32-S3 (or similar) as a standalone FiberQuest companion device. Cover: (1) Can the ESP32-S3 run a CKB light client or Fiber node? It has 512KB SRAM + up to 8MB PSRAM + 16MB flash — is that enough for a light client? Probably not for a full node. What's the minimum viable embedded CKB implementation? (2) Alternative: ESP32-S3 as a HARDWARE WALLET / SIGNER only — it holds the private key and signs Fiber channel transactions, but the actual node runs on the gaming machine or cloud. This is more realistic. What would this look like? (3) USB HID / USB Serial approach: ESP32-S3 connected via USB to a gaming machine — acts as a hardware wallet dongle. User plugs it in, it identifies as a USB serial device, FiberQuest sidecar communicates with it to sign transactions. (4) BLE approach: ESP32-S3 with BLE — acts as a wireless hardware wallet. FiberQuest sidecar on gaming machine connects via BLE to request signatures. (5) What existing CKB/crypto signing implementations exist for ESP32? Can we use the existing ESP32 CKB key management from the NerdMiner CKB project or ckb-light-esp? (6) Physical form factor ideas: small PCB that clips onto a controller, or fits in a cartridge slot, or acts as a "FiberQuest cartridge". Rate feasibility for hackathon timeline.
**Seeds:**
- https://raw.githubusercontent.com/toastmanAu/NerdMiner_CKB/main/README.md
- https://raw.githubusercontent.com/toastmanAu/ckb-light-esp/main/README.md
- https://raw.githubusercontent.com/espressif/esp-idf/master/examples/peripherals/usb/device/tusb_serial_device/README.md
- https://raw.githubusercontent.com/espressif/arduino-esp32/master/libraries/BLE/README.md

---

## [DONE] fiberquest-web-client
**Priority:** HIGH
**Output:** findings/fiberquest-web-client.md
**Goal:** Research building a web-based FiberQuest client — playing FiberQuest games directly in a browser with Fiber payments. Cover: (1) WebAssembly RetroArch — RetroArch has a web player (https://web.libretro.com/), does it expose the network control interface (UDP port 55355) to JavaScript? Or can we access emulator memory via WASM exports? (2) CKB/Fiber in the browser — CCC (CKBer's Codebase) already runs in browser. Does Fiber have a browser-compatible JS SDK? Can we connect to a Fiber node via WebSocket from a browser? (3) The ideal web flow: open browser → connect JoyID wallet → game loads in browser tab → Fiber channel opens → play with per-event payments → channel settles → done. No installation required. (4) Fallback: web DASHBOARD only (no in-browser game) — browser shows live channel balance, payment feed, game state while RetroArch runs natively. This is simpler and more achievable. (5) WebRTC for P2P game state sync between two browser tabs or two machines — could replace RetroArch Netplay for certain simple games. (6) What's the lightest possible web experience — a single HTML page that connects to a local Fiber node RPC and shows live payment activity while the user plays RetroArch natively?
**Seeds:**
- https://web.libretro.com/
- https://raw.githubusercontent.com/libretro/RetroArch/master/pkg/emscripten/README.md
- https://raw.githubusercontent.com/ckb-ecell/ckb-ccc/main/README.md
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/README.md

---

## [DONE] fiberquest-hardware-synthesis
**Priority:** LOW
**Output:** findings/fiberquest-hardware-synthesis.md
**Goal:** SYNTHESIS — read fiberquest-embedded-node + fiberquest-esp32s3-node + fiberquest-web-client findings + MEMORY.md (we have Pi5, NucBox, N100 with Fiber nodes, ESP32 CKB experience via NerdMiner_CKB and ckb-light-esp). Produce: (1) Recommended hardware architecture for FiberQuest — what runs where, what's the minimum setup a player needs, (2) The "FiberQuest device" concept — what would a dedicated plug-and-play FiberQuest hardware dongle look like, is it feasible in 2 weeks as a stretch goal, (3) Web client recommendation — full browser game vs dashboard-only vs hybrid, what's achievable in 2 weeks, (4) The most impressive hardware demo possible — e.g. two handhelds playing over WiFi with Fiber payments on a visible HUD, (5) Updated hackathon scope: does hardware integration strengthen or complicate the entry? What's the right level of hardware ambition for 2 weeks?
**Seeds:**

---

## [DONE] fiberquest-console-hub-protocols
**Priority:** HIGH
**Output:** findings/fiberquest-console-hub-protocols.md
**Goal:** Research existing console multiplayer connectivity protocols that could be emulated by an ESP32-S3 or ESP32-P4 acting as a central hub. Cover each major console's link/multiplayer protocol in detail: (1) SNES Multi-tap / serial link — protocol, baud rate, signal levels, timing, what does the SNES expect to see on the serial pins? Is this SPI, UART, proprietary? (2) Game Boy Link Cable — Serial Clock, Serial Data, clock speed, master/slave arbitration, how does the GB handle 2/4 player via Game Boy Printer adapter or 4-player adapter? (3) NES Four Score / Satellite — how does the NES 4-player adapter work at the electrical/protocol level? (4) Sega Genesis 6-button controller port / Team Player — EA 4-player adapter protocol, Genesis multitap, electrical spec (DE-9 connector pinout, voltage levels). (5) N64 Joybus protocol — used for controllers, memory paks, Rumble Pak, Transfer Pak. Could an ESP32 emulate a Joybus device? (6) GBA Link Cable — what protocol? What chips? 115200 baud serial? (7) For each: what GPIO/peripheral on ESP32-S3 or ESP32-P4 could implement it? SPI, I2S, UART, RMT, bit-banging? What voltage level shifting is needed (3.3V vs 5V)? (8) Are there existing Arduino/ESP32 projects that have already done any of this? GitHub repos? (9) The prize insight: if our hub can speak native console protocols, games don't need to know about Fiber AT ALL — multiplayer just works as designed, and our hub invisibly handles the payment layer. This is extraordinary.
**Seeds:**
- https://raw.githubusercontent.com/espressif/esp-idf/master/components/driver/spi/README.md
- https://gbdev.io/pandocs/Serial_Data_Transfer_(Link_Cable).html
- https://raw.githubusercontent.com/RetroPie/RetroPie-Setup/master/README.md
- https://problemkaputt.de/fullsnes.htm
- https://wiki.nesdev.org/w/index.php/Four_Score

---

## [DONE] fiberquest-esp32p4-capabilities
**Priority:** HIGH
**Output:** findings/fiberquest-esp32p4-capabilities.md
**Goal:** Deep dive on ESP32-P4 capabilities for a console connectivity hub. The ESP32-P4 is Espressif's latest high-performance SoC. Cover: (1) CPU: dual-core RISC-V P4 at 400MHz — how does this compare to ESP32-S3 for real-time protocol emulation? Is 400MHz enough for bit-banging SNES link at the right timing? (2) Memory: 768KB SRAM + external PSRAM support up to 32MB — enough to buffer game states from multiple consoles simultaneously? (3) Peripherals: USB 2.0 HS OTG (480Mbps), MIPI CSI/DSI, SDIO, I2S, SPI x3, UART x3 — which of these map to console protocols? USB HS could connect directly to modern USB controllers/adapters. (4) GPIO: how many available for parallel console port emulation? (5) Real-time: does ESP32-P4 support real-time priority tasks suitable for microsecond-level protocol timing? (6) ESP32-P4 vs ESP32-S3 for this use case — is P4 significantly better, or is S3 sufficient? (7) Any existing console emulation projects on ESP32-P4? (8) Power: can the P4 run off USB power while also powering 4 console ports?
**Seeds:**
- https://www.espressif.com/en/news/ESP32-P4
- https://raw.githubusercontent.com/espressif/esp-idf/master/components/esp_hw_support/README.md
- https://github.com/espressif/esp-idf/tree/master/examples/peripherals/usb/host
- https://www.espressif.com/sites/default/files/documentation/esp32-p4_datasheet_en.pdf

---

## [DONE] fiberquest-hub-architecture
**Priority:** HIGH
**Output:** findings/fiberquest-hub-architecture.md
**Goal:** Design the FiberQuest Hub — a physical device based on ESP32-P4 (or S3) that acts as a central multiplayer hub for retro consoles, invisibly integrating Fiber payments. Answer: (1) Physical design: what does it look like? A box with N console controller ports + WiFi + small display? Or a dongle that plugs into one console and connects others via wireless? (2) Protocol bridge: how does it translate between console A's native protocol and console B's native protocol in real time? Does it need to re-implement the game's multiplayer logic, or just relay signals? (3) The key insight — if RetroArch is involved, we don't need to emulate hardware protocols at all! We can use RetroArch Netplay (software) + our sidecar for payments. The hardware hub becomes relevant only for REAL hardware consoles. Which approach is better for the hackathon? (4) Hybrid approach: hub supports BOTH — real hardware consoles via native protocols AND RetroArch via Netplay/UDP — same payment layer underneath. (5) What does the Fiber payment integration look like at the hub level? Hub has its own Fiber node? Or connects to a Pi? Hub holds the escrow? (6) Minimum viable hub for hackathon demo: what's the simplest hardware that proves the concept? One SNES with two controllers? Two Game Boys linked wirelessly? Two RetroArch instances + sidecar? (7) What would make this commercially viable after the hackathon? Build-to-order? Open hardware? License the protocol?
**Seeds:**
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/README.md
- https://gbdev.io/pandocs/Serial_Data_Transfer_(Link_Cable).html
- https://raw.githubusercontent.com/libretro/RetroArch/master/command.h
- https://raw.githubusercontent.com/espressif/esp-idf/master/components/driver/spi/README.md

---

## [DONE] fiberquest-existing-console-bridges
**Priority:** MEDIUM
**Output:** findings/fiberquest-existing-console-bridges.md
**Goal:** Survey existing open-source projects that bridge console protocols, emulate link cables, or connect retro hardware over IP. Find: (1) Any ESP32/Arduino projects that emulate SNES controller/link protocols. (2) GBLink-WiFi, GBLink-BLE, or similar Game Boy link cable wireless adapters — these are exactly analogous to what we want. What protocol do they use? How do they handle timing? (3) "Online NES/SNES multiplayer" projects that bridge original hardware over the internet. (4) Krikzz's products (EverDrive, etc.) — any network capabilities? (5) MiSTer FPGA — how does it handle link cable emulation? Could FiberQuest integrate with MiSTer? (6) Any patents or prior art on "console multiplayer over IP" that we should be aware of? (7) Community interest: is there a market for a wireless FiberQuest hub for real retro hardware? Check Reddit (r/retrogaming, r/SNES, r/gameboy), Discord communities. (8) What's the closest existing product to what we're describing, and how does FiberQuest differentiate?
**Seeds:**
- https://raw.githubusercontent.com/espressif/esp-idf/master/examples/peripherals/spi_slave/README.md
- https://github.com/djpohly/gblinkwifi
- https://raw.githubusercontent.com/makhowastaken/GWIZ/master/README.md
- https://api.github.com/search/repositories?q=game+boy+link+cable+wifi+esp32&sort=stars&per_page=10
- https://api.github.com/search/repositories?q=snes+link+cable+esp32&sort=stars&per_page=10
- https://api.github.com/search/repositories?q=retro+console+wifi+multiplayer&sort=stars&per_page=10

---

## [DONE] fiberquest-hub-synthesis
**Priority:** LOW
**Output:** findings/fiberquest-hub-synthesis.md
**Goal:** SYNTHESIS — read fiberquest-console-hub-protocols + fiberquest-esp32p4-capabilities + fiberquest-hub-architecture + fiberquest-existing-console-bridges findings + MEMORY.md (we have ESP32 experience via NerdMiner_CKB, ckb-light-esp, ESP32 CYD hardware). Produce: (1) Is a real hardware console protocol hub feasible in 2 weeks for the hackathon? Honest assessment. (2) What's the minimum viable hardware hub demo — the simplest thing that proves "real console + invisible Fiber payment"? (3) Recommended approach: real hardware vs RetroArch software vs hybrid — which gives best judge impact per hour of development? (4) The commercial vision post-hackathon: what is the FiberQuest Hub as a product? Who buys it, how much does it cost, what's the TAM? (5) Updated day-by-day schedule incorporating hardware hub as stretch goal — what gets cut from MVP to make room if we pursue hardware? (6) The pitch: how do you explain the hub concept to hackathon judges who may not be hardware people? One paragraph that makes it land.
**Seeds:**

---

## [DONE] fiberquest-hackathon-gap-analysis
**Priority:** SYNTHESIS
**Output:** findings/fiberquest-hackathon-gap-analysis.md
**Goal:** SYNTHESIS — Full gap analysis of all FiberQuest hackathon research completed so far. Read every findings file and MEMORY.md. Produce: (1) What we know solidly (confirmed facts, confirmed RAM addresses, confirmed Fiber RPC methods, confirmed ESP32 capabilities). (2) What is still unknown or unverified — specific gaps that could block hackathon build. Rank by risk: HIGH (blocks MVP), MEDIUM (blocks stretch goal), LOW (nice to have). (3) Critical path for the 2-week build (March 11-25): exact sequence of tasks, what depends on what, what can be parallelised. (4) Specific technical questions that still need answering before we can write code — e.g. "does RetroArch UDP work on Windows?", "what is the Fiber RPC endpoint format exactly?", "does meltSpore work for testnet NFTs?". For each: suggest exactly how to answer it (test command, specific doc URL, etc). (5) Recommended day-1 tasks for March 11 — the first things to do when hackathon opens. (6) Risks that could kill the project — what could go wrong and what's the mitigation. (7) Generate new PENDING research tasks for any HIGH or MEDIUM gaps that need external research to resolve. Use exact queue format.
**Seeds:**

---

## [DONE] fiberquest-gap-analysis-risks
**Priority:** SYNTHESIS
**Output:** findings/fiberquest-gap-analysis-risks.md
**Goal:** SYNTHESIS — Focused gap analysis for FiberQuest hackathon MVP. Read MEMORY.md and all fiberquest-* findings only (not the wider CKB research). Answer ONLY these questions: (1) What specific technical facts are still UNVERIFIED for the MVP? List each as: [RISK LEVEL] "What we assume" vs "What we actually know". Focus on: RetroArch UDP RAM reading working on the actual target OS, Fiber RPC JSON format for send_payment and open_channel, Node.js Fiber client library availability, private key management for the sidecar (how does the sidecar sign channel txs without exposing keys), whether testnet Fiber channels work reliably enough for a demo. (2) What are the 3 biggest things that could kill the project in the first 48 hours of building? For each: what's the mitigation / fallback plan? (3) Exact day-1 checklist for March 11: the first 5 things to do when hackathon opens, in order, with expected time per task. (4) Generate new PENDING research tasks for any unresolved HIGH risks. Use exact queue format with ## [NEW_TASK] ... ## [/NEW_TASK] wrappers.
**Seeds:**

---

## [DONE] fiberquest-gap-analysis-architecture
**Priority:** SYNTHESIS
**Output:** findings/fiberquest-gap-analysis-architecture.md
**Goal:** SYNTHESIS — Architecture gap analysis for FiberQuest. Read MEMORY.md and fiberquest-* + fiber-* findings. Answer: (1) Draw the exact data flow for the MVP: RetroArch → sidecar → Fiber → settlement. What calls what, in what order, with what data format? Identify every interface that needs to be implemented. (2) What does the sidecar Node.js daemon look like exactly? What npm packages? What's the main loop? Pseudo-code the core loop (poll RAM → detect event → trigger payment). (3) Key integration questions: how does the sidecar authenticate with the local Fiber node RPC? Is there auth? What port? What format (JSON-RPC? REST? gRPC?)? (4) How does channel lifecycle work for a game session: open at game start, multiple micropayments during, settle at game end — what are the exact RPC calls in sequence? (5) What's the fallback if Fiber channel opening fails at game start? Does the game just not start? Or does it run without payments and settle at end? (6) For the ESP32-P4 hub stretch goal: what's the simplest possible wiring diagram for reading one SNES controller and triggering a WiFi HTTP call to the sidecar? (7) Generate new PENDING research tasks for architecture gaps. Use exact queue format with ## [NEW_TASK] ... ## [/NEW_TASK] wrappers.
**Seeds:**


---

## [DONE] fiber-rpc-json-format-details
**Priority:** HIGH
**Output:** findings/fiber-rpc-json-format-details.md
**Goal:** Obtain concrete JSON-RPC request and response examples for `open_channel` and `send_payment` from the `nervosnetwork/fiber` repository's tests or documentation. This is crucial for building a Node.js client.
**Seeds:**
- https://github.com/nervosnetwork/fiber/tree/main/crates/fiber-lib/src/rpc
- https://github.com/nervosnetwork/fiber/tree/main/docs
- https://github.com/nervosnetwork/fiber/tree/main/tests/bruno/fiber
**Questions to answer:**
1. What are the exact JSON field names (e.g., `funding_amount` vs `fundingAmount`) and data types (e.g., `u128` as string or number) for `open_channel` parameters?
2. What are the exact JSON field names and data types for `send_payment` parameters, especially `custom_records`?
3. Are there any specific HTTP headers or JSON-RPC version requirements for these calls?

---

## [DONE] fiber-nodejs-client-feasibility
**Priority:** HIGH
**Output:** findings/fiber-nodejs-client-feasibility.md
**Goal:** Assess the effort and best approach to implement a minimal Node.js client for the Fiber RPC, given the JSON format (once known). Determine if existing generic JSON-RPC libraries are suitable.
**Seeds:**
- https://github.com/nervosnetwork/fiber
- https://www.npmjs.com/search?q=json-rpc+client
- https://github.com/ckb-ccc/ccc
**Questions to answer:**
1. What are the most suitable generic Node.js JSON-RPC client libraries for interacting with a custom RPC endpoint?
2. What are the specific challenges in adapting such a library to Fiber's RPC (e.g., transport layer: HTTP POST vs WebSocket, authentication)?
3. Estimate the development time for a minimal client supporting `open_channel` and `send_payment`.

---

## [DONE] sidecar-secure-key-management
**Priority:** HIGH
**Output:** findings/sidecar-secure-key-management.md
**Goal:** Investigate secure and practical methods for the Node.js sidecar to sign CKB transactions (specifically for Fiber channel open/close) without directly exposing private keys in the application code or environment.
**Seeds:**
- https://docs.nervos.org/
- https://github.com/ckb-ccc/ccc
- https://github.com/toastmanAu/ckb-dob-minter
- https://github.com/nervosnetwork/fiber
- https://docs.joy.id/
**Questions to answer:**
1. Can `ckb-ccc` facilitate external signing requests (e.g., to a browser-based JoyID instance or an ESP32 hardware signer) from a Node.js backend?
2. What are the best practices for securely managing a *temporary* private key for a Node.js hackathon demo (e.g., environment variables, encrypted file, in-memory only)?
3. What is the recommended flow for the Node.js sidecar to initiate an on-chain Fiber channel transaction and get it signed by an external entity (e.g., a user's JoyID wallet)?

---

## [DONE] fiber-rpc-api-verification
**Priority:** HIGH
**Output:** findings/fiber-rpc-api-verification.md
**Goal:** To obtain concrete, verifiable documentation or examples of the Fiber Network Node's RPC API, specifically for channel management (`open_channel`, `close_channel`) and payments (`send_payment`, `new_invoice`). This is critical because previous attempts to access `fiber-lib/src/rpc/README.md` and `docs/en/rpc.md` resulted in 404 errors, leaving the exact JSON-RPC structure, parameters, and return types unverified.
**Seeds:**
- https://github.com/nervosnetwork/fiber/tree/main/crates/fiber-lib/src/rpc (examine source code directly)
- https://github.com/nervosnetwork/fiber/tree/main/tests/bruno/fiber (examine Bruno test files for RPC call examples)
- https://github.com/nervosnetwork/fiber/issues (search for RPC documentation requests or examples)
**Questions to answer:**
1. What is the exact JSON-RPC request and response structure for `open_channel`? What parameters are mandatory/optional?
2. What is the exact JSON-RPC request and response structure for `send_payment`? Can it take a `recipient_node_id` directly, or is an invoice always required?
3. What is the exact JSON-RPC request and response structure for `close_channel`? What parameters are needed to initiate settlement?
4. Is there any form of authentication (e.g., API key, token) required for local RPC access (127.0.0.1)?
5. Are there any WebSocket RPC endpoints available, or is it purely HTTP POST?

---

## [DONE] fiber-node-js-client-library-search
**Priority:** MEDIUM
**Output:** findings/fiber-node-js-client-library-search.md
**Goal:** To determine if an existing or in-progress Node.js/TypeScript client library for the Fiber Network Node RPC exists. If not, identify best practices for building a custom client, including error handling and state management. This would significantly reduce development effort for the sidecar.
**Seeds:**
- https://github.com/nervosnetwork/fiber/issues?q=nodejs+client+sdk
- https://github.com/nervosnetwork/fiber/issues?q=typescript+client+sdk
- https://github.com/search?q=nervos+fiber+javascript&type=repositories
- https://github.com/search?q=nervos+fiber+typescript&type=repositories
**Questions to answer:**
1. Is there an official or community-maintained Node.js/TypeScript client library for Fiber RPC?
2. If not, what are the recommended patterns for interacting with the Fiber RPC from Node.js (e.g., raw `axios`, a wrapper class)?
3. Are there any existing examples of Fiber RPC interaction in JavaScript/TypeScript within the Nervos ecosystem?

---

## [DONE] snes-controller-protocol-deep-dive
**Priority:** MEDIUM
**Output:** findings/snes-controller-protocol-deep-dive.md
**Goal:** To acquire precise technical specifications for the SNES controller's serial communication protocol, including exact timing diagrams, bit order, and expected signal levels. This is crucial for reliably implementing the ESP32-P4 console hub stretch goal, as current findings indicate these details are missing.
**Seeds:**
- https://www.raphnet.net/electronique/snes_usb/snes_usb_en.php (often has good protocol details)
- https://www.retroleum.com/snes-controller-pinout (pinouts often come with protocol hints)
- https://www.gamefaqs.com/snes/916396-super-nintendo/faqs/10000 (search for hardware/technical FAQs)
- Datasheets for SNES controller ICs (if identifiable)
**Questions to answer:**
1. What are the precise timing requirements (in microseconds) for the Latch and Clock pulses?
2. What is the exact bit order for the 16 data bits sent by the controller (e.g., MSB first, which button corresponds to which bit)?
3. Are there any known quirks or variations in the protocol across different SNES controller revisions or third-party controllers?
4. What are the exact voltage levels for HIGH and LOW signals on the DAT, LAT, CLK lines?
---

## [DONE] fiber-rpc-raw-source
**Priority:** HIGH
**Output:** findings/fiber-rpc-raw-source.md
**Goal:** Read the actual Rust source code for Fiber RPC definitions. We need exact JSON field names, types, and serialisation for open_channel, send_payment, new_invoice, list_channels. Previous crawls only got GitHub HTML directory listings — we need the raw file contents.
**Seeds:**
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/channel.rs
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/payment.rs
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/invoice.rs
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/mod.rs
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/types.rs

---

## [DONE] snes-controller-protocol-raw
**Priority:** MEDIUM
**Output:** findings/snes-controller-protocol-raw.md
**Goal:** Get precise SNES controller serial protocol timing specs for ESP32-P4 implementation. Need: latch pulse width, clock frequency, bit order, voltage levels, button bit map.
**Seeds:**
- https://raw.githubusercontent.com/nicowillis/snes-controller/master/README.md
- https://raw.githubusercontent.com/marcin-osowski/snes_gamepad/master/README.md
- https://www.cs.columbia.edu/~sedwards/classes/2013/4840/reports/SNES.pdf
- https://raw.githubusercontent.com/MickGyver/DaemonBite-Retro-Controllers-USB/master/SNEStoUSB/SNEStoUSB.ino

---

## [DONE] esp32p4-snes-emulator-viability
**Priority:** HIGH
**Output:** findings/esp32p4-snes-emulator-viability.md
**Goal:** Research viability of running a SNES or NES emulator directly on ESP32-P4. Key questions: (1) ESP32-P4 specs vs SNES/NES requirements — CPU clock (400MHz RISC-V), RAM (768KB SRAM + PSRAM), are these sufficient? SNES CPU is 3.58MHz 65816, RAM 128KB — but emulation overhead is typically 10-50x. NES is 1.79MHz 6502, 2KB RAM — much lighter. (2) Are there existing ESP32 SNES or NES emulator projects? nofrendo (NES) runs on ESP32 original. Any SNES emulator on ESP32? SNES9x or PocketSNES has been ported to small hardware before. (3) What display would be needed? ESP32-P4 has MIPI DSI — can drive ILI9341/ST7789 or a small LCD directly. What resolution is needed for SNES (256x224)? (4) Audio: SNES has SPC700 audio chip — is software emulation of this feasible on P4 with I2S output? (5) If SNES is not viable, what about NES? nofrendo on ESP32-S3 is confirmed — P4 at 400MHz should be significantly better. (6) Critical: if the ESP32-P4 is running an emulator, what CPU headroom remains for: WiFi stack, Fiber signing (secp256k1 or blake2b hashing), CKB light client operations? Can these coexist or does emulation consume 100% of CPU? (7) Recommended architecture: emulator on one core, WiFi/payment on second core? FreeRTOS task priorities?
**Seeds:**
- https://raw.githubusercontent.com/espressif/esp-idf/master/examples/peripherals/lcd/mipi_dsi/README.md
- https://github.com/esp-arduino-libs/esp32-display-support
- https://raw.githubusercontent.com/nofrendo-esp32/nofrendo-esp32/master/README.md
- https://api.github.com/search/repositories?q=esp32+snes+emulator&sort=stars&per_page=10
- https://api.github.com/search/repositories?q=esp32+nes+emulator&sort=stars&per_page=10
- https://api.github.com/search/repositories?q=esp32-p4+emulator&sort=stars&per_page=5

---

## [DONE] esp32p4-fiber-signer-vs-lightclient
**Priority:** HIGH
**Output:** findings/esp32p4-fiber-signer-vs-lightclient.md
**Goal:** Compare two architectures for ESP32-P4 in FiberQuest: (A) Fiber Signer Only — ESP32-P4 holds private key, signs CKB L1 transactions via USB/BLE, a Pi or server runs the actual Fiber node. (B) Light Client + Signer — ESP32-P4 runs a CKB light client AND signs transactions, becoming a more autonomous node. For each: (1) What software exists? CKB light client is Rust — can it compile for RISC-V ESP32-P4? What are the binary size and RAM requirements? (2) Fiber Network Node (FNN) is also Rust — same question. FNN is heavier than just a light client. (3) Signing only: secp256k1 library for ESP32 exists (Bitcoin hardware wallets use this). Memory footprint? (4) Our existing ckb-light-esp project — what CKB operations does it already do on ESP32? Can it sign secp256k1 transactions? (5) For Fiber specifically: channel open/close = CKB L1 tx (needs signing). send_payment = off-chain message (needs signing of payment hash only, much lighter). Which operations actually need to run on-device vs can be delegated? (6) Verdict: is "signer only" sufficient for a self-contained FiberQuest device, or do you need a light client to verify channel state independently?
**Seeds:**
- https://raw.githubusercontent.com/toastmanAu/ckb-light-esp/main/README.md
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/README.md
- https://raw.githubusercontent.com/bitcoin/secp256k1/master/README.md
- https://api.github.com/search/repositories?q=esp32+secp256k1&sort=stars&per_page=10
- https://raw.githubusercontent.com/espressif/esp-idf/master/components/mbedtls/README.md

---

## [DONE] retroachievements-live-api-payment-triggers
**Priority:** HIGH
**Output:** findings/retroachievements-live-api-payment-triggers.md
**Goal:** Research using RetroAchievements (RA) data as live payment triggers for FiberQuest. Two angles: (1) RA Rich Presence protocol — RA games include Rich Presence scripts that read RAM addresses and format live game state strings (e.g. "Playing as Mario, World 1-2, Lives: 3"). These scripts are essentially pre-written RAM maps maintained by the RA community. Can we parse RA Rich Presence scripts to get RAM addresses and game state logic for free, without writing our own RAM maps? URL: https://docs.retroachievements.org/developer-docs/rich-presence.html (2) RA Achievement definitions — each achievement has conditions tied to specific RAM addresses and values. These are machine-readable. Can we parse achievement conditions to detect game events? E.g. "Player dealt damage" = perfect payment trigger. URL: https://docs.retroachievements.org/developer-docs/achievement-development-overview.html (3) RA API — is there a live/websocket API, or only a REST polling API? Can we query current game state, active achievements, rich presence string in real-time? Rate limits? Auth requirements? (4) RetroArch + RA integration — RetroArch already talks to RA servers. Can we hook into RetroArch's existing RA client to get achievement unlock events locally, without hitting the RA API at all? Is there a local event/callback system? (5) Practical: for SF2 Turbo SNES, does RA have a rich presence script that reads health values? If yes, those RAM addresses are already verified and community-maintained — we can use them directly.
**Seeds:**
- https://docs.retroachievements.org/developer-docs/rich-presence.html
- https://docs.retroachievements.org/developer-docs/achievement-development-overview.html
- https://docs.retroachievements.org/developer-docs/condition-syntax.html
- https://api.retroachievements.org/API/API_GetGameInfoAndUserProgress.php
- https://raw.githubusercontent.com/RetroAchievements/RAInterface/master/README.md

---

## [DONE] esp32p4-emulator-payment-synthesis
**Priority:** SYNTHESIS
**Output:** findings/esp32p4-emulator-payment-synthesis.md
**Goal:** SYNTHESIS — Read esp32p4-snes-emulator-viability + esp32p4-fiber-signer-vs-lightclient + retroachievements-live-api-payment-triggers + fiberquest-esp32p4-capabilities findings + MEMORY.md. Produce: (1) Is a self-contained FiberQuest device on ESP32-P4 (emulator + signer + WiFi payment) technically feasible? Give a concrete yes/no with reasoning. (2) Best architecture for a standalone device: which tasks run on which core, what's the memory budget, what gets cut if RAM is tight. (3) If RetroAchievements rich presence / achievement data gives us pre-verified RAM maps, how does this change our development speed? Quantify: instead of manually finding RAM addresses for 5 games, we get community-verified maps for 1000s of games instantly. (4) The boldest possible demo: a single ESP32-P4 device running NES/SNES, connected to a TV via HDMI/composite, two controllers plugged in, WiFi connected to Fiber, payments triggered by in-game events — is this achievable in the 2-week hackathon? What's the minimum hardware BOM? (5) Generate new research tasks for any remaining gaps.
**Seeds:**

---

## [DONE] fiberquest-game-catalog-followup-test-question
**Priority:** HIGH
**Output:** findings/fiberquest-game-catalog-followup-test-question.md
**Goal:** Follow-up research from FiberQuest Intel feedback on 'fiberquest-game-catalog'. Question: test question. Context: This is an elaboration point raised during research review. Provide detailed, technical, actionable findings. Focus on what's practically implementable within the hackathon timeframe (March 11-25 2026).
**Tags:** general, followup, fiberquest-game-catalog
**Seeds:**

---

## [DONE] fiberquest-multiplayer-synthesis-followup-follow-texas-holdem-angle-single-table-t
**Priority:** HIGH
**Output:** findings/fiberquest-multiplayer-synthesis-followup-follow-texas-holdem-angle-single-table-t.md
**Goal:** Follow-up research from FiberQuest Intel feedback on 'fiberquest-multiplayer-synthesis'. Question: Follow Texas Holdem angle. Single table tournament buy in possible? Ring games Can 9 players simultaneously interact with the same channel to facilitate poker?. Context: This is an elaboration point raised during research review. Provide detailed, technical, actionable findings. Focus on what's practically implementable within the hackathon timeframe (March 11-25 2026).
**Tags:** general, followup, fiberquest-multiplayer-synthesis
**Seeds:**

---

## [DONE] cloudflare-workers-kv-rate-limiting
**Priority:** HIGH
**Output:** findings/cloudflare-workers-kv-rate-limiting.md
**Goal:** Map the Cloudflare Workers KV API for rate limiting. We're building a Workers-based bug reporter that receives POST requests from wyltekindustries.com. Need: KV namespace setup, storing request counts per key with TTL, atomic increment patterns, wrangler CLI commands to create and bind KV namespaces. Also: what are the free tier limits for KV reads/writes, and is there a better rate-limiting primitive (Durable Objects)?
**Seeds:**
- https://raw.githubusercontent.com/cloudflare/workers-sdk/main/packages/wrangler/README.md
- https://developers.cloudflare.com/workers/runtime-apis/kv/
- https://developers.cloudflare.com/durable-objects/best-practices/create-durable-object-stubs-and-send-requests/
**Questions to answer:**
1. How do you create and bind a KV namespace via wrangler.toml?
2. Pattern for "max N requests per key per hour" using KV TTL?
3. Is Durable Objects a better fit for atomic counters than KV?
4. Free tier limits: KV reads/writes per day?
5. Can we deploy the entire rate-limited worker without a paid plan?

---

## [DONE] esp32-wifi-ota-partition-safety
**Priority:** HIGH
**Output:** findings/esp32-wifi-ota-partition-safety.md
**Goal:** Deep dive into ESP32 OTA update safety guarantees. We're implementing Telegram-triggered OTA on NerdMiner CKB (ESP32-2432S028R). Need to understand: partition table OTA slots (app0/app1/factory), rollback on failed boot, bootloader anti-rollback fuses, what happens if power is cut mid-flash, and whether huge_app.csv (our current partition scheme) supports proper OTA with rollback.
**Seeds:**
- https://raw.githubusercontent.com/espressif/esp-idf/master/docs/en/api-reference/system/ota.rst
- https://raw.githubusercontent.com/espressif/arduino-esp32/master/tools/partitions/huge_app.csv
- https://raw.githubusercontent.com/GyverLibs/FastBot/main/README_EN.md
- https://raw.githubusercontent.com/espressif/esp-idf/master/components/bootloader_support/include/esp_ota_ops.h
**Questions to answer:**
1. Does huge_app.csv include two OTA slots? If not, what partition scheme should we use?
2. How does esp_ota_mark_app_valid_cancel_rollback() work and when must we call it?
3. What happens on power cut mid-flash — will the device brick or fall back to previous?
4. Is there a FastBot-specific approach to triggering OTA with rollback support?
5. Minimum safe partition scheme for OTA + rollback on a 4MB flash ESP32?

---

## [DONE] supabase-rls-member-security-audit
**Priority:** HIGH
**Output:** findings/supabase-rls-member-security-audit.md
**Goal:** Audit the security model of our Wyltek membership system. We use Supabase with RLS, JoyID CKB address as the user identifier (no traditional auth), anon key in client-side JS. Need to understand: what an attacker can actually do with the anon key, whether our RLS policies prevent impersonation (someone submitting a bug report or like with another member's CKB address), and best practices for CKB-address-based identity in Supabase without a traditional JWT auth flow.
**Seeds:**
- https://raw.githubusercontent.com/supabase/supabase/master/apps/docs/content/guides/auth/row-level-security.mdx
- https://raw.githubusercontent.com/supabase/supabase-js/master/README.md
- https://supabase.com/docs/guides/api/api-keys
**Questions to answer:**
1. What can an attacker do with just the anon key and knowledge of table names?
2. How can we use Supabase RLS to enforce "only the owner CKB address can write their own row"?
3. Is there a JoyID / CKB address → Supabase JWT flow we should implement?
4. Can we use Supabase edge functions to verify a CKB signed message before writing?
5. What's the simplest security upgrade that prevents impersonation without full auth?

---

## [DONE] ckb-light-client-esp32-sync-performance
**Priority:** MEDIUM
**Output:** findings/ckb-light-client-esp32-sync-performance.md
**Goal:** Research the performance characteristics of the CKB light client protocol from an embedded device perspective. We have ckb-light-esp running on ESP32-P4. Need to understand: how many peers does the light client need to sync reliably, typical initial sync time for a fresh device, bandwidth usage per transaction verification, memory requirements for the filter/proof data, and whether the ESP32-P4's 32MB PSRAM is sufficient for real-world use.
**Seeds:**
- https://raw.githubusercontent.com/nervosnetwork/ckb/develop/light-client/README.md
- https://raw.githubusercontent.com/nervosnetwork/ckb-light-client/main/README.md
- https://raw.githubusercontent.com/toastmanAu/ckb-light-esp/main/README.md
- https://raw.githubusercontent.com/nervosnetwork/rfcs/master/rfcs/0031-variable-length-header-field/0031-variable-length-header-field.md
**Questions to answer:**
1. How does the light client determine which blocks to download (bloom filter size, false positive rate)?
2. Minimum peers needed for reliable sync — what happens below that threshold?
3. Estimated bandwidth per verified transaction on mainnet?
4. Memory footprint: how large is the header chain + filter chain state?
5. Is there a keep-alive / reconnection strategy needed for WiFi-prone ESP32 environments?

---

## [DONE] telegram-bot-esp32-security-hardening
**Priority:** MEDIUM
**Output:** findings/telegram-bot-esp32-security-hardening.md
**Goal:** Security hardening for our Telegram OTA bot on NerdMiner CKB. We currently whitelist by chat ID (compile-time). Research: what additional attack surface exists (replay attacks on Telegram updates, token exposure if device is physically inspected, bot token rotation procedure, rate limiting OTA triggers), and whether FastBot's update mechanism is safe from MITM on untrusted WiFi networks.
**Seeds:**
- https://raw.githubusercontent.com/GyverLibs/FastBot/main/src/FastBot.h
- https://raw.githubusercontent.com/GyverLibs/FastBot/main/src/FastBot.cpp
- https://core.telegram.org/bots/api#getupdates
- https://core.telegram.org/bots/faq#how-do-i-get-updates
**Questions to answer:**
1. Does FastBot use HTTPS for Telegram API calls on ESP32, and how is the cert validated?
2. Can an attacker replay a previously sent .bin file to trigger re-flash?
3. What's the procedure to rotate a compromised bot token on a deployed device?
4. Are there additional authentication layers beyond chat ID whitelisting worth implementing?
5. Does Telegram's API guarantee message ordering / can updates be injected?

---

## [DONE] wyltek-seo-current-audit
**Priority:** LOW
**Output:** findings/wyltek-seo-current-audit.md
**Goal:** Audit the current SEO status of wyltekindustries.com. We've recently migrated to Cloudflare, added structured pages (hardware, research, members, blog). Need: current indexing status check approach, meta tag audit across key pages, sitemap.xml completeness, structured data opportunities (JSON-LD for hardware products), and quick wins to improve discoverability for searches like "CKB ESP32", "Nervos CKB embedded", "CKB light client ESP32".
**Seeds:**
- https://raw.githubusercontent.com/toastmanAu/wyltek-industries/master/sitemap.xml
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://schema.org/Product
- https://raw.githubusercontent.com/toastmanAu/wyltek-industries/master/index.html
**Questions to answer:**
1. What JSON-LD structured data makes sense for a hardware/embedded product site?
2. Are there technical SEO issues (missing canonical, duplicate titles, missing OG tags) on key pages?
3. What's the optimal sitemap.xml structure for a site like ours?
4. What are the most valuable search terms to target given our niche?
5. Quick wins that take <1 hour to implement each?

---

## [DONE] nerdminer-ckb-pool-stats-display
**Priority:** MEDIUM
**Output:** findings/nerdminer-ckb-pool-stats-display.md
**Goal:** Research how to pull live miner stats from ViaBTC pool API and display them on the NerdMiner CKB screen. Currently we show local hashrate but not pool-side accepted shares, pool difficulty, or estimated earnings. Need: ViaBTC pool API endpoints for miner stats (if public), alternative: parse stratum responses for share accepted/rejected counts, and how existing NerdMiner v2 forks display pool stats.
**Seeds:**
- https://raw.githubusercontent.com/BitMaker-hub/NerdMiner_v2/main/src/stratum.cpp
- https://raw.githubusercontent.com/BitMaker-hub/NerdMiner_v2/main/src/stratum.h
- https://raw.githubusercontent.com/BitMaker-hub/NerdMiner_v2/main/src/monitor.cpp
- https://raw.githubusercontent.com/toastmanAu/NerdMiner_CKB/master/src/stratum.cpp
- https://viabtc.com/tools/mining_api
**Questions to answer:**
1. Does ViaBTC expose a public REST API for per-worker stats (hashrate, shares, earnings)?
2. What stratum protocol messages carry accepted/rejected share counts?
3. How does NerdMiner v2 currently track shares accepted/rejected locally?
4. What screen real estate changes are needed to show pool stats on the CYD display?
5. Is there a better pool with a more accessible API we should consider for CKB?

---

## [DONE] synthesis-stack-gap-4
**Priority:** SYNTHESIS
**Output:** findings/stack-gap-analysis-4.md
**Goal:** SYNTHESIS — Full gap analysis across all completed research (excluding FiberQuest tasks). Read MEMORY.md and all non-fiberquest findings files. Identify: (1) What parts of the Wyltek stack are well-researched and ready to build. (2) What gaps remain — things we know we need but haven't researched. (3) What new research tasks should be queued based on recent work (bug reporter, NerdMiner OTA, research page improvements, Telegram OTA, DOB minting system). (4) Any dependencies between planned features that could cause build order issues. Generate new PENDING tasks using ## [NEW_TASK] ... ## [/NEW_TASK] format for any HIGH or MEDIUM gaps.
**Seeds:**
- https://raw.githubusercontent.com/toastmanAu/ckb-light-esp/main/README.md
- https://raw.githubusercontent.com/toastmanAu/NerdMiner_CKB/master/README.md
- https://raw.githubusercontent.com/toastmanAu/wyltek-industries/master/index.html



---

## [DONE] fiber-nodejs-client-library-development
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

---

## [DONE] retroachievements-ram-map-access-strategy
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

---

## [DONE] snes-controller-protocol-implementation-details
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

---

## [DONE] ckb-ccc-external-signing-node-js-flow
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

---

## [DONE] fiber-testnet-reliability-assessment
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

---

## [DONE] esp32-p4-emulator-fiber-cpu-headroom-benchmarking
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
---

## [DONE] esp32p4-lightclient-emulator-coexistence
**Priority:** HIGH
**Output:** findings/esp32p4-lightclient-emulator-coexistence.md
**Goal:** Validate CPU/memory headroom for running ckb-light-esp (our existing CKB light client, 214KB binary, confirmed working on ESP32-P4) CONCURRENTLY with a NES/SNES emulator. We already know the light client works. The question is: can both run together without emulator frame drops? Map FreeRTOS task allocation across both cores — emulator on core 0, light client + WiFi + secp256k1 signing on core 1 — and identify any contention points (shared peripherals, WiFi interrupt load, heap fragmentation).
**Seeds:**
- https://raw.githubusercontent.com/toastmanAu/ckb-light-esp/master/src/LightClient.cpp
- https://raw.githubusercontent.com/toastmanAu/ckb-light-esp/master/src/LightClient.h
- https://raw.githubusercontent.com/toastmanAu/ckb-light-esp/master/src/core/header_chain.cpp
- https://raw.githubusercontent.com/toastmanAu/ckb-light-esp/master/src/core/block_filter.cpp
- https://raw.githubusercontent.com/toastmanAu/ckb-light-esp/master/src/core/header_chain.h
- https://raw.githubusercontent.com/toastmanAu/ckb-light-esp/master/platformio.ini
- https://raw.githubusercontent.com/espressif/esp-idf/master/examples/system/freertos/real_time_stats/main/real_time_stats_example_main.c
- https://docs.espressif.com/projects/esp-idf/en/stable/esp32p4/api-guides/performance/speed.html
**Questions to answer:**
1. What is the interrupt load of the WiFi stack on core 1 and does it interfere with emulator timing on core 0?
2. How much heap does ckb-light-esp consume at peak (header chain + filter state)?
3. Can secp256k1 signing (a one-shot ~1ms operation) be safely triggered from core 1 during emulator gameplay without causing frame drops?
4. What FreeRTOS priority levels should each task use to guarantee emulator gets consistent CPU time?
5. Is there a known pattern for "emulator on core 0, network stack on core 1" in ESP32 projects we can reference?

---

## [DONE] harvest-moon-snes-ram-map
**Priority:** HIGH
**Added:** 2026-03-05
**Goal:** Find Harvest Moon SNES RAM addresses for: gold/money balance, crop sale events, shop purchase events, shipping bin contents. Need addresses that change discretely on transaction events (not just continuously polling balance).
**Tags:** fiberquest, snes, retroarch, harvest-moon
**Seeds:**
- https://datacrystal.tcrf.net/wiki/Harvest_Moon_(SNES)/RAM_map
- https://www.retroachievements.org/game/1582
- https://raw.githubusercontent.com/RetroAchievements/RAScripts/master/SNES/HarvestMoon.lua
- https://datacrystal.tcrf.net/wiki/Harvest_Moon_(SNES)
- https://www.romhacking.net/games/306/

---

## [DONE] harvest-moon-snes-economy-mechanics
**Priority:** HIGH
**Added:** 2026-03-05
**Goal:** Map the complete economy loop of Harvest Moon SNES — what triggers money in (shipping bin overnight, selling to shops), what triggers money out (buying seeds, tools, animal feed, upgrades). Find the exact in-game transaction moments that would map to Fiber payment events. Is the money delta detectable as a single-frame RAM change?
**Tags:** fiberquest, snes, harvest-moon
**Seeds:**
- https://gamefaqs.gamespot.com/snes/564596-harvest-moon/faqs/9640
- https://gamefaqs.gamespot.com/snes/564596-harvest-moon/faqs/2883
- https://gamehacking.org/game/43127
- https://www.zophar.net/cheats/snes/harvest-moon.html
- https://tcrf.net/Harvest_Moon_(SNES)
**Context:** Gold address is 7F1F04-06 (3-byte value). 7E0010 also reported. Game Genie infinite gold code: FF8E-0F0A. Need to find: shipping bin overnight event address, shop buy event address, discrete transaction moment.

---

## [DONE] esp32p4-emulator-pause-resume-safety
**Priority:** HIGH
**Added:** 2026-03-05
**Goal:** Research safe pause/resume of SNES emulation on ESP32-P4 (FreeRTOS context). Can the emulator task be suspended cleanly mid-frame without corrupting CPU state, audio buffer, or video output? What is the minimum safe pause point (end of frame, mid-scanline, etc.)? How do existing ESP32 emulator projects handle pause? Can emulation be suspended from an external FreeRTOS task (e.g., sidecar triggering a UI overlay)?
**Tags:** fiberquest, esp32p4, emulator, freertos
**Seeds:**
- https://raw.githubusercontent.com/espressif/esp-idf/master/components/freertos/FreeRTOS-Kernel/include/freertos/task.h
- https://github.com/snes9xgit/snes9x/blob/master/docs/control.html
- https://raw.githubusercontent.com/NoRescue/SNES9x-ESP32/master/main/main.cpp
- https://docs.espressif.com/projects/esp-idf/en/latest/esp32p4/api-reference/system/freertos_idf.html
- https://raw.githubusercontent.com/mattkj/esp32-snes9x/master/main/app_main.cpp

---

## [DONE] esp32p4-persistent-overlay-framebuffer
**Priority:** HIGH
**Added:** 2026-03-05
**Goal:** Research persistent on-screen overlays on ESP32-P4 during emulation. Can a second layer/surface be composited over the emulator framebuffer in real time? Options: direct framebuffer write, hardware alpha blending (P4 has a 2D GPU / PPA), LVGL overlay on top of emulator output, or DMA-driven second layer. What is the CPU cost? Can the overlay update independently of the emulator frame rate? Can it contain touch-interactive buttons?
**Tags:** fiberquest, esp32p4, overlay, framebuffer, display, lvgl
**Seeds:**
- https://docs.espressif.com/projects/esp-idf/en/latest/esp32p4/api-reference/peripherals/ppa.html
- https://docs.espressif.com/projects/esp-lvgl-port/en/latest/esp32p4/index.html
- https://docs.lvgl.io/master/details/integration/chip/espressif.html
- https://raw.githubusercontent.com/espressif/esp-idf/master/examples/peripherals/ppa/ppa_blend/main/ppa_blend_example_main.c
- https://docs.espressif.com/projects/esp-idf/en/latest/esp32p4/api-reference/peripherals/lcd/index.html

---

## [DONE] esp32p4-touch-overlay-input-routing
**Priority:** MEDIUM
**Added:** 2026-03-05
**Goal:** When an overlay UI is active on ESP32-P4 (e.g., a Fiber wallet panel or buy/sell menu), how do touch input events get routed — to the overlay UI vs. the emulator controller input? Can touch be intercepted cleanly when overlay is visible, then returned to emulator when dismissed? What touch controller ICs are common on P4 dev boards and what drivers are available?
**Tags:** fiberquest, esp32p4, touch, input, overlay
**Seeds:**
- https://docs.espressif.com/projects/esp-idf/en/latest/esp32p4/api-reference/peripherals/lcd/index.html
- https://docs.espressif.com/projects/esp-lvgl-port/en/latest/esp32p4/index.html
- https://raw.githubusercontent.com/espressif/esp-bsp/master/components/esp_lvgl_port/src/lvgl9/esp_lvgl_port_touch.c
- https://docs.lvgl.io/master/details/main-components/indev.html

---

## [DONE] retrofit-economy-design-patterns
**Priority:** HIGH
**Added:** 2026-03-05
**Goal:** Research design patterns and prior art for adding an economy layer to existing games that never had one. Specifically: (1) can RAM watching + event detection be generalised to any SNES game (not just Harvest Moon)? (2) What game state variables make good "economic primitives" — health as collateral, score as earnings, lives as stake? (3) Is there prior art of blockchain/crypto economies overlaid on retro games? (4) What makes a compelling "retrofitted economy" — what game mechanics translate naturally to earn/spend models? (5) Could this concept be packaged as a reusable framework (FiberQuest SDK) that lets anyone add a Fiber economy to any ROM?
**Tags:** fiberquest, economy, design, framework, retro
**Seeds:**
- https://raw.githubusercontent.com/libretro/RetroArch/master/network/net_retropad/net_retropad_core.c
- https://raw.githubusercontent.com/libretro/RetroArch/master/cores/README.md
- https://docs.libretro.com/development/cores/developing-cores/
- https://docs.libretro.com/guides/retroachievements/
- https://arxiv.org/abs/2301.00000

---

## [DONE] snes9x-fork-architecture-extensibility
**Priority:** HIGH
**Added:** 2026-03-05
**Goal:** Assess Snes9x (or equivalent BSD/MIT licensed SNES emulator) as a fork base for FiberQuest. Key questions: (1) What is the license? (2) Where does the main emulation loop live — what callback/hook points exist for frame-complete, memory-write events, save-state? (3) Is there an existing plugin or extension API? (4) How is display output handled — can we inject a compositing layer? (5) How is input handled — can we intercept/redirect? (6) What is the build system (cmake, autoconf)? (7) Is there an ESP32 port already (Snes9x-ESP32)?
**Tags:** fiberquest, snes9x, emulator, fork, architecture
**Seeds:**
- https://raw.githubusercontent.com/snes9xgit/snes9x/master/LICENSE
- https://raw.githubusercontent.com/snes9xgit/snes9x/master/README.md
- https://raw.githubusercontent.com/snes9xgit/snes9x/master/snes9x.cpp
- https://raw.githubusercontent.com/snes9xgit/snes9x/master/port.h
- https://raw.githubusercontent.com/snes9xgit/snes9x/master/apu/apu.cpp

---

## [DONE] fiberquest-ram-maps-multi-game
**Priority:** HIGH
**Added:** 2026-03-05
**Goal:** Find RAM addresses for 4 additional SNES games to build the FiberQuest multi-game economy pack. Games: (1) Super Mario World — coins, lives, score; (2) Super Bomberman — player health/alive status, kill counter; (3) International Superstar Soccer Deluxe — score per team, goal event; (4) Zelda: A Link to the Past — rupees (money), shop purchase event, enemy kill. Need discrete event detection addresses, not just static state.
**Tags:** fiberquest, snes, ram-map, economy
**Seeds:**
- https://datacrystal.tcrf.net/wiki/Super_Mario_World_(SNES)/RAM_map
- https://datacrystal.tcrf.net/wiki/The_Legend_of_Zelda:_A_Link_to_the_Past/RAM_map
- https://www.zophar.net/cheats/snes/super-mario-world.html
- https://www.zophar.net/cheats/snes/the-legend-of-zelda-a-link-to-the-past.html
- https://gamehacking.org/game/7740
- https://gamehacking.org/game/6871

---

## [DONE] fiberquest-sdk-design
**Priority:** HIGH
**Added:** 2026-03-05
**Goal:** Design the FiberQuest SDK architecture — the reusable framework that lets anyone add a Fiber economy to any SNES ROM without touching emulator C code. Key questions: (1) What does the RAM map JSON schema look like? (2) What does the payment rules config look like (trigger condition, direction IN/OUT, amount formula, debounce, label)? (3) How does the SDK expose events to the overlay and to Fiber? (4) What does "adding a new game" look like as a developer workflow? (5) How does the SDK handle bidirectional channels (both earn and spend in same session)? Design this to be publishable as an npm package or C header.
**Tags:** fiberquest, sdk, design, framework
**Seeds:**
- https://raw.githubusercontent.com/libretro/RetroArch/master/network/net_retropad/net_retropad_core.c
- https://docs.libretro.com/development/cores/developing-cores/
- https://raw.githubusercontent.com/RetroAchievements/rcheevos/master/include/rcheevos.h
- https://raw.githubusercontent.com/RetroAchievements/rcheevos/master/src/rcheevos/rc_runtime.c


---

## [DONE] electron-node-ipc-retroarch-pattern
**Priority:** HIGH
**Added:** 2026-03-05
**Goal:** Research Electron architecture for FiberQuest — specifically: (1) How to run UDP socket (RetroArch poller) in Electron main process and push events to renderer via IPC; (2) Best pattern for real-time event streaming main→renderer (ipcMain/ipcRenderer vs WebSocket localhost vs contextBridge); (3) Electron packaging for Mac/Windows/Linux (electron-builder vs electron-forge, auto-update); (4) How to bundle a Node.js backend (Fiber RPC client, UDP poller) cleanly inside Electron without exposing Node APIs to renderer; (5) Any existing Electron apps that wrap a game companion/overlay as reference pattern.
**Tags:** fiberquest, electron, ipc, packaging
**Seeds:**
- https://raw.githubusercontent.com/electron/electron/main/docs/tutorial/ipc.md
- https://www.electronjs.org/docs/latest/tutorial/ipc
- https://raw.githubusercontent.com/electron/forge/main/README.md
- https://raw.githubusercontent.com/electron-userland/electron-builder/master/README.md
- https://www.electronjs.org/docs/latest/tutorial/context-isolation

---

## [DONE] fiberquest-ui-design-patterns
**Priority:** MEDIUM
**Added:** 2026-03-05
**Goal:** Research UI design patterns for a retro gaming + crypto payment companion app. Specifically: (1) What HUD overlay layouts work alongside a game window — sidebar panel, floating widget, picture-in-picture? (2) Best CSS/JS animation patterns for real-time payment notifications (slide-in toast, number ticker, pulse effect); (3) Retro-meets-crypto visual aesthetics — pixel fonts, scanline effects, dark terminal theme with neon accents; (4) React vs plain HTML/CSS for Electron renderer — which is faster to build and looks better for a hackathon; (5) Any reference apps with great "live transaction feed" UI (crypto trading terminals, stream overlays like StreamElements).
**Tags:** fiberquest, ui, electron, design
**Seeds:**
- https://www.electronjs.org/docs/latest/tutorial/performance
- https://raw.githubusercontent.com/streamelements/live-overlay/master/README.md
- https://fonts.google.com/?category=Monospace
- https://animate.style/
- https://raw.githubusercontent.com/nicedoc/nicedoc/master/README.md

---

## [DONE] pi5-retropie-setup-on-pios
**Priority:** HIGH
**Added:** 2026-03-05
**Goal:** Complete setup guide for Pi 5 running RetroPie on Pi OS Bookworm 64-bit. Key questions: (1) Does the official RetroPie installer script support Pi 5 yet, or is there a fork/workaround? (2) What are the exact install steps — which packages, which script version? (3) Does RetroArch run well on Pi 5 with VideoCore VII / v3d driver? (4) Any known issues with Pi OS Bookworm + RetroPie? (5) Best SNES core for Pi 5 (snes9x vs bsnes vs mesen-s)?
**Tags:** fiberquest, pi5, retropie, retroarch, setup
**Seeds:**
- https://retropie.org.uk/docs/Raspberry-Pi-5/
- https://raw.githubusercontent.com/RetroPie/RetroPie-Setup/master/README.md
- https://raw.githubusercontent.com/RetroPie/RetroPie-Setup/master/retropie_setup.sh
- https://www.raspberrypi.com/documentation/computers/os.html
- https://retropie.org.uk/docs/First-Installation/

---

## [DONE] pi5-hdmi-touch-1024x600-config
**Priority:** HIGH
**Added:** 2026-03-05
**Goal:** Pi 5 config.txt settings for a 1024x600 HDMI touchscreen display. Key questions: (1) Exact hdmi_group, hdmi_mode or hdmi_cvt settings for 1024x600; (2) Touch driver setup — common ICs used on 1024x600 HDMI touchscreens (FT5406, GT911, USB HID); (3) Touch calibration on Pi OS Bookworm (Wayland vs X11 differences); (4) Display rotation if needed; (5) Any known Pi 5 config.txt syntax changes from Pi 4 (Pi 5 uses different dtparam/dtoverlay syntax).
**Tags:** fiberquest, pi5, display, touch, config
**Seeds:**
- https://www.raspberrypi.com/documentation/computers/config_txt.html
- https://raw.githubusercontent.com/raspberrypi/firmware/master/boot/overlays/README
- https://www.raspberrypi.com/documentation/computers/raspberry-pi.html
- https://forums.raspberrypi.com/viewtopic.php?t=364817

---

## [DONE] pi5-gpio-fan-mosfet-control
**Priority:** MEDIUM
**Added:** 2026-03-05
**Goal:** GPIO fan control on Pi 5 via MOSFET. Key questions: (1) Which dtoverlay controls GPIO fan on Pi 5 — is it still gpio-fan or has it changed? (2) What config.txt lines control the temperature thresholds and GPIO pin? (3) PWM fan control vs simple on/off — which is better for a MOSFET-switched fan? (4) Does Pi 5's RP1 IO controller change any GPIO fan setup vs Pi 4? (5) Software PWM via pigpio vs hardware PWM for smooth fan speed control.
**Tags:** fiberquest, pi5, gpio, fan, cooling
**Seeds:**
- https://raw.githubusercontent.com/raspberrypi/firmware/master/boot/overlays/README
- https://www.raspberrypi.com/documentation/computers/config_txt.html
- https://www.raspberrypi.com/documentation/computers/raspberry-pi.html
- https://gpiozero.readthedocs.io/en/latest/api_output.html

---

## [DONE] pi5-electron-app-autolaunch
**Priority:** HIGH
**Added:** 2026-03-05
**Goal:** Auto-launch setup for Pi 5 demo machine — RetroArch + FiberQuest Electron app on boot, no desktop interaction needed. Key questions: (1) Best autostart method on Pi OS Bookworm with Wayland (autostart file vs systemd user service vs labwc autostart); (2) How to launch Electron AppImage on Pi OS — ARM64 AppImage support, dependencies; (3) Launch order: RetroArch first, then FiberQuest after N seconds delay; (4) Display compositor for side-by-side windows at 1024x600 — can both apps share screen cleanly? (5) Kiosk mode options — hide taskbar, disable screen blanking, keep both windows always on top.
**Tags:** fiberquest, pi5, electron, autostart, kiosk
**Seeds:**
- https://www.raspberrypi.com/documentation/computers/configuration.html
- https://www.electronjs.org/docs/latest/tutorial/linux-desktop-actions
- https://raw.githubusercontent.com/electron/electron/main/docs/api/app.md
- https://specifications.freedesktop.org/autostart-spec/latest/

---

## [DONE] retroarch-network-commands-exact-protocol
**Priority:** HIGH
**Added:** 2026-03-05
**Goal:** Exact UDP protocol for RetroArch READ_CORE_MEMORY network command — needed to implement the FiberQuest sidecar correctly. Key questions: (1) Exact UDP packet format for READ_CORE_MEMORY request — is it plaintext or binary? (2) Exact response format — how is data returned, encoding? (3) How to enable network commands in RetroArch config (retroarch.cfg settings); (4) Is there a keepalive or connection concept, or is each read stateless? (5) WRITE_CORE_MEMORY format — useful for resetting state or injecting values for demo purposes; (6) Any rate limit or timing constraints on polling frequency?
**Tags:** fiberquest, retroarch, network, protocol, sidecar
**Seeds:**
- https://raw.githubusercontent.com/libretro/RetroArch/master/command.c
- https://raw.githubusercontent.com/libretro/RetroArch/master/network/net_http.c
- https://raw.githubusercontent.com/libretro/RetroArch/master/command.h
- https://retropie.org.uk/docs/RetroArch-Network-Commands/
- https://raw.githubusercontent.com/libretro/RetroArch/master/retroarch.cfg


---

## [DONE] fiberquest-retroarch-memory-read-empirical
**Priority:** HIGH
**Added:** 2026-03-06
**Goal:** Find the exact empirical wire format for RetroArch READ_CORE_MEMORY network commands by reading existing working implementations. The web crawl of command.c couldn't confirm the exact format. Need real-world usage examples that have been tested. Key questions: (1) Exact plaintext format of READ_CORE_MEMORY request — is it "READ_CORE_MEMORY 0xADDR SIZE" or different? (2) Exact response format — "0xADDR=0xVALUE\n" or different? (3) WRITE_CORE_MEMORY request and response format? (4) retroarch.cfg keys to enable network commands (network_cmd_enable, network_cmd_port)? (5) Any working Node.js or Python snippets that have been confirmed working?
**Tags:** fiberquest, retroarch, network-commands, memory, sidecar
**Seeds:**
- https://raw.githubusercontent.com/libretro/RetroArch/master/network/net_retropad/net_retropad_core.c
- https://raw.githubusercontent.com/RetroPie/RetroPie-Setup/master/scriptmodules/emulators/retroarch.sh
- https://retropie.org.uk/docs/RetroArch-Network-Commands/
- https://raw.githubusercontent.com/nicowillis/retroarch-memory/master/README.md
- https://raw.githubusercontent.com/libretro/RetroArch/master/tasks/task_netplay_lan.c

---

## [DONE] fiberquest-fiber-rpc-node-client
**Priority:** HIGH
**Added:** 2026-03-06
**Goal:** Build a minimal working Node.js Fiber RPC client. The JSON-RPC format for the Fiber node (fnn) is documented but not verified from Node.js. Need: (1) Exact curl examples for open_channel, send_payment, list_channels, close_channel that confirm working JSON format against a real fnn node; (2) Any existing Node.js Fiber RPC clients or wrappers (npm packages, GitHub repos); (3) Error response format — what does fnn return on invalid params? (4) Does fnn require authentication (API key, JWT) or is it open localhost-only? (5) Invoice format for send_payment — does it use BOLT11-style or CKB-native format?
**Tags:** fiberquest, fiber, rpc, nodejs, client
**Seeds:**
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/README.md
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/docs/rpc.md
- https://api.github.com/repos/nervosnetwork/fiber/contents/src/rpc
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/src/rpc/types.rs
- https://raw.githubusercontent.com/nervosnetwork/fiber-scripts/main/README.md

---

## [DONE] fiberquest-sf2-ram-addresses
**Priority:** HIGH
**Added:** 2026-03-06
**Goal:** Find confirmed working RAM addresses for Street Fighter II Turbo (SNES) for use in FiberQuest. Previous architecture synthesis suggested P1 health ~0x0530 but this needs verification from actual RAM maps. Key questions: (1) P1 health address, P2 health address, and byte size/encoding; (2) Round timer address; (3) Match win counter per player; (4) Current screen/mode address (title screen vs fight vs continue screen) for detecting game state; (5) Are these addresses consistent across all SF2 Turbo regions (USA/JP/EUR)?
**Tags:** fiberquest, sf2, snes, ram-map, game-state
**Seeds:**
- https://datacrystal.tcrf.net/wiki/Street_Fighter_II_Turbo:_Hyper_Fighting/RAM_map
- https://www.retroachievements.org/game/1185
- https://raw.githubusercontent.com/RetroAchievements/RAScripts/master/SNES/StreetFighterIITurbo.lua
- https://gamehacking.org/game/5894
- https://www.zophar.net/cheats/snes/street-fighter-ii-turbo-hyper-fighting.html

---

## [DONE] fiberquest-retropie-pi5-status
**Priority:** HIGH
**Added:** 2026-03-06
**Goal:** Determine current Pi 5 support status for RetroPie and best SNES emulation setup. Previous crawl got a Cloudflare block on the Pi5 docs page. Key questions: (1) Does the official RetroPie installer support Pi 5 + Pi OS Bookworm (Dec 2024 status)? (2) If not officially supported, what's the recommended approach — manual RetroArch install via apt, or a fork? (3) Best SNES core on Pi5 (snes9x vs bsnes-mercury vs mesen-s) for accuracy + performance? (4) Any known issues with RetroArch + Wayland on Pi OS Bookworm? (5) Side-by-side window setup — can RetroArch run in a window (not fullscreen) alongside an Electron app?
**Tags:** fiberquest, pi5, retropie, retroarch, snes, setup
**Seeds:**
- https://retropie.org.uk/docs/Raspberry-Pi-5/
- https://github.com/RetroPie/RetroPie-Setup/discussions
- https://raw.githubusercontent.com/RetroPie/RetroPie-Setup/master/scriptmodules/emulators/retroarch.sh
- https://forums.libretro.com/t/retroarch-pi5-wayland/
- https://raw.githubusercontent.com/libretro/RetroArch/master/Makefile.griffin

---

## [DONE] fiberquest-electron-sidecar-scaffold
**Priority:** MEDIUM
**Added:** 2026-03-06
**Goal:** Research best practices for the FiberQuest Electron app structure — specifically co-locating the UDP poller and Fiber RPC client in the main process. Key questions: (1) Best pattern for long-running background loops in Electron main process (setInterval vs worker threads vs child_process); (2) How to handle UDP socket cleanup on app quit (app.on('before-quit')); (3) Error handling pattern — what happens if Fiber node is unreachable at startup? (4) How to bundle a Node.js app as Electron without webpack (electron-builder with asar); (5) ARM64 AppImage size — typical Electron app, how big?
**Tags:** fiberquest, electron, sidecar, architecture, nodejs
**Seeds:**
- https://raw.githubusercontent.com/electron/electron/main/docs/api/app.md
- https://raw.githubusercontent.com/electron/electron/main/docs/tutorial/process-model.md
- https://www.electronjs.org/docs/latest/tutorial/performance
- https://raw.githubusercontent.com/electron-userland/electron-builder/master/packages/electron-builder/README.md
- https://raw.githubusercontent.com/nicedoc/nicedoc/master/README.md

---

## [DONE] fiberquest-hackathon-submission-prep
**Added:** 2026-03-06
**Priority:** HIGH
**Added:** 2026-03-06
**Goal:** Research the Fiber Network hackathon submission requirements, judging rubric, and prior winning entries to optimise FiberQuest's positioning. Mission brief says "agent-based application on CKB and/or Fiber/Perun Network". Key questions: (1) Exact judging criteria and weightings — how is "agent-based" defined, what does autonomy mean to judges? (2) What makes a strong agent submission vs a basic Fiber app? (3) Prior Nervos/Fiber hackathon winning entries — what patterns made them stand out? (4) Video demo requirements — length, format, what to show? (5) How important is deployed/live demo vs code-only? (6) How should we frame FiberQuest's sidecar as an autonomous payment agent to maximise score?
**Tags:** fiberquest, hackathon, submission, nervos, judging
**Seeds:**
- https://dorahacks.io/hackathon/fiber-network
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/README.md
- https://www.nervos.org/blog
- https://raw.githubusercontent.com/nervosnetwork/awesome-nervos/main/README.md
- https://dorahacks.io/hackathon/nervos

---

## [DONE] fiberquest-live-ui-reference-design
**Priority:** LOW
**Added:** 2026-03-06
**Goal:** Find concrete UI references for the FiberQuest overlay — retro gaming meets live crypto payment feed. Key questions: (1) Examples of well-designed live transaction/payment feeds in crypto UIs (explorers, trading terminals); (2) Stream overlay design patterns — OBS overlays, StreamLabs widgets that show live events; (3) CSS techniques for CRT/scanline effects, phosphor glow, pixel-perfect retro fonts; (4) Number ticker animation libraries for JS (CountUp.js or similar); (5) Color palettes that feel both retro-gaming and crypto-native (dark bg, neon green/cyan accents).
**Tags:** fiberquest, ui, design, overlay, css, retro
**Seeds:**
- https://raw.githubusercontent.com/nicedoc/nicedoc/master/README.md
- https://fonts.google.com/specimen/Press+Start+2P
- https://animate.style/
- https://raw.githubusercontent.com/inorganik/CountUp.js/master/README.md
- https://raw.githubusercontent.com/streamlabs-obs/streamlabs-obs/master/README.md


---

## [DONE] nervos-ecosystem-deep-dive
**Priority:** HIGH
**Added:** 2026-03-06
**Goal:** Comprehensive map of the current Nervos/CKB ecosystem — what exists, what's being built, what's missing. This feeds strategic decisions about where Wyltek can plug gaps and create the most impact. Cover: (1) Layer 1 primitives — cell model, lock scripts, type scripts, UDT standards (xUDT, SUDT), Spore/DOB protocol, what's production-ready vs experimental; (2) Layer 2 — Fiber Network state, RGB++ bridge status, Bitcoin L2 activity on CKB; (3) Developer tooling — CCC, Lumos, ckb-sdk-js, ckb-sdk-rust, spore-sdk, CKB light client — gaps and pain points; (4) Wallet landscape — JoyID, Neuron, MetaMask CKB plugin — what wallet coverage exists for dApps; (5) Indexer/data layer — CKB Explorer, ckb-indexer, lightnode, what data APIs exist for app developers; (6) DeFi / DEX — what financial primitives exist natively (UTXOSwap, any AMMs, lending?); (7) NFT/content ecosystem — Spore collections, DOB issuers, what's launched on mainnet; (8) Gaming — any existing gaming projects on CKB, what's the state of play; (9) Identity — DID standard, .bit domains, adoption; (10) Community + developer activity — active builders, GitHub activity, hackathon history. Conclude with: what are the 5 biggest missing ingredients for CKB to reach widespread use?
**Tags:** nervos, ckb, ecosystem, strategy, architecture
**Seeds:**
- https://raw.githubusercontent.com/nervosnetwork/awesome-nervos/main/README.md
- https://raw.githubusercontent.com/nervosnetwork/rfcs/main/README.md
- https://raw.githubusercontent.com/nervosnetwork/docs.nervos.org/develop/docs/ecosystem/projects.md
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/README.md
- https://raw.githubusercontent.com/sporeprotocol/spore-sdk/main/README.md
- https://raw.githubusercontent.com/ckb-ccc/ccc/main/README.md
- https://raw.githubusercontent.com/nervosnetwork/ckb/develop/README.md

---

## [DONE] nervos-missing-ingredients-analysis
**Priority:** HIGH
**Added:** 2026-03-06
**Goal:** Deep analysis of what CKB is missing for widespread developer and user adoption — infrastructure gaps, UX gaps, ecosystem gaps. Specific angles: (1) Onboarding — how hard is it for a new developer to ship their first CKB dApp today vs Ethereum/Solana? What's the friction? (2) Tooling gaps — what does every Ethereum dev take for granted (Hardhat, Foundry, The Graph, ethers.js, OpenZeppelin) that doesn't exist on CKB? (3) Mobile — is there a CKB mobile SDK? Can you build a React Native app that interacts with CKB? (4) Gasless UX — does CKB have meta-transactions or account abstraction for removing the "user needs CKB to do anything" UX problem? (5) Oracle infrastructure — is there a Chainlink equivalent on CKB? Any price feeds? (6) Cross-chain bridges — what's the state of bridging USDC, ETH, BTC onto CKB for liquidity? (7) Smart contract composability — how does CKB's cell model compare to EVM composability? What patterns exist for multi-contract interactions? (8) Data availability — can you store meaningful app state on CKB cheaply, or does the capacity model make this prohibitive? (9) Event/notification infrastructure — how do apps listen for on-chain events without running a full node? (10) Testing infrastructure — is there a CKB devnet/testnet that's easy to spin up locally?
**Tags:** nervos, ckb, gaps, adoption, dx, infrastructure
**Seeds:**
- https://raw.githubusercontent.com/nervosnetwork/rfcs/main/rfcs/0022-transaction-structure/0022-transaction-structure.md
- https://raw.githubusercontent.com/nervosnetwork/rfcs/main/rfcs/0009-vm-syscalls/0009-vm-syscalls.md
- https://raw.githubusercontent.com/nervosnetwork/docs.nervos.org/develop/docs/basics/introduction.md
- https://raw.githubusercontent.com/ckb-devrel/ckb-devkit/main/README.md
- https://raw.githubusercontent.com/cryptape/kuai/main/README.md
- https://raw.githubusercontent.com/ckb-ecell/axon/main/README.md
- https://raw.githubusercontent.com/rgb-org/rgb-core/main/README.md

---

## [DONE] nervos-rgb-plus-plus-deep-dive
**Priority:** HIGH
**Added:** 2026-03-06
**Goal:** Deep dive into RGB++ — CKB's isomorphic binding protocol that links Bitcoin UTXOs to CKB cells. This is potentially the biggest unlock for mass adoption (Bitcoin L2 narrative). Cover: (1) How does RGB++ work technically — what does "isomorphic binding" mean, how are Bitcoin UTXOs mapped to CKB cells? (2) What transactions can you do with RGB++ assets — transfer, DeFi, NFT minting? (3) What assets are currently live on RGB++ (xUDT tokens, DOBs, other)? (4) Developer experience — how do you build an RGB++ dApp? What SDKs exist? (5) User experience — what wallet handles RGB++ assets? Does the user need to know about CKB at all? (6) Current limitations and roadmap — what doesn't work yet? (7) Strategic importance: does RGB++ give CKB a Bitcoin L2 story that could drive mainstream builder interest? (8) Comparison to other Bitcoin L2s (Lightning, Ordinals, Stacks, Merlin) — what's CKB's unique position?
**Tags:** nervos, ckb, rgb++, bitcoin, l2, ecosystem
**Seeds:**
- https://raw.githubusercontent.com/ckb-cell/rgbpp-sdk/main/README.md
- https://raw.githubusercontent.com/ckb-cell/rgbpp-sdk/main/docs/rgb++.md
- https://raw.githubusercontent.com/nervosnetwork/rfcs/main/rfcs/0045-rgb-plus-plus/0045-rgb-plus-plus.md
- https://raw.githubusercontent.com/ckb-devrel/rgbpp-primer/main/README.md
- https://raw.githubusercontent.com/ckb-cell/utxo-global-wallet/main/README.md

---

## [DONE] nervos-wyltek-opportunity-map
**Priority:** MEDIUM
**Added:** 2026-03-06
**Goal:** SYNTHESIS — after nervos-ecosystem-deep-dive, nervos-missing-ingredients-analysis, and nervos-rgb-plus-plus-deep-dive are done, synthesise into a strategic opportunity map for Wyltek. Which gaps align with Wyltek's existing stack (embedded hardware, CKB tooling, Fiber integration, DOB minting, web5 identity)? Rank opportunities by: (1) impact on ecosystem (filling a gap many builders need), (2) alignment with Wyltek's skills/assets, (3) time to ship (days vs months), (4) defensibility (is this something only Wyltek can credibly build?). Output: top 5 opportunities Wyltek should pursue in the next 3 months, with concrete first steps for each.
**Tags:** nervos, wyltek, strategy, opportunities, roadmap
**Seeds:** (internal — reads nervos findings + MEMORY.md)


---

## [DONE] fiberquest-tournament-onchain-cell-design
**Priority:** HIGH
**Added:** 2026-03-06
**Goal:** Deep dive into CKB cell model for tournament on-chain objects. Key questions: (1) How do you design a Type Script that enforces a state machine (OPEN→LOCKED→ACTIVE→SETTLED) — what does the script validation logic look like in pseudo-code? (2) How do you link two cells (tournament cell + escrow cell) by ID and enforce that both are consumed together in settlement tx? (3) What is the minimum cell capacity needed for a tournament cell with ~500 bytes of JSON data? (4) How does the "editable until lock_time" pattern work — can a Type Script read the current block timestamp to enforce time-based rules? (5) How do you return cell capacity to the owner on settlement (cell consumption → owner output)? (6) Any existing CKB projects using similar state machine cell patterns to reference?
**Tags:** fiberquest, tournament, ckb, cell-model, type-script, on-chain
**Seeds:**
- https://raw.githubusercontent.com/nervosnetwork/rfcs/main/rfcs/0022-transaction-structure/0022-transaction-structure.md
- https://raw.githubusercontent.com/nervosnetwork/rfcs/main/rfcs/0009-vm-syscalls/0009-vm-syscalls.md
- https://raw.githubusercontent.com/sporeprotocol/spore-sdk/main/README.md
- https://raw.githubusercontent.com/nervosnetwork/rfcs/main/rfcs/0019-data-structures/0019-data-structures.md
- https://raw.githubusercontent.com/ckb-ccc/ccc/main/README.md

---

## [DONE] fiberquest-tournament-escrow-patterns
**Priority:** HIGH
**Added:** 2026-03-06
**Goal:** Research patterns for multi-party escrow on CKB — specifically for tournament prize pools that accumulate entry fees from multiple players and distribute to winners. Key questions: (1) What's the cleanest pattern for an escrow cell that grows as players register (each registration tx adds to the escrow balance)? (2) How do you enforce entry fee payment atomically with tournament cell registration in a single tx? (3) For entry-fee-only tournaments, how do you prove the escrow balance = sum of all entry fees on-chain? (4) What's the best pattern for batch payouts — one tx that outputs to N winners simultaneously? (5) How do you handle automatic refunds if min_players not met — can a Type Script enforce this, or does it require the agent to initiate the tx? (6) Any Fiber Network patterns for holding funds in escrow pending a future event?
**Tags:** fiberquest, tournament, escrow, ckb, multi-party, payout
**Seeds:**
- https://raw.githubusercontent.com/nervosnetwork/rfcs/main/rfcs/0023-dao-deposit-withdraw/0023-dao-deposit-withdraw.md
- https://raw.githubusercontent.com/nervosnetwork/rfcs/main/rfcs/0022-transaction-structure/0022-transaction-structure.md
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/docs/rpc.md
- https://raw.githubusercontent.com/ckb-ccc/ccc/main/packages/core/src/ckb/transaction.ts
- https://raw.githubusercontent.com/nervosnetwork/ckb-system-scripts/main/c/secp256k1_blake160_sighash_all.c

---

## [DONE] fiberquest-retroarch-multi-session
**Priority:** MEDIUM
**Added:** 2026-03-06
**Goal:** Research running multiple RetroArch instances simultaneously for multi-player tournament monitoring. Key questions: (1) Can you run multiple RetroArch instances on the same machine with different UDP ports (e.g. 55355, 55356, 55357)? (2) How do you configure separate retroarch.cfg files per instance with different network command ports? (3) For LAN tournament play — can multiple Pi5s each run one RetroArch instance and the agent monitors all of them remotely via UDP? (4) RetroArch netplay — does it allow synchronized game state across multiple clients? If so, can you poll RAM from the netplay host? (5) What's the maximum number of simultaneous instances that a Pi5 can handle? (6) For the demo: what's the simplest way to simulate 2-player tournament on a single Pi5?
**Tags:** fiberquest, tournament, retroarch, multi-session, netplay, pi5
**Seeds:**
- https://retropie.org.uk/docs/RetroArch-Network-Commands/
- https://raw.githubusercontent.com/libretro/RetroArch/master/network/netplay/netplay_frontend.c
- https://raw.githubusercontent.com/libretro/RetroArch/master/README.md
- https://retropie.org.uk/docs/Netplay/
- https://raw.githubusercontent.com/libretro/RetroArch/master/config.def.h

---

## [DONE] fiberquest-tournament-ui-design
**Priority:** MEDIUM
**Added:** 2026-03-06
**Goal:** Research UI patterns for a tournament creation and browsing page in an Electron app. Key questions: (1) Best UX patterns for a multi-step tournament creation wizard (type → parameters → funding → confirm → on-chain submit)? (2) How to display a live-updating prize pool that grows as players register (polling Supabase or CKB indexer)? (3) Tournament bracket / leaderboard visualisation patterns for 2–8 players — what libraries or CSS patterns work well? (4) How to display on-chain cell data in a readable way (tournament status, edit history for editable tournaments, settlement tx links)? (5) Progress indicators for async blockchain txs (submitted → confirmed → live)? (6) Mobile-responsive tournament card grid patterns?
**Tags:** fiberquest, tournament, ui, electron, ux, design
**Seeds:**
- https://raw.githubusercontent.com/nicedoc/nicedoc/master/README.md
- https://animate.style/
- https://raw.githubusercontent.com/chartjs/Chart.js/master/README.md
- https://raw.githubusercontent.com/gregberge/loadable-components/master/README.md
- https://raw.githubusercontent.com/electron/electron/main/docs/tutorial/security.md


---

## [DONE] ckh-and-snapshot-strategy
**Priority:** SYNTHESIS
**Output:** findings/ckh-and-snapshot-strategy.md
**Goal:** SYNTHESIS — Read MEMORY.md. Produce a strategic analysis of Common Knowledge Hub (CKH) and the Wyltek snapshot infrastructure. Answer: (1) What is CKH's position in the Nervos ecosystem — who are the target users, what problem does it solve better than existing tools (CKB Node Manager, manual setup guides)? (2) What should the remote app catalogue at apps.wyltekindustries.com include at launch — which 10 tools/apps would make the strongest first impression? (3) How should the snapshot pipeline evolve — mainnet + testnet, update frequency, GPG signing, integrity verification, how does CKH consume the latest.json to auto-download? (4) What GitHub Actions CI/CD pipeline does CKH need — how do we build AppImage for arm64, x64, macOS, Windows? Which runner handles arm64 builds? (5) What's the CKH roadmap for the next 30 days — what features unlock the most value fastest? (6) How does CKH fit into the broader Wyltek product story alongside the embedded builder, DOB minter, and FiberQuest?
**Seeds:** (internal — reads MEMORY.md + research/findings/*.md + workspace files)
**Questions to answer:**
1. Who are CKH's first 100 users and where do we find them?
2. What's missing from the current CKH feature set that would block a v0.1 release?
3. How do snapshots + CKH together reduce time-to-synced from days to minutes?

## sensecap-m1-ckb-repurpose
- id: sensecap-m1-ckb-repurpose
- priority: HIGH
- status: PENDING
- tags: hardware, lora, ckb, sensecap, pi4
- seeds:
  - https://raw.githubusercontent.com/Lora-net/sx1302_hal/master/README.md
  - https://www.sensecapmx.com/docs/sensecap-m1/overview/
  - https://github.com/Seeed-Studio/SenseCraft/blob/main/docs/sensecap_m1.md
- goal: |
    SenseCAP M1 repurpose for CKB LoRa gateway.
    1. How to safely backup ECC key / Helium identity from SD before swap
    2. SX1302 HAL setup on Raspbian Lite Pi4 — which pins, which config
    3. Docker setup for ckb-light-client ARM64 on Pi4 — minimal resource usage
    4. Can SX1302 concentrator + ckb-light-client + possibly Fiber node coexist on 4GB Pi4?
    5. Any existing open-source CKB LoRa gateway projects to build on?

---

## [PENDING] tamperproof-biometric-auth
**Priority:** MEDIUM
**Output:** findings/tamperproof-biometric-auth.md
**Goal:** Research low-cost biometric authentication hardware (fingerprint, iris) for proof-of-person use cases — focusing on commercial availability, price trends, tamper-resistance, and anti-spoofing. Can cheap fingerprint scanners be made tamper-proof? What attack vectors exist (fake prints, module bypass, wire-tap)? What designs or enclosures make them harder to defeat? Is iris scanning (phone-grade IR) viable at low cost?
**Seeds:**
- https://raw.githubusercontent.com/adafruit/Adafruit-Fingerprint-Sensor-Library/master/README.md
- https://en.wikipedia.org/wiki/Fingerprint_recognition
- https://en.wikipedia.org/wiki/Iris_recognition
- https://raw.githubusercontent.com/sparkfun/Fingerprint_Scanner-TTL/master/README.md
- https://www.mouser.com/blog/fingerprint-sensor-modules
**Questions to answer:**
1. What cheap fingerprint scanner modules exist (R307, AS608, GT521Fx)? Price range, liveness detection support?
2. How hard is it to spoof a cheap capacitive vs optical fingerprint scanner? Known attacks?
3. What hardware/enclosure techniques make fingerprint modules tamper-evident or tamper-resistant (epoxy potting, mesh wiring, secure element pairing)?
4. Is phone-grade iris scanning (Samsung-style IR) available as a standalone module? Cost?
5. Compared to retina (~$10k+), what accuracy/uniqueness does iris scanning provide at $100-300?
6. Are there open source tamper-proof biometric reference designs for embedded/ESP32 use?
7. What's the realistic near-horizon for sub-$50 reliable liveness-detecting fingerprint auth?
8. Could biometric data (fingerprint template or iris scan) be stored on a hardware cold wallet device? What are the privacy tradeoffs vs storing a hash on-chain?
9. What on-chain proof-of-personhood patterns exist — e.g. World ID (iris hash + ZK proof), Proof of Humanity. How does a biometric hash commitment scheme work without exposing raw data?
10. Custody model: user holds their own biometric data (like a seed phrase) — what UX patterns reduce the risk of data loss? Hardware secure enclaves, encrypted backups, social recovery?
11. How does this compare to existing self-sovereign identity approaches in crypto (DID, VC, Worldcoin)?

---

## [PENDING] sphincs-plus-quantum-purse-esp32-wallet
**Priority:** HIGH
**Output:** findings/sphincs-plus-quantum-purse-esp32-wallet.md
**Goal:** Deep research into building an ESP32-P4 hardware wallet that signs CKB transactions using SPHINCS+ post-quantum signatures, compatible with Quantum Purse (built by **tea2x**, CKB Eco Fund Spark Program grantee — the first quantum-resistant wallet on CKB mainnet). Covers: (1) Quantum Purse architecture and what signing format it expects, (2) SPHINCS+ parameter sets practical on ESP32-P4 with hardware SHA acceleration, (3) feasibility of an integrated wallet UI that talks to Quantum Purse, (4) key storage using ESP32-P4 eFuse/secure boot.
**Seeds:**
- https://raw.githubusercontent.com/cryptape/quantum-resistant-lock-script/main/README.md
- https://raw.githubusercontent.com/cryptape/quantum-purse/main/README.md
- https://raw.githubusercontent.com/nervosnetwork/rfcs/master/rfcs/0022-transaction-structure/0022-transaction-structure.md
- https://raw.githubusercontent.com/pq-crystals/sphincsplus/master/README.md
- https://raw.githubusercontent.com/espressif/esp-idf/master/components/mbedtls/mbedtls/include/mbedtls/sha256.h
- https://raw.githubusercontent.com/espressif/esp-idf/master/components/esp_hw_support/include/esp_sha.h
- https://raw.githubusercontent.com/espressif/esp-idf/master/components/bootloader_support/include/esp_secure_boot.h
**Questions to answer:**
1. What is Quantum Purse? How does it differ from a standard CKB lock script — what signing algorithm and message format does it use?
2. Which SPHINCS+ parameter set does Quantum Purse use (sphincs-sha2-128s, 256s, shake, etc.)? Is it fixed or user-selectable?
3. What does the witness field look like for a Quantum Purse transaction — what bytes does the ESP32 need to produce?
4. What are the signing performance benchmarks for SPHINCS+ on ESP32-P4? Are there any ESP32 or ARM Cortex benchmarks to extrapolate from?
5. Does ESP-IDF expose hardware SHA-256/512 via a simple mbedTLS or esp_sha API that a SPHINCS+ implementation could use as a backend?
6. What is the signature size for SPHINCS+ (128s vs 256s)? How does it affect CKB transaction size and fees?
7. Can the ESP32-P4 eFuse + Digital Signature peripheral securely store and use a SPHINCS+ private key? What are the constraints (key size, HSM-like usage)?
8. Is there an existing C implementation of SPHINCS+ (pq-crystals reference or similar) that could be ported to ESP32-P4 with minimal changes?
9. What would an integrated wallet UI look like — connect to Quantum Purse web app via QR, sign offline, broadcast? Any existing hardware wallet integrations with Quantum Purse?
10. What CKB transaction fields must the ESP32 serialize before signing — is Molecule serialization required at the signing layer?

---

## [PENDING] rk3528-armbian-linux-path
**Priority:** HIGH
**Output:** findings/rk3528-armbian-linux-path.md
**Goal:** Find the best working path to run Armbian (or Ubuntu) on the H96 Max RK3528 TV box. What's the current state of RK3528 Linux support? Which community builds work? What drivers are broken (WiFi, ethernet, USB 3.0)? What's the flash procedure — SD card boot, eMMC flash, maskrom mode? Is ethernet reliable (critical for node use)?
**Seeds:**
- https://forum.armbian.com/topic/30215-ambian-tv-box-rk3528/
- https://raw.githubusercontent.com/ilyakurdyukov/rk3528-tvbox/main/README.md
- https://raw.githubusercontent.com/ophub/amlogic-s9xxx-armbian/main/README.md
- https://raw.githubusercontent.com/friendlyarm/sd-fuse_rk3528/master/README.md
**Questions to answer:**
1. What is the current state of Armbian support for RK3528 TV boxes — official, community, or experimental only?
2. Which specific RK3528 TV box builds are confirmed booting with working ethernet and USB 3.0?
3. What is the flash procedure — SD card only, or can we flash to eMMC? Is maskrom mode needed?
4. Are there any known issues with the H96 Max specifically vs other RK3528 boxes (Vontar DQ08 etc)?
5. What kernel version is used and does it support USB 3.0 for external SSD (critical for CKB chain data)?
6. Is HDMI output working for desktop/framebuffer display from Armbian?
7. What's the recommended partition layout for OS on eMMC + chain data on external USB SSD?

---

## [PENDING] rk3528-ckb-node-setup
**Priority:** HIGH
**Output:** findings/rk3528-ckb-node-setup.md
**Goal:** Map the exact procedure to run a CKB full node on RK3528 Armbian. Covers: aarch64 binary download, config for external SSD data dir, systemd service, pruning options to manage storage, RPC access for signing remote, Fiber node co-location feasibility on 4GB RAM.
**Seeds:**
- https://raw.githubusercontent.com/nervosnetwork/ckb/develop/README.md
- https://raw.githubusercontent.com/nervosnetwork/ckb/develop/docs/get-ckb.md
- https://docs-old.nervos.org/docs/basics/guides/run-ckb-with-docker
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/README.md
**Questions to answer:**
1. What aarch64 CKB binary is available — does nervosnetwork/ckb publish arm64 releases?
2. How do you configure CKB data directory to point at an external USB SSD on Linux?
3. What are the RAM requirements for CKB full node at current chain height — is 4GB sufficient?
4. Can CKB full node + Fiber node run simultaneously on 4GB RAM / RK3528?
5. What systemd service config is recommended for CKB on Armbian?
6. How to expose CKB RPC only to LAN (not public) for the signing remote to consume?
7. Pruning/storage options — can we limit chain storage growth on a budget SSD?

---

## [PENDING] esp32s3-signing-remote-architecture
**Priority:** MEDIUM
**Output:** findings/esp32s3-signing-remote-architecture.md
**Goal:** Design the communication layer between the ESP32-S3 signing remote and the RK3528 node box. What API design (REST vs WebSocket vs BLE) works best for low-latency transaction approval on a home LAN? How does the signing remote receive an unsigned transaction, display it human-readably, and return a signed one? What ESP32-S3 board is best suited for "TV remote" form factor with touchscreen?
**Seeds:**
- https://raw.githubusercontent.com/nervosnetwork/ckb/develop/rpc/README.md
- https://raw.githubusercontent.com/toastmanAu/wyltek-embedded-builder/main/README.md
- https://docs.espressif.com/projects/esp-idf/en/latest/esp32s3/api-reference/network/esp_wifi.html
**Questions to answer:**
1. What ESP32-S3 touchscreen boards exist in a compact "remote" form factor (sub-100mm)? CST816 touch + colour display?
2. REST vs WebSocket for node box ↔ signing remote comms — latency and reliability on home LAN?
3. What CKB RPC calls does the signing remote need to consume (get pending tx, broadcast signed tx)?
4. How should unsigned transaction data be serialised and transferred to the signing remote?
5. What display resolution/size is practical for showing a human-readable transaction summary (address, amount, fee)?
6. How should the signing remote handle being offline or out of WiFi range safely?
