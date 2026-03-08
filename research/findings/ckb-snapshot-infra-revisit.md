# Research: ckb-snapshot-infra-revisit

**Date:** 2026-03-08  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/nervosnetwork/ckb/develop/CHANGELOG.md, https://raw.githubusercontent.com/nervosnetwork/ckb/develop/docs/run-ckb-with-docker.md, https://developers.cloudflare.com/r2/reference/data-location/, https://raw.githubusercontent.com/trufflesuite/ganache/develop/src/chains/ethereum/ethereum/README.md, https://www.renaultforums.co.uk/, https://www.cliosport.net/

---

Date: 2026-03-08

## Summary

The "ckb-snapshot-infra-revisit" topic, as inferred from the provided CKB changelog, primarily focuses on enhancing the efficiency and reliability of CKB node synchronization, particularly during initial block download (IBD) and for light clients. Key improvements include asynchronous block download and verification, various P2P network enhancements for better connectivity and block relay (e.g., hole punching, proxy support), and updates to RPC interfaces for better state reporting and data retrieval. Several breaking changes to RPC and configuration are noted, along with the activation of a new CKB consensus edition. The provided content does not contain any technical details regarding the Renault Clio RS 172's OBD2 protocols or ECU specifics.

## 1. What are the core technical details of this topic?

The core technical details of the "ckb-snapshot-infra-revisit" topic, based on the CKB changelog, revolve around optimizing the CKB node's ability to quickly and reliably synchronize with the blockchain, especially for new nodes or light clients. This includes:

*   **Asynchronous Block Download and Verification**: Introduced in v0.118.0 (`#4365`), this enhancement decouples the synchronizer's sliding window movement from the block verification process. This allows for asynchronous handling of block requests and verification, significantly improving the efficiency of the Initial Block Download (IBD) phase.
*   **P2P Network Enhancements**:
    *   **Hole Punching Protocol**: Added in v0.202.0 (`#4873`) and further refined with metrics in v0.203.0 (`#4891`), this protocol aims to improve NAT traversal, facilitating better peer connectivity.
    *   **Proxy and Onion Support**: Added for `ckb-network` in v0.204.0 (`#4733`), enhancing network privacy and resilience.
    *   **Outbound Block-Relay-Only Connections**: Introduced in v0.203.0 (`#4888`) to optimize block propagation.
    *   **Nodes Filter**: Implemented in v0.200.0 (`#4800`) with P2P transport service types.
*   **Light Client Specific Improvements**: The `DaoCalculator` was updated in v0.202.0 (`#4878`) to be usable within a light client context, which is crucial for the `ckb-light-esp` project.
*   **`assume_valid_target` Extension**: In v0.121.0 (`#4742`), the hardcoded `assume_valid_target` was extended to an array, potentially allowing for more flexible and faster initial synchronization by trusting multiple known good block headers.
*   **Script Verification Refactoring**: New script verification with `ckb-vm pause` (`#4291` in v0.118.0) uses a job queue and multiple workers for async verification, without VM snapshots.
*   **WASM Support**: Experimental WASM support was added in v0.120.0 (`#4683`), with peer-store implementation using `path` as the database name in v0.121.0 (`#4760`), which could impact how light clients or browser-based nodes manage peer data.
*   **CKB Edition Meepo (2024) Activation**: A significant consensus breaking change activated on Mainnet in v0.200.0 (`#4807`).

## 2. What specific APIs, protocols, or interfaces are available?

Based on the CKB changelog, the following specific APIs, protocols, or interfaces are available or have been updated:

*   **RPC APIs**:
    *   `sync_state`: Modified in v0.118.0 (`#4365`) to include `tip_hash`, `tip_number`, `unverified_tip_hash`, and `unverified_tip_number`. The `orphan_blocks_size` field was removed (breaking change).
    *   `NetRpcImpl::add_node` and `remove_node`: Error handling fixed in v0.203.0 (`#4895`).
    *   `NetRpcImpl::get_peers`: Returns `Remoteaddress.addresses` without duplicates in v0.200.0 (`#4795`) (breaking change to RPC return format).
    *   `get_cells`: A limit was added to this RPC in v0.118.0 (`#4576`), meaning it may fail when exceeding the limit (breaking change).
    *   JSONRPC batch request handling: Now uses a JSON array stream in v0.202.0 (`#4883`) and has a request limit added in v0.118.0 (`#4529`).
    *   `get_fee_rate_statistics`: Logic improved in v0.119.0 (`#4654`) to be aware of `block_ext.txs_sizes` length.
*   **P2P Protocols**:
    *   Hole punching protocol (`#4873` in v0.202.0).
    *   Proxy and onion support for `ckb-network` (`#4733` in v0.204.0).
    *   Block-relay-only connections (`#4888` in v0.203.0).
*   **Internal Interfaces / Syscalls**:
    *   `DaoCalculator`: Updated for light client use (`#4878` in v0.202.0).
    *   `spawn` syscall API: Refactored in v0.118.0 (`#4380`).
    *   `ckb-vm pause`: Used for new script verification (`#4291` in v0.118.0).
*   **Configuration**:
    *   Default listen on ws port: CKB nodes now default to listening on the WebSocket port (`#4729`, `#4741` in v0.120.0), which is a breaking change to the config.

## 3. What are the known limitations or failure modes?

The CKB changelog highlights several known limitations, breaking changes, or failure modes:

*   **RPC Breaking Changes**:
    *   The `sync_state` RPC removed the `orphan_blocks_size` field in v0.118.0 (`#4365`).
    *   The `NetRpcImpl::get_peers` RPC return format changed in v0.200.0 (`#4795`).
    *   The `get_cells` RPC may fail when exceeding a newly imposed limit in v0.118.0 (`#4576`).
    *   RPC error messages have changed due to the removal of `anyhow`'s backtrace from responses in v0.120.0 (`#4728`).
*   **Configuration Breaking Changes**:
    *   Old config nodes will now open ws listen by default (`#4741` in v0.120.0), which is a breaking change to the config.
*   **Consensus Breaking Changes**:
    *   The activation of CKB Edition Meepo (2024) on the Mainnet in v0.200.0 (`#4807`) is a breaking change of consensus once activated.
*   **Network Limitations**:
    *   The size of the `filters` field in the `BlockFilters` message is limited to 1.8MB in v0.203.0 (`#4972`) to prevent full CKB nodes from disconnecting light clients due to excessively large frames. This implies that block filter requests exceeding this size would be problematic.
*   **Potential for Inconsistent States**: The rich-indexer improvement in v0.203.0 (`#4946`) to "keep rocksdb SecondaryDB sync before read" suggests that prior to this, there could have been inconsistencies when reading from the secondary DB.
*   **Script/VM Issues (now fixed)**: Previous issues included panics when calling `inherited_fds` in the root process (`#4677` in v0.119.0) and atomic ordering problems in multi-thread scenarios (`#4623` in v0.119.0).

## 4. Are there working examples or reference implementations?

Yes, the CKB changelog describes features and fixes implemented within the `nervosnetwork/ckb` repository itself, which serves as the primary reference implementation for the CKB blockchain.

*   **CKB Node**: The CKB node software (`nervosnetwork/ckb`) is the direct reference implementation for all the features and improvements listed in the changelog, including asynchronous block download, P2P network protocols, and RPC API changes.
*   **Light Client**: The changelog explicitly mentions updates to the `DaoCalculator` to be used in light clients (`#4878` in v0.202.0). Our existing `ckb-light-esp` (github.com/toastmanAu/ckb-light-esp) is a working example of a CKB light client that would leverage these underlying CKB node improvements for synchronization and functionality.

No other separate, distinct "working examples" or "reference implementations" beyond the CKB node itself and our own `ckb-light-esp` are mentioned in the provided content.

## 5. Does the Renault Clio RS 172 (Clio II Sport) use K-Line or CAN bus on its OBD2 port? What is the primary ECU type (e.g., Bosch ME7.4.6)? What diagnostic protocol does Renault Clip typically use for this vehicle?

The provided web content (`https://www.renaultforums.co.uk/` and `https://www.cliosport.net/`) does not contain specific technical details about the OBD2 port communication protocols (K-Line or CAN bus), the primary ECU type (e.g., Bosch ME7.4.6), or the diagnostic protocol used by Renault Clip for the Renault Clio RS 172.

## 6. Can the Renault Link v1.99 KKL protocol (or equivalent diagnostic protocol for Clio RS 172) be replicated on an ESP32 using an L9637D K-Line transceiver? What are the specific communication parameters (baud rate, data bits, parity, stop bits, initialization sequence)?

The provided web content does not contain any information regarding the Renault Link v1.99 KKL protocol, its replicability on an ESP32 with an L9637D K-Line transceiver, or the specific communication parameters (baud rate, data bits, parity, stop bits, initialization sequence) for the Clio RS 172.

## 7. What specific data (live PIDs, fault codes, immobiliser status, VIN, mileage) can typically be READ from a Clio RS 172 via K-Line or CAN?

The provided web content does not contain specific details about what data (live PIDs, fault codes, immobiliser status, VIN, mileage) can typically be read from a Clio RS 172 via K-Line or CAN.

## 8. What specific parameters or functions (e.g., key programming, idle speed adjustment, ignition timing, throttle adaptation reset, service interval reset) can typically be WRITTEN to a Clio RS 172 ECU via K-Line or CAN, and what are the associated risks?

The provided web content does not contain specific details about what parameters or functions can typically be written to a Clio RS 172 ECU via K-Line or CAN, nor does it mention the associated risks.

## Gaps / Follow-up

*   **CKB Snapshot Infrastructure**: While the changelog details many improvements to synchronization and network, the term "snapshot infrastructure" itself isn't explicitly defined or detailed. Further research into CKB's specific snapshotting mechanisms (if any, beyond standard block sync) would be beneficial.
*   **Node.js Fiber Client Library**: The project ground truth explicitly states a "Key gap: no official Node.js Fiber client library exists — must build from Rust RPC source." This is a significant missing piece for the FiberQuest project.
*   **Renault Clio RS 172 OBD2 Details**: All questions related to the Renault Clio RS 172 (questions 5-8) could not be answered from the provided content. This indicates a significant gap in the available information for this specific vehicle's diagnostic capabilities. Follow-up research would require access to service manuals, diagnostic tool specifications (e.g., Renault Clip documentation), or specialized automotive forums/databases that delve into low-level diagnostic protocols for this specific model.

## Relevant Code/API Snippets

The provided content is primarily a changelog and forum discussions, not direct code snippets. However, the changelog entries refer to specific features and modifications within the CKB codebase:

*   **Asynchronous Block Download and Verification**:
    `#4365: Asynchronous Block Download and Verification` (v0.118.0)
    Changes to `sync_state` RPC:
    - Added `tip_hash` and `tip_number`.
    - Added `unverified_tip_hash` and `unverified_tip_number`.
    - Removed `orphan_blocks_size` field.
*   **P2P Network Proxy/Onion Support**:
    `#4733: Add proxy and onion support for ckb-network` (v0.204.0)
*   **Hole Punching Protocol**:
    `#4873: Add a hole punching protocol try use on nat traversal` (v0.202.0)
    `#4891: Hole punching protocol metrics` (v0.203.0)
*   **Light Client DaoCalculator Update**:
    `#4878: Update DaoCalculator so it can be used in light client` (v0.202.0)
*   **`get_cells` RPC Limit**:
    `#4576: Add limit to get cells` (v0.118.0) - "This is a breaking change to RPC. The RPC to get cells may fail when exceeding the limit."
*   **`BlockFilters` Message Size Limit**:
    `#4972: Limit the size of filters field in message BlockFilters in GetBlockFiltersProcess` (v0.203.0) - "This PR limits size of `filters` field to 1.8MB, to avoid the frame sended by tentacle being too large (reaches 2MB) causing full CKB nodes disconnects light-client nodes"
*   **CKB Edition Meepo (2024) Activation**:
    `#4807: Activate CKB Edition Meepo (2024) on the Mainnet` (v0.200.0) - "This is a breaking change of consensus once activated."