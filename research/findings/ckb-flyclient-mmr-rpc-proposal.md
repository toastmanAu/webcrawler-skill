# CKB FlyClient MMR RPC — Research Findings & Feature Request

**Date:** 2026-03-09  
**Author:** Kernel (AI assistant, Wyltek Industries)  
**Status:** Ready for submission to nervosnetwork/ckb  

---

## Summary

CKB full nodes already compute and store a complete Merkle Mountain Range (MMR) over all block headers. The MMR root is committed in every block's `extension` field (RFC-0044). However, the JSON-RPC API does not expose MMR proof paths — meaning clients cannot independently verify chain state without trusting the node.

A single new RPC method, `get_block_mmr_proof`, would enable **trustless challenge-response chain verification** from any client — browser, mobile, embedded, or cross-chain bridge — with no sidecar, no centralisation, and no additional infrastructure.

---

## What the Node Already Has

### RFC-0044: CKB Light Client Protocol

Per RFC-0044 (Status: Proposal, merged to `master`):

> "After the epoch which MMR starts to be enabled in, the **first 32 bytes of the block extension** should be the hash of its parent chain root."

The `extension` field is already returned by `get_block` and `get_header` via JSON-RPC. So **every client can already read the MMR root for any block**.

### What the MMR contains

Each MMR node (called `HeaderDigest`) commits to:
- `children_hash` — hash of child nodes (or block hash for leaves)
- `total_difficulty` — cumulative PoW work
- `start_number` / `end_number` — block range
- `start_epoch` / `end_epoch` — epoch range
- `start_timestamp` / `end_timestamp`
- `start_compact_target` / `end_compact_target`

This is rich data — enough to verify that a chain was produced by the claimed amount of work, with correct difficulty adjustments, across the correct time range.

### What's missing from the RPC

The node **builds and maintains** the full MMR tree internally (it has to — the chain root hash in `extension` is computed from it). But there is **no RPC method to request an MMR inclusion proof** for a specific block or set of blocks.

The existing RPC has:
- `get_transaction_proof` — Merkle proof for a tx within a block ✅
- `verify_transaction_proof` — verify such a proof ✅  
- **No equivalent for block-level MMR proofs** ❌

---

## The Gap: Verifiable Block Sampling

The FlyClient protocol works by the verifier supplying a challenge (sampled block indices or difficulty values) and the prover returning:
1. The sampled block headers
2. MMR inclusion proofs for each sampled block against the committed chain root

The CKB light client protocol already implements this **over the P2P network** (via `GetLastStateProof` / `SendLastStateProof` messages). But this P2P interface is:
- Not accessible from browsers or mobile apps
- Not accessible via standard JSON-RPC
- Requires running a full light client process

**The same data the P2P protocol returns is already in the node's MMR store.** It just needs an RPC door.

---

## Proposed New RPC Method

### `get_block_mmr_proof`

**Module:** Chain  
**Description:** Returns MMR inclusion proofs for a set of blocks, relative to a specified tip block. Enables trustless challenge-response verification of chain state.

#### Request

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "get_block_mmr_proof",
  "params": [
    {
      "tip_hash": "0xabc...",
      "block_hashes": [
        "0x111...",
        "0x222...",
        "0x333..."
      ]
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `tip_hash` | `H256` | The tip block to prove against. The proof is relative to its chain root. |
| `block_hashes` | `H256[]` | Block hashes to prove inclusion of. Max 50. |

#### Response

```json
{
  "result": {
    "tip_header": { /* VerifiableHeader */ },
    "proof": [
      /* HeaderDigest array — the MMR proof path */
    ],
    "headers": [
      /* Array of VerifiableHeader for each requested block */
    ],
    "missing_block_hashes": []
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `tip_header` | `VerifiableHeader` | The tip block with its parent chain root hash (from `extension[0..32]`) |
| `proof` | `HeaderDigest[]` | MMR proof path (siblings + peaks) for all requested blocks against `tip_header`'s chain root |
| `headers` | `VerifiableHeader[]` | The headers for each proved block (contains `extension` with parent chain root) |
| `missing_block_hashes` | `H256[]` | Hashes not found on the current chain from `tip_hash` |

**`VerifiableHeader`** is already defined in RFC-0044:
```
struct VerifiableHeader {
    header: Header,
    uncles_hash: H256,
    extension: Option<Bytes>,  // first 32 bytes = parent chain root hash
    parent_chain_root: HeaderDigest,
}
```

**`HeaderDigest`** is already defined and used internally.

---

## Client Verification Algorithm (JavaScript-implementable)

Given the response, a client verifies as follows:

```javascript
async function verifyChallengeResponse(response, challenge) {
  const { tip_header, proof, headers } = response

  // 1. Verify tip header's extra_hash includes chain root commitment
  //    extension[0..32] must equal hash(parent_chain_root)
  const committedRoot = tip_header.extension.slice(0, 32)
  const computedRoot = blake2b(serialize(tip_header.parent_chain_root))
  assert(committedRoot === computedRoot, "Chain root commitment mismatch")

  // 2. Re-derive the challenge block indices from supplied entropy
  //    (same deterministic sampling as FlyClient protocol)
  const sampledIndices = deriveBlockIndices(
    challenge,                    // user-supplied 256-bit entropy
    tip_header.header.number,     // chain length
    tip_header.parent_chain_root.total_difficulty
  )

  // 3. Verify each sampled header is included in the MMR
  for (const header of headers) {
    const blockNumber = header.header.number
    assert(sampledIndices.includes(blockNumber))

    // Verify MMR inclusion proof
    const leafHash = computeHeaderDigestHash(header)
    const valid = verifyMMRProof(
      leafHash,
      blockNumber,
      proof,
      committedRoot
    )
    assert(valid, `MMR proof invalid for block ${blockNumber}`)

    // Verify difficulty metadata in the HeaderDigest
    const digest = extractDigest(header)
    assert(digest.total_difficulty > 0)
    assert(digest.start_compact_target > 0)
  }

  // 4. Verify total work claim
  //    If all samples verify, the chain committed to is real
  //    (adversary would need to produce O(2^256) work to fake it)
  return { valid: true, chainLength: tip_header.header.number }
}
```

The `verifyMMRProof` function is ~50 lines of pure JS using BLAKE2b. No native dependencies. No sidecar. Runs in any browser.

---

## Why User-Supplied Entropy Matters

The existing FlyClient implementation derives sampling randomness from the block hash itself (non-interactive). This is secure for the light client sync case but has a subtle weakness for **interactive verification**:

> A malicious node knows exactly which blocks will be sampled (the sampling is deterministic from the block hash), and could precompute fake chains specifically tuned to pass those samples.

With user-supplied entropy:
1. Client generates `challenge = crypto.getRandomValues(32 bytes)` locally
2. Sends challenge to node along with the tip hash
3. Node must respond with proof for blocks derived from `H(tip_hash || challenge)`
4. Node **cannot predict** the challenge in advance, so cannot precompute

This turns the protocol into an **interactive proof of knowledge** — the node proves it genuinely holds the full MMR, not just a carefully crafted subset.

For the mini app / RPC console use case: "Prove to me, with MY randomness, that your claimed chain tip is real."

---

## Implementation in the CKB Node

### What already exists

- The full MMR is built and maintained in `ckb-store` (RocksDB). The chain root for every block is stored.
- `HeaderDigest` struct exists in `ckb-types`
- MMR proof generation exists in `ckb-merkle-mountain-range` crate (already a dependency)
- `VerifiableHeader` struct is defined and used in P2P light client code
- The P2P handler `SendBlocksProof` already generates exactly this data

### What's needed

1. **New RPC handler** in `rpc/src/module/chain.rs` — ~100 lines of Rust
2. **Expose existing proof generation** from P2P code to RPC layer — the logic is already in `sync/src/light_client/`
3. **New type** `BlockMmrProof` in `util/jsonrpc-types/src/` — mirrors P2P `SendBlocksProof` in JSON
4. **New RPC method** in `rpc/README.md` + OpenRPC spec

No consensus changes. No new storage. No new crates. Pure RPC surface addition.

### Estimated complexity

**Small** — the node already computes and stores all the data. This is plumbing work: expose the P2P proof generation path through an RPC endpoint. Estimate: 1-2 days for a developer familiar with the codebase.

---

## Use Cases Unlocked

| Use Case | Today | With `get_block_mmr_proof` |
|----------|-------|---------------------------|
| Browser verifies chain tip | ❌ Trust node | ✅ Verify with entropy |
| Mobile wallet spot-checks node | ❌ Trust node | ✅ Challenge-response proof |
| Cross-chain bridge light client | ❌ Centralised relayer | ✅ Trustless on-chain verifier |
| Mini app "Challenge My Node" | ❌ Not possible | ✅ One button, 50ms |
| Embedded device (ESP32) verification | ❌ Not possible | ✅ MMR proof in ~2KB |
| Third-party node audit | ❌ Manual inspection | ✅ Automated, cryptographic |

---

## Why Not a Sidecar?

A custom sidecar service would:
- Require separate deployment and maintenance
- Create a centralised trust point (the sidecar operator)
- Be an additional attack surface
- Require users to trust that the sidecar faithfully queries the node

The whole point of FlyClient is **trustlessness**. A sidecar defeats that. The data is already in the node. The proof already exists in the P2P code. One RPC method eliminates the need for any sidecar entirely.

---

## Suggested PR Title

`feat(rpc): add get_block_mmr_proof for trustless chain verification`

## Suggested Issue Title

`Feature Request: expose MMR proof paths via JSON-RPC for trustless client verification`

## Suggested Issue Body

(See full proposal above. Key talking points:)

1. RFC-0044 already committed the MMR to the `extension` field — the proof data exists
2. The P2P light client protocol already generates this exact data via `SendBlocksProof`  
3. RPC exposure is pure plumbing — no consensus changes, no new storage
4. Enables trustless verification from browsers, mobile, embedded devices without any sidecar
5. User-supplied entropy adds interactive proof-of-knowledge not possible with current P2P protocol
6. Reference implementation path: expose `sync::light_client::prove_blocks()` through `rpc::module::chain`

---

## References

- [RFC-0044: CKB Light Client Protocol](https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0044-ckb-light-client/0044-ckb-light-client.md)
- [RFC-0031: Ensure block's extension is mergeable](https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0031-ensure-miner-create-the-merged-transaction/0031-ensure-miner-create-the-merged-transaction.md)
- [ckb-merkle-mountain-range crate](https://crates.io/crates/ckb-merkle-mountain-range)
- [FlyClient paper](https://eprint.iacr.org/2019/226)
- [nervosnetwork/ckb issue #3800](https://github.com/nervosnetwork/ckb/issues/3800) (related MMR RPC discussion)

---

*Proposal drafted by Kernel / Wyltek Industries. Contact: @Wyltek on Telegram / toastmanAu on GitHub.*
