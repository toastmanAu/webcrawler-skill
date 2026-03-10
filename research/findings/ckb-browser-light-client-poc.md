# Research: ckb-browser-light-client-poc

**Date:** 2026-03-10  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/nervosnetwork/ckb/develop/rpc/README.md, https://raw.githubusercontent.com/nervosnetwork/rfcs/master/rfcs/0044-ckb-light-client/0044-ckb-light-client.md, https://raw.githubusercontent.com/ckb-js/lumos/develop/packages/ckb-indexer/README.md, https://raw.githubusercontent.com/ckb-js/ccc/master/README.md, https://raw.githubusercontent.com/paulmillr/noble-hashes/main/README.md, https://api.github.com/repos/nervosnetwork/ckb-light-client/contents/src

---

## Research Note: ckb-browser-light-client-poc

**Date:** 2026-03-10

### Summary

This research outlines the design and feasibility of a pure-JavaScript browser light client for CKB, leveraging a full node's JSON-RPC over HTTPS. The core approach involves using the `get_block_filter` RPC to efficiently identify relevant blocks for a given lock script, fetching only those blocks, and then parsing transactions client-side to derive UTXOs and calculate a balance. While key RPC methods like `get_block_filter`, `get_block`, and `get_header` are available, the `get_block_mmr_proof` RPC for full chain integrity verification is not yet implemented, necessitating a fallback to header chain verification. Existing CKB JavaScript SDKs like `@ckb-ccc/core` and `@ckb-lumos/ckb-indexer` do not provide the specific client-side GCS filter processing or raw block UTXO derivation required for this light client model, though Lumos's indexer offers server-side filtering. Essential JavaScript primitives for BLAKE2b are available via `noble-hashes`, but GCS decoding, Molecule parsing for `CellOutput`, and CKB address decoding would require new implementations or external libraries not detailed in the provided content.

### Questions to Answer

#### 1. Can `get_block_filter` RPC be used for identifying blocks relevant to a specific lock script?

Yes, the `get_block_filter` RPC method is explicitly listed under the `Module Chain` in the CKB JSON-RPC Protocols documentation. This method is intended for fetching GCS (Golomb-Rice Coded Set) block filters, which can then be used client-side to probabilistically determine if a block contains transactions relevant to a specific lock script without downloading the entire block.

**Citation:**
- `ckb/rpc/README.md`: "Module Chain... Method `get_block_filter`"

#### 2. What RPC methods are available for fetching block data and headers, and for verifying chain integrity (especially MMR proofs)?

**Fetching Block Data:**
-   `get_block`: Fetches a full block by its hash.
-   `get_block_by_number`: Fetches a full block by its block number.

**Fetching Headers:**
-   `get_header`: Fetches a block header by its hash.
-   `get_header_by_number`: Fetches a block header by its block number.
-   `get_tip_header`: Fetches the header of the current tip block.
-   `get_tip_block_number`: Fetches the block number of the current tip block.

**Verifying Chain Integrity (MMR proofs):**
The `get_block_mmr_proof` RPC method, which would be crucial for verifying chain integrity using Merkle Mountain Range (MMR) proofs in a light client context, is **not listed** in the provided CKB JSON-RPC Protocols documentation (`ckb/rpc/README.md`).

The `0044-ckb-light-client.md` RFC describes the MMR structure and its use in the P2P light client protocol (e.g., `SendLastStateProof` includes `proof: HeaderDigestVec` for MMR proofs). However, this RFC details the *P2P protocol* implemented by `ckb-light-esp`, not the JSON-RPC interface.

Therefore, for a browser light client relying solely on JSON-RPC, MMR proof verification is not currently available via RPC. As stated in the project goal, a fallback mechanism would involve verifying the chain of `get_header` responses by checking that each block's `parent_hash` matches the hash of the preceding block.

**Citation:**
- `ckb/rpc/README.md`: Lists `get_block`, `get_block_by_number`, `get_header`, `get_header_by_number`, `get_tip_header`, `get_tip_block_number`. Does *not* list `get_block_mmr_proof`.
- Project Ground Truth: "verify chain integrity via MMR proofs (once `get_block_mmr_proof` RPC is available — use `get_header` chain as fallback for now)."
- `rfcs/0044-ckb-light-client/0044-ckb-light-client.md`: Describes MMR and its use in the P2P light client protocol.

#### 3. Does `@ckb-ccc/core` (CCC) or `@ckb-lumos/ckb-indexer` (Lumos) provide functionalities for filter-based block synchronization or UTXO derivation in a browser light client context?

**`@ckb-ccc/core` (CCC):**
No, `@ckb-ccc/core` does not provide functionalities for filter-based block synchronization (e.g., GCS filter processing) or client-side UTXO derivation from raw blocks. CCC is designed as a "one-stop solution for your CKB JS/TS ecosystem development" primarily focused on transaction composing, signing, and wallet interoperability. It abstracts away the complexities of input collection, typically relying on a connected wallet or external services (like a full node or indexer) to provide the necessary UTXOs for transaction building.

**`@ckb-lumos/ckb-indexer` (Lumos):**
Lumos's `@ckb-lumos/ckb-indexer` package provides `CellCollector` and `TransactionCollector` functionalities that allow querying for cells and transactions based on various criteria, including `lock` scripts and block number ranges (`fromBlock`, `toBlock`). This enables a form of "filter-based search" for relevant data. However, this functionality relies on the CKB Indexer service, which is a component of a CKB full node. The indexer pre-processes and stores data for efficient querying.

While Lumos's indexer can filter data, it does so by querying a trusted server-side index. The goal of the `ckb-browser-light-client-poc` is to "fetch GCS block filters... fetch only matching blocks via `get_block`, (3) parse transactions and derive UTXOs in JS, (4) verify chain integrity... without trusting the node's reported balance." Lumos's indexer functionality does not align with this specific requirement of client-side *verification* and *derivation* from raw block data using GCS filters; it primarily facilitates querying a trusted, pre-indexed data source.

**Citation:**
- `ckb-js/ccc/master/README.md`: Describes CCC's focus on transaction composing, signing, and wallet integration. No mention of light client sync or raw block parsing.
- `ckb-js/lumos/packages/ckb-indexer/README.md`: Describes `Indexer`, `CellCollector`, and `TransactionCollector` for querying cells/transactions based on `lock` scripts and block ranges, explicitly stating it's "based on `ckb-indexer`" (a server-side component).

#### 4. What JavaScript primitives are explicitly needed for this browser light client PoC, specifically for BLAKE2b, GCS decoding, Molecule parsing for `CellOutput`, and CKB address decoding?

-   **BLAKE2b:** The `noble-hashes` library provides a robust and audited JavaScript implementation of BLAKE2b.
    *   **Citation:** `import { blake2b } from '@noble/hashes/blake2.js';` (from `paulmillr/noble-hashes/main/README.md`)
-   **GCS decoder:** A JavaScript implementation for decoding GCS (Golomb-Rice Coded Set) filters is **not found** in the provided content. This would need to be implemented from scratch or sourced from another library.
-   **Molecule struct parser for `CellOutput`:** A specific JavaScript Molecule parser library capable of parsing CKB's `CellOutput` structure is **not found** in the provided content. The `0044-ckb-light-client.md` RFC mentions "Molecule schema" for `HeaderDigest` and `LightClientMessage`, indicating CKB's use of Molecule for data serialization, but no corresponding JS parser is provided. This would need to be implemented or sourced externally.
-   **CKB address decoder:** A JavaScript primitive for decoding CKB addresses into their constituent lock script components (e.g., `code_hash`, `hash_type`, `args`) is **not found** in the provided content. While `@ckb-ccc/core` handles wallet interactions, it doesn't explicitly expose a low-level address decoding primitive. This would need to be implemented or sourced externally.

#### 5. What would a minimal PoC look like for scanning the last 1000 blocks for a `secp256k1` lock and deriving a live balance, without trusting the node's reported balance?

A minimal 200-line proof-of-concept (PoC) for a browser light client's wallet tab, scanning the last 1000 blocks for a given `secp256k1` lock and deriving a live balance without trusting the node's reported balance, would involve the following logical steps:

1.  **Configuration:**
    *   Define the CKB full node RPC URL (e.g., Wyltek's `ckbnode` at `192.168.68.87:8114`, accessed via an HTTPS proxy as recommended by CKB RPC docs).
    *   Define the target `secp256k1` lock script (e.g., `code_hash`, `hash_type`, `args` derived from the user's CKB address).

2.  **Chain Tip Discovery:**
    *   Call `get_tip_block_number` RPC to get the current highest block number.
    *   Calculate the starting block number for the scan (e.g., `tip_block_number - 999`).

3.  **Block Iteration and Filtering:**
    *   Initialize an empty set of `unspent_cells` and `spent_out_points`.
    *   Loop from the starting block number up to the `tip_block_number`:
        *   Fetch the block hash for the current block number using `get_block_hash` or `get_header_by_number`.
        *   Fetch the GCS block filter for this block hash using `get_block_filter`.
        *   **GCS Filter Matching (Placeholder):** Implement or use a GCS decoder to check if the target `secp256k1` lock script hash is likely present in the filter. (This step requires the missing GCS decoder primitive).
        *   **Chain Integrity Check (Fallback):** In parallel, fetch the block header using `get_header_by_number` and verify that its `parent_hash` matches the hash of the previously processed block. This ensures the integrity of the header chain.

4.  **Block Fetching and UTXO Derivation (if filter matches):**
    *   If the GCS filter indicates a potential match (or if no GCS decoder is available, fetch all blocks for simplicity in a PoC, though this defeats the light client purpose):
        *   Fetch the full block data using `get_block`.
        *   For each transaction in the block:
            *   **Process Inputs:** For each `input` in the transaction, add its `out_point` (referencing a previous cell) to the `spent_out_points` set.
            *   **Process Outputs:** For each `output` in the transaction:
                *   Parse the `CellOutput` (requires the missing Molecule parser).
                *   Extract its `capacity` and `lock` script.
                *   If the `lock` script matches the target `secp256k1` lock script:
                    *   Add this `CellOutput` (along with its `out_point` derived from the transaction hash and output index) to a temporary list of `potential_unspent_cells`.

5.  **Final Balance Calculation:**
    *   After iterating through all 1000 blocks:
        *   Iterate through `potential_unspent_cells`.
        *   For each cell, check if its `out_point` is present in the `spent_out_points` set.
        *   If it's *not* in `spent_out_points`, it's a truly unspent cell belonging to the address. Add its `capacity` to the total balance.
    *   Return the aggregated total balance.

This PoC would demonstrate the ability to scan blocks, filter relevant transactions (conceptually), and derive a balance client-side, fulfilling the "without trusting the node's reported balance" requirement through direct parsing of on-chain data.

### Gaps / Follow-up

1.  **`get_block_mmr_proof` RPC:** The most significant gap for full light client verification is the absence of a `get_block_mmr_proof` RPC method. This is crucial for efficient and cryptographically sound chain integrity verification beyond simple header chain linking. A follow-up would be to track its development or explore alternative RPC-based proof mechanisms if any emerge.
2.  **JavaScript GCS Decoder:** A JavaScript library or implementation for decoding GCS block filters is needed. This is a critical primitive for the efficiency of the light client, allowing it to skip downloading irrelevant blocks.
3.  **JavaScript Molecule Parser:** A robust JavaScript library for parsing CKB's Molecule-serialized data structures, specifically `CellOutput` and potentially other transaction components, is required for client-side UTXO derivation.
4.  **JavaScript CKB Address Decoder:** A utility to convert CKB addresses into their canonical lock script components (`code_hash`, `hash_type`, `args`) is necessary for correctly identifying relevant cells.
5.  **`secp256k1` Script Hash:** The specific `code_hash` and `hash_type` for the `secp256k1_blake160_sighash_all` script (the standard CKB lock for secp256k1 addresses) would need to be hardcoded or dynamically retrieved for the target network.
6.  **Wyltek Node HTTPS Proxy:** Confirmation and details of the Nginx/HTTP proxy setup for `ckbnode` (192.168.68.87:8114) to enable HTTPS access from a browser client are needed.
7.  **Performance Benchmarking:** Once the PoC is functional, performance benchmarking (especially for GCS filter matching and Molecule parsing in the browser) would be essential to ensure it meets user experience expectations.

### Relevant Code/API Snippets

**BLAKE2b Hashing (from `noble-hashes`):**
```javascript
import { blake2b } from '@noble/hashes/blake2.js';

// Example usage:
const dataToHash = Uint8Array.from([0xca, 0xfe, 0x01, 0x23]);
const hashResult = blake2b(dataToHash);
console.log(hashResult);
```

**CKB RPC Methods (from `ckb/rpc/README.md` - conceptual usage):**
```javascript
// Assuming an RPC client library or fetch wrapper
const rpcUrl = "https://your-ckb-node-proxy:port"; // e.g., Wyltek's ckbnode via proxy

async function callRpc(method, params) {
    const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method,
            params,
        }),
    });
    const data = await response.json();
    if (data.error) {
        throw new Error(`RPC Error: ${data.error.message}`);
    }
    return data.result;
}

// Get current tip block number
const tipBlockNumber = await callRpc('get_tip_block_number', []);
console.log('Tip Block Number:', parseInt(tipBlockNumber, 16));

// Get block hash by number
const blockHash = await callRpc('get_block_hash', ['0x' + (tipBlockNumber - 10).toString(16)]);
console.log('Block Hash:', blockHash);

// Get block filter for a given block hash
const blockFilter = await callRpc('get_block_filter', [blockHash]);
console.log('Block Filter:', blockFilter); // This will be the raw GCS filter data

// Get full block data by hash
const blockData = await callRpc('get_block', [blockHash]);
console.log('Block Data:', blockData);

// Get header by number (for chain integrity fallback)
const header = await callRpc('get_header_by_number', ['0x' + (tipBlockNumber - 1).toString(16)]);
console.log('Header Parent Hash:', header.parent_hash);
```