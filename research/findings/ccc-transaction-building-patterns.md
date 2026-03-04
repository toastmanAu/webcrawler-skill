# Research: ccc-transaction-building-patterns

**Date:** 2026-03-04  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/ckb-ccc/ccc/main/README.md, https://raw.githubusercontent.com/ckb-ccc/ccc/main/packages/core/src/signer/signer.ts, https://raw.githubusercontent.com/ckb-ccc/ccc/main/packages/core/src/transaction/transaction.ts, https://raw.githubusercontent.com/ckb-ccc/ccc/main/packages/core/src/ckb/transaction.ts, https://raw.githubusercontent.com/ckb-ccc/ccc/main/packages/connector-react/README.md, https://raw.githubusercontent.com/ckb-ccc/ccc/main/examples/ckb-transfer/src/App.tsx

---

## Research Note: CCC Transaction Building Patterns with JoyID

**Date:** 2026-03-04

### Summary
This research aimed to deep dive into CKB Component Composer (CCC) transaction building patterns, specifically for browser dApps integrating with JoyID. The goal was to clarify common API quirks and establish definitive correct patterns for `getAddresses` vs `getAddressObjs`, `bytesFrom` vs `hexFrom`, `depType` casing, `hashTypeId` arguments, transaction completion methods, and JoyID serialization. However, all provided source content URLs returned a `FETCH ERROR: HTTP Error 404: Not Found`. Consequently, it was impossible to analyze the CCC codebase or documentation to answer the research questions.

### 1. `getAddresses()` vs `getAddressObjs()` vs `getRecommendedAddressObj()` — when to use each?
Based on the provided content, the answer to this question cannot be determined as all source URLs returned a 404 error. The specific implementations and recommended usage patterns for these functions within the CCC library are not available.

### 2. `bytesFrom()` vs `hexFrom()` — when does CCC auto-convert, when does it break JoyID serialisation?
Based on the provided content, the answer to this question cannot be determined as all source URLs returned a 404 error. Without access to the CCC source code, especially `packages/core/src/ckb/transaction.ts` or similar utility files, it's impossible to understand the internal conversion logic or its interaction with JoyID's serialization requirements.

### 3. `depType` casing — 'depGroup' vs 'dep_group' vs 'code' — what are the valid values and their byte encodings?
Based on the provided content, the answer to this question cannot be determined as all source URLs returned a 404 error. The valid `depType` values, their precise casing, and their underlying byte encodings are not documented or implemented in the inaccessible source files.

### 4. `hashTypeId(cellInput, outputIndex)` — does it take CellInput or OutPoint? What about the index type (BigInt vs number)?
Based on the provided content, the answer to this question cannot be determined as all source URLs returned a 404 error. The signature and expected argument types for `hashTypeId` (e.g., `CellInput` vs `OutPoint`, `BigInt` vs `number` for `outputIndex`) are not available in the provided (missing) source code.

### 5. `completeInputsByCapacity` vs `completeInputs` vs `completeFeeBy` — correct call order and what each does?
Based on the provided content, the answer to this question cannot be determined as all source URLs returned a 404 error. The functionalities, parameters, and recommended call order for `completeInputsByCapacity`, `completeInputs`, and `completeFeeBy` within the CCC transaction building flow are not described or implemented in the inaccessible source files.

### 6. How does CCC serialise a transaction for JoyID popup — what types are safe (hex string vs Uint8Array vs BigInt)?
Based on the provided content, the answer to this question cannot be determined as all source URLs returned a 404 error. The specific serialization mechanism CCC uses when interacting with JoyID, and the safe data types (e.g., `hex string`, `Uint8Array`, `BigInt`) for transaction components, cannot be inferred from the missing documentation or example code.

### Gaps / Follow-up
The primary gap is the complete lack of source content. To answer any of the research questions, the following steps are necessary:
1.  **Obtain working URLs for the CCC repository:** The provided URLs all returned 404 errors. The repository might have moved, been renamed, or the paths might be incorrect. A working link to the `ckb-ccc/ccc` repository (or its current equivalent) is essential.
2.  **Access relevant source files:** Once the repository is accessible, specifically examine:
    *   `packages/core/src/signer/signer.ts` for address-related functions.
    *   `packages/core/src/ckb/transaction.ts` and `packages/core/src/transaction/transaction.ts` for data conversion, `depType` handling, `hashTypeId`, and transaction completion logic.
    *   `packages/connector-react/README.md` and examples like `examples/ckb-transfer/src/App.tsx` for practical integration patterns with JoyID and serialization details.
3.  **Consult official CCC documentation:** If available, a comprehensive `README.md` or dedicated documentation site would be invaluable for understanding high-level patterns and API contracts.

### Relevant Code/API Snippets
No relevant code or API snippets could be extracted due to the `FETCH ERROR: HTTP Error 404: Not Found` for all provided source URLs.