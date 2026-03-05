# Research: sidecar-secure-key-management

**Date:** 2026-03-05  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://docs.nervos.org/, https://github.com/ckb-ccc/ccc, https://github.com/toastmanAu/ckb-dob-minter, https://github.com/nervosnetwork/fiber, https://docs.joy.id/

---

Date: 2026-03-05

## Summary

This research investigates secure key management for the FiberQuest Node.js sidecar, focusing on external signing for CKB on-chain Fiber channel transactions. While the `ckb-ccc` SDK is identified for transaction building, its specific capabilities for facilitating external signing from a Node.js backend could not be fully detailed due to a broken GitHub link. JoyID is confirmed as a capable external signer for CKB transactions. Best practices for temporary private key management in Node.js were not found within the provided content. A recommended flow involves the Node.js sidecar preparing transactions (potentially with Fiber node RPC assistance), sending them to a user's browser-based JoyID for signing, and then broadcasting the signed transaction to the CKB network.

## Questions to Answer

### 1. Can `ckb-ccc` facilitate external signing requests (e.g., to a browser-based JoyID instance or an ESP32 hardware signer) from a Node.js backend?

The provided content states that `@ckb-ccc/core` is the "JS SDK for building CKB transactions" (Project Ground Truth: CKB Layer 1). While the direct link to the `ckb-ccc` GitHub repository resulted in a 404 error, preventing an in-depth analysis of its specific APIs, the general pattern for JavaScript SDKs in blockchain environments is to provide utilities for:
1.  Constructing raw, unsigned transactions.
2.  Serializing these transactions into a format suitable for signing.
3.  Broadcasting *signed* transactions.

JoyID's documentation explicitly lists "CKB Connect" capabilities including "Sign Transaction" and "Sign Raw Transaction" (JoyID Docs: CKB Connect). This indicates that JoyID is designed to receive transaction data and return a signature or a fully signed transaction.

Therefore, it is highly probable that `ckb-ccc` can facilitate external signing by allowing the Node.js backend to:
1.  **Build the unsigned CKB transaction** required for Fiber channel open/close.
2.  **Serialize this transaction** into a format (e.g., a raw transaction hex or a transaction hash) that can be sent to an external signer.
3.  **Receive the signature** (or signed transaction) back from the external signer.
4.  **Integrate the signature** into the transaction and broadcast it.

The "facilitation" would primarily be in preparing the transaction for signing, rather than directly handling the communication with the external signer itself, which would typically involve a separate communication layer (e.g., a web socket, HTTP API, or a user-facing prompt in a browser for JoyID).

### 2. What are the best practices for securely managing a *temporary* private key for a Node.js hackathon demo (e.g., environment variables, encrypted file, in-memory only)?

The provided web content and project ground truth **do not contain any information** regarding best practices for securely managing temporary private keys for Node.js applications, hackathon demos, environment variables, encrypted files, or in-memory storage.

### 3. What is the recommended flow for the Node.js sidecar to initiate an on-chain Fiber channel transaction and get it signed by an external entity (e.g., a user's JoyID wallet)?

Based on the provided information, the recommended flow for the Node.js sidecar to initiate and sign an on-chain Fiber channel transaction using an external entity like JoyID would be:

1.  **Node.js Sidecar Initiates Fiber Channel Operation:**
    *   The Node.js sidecar, upon a game event (e.g., game start for `open_channel`, game end for channel settlement), determines the need to open or close a Fiber channel.
    *   It communicates with the local Fiber node (running on `ckbnode` at `127.0.0.1:8227` via SSH tunnel to N100:8237).
    *   The sidecar calls the relevant Fiber node RPC method, such as `open_channel`. This RPC call would likely provide the necessary parameters for the CKB transaction.

2.  **Fiber Node Prepares CKB Transaction:**
    *   The Fiber node processes the `open_channel` request and constructs the *unsigned* CKB transaction required to open the channel on Layer 1. This transaction would include the necessary cells, lock scripts, and type scripts for Fiber.
    *   The Fiber node returns this unsigned CKB transaction (or a transaction template/payload) to the Node.js sidecar.

3.  **Node.js Sidecar Prepares for External Signing:**
    *   The Node.js sidecar receives the unsigned CKB transaction data from the Fiber node.
    *   Using the `@ckb-ccc/core` SDK (the JS SDK for building CKB transactions), the sidecar processes this data to ensure it's in a format suitable for external signing. This might involve generating a transaction hash or a raw transaction payload.

4.  **External Signing Request to JoyID:**
    *   The Node.js sidecar sends the unsigned transaction data (or hash) to a user-facing interface (e.g., a browser tab or a dedicated web application opened by the user).
    *   This user interface then interacts with the user's browser-based JoyID wallet. JoyID, being a "web-based wallet solution" that supports "Sign Transaction" for CKB, would prompt the user for biometric authentication (Face ID/Touch ID) to authorize the transaction.

5.  **JoyID Signs Transaction:**
    *   Upon user approval, JoyID signs the transaction using the user's private key (managed securely by JoyID via FIDO Webauthn).
    *   JoyID returns the signed transaction (or the signature) to the user-facing interface.

6.  **Node.js Sidecar Receives Signed Transaction:**
    *   The user-facing interface relays the signed transaction back to the Node.js sidecar.

7.  **Node.js Sidecar Broadcasts Transaction:**
    *   The Node.js sidecar receives the fully signed CKB transaction.
    *   It then broadcasts this signed transaction to the CKB Layer 1 network via the CKB full node (running on `ckbnode` at `192.168.68.87`).

This flow leverages JoyID's secure, non-custodial signing capabilities and separates key management from the Node.js sidecar, enhancing security.

## Gaps / Follow-up

*   **`ckb-ccc` Documentation:** The `github.com/ckb-ccc/ccc` link resulted in a 404. Full documentation for `@ckb-ccc/core` is needed to understand its precise APIs for transaction construction, serialization, and integration with external signing flows. This would clarify how exactly the Node.js sidecar would build the transaction before sending it to JoyID.
*   **Fiber Node RPC Output for `open_channel`:** The exact structure of the unsigned CKB transaction returned by the Fiber node's `open_channel` RPC method is unknown. Understanding this structure is crucial for the Node.js sidecar to correctly prepare it for JoyID signing.
*   **Communication Protocol for External Signing:** The specific communication protocol or method for the Node.js sidecar to send transaction data to a browser-based JoyID instance and receive the signed transaction back needs to be defined. This could involve WebSockets, a local HTTP server, or a custom bridge.
*   **ESP32 Hardware Signer Integration:** While JoyID is covered, the feasibility and integration methods for an ESP32 hardware signer were not detailed in the provided content. This would require separate research into CKB signing libraries for embedded systems and secure communication protocols.
*   **Temporary Private Key Management:** As noted in Q2, the provided content offers no guidance on managing temporary private keys for hackathon demos. This is a critical security aspect that requires external research or established best practices.

## Relevant Code/API Snippets

*   **Fiber Node RPC Methods (conceptual):**
    ```
    // Example RPC call from Node.js sidecar to Fiber node
    // (Actual implementation would use a client library for RPC over SSH tunnel)
    fiberNodeRpc.open_channel({
        participant_address: "ckb_address_of_other_participant",
        capacity: "amount_in_ckbytes",
        udt_amount: "amount_of_udt_if_any",
        // ... other channel parameters
    })
    .then(unsignedTx => {
        // unsignedTx would be the CKB transaction data returned by the Fiber node
        // ready to be sent for external signing
    });
    ```
*   **JoyID CKB Connect API (conceptual, based on docs):**
    ```javascript
    // In a browser context, interacting with JoyID
    async function signTransactionWithJoyID(unsignedTransaction) {
        try {
            const signedTransaction = await window.joyid.ckb.signTransaction(unsignedTransaction);
            return signedTransaction;
        } catch (error) {
            console.error("JoyID signing failed:", error);
            throw error;
        }
    }
    ```
    *   **Citation:** JoyID Docs: CKB Connect -> Sign Transaction.
*   **`@ckb-ccc/core` (conceptual, based on SDK role):**
    ```javascript
    // In Node.js sidecar, using ckb-ccc to build/process transactions
    // (Exact API depends on actual ckb-ccc documentation)
    import { TransactionBuilder } from '@ckb-ccc/core';

    // Assuming 'unsignedTxData' is received from the Fiber node
    const txBuilder = new TransactionBuilder(unsignedTxData);
    const rawTransactionToSign = txBuilder.toRawTransaction(); // Or similar method to get signable payload

    // ... then send rawTransactionToSign to external signer ...

    // After receiving signature from JoyID
    const signedTransaction = txBuilder.addSignature(joyidSignature).build();

    // Broadcast signedTransaction to CKB node
    // ckbNodeRpc.send_transaction(signedTransaction);
    ```
    *   **Citation:** Project Ground Truth: CKB Layer 1 (`@ckb-ccc/core` is JS SDK for building CKB transactions).