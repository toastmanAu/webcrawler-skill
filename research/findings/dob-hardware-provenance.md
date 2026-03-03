# Research: dob-hardware-provenance-schema

**Date:** 2026-03-03  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/nervosnetwork/rfcs/master/rfcs/0022-transaction-structure/0022-transaction-structure.md, https://raw.githubusercontent.com/sporeprotocol/spore-sdk/main/docs/core/spore-data.md, https://schema.org/Product, https://www.ietf.org/archive/id/draft-ietf-rats-eat-21.txt, https://raw.githubusercontent.com/toastmanAu/ckb-dob-minter/main/README.md

---

Date: 2026-03-03

## Summary
This research outlines a JSON schema for hardware provenance Digital Objects (DOBs) on the Nervos CKB blockchain, leveraging the Spore Protocol. The proposed schema uses `application/json` as its content type and incorporates fields for device identification, firmware details, and test results, drawing inspiration from the IETF Entity Attestation Token (EAT) standard. The `ckb-dob-minter` project provides a direct example of minting such objects fully on-chain, establishing prior art for hardware attestation beyond mere NFT metadata. While the CKB transaction structure details how assets are locked and signed, the specific flow for an ESP32 device to sign a payload for minting is not explicitly detailed in the provided content.

## Questions to Answer

### 1. What content_type should hardware provenance DOBs use?
For hardware provenance DOBs storing JSON data, the `content-type` should be `application/json`.

**Citation:** The `ckb-dob-minter` README explicitly states under "Wyltek Hardware DOB Format":
```json
{
  "device": "ESP32-2432S028R",
  "serial": "WY-2026-001",
  "firmware": "0.1.0",
  "firmware_hash": "0x...",
  "test_results": {
    "flash": "ok",
    "wifi": "ok"
  },
  "minted_by": "ckb1q..."
}
```
And above this example, it specifies: `content-type: application/json`.

### 2. Does EAT (Entity Attestation Token) give us a head start on field naming?
Yes, the Entity Attestation Token (EAT) provides a significant head start on field naming for describing device state and characteristics. Many of its claims directly map to the requirements for hardware provenance.

**Relevant EAT Claims and their mapping:**
*   **`ueid` (Universal Entity ID) Claim:** Can be used for a globally unique device identifier, potentially more robust than a simple `serial`.
*   **`oemid` (Hardware OEM Identification) Claim:** Useful for identifying the manufacturer of the hardware.
*   **`hwmodel` (Hardware Model) Claim:** Directly corresponds to "board type" or device model.
*   **`hwversion` (Hardware Version) Claim:** For the hardware revision.
*   **`swname` (Software Name) Claim:** For the firmware name.
*   **`swversion` (Software Version) Claim:** Directly corresponds to "firmware" version.
*   **`measurements` (Measurements) Claim:** Can be used to store cryptographic measurements of software/firmware components, which aligns with "firmware hash".
*   **`measres` (Software Measurement Results) Claim:** Can store results of software measurements, potentially including hashes.
*   **`dbgstat` (Debug Status) Claim:** Could be relevant for provenance, indicating if debug features were enabled during manufacturing or testing.

**Citation:** `draft-ietf-rats-eat-21.txt` sections 4.2.1 (ueid), 4.2.3 (oemid), 4.2.4 (hwmodel), 4.2.5 (hwversion), 4.2.6 (swname), 4.2.7 (swversion), 4.2.15 (manifests), 4.2.16 (measurements), 4.2.17 (measres).

### 3. Minimum viable schema: what fields are non-negotiable for a hardware cert?
Based on the research goal ("device serial, firmware hash, board type, test results") and the `ckb-dob-minter`'s "Wyltek Hardware DOB Format", the minimum viable schema should include:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Hardware Provenance DOB",
  "description": "On-chain certificate for hardware provenance.",
  "type": "object",
  "required": [
    "serial",
    "hwmodel",
    "firmware_version",
    "firmware_hash",
    "test_results",
    "minted_by"
  ],
  "properties": {
    "serial": {
      "type": "string",
      "description": "Unique serial number of the device.",
      "pattern": "^[A-Z0-9-]{3,}$"
    },
    "hwmodel": {
      "type": "string",
      "description": "Hardware model or board type (e.g., ESP32-2432S028R)."
    },
    "firmware_version": {
      "type": "string",
      "description": "Firmware version installed on the device (e.g., 0.1.0)."
    },
    "firmware_hash": {
      "type": "string",
      "description": "Cryptographic hash of the firmware binary (e.g., SHA256), prefixed with '0x'.",
      "pattern": "^0x[0-9a-fA-F]{64}$"
    },
    "test_results": {
      "type": "object",
      "description": "Results of manufacturing tests.",
      "properties": {
        "flash": { "type": "string", "enum": ["ok", "fail"] },
        "wifi": { "type": "string", "enum": ["ok", "fail"] }
      },
      "required": ["flash", "wifi"],
      "additionalProperties": true
    },
    "minted_by": {
      "type": "string",
      "description": "CKB address of the entity that minted this DOB.",
      "pattern": "^ckb1[0-9a-z]{40,}$"
    },
    "ueid": {
      "type": "string",
      "description": "Universal Entity ID (from EAT standard), if available."
    },
    "oemid": {
      "type": "string",
      "description": "Hardware OEM Identification (from EAT standard), if available."
    },
    "hwversion": {
      "type": "string",
      "description": "Hardware version/revision (from EAT standard), if available."
    },
    "timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "Timestamp of when the attestation was generated/minted."
    }
  },
  "additionalProperties": true
}
```
**Explanation:**
*   `serial`: Unique identifier for the specific device.
*   `hwmodel`: Identifies the type of board/device. (Mapped from `device` in `ckb-dob-minter` and `hwmodel` in EAT).
*   `firmware_version`: The version of the software running on the device. (Mapped from `firmware` in `ckb-dob-minter` and `swversion` in EAT).
*   `firmware_hash`: A cryptographic fingerprint of the firmware, crucial for verifying its integrity. (Directly from `ckb-dob-minter` and aligns with EAT's `measurements`).
*   `test_results`: Essential for proving the device passed quality control.
*   `minted_by`: The on-chain identity responsible for minting the certificate.

**Citation:** Derived from the research topic's goal and the "Wyltek Hardware DOB Format" in `ckb-dob-minter` README, with additional considerations from `draft-ietf-rats-eat-21.txt`. The `device` field from `ckb-dob-minter` is renamed to `hwmodel` for better alignment with EAT. `firmware` is split into `firmware_version` for clarity.

### 4. How does the ESP32 sign the payload before minting? (ckb-esp32-signer flow)
The provided content does not explicitly describe a "ckb-esp32-signer flow" for an ESP32 device to sign a payload before minting.

The `ckb-dob-minter` README mentions that the *browser-based tool* "Connects via JoyID (passkey) or MetaMask" for wallet connection, which handles the transaction signing for the user initiating the mint. This refers to the user's wallet signing the CKB transaction that *contains* the DOB, not the ESP32 signing the *DOB payload itself*.

The CKB Transaction Structure RFC (0022) explains that "The most popular way to lock a digital asset is the digital signature created by asymmetric crypto" and details `lock scripts` and `witnesses` as the mechanism for securing cells and validating transactions. However, it does not specify how an embedded device like an ESP32 would generate these signatures or integrate with this process.

Therefore, based *solely* on the provided content, the specific "ckb-esp32-signer flow" is not described.

### 5. Any prior art: hardware attestation on blockchain (not just NFT metadata)?
Yes, the `ckb-dob-minter` project itself, along with the Spore Protocol, serves as direct prior art for hardware attestation on the blockchain, going beyond just NFT metadata.

The `ckb-dob-minter` README explicitly states its purpose for "hardware provenance DOBs" and describes how it "Stores content **fully on-chain** in a Spore Protocol cell." This means the entire JSON structure describing the hardware provenance (device serial, firmware hash, test results, etc.) is stored directly in the `data` field of a CKB cell, making it an immutable, verifiable on-chain record. This is distinct from merely referencing off-chain data or storing minimal metadata on-chain.

The "Wyltek Hardware DOB Format" provided in the `ckb-dob-minter` README is a concrete example of such an on-chain attestation.

**Citation:**
*   `ckb-dob-minter` README: "Stores content **fully on-chain** in a Spore Protocol cell"
*   `ckb-dob-minter` README: "Wyltek Hardware DOB Format For hardware provenance DOBs, use `content-type: application/json` with: [...]"

The Entity Attestation Token (EAT) (`draft-ietf-rats-eat-21.txt`) describes a standard for attesting to the state and characteristics of devices (like IoT devices), which is highly relevant to hardware attestation. While EAT itself is a general standard and not blockchain-specific, its claims can be directly incorporated into blockchain-based attestation systems like the one proposed for CKB.

## Gaps / Follow-up

1.  **Spore Protocol Documentation:** The `spore-sdk/main/docs/core/spore-data.md` link resulted in a `FETCH ERROR: HTTP Error 404: Not Found`. Accessing the official Spore Protocol documentation would be crucial for understanding any specific requirements or best practices for `content_type` or data structures within Spore cells beyond what `ckb-dob-minter` provides.
2.  **ESP32 Signing Flow:** The specific mechanism for an ESP32 to generate and submit a signature for a CKB transaction (or the DOB payload itself) is not detailed. This would require research into CKB SDKs for embedded systems, secure element integration, or specific CKB-compatible signing libraries for ESP32.
3.  **Schema.org/Product:** The `schema.org/Product` content was garbled. If accessible, this could provide additional standard fields for product description that might be useful for a more comprehensive hardware provenance schema.
4.  **EAT Integration Details:** While EAT provides field naming, the full implications of integrating EAT (e.g., using CWT/JWT structures, specific profiles, or detached bundles) into a CKB DOB would require further analysis.
5.  **Test Results Standardization:** The `test_results` field in the minimum viable schema is a basic object. For real-world use, standardizing the format and types of test results (e.g., specific test IDs, pass/fail codes, measurement values) would be beneficial.

## Relevant Code/API Snippets

**Spore DOB Cell Structure (from `ckb-dob-minter` README):**
```
data:
  content-type: "image/png" # MIME type
  content: # your file, fully on-chain
cluster_id: # collection ID
type:
  code_hash: SPORE_TYPE_DATA_HASH
  args: SPORE_ID
lock:
```

**Wyltek Hardware DOB Format (from `ckb-dob-minter` README):**
```json
{
  "device": "ESP32-2432S028R",
  "serial": "WY-2026-001",
  "firmware": "0.1.0",
  "firmware_hash": "0x...",
  "test_results": {
    "flash": "ok",
    "wifi": "ok"
  },
  "minted_by": "ckb1q..."
}
```

**CKB Transaction Structure - Cell Data (from RFC 0022):**
"Instead of holding only the token value, CKB cell can store arbitrary data as well. The field `outputs_data` is a parallel array of outputs. The data of the i-th cell in `outputs` is the i-th item in `outputs_data`." This confirms that the JSON content for the DOB is stored directly in the cell's data.