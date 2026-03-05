# Research: fiberquest-multiplayer-synthesis-followup-follow-texas-holdem-angle-single-table-t

**Date:** 2026-03-05  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** 

---

## Research Note: FiberQuest Multiplayer Poker Synthesis

**Date:** 2026-03-05

### Summary

Implementing a Texas Hold'em poker game using Fiber for payments is technically feasible within the hackathon timeframe, provided a centralized server manages the game state. Fiber's low latency (~20ms) and minimal fees (~0.00000001 cent) are ideal for rapid, frequent micropayments required in poker. However, Fiber **cannot** store arbitrary game state (player hands, board, turn order, pot size). Therefore, a central Node.js server would be essential to manage the game logic, deal cards, validate moves, and determine winners. Players would interact with this server, which would then orchestrate Fiber payments for buy-ins, bets, and pot distribution, likely by having each player open a Fiber channel to the central server.

### Single table tournament buy in possible?

Yes, a single-table tournament buy-in is possible using Fiber.

**Mechanism:**
1.  **Central Server:** A dedicated Node.js server (similar to the existing FiberQuest sidecar) would manage the tournament. This server would also run a Fiber node or connect to one (e.g., `ckbnode` at `127.0.0.1:8227` via SSH tunnel).
2.  **Buy-in Payment:** Each player wishing to join the tournament would send a Fiber payment (CKB or UDTs) to an address controlled by the central server.
    *   The server would generate an invoice for the buy-in using the Fiber RPC method `new_invoice`.
    *   Players would pay this invoice using the Fiber RPC method `send_payment` from their respective Fiber nodes.
3.  **Pot Management:** The central server would track the total buy-ins, forming the "pot." Since Fiber cannot store arbitrary data, the server would maintain the virtual pot amount in its own memory/database.
4.  **Winner Distribution:** At the end of the tournament, once the winner is determined by the central server's game logic, the server would initiate a Fiber payment from its accumulated funds (representing the pot) to the winner's Fiber node using `send_payment`.

This approach leverages Fiber for the secure, low-cost transfer of funds while relying on a trusted central entity for game state and tournament logic.

### Ring games Can 9 players simultaneously interact with the same channel to facilitate poker?

It is highly unlikely that 9 players can simultaneously interact with the *same single Fiber channel* to facilitate poker. Fiber is described as a "payment channel network" conceptually similar to Bitcoin's Lightning Network. Payment channels in such networks are typically **point-to-point (two-party)**.

However, 9 players *can* simultaneously interact with a *system* that uses Fiber channels to facilitate poker, most practically through a **centralized hub model** for a hackathon.

**Proposed Centralized Hub Model:**

1.  **Central Poker Server:** A Node.js server acts as the central hub. This server manages all game state (player hands, community cards, current bets, pot size, turn order, player actions like fold/check/call/raise). Fiber **cannot** store this game state.
2.  **Player-to-Server Channels:** Each of the 9 players would open a Fiber channel to the central poker server's Fiber node. This would involve each player's Fiber node calling `open_channel` to the server's Fiber node.
3.  **Payment Flow:**
    *   **Buy-in/Initial Stack:** Players send an initial Fiber payment to the central server's node via their respective channels. The server tracks each player's stack.
    *   **Betting Rounds:** When a player bets, they instruct their client application, which then tells the central server. The server validates the move. If valid, the player's Fiber node sends a Fiber payment corresponding to their bet amount to the central server's Fiber node using `send_payment`. The server updates the virtual pot and player stacks.
    *   **Conditional Payments (PTLCs):** Fiber supports PTLCs. While theoretically possible to use PTLCs for complex conditional bets (e.g., a bet is released only if a player wins the hand), implementing this for a multi-player, dynamic pot poker game within a hackathon timeframe would be extremely complex. A simpler approach is direct payments to the central server, which then manages the virtual pot.
    *   **Pot Distribution:** Once a hand concludes and the winner is determined by the central server, the server's Fiber node sends a Fiber payment from its accumulated funds (representing the pot) to the winner's Fiber node using `send_payment`.
4.  **Game Logic & State:** The central server is solely responsible for dealing cards, enforcing poker rules, determining winners, and maintaining the authoritative game state. Player clients would communicate with this server for game updates and actions.

This model is the most practical for a hackathon as it simplifies the payment channel topology and offloads complex game state management from the decentralized network. It introduces a trusted third party (the central server) for game logic, but Fiber ensures the integrity and finality of the payment transfers.

### Gaps / Follow-up

1.  **Multi-Party Channel Confirmation:** The ground truth does not explicitly state whether Fiber channels can be multi-party (more than two participants). Assuming 2-party channels (like Lightning) is the most conservative and likely correct interpretation. Confirmation from Fiber core developers would be beneficial if a truly decentralized multi-party channel for a shared pot is desired.
2.  **PTLC Implementation Complexity:** While Fiber supports PTLCs, their practical application for managing a dynamic pot with multiple conditional bets in a poker game is highly complex. Further research into specific PTLC use cases and examples within Fiber would be needed to assess feasibility for a hackathon. For simplicity, direct payments to a central server are recommended.
3.  **Central Server Trust Model:** The proposed architecture relies on a trusted central server for game state and pot distribution logic. While Fiber handles the secure transfer of funds, the server dictates *who* receives the funds. For a production-grade decentralized poker game, a more robust, trust-minimized mechanism for game state consensus and pot distribution (e.g., on-chain smart contracts or a verifiable computation layer) would be required, but this is likely beyond the hackathon scope.
4.  **Client-Side Integration:** The Node.js sidecar/server would need to expose an API for player clients (e.g., web browser, desktop app) to interact with the poker game logic and trigger Fiber payments.

### Relevant Code/API Snippets

The core Fiber RPC methods that would be utilized by the Node.js central server and player clients are:

*   **`open_channel(peer_id, capacity_ckb, push_amount_ckb)`**: Used by players to open a channel to the central server, and potentially by the server to open channels to players if needed for specific scenarios (though player-to-server is more common for payments *to* the server).
*   **`new_invoice(amount_ckb, description)`**: Used by the central server to generate payment requests (invoices) for buy-ins or specific bets.
*   **`send_payment(invoice_string)`**: Used by players to pay invoices (buy-ins, bets) and by the central server to pay out winnings.
*   **`list_channels()`**: Useful for debugging and monitoring channel status.

These methods would be called via RPC to the Fiber node running on `ckbnode` (accessible via SSH tunnel to `N100:8237` from the Pi5 or other development machines). The Node.js server would use a library to make these RPC calls.