# Research: esp32s3-signing-remote-architecture

**Date:** 2026-03-07  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/nervosnetwork/ckb/develop/rpc/README.md, https://raw.githubusercontent.com/toastmanAu/wyltek-embedded-builder/main/README.md, https://docs.espressif.com/projects/esp-idf/en/latest/esp32s3/api-reference/network/esp_wifi.html

---

Date: 2026-03-07

## Summary

This research investigates the communication layer for an ESP32-S3 based signing remote, focusing on interaction with an RK3528 node box on a home LAN. While specific ESP32-S3 board recommendations for a compact form factor are not found in the provided content, the CKB node supports both HTTP JSON-RPC and WebSockets for subscriptions. For the node box to signing remote communication, a custom WebSocket API is recommended for low-latency transaction push and signature return, leveraging the ESP32's robust Wi-Fi capabilities. Unsigned transactions should be serialized as JSON for transfer, and the remote must implement robust Wi-Fi management and security protocols for offline scenarios.

## Questions to Answer

### 1. What ESP32-S3 touchscreen boards exist in a compact "remote" form factor (sub-100mm)? CST816 touch + colour display?

The provided content does not list specific ESP32-S3 touchscreen boards, their form factors, or display specifications (like CST816 touch + colour display) suitable for a compact "remote" form factor (sub-100mm). The `ckb-light-esp` project targets ESP32-S3 (among others) and `NerdMiner CKB` mentions `ESP32-2432S028R (CYD)`, but these do not specify the desired form factor or display components for a signing remote.

### 2. REST vs WebSocket for node box ↔ signing remote comms — latency and reliability on home LAN?

For communication between the RK3528 node box and the ESP32-S3 signing remote:

*   **CKB Node RPC Support:** The CKB node itself primarily supports HTTP JSON-RPC for most methods and WebSockets for subscriptions. This refers to the `node box <-> CKB node` communication.
*   **Node Box ↔ Signing Remote:**
    *   **WebSocket:** Offers a full-duplex, persistent connection. This is highly suitable for a "push" model where the node box can immediately send an unsigned transaction to the remote for approval, and the remote can return the signed transaction without needing to re-establish a connection for each interaction. This generally results in lower effective latency for interactive, real-time scenarios compared to repeated HTTP requests.
    *   **REST (HTTP):** Involves establishing a new connection (or reusing one via keep-alive) for each request/response cycle. While reliable on a home LAN, it might introduce slightly higher latency for a rapid sequence of interactions compared to WebSockets due to connection overhead. It would typically require the remote to poll the node box for pending transactions, or the node box to initiate a new HTTP request to the remote.

**Conclusion:** Given the goal of "low-latency transaction approval" and the need for the node box to likely *push* unsigned transactions to the remote, a **WebSocket-based custom API** between the node box and the signing remote would be the most efficient and lowest-latency option. The ESP32-S3 has robust Wi-Fi capabilities, as evidenced by `ckb-light-esp` and `esp_wifi.h` documentation, making WebSocket implementation feasible.

### 3. What CKB RPC calls does the signing remote need to consume (get pending tx, broadcast signed tx)?

The signing remote's role is to "receive an unsigned transaction, display it human-readably, and return a signed one." Based on this architecture, the **signing remote itself does not directly consume CKB RPC calls**.

Instead:
*   The **RK3528 node box** would interact with the CKB node (192.168.68.87) using CKB RPC calls to:
    *   Retrieve necessary cell data (e.g., `get_cells` from the Indexer module).
    *   Get chain state (e.g., `get_tip_header`, `get_tip_block_number` from the Chain module).
    *   Estimate fees (e.g., `estimate_fee_rate` from the Experiment module).
    *   Construct the unsigned transaction.
*   The **node box** would then send this unsigned transaction to the signing remote via a custom API (e.g., over WebSocket).
*   The **signing remote** would sign the transaction using its `secp256k1` capabilities.
*   The **signing remote** would return the signed transaction to the node box via the custom API.
*   Finally, the **node box** would broadcast the signed transaction to the CKB node. The specific CKB RPC method for broadcasting a signed transaction, typically `send_transaction`, is *not explicitly listed* in the provided `CKB JSON-RPC Protocols` documentation snippet.

### 4. How should unsigned transaction data be serialised and transferred to the signing remote?

*   **Serialization:** Unsigned transaction data should be serialized using **JSON**. CKB transactions are complex objects with various fields (inputs, outputs, witnesses, etc.), and JSON is a widely supported, human-readable, and easily parsable format. The CKB RPC itself uses JSON for transaction representation (e.g., `get_transaction` returns JSON). The `ckb-ccc/core` JS SDK is used for transaction building, which naturally works with JSON objects.
*   **Transfer:** The serialized JSON transaction data should be transferred over the chosen communication channel, ideally a **WebSocket connection**, between the node box and the signing remote. This allows for efficient, low-latency push of the transaction data.

### 5. What display resolution/size is practical for showing a human-readable transaction summary (address, amount, fee)?

The provided content does not contain any information or specifications regarding practical display resolutions or sizes for showing a human-readable transaction summary. This is a user interface/experience design consideration that falls outside the scope of the provided technical documentation.

### 6. How should the signing remote handle being offline or out of WiFi range safely?

The ESP32-S3 has comprehensive Wi-Fi management capabilities, as detailed in the `esp_wifi.h` documentation. Safe handling of offline scenarios would involve:

1.  **Connection Management:**
    *   Utilize `esp_wifi_init()`, `esp_wifi_set_mode()`, `esp_wifi_start()`, and `esp_wifi_connect()` to manage Wi-Fi connection.
    *   Implement robust reconnection logic using the `failure_retry_cnt` feature in `wifi_sta_config_t` mentioned in `esp_wifi_connect()` documentation, or custom application-level retry mechanisms.
    *   Monitor Wi-Fi status using ESP-IDF event handlers to detect disconnections.
2.  **Operational Safety:**
    *   **Refuse to sign when offline:** The signing remote must explicitly refuse to process or sign any transaction if it cannot establish or maintain a secure connection to the RK3528 node box.
    *   **Clear User Feedback:** Display prominent "Offline" or "No Connection" messages on the device's screen to inform the user of its status.
    *   **No Persistent Storage of Unsigned Transactions:** For security, unsigned transaction data received from the node box should generally *not* be persistently stored on the remote if it cannot be processed immediately. If temporary storage is absolutely necessary (e.g., during a brief network flicker), it must be in volatile memory (RAM) and cleared upon power cycle or timeout, or be strongly encrypted.
    *   **Node Box Responsibility:** The node box should be designed to handle cases where the signing remote is unreachable, potentially queuing transactions or notifying the user.

## Gaps / Follow-up

1.  **Specific ESP32-S3 Board Recommendations:** The provided content lacks specific recommendations for ESP32-S3 boards that fit a compact "remote" form factor with a touchscreen. Further research into available hardware is needed.
2.  **CKB `send_transaction` RPC:** The `CKB JSON-RPC Protocols` snippet provided does not explicitly list the `send_transaction` RPC method, which is crucial for broadcasting signed transactions. Confirmation of its exact signature and module is needed for the node box implementation.
3.  **Custom API Specification:** While a WebSocket API is suggested for node box ↔ signing remote communication, the exact structure of the custom API calls (e.g., for requesting a signature, returning a signed transaction) needs to be defined.
4.  **Transaction Data Structure for Display:** The exact fields and their formatting required for a human-readable transaction summary on the remote's display are not specified. This would involve UI/UX design considerations.
5.  **Security Protocols for Custom API:** The communication between the node box and signing remote should be secured (e.g., TLS over WebSocket) to prevent eavesdropping or tampering with transaction data. The provided content mentions CKB RPC needing SSL via proxy, but not for the custom node box ↔ remote link.
6.  **`wyltek-embedded-builder` README:** The README for `wyltek-embedded-builder` could not be fetched (HTTP Error 404). Access to this documentation might provide insights into existing embedded CKB/blockchain app development patterns relevant to the signing remote.

## Relevant Code/API Snippets

*   **CKB JSON-RPC Protocols (HTTP/WebSocket support):**
    *   "CKB JSON-RPC only supports HTTP now."
    *   "Subscriptions require a full duplex connection. CKB offers such connections in the form of TCP ... and WebSockets (enable with `rpc.ws_listen_address`)."
*   **ESP-IDF Wi-Fi (Connection Management):**
    *   `esp_err_t esp_wifi_init ( const wifi_init_config_t * config )`
    *   `esp_err_t esp_wifi_set_mode ( wifi_mode_t mode )`
    *   `esp_err_t esp_wifi_start ( void )`
    *   `esp_err_t esp_wifi_connect ( void )`
    *   `esp_err_t esp_wifi_disconnect ( void )`
    *   `Attention 4. This API attempts to connect to an Access Point (AP) only once. To enable reconnection in case of a connection failure, please use the 'failure_retry_cnt' feature in the ' wifi_sta_config_t '.`
*   **CKB RPC Methods (for Node Box interaction with CKB node):**
    *   `get_cells` (Module Indexer)
    *   `get_tip_header` (Module Chain)
    *   `get_tip_block_number` (Module Chain)
    *   `estimate_fee_rate` (Module Experiment)
*   **Project Ground Truth (Signing Capability):**
    *   `secp256k1 signing confirmed working` (on ESP32-P4, implies for S3)
    *   `CCC (@ckb-ccc/core) = primary JS SDK for CKB transaction building` (relevant for node box)