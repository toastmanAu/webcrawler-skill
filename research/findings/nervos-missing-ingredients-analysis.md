# Research: nervos-missing-ingredients-analysis

**Date:** 2026-03-06  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/nervosnetwork/rfcs/main/rfcs/0022-transaction-structure/0022-transaction-structure.md, https://raw.githubusercontent.com/nervosnetwork/rfcs/main/rfcs/0009-vm-syscalls/0009-vm-syscalls.md, https://raw.githubusercontent.com/nervosnetwork/docs.nervos.org/develop/docs/basics/introduction.md, https://raw.githubusercontent.com/ckb-devrel/ckb-devkit/main/README.md, https://raw.githubusercontent.com/cryptape/kuai/main/README.md, https://raw.githubusercontent.com/ckb-ecell/axon/main/README.md

---

## Research Note: nervos-missing-ingredients-analysis

**Date:** 2026-03-06

### Summary

This analysis, based solely on the provided "Project Ground Truth" content, identifies several infrastructure, tooling, and UX gaps within the Nervos CKB ecosystem for widespread developer and user adoption. While CKB offers a modern wallet experience with JoyID and foundational JavaScript SDKs like `@ckb-ccc/core`, it appears to lack equivalents for comprehensive developer tooling such as local testing environments (Hardhat/Foundry), generic on-chain indexing (The Graph), and standard smart contract libraries (OpenZeppelin). Key gaps also include explicit mobile SDKs, a gasless UX mechanism (meta-transactions/account abstraction), oracle infrastructure, and cross-chain bridges for major assets. While a testnet exists, its ease of local setup is not detailed, and generic event notification infrastructure is not described.

### Research Questions Answered

#### (1) Onboarding — how hard is it for a new developer to ship their first CKB dApp today vs Ethereum/Solana? What's the friction?

The provided content indicates that foundational elements for dApp development exist. JoyID serves as a "primary wallet (passkeys, no seed phrase)", offering a modern user experience. For developers, `@ckb-ccc/core` is identified as the "primary JS SDK for CKB transaction building". Wyltek Industries has successfully built and deployed a React/Vite DOB minter using `@ckb-ccc/connector-react` and `@ckb-ccc/spore`, demonstrating a functional frontend development stack. Additionally, `@wyltek/ckbfs-browser` provides a browser-side JS SDK for CKBFS V3.

However, the content does not provide sufficient detail to directly compare the *friction* for a *new* developer against ecosystems like Ethereum or Solana, which often have extensive documentation, tutorials, and integrated development environments. A specific friction point identified is the "Key gap: no official Node.js Fiber client library exists — must build from Rust RPC source" for the Fiber network, which would require significant effort for developers wanting to integrate Fiber payments into Node.js applications.

#### (2) Tooling gaps — what does every Ethereum dev take for granted (Hardhat, Foundry, The Graph, ethers.js, OpenZeppelin) that doesn't exist on CKB?

*   **Hardhat/Foundry (local development and testing environments):** The provided content does not mention any CKB equivalents to these comprehensive local development and testing frameworks. While Wyltek runs a "CKB mainnet full node" and "testnet light clients," there's no indication of tools for easy local devnet spin-up or integrated testing.
*   **The Graph (indexing and querying on-chain data):** No generic CKB equivalent for indexing and querying on-chain data like The Graph is mentioned. Wyltek has custom solutions like `ckb-node-dashboard` (which polls `ckbnode`) and `ckb-whale-bot` (which monitors for transactions), but these are not general-purpose indexing protocols.
*   **ethers.js (JavaScript SDK):** `@ckb-ccc/core` is explicitly stated as the "primary JS SDK for CKB transaction building," serving a similar role to ethers.js. Other related SDKs include `@ckb-ccc/connector-react` and `@ckb-ccc/spore`.
*   **OpenZeppelin (standard contract libraries):** The provided content does not mention any CKB equivalent for audited, reusable smart contract libraries like OpenZeppelin.

#### (3) Mobile — is there a CKB mobile SDK? Can you build a React Native app that interacts with CKB?

The content does not explicitly mention a dedicated CKB mobile SDK for native iOS or Android development (e.g., Swift/Kotlin SDKs). While `ckb-light-esp` runs on ESP32 (an embedded platform) and `BitChat mesh` targets NimBLE-Arduino for ESP32, these are not general mobile phone SDKs.

Regarding React Native, the existence of `@ckb-ccc/connector-react` (used in a React/Vite web app) and `JoyID` (a modern wallet that could support mobile browsers) suggests that web-based dApps accessible on mobile are feasible. However, specific support or libraries for building *native* React Native applications that interact with CKB are not detailed in the provided content.

#### (4) Gasless UX — does CKB have meta-transactions or account abstraction for removing the "user needs CKB to do anything" UX problem?

The provided content does not mention meta-transactions, account abstraction, or any other mechanism designed to provide a "gasless" user experience on CKB. The CKB Layer 1 is described as a "UTXO-like chain (cells, not accounts)" with a "Cell model: capacity + lock script + optional type + data," which inherently implies that transactions require capacity (CKB) for state changes.

#### (5) Oracle infrastructure — is there a Chainlink equivalent on CKB? Any price feeds?

The provided content does not mention any oracle infrastructure, such as a Chainlink equivalent, or specific price feeds available on CKB.

#### (6) Cross-chain bridges — what's the state of bridging USDC, ETH, BTC onto CKB for liquidity?

The provided content does not mention any cross-chain bridges for bringing assets like USDC, ETH, or BTC onto CKB for liquidity.

#### (7) Smart contract composability — how does CKB's cell model compare to EVM composability? What patterns exist for multi-contract interactions?

The content describes the CKB cell model as "capacity + lock script + optional type + data" within a "UTXO-like chain (cells, not accounts)." However, it does not elaborate on how this model compares to EVM's account-based composability or describe specific patterns for multi-contract (or multi-script) interactions on CKB.

#### (8) Data availability — can you store meaningful app state on CKB cheaply, or does the capacity model make this prohibitive?

CKBFS (CKB File System) is confirmed to allow "On-chain file storage — stores arbitrary files chunked across CKB cells." This is demonstrated by its use in the DOB minter for "CKBFS V2/V3 image upload." This confirms that data *can* be stored on-chain. However, the provided content does not offer information regarding the *cost-effectiveness* or *cheapness* of storing "meaningful app state" or whether the capacity model makes this prohibitive.

#### (9) Event/notification infrastructure — how do apps listen for on-chain events without running a full node?

The content mentions `ckb-light-esp` as a "Full CKB light client protocol stack running on ESP32," which can track chain state. Wyltek also uses custom solutions like `ckb-node-dashboard` (which "polls ckbnode") and `ckb-whale-bot` (which "monitoring CKB node for large transactions"). While light clients can provide state updates, and custom polling can monitor for specific transactions, the provided content does not describe a generic, push-based event/notification infrastructure that allows applications to listen for arbitrary on-chain events without running a full node or implementing custom polling mechanisms.

#### (10) Testing infrastructure — is there a CKB devnet/testnet that's easy to spin up locally?

The existence of a "testnet" is confirmed, as the N100 machine runs "CKB + testnet light clients." However, the provided content does not indicate whether this testnet (or any other CKB devnet) is "easy to spin up locally" or if there are specific tools and documentation available to facilitate local development and testing environments comparable to those in other ecosystems.

### Gaps / Follow-up

Based on the provided content, the following information is not available or is incomplete:

*   **Onboarding Friction Comparison:** A detailed comparison of developer onboarding friction for CKB versus Ethereum/Solana, including comprehensive guides, tutorials, and integrated development environment (IDE) support.
*   **Local Development Tooling:** Specific CKB equivalents for local development and testing frameworks like Hardhat or Foundry.
*   **On-chain Indexing:** A generic, decentralized indexing and querying solution for CKB data, similar to The Graph.
*   **Standard Contract Libraries:** A repository or framework for audited, reusable CKB smart contract libraries, akin to OpenZeppelin.
*   **Native Mobile SDKs:** Explicit CKB SDKs for native iOS (Swift) or Android (Kotlin) development, or specific React Native libraries.
*   **Gasless UX Solutions:** Any mechanisms for meta-transactions, account abstraction, or sponsored transactions to remove the need for users to hold CKB for transaction fees.
*   **Oracle Infrastructure:** The existence of any decentralized oracle networks or specific price feeds on CKB.
*   **Cross-chain Bridges:** Information on the state of bridging major assets (USDC, ETH, BTC) onto CKB for liquidity.
*   **Smart Contract Composability Patterns:** Detailed patterns and best practices for multi-script or multi-cell interactions and how the cell model impacts composability compared to EVM.
*   **Cost of On-chain Data Storage:** Quantitative information on the cost-effectiveness or prohibitiveness of storing meaningful application state on CKB using the capacity model.
*   **Generic Event Notification:** A standardized, push-based event/notification infrastructure for applications to subscribe to on-chain events without custom polling or running a full node.
*   **Ease of Local Testnet Setup:** Details on how easy it is for a developer to spin up a CKB devnet or testnet locally for development and testing purposes.

### Relevant Code/API Snippets

*   `@ckb-ccc/core`: Primary JS SDK for CKB transaction building.
*   `@ckb-ccc/connector-react`: Used in the React/Vite DOB minter for wallet connection.
*   `@ckb-ccc/spore`: Used in the React/Vite DOB minter for Spore NFT interactions.
*   `@wyltek/ckbfs-browser`: Browser-side JS SDK for CKBFS V3.
*   `JoyID`: Primary wallet for CKB (passkeys, no seed phrase).
*   FNN binary RPC methods: `open_channel`, `send_payment`, `list_channels`, `new_invoice`, `get_invoice` (for Fiber network).
*   CKBFS V3 `code_hash`: `0xb5d13ffe0547c78021c01fe24dce2e959a1ed8edbca3cb93dd2e9f57fb56d695`
*   CKBFS V3 `type_id`: `0xcc5411e8b70e551d7a3dd806256533cff6bc12118b48dd7b2d5d2292c3651add`