# Research Synthesis — CKB Scripting, Embedded VM, Light Client PoC
**Date:** 2026-03-10  
**Status:** SYNTHESIS  
**Author:** Kernel (main session)  
**Covers:** ckb-custom-lang-feasibility, ckb-risc-v-compiler-toolchain, ckb-lang-embedded-implementation, ckb-vm-risc-v-embedded-port, ckb-browser-light-client-poc, ckb-flyclient-mmr-rpc (2026-03-09 proposal)

---

## Executive Summary

Five research threads completed this session represent a coherent arc: **can we write CKB scripts and verify them at the embedded layer, and can we do trustless chain verification from a browser or device without a centralised server?** The answer to both is *yes, with defined effort*.

The most actionable finding is the **dual-target compilation path**: C and Rust both support `riscv64imc` (CKB-VM) and `riscv32imc` (ESP32-C3/C6) from the same codebase. This is the architectural unlock for WyAuth, WyVault, and any future embedded CKB scripting work. The CKB toolchain (`riscv64-unknown-elf-gcc`, `-nostdlib`, `--gc-sections`, `-O3`) is documented and production-ready.

The **browser light client PoC** is buildable today using `get_block_filter` + `get_block` + `noble-hashes`. The missing pieces (GCS decoder, Molecule parser, address decoder) are implementable in ~500 lines of JS. This enables trustless balance verification in the Wyltek Mini App without depending on a hosted indexer.

The **CKB custom language** is a medium-term project. No small C compiler (chibicc, TCC) has a production RISC-V64 backend yet, but QBE → `riscv64-unknown-elf-as` is a realistic pipeline. The bigger question — cycle costs for an interpreter vs native compiled scripts — remains unquantified and is the critical unknown before investing in a language runtime.

---

## 1. CKB Script Toolchain — What We Know Now

### Production path (today)
```
C source → riscv64-unknown-elf-gcc -O3 -nostdlib -fdata-sections -ffunction-sections
         → .elf → strip → CKB cell data
```
Key flags from `ckb-c-stdlib/Makefile`:
- `-nostdlib -nostartfiles` → removes standard library overhead (essential for small binaries)
- `-Wl,--gc-sections` → dead code elimination
- `-O3 -fdata-sections -ffunction-sections` → aggressive optimisation + section-level GC
- Docker image: `nervos/ckb-riscv-gnu-toolchain:jammy-20230214`

### Dynamic linking (ckb_dlopen)
CKB scripts avoid binary duplication via `ckb_dlopen` / `ckb_dlopen2` — these load a dep cell's binary into memory and resolve symbols at runtime. This is how secp256k1 is shared across thousands of lock scripts without re-embedding the crypto library. Any new language/toolchain needs to integrate with this mechanism.

### CKB-VM instruction set
- `rv64imc`: 64-bit integer base + multiply/divide + compressed instructions
- **No floating point** (by design — determinism)
- Softfloat can be packed in binary if needed
- Max 4MB runtime memory per contract execution
- Cycle counting is deterministic and enforced — acts as both fee meter and watchdog

---

## 2. Embedded RISC-V Angle — The Dual-Target Path

### The gap: rv64 vs rv32
ESP32-C3/C6/H2 are `rv32imc`. CKB-VM is `rv64imc`. The gap is:
- Register width: 32-bit vs 64-bit
- Missing 64-bit instructions: `LD`, `SD`, `ADDIW`, `SLLIW`, `SRLIW`, `SRAIW`, etc.
- Emulating rv64 on rv32 is possible but expensive (~2-4x overhead per 64-bit op)

**Direct CKB-VM port to ESP32-C: not practical.** The 4MB contract memory requirement alone exceeds ESP32-C3 SRAM (400KB). Even with PSRAM workarounds, the 64-bit emulation overhead would make it too slow for real-time signing.

### The practical architecture
Don't port the VM. Share the *protocol logic*:

```
Shared C/Rust source
    ├── compile → rv64imc → CKB lock script (verifies on-chain)
    └── compile → rv32imc → ESP32-C device firmware (generates signatures)
```

The on-chain script and the device code implement the same protocol from the same source. `riscv-gcc` and `riscv-llvm` both support both targets. This is exactly what WyAuth should be doing for its embedded providers.

### ESP32-S3 + PSRAM changes the picture
For a full CKB-VM interpreter (not just shared protocol logic), ESP32-S3 with 8MB PSRAM is a different beast. 8MB is enough to hold a modest CKB contract + its execution state. Still needs a C reimplementation of the interpreter (Rust won't fit in flash without `no_std` heroics), but it's feasible as a research project.

**Candidate target for CKB-VM-on-device**: ESP32-S3 + PSRAM, running a stripped C interpreter of the CKB-VM. Not production-ready for 2026, but a compelling demo/research piece.

---

## 3. CKB Custom Language Feasibility

### Current state of small RISC-V64 compilers
| Compiler | RISC-V64 support | Status |
|---|---|---|
| GCC (riscv64-elf) | ✅ Full | Production |
| LLVM/Clang | ✅ Full | Production |
| Rust (riscv64gc) | ✅ Full | Production |
| chibicc | ❌ x86-64 only | No fork known |
| TCC | ❓ Unknown | Fetch failed |
| RVCC (chibicc fork) | ✅ RISC-V32 | 32-bit only |
| QBE | Partial (via GNU as) | Promising |

### Most viable path for a custom CKB language
**QBE backend → riscv64-unknown-elf-as pipeline:**
1. Write a small language frontend (lexer → parser → AST) — ~3-5k lines
2. Emit QBE IL from AST — QBE handles register allocation, SSA
3. QBE generates RISC-V assembly
4. `riscv64-unknown-elf-as` + `ld` with `-nostdlib --gc-sections` produces the binary

QBE is ~12k lines of C, self-contained, proven by projects like `cproc` (a C11 compiler using QBE). This is achievable.

### Critical unknown: cycle costs
The feasibility question for an *on-chain interpreter* (e.g., Lua or a custom language runtime deployed as a CKB cell) depends entirely on cycle costs. `ckb-js-vm` (QuickJS on CKB-VM) is the reference — but no published benchmarks were found. Before building a language runtime intended to run on-chain, we need:
- Cycle cost of `ckb-js-vm` for a simple transaction script
- Comparison vs native compiled C script
- Maximum cycles per transaction (protocol limit)

**Action**: File a question on Nervos Talk or dig into ckb-js-vm test suite for cycle assertions.

### CKB-native type primitives (needed for any new language)
```
H256       → [u8; 32] (BLAKE2b hashes, script hashes, cell IDs)
Script     → { code_hash: H256, hash_type: u8, args: [u8] }
Cell       → { capacity: u64, lock: Script, type: Option<Script>, data: [u8] }
CellInput  → { since: u64, previous_output: OutPoint }
OutPoint   → { tx_hash: H256, index: u32 }
Capacity   → u64 (shannons; overflow protection essential)
```
These map directly to `ckb-c-stdlib` structs and Molecule schema definitions.

---

## 4. Browser Light Client PoC — Buildable Now

### Architecture
```
Browser JS
  1. get_tip_block_number() → N
  2. For blocks N-999..N: get_block_filter(hash) → GCS blob
  3. Decode GCS: does this block contain our lock script hash?
  4. If yes: get_block(hash) → full block data
  5. Parse transactions with Molecule decoder → find UTXOs for our lock
  6. Sum unspent outputs → balance
  7. Verify header chain: each block's parent_hash == hash(previous header)
```

### Available primitives
- ✅ `get_block_filter` RPC — live on mainnet
- ✅ `get_block`, `get_header` RPCs — standard
- ✅ `noble-hashes` — `blake2b` implementation, audited, 0-dependency
- ❌ GCS decoder — needs ~100 lines of JS (Golomb-Rice decoding)
- ❌ Molecule parser for `CellOutput` — needs ~200 lines of JS
- ❌ CKB address decoder — needs ~50 lines (bech32m + script reconstruction)

### What's NOT possible yet
`get_block_mmr_proof` RPC doesn't exist. The proposal from yesterday (`ckb-flyclient-mmr-rpc-proposal.md`) directly addresses this gap. Without it, the browser client falls back to sequential header chain verification (slower but trustless for recent history).

### Wyltek Mini App integration
This PoC becomes the **Chain tab's "Verify Balance" feature** — a trustless counterpart to the node-reported balance shown via the RPC proxy Worker. Differentiator: "This balance was computed locally from raw block data — not from any server."

---

## 5. FlyClient MMR RPC — Status

The proposal (`ckb-flyclient-mmr-rpc-proposal.md`) is ready for submission as a GitHub issue on `nervosnetwork/ckb`. It makes a tight case:
- The node already builds and maintains the full MMR internally
- `get_transaction_proof` / `verify_transaction_proof` exist as precedent
- A single new `get_block_mmr_proof(block_hashes, challenge_entropy)` RPC enables browser/embedded trustless verification
- User-supplied entropy prevents precomputation attacks

**Next action**: Open the GitHub issue on `nervosnetwork/ckb`. Cross-reference with fiber issue #1186 and neuron PR #3441 — demonstrates pattern of community pushing for ecosystem improvements.

---

## 6. Cross-Cutting Gap Analysis

### Gap 1: ckb-js-vm cycle benchmarks (CRITICAL)
No published data on cycle costs for interpreters on CKB-VM. Blocks decisions on:
- Whether a custom language runtime is economically viable on-chain
- Whether `ckb-js-vm` is usable for production lock scripts today
- Cost estimates for any embedded script verification feature

**Action**: Query Nervos Talk / Discord. Check ckb-js-vm test suite for cycle limit tests.

### Gap 2: GCS decoder + Molecule JS parser (MEDIUM)
~300 lines of JS, but no existing library confirmed. Noble ecosystem covers hashing. Need:
- GCS decode (Golomb-Rice) — reference: Bitcoin Core's `blockfilter.cpp`
- Molecule struct parser — reference: `nervosnetwork/molecule` spec + existing codec in Lumos

### Gap 3: CKB-VM no_std feasibility (MEDIUM)
GitHub returned 404 for `nervosnetwork/ckb-vm` source files during crawl — either moved or access issue. Direct inspection of `Cargo.toml` needed to determine `no_std` compatibility. This blocks the "CKB-VM on ESP32-S3" research path.

### Gap 4: chibicc RISC-V fork (LOW)
No confirmed fork with RISC-V64 backend. RVCC (chibicc fork) targets rv32. If we want a small self-contained C-to-RISC-V64 compiler, QBE pipeline is more promising than waiting for chibicc RISC-V64.

### Gap 5: Shared script logic / WyAuth integration (ACTION READY)
Dual-target compilation is confirmed viable. The WyAuth architecture (`WyAuth<JoyIDProvider, WorkerTransport>`) should evolve to add a `CKBScriptProvider` variant that:
1. Defines the auth protocol as a CKB lock script (verifies on-chain)
2. Compiles the same source to rv32imc for the device (generates signatures)
This closes the "trustless hardware auth" gap without requiring a server relay.

---

## 7. Recommended Next Actions (Prioritised)

| Priority | Action | Effort |
|---|---|---|
| 🔴 HIGH | Open `get_block_mmr_proof` GitHub issue on nervosnetwork/ckb | 30 min |
| 🔴 HIGH | Build GCS decoder + Molecule CellOutput parser in JS (~300 lines) | 2-3h |
| 🟡 MED | Query ckb-js-vm cycle costs (Nervos Talk / Discord / source) | 1h |
| 🟡 MED | Implement browser light client PoC in Mini App Chain tab | 1 day |
| 🟡 MED | WyAuth: add `CKBScriptProvider` using dual-target compile path | 2-3 days |
| 🟢 LOW | Investigate QBE → riscv64-unknown-elf-as pipeline as custom lang backend | Research |
| 🟢 LOW | Inspect ckb-vm Cargo.toml for no_std flags (direct clone, not raw fetch) | 30 min |

---

## Connections to Existing Stack

- **WyAuth** → Gap 5 (dual-target shared script logic = new `CKBScriptProvider`)
- **Wyltek Mini App** → Gap 2 (GCS + Molecule → trustless Chain tab balance)
- **ckb-light-esp** → Gap 3 (CKB-VM on ESP32-S3 would complement existing light client)
- **WyVault** → Gap 1 (cycle costs determine whether WyVault can verify scripts on-device)
- **FiberQuest** → Gap 2 (same light client infra usable for Fiber channel state verification)
- **CKB Explorer report** → FlyClient MMR RPC (community-hosted explorer could use this for trustless verification)
