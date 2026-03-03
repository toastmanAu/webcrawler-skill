# Research: ckb-chess-relayer-design

**Date:** 2026-03-03  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/toastmanAu/ckb-chess/main/README.md, https://raw.githubusercontent.com/nervosnetwork/fiber/main/docs/rpc.md, https://raw.githubusercontent.com/nervosnetwork/fiber/main/tests/bruno/fiber/send_payment.bru, https://raw.githubusercontent.com/nervosnetwork/fiber/main/tests/bruno/fiber/new_invoice.bru, https://raw.githubusercontent.com/nervosnetwork/fiber/main/tests/bruno/fiber/open_channel.bru, https://raw.githubusercontent.com/nervosnetwork/fiber/main/src/fiber/channel.rs

---

## Research Note: ckb-chess-relayer-design

**Date:** 2026-03-03

### Summary
The ckb-chess project aims to implement on-chain chess using CKB state channels, where each move is a signed state update validated by a CKB-VM contract. The relayer, envisioned as a Node.js server, acts as a "trusted server" for managing game timeouts and forwarding signed moves between players. Fiber payment channels are leveraged not only for escrow and settlement but also as the state transport layer, embedding game state hashes within payment messages. The relayer will monitor the CKB chain for game opening, closing, and timeout claims, while off-chain moves are exchanged via Fiber's Tentacle connection.

### 1. What Fiber RPCs are needed: new_invoice, send_payment, get_invoice, list_channels?
The provided `ckb-chess` README.md does not explicitly list the specific Fiber RPCs required for the relayer. It describes Fiber payment channel messages as "just signed data between two peers" where "the payment amount IS the commitment — each move shifts 1 microCKB from loser-in-progress to winner-in-progress, with the game state hash embedded in the message." This implies interaction with Fiber channels for balance adjustments and data transport.

Attempts to fetch `https://raw.githubusercontent.com/nervosnetwork/fiber/main/docs/rpc.md`, `https://raw.githubusercontent.com/nervosnetwork/fiber/main/tests/bruno/fiber/send_payment.bru`, `https://raw.githubusercontent.com/nervosnetwork/fiber/main/tests/bruno/fiber/new_invoice.bru`, and `https://raw.githubusercontent.com/nervosnetwork/fiber/main/tests/bruno/fiber/open_channel.bru` resulted in HTTP 404 errors, meaning detailed Fiber RPC documentation or examples were not available in the provided sources. Therefore, the specific RPCs like `new_invoice`, `send_payment`, `get_invoice`, `list_channels` cannot be confirmed from the given content.

### 2. Full payment flow: challenger opens channel → sends invoice per move → opponent pays?
The payment flow described in the `ckb-chess` README.md is as follows:
1.  **Channel Opening:** "both players lock CKB into a channel cell. Game starts." This implies an initial channel setup where funds are escrowed.
2.  **Move-based Commitment/Payment:** "each move shifts 1 microCKB from loser-in-progress to winner-in-progress, with the game state hash embedded in the message." This indicates that the payment is not a separate invoice per move that needs to be paid by the opponent, but rather a continuous adjustment of the channel balance based on the game state. The "payment amount IS the commitment."
3.  **Settlement:** "channel close = game over, funds move to winner." The final state of the channel determines the fund distribution.

Therefore, the flow is: challenger (or both players) opens a channel, and then each move *adjusts the balance within that existing channel* by a small amount (e.g., 1 microCKB), with the game state hash embedded in the Fiber payment channel message. It does not involve sending a new invoice for each move.

### 3. How does the relayer detect a channel close / game end on-chain?
The relayer detects a channel close or game end by monitoring the CKB chain for transactions interacting with the `chess-contract`. The contract is designed to run when:
*   "**Closing** a game (validate full move history, release funds to winner)"
*   "**Claiming timeout** (verify N blocks have passed since last move)"

The relayer would need to:
1.  **Monitor CKB blocks:** Continuously scan new CKB blocks for transactions.
2.  **Filter by contract interaction:** Identify transactions that call or interact with the `chess-contract` (specifically its `entry.c`).
3.  **Parse transaction data:** Extract relevant information from these transactions to determine if it's a game closing event (e.g., a winner submitting a final signed state) or a timeout claim.
4.  **Update internal state:** Based on detected on-chain events, the relayer updates its record of the game's status (e.g., game ended, winner declared, funds released).

### 4. Are there any existing CKB game relayer patterns to reference?
Yes, the `ckb-chess` README.md references existing CKB game patterns:
*   **Kabletop:** "Cryptape's prior art: card game on CKB channels (Lua VM for game logic)." This project demonstrates using CKB channels for game state and on-chain logic.
*   **ckb-embedded-research: Fiber Gaming Protocol:** This is a specific research document related to using Fiber for gaming.
*   **Nervos Fiber Network:** The underlying payment channel network itself provides a pattern for off-chain state updates and settlement.

The `ckb-chess` project itself adopts a "trusted server" pattern for handling timeouts in its MVP, which is essentially the role of the relayer: "MVP choice: trusted server — fits how lichess works, pragmatic, builds the on-chain mechanics first." This trusted server would timestamp moves and sign the record, which can then be submitted on-chain for dispute resolution.

### 5. WebSocket vs HTTP polling for the game client ↔ relayer protocol?
The `ckb-chess` README.md states that "Off-chain: moves are exchanged directly P2P (via Fiber or a relay)" and "Fiber's existing Tentacle connection carries the game." This refers to the player-to-player communication facilitated by Fiber.

For the `game client ↔ relayer` protocol, the provided content does not explicitly specify whether WebSocket or HTTP polling should be used. However, given that the relayer acts as a "trusted server" for a real-time game like chess, a persistent, low-latency communication channel is generally preferred for forwarding signed moves and providing timely updates.

While not explicitly stated, a **WebSocket** connection would be a more suitable choice for the `game client ↔ relayer` protocol compared to HTTP polling. WebSockets allow for full-duplex communication, enabling the relayer to push updates (e.g., opponent's move, game state changes, timeout warnings) to the client in real-time without the client needing to constantly poll. This aligns with the real-time nature of chess and the "lichess-like" pragmatic approach mentioned for the MVP.

### Gaps / Follow-up
*   **Fiber RPC Details:** The specific Fiber RPCs (e.g., for opening channels, making payments/balance adjustments, querying channel state) are not detailed in the provided content due to 404 errors on the Fiber RPC documentation and test files. This is a critical gap for implementing the relayer's interaction with Fiber.
*   **Relayer-Client Protocol Specification:** While a WebSocket is inferred as suitable, the exact protocol (message formats, authentication, error handling) between the game client and the Node.js relayer is not specified.
*   **Relayer Implementation Details:** The content outlines the *role* of the relayer (trusted server for timeouts, forwarding moves) but lacks specifics on its internal architecture, state management, or how it integrates with the CKB SDK for on-chain monitoring.
*   **Dispute Resolution Flow:** The content mentions "Disagreement = provable fraud (submit both sigs, contract picks the valid one)," but the detailed flow for how the relayer or clients handle and submit such disputes is not elaborated.

### Relevant Code/API Snippets
*   **Move Hash Commitment Structure:**
    ```
    move_hash = Blake2b(
        prev_state_hash || // hash of previous board state
        move_notation || // UCI format: e2e4, e7e5, etc.
        move_number || // anti-replay
        player_pubkey || // who's signing
        timestamp_claim // player's claimed move time (loosely enforced)
    )
    ```
    *(Source: ckb-chess README.md, "State Commitment" section)*

*   **Contract Execution Triggers:**
    The `chess-contract` only runs when:
    *   "Opening a game (lock funds, record both pubkeys and time control)"
    *   "Closing a game (validate full move history, release funds to winner)"
    *   "Claiming timeout (verify N blocks have passed since last move)"
    *(Source: ckb-chess README.md, "Contract Architecture" section)*

*   **Move Encoding:**
    "Standard UCI notation fits in 5 bytes: `e2e4` (from-square, to-square) + 1 byte for promotion piece."
    *(Source: ckb-chess README.md, "Move Encoding" section)*