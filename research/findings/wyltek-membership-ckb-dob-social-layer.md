# Research: wyltek-membership-ckb-dob-social-layer

**Date:** 2026-03-04  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/sporeprotocol/spore-sdk/main/README.md, https://raw.githubusercontent.com/sporeprotocol/spore-sdk/main/docs/core-concepts.md, https://raw.githubusercontent.com/nervosnetwork/docs.nervos.org/develop/docs/dapp/spore-protocol.md, https://raw.githubusercontent.com/ckb-devrel/pausable-udt/main/README.md, https://raw.githubusercontent.com/cryptape/kuai/main/README.md

---

## Research Note: wyltek-membership-ckb-dob-social-layer

**Date:** 2026-03-04

### Summary
The provided content, primarily the Spore SDK README, describes a TypeScript SDK for interacting with the Spore Protocol on CKB, an asset protocol for on-chain content. It focuses on SDK features for creating, handling, and transacting with Spore cells and clusters, leveraging Lumos. While it hints at the ability to manage data associated with spores, the provided documentation does not detail advanced social features like soulbound tokens, on-chain comments, specific gas costs for storage, post-mint metadata updates, or native CKB token-gated architectures. The absence of core concept documentation and other CKB project READMEs due to fetch errors significantly limits the depth of analysis possible.

### Questions to Answer

#### 1. Can Spore cell ownership (DOB) be used as a soulbound membership token — what prevents transfers?
The provided content does not explicitly state whether Spore cell ownership can be made soulbound or what mechanisms would prevent transfers. The Spore Protocol is described as an "asset protocol for valuing on-chain contents," and assets are typically transferable. While the SDK offers a recipe to "[Create immortal spores on-chain](https://docs.spore.pro/recipes/create-immortal-spore)," the term "immortal" is not defined in the context of transferability (e.g., whether it means non-transferable or simply persistent). Without further documentation on Spore cell properties or specific transfer lock scripts, it's not possible to confirm if soulbound functionality is natively supported or how transfers could be prevented.

#### 2. Are there existing CKB social dApps storing comments/reactions on-chain? Gas cost estimates?
The provided content is limited to the Spore SDK and does not list or describe any existing CKB social dApps that store comments or reactions on-chain. Furthermore, it does not provide any information or estimates regarding CKB gas costs for storing data or performing transactions.

#### 3. What's the practical cost of storing a 280-char comment on CKB vs Supabase?
The provided content does not offer any information regarding the practical cost of storing data on CKB, nor does it mention Supabase. Therefore, a comparison of storage costs between CKB and Supabase cannot be made based on the given sources.

#### 4. Spore extensions — can we attach metadata to a Spore cell post-mint (e.g. member profile data)?
The Spore SDK README mentions "encoding/decoding data of spores/clusters" and provides a recipe to "[Handle spore/cluster data](https://docs.spore.pro/recipes/handle-cell-data)." The `@spore-sdk/core` package "Provides essential tools for constructing basic and advanced transactions on spores and clusters. Additionally, it offers convenient utilities for handling [serialization](https://github.com/nervosnetwork/molecule) of spores/clusters." This indicates that Spore cells carry data. However, the documentation does not explicitly state whether this data (metadata) can be *updated* or *attached* to an *already minted* Spore cell (post-mint) as an "extension." It primarily focuses on *creating* spores and handling their data, but not on modifying existing spore data after creation.

#### 5. What does a "token-gated" architecture look like natively on CKB — without a centralised DB?
The provided content does not describe a "token-gated" architecture natively on CKB or how to implement it without a centralized database. While Spore Protocol is an "asset protocol," implying that ownership of Spore cells could be used as a basis for gating, the documentation focuses on the SDK for interacting with these assets rather than on the architectural patterns for access control or on-chain verification of ownership for gated content.

### Gaps / Follow-up
1.  **Spore Cell Transferability & Soulbound Properties:** Deeper understanding of Spore cell properties, specifically regarding transferability and the potential for implementing non-transferable (soulbound) tokens. This would likely be covered in core protocol documentation or contract specifications, which were not available.
2.  **CKB Transaction & Storage Costs:** Detailed information on CKB transaction fees, storage costs (capacity), and how these are calculated. This is crucial for evaluating the feasibility of storing social data on-chain.
3.  **Spore Cell Update Mechanisms:** Clarification on whether existing Spore cells can be updated with new metadata post-mint, and if so, the SDK methods or transaction patterns required for such operations.
4.  **CKB Social dApp Landscape:** Information on other CKB projects or dApps that have implemented social features, their architectural choices, and whether they store social data on-chain.
5.  **On-chain Token-Gating Primitives:** Documentation or examples of how to implement token-gated access control directly on CKB, leveraging script logic to verify asset ownership without relying on off-chain databases.
6.  **Spore Protocol Core Concepts:** Access to the `docs/core-concepts.md` and `develop/docs/dapp/spore-protocol.md` documents would likely answer many of these fundamental questions.

### Relevant Code/API Snippets
The provided content is primarily descriptive of the SDK's capabilities rather than containing direct code snippets for the specific research questions. However, the following SDK components are relevant to interacting with Spore cells and their data:

*   **`@spore-sdk/core` package:** "Provides essential tools for constructing basic and advanced transactions on spores and clusters. Additionally, it offers convenient utilities for handling [serialization](https://github.com/nervosnetwork/molecule) of spores/clusters." This package would be central to any on-chain data operations with Spore cells.
*   **"Handle spore/cluster data" recipe:** (Link: `docs/recipes/handle-cell-data.md`) This recipe would be the starting point for understanding how data associated with Spore cells is managed, though its specifics regarding post-mint updates are unknown from the provided content.
*   **"Construct transactions with Spore SDK" recipe:** (Link: `docs/recipes/construct-transaction.md`) This recipe would detail how to build transactions that interact with Spore cells, which would be necessary for any on-chain social features or data updates.