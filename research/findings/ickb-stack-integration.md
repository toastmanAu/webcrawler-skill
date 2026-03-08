# Research: ickb-stack-integration

**Date:** 2026-03-08  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/ickb/whitepaper/main/README.md, https://raw.githubusercontent.com/ickb/v1-core/main/README.md, https://raw.githubusercontent.com/ickb/v1-interface/main/README.md, https://api.github.com/repos/ickb/v1-core/contents

---

## Research Note: ickb-stack-integration

**Date:** 2026-03-08

### Summary

iCKB is a liquid staking derivative on the Nervos CKB blockchain, implemented as a User Defined Token (UDT). Its core contracts include `ickb_token.rs` (the UDT itself), `ickb_pool.rs` for managing CKB deposits and iCKB minting/burning, and `ickb_oracle.rs` for providing the CKB/iCKB exchange rate. While the foundational contract structure is identified, detailed whitepaper and interface documentation are unavailable. This limits the ability to fully assess integration points with Wyltek's Fiber Network, DOB minting flow, or other CKB-based operations, as specifics on yield accrual, programmatic interfaces, and liquidity remain largely unknown from the provided content.

### 1. What is iCKB — how does it work as a liquid staking derivative on CKB? What's the yield mechanism and how does the exchange rate accrue?

iCKB is a liquid staking derivative on CKB, implemented as a User Defined Token (UDT). Its core functionality is managed by three primary smart contracts:
*   `ickb_token.rs`: This contract defines the iCKB UDT itself.
*   `ickb_pool.rs`: This contract is responsible for managing CKB deposits and the corresponding minting of iCKB, as well as the burning of iCKB for CKB redemption. This implies that users deposit CKB into this pool to receive iCKB.
*   `ickb_oracle.rs`: This contract provides the CKB/iCKB exchange rate.

Based on the `ickb_pool.rs` and `ickb_oracle.rs` contracts, the mechanism likely involves users staking CKB into the `ickb_pool.rs` to receive iCKB. The yield mechanism and how the exchange rate accrues are not explicitly detailed in the provided content. Typically, in liquid staking derivatives, the exchange rate between the derivative (iCKB) and the underlying asset (CKB) increases over time as staking rewards accumulate in the pool, making each iCKB token represent a progressively larger amount of CKB. However, the specific details of this accrual are not available.

### 2. Integration with Fiber Network — can iCKB be used in Fiber payment channels instead of raw CKB? What are the tradeoffs (liquidity, atomicity, channel capacity)?

Fiber Network is described as routing "payments (CKB, UDTs)". Since iCKB is implemented as a UDT (User Defined Token) on CKB, it *can* theoretically be used in Fiber payment channels.

**Tradeoffs:**
*   **Liquidity:** The primary tradeoff would be the liquidity of iCKB. While Fiber supports UDTs, the practical usability of iCKB within channels depends on its market depth and ease of conversion to CKB or other assets. If iCKB has low liquidity, finding counterparties for payments or converting it to CKB might be challenging, limiting its utility in channels.
*   **Atomicity:** Fiber uses PTLCs (Point Time-Locked Contracts) for atomic swaps. If iCKB is a standard UDT, its atomicity within Fiber channels should be consistent with other UDTs. The provided content does not suggest any unique atomic properties for iCKB that would differ from other UDTs.
*   **Channel Capacity:** Channel capacity for iCKB would be limited by the amount of iCKB committed to the channel by participants. This is similar to CKB channels, but the overall network capacity for iCKB would depend on its adoption and the number of channels opened with iCKB.

### 3. Integration with our DOB/Spore minting flow — could Founding Members stake CKB via iCKB and use yield to mint DOBs?

The provided content states that the `ckb-dob-minter` uses CKB for minting. For Founding Members to stake CKB via iCKB and use the yield to mint DOBs, two conditions must be met:
1.  The iCKB protocol must provide a mechanism to claim or automatically distribute yield in CKB.
2.  If the yield is distributed in iCKB, there must be a liquid market to convert iCKB to CKB to fund the minting process.

The provided `ickb/contracts/README.md` does not detail the yield mechanism or whether yield is distributed in CKB or iCKB. Therefore, based *only* on the provided content, it is not possible to definitively state if iCKB yield could directly fund DOB minting without an explicit conversion step. If the yield is CKB, it could directly fund minting. If the yield is iCKB, it would require conversion to CKB first.

### 4. Wyltek POS integration — accept iCKB as payment? Convert on the fly?

The provided content does not describe an existing Wyltek POS system. However, assuming a hypothetical POS system:
*   **Accept iCKB as payment:** It would be technically feasible to accept iCKB as payment, given it's a UDT. This would require the POS system to integrate with the CKB blockchain to verify iCKB transactions and potentially display the CKB equivalent value using the `ickb_oracle.rs` contract.
*   **Convert on the fly:** Converting iCKB to CKB on the fly would depend entirely on the liquidity of iCKB on CKB exchanges or through the `ickb_pool.rs` contract's redemption mechanism. If there's sufficient liquidity and an accessible programmatic interface for conversion, it could be automated. Without details on iCKB's market liquidity or redemption process, this cannot be fully assessed.

### 5. CKH node — could iCKB yield fund node operation costs automatically?

The term "CKH node" is not found in the project ground truth. Assuming this is a typo and refers to "CKB node" (e.g., `ckbnode` at `192.168.68.87`), the ability for iCKB yield to fund node operation costs automatically depends on the same factors as DOB minting (Question 3):
1.  Whether the iCKB protocol distributes yield in CKB directly.
2.  If yield is in iCKB, the existence of a liquid market and programmatic interface to convert iCKB to CKB to cover operational expenses.

Without details on the iCKB yield distribution mechanism, it's not possible to confirm automatic funding.

### 6. Any SDK or contract interfaces available for programmatic iCKB mint/redeem?

The `ickb/contracts/README.md` refers to the iCKB whitepaper and `v1-interface` repository for detailed usage instructions and API documentation. However, both the whitepaper and `v1-interface` repository URLs resulted in `FETCH ERROR: HTTP Error 404: Not Found`.

Therefore, based *only* on the provided content, specific SDKs or programmatic contract interfaces for iCKB minting and redemption are not available. The `ickb_pool.rs` contract is identified as managing these operations, implying that direct interaction with this contract would be the programmatic interface, but no higher-level SDK or detailed API documentation is provided.

### 7. Risks: smart contract risk, depeg scenarios, liquidity depth on mainnet.

*   **Smart Contract Risk:** As with any protocol relying on smart contracts, there is an inherent risk of bugs, vulnerabilities, or exploits in the `ickb_token.rs`, `ickb_pool.rs`, or `ickb_oracle.rs` contracts. Such vulnerabilities could lead to loss of staked CKB or iCKB.
*   **Depeg Scenarios:** A depeg scenario occurs if the iCKB/CKB exchange rate deviates significantly from its fair value (typically 1 iCKB = 1 CKB + accrued yield). This could be caused by market imbalances, liquidity crises, or issues with the underlying staking mechanism. The `ickb_oracle.rs` contract is designed to provide the exchange rate, but its robustness and resistance to manipulation are not detailed.
*   **Liquidity Depth on Mainnet:** The provided content does not offer any information regarding the liquidity depth of iCKB on CKB mainnet exchanges or within its own redemption pool. Low liquidity could lead to significant slippage during large minting or redemption operations, making it difficult to convert iCKB to CKB (or vice-versa) efficiently.

### Gaps / Follow-up

1.  **iCKB Whitepaper and `v1-interface` documentation:** The most critical gap is the lack of access to the iCKB whitepaper and the `v1-interface` repository. These are explicitly cited as sources for detailed usage and API documentation, which are essential for understanding the yield mechanism, exchange rate accrual specifics, and programmatic interfaces.
2.  **Yield Mechanism Details:** Specifics on how yield is generated, accrued, and distributed (e.g., automatically added to the pool, claimable as CKB, or distributed as iCKB) are missing.
3.  **Programmatic Interfaces/SDKs:** While the contracts are identified, concrete examples or documentation for interacting with `ickb_pool.rs` for mint/redeem operations (e.g., using `@ckb-ccc/core` or similar CKB SDKs) are not available.
4.  **Oracle Mechanism:** Details on how the `ickb_oracle.rs` contract sources its data, its update frequency, and its resistance to manipulation are unknown.
5.  **Mainnet Deployment Status & Liquidity:** Information on whether iCKB is currently deployed on CKB mainnet, its contract addresses, and its market liquidity (e.g., on exchanges) is not provided.

### Relevant Code/API Snippets

Based on the `ickb/contracts/README.md`, the core contracts are:

```
// From ickb/contracts/README.md
- `ickb_token.rs`: The core iCKB token contract, implementing a UDT (User Defined Token) on CKB.
- `ickb_pool.rs`: The staking pool contract, managing CKB deposits and iCKB minting/burning.
- `ickb_oracle.rs`: An oracle contract to provide the CKB/iCKB exchange rate.
```

No further code snippets or API definitions are available from the provided content due to `FETCH ERROR` for other relevant repositories.

---

## ⚠️ Quality Note

Findings are thin — seeds did not return sufficient content to answer the research questions. This task has been automatically re-queued with a request for better seeds.

**Thin phrase count:** 7  
**Content length:** 9384 chars
