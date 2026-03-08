# Research: wyvault-lite-ckb-signing

**Date:** 2026-03-08  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/nervosnetwork/ckb/develop/docs/ckb_transaction_structure.md, https://raw.githubusercontent.com/nervosnetwork/rfcs/master/rfcs/0022-transaction-structure/0022-transaction-structure.md, https://raw.githubusercontent.com/nervosnetwork/rfcs/master/rfcs/0024-ckb-genesis-script-list/0024-ckb-genesis-script-list.md, https://raw.githubusercontent.com/nervosnetwork/ckb-sdk-rust/develop/README.md, https://api.github.com/repos/nervosnetwork/ckb-sdk-js/contents/packages/ckb-sdk-utils/src

---

Date: 2026-03-08

## Summary

This research focuses on the CKB transaction signing pipeline for ESP32-S3, specifically for the WyVault Lite hardware wallet. CKB utilizes `secp256k1` for digital signatures and `BLAKE2b-256` for hashing, with addresses derived from `BLAKE2b-160` of the public key. The transaction hash, which forms the basis of the signing message, is computed from all transaction fields except witnesses. While the logical transaction structure is detailed, the exact byte layout for serialization and the precise witness structure for signing are best found in the CKB system scripts' source code. Wyltek Industries has already confirmed `secp256k1` signing on ESP32-P4, indicating suitable C implementations exist for constrained environments.

---

## Questions to Answer

### 1. Exact CKB signing algorithm — is it secp256k1 + blake2b160 address hash? What is the exact signing message format (witness structure, tx hash construction)?

*   **Signing Algorithm:** Yes, the default lock script for CKB transaction signature verification is `SECP256K1/blake160`. This implies `secp256k1` for digital signatures and `BLAKE2b-160` (the first 160 bits of a `BLAKE2b-256` hash) for the address hash.
    *   **Citation:** `rfcs/0024-ckb-genesis-script-list.md` states: "[SECP256K1/blake160](https://github.com/nervosnetwork/ckb-system-scripts/wiki/How-to-sign-transaction#p2ph) is the default lock script to verify CKB transaction signature."

*   **Transaction Hash Construction:** The transaction hash (`tx_hash`) is computed from all transaction fields *except* `witnesses`.
    *   **Citation:** `rfcs/0022-transaction-structure/0022-transaction-structure.md`, Appendix A: Compute Various Hash, "Transaction Hash": "We can compute the transaction hash from all transaction fields except `witnesses`."

*   **Signing Message Format (Witness Structure):** The exact signing message format, including the witness structure and how the final message to be signed is derived from the `tx_hash` and witness data, is defined by the specific lock script being used. For the default `SECP256K1/blake160` script, the source code (`secp256k1_blake160_sighash_all.c` linked in RFC 0024) would contain the precise logic for constructing the message that `secp256k1` signs. The provided content describes the logical components but does not detail the byte-level construction of the message within the witness for signing.

### 2. Which blake2b variant — blake2b-256? What are the personalisation parameters CKB uses?

*   **BLAKE2b Variant:** CKB uses `BLAKE2b` with a 256-bit digest size.
    *   **Citation:** `rfcs/0022-transaction-structure/0022-transaction-structure.md`, Appendix A: Compute Various Hash, "Crypto Primitives": "CKB uses `BLAKE2b` with 256-bit digest size as its default hash function."

*   **Personalisation Parameters:** The provided content does not explicitly state any personalization parameters used by CKB for `BLAKE2b`.

### 3. BIP32 key derivation path for CKB — is m/44'/309'/0'/0/0 the standard? Any CKB-specific derivation quirks?

The provided content does not contain any information regarding BIP32 key derivation paths for CKB or any CKB-specific derivation quirks.

### 4. Are there C implementations of blake2b + secp256k1 suitable for ESP-IDF (no OS dependencies, no heap allocations)? Preferred: libb2 or BLAKE2 reference impl.

*   **secp256k1:** Yes, a suitable C implementation of `secp256k1` is confirmed to be working on ESP32.
    *   **Citation:** Project Ground Truth: "secp256k1 signing confirmed working (used in DOB minting flow) [on ESP32-P4]". Additionally, the CKB system scripts themselves include a C implementation (`secp256k1_blake160_sighash_all.c` linked in `rfcs/0024-ckb-genesis-script-list.md`), which is designed for the CKB-VM (a constrained environment) and would be a strong candidate for adaptation to ESP-IDF.
*   **BLAKE2b:** Given that CKB uses `BLAKE2b-256` as its default hash function and the `SECP256K1/blake160` script is implemented in C for the CKB-VM, it is highly probable that a C implementation of `BLAKE2b` suitable for constrained environments (like ESP-IDF) already exists within the CKB system scripts or is readily available. The `wyltek-embedded-builder` C framework also suggests that such primitives are integrated or planned for ESP32 CKB applications.

### 5. What does a minimal CKB raw transaction look like that needs signing — what fields, what byte layout?

*   **Fields:** A CKB transaction consists of the following fields: `version`, `cell_deps`, `header_deps`, `inputs`, `outputs`, `outputs_data`, and `witnesses`.
    *   **Citation:** `rfcs/0022-transaction-structure/0022-transaction-structure.md`, "Recap of The Transaction Structure in Part I" and "Part II: Extensions" sections, along with the "transaction-overview.png" diagram.
    *   **Minimal Transaction Components:** A minimal transaction would require at least one `input` (referencing a live cell via `OutPoint`), at least one `output` (specifying `capacity`, a `lock` script, and optionally a `type` script), corresponding `outputs_data`, and `cell_deps` for the scripts used (e.g., `SECP256K1/blake160`). The `witnesses` field would contain the signature(s).

*   **Byte Layout:** The provided content describes the logical structure of a CKB transaction and how its hash is computed, but it does not specify the exact byte layout or serialization format (e.g., Molecule serialization) for a raw transaction.

### 6. Can the signed tx be encoded as a QR code — what's the typical byte size of a signed CKB transfer tx? What QR version/error correction level needed?

*   **QR Code Encoding:** Yes, any arbitrary byte string, including a serialized signed CKB transaction, can be encoded into a QR code, provided its size fits within the QR code's data capacity.
*   **Typical Byte Size:** The provided content does not specify the typical byte size of a signed CKB transfer transaction.
*   **QR Version/Error Correction:** Without knowing the typical byte size of a serialized signed transaction, it is not possible to determine the required QR version or error correction level from the provided content.

### 7. Any prior art of CKB signing on embedded/constrained devices?

Yes, there is significant prior art for CKB signing and related cryptographic operations on embedded/constrained devices, specifically ESP32 hardware, within Wyltek Industries' projects:

*   **`secp256k1` signing on ESP32-P4:** Wyltek Industries has confirmed `secp256k1` signing is working on the ESP32-P4, used in their DOB minting flow.
    *   **Citation:** Project Ground Truth: "secp256k1 signing confirmed working (used in DOB minting flow) [on ESP32-P4]".
*   **`ckb-light-esp`:** A full CKB light client protocol stack runs on ESP32 (C/ESP-IDF), demonstrating the capability to handle CKB network protocols and data structures in a constrained environment.
    *   **Citation:** Project Ground Truth: "`ckb-light-esp` (github.com/toastmanAu/ckb-light-esp)".
*   **`NerdMiner CKB`:** An ESP32 Eaglesong solo miner for Nervos CKB is shipped, showcasing complex cryptographic computations (hashing for mining) on ESP32.
    *   **Citation:** Project Ground Truth: "`NerdMiner CKB` (github.com/toastmanAu/NerdMiner_CKB)".
*   **`wyltek-embedded-builder`:** This private C framework for ESP32 embedded CKB/blockchain apps is explicitly designed for building such applications, implying the integration of necessary cryptographic primitives.
    *   **Citation:** Project Ground Truth: "`wyltek-embedded-builder` (private, github.com/toastmanAu/wyltek-embedded-builder)".
*   **CKB System Scripts in C:** The CKB project itself provides C implementations of core scripts like `SECP256K1/blake160` (e.g., `secp256k1_blake160_sighash_all.c`), which are designed to run within the CKB-VM, a constrained execution environment. These C implementations are directly relevant for porting to other embedded C environments like ESP-IDF.
    *   **Citation:** `rfcs/0024-ckb-genesis-script-list.md` links to the source code for `SECP256K1/blake160`.

---

## Gaps / Follow-up

1.  **Exact Signing Message Format (Witness Structure):** While `rfcs/0022-transaction-structure.md` describes the transaction hash, the precise byte-level construction of the message that `secp256k1` signs within the witness (especially for `sighash_all`) is not detailed. This information would be found in the source code of the `secp256k1_blake160_sighash_all.c` script (linked in RFC 0024) or a detailed specification of the CKB transaction signing process.
2.  **BLAKE2b Personalisation Parameters:** The provided content does not specify if CKB uses any personalization parameters for its `BLAKE2b-256` hashing. This would need to be confirmed from CKB's core documentation or source code.
3.  **BIP32 Key Derivation Path:** The standard BIP32 derivation path for CKB (`m/44'/309'/0'/0/0`) and any CKB-specific derivation quirks are not mentioned in the provided documents. This is crucial for hardware wallet compatibility.
4.  **Raw Transaction Byte Layout/Serialization:** The RFCs describe the logical structure of a CKB transaction but do not provide the exact byte layout or the serialization format (e.g., Molecule schema) required to construct a raw transaction for signing.
5.  **Typical Signed Transaction Byte Size:** The typical byte size of a signed CKB transfer transaction is not provided, which is necessary to determine appropriate QR code versions and error correction levels.

---

## Relevant Code/API Snippets

*   **`SECP256K1/blake160` Lock Script Parameters (Mainnet Lina):**
    ```
    code_hash: 0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8
    hash_type: type
    tx_hash: 0x71a7ba8fc96349fea0ed3a5c47992e3b4084b031a42264a018e0072e8172e46c
    index: 0x0
    dep_type: dep_group
    ```
    *   **Citation:** `rfcs/0024-ckb-genesis-script-list.md`, "SECP256K1/blake160" section.

*   **`SECP256K1/blake160` C Source Code (External Link):**
    *   `https://github.com/nervosnetwork/ckb-system-scripts/blob/master/c/secp256k1_blake160_sighash_all.c`
    *   **Citation:** `rfcs/0024-ckb-genesis-script-list.md` links to this source. This file would contain the C implementation of the signing logic, including BLAKE2b and secp256k1 usage within the CKB-VM context.