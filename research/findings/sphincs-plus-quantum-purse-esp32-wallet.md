# Research: sphincs-plus-quantum-purse-esp32-wallet

**Date:** 2026-03-07  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/cryptape/quantum-resistant-lock-script/main/README.md, https://raw.githubusercontent.com/cryptape/quantum-purse/main/README.md, https://raw.githubusercontent.com/nervosnetwork/rfcs/master/rfcs/0022-transaction-structure/0022-transaction-structure.md, https://raw.githubusercontent.com/pq-crystals/sphincsplus/master/README.md, https://raw.githubusercontent.com/espressif/esp-idf/master/components/mbedtls/mbedtls/include/mbedtls/sha256.h, https://raw.githubusercontent.com/espressif/esp-idf/master/components/esp_hw_support/include/esp_sha.h

---

## Research Note: sphincs-plus-quantum-purse-esp32-wallet

**Date:** 2026-03-07

### Summary
This research explores the feasibility of an ESP32-P4 hardware wallet for CKB using SPHINCS+ post-quantum signatures, compatible with Quantum Purse. The Quantum Purse lock script, based on NIST FIPS 205 SPHINCS+, supports all 12 parameter sets, offering flexibility in security and performance trade-offs. While signature sizes are significantly larger than traditional ECDSA, impacting CKB transaction fees, the underlying CKB transaction structure provides a clear path for the ESP32 to serialize the transaction (excluding witnesses) for signing. Key gaps remain regarding the Quantum Purse application's specific integration methods, detailed SPHINCS+ signing performance on ESP32-P4, and the direct support for SPHINCS+ key storage in ESP32-P4's secure hardware.

### 1. What is Quantum Purse? How does it differ from a standard CKB lock script — what signing algorithm and message format does it use?
The provided content indicates that "Quantum Purse" refers to a CKB lock script implementation based on the NIST FIPS 205 standard for SPHINCS+ post-quantum signatures. This lock script is available in C, Rust, and a hybrid C/Rust version (source: `cryptape/quantum-resistant-lock-script/main/README.md`).

It differs from a standard CKB lock script primarily in its signing algorithm. Standard CKB lock scripts (like the secp256k1 lock) typically rely on elliptic curve digital signatures (e.g., ECDSA). The Quantum Purse lock script, in contrast, uses SPHINCS+, a hash-based signature scheme designed to be quantum-resistant.

The `quantum-resistant-lock-script` README does not explicitly detail the message format expected by the lock script. However, CKB transaction signing generally involves signing a hash of the transaction (excluding the `witnesses` field) concatenated with a portion of the `witnesses` itself (source: `nervosnetwork/rfcs/master/rfcs/0022-transaction-structure/0022-transaction-structure.md`, Appendix A: Compute Various Hash). The SPHINCS+ signature would then be placed within the `witnesses` field.

**Note:** Information about the "Quantum Purse" *application* (e.g., a web app or client) could not be retrieved due to a "FETCH ERROR" for `cryptape/quantum-purse/main/README.md`.

### 2. Which SPHINCS+ parameter set does Quantum Purse use (sphincs-sha2-128s, 256s, shake, etc.)? Is it fixed or user-selectable?
The `quantum-resistant-lock-script` README states: "The lock script built here uses `all-in-one` mode, meaning one lock script can support all 12 parameter sets defined by NIST FIPS 205 standard." This indicates that the parameter set is **user-selectable** rather than fixed, allowing for flexibility in choosing between different security levels and performance characteristics. The README lists parameter sets such as `128s bit`, `128f bit`, `192s bit`, `192f bit`, `256s bit`, `256f bit` for both SHA2 and SHAKE hash functions.

### 3. What does the witness field look like for a Quantum Purse transaction — what bytes does the ESP32 need to produce?
The provided content does not explicitly define the exact byte structure of the `witness` field for a Quantum Purse transaction. The CKB Transaction Structure RFC (0022) describes `witnesses` as a parallel array to `inputs`, where each item is a byte vector. For a SPHINCS+ lock script, the `witness` for an input cell would typically contain the SPHINCS+ signature and potentially the public key or other parameters required by the `all-in-one` lock script to verify the signature against the transaction hash. Without specific documentation for the `quantum-resistant-lock-script`'s witness structure, the precise byte sequence the ESP32 needs to produce is unknown.

### 4. What are the signing performance benchmarks for SPHINCS+ on ESP32-P4? Are there any ESP32 or ARM Cortex benchmarks to extrapolate from?
The `quantum-resistant-lock-script` README provides "cycle consumptions" for *verification* of SPHINCS+ signatures on the CKB-VM, not for *signing* performance on an embedded device like the ESP32-P4. It notes that "`s` variants take longer to generate a signature, but takes less cycles to verify. The `f` variants are fast in signature generation but takes longer cycles to verify."

No direct signing performance benchmarks for SPHINCS+ on ESP32-P4 or generic ARM Cortex microcontrollers are provided in the source content. Therefore, it is not possible to extrapolate performance from the given information.

### 5. Does ESP-IDF expose hardware SHA-256/512 via a simple mbedTLS or esp_sha API that a SPHINCS+ implementation could use as a backend?
The provided content includes "FETCH ERROR" for `espressif/esp-idf/master/components/mbedtls/mbedtls/include/mbedtls/sha256.h` and `espressif/esp-idf/master/components/esp_hw_support/include/esp_sha.h`. Therefore, based on the provided content, it is **not possible to confirm** if ESP-IDF exposes hardware SHA-256/512 via a simple mbedTLS or `esp_sha` API.

### 6. What is the signature size for SPHINCS+ (128s vs 256s)? How does it affect CKB transaction size and fees?
The `quantum-resistant-lock-script` README provides the following signature sizes:

| Parameter Set | Signature Size (bytes) |
| :-------------------- | :--------------------- |
| `128s bit` (SHA2)     | 7856                   |
| `128f bit` (SHA2)     | 17088                  |
| `192s bit` (SHA2)     | 16224                  |
| `192f bit` (SHA2)     | 35664                  |
| `256s bit` (SHA2)     | 29792                  |
| `256f bit` (SHA2)     | 49856                  |
| `128s bit` (SHAKE)    | 7856                   |
| `128f bit` (SHAKE)    | 17088                  |
| `192s bit` (SHAKE)    | 16224                  |
| `192f bit` (SHAKE)    | 35664                  |
| `256s bit` (SHAKE)    | 29792                  |
| `256f bit` (SHAKE)    | 49856                  |

These signature sizes are significantly larger than typical ECDSA signatures (e.g., ~65 bytes for secp256k1). In CKB, transaction fees are directly proportional to the "occupied capacity" of the transaction, which includes the size of all cells and their data, as well as the `witnesses` field (source: `nervosnetwork/rfcs/master/rfcs/0022-transaction-structure/0022-transaction-structure.md`). Therefore, the large SPHINCS+ signature sizes will directly **increase CKB transaction size and consequently increase transaction fees**.

### 7. Can the ESP32-P4 eFuse + Digital Signature peripheral securely store and use a SPHINCS+ private key? What are the constraints (key size, HSM-like usage)?
The provided content confirms that the ESP32-P4 is the primary hardware target, has a dual-core 400MHz RISC-V CPU, and `secp256k1` signing is confirmed working. However, the content **does not provide any information** regarding the ESP32-P4's eFuse or Digital Signature peripheral capabilities specifically for storing and using SPHINCS+ private keys, nor does it detail any constraints related to key size or HSM-like usage for SPHINCS+.

### 8. Is there an existing C implementation of SPHINCS+ (pq-crystals reference or similar) that could be ported to ESP32-P4 with minimal changes?
The `quantum-resistant-lock-script` README mentions "A C lock script using [SPHINCS+](https://github.com/sphincs/sphincsplus)". This strongly implies that a C implementation of SPHINCS+ exists and is utilized by the CKB lock script. However, the link to `https://github.com/sphincs/sphincsplus` resulted in a "FETCH ERROR", so the specifics of this C implementation (e.g., whether it's the `pq-crystals` reference implementation or another) and its ease of porting to ESP32-P4 with minimal changes **cannot be fully assessed** from the provided content. Given that the `quantum-resistant-lock-script` itself is written in C for the CKB-VM, a C implementation is certainly available.

### 9. What would an integrated wallet UI look like — connect to Quantum Purse web app via QR, sign offline, broadcast? Any existing hardware wallet integrations with Quantum Purse?
Due to the "FETCH ERROR" for `cryptape/quantum-purse/main/README.md`, **no information is available** about the Quantum Purse web app's UI, its integration methods, or any existing hardware wallet integrations.

However, based on common hardware wallet patterns and the "open FiberQuest question" regarding ESP32-P4 CPU headroom for an emulator + light client + signer, a plausible integrated wallet UI on the ESP32-P4 could involve:
*   **Displaying a QR code:** The ESP32-P4 could display a QR code containing a partially signed transaction or a transaction hash for an external application (e.g., a Quantum Purse web app on a phone/PC) to scan.
*   **Offline signing:** The ESP32-P4 would then perform the SPHINCS+ signature generation offline using its securely stored private key.
*   **Displaying signed transaction QR:** After signing, the ESP32-P4 could display another QR code containing the fully signed transaction, which the external application would scan and then broadcast to the CKB network.
This pattern allows the ESP32-P4 to remain air-gapped during the critical signing process.

### 10. What CKB transaction fields must the ESP32 serialize before signing — is Molecule serialization required at the signing layer?
According to the CKB Transaction Structure RFC (0022), "We can compute the transaction hash from all transaction fields except `witnesses`." This means the ESP32 must serialize all CKB transaction fields *except* the `witnesses` field to compute the message hash that will be signed by SPHINCS+.

While the RFC does not explicitly state that Molecule serialization is *required* at the signing layer, CKB's data structures are defined using Molecule. Therefore, to ensure the computed transaction hash matches what the CKB node and the Quantum Purse lock script expect, the transaction fields (excluding `witnesses`) would need to be serialized into their canonical byte representation, which is typically achieved through Molecule serialization. The `ckb-light-esp` project already handles CKB protocol stacks, implying familiarity with CKB's serialization formats.

### Gaps / Follow-up
1.  **Quantum Purse Application Details:** The primary gap is the lack of information regarding the Quantum Purse application itself (e.g., its web interface, specific APIs, or expected interaction flow with a hardware wallet). This is crucial for designing a seamless user experience.
2.  **SPHINCS+ Witness Structure:** The exact byte structure required for the SPHINCS+ signature and any accompanying public key/parameters within the CKB `witness` field for the `quantum-resistant-lock-script` is not specified. This detail is essential for the ESP32 to correctly format the output.
3.  **ESP32-P4 SPHINCS+ Signing Benchmarks:** While CKB-VM verification cycles are provided, concrete benchmarks for SPHINCS+ signature generation on the ESP32-P4 (or comparable embedded RISC-V/ARM Cortex-M) are missing. This is vital for assessing the practical performance and user experience.
4.  **ESP-IDF Hardware SHA APIs:** Confirmation of simple ESP-IDF APIs for hardware SHA-256/512 acceleration is needed to optimize SPHINCS+ performance on the ESP32-P4.
5.  **ESP32-P4 Secure Key Storage for SPHINCS+:** Detailed information on using the ESP32-P4's eFuse and Digital Signature peripheral for secure storage and usage of large SPHINCS+ private keys (and their constraints) is absent.
6.  **`sphincsplus` C Library Details:** Access to the `sphincsplus` C library's documentation or source code would be beneficial to understand its API, dependencies, and ease of integration into the `wyltek-embedded-builder` framework.

### Relevant Code/API Snippets
*   **Quantum Resistant Lock Script Mainnet Deployment:**
    ```
    code_hash: 0x302d35982f865ebcbedb9a9360e40530ed32adb8e10b42fbbe70d8312ff7cedf
    hash_type: type
    tx_hash: 0x4598d00df2f3dc8bc40eee38689a539c94f6cc3720b7a2a6746736daa60f500a
    index: 0x0
    dep_type: code
    ```
    (Source: `cryptape/quantum-resistant-lock-script/main/README.md`)

*   **CKB Transaction Hash Computation (conceptual):**
    "We can compute the transaction hash from all transaction fields except `witnesses`."
    (Source: `nervosnetwork/rfcs/master/rfcs/0022-transaction-structure/0022-transaction-structure.md`, Appendix A)

*   **CKB Script Structure:**
    ```
    Script {
        code_hash: H256,
        hash_type: ScriptHashType, // "Data", "Type", or "Data1"
        args: Bytes,
    }
    ```
    (Source: `nervosnetwork/rfcs/master/rfcs/0022-transaction-structure/0022-transaction-structure.md`)