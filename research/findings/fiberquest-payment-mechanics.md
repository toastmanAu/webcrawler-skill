# Research: fiberquest-payment-mechanics

**Date:** 2026-03-05  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/nervosnetwork/fiber/main/README.md, https://raw.githubusercontent.com/nicholasgasior/gsfmt/master/README.md, https://stacker.news/items/1, https://github.com/lightningnetwork/lnd/blob/master/docs/payments.md

---

Date: 2026-03-05

## Summary

FiberQuest's payment mechanics can leverage the Fiber Network's capabilities for extremely low-cost micropayments, instant asset swaps, and composability with CKB contracts. While the provided content does not detail specific game design choices for per-event payouts (e.g., per-damage, per-score), it confirms the technical feasibility of granular, real-time payments. The Fiber Network supports multiple assets, including UDTs on CKB, and offers low latency and high throughput, making it suitable for dynamic in-game transactions. Wager sizes can be set in CKB shannons, with a recommendation for amounts that feel significant but not prohibitive, potentially ranging from thousands to tens of thousands of shannons for an "arcade quarter" equivalent. The network's composability and planned conditional payments could support variable and bracket wagers.

## Research Questions

### 1. Payment mechanics per genre: (1) Fighting games — per-damage (proportional shannons to HP lost), per-round, per-match, per-special-move? (2) Sports — per-score, per-quarter, winner-takes-all? (3) Racing — per-position-change, finish-order payout, lap splits? (4) Puzzle/versus — per-garbage-sent, per-line-clear, survival bonus? (5) Co-op brawlers — "pay to revive" model, boss-kill bounty, shared pool?

The provided source content primarily describes the technical features and implementation of the Fiber Network Protocol (FNP) and does not contain specific details or recommendations for game design payment mechanics across different genres. Therefore, I cannot provide an answer directly from the given content regarding per-damage, per-score, per-position-change, per-garbage-sent, or "pay to revive" models.

However, the Fiber Network's core features make such granular payment mechanics technically feasible:
*   **Extremely low-cost micropayments**: "e.g. 0.0001 cent payment with 0.00000001 cent fee" indicates that even very small, frequent payments are economical. This directly supports per-event payments like per-damage, per-line-clear, or per-score.
*   **Low latency**: "e.g. 0.0001 cent payment in your p2p connection latency, e.g. 20ms" suggests that payments can occur in near real-time, which is crucial for dynamic in-game events.
*   **Composable with other contracts/scripts on CKB**: This feature allows for custom logic to be built on top of the Fiber Network, enabling complex payment conditions and distributions for scenarios like shared pools, boss-kill bounties, or conditional payouts based on game state.
*   **Multiple assets support**: "e.g. stable coins, RGB++ assets issued on Bitcoin ledger, and UDT assets issued on CKB ledger" means that payments can be made using various in-game currencies or tokens, not just CKB.

While the *design* of these mechanics is a game development decision, the Fiber Network provides the underlying infrastructure to implement highly granular, real-time, and programmable payment flows for any of the suggested genre-specific models.

### 2. What's the ideal wager size? Too small = meaningless, too large = scary. Recommend default amounts in CKB shannons that feel like arcade quarters — enough to feel real, not enough to hurt. Consider: variable wager (set per session), bracket wager (tournament pot).

The ideal wager size in CKB shannons for an "arcade quarter" equivalent needs to strike a balance between feeling real and not being prohibitive. The Fiber Network emphasizes "extremely low-cost micropayments," citing "0.0001 cent payment." An arcade quarter is typically 25 cents.

To translate this into CKB shannons, we need to make an assumption about the value of CKB relative to USD cents, which is not provided in the source content. However, we can infer a relative scale. If "0.0001 cent" represents a very small, almost negligible transaction, then an "arcade quarter" (25 cents) would be 25 / 0.0001 = 250,000 times that base unit.

Drawing a parallel to "sats" mentioned in the `stacker.news` content (e.g., "10 sats" for a reply, "6969 sats" for a post), which are fractions of Bitcoin and often used for micropayments, we can estimate a range. If 1 CKB Shannon is conceptually similar to 1 satoshi in terms of its smallest practical unit for micropayments, then:
*   A small tip/reply on Stacker News is ~10-200 sats.
*   A more significant post is ~7000 sats.
*   An "arcade quarter" (e.g., $0.25 - $0.50) might correspond to a few thousand sats/shannons to feel tangible but not excessive.

**Recommended Default Wager Amounts (in CKB Shannons):**
*   **Small Wager (e.g., per-round, per-line-clear):** 1,000 - 5,000 CKB shannons. This amount is small enough for frequent micro-transactions but large enough to register as a real value.
*   **Medium Wager (e.g., per-match, entry fee):** 10,000 - 50,000 CKB shannons. This could represent a more substantial "arcade quarter" or a small entry fee for a match.
*   **Large Wager (e.g., winner-takes-all, boss-kill bounty):** 100,000 - 500,000 CKB shannons. This would be for higher stakes games or significant achievements.

These recommendations are based on the *relative scale* of micropayments and the "feel" of an arcade quarter, assuming CKB shannons behave similarly to satoshis in this context.

**Variable Wager (set per session) and Bracket Wager (tournament pot):**
The Fiber Network's features support these concepts:
*   **Composable with other contracts/scripts on CKB**: This allows developers to implement custom logic for setting variable wagers based on user input or game parameters, and for managing tournament pots where funds are collected and distributed according to predefined rules (e.g., bracket progression, final standings).
*   **Programmable conditional payment (TODO)**: This feature, once implemented, would directly enable advanced wager mechanics, allowing payments to be released only when specific conditions (e.g., match completion, tournament phase, specific player actions) are met. This is ideal for managing tournament pots and distributing payouts automatically.

### 3. Have any other projects done game+Lightning payments? What can we learn/differentiate from?

The provided content mentions the "Lightning Network" as a similar peer-to-peer payment/swap network to Fiber. It also states that Fiber supports "Cross-network asset payment/swap, e.g. from Lightning network to Fiber network, and vice versa."

The `stacker.news` content provides an example of a platform using "sats" (Bitcoin's smallest unit, commonly associated with Lightning Network) for micropayments in a non-gaming context. Users can tip posts and replies with amounts like "10 sats," "266 sats," or "6969 sats." This demonstrates the practical application of micropayments for user engagement and content monetization.

The requested `https://github.com/lightningnetwork/lnd/blob/master/docs/payments.md` document was not found (`FETCH ERROR: HTTP Error 404: Not Found`), so specific technical details about Lightning payments from that source could not be analyzed.

**What can be learned/differentiated from:**
*   **Learning from Stacker News (and similar Lightning-enabled platforms):**
    *   **User familiarity with small units:** Users are comfortable with "sats" as a unit of value for micropayments, suggesting that CKB shannons can similarly be adopted for in-game transactions.
    *   **Direct user-to-user payments:** The tipping model on Stacker News shows that direct payments between users (or to content creators) are a viable and engaging mechanic. This could translate to player-to-player wagers, bounties, or shared rewards in FiberQuest.
    *   **Perceived value:** The varying amounts of sats for different actions (reply vs. post) indicate that the perceived value of an action can be directly mapped to a cryptocurrency amount.

*   **Differentiation with Fiber Network:**
    *   **Multiple assets support:** Fiber's ability to support "stable coins, RGB++ assets issued on Bitcoin ledger, and UDT assets issued on CKB ledger" offers a significant advantage over Lightning, which is primarily focused on Bitcoin. This allows FiberQuest to use custom in-game tokens or stablecoins for payments, providing more flexibility and potentially a more stable in-game economy.
    *   **Cross-network compatibility:** The "Cross-network asset payment/swap, e.g. from Lightning network to Fiber network, and vice versa" feature means FiberQuest could potentially integrate with the existing Lightning ecosystem, allowing users to move assets between networks. This could broaden the user base and liquidity.
    *   **Advanced cryptography (PTLCs):** Fiber uses "more advanced cryptographic techniques to ensure security and privacy, e.g. uses PTLC not HTLC." This could offer enhanced privacy and flexibility for conditional payments compared to traditional HTLC-based Lightning payments.
    *   **Composability with CKB contracts:** Fiber's composability with CKB contracts provides a powerful platform for complex, programmable payment logic directly on the Nervos CKB blockchain, which might offer more flexibility for game-specific smart contracts than what is easily achievable on Lightning Network alone.

## Gaps / Follow-up

1.  **CKB Shannon to Fiat Conversion:** The most significant gap is the lack of a clear CKB Shannon to fiat (e.g., USD cent) conversion rate within the provided documents. This would allow for more precise recommendations for "arcade quarter" equivalents. Follow-up would involve researching current CKB market value and its smallest unit (Shannon).
2.  **Specific Game Integration Examples:** The content is purely infrastructure-focused. To design payment mechanics, further research into existing blockchain games (on any chain) that implement granular, real-time payments would be beneficial to gather best practices and user experience insights.
3.  **"Programmable Conditional Payment" Details:** While mentioned as a TODO, the specifics of how "programmable conditional payment" will work (e.g., API, scripting language, supported conditions) are crucial for designing advanced wager and payout systems. Follow-up would involve monitoring Fiber Network development for updates on this feature.
4.  **Fiber-scripts Documentation:** The README mentions "Payments over fiber channel (via [fiber-scripts])". While a link is provided, the content of `fiber-scripts` was not directly analyzed. A deeper dive into these scripts could reveal specific methods for implementing in-game payment logic.
5.  **RPC Documentation for Payments:** The Fiber README links to "RPC Documentation" which likely contains the specific API calls for initiating and managing payments. Reviewing this documentation (`./crates/fiber-lib/src/rpc/README.md`) would be essential for actual implementation.

## Relevant Code/API Snippets

The provided content describes the Fiber Network's capabilities but does not include direct code snippets for implementing game-specific payment mechanics. However, it points to relevant areas for future development and integration:

*   **Fiber Network Node (FNN) Features:**
    *   "**Extremely low-cost micropayments**, e.g. 0.0001 cent payment with 0.00000001 cent fee" - This highlights the core capability for granular in-game payments.
    *   "**Composable** with other contracts/scripts on CKB" - This is key for implementing custom game logic for wagers, payouts, and conditional payments.
    *   "**Programmable conditional payment** - [ ] Advanced channel liquidity management" (listed under TODO) - This indicates future support for complex payment conditions.

*   **RPC Documentation:**
    The Fiber Network provides RPC methods for channel management and payments. While specific payment RPC calls are not detailed in the main README, the documentation link suggests their existence:
    *   `[list all channels](./crates/fiber-lib/src/rpc/README.md#channel-list_channels)`
    *   `[close](./crates/fiber-lib/src/rpc/README.md#channel-shutdown_channel)`
    *   The full RPC documentation (`./crates/fiber-lib/src/rpc/README.md`) would contain the specific API calls for initiating payments over Fiber channels, which would be used by FiberQuest to send and receive CKB shannons or other assets.

*   **Fiber Scripts:**
    *   "Payments over fiber channel (via [fiber-scripts])" - This implies that custom scripts can be used to define payment logic. The linked repository (`https://github.com/nervosnetwork/fiber-scripts`) would contain examples or documentation on how to write these scripts.