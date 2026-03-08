# Research: sensecap-lora-ckb-bridge

**Date:** 2026-03-08  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/Seeed-Solution/SenseCAP-One-Series-Meteorological-Station/master/README.md, https://raw.githubusercontent.com/Seeed-Studio/SenseCAP-Node-LoRaWAN/main/README.md, https://www.chirpstack.io/docs/, https://raw.githubusercontent.com/brocaar/chirpstack-application-server/master/README.md

---

## Research Note: sensecap-lora-ckb-bridge

**Date:** 2026-03-08

### Summary
This research explores the design of a LoRaWAN to CKB bridge using SenseCAP hardware, focusing on how sensor data can trigger on-chain CKB transactions. While specific SenseCAP hardware details and LoRaWAN payload limits could not be determined from the provided content due to inaccessible links, ChirpStack emerges as a suitable self-hosted LoRaWAN Network Server. Its architecture, which publishes received payloads over MQTT and offers gRPC/REST APIs, provides clear integration points for a custom CKB bridge application. This application would listen for LoRa uplink data, parse it, and construct CKB transactions to record sensor readings on-chain.

### 1. What SenseCAP hardware is best suited — M2 gateway, indicator, or sensor nodes?
The provided links for `SenseCAP-One-Series-Meteorological-Station/README.md` and `SenseCAP-Node-LoRaWAN/README.md` resulted in HTTP Error 404: Not Found. Therefore, based *only* on the provided content, it is not possible to determine which SenseCAP hardware (M2 gateway, indicator, or sensor nodes) is best suited for this project.

### 2. What LoRaWAN network server works best locally (ChirpStack self-hosted vs TTN)?
Based on the provided content, **ChirpStack** is explicitly described as an "open-source LoRaWAN Network Server which can be used to setup private or public LoRaWAN networks." It provides a "web-interface for the management of gateways, devices and tenants" and supports "data integrations with the major cloud providers, databases and services commonly used for handling device data." ChirpStack also offers a "gRPC based API" for integration and extension. Its architecture publishes "Received payloads over MQTT" and allows payloads to be enqueued using MQTT or the API. This makes ChirpStack highly suitable for a local, self-hosted solution, offering robust integration points. The Things Network (TTN) is mentioned in the question but no content regarding TTN was provided, so a direct comparison or recommendation for TTN cannot be made from the given sources.

### 3. How do we bridge LoRa uplink data to a CKB transaction — what's the relay architecture?
The relay architecture would leverage ChirpStack's data integration capabilities.
1.  **SenseCAP LoRaWAN Device:** A SenseCAP sensor node (assuming it's a LoRaWAN-enabled device) sends sensor data as an uplink message.
2.  **LoRaWAN Gateway:** A LoRaWAN gateway (e.g., SenseCAP M2, if suitable) receives the uplink message and forwards it to the ChirpStack Network Server.
3.  **ChirpStack Network Server & Application Server:** ChirpStack processes the LoRaWAN uplink. The ChirpStack Application Server is "responsible for the node 'inventory' part of a LoRaWAN infrastructure, handling of received application payloads and the downlink application payload queue." Crucially, "Received payloads are published over MQTT" and it provides an "API (RESTful JSON and gRPC)".
4.  **Custom CKB Bridge Application:** A custom application would act as the bridge. Given Wyltek's existing Node.js projects (e.g., `ckb-stratum-proxy`, `ckb-node-dashboard`), a Node.js application would be a natural fit. This application would:
    *   **Subscribe to MQTT:** Listen for received payloads published by ChirpStack Application Server on a configured MQTT topic.
    *   **Parse LoRa Data:** Extract the sensor reading or event data from the MQTT payload.
    *   **Construct CKB Transaction:** Use Wyltek's existing CKB JS SDKs (e.g., `@ckb-ccc/core`) to build a CKB transaction. This transaction could create a new data cell containing the sensor reading, or update an existing cell.
    *   **Sign & Send Transaction:** Sign the CKB transaction (e.g., using a configured private key or integrating with a wallet like JoyID if applicable for an automated service) and send it to the `ckbnode` (192.168.68.87:8114).

This architecture allows for real-time processing of LoRaWAN uplinks and their translation into on-chain CKB data.

### 4. What are the payload size limits on LoRaWAN and how does that constrain CKB tx data?
The provided content, specifically the ChirpStack documentation, does not contain information regarding the payload size limits of LoRaWAN. Therefore, it is not possible to determine how these limits would constrain CKB transaction data based *only* on the provided sources.

### 5. Is there prior art for LoRa → blockchain bridges we can adapt?
The provided content does not include any information or references to prior art for LoRa → blockchain bridges. Therefore, it is not possible to answer this question based *only* on the provided sources.

### Gaps / Follow-up
*   **SenseCAP Hardware Details:** The 404 errors for the SenseCAP READMEs prevent specific recommendations for hardware. Further research into SenseCAP M2 gateways and S210x sensors is needed to understand their capabilities, power requirements, and integration specifics with LoRaWAN network servers.
*   **LoRaWAN Payload Limits:** Crucial information on LoRaWAN payload size limits is missing. This directly impacts the design of CKB transactions, as sensor data must fit within these constraints. Research into LoRaWAN regional parameters (e.g., EU868, US915) would be necessary to determine practical payload sizes.
*   **CKB Transaction Design for Sensor Data:** While the general idea of putting sensor data on-chain is clear, the specific cell structure (e.g., using a simple data cell, or a custom type script for structured sensor data) needs to be defined. This would involve considering data encoding, update mechanisms, and potential CKB capacity costs.
*   **Security Considerations:** The security of the custom CKB bridge application, especially regarding private key management for signing transactions, needs to be thoroughly designed.
*   **Error Handling and Retries:** The bridge application needs robust error handling for MQTT connection issues, CKB transaction failures, and network outages.
*   **Prior Art Research:** Explicitly searching for existing LoRaWAN-to-blockchain solutions would be beneficial to identify best practices, challenges, and potential open-source components.

### Relevant Code/API Snippets
*   **ChirpStack Data Integration (MQTT):** "Received payloads are published over MQTT" (from `brocaar/chirpstack-application-server/master/README.md`). This implies a standard MQTT client library would be used in the custom CKB bridge application to subscribe to topics like `application/+/device/+/event/up`.
*   **ChirpStack Data Integration (gRPC/REST API):** "ChirpStack provides a gRPC based API that can be used to integrate or extend ChirpStack." and "API (RESTful JSON and gRPC)" (from `chirpstack.io/docs/` and `brocaar/chirpstack-application-server/master/README.md`). A Node.js application could use gRPC client libraries or standard HTTP clients to interact with these APIs.
*   **CKB Transaction Building:** Wyltek already uses `@ckb-ccc/core` for CKB transaction building. The custom bridge application would utilize this SDK to construct transactions, for example:
    ```javascript
    // Example (conceptual) using @ckb-ccc/core
    import { createRawTransaction, signTransaction, sendTransaction } from '@ckb-ccc/core';

    async function createSensorDataCell(sensorData, privateKey, ckbRpcUrl) {
        // 1. Fetch live cells for the sender address
        // 2. Construct an output cell with capacity and sensorData in its data field
        //    e.g., { capacity: '0x...', lock: senderLockScript, data: '0x' + Buffer.from(JSON.stringify(sensorData)).toString('hex') }
        // 3. Create raw transaction
        const rawTx = createRawTransaction({
            // ... inputs, outputs, cellDeps ...
        });
        // 4. Sign transaction
        const signedTx = await signTransaction(rawTx, privateKey);
        // 5. Send transaction
        const txHash = await sendTransaction(signedTx, ckbRpcUrl);
        return txHash;
    }
    ```