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

