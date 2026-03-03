# Research: esp32-ckb-dob-signing-flow

**Date:** 2026-03-03  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/toastmanAu/ckb-dob-minter/main/README.md, https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/system/esp_system.html, https://raw.githubusercontent.com/espressif/esp-idf/master/components/mbedtls/port/include/sha256_alt.h, https://raw.githubusercontent.com/nervosnetwork/ckb-sdk-js/develop/README.md, https://raw.githubusercontent.com/nervosnetwork/rfcs/master/rfcs/0022-transaction-structure/0022-transaction-structure.md

---

Date: 2024-05-28

## Summary
To mint a hardware provenance Digital Object (DOB) on CKB using an ESP32, the process involves the ESP32 generating the DOB's JSON content and then acting as the signing authority for the CKB transaction that mints this DOB. The ESP32 would use `secp256k1` for signing, as it's a CKB VM built-in primitive. A relay service (like the `ckb-dob-minter` application) facilitates transaction construction, sends the transaction hash to the ESP32 for signing, and then broadcasts the fully signed transaction to a CKB node. Secure private key storage on the ESP32 is crucial but not detailed in the provided content.

## 1. Best crypto primitive for ESP32→CKB signing (secp256k1 vs Ed25519)?
Based on the provided content, **secp256k1** is the best crypto primitive for ESP32→CKB signing.

The CKB Transaction Structure RFC (https://raw.githubusercontent.com/nervosnetwork/rfcs/master/rfcs/0022-transaction-structure/0022-transaction-structure.md) explicitly lists `secp256k1_verify` and `secp256k1_recover` as built-in crypto primitives available in the CKB VM. This indicates native support and preference for `secp256k1` for signature verification within CKB scripts.

**Citation:**
*   `rfcs/0022-transaction-structure`: "Appendix A: Compute Various Hash" -> "Crypto Primitives": "The CKB VM provides a few crypto primitives as built-in functions, such as `sha256`, `blake2b`, `ripemd160`, `secp256k1_verify`, `secp256k1_recover`."

## 2. Steps: ESP32 signs JSON payload → CKB-compatible signature?
The ESP32's role in signing for a CKB-compatible signature, especially when the `minted_by` field in the DOB JSON is a CKB address, implies the ESP32 acts as the private key holder for that address, signing the CKB transaction itself.

Here are the steps for the ESP32 to contribute a CKB-compatible signature for minting a hardware provenance DOB:

1.  **ESP32 generates JSON payload:** The ESP32 constructs the `application/json` content for the hardware provenance DOB, adhering to the "Wyltek Hardware DOB Format". This includes fields like `device`, `serial`, `firmware`, `firmware_hash`, `test_results`, and crucially, `minted_by` (which would be the CKB address associated with the ESP32's private key).
    *   **Citation:** `ckb-dob-minter` README: "Wyltek Hardware DOB Format" JSON template.
2.  **Relay service constructs transaction and requests signature:** A relay service (e.g., the `ckb-dob-minter` browser application or a dedicated backend) receives the JSON payload from the ESP32. It then constructs a CKB transaction using a CKB SDK (such as `@spore-sdk/core` and the recommended `CCC SDK`). This transaction will:
    *   Include the JSON payload in the `outputs_data` field of a new Spore Protocol cell.
    *   Specify an input cell controlled by the `minted_by` address (whose private key is held by the ESP32) to cover the transaction capacity.
    *   Include necessary `cell_deps` for the Spore Protocol type script and the standard `secp256k1` lock script.
    The relay service then computes the *transaction hash* (or the specific message hash required for the witness) that needs to be signed. CKB uses `blake2b` for computing transaction hashes. This hash is then sent to the ESP32.
    *   **Citation:** `ckb-dob-minter` README: "Stack" (`@spore-sdk/core`, `@ckb-ccc/connector-react`), "DOB Cell Structure". `rfcs/0022-transaction-structure`: "Appendix A: Compute Various Hash" -> "Transaction Hash" (computed from all transaction fields except `witnesses` using `blake2b`).
3.  **ESP32 signs transaction hash:** The ESP32 receives the transaction hash from the relay service. It signs this hash using its `secp256k1` private key.
    *   **Citation:** `rfcs/0022-transaction-structure`: "Appendix A: Compute Various Hash" -> "Crypto Primitives" mentions `secp256k1_verify` and `secp256k1_recover`.
4.  **ESP32 returns signature:** The ESP32 transmits the generated `secp256k1` signature back to the relay service.
5.  **Relay service completes transaction:** The relay service incorporates the received `secp256k1` signature into the `witnesses` field of the CKB transaction.

## 3. Secure private key storage on ESP32 (eFuse? NVS encrypted partition?)?
The provided source content **does not contain any information** regarding secure private key storage mechanisms on the ESP32, such as eFuse or NVS encrypted partitions. The links to Espressif documentation (e.g., `esp_system.html`, `sha256_alt.h`) resulted in "FETCH ERROR: HTTP Error 404: Not Found", preventing access to relevant ESP32-specific details.

The `ckb-sdk-js` README mentions generating private keys with `openssl` but explicitly advises against generating them in JavaScript projects due to safety concerns, without detailing hardware-specific storage.

## 4. Full relay flow: ESP32 signed payload → CKB node mints DOB?
The full relay flow for an ESP32 to contribute to minting a hardware provenance DOB on CKB involves several stages:

1.  **ESP32 Data Generation & Initial Transmission:**
    *   The ESP32 collects its hardware data (e.g., serial, firmware version, test results).
    *   It constructs the JSON payload according to the "Wyltek Hardware DOB Format", including its CKB address in the `minted_by` field.
    *   The ESP32 transmits this JSON payload to a relay service (e.g., a web server or directly to the `ckb-dob-minter` browser application). The communication protocol (e.g., HTTP, MQTT) is not specified in the provided content.

2.  **Relay Service Transaction Construction & Signature Request:**
    *   The relay service receives the JSON payload from the ESP32.
    *   Using CKB SDKs (like `@spore-sdk/core` for Spore Protocol interaction and the recommended `CCC SDK` for CKB transaction building), the relay service constructs a CKB transaction. This transaction will:
        *   Create a new Spore Protocol cell (`DOB Cell Structure`) in its `outputs`.
        *   Place the ESP32's JSON payload into the `content` field of the `data` part of this Spore cell (with `content-type: application/json`).
        *   Include an input cell to cover the capacity for the new DOB and transaction fees. This input cell must be controlled by the `minted_by` address provided by the ESP32.
        *   Add `cell_deps` for the Spore Protocol type script and the standard `secp256k1` lock script.
    *   The relay service then computes the transaction hash (or the specific message hash for the witness) that needs to be signed by the private key associated with the `minted_by` address. This hash is then sent back to the ESP32.
    *   **Citation:** `ckb-dob-minter` README: "Stack" (`@spore-sdk/core`, `@ckb-ccc/connector-react`), "DOB Cell Structure", "Cost", "Minting logic scaffold (`minter.js`)". `rfcs/0022-transaction-structure`: "Transaction Structure", "Value Storage", "Cell Data", "Code Locating", "Lock Script", "Appendix A: Compute Various Hash".

3.  **ESP32 Signature Generation:**
    *   The ESP32 receives the transaction hash from the relay service.
    *   It uses its securely stored `secp256k1` private key to sign this transaction hash.
    *   The ESP32 transmits the resulting `secp256k1` signature back to the relay service.

4.  **Relay Service Transaction Completion & Broadcast:**
    *   The relay service receives the `secp256k1` signature from the ESP32.
    *   It incorporates this signature into the `witnesses` field of the CKB transaction.
    *   The relay service then sends the fully constructed and signed CKB transaction to a CKB node via its RPC interface. The `ckb-dob-minter` tool "Auto-discovers your local CKB node (localhost:8114 / :8117 / custom URL) - Falls back to public RPC if no local node is found."
    *   **Citation:** `ckb-dob-minter` README: "Node auto-discovery", "Minting logic scaffold (`minter.js`)". `ckb-sdk-js` README: "provides APIs for developers to send requests to the CKB blockchain."

5.  **CKB Node Processing:**
    *   The CKB node receives the transaction.
    *   It validates the transaction, including executing the lock script associated with the input cell. This script uses the `secp256k1_verify` built-in function to verify the provided signature against the transaction hash.
    *   Upon successful validation, the transaction is included in a block, and the hardware provenance DOB (as a Spore Protocol cell with the ESP32's JSON