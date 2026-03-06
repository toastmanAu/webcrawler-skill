# Research: nervos-ecosystem-deep-dive

**Date:** 2026-03-06  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/nervosnetwork/awesome-nervos/main/README.md, https://raw.githubusercontent.com/nervosnetwork/rfcs/main/README.md, https://raw.githubusercontent.com/nervosnetwork/docs.nervos.org/develop/docs/ecosystem/projects.md, https://raw.githubusercontent.com/nervosnetwork/fiber/main/README.md, https://raw.githubusercontent.com/sporeprotocol/spore-sdk/main/README.md, https://raw.githubusercontent.com/ckb-ccc/ccc/main/README.md

---

Date: 2026-03-06

## Summary

The Nervos CKB ecosystem, as revealed by the provided content, demonstrates a robust Layer 1 foundation with a UTXO-like cell model and active development in key areas like NFTs (Spore Protocol/DOBs) and Layer 2 payment channels (Fiber Network). Wyltek Industries is a significant contributor, having shipped numerous production-ready applications, including an ESP32 CKB light client, a Spore NFT minter, and a browser-side CKBFS SDK. While core infrastructure and developer tooling like the Spore SDK and `@ckb-ccc/core` are present, the ecosystem shows gaps in areas such as a comprehensive Node.js Fiber client, a public indexer/data layer, and broader L1 DeFi primitives, indicating opportunities for further growth and widespread adoption.

## Research Questions

### 1. Layer 1 primitives — cell model, lock scripts, type scripts, UDT standards (xUDT, SUDT), Spore/DOB protocol, what's production-ready vs experimental

*   **Cell Model**: CKB Layer 1 operates on a "UTXO-like chain (cells, not accounts)" with a "Cell model: capacity + lock script + optional type + data" (Project Ground Truth).
*   **Lock Scripts & Type Scripts**: These are fundamental components of the CKB cell model, used to define ownership and behavior of cells (Project Ground Truth). No specific details on various lock/type scripts or their individual production readiness beyond their foundational role were provided.
*   **UDT Standards (xUDT, SUDT)**: The Fiber Network supports "UDT assets issued on CKB ledger" (Fiber README). However, the provided content does not differentiate between xUDT and SUDT standards or detail their specific production readiness.
*   **Spore/DOB Protocol**: Spore is the "CKB NFT standard" (Project Ground Truth). DOBs are Spore NFTs. Wyltek Industries has a "production minter live at wyltekindustries.com/mint/" (`ckb-dob-minter`) and has "minted DOBs on mainnet" (Project Ground Truth). The `sporeprotocol/spore-sdk` is a "TypeScript SDK to interact with Spore Protocol," built on Lumos, offering "Composed APIs for efficient spores/clusters interactions" and "Utilities for encoding/decoding data" (Spore SDK README).
*   **Production-Ready vs. Experimental**:
    *   The CKB cell model, lock scripts, and type scripts are core L1 primitives and are production-ready.
    *   The Spore/DOB protocol is production-ready, evidenced by Wyltek's mainnet minter and the actively developed Spore SDK.
    *   UDT assets are supported by Fiber, implying production readiness, but specific standards are not detailed.
    *   The `spore-sdk`'s "Joint APIs" are marked as "WIP" (Work In Progress) (Spore SDK README).

### 2. Layer 2 — Fiber Network state, RGB++ bridge status, Bitcoin L2 activity on CKB

*   **Fiber Network State**:
    *   Fiber is a "payment channel network — similar to Bitcoin's Lightning Network, built on CKB L1" (Project Ground Truth). It is a "peer-to-peer payment/swap network" that "CANNOT store arbitrary data or files" (Project Ground Truth, Fiber README).
    *   It supports "Multiple assets" including "stable coins, RGB++ assets issued on Bitcoin ledger, and UDT assets issued on CKB ledger" (Fiber README).
    *   Key features include "Extremely low-cost micropayments" (~0.0001 cent payment with ~0.00000001 cent fee), "Instant swap between any asset pairs," "Cross-network asset payment/swap (e.g., from Lightning network to Fiber network)," "Watchtower support," "Multi-hop payment," "Low latency" (~20ms), "High throughput," and "High privacy" (Fiber README). It uses "PTLCs not HTLCs" (Fiber README).
    *   The implementation is "still a work-in-progress and will have iterations even after mainnet," and users are advised to "use it with caution" (Fiber README).
    *   Completed TODOs include: "Establishing connections," "Creating and closing fiber channel," "Payments over fiber channel (via [fiber-scripts])," and "Cross-network asset transfer" (Fiber README).
    *   Remaining TODOs include: "Web-browser friendly runtime," "Programmable conditional payment," "Advanced channel liquidity management," and "Atomic multi-path payment" (Fiber README).
    *   Wyltek runs two Fiber nodes: `ckbnode` (mainnet, funded) and `N100` (needs funding) (Project Ground Truth).
*   **RGB++ Bridge Status**: The Fiber Network supports "RGB++ assets issued on Bitcoin ledger" (Fiber README), indicating an existing or planned bridge capability. No further details on the specific status or implementation of the RGB++ bridge were provided.
*   **Bitcoin L2 Activity on CKB**: Fiber Network explicitly supports "Cross-network asset payment/swap, e.g. from Lightning network to Fiber network, and vice versa" (Fiber README), suggesting active or planned interoperability with Bitcoin's Lightning Network. No other specific Bitcoin L2 activities on CKB were detailed.

### 3. Developer tooling — CCC, Lumos, ckb-sdk-js, ckb-sdk-rust, spore-sdk, CKB light client — gaps and pain points

*   **CCC**: `@ckb-ccc/core` is the "primary JS SDK for CKB transaction building" (Project Ground Truth). Wyltek's `ckb-dob-minter` uses `@ckb-ccc/connector-react` (Project Ground Truth). The `ckb-ccc/ccc` link resulted in a fetch error, so further details were unavailable.
*   **Lumos**: The `spore-sdk` is "built on top of [Lumos]," which is described as "an open-source dapp framework for Nervos CKB" (Spore SDK README). Lumos incorporates Node-polyfills for browser environments.
*   **ckb-sdk-js / ckb-sdk-rust**: These specific SDKs were not mentioned in the provided content.
*   **spore-sdk**: A "TypeScript SDK to interact with Spore Protocol," leveraging Lumos. It provides "Composed APIs" and "Joint APIs" (WIP) for spore/cluster interactions, along with utilities for data encoding/decoding. It supports both Node.js and browser environments (with manual polyfill addition for browsers) (Spore SDK README).
*   **CKB Light Client**: Wyltek has developed and shipped `ckb-light-esp`, a "Full CKB light client protocol stack running on ESP32 (C/ESP-IDF)," confirmed working on ESP32-P4 (Project Ground Truth).
*   **Gaps and Pain Points**:
    *   A "key gap" identified for the FiberQuest project is that "no official Node.js Fiber client library exists — must build from Rust RPC source" (Project Ground Truth).
    *   Using the Spore SDK in a browser environment "may need to manually add Node-polyfills" (Spore SDK README).

### 4. Wallet landscape — JoyID, Neuron, MetaMask CKB plugin — what wallet coverage exists for dApps

*   **JoyID**: "JoyID = primary wallet (passkeys, no seed phrase)" for CKB (Project Ground Truth). Wyltek's `ckb-dob-minter` uses JoyID, and the Wyltek Industries site uses "JoyID CKB address → Supabase auth" for its member system (Project Ground Truth). This indicates strong adoption and integration for dApps.
*   **Neuron / MetaMask CKB plugin**: These wallets were not mentioned in the provided content.
*   **Wallet Coverage for dApps**: JoyID is explicitly supported and integrated into Wyltek's production dApps. The use of `@ckb-ccc/connector-react` suggests a connector standard for dApps, but specific wallet integrations beyond JoyID are not detailed in the provided content.

### 5. Indexer/data layer — CKB Explorer, ckb-indexer, lightnode, what data APIs exist for app developers

*   **CKB Explorer / ckb-indexer**: These specific services were not mentioned in the provided content.
*   **Lightnode**: Wyltek has `ckb-light-esp`, a CKB light client protocol stack for embedded devices (Project Ground Truth). The N100 also runs "testnet light clients" (Project Ground Truth). These are client implementations, not general-purpose indexer services or data APIs for app developers.
*   **Data APIs for App Developers**:
    *   The Fiber Network Node provides an "RPC Documentation" (`crates/fiber-lib/src/rpc/README.md`) detailing methods like `open_channel`, `send_payment`, `list_channels`, `new_invoice`, and `get_invoice` for interacting with the Fiber network (Project Ground Truth, Fiber README).
    *   The Spore SDK offers "Composed APIs" and "Joint APIs" for interacting with spore and cluster data (Spore SDK README).
    *   Wyltek's `ckb-node-dashboard` "polls ckbnode (192.168.68.87:8114)" (Project Ground Truth), implying that standard CKB node RPC interfaces are available for data access.

### 6. DeFi / DEX — what financial primitives exist natively (UTXOSwap, any AMMs, lending?)

*   **UTXOSwap / AMMs / Lending**: No specific L1 native DeFi primitives such as UTXOSwap, Automated Market Makers (AMMs), or lending protocols were mentioned in the provided content.
*   **Financial Primitives**: The Fiber Network functions as a "payment/swap network" offering "Instant swap between any asset pairs" (Fiber README). This provides a Layer 2 primitive for asset exchange, but it is off-chain and not a native L1 DeFi primitive.

### 7. NFT/content ecosystem — Spore collections, DOB issuers, what's launched on mainnet

*   **Spore Collections / DOB Issuers**: Wyltek Industries is an active DOB issuer, having "minted DOBs on mainnet" (Project Ground Truth). Their `ckb-dob-minter` is a "production minter live at wyltekindustries.com/mint/" and uses a "Mainnet cluster: `0x54ba3ee23016ab6e2e20792d8fd69057c62392ca1997b622147a5bd98979f4e8`" (Project Ground Truth).
*   **Launched on Mainnet**: The Spore Protocol itself, as the basis for DOBs, is live on mainnet. Wyltek's DOB minter and the associated CKBFS V3 for image uploads are also live on mainnet (Project Ground Truth).

### 8. Gaming — any existing gaming projects on CKB, what's the state of play

*   **Existing Gaming Projects**: The only gaming project mentioned is Wyltek's own "FiberQuest" (Project Ground Truth). This is a "hackathon project" that integrates "RetroArch (emulator) → UDP RAM polling → Node.js sidecar → Fiber micropayments" to trigger payments based on in-game events (Project Ground Truth).
*   **State of Play**: Based solely on the provided content, the gaming ecosystem on CKB appears nascent, with FiberQuest being a pioneering effort to demonstrate real-time, event-driven micropayments within games using the Fiber Network. No other general gaming projects or dedicated gaming SDKs were mentioned.

### 9. Identity — DID standard, .bit domains, adoption

*   **DID Standard / .bit Domains**: No specific DID standard or `.bit` domains were mentioned in the provided content.
*   **Adoption**: JoyID is highlighted as the "primary wallet (passkeys, no seed phrase)" for CKB (Project Ground Truth). Its adoption is demonstrated by its use in Wyltek's production `ckb-dob-minter` and for "member system: JoyID CKB address → Supabase auth" on the Wyltek Industries site (Project Ground Truth). This indicates JoyID serves as a key identity component for dApps.

### 10. Community + developer activity — active builders, GitHub activity, hackathon history

*   **Active Builders**: Wyltek Industries is a highly active builder, with a long list of shipped projects including `ckb-light-esp`, `NerdMiner CKB`, `ckb-dob-minter`, `@wyltek/ckbfs-browser`, `ckb-node-dashboard`, and `ckb-whale-bot` (Project Ground Truth).
*   **GitHub Activity**: The `nervosnetwork/fiber` and `sporeprotocol/spore-sdk` repositories show active development, with `fiber` being "still under development" and `spore-sdk` accepting pull requests to its `beta` branch (Fiber README, Spore SDK README).
*   **Hackathon History**: Wyltek's "FiberQuest" is an upcoming "hackathon project" (Project Ground Truth). No other hackathon history was explicitly detailed.
*   **Community**: Both the Fiber Network and Spore Protocol encourage community engagement. Fiber README directs users to "report issues" and ask for help in the "channel of the Nervos dev community (Discord)." Spore SDK also invites users to "Join the community on: [HaCKBee - Discord]" (Fiber README, Spore SDK README).

## Gaps / Follow-up

1.  **Comprehensive Node.js Fiber Client Library**: The explicit lack of an official Node.js client library for Fiber (as noted in FiberQuest) is a significant barrier for Node.js developers wishing to integrate with the Fiber Network.
2.  **Public, Comprehensive Indexer/Data API**: While direct CKB node RPCs and specialized SDKs exist, there is no mention of a widely available, high-level indexer service (e.g., similar to The Graph or Blockfrost) that simplifies querying CKB chain data for general app development.
3.  **Broader Wallet Ecosystem & Standardized dApp Connectors**: While JoyID is primary and `@ckb-ccc/connector-react` is used, the content does not detail the status or adoption of other wallets (e.g., Neuron, MetaMask CKB plugin) or a robust, standardized dApp connector framework to ensure broad wallet compatibility across the ecosystem.
4.  **Layer 1 DeFi Primitives**: The provided content focuses on Fiber for L2 payments and swaps. There is no information on native L1 DeFi primitives such as AMMs, lending protocols, or other financial instruments built directly on CKB's cell model.
5.  **General Gaming Ecosystem & SDKs**: Beyond Wyltek's FiberQuest, the content does not indicate a broader gaming ecosystem, specific gaming SDKs, or tools designed to facilitate game development on CKB.
6.  **Detailed UDT Standards (xUDT/SUDT)**: While UDTs are mentioned as supported by Fiber, the specific standards and their nuances are not detailed.
7.  **RGB++ Bridge Details**: The mention of RGB++ asset support by Fiber is promising, but further details on the status, implementation, and ease of use of the RGB++ bridge itself are missing.
8.  **DID Standard and .bit Domains**: There is no information regarding a CKB-native Decentralized Identity (DID) standard or the status/adoption of `.bit` domains.

## Relevant Code/API Snippets

*   **Fiber Network Node RPC Methods**:
    *   `open_channel`
    *   `send_payment`
    *   `list_channels`
    *   `new_invoice`
    *   `get_invoice`
    (Cited from Project Ground Truth and Fiber README RPC Documentation link)

*   **CKBFS V3 Identifiers**:
    *   `code_hash`: `0xb5d13ffe0547c78021c01fe24dce2e959a1ed8edbca3cb93dd2e9f57fb56d695`
    *   `type_id`: `0xcc5411e8b70e551d7a3dd806256533cff6bc12118b48dd7b2d5d2292c3651add`
    (Cited from Project Ground Truth)

*   **Spore SDK Packages**:
    *   `@spore-sdk/core` (Spore SDK README)

*   **Spore SDK API Types**:
    *   "Composed APIs"
    *   "Joint APIs" (WIP)
    (Cited from Spore SDK README)

*   **CKB Core JS SDK**:
    *   `@ckb-ccc/core` (Project Ground Truth)

*   **Wyltek DOB Minter Mainnet Cluster ID**:
    *   `0x54ba3ee23016ab6e2e20792d8fd69057c62392ca1997b622147a5bd98979f4e8`
    (Cited from Project Ground Truth)