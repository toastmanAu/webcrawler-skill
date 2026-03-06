# Research: ckb-light-client-esp32-sync-performance

**Date:** 2026-03-06  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/nervosnetwork/ckb/develop/light-client/README.md, https://raw.githubusercontent.com/nervosnetwork/ckb-light-client/main/README.md, https://raw.githubusercontent.com/toastmanAu/ckb-light-esp/main/README.md, https://raw.githubusercontent.com/nervosnetwork/rfcs/master/rfcs/0031-variable-length-header-field/0031-variable-length-header-field.md

---

Date: 2026-03-06

## Research Note: ckb-light-client-esp32-sync-performance

### Summary
This research aimed to understand the performance characteristics of the CKB light client protocol, specifically `ckb-light-esp`, from an embedded device perspective on ESP32-P4. While the project ground truth confirms `ckb-light-esp` is operational and performs well for header sync (10k headers in 0.8s), the provided source content, primarily RFC 0031, does not offer details on the light client's internal sync mechanisms. Consequently, specific information regarding bloom filter parameters, minimum peer requirements, bandwidth per transaction, memory footprint of chain state, or explicit keep-alive strategies for WiFi environments could not be found.

### Questions to Answer

1.  **How does the light client determine which blocks to download (bloom filter size, false positive rate)?**
    The provided content does not describe the CKB light client's block filtering mechanism, bloom filter size, or false positive rate. The `ckb-light-esp` description mentions implementing the `LightClient` protocol, including `GetLastState` and `SendLastState`, but does not detail how specific blocks or transactions are selected for download or verification using bloom filters.

2.  **Minimum peers needed for reliable sync — what happens below that threshold?**
    The provided content does not specify the minimum number of peers required for reliable synchronization for the CKB light client, nor does it describe the behavior or consequences if the number of available peers falls below such a threshold.

3.  **Estimated bandwidth per verified transaction on mainnet?**
    The provided content does not offer any estimates for bandwidth usage per verified transaction on mainnet for the CKB light client. RFC 0031 mentions that storing data in cellbase transactions has "a big overhead for clients which want to verify the chain using PoW only" due to downloading cellbase transactions and Merkle tree proofs, which can be larger than the block header. However, this refers to full verification overhead, not specific bandwidth for a light client verifying a single transaction with its proofs.

4.  **Memory footprint: how large is the header chain + filter chain state?**
    The provided content does not specify the memory footprint for the header chain or any filter chain state. While the `ckb-light-esp` binary size is noted as 214KB with 79% flash free on ESP32-P4, this refers to program storage, not runtime memory usage for the chain state. The ESP32-P4's 768KB SRAM and 32MB PSRAM support are mentioned, but there is no data to assess the sufficiency of this memory for the light client's state.

5.  **Is there a keep-alive / reconnection strategy needed for WiFi-prone ESP32 environments?**
    The provided content states that `ckb-light-esp` implements `TCP → SecIO → Yamux → Identify → LightClient → GetLastState → SendLastState`. TCP is a connection-oriented protocol, and `SecIO` and `Yamux` provide security and multiplexing layers, which inherently handle aspects of connection management. However, the documentation does not explicitly detail a specific higher-level "keep-alive / reconnection strategy" implemented within the `ckb-light-esp` application logic itself to specifically address the challenges of WiFi-prone ESP32 environments (e.g., explicit application-layer pings, intelligent backoff for reconnections).

### Gaps / Follow-up
The primary gaps in answering these questions stem from the unavailability of the CKB light client documentation (`nervosnetwork/ckb/develop/light-client/README.md`, `nervosnetwork/ckb-light-client/main/README.md`) and the `ckb-light-esp` project's README (`toastmanAu/ckb-light-esp/main/README.md`), all of which resulted in "FETCH ERROR: HTTP Error 404: Not Found". These documents would likely contain the specific details required to answer the questions regarding bloom filters, peer management, bandwidth, and memory footprint. Without them, only general inferences can be made from the project ground truth, which primarily confirms existence and high-level performance metrics.

### Relevant Code/API Snippets
The RFC 0031, "Add a variable length field in the block," describes changes to the CKB block structure that a light client would eventually need to process. Specifically, it renames `uncles_hash` to `extra_hash` and adds an optional `extension` field to the block body.

**P2P Protocols Changes (RFC 0031):**
The `uncles_hash` field in the block header is renamed to `extra_hash`. The new `extension` field is added to the block body and following data structures:

```
struct RawHeader {
    version: Uint32,
    compact_target: Uint32,
    timestamp: Uint64,
    number: Uint64,
    epoch: Uint64,
    parent_hash: Byte32,
    transactions_root: Byte32,
    proposals_hash: Byte32,
    extra_hash: Byte32, // Renamed from uncles_hash
    dao: Byte32,
}

table Block {
    header: Header,
    uncles: UncleBlockVec,
    transactions: TransactionVec,
    proposals: ProposalShortIdVec,
    extension: Bytes, // New field
}

table CompactBlock {
    header: Header,
    short_ids: ProposalShortIdVec,
    prefilled_transactions: IndexTransactionVec,
    uncles: Byte32Vec,
    proposals: ProposalShortIdVec,
    extension: Bytes, // New field
}
```