# Research: ckb-ccc-external-signing-node-js-flow

**Date:** 2026-03-05  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://github.com/ckb-ccc/ccc, https://docs.joy.id/, https://raw.githubusercontent.com/ckb-ccc/ccc/main/packages/core/src/signer/signer.ts, https://raw.githubusercontent.com/ckb-ccc/ccc/main/packages/core/src/transaction/transaction.ts

---

Date: 2026-03-05

## Research Note: ckb-ccc-external-signing-node-js-flow

### Summary
The research goal was to clarify the data flow and API calls for a Node.js backend using `@ckb-ccc/core` to facilitate external signing of CKB transactions by a browser-based wallet like JoyID. However, the provided source content for `ckb-ccc` (including its GitHub repository and specific source files) resulted in "FETCH ERROR: HTTP Error 404: Not Found". Consequently, precise details regarding `ckb-ccc` methods, payload formats, and integration steps for a Node.js backend in this specific flow cannot be extracted from the given information. The JoyID documentation describes its capabilities for signing transactions but does not detail the backend-to-wallet communication protocol or the specific `ckb-ccc` APIs for preparing such requests.

### 1. What `ckb-ccc` methods are used by a Node.js backend to prepare a transaction for external signing?
Based on the provided content, the specific `ckb-ccc` methods used by a Node.js backend to prepare a transaction for external signing are not detailed. The `ckb-ccc` GitHub repository and relevant source files (`signer.ts`, `transaction.ts`) were not accessible (FETCH ERROR: HTTP Error 404: Not Found). Therefore, it is not possible to identify the exact methods from the given information.

### 2. What is the exact payload format sent to an external signer (e.g., JoyID) for signature?
The exact payload format sent to an external signer like JoyID for signature is not specified in the provided content. While the JoyID documentation mentions "CKB Connect" and the ability to "Sign Transaction" and "Sign Raw Transaction", it describes these from the perspective of the wallet's capabilities and user interaction, rather than detailing the precise API request structure or payload format expected by the wallet from an external application. The missing `ckb-ccc` documentation also prevents identifying any standard payload formats defined by that library.

### 3. How does the Node.js backend receive and integrate the signature back into the transaction for broadcasting?
The provided content does not detail how the Node.js backend receives and integrates the signature back into the transaction for broadcasting. This information would typically be found within the `ckb-ccc` documentation or source code, which was inaccessible (FETCH ERROR: HTTP Error 404: Not Found). Without this, the specific `ckb-ccc` functions or patterns for handling the returned signature and constructing the final signed transaction are unknown.

### 4. Are there any specific `ckb-ccc` helpers or examples for this Node.js-to-browser signing flow?
No specific `ckb-ccc` helpers or examples for a Node.js-to-browser signing flow are provided in the content. The `ckb-ccc` documentation and source files were unavailable. The JoyID documentation focuses on the wallet's features and user interaction rather than providing code examples for integrating with a Node.js backend.

### Gaps / Follow-up
The primary gap is the complete lack of access to the `ckb-ccc` documentation and source code (https://github.com/ckb-ccc/ccc, `signer.ts`, `transaction.ts`). To answer the research questions precisely, the following information is required:
*   The official API documentation for `@ckb-ccc/core`, specifically for transaction building and signing interfaces.
*   Source code examples or documentation illustrating the process of constructing a transaction object suitable for external signing.
*   Details on the expected data structure or payload format that `ckb-ccc` would generate for an external signing request.
*   Information on how `ckb-ccc` processes a returned signature to finalize a transaction.
*   Examples of a Node.js backend implementing this flow with `@ckb-ccc/core`.

### Relevant Code/API Snippets
Due to the "FETCH ERROR: HTTP Error 404: Not Found" for all `ckb-ccc` related links, no specific code or API snippets from `ckb-ccc` can be cited.

From the JoyID documentation (https://docs.joy.id/):
*   **CKB Connect**
    *   Sign Message
    *   Verify Message
    *   Sign Transaction
    *   Sign Cota NFT Transaction
    *   Sign Raw Transaction

These entries indicate JoyID's capability to sign CKB transactions, but do not provide the API details for an external application requesting such a signature.