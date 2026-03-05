# Research: esp32p4-fiber-signer-vs-lightclient

**Date:** 2026-03-05  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/toastmanAu/ckb-light-esp/main/README.md, https://raw.githubusercontent.com/nervosnetwork/fiber/main/README.md, https://raw.githubusercontent.com/bitcoin/secp256k1/master/README.md, https://api.github.com/search/repositories?q=esp32+secp256k1&sort=stars&per_page=10, https://raw.githubusercontent.com/espressif/esp-idf/master/components/mbedtls/README.md

---

Date: 2026-03-05

## Summary

This research investigates two architectures for integrating an ESP32-P4 into the FiberQuest project: a "Signer Only" approach and a "Light Client + Signer" approach. The "Signer Only" architecture would delegate CKB Layer 1 transaction construction and state verification to an external server, with the ESP32-P4 solely handling cryptographic signing of transactions and off-chain payment hashes. The "Light Client + Signer" approach would enable the ESP32-P4 to independently verify CKB Layer 1 state, offering greater autonomy for channel management. While a `secp256k1` library suitable for embedded systems exists for signing, the feasibility of compiling the Rust-based CKB light client or the Fiber Network Node (FNN) for the RISC-V ESP32-P4, along with their resource requirements, remains largely unknown from the provided content. For a truly self-contained FiberQuest device, a light client is preferable for independent verification of critical on-chain channel states.

## 1. What software exists? CKB light client is Rust — can it compile for RISC-V ESP32-P4? What are the binary size and RAM requirements?

The provided content does not contain information on whether the Rust-based CKB light client can compile for the RISC-V architecture of the ESP32-P4. There is no mention of cross-compilation targets or specific support for ESP32-P4 in the provided `nervosnetwork/fiber` README.md or other sources. Consequently, the binary size and RAM requirements for a CKB light client running on an ESP32-P4 cannot be determined from the given information.

## 2. Fiber Network Node (FNN) is also Rust — same question. FNN is heavier than just a light client.

The Fiber Network Node (FNN) is implemented in Rust. The `nervosnetwork/fiber` README.md indicates it can be built with `cargo build --release` and mentions a "Web-browser friendly runtime" as a `TODO` item, suggesting that the current implementation is not designed for highly constrained environments like an ESP32. There is no information provided regarding its ability to compile for RISC-V ESP32-P4, nor any details on its binary size or RAM requirements for such a platform. Given the project ground truth states FNN is "heavier than just a light client," it is likely to have higher resource demands, making its direct deployment on an ESP32-P4 challenging without specific optimizations or a dedicated embedded port.

## 3. Signing only: secp256k1 library for ESP32 exists (Bitcoin hardware wallets use this). Memory footprint?

The project ground truth explicitly states that a "secp256k1 library for ESP32 exists (Bitcoin hardware wallets use this)." The `libsecp256k1` library (from `bitcoin/secp256k1`) is a high-performance C library for secp256k1 elliptic curve cryptography, which is "Suitable for embedded systems" and has "No runtime heap allocation." It also mentions "hand-optimized assembly for 32-bit ARM" but does not specifically detail RISC-V or ESP32-P4 support. While the existence of such a library for ESP32 is confirmed by the ground truth, the specific memory footprint for its use on an ESP32-P4 is not provided in the source content.

## 4. Our existing ckb-light-esp project — what CKB operations does it already do on ESP32? Can it sign secp256k1 transactions?

The source content for `https://raw.githubusercontent.com/toastmanAu/ckb-light-esp/main/README.md` resulted in a "FETCH ERROR: HTTP Error 404: Not Found". Therefore, it is not possible to determine what CKB operations the `ckb-light-esp` project already performs on ESP32 or if it can sign secp256k1 transactions based on the provided content.

## 5. For Fiber specifically: channel open/close = CKB L1 tx (needs signing). send_payment = off-chain message (needs signing of payment hash only, much lighter). Which operations actually need to run on-device vs can be delegated?

Based on the project ground truth and `nervosnetwork/fiber` README.md:

*   **Channel Open/Close:** These operations involve CKB Layer 1 transactions. The *signing* of these CKB L1 transactions must occur on the device holding the private key (ESP32-P4 in this case). However, the *construction* of the full CKB L1 transaction (e.g., gathering inputs, determining outputs, calculating fees, assembling the transaction structure) could be delegated to an external entity (like a Pi or server) that has access to CKB Layer 1 state and can build the transaction. The ESP32-P4 would then receive the unsigned transaction and return the signature.
*   **Send Payment:** This is an off-chain message passing operation. It requires signing of a payment hash, which is a much lighter cryptographic operation than signing a full CKB L1 transaction. This signing can and should occur on the ESP32-P4 to authorize the off-chain payment. The routing and forwarding of these off-chain messages would be handled by the Fiber Network Node (FNN), which could be running on a delegated server.

In summary, the core cryptographic signing operations for both on-chain channel management and off-chain payments need to run on the ESP32-P4 to protect the private key. The heavy lifting of CKB L1 transaction construction and Fiber network routing/state management can be delegated.

## 6. Verdict: is "signer only" sufficient for a self-contained FiberQuest device, or do you need a light client to verify channel state independently?

For a "self-contained FiberQuest device," a "Light Client + Signer" architecture is significantly more robust and secure than a "Signer Only" approach, especially for operations involving CKB Layer 1.

*   **Signer Only:** This approach would mean the ESP32-P4 relies entirely on an external server (e.g., a Pi) to construct CKB L1 transactions and to report the current state of Fiber channels on CKB L1. The ESP32-P4 would sign whatever transaction it is presented with. While this is sufficient for authorizing off-chain payments (by signing payment hashes), it introduces a trust dependency on the external server for the integrity and correctness of on-chain operations like channel opening, closing, and dispute resolution. The device cannot independently verify if the channel was opened correctly, if funds are locked as expected, or if a closing transaction is valid.

*   **Light Client + Signer:** By running a CKB light client, the ESP32-P4 gains the ability to independently verify the CKB Layer 1 blockchain state. This means it can:
    *   Verify that channel open/close transactions are correctly recorded on-chain.
    *   Independently confirm the state of its locked funds within Fiber channels.
    *   Potentially monitor for malicious activity or initiate disputes without relying on an external, potentially compromised, server.
    *   The `nervosnetwork/fiber` README.md mentions "Watchtower support," which implies that even with a full node, monitoring can be delegated, but a light client would still be needed to *verify* watchtower reports or initiate on-chain actions.

Given the goal of a "self-contained FiberQuest device," which implies autonomy and independent verification, a light client is necessary to verify channel state independently for critical on-chain operations. Without it, the device is not truly self-contained for managing its CKB L1 assets and channel lifecycle.

## Gaps / Follow-up

1.  **CKB Light Client for RISC-V ESP32-P4:** The most significant gap is the lack of information on whether the Rust-based CKB light client can be compiled for the RISC-V architecture of the ESP32-P4, and its resulting binary size and RAM footprint. This is crucial for determining the feasibility of the "Light Client + Signer" architecture.
2.  **FNN for RISC-V ESP32-P4:** Similar to the light client, there's no information on FNN's compatibility with ESP32-P4's RISC-V architecture or its resource requirements. Given it's "heavier," this is a critical unknown.
3.  **`ckb-light-esp` Project Details:** The `ckb-light-esp` README.md was unreachable. Accessing this documentation is vital to understand its existing CKB operations and signing capabilities on ESP32, which could directly inform the "Signer Only" architecture.
4.  **`libsecp256k1` Memory Footprint:** While `libsecp256k1` is suitable for embedded systems, specific memory usage (RAM/Flash) on an ESP32-P4 for typical CKB transaction signing operations is not provided.
5.  **CKB L1 Transaction Construction Library for ESP32:** Even with a light client, the process of constructing complex CKB L1 transactions (e.g., for channel opening/closing) on a resource-constrained ESP32-P4 might be challenging. Research into existing CKB transaction building libraries or SDKs compatible with ESP32 (or Rust for embedded) would be beneficial.

## Relevant Code/API Snippets

*   **Fiber Network Node (FNN) Build Command:**
    ```
    cargo build --release
    ```
    (Source: `nervosnetwork/fiber` README.md)

*   **FNN Private Key Export (for wallet functionality):**
    ```
    ckb-cli account export --lock-arg --extended-privkey-path ./ckb/exported-key
    head -n 1 ./ckb/exported-key > ./ckb/key
    ```
    (Source: `nervosnetwork/fiber` README.md)

*   **`libsecp256k1` Features (relevant for embedded):**
    *   "Suitable for embedded systems."
    *   "No runtime heap allocation."
    *   "Intended to be portable to any system with a C89 compiler and uint64_t support."
    *   "Intended to be completely free of timing sidechannels for secret-key operations (on reasonable hardware/toolchains)"
    (Source: `bitcoin/secp256k1` README.md)