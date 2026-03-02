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
- https://raw.githubusercontent.com/nicktindall/cyclon.p2p-rtc-io/refs/heads/master/README.md
- https://raw.githubusercontent.com/hackerhouse-opensource/bitchat-esp32/main/README.md
- https://raw.githubusercontent.com/hackerhouse-opensource/bitchat-esp32/main/bitchat_esp32.ino
- https://raw.githubusercontent.com/h2zero/NimBLE-Arduino/master/README.md
- https://raw.githubusercontent.com/h2zero/NimBLE-Arduino/master/examples/NimBLE_Server/NimBLE_Server.ino
- https://raw.githubusercontent.com/toastmanAu/ckb-light-esp/main/src/bitchat/bitchat_mesh.h
**Questions to answer:**
1. Does BitChat Android use BLE central, peripheral, or both simultaneously?
2. What's the exact GATT notify flow for mesh relay (write vs notify vs indicate)?
3. NimBLE-Arduino: minimum sketch to advertise + accept connections + relay data?
4. Any existing ESP32 BitChat implementations or forks?
5. MTU negotiation — what does NimBLE default to, what does BitChat Android expect?

---

## [PENDING] fiber-trampoline-routing
**Priority:** HIGH
**Output:** findings/fiber-trampoline-routing.md
**Goal:** Understand Fiber v0.7.0 trampoline routing — how it works, what it changes for multi-hop payments, implications for ckb-chess invoice flow and any app that routes payments through our nodes.
**Seeds:**
- https://github.com/nervosnetwork/fiber/releases/tag/v0.7.0
- https://github.com/nervosnetwork/fiber/blob/main/CHANGELOG.md
- https://docs.fiber.network (if exists)
- https://github.com/nervosnetwork/fiber/tree/main/src
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
- https://github.com/toastmanAu/ckb-chess
- https://github.com/nervosnetwork/fiber/blob/main/docs/rpc.md
- https://github.com/nervosnetwork/fiber/blob/main/tests
- https://github.com/cryptape/ckb-chess (if exists — check)
**Questions to answer:**
1. What Fiber RPCs are needed: new_invoice, send_payment, get_invoice, list_channels?
2. Full payment flow: challenger opens channel → sends invoice per move → opponent pays?
3. How does the relayer detect a channel close / game end on-chain?
4. Are there any existing CKB game relayer patterns to reference?
5. WebSocket vs HTTP polling for the game client ↔ relayer protocol?

---

## [PENDING] esp32-p4-sphincs-plus
**Priority:** MEDIUM
**Output:** findings/esp32-p4-sphincs-plus.md
**Goal:** Assess feasibility of SPHINCS+ post-quantum signing on ESP32-P4. Hardware SHA-256/512 accelerators available. Goal: sign a CKB transaction with SPHINCS+ from an ESP32-P4.
**Seeds:**
- https://github.com/espressif/esp-idf/tree/master/components/mbedtls
- https://github.com/espressif/esp-idf/blob/master/components/esp_hw_support/include/esp_sha.h
- https://github.com/XKCP/XKCP (Keccak — reference)
- https://github.com/pq-crystals/sphincsplus
- https://docs.espressif.com/projects/esp-idf/en/latest/esp32p4/api-reference/peripherals/sha.html
**Questions to answer:**
1. Does ESP-IDF expose SHA-256/512 hardware acceleration via a simple API?
2. Which SPHINCS+ parameter set is practical on a microcontroller (sphincs-sha2-128s vs 256s)?
3. Is there a Rust SPHINCS+ crate with configurable hash backend?
4. What's the expected sign time on ESP32-P4 in pure software (extrapolate from Cortex-M benchmarks)?
5. Any prior art: SPHINCS+ on ESP32 or similar Xtensa/RISC-V MCU?

---

## [PENDING] dob-hardware-provenance-schema
**Priority:** MEDIUM
**Output:** findings/dob-hardware-provenance.md
**Goal:** Design a JSON schema for hardware provenance DOBs — minting an on-chain cert from an ESP32 containing device serial, firmware hash, board type, test results. Map to Spore content_type and existing standards.
**Seeds:**
- https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0022-transaction-structure/0022-transaction-structure.md
- https://github.com/sporeprotocol/spore-sdk/blob/main/docs/core/spore-data.md
- https://schema.org/Product (existing product schema)
- https://www.ietf.org/archive/id/draft-ietf-rats-eat-21.txt (Entity Attestation Token — industry standard)
- https://github.com/toastmanAu/ckb-dob-minter
**Questions to answer:**
1. What content_type should hardware provenance DOBs use? (application/json? application/vnd.wyltek.provenance+json?)
2. Does EAT (Entity Attestation Token) give us a head start on field naming?
3. Minimum viable schema: what fields are non-negotiable for a hardware cert?
4. How does the ESP32 sign the payload before minting? (ckb-esp32-signer flow)
5. Any prior art: hardware attestation on blockchain (not just NFT metadata)?

---

## [PENDING] ckb-snapshot-infrastructure
**Priority:** LOW (cron already running — this is refinement)
**Output:** findings/ckb-snapshot-infra.md
**Goal:** Research best practices for CKB snapshot hosting — compression formats, Cloudflare R2 serving patterns, how other node snapshot services are structured (Bitcoin, Ethereum).
**Seeds:**
- https://ckb.net (official — any snapshot links?)
- https://github.com/nervosnetwork/ckb/blob/develop/docs/run-ckb-with-docker.md
- https://developers.cloudflare.com/r2/examples/rclone/
- https://snapshot.parity.io (Ethereum — reference for structure)
- https://btcpayserver.org/bitcoin-full-node/ (Bitcoin bootstrap reference)
**Questions to answer:**
1. What compression format does the community expect for CKB snapshots? (zstd vs lz4 vs gz)
2. Does Cloudflare R2 need any special headers for large file resumable downloads?
3. How do other projects handle snapshot versioning + latest pointer?
4. Is there a CKB community snapshot already hosted somewhere (to avoid duplication)?
5. What's the right robots.txt / cache-control for R2-hosted snapshots?

---

## [PENDING] handheld-gaming-ckb-integration
**Priority:** HIGH
**Output:** findings/handheld-gaming-ckb-integration.md
**Goal:** Map integration opportunities for our stack (CKB node, Fiber, ckb-chess, DOB minter, wallet) inside handheld gaming devices. Two tracks: (1) apps running inside existing gaming OS (ArkOS, JELOS, AmberELEC, Batocera, Android) — overlays, launchers, companion apps; (2) full hardware takeover — Armbian/mainline Linux on the device, running our full node stack. Focus on RK3566-based handhelds first: Anbernic RG-ARC-D, and then RK3326 (older) and Rockchip handhelds broadly. Also cover Retroid Pocket 4 Pro (Android, Dimensity 900).
**Seeds:**
- https://raw.githubusercontent.com/ArkOS/ArkOS/master/README.md
- https://raw.githubusercontent.com/JELOS/JELOS/main/README.md
- https://wiki.batocera.org/hardware_compatibility (if fetchable)
- https://github.com/christianhaitian/arkos/wiki
- https://retrodreamer.com/retroid-pocket-4-pro (spec page)
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

## [PENDING] hispo-s8-android-headunit-integration
**Priority:** HIGH
**Output:** findings/hispo-s8-headunit.md
**Goal:** Map integration opportunities for our stack on Hispo S8 Android car head units. Key areas: (1) CKB node + Fiber running as background Android service; (2) GPS data → chain monitor / dashcam-style data logger with on-chain provenance; (3) ADB/SSH access for agent control — modifying system layout, launching apps, pushing config; (4) Picture-in-picture at >4 simultaneous windows (stock limit); (5) Modifying/replacing stock Android OS or launcher; (6) CKB dashboard as always-on overlay; (7) Using their built-in PIP module architecture at higher capacity.
**Seeds:**
- https://raw.githubusercontent.com/Murena-EV/hispo/main/README.md
- https://xda-developers.com/search/?q=hispo+s8
- https://raw.githubusercontent.com/DeskHog/deskdock/main/README.md
- https://developer.android.com/guide/topics/ui/picture-in-picture
- https://developer.android.com/studio/command-line/adb
- https://github.com/search?q=android+headunit+adb+root&type=repositories
**Questions to answer:**
1. What Android version does the Hispo S8 run? Is it rooted or rootable? ADB enabled by default or via dev options?
2. Can you SSH into a Hispo S8 unit (e.g. via Termux + SSHd or similar)?
3. What is their PIP module — proprietary split-screen system? How many simultaneous windows does stock support, and is there a known way to exceed 4?
4. Can the stock launcher be replaced (e.g. Nova, custom APK as HOME intent)? Any reports of custom launchers on Hispo/similar Qualcomm/MT headunits?
5. GPS integration: does the unit expose GPS NMEA data to apps via standard Android Location API? Any always-on GPS logging apps known to work on headunits?
6. CKB node feasibility: RAM/storage specs of S8? Could it run a CKB light client or full node as an Android background service (foreground service, wake lock)?
7. Agent remote control: if ADB is accessible over WiFi, what can an agent do — push APKs, modify system settings, change launcher, trigger intents?
8. Any prior art: blockchain nodes, crypto wallets, or similar heavyweight background services running on Android car headunits?

---

## [PENDING] obd2-canbus-esp32-analysis-injection
**Priority:** HIGH
**Output:** findings/obd2-canbus-esp32.md
**Goal:** Deep research into OBD2 + CAN bus / K-Line read AND write from ESP32. Two tiers: (1) passive reading — live sensor data, fault codes, ECU parameters; (2) active injection/writing — sending frames to modify ECU behaviour, unlock hidden features, change car configuration, full computer access. Specific vehicle target: Renault Clio RS 172 (Phase 1, ~2001-2002, Renault F7R 2.0L engine, Bosch Motronic ECU). **Known hardware: Renault Link v1.99 USB adapter** — KKL USB-to-K-Line cable, speaks the proprietary Renault DDX/UCH diagnostic protocol used by Renault Clip software. Goal is full independent automotive building — reading is table stakes, writing/injecting is the prize.
**Seeds:**
- https://raw.githubusercontent.com/iDoka/awesome-canbus/master/README.md
- https://raw.githubusercontent.com/P1kachu/talking-with-cars/master/README.md
- https://raw.githubusercontent.com/merecarvill/OBD2-KLine-Reader/master/README.md
- https://github.com/opengarage/carloop
- https://raw.githubusercontent.com/jshuber/RenaultClip/master/README.md
- https://raw.githubusercontent.com/collin80/esp32_can/master/README.md
**Questions to answer:**
1. Renault Clio RS 172: K-Line or CAN on OBD2 port? Which ECU exactly (Bosch ME7.4.6? Siemens SID301?)? What diagnostic protocol does Renault Link v1.99 / Renault Clip use — is it documented/reversed?
2. Can the Renault Link v1.99 KKL adapter protocol be replicated on ESP32 with an L9637D or similar K-Line transceiver? What's the electrical interface?
3. What can you READ from a Clio 172 via K-Line: live PIDs (RPM, MAF, TPS, coolant), fault codes, immobiliser status, ECU variant/calibration ID?
4. What can you WRITE: key programming, immobiliser PIN bypass, idle speed adjustment, ignition timing maps, throttle body adaptation reset, service interval reset?
5. Open source tools that already speak Renault protocol: DDT4ALL, OpenDiag, FreeSSM — do any cover this ECU/protocol? Any reversed Renault CAN/K-Line DBC or definition files?
6. DDT4ALL specifically — does it support the Clio 172 ECU? What's the coverage for F7R / Bosch Motronic?
7. Is there a CAN bus present internally on the 172 (separate from OBD2 K-Line) — e.g. between ABS, UCH, instrument cluster? If so, what speed and what frames are documented?
8. ESP32 K-Line implementation: UART + L9637D transceiver — what baud rates, init sequences, and frame formats does Renault use? Any Arduino/ESP-IDF libraries that handle K-Line ISO 14230 (KWP2000)?
9. What brands/ECU families are most open to diagnostic write access without seed/key security challenges? Best starting points for learning injection before tackling Renault specifics.
10. Safety: risks of bad write commands — ECU brick, immobiliser lockout, limp mode triggers. What's recoverable vs permanent?
