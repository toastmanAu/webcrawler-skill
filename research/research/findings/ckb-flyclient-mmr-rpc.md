# Research: ckb-flyclient-mmr-rpc

**Date:** 2026-03-10  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/nervosnetwork/ckb/develop/rpc/README.md, https://raw.githubusercontent.com/nervosnetwork/rfcs/master/rfcs/0044-ckb-light-client/0044-ckb-light-client.md, https://crates.io/crates/ckb-merkle-mountain-range, https://raw.githubusercontent.com/nervosnetwork/merkle-mountain-range/master/src/lib.rs, https://talk.nervos.org/t/emergent-software-flyclient-implementation/4806

---

Date: 2026-03-10

## Summary

The CKB full node's standard JSON-RPC API (HTTP) does not directly expose Merkle Mountain Range (MMR) data or proofs for the entire chain tip. While the CKB Light Client Protocol (implemented by `ckb-light-esp`) utilizes MMR proofs for efficient chain tip verification via dedicated protocol messages (`SendLastStateProof`), this operates over a distinct TCP/SecIO/Yamux stack, not the HTTP JSON-RPC. Therefore, building a challenge-response "prove chain tip" feature that relies on MMR proofs *solely* through the existing CKB full node JSON-RPC API would not be possible without a custom sidecar to either implement the Light Client Protocol or reconstruct MMR proofs from raw block data.

## Does the CKB full node JSON-RPC API expose MMR data?

No, the CKB full node's standard JSON-RPC API, as documented in `nervosnetwork/ckb/rpc/README.md`, does not expose Merkle Mountain Range (MMR) data or proofs for the entire chain.

The `rpc/README.md` lists various modules and their methods (e.g., `Chain`, `Miner`, `Indexer`), but none of these methods explicitly mention or return MMR-specific structures like `HeaderDigest` or `HeaderDigestVec`, nor do they provide a "chain root" or MMR proof for the overall blockchain state. Methods like `get_block`, `get_header`, `get_transaction_proof` provide data for individual blocks or transactions, but not the aggregate MMR proof for the chain tip.

The `0044-ckb-light-client.md` document describes the CKB Light Client Protocol, which *does* leverage MMRs for efficient verification. This protocol defines messages such as `SendLastStateProof` which includes `proof: HeaderDigestVec` for the chain root. However, these are "Protocol Messages" for the Light Client Protocol, which operates over a full-duplex connection (TCP/SecIO/Yamux) as implemented by `ckb-light-esp`, and are distinct from the CKB full node's HTTP JSON-RPC methods. The `rpc/README.md` explicitly differentiates between HTTP JSON-RPC and full duplex connections for subscriptions, but the MMR proof messages are not listed under the standard JSON-RPC methods.

## Could a challenge-response "prove chain tip" feature be built without a custom sidecar, using only existing CKB full node RPCs?

No, a challenge-response "prove chain tip" feature that relies on Merkle Mountain Range (MMR) proofs cannot be built *solely* using the existing CKB full node JSON-RPC API (HTTP) without a custom sidecar.

The "prove chain tip" mechanism, as envisioned by FlyClient and implemented in the CKB Light Client Protocol, relies on the full node providing MMR proofs (e.g., `SendLastStateProof` containing `HeaderDigestVec`) to the light client. As established, these specific MMR proof methods are part of the Light Client Protocol and are not exposed via the standard CKB full node JSON-RPC (HTTP) interface.

Therefore, to implement such a feature using *only* the CKB full node's HTTP JSON-RPC, a custom sidecar would be necessary. This sidecar would either need to:
1.  Implement the CKB Light Client Protocol itself to communicate with the full node and obtain the MMR proofs. (Note: `ckb-light-esp` already does this.)
2.  Fetch raw block data via existing JSON-RPC methods (e.g., `get_header_by_number`, `get_block`) and then compute the MMR proofs locally, which would be a complex and resource-intensive task, effectively re-implementing part of the full node's proof generation logic.

Given that Wyltek Industries has already shipped `ckb-light-esp`, which implements the full CKB light client protocol stack including `GetLastState` and `SendLastStateProof` for chain tip verification using MMRs, the capability to "prove chain tip" already exists within our ecosystem, but it leverages the dedicated Light Client Protocol, not the HTTP JSON-RPC.

## Gaps / Follow-up

1.  **Specific RPC for `VerifiableHeader` or `chain_root`:** While the Light Client Protocol defines `VerifiableHeader` which includes `chain_root`, it's not explicitly clear if any *existing* JSON-RPC method returns a block header *with* its `chain_root` (the hash of its parent chain root, as per `0044-ckb-light-client.md`). The `get_header` method in the `Chain` module returns a `Header`, but the documentation provided does not detail if this `Header` structure includes the `chain_root` or block extension where it would reside. Further investigation into the exact JSON structure returned by `get_header` would be needed.
2.  **MMR Proof Generation via RPC:** There is no RPC method listed that allows a client to request an MMR proof for a range of blocks or for the chain tip, similar to what `SendLastStateProof` provides in the Light Client Protocol. This confirms the need for a sidecar if one *insists* on using JSON-RPC for MMR proofs.

## Relevant Code/API Snippets

*   **`0044-ckb-light-client.md` - MMR Node Specification:**
    ```
    struct HeaderDigest {
        children_hash: Byte32,
        total_difficulty: Uint256,
        start_number: Uint64,
        end_number: Uint64,
        start_epoch: Uint64,
        end_epoch: Uint64,
        start_timestamp: Uint64,
        end_timestamp: Uint64,
        start_compact_target: Uint32,
        end_compact_target: Uint32,
    }
    ```
*   **`0044-ckb-light-client.md` - Chain Root:**
    > "After the epoch which MMR starts to be enabled in, the first 32 bytes of the block extension should be the hash of its parent chain root."
*   **`0044-ckb-light-client.md` - Verifiable Header:**
    > "A verifiable header is a header with the fields which are used to do verification for its extra hash [\[1\]]. It contains a normal header, its uncles' hash, its block extension and the chain root for its parent block."
*   **`0044-ckb-light-client.md` - Light Client Protocol Message `SendLastStateProof`:**
    ```
    table SendLastStateProof {
        // If the block whose hash is sent from the client is on the chain, then
        // returns its verifiable header; otherwise, returns the verifiable
        // header for the tip block in the server.
        last_header: VerifiableHeader,
        // The MMR proof for the chain root whose hash is in the last header.
        // Be empty if the block hash sent from the client isn't on the chain.
        proof: HeaderDigestVec,
        // Verifiable headers for all sampled blocks.
        headers: VerifiableHeade
    }
    ```
*   **`nervosnetwork/ckb/rpc/README.md` - RPC Methods (Example from `Chain` module, no MMR-specific methods):**
    *   `get_block`
    *   `get_block_by_number`
    *   `get_header`
    *   `get_header_by_number`
    *   `get_tip_header`
    *   `get_transaction_proof`
    *   `verify_transaction_proof`