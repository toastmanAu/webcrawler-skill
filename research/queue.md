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

## [PENDING] ckb-chess-relayer-design
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
