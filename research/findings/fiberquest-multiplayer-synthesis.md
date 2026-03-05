# Research: fiberquest-multiplayer-synthesis

**Date:** 2026-03-05  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** 

---

## Research Note: fiberquest-multiplayer-synthesis

**Date:** 2026-03-05

### Summary
This synthesis report analyzes the feasibility and approach for integrating online multiplayer and Fiber payments into FiberQuest. It recommends a hybrid multiplayer strategy, leveraging a custom FiberQuest Game State Protocol (FGSP) for turn-based games like Texas Hold'em, and a Netplay wrapper for complex real-time games like SF2. While per-hit payments in SF2 are deemed impractical due to latency, meta-payments (e.g., buy-ins, round fees) are highly feasible. A Texas Hold'em demo with real-time multiplayer and Fiber buy-ins/pot contributions is identified as the most impressive and achievable hackathon goal.

### (1) Best poker/card game recommendations with full integration details

The best poker/card game recommendation is **Texas Hold'em**.

**Integration Details:**
*   **Game Logic Engine:** Utilize `PokerEngine.js` or `TexasHoldem.js` for managing game state, player actions, and rules.
    *   **Key API calls:** `game.deal()`, `game.bet(player, amount)`, `game.fold(player)`, `game.call(player)`, `game.raise(player, amount)`.
*   **User Interface (UI):** `CardTable.js` can be used for rendering the game state visually to players.
*   **Multiplayer Integration:**
    *   A server-side instance of the chosen poker engine (`PokerEngine.js` or `TexasHoldem.js`) would maintain the authoritative game state.
    *   Client applications would send player actions (e.g., `bet`, `fold`) to the server using the custom FiberQuest Protocol (FGSP).
    *   The server would broadcast game state updates to all connected clients.
*   **Fiber Payment Integration:**
    *   Payments should be integrated for discrete events such as **buy-ins**, **pot contributions**, or **per-round fees**.
    *   The server would initiate payment requests using the `FGSP_PAYMENT_REQUEST` message, and clients would confirm successful payments with `FGSP_PAYMENT_CONFIRM`.

### (2) Recommended online multiplayer approach for FiberQuest — Netplay hook vs custom protocol vs hybrid

For FiberQuest, a **hybrid approach** is recommended as the most pragmatic for a hackathon.

*   **Custom Protocol (FiberQuest Game State Protocol - FGSP):**
    *   **Recommended for:** Simpler, turn-based games (e.g., poker, chess).
    *   **Advantages:** Offers full control over game state synchronization and direct integration of Fiber payments into core game mechanics.
    *   **Implementation:** Involves building a WebSocket-based server to manage game state and player interactions.
*   **Netplay Hook (e.g., GGPO/RetroArch):**
    *   **Recommended for:** Complex, real-time, input-heavy games (e.g., fighting games like SF2).
    *   **Advantages:** Leverages existing, robust rollback netcode solutions, significantly reducing development effort for core multiplayer.
    *   **Integration with Fiber Payments:** Fiber payments would be integrated as an *overlay* or *wrapper* for meta-actions (e.g., game start fees, continue payments, per-round fees) rather than direct game actions.

This hybrid strategy balances the need for deep payment integration in simpler games with the complexity of real-time netcode for demanding titles.

### (3) The FiberQuest Protocol v0.1 spec — a concrete lightweight spec we could implement in week 2 of the hackathon

**FiberQuest Game State Protocol (FGSP) v0.1 Spec**

*   **Name:** FiberQuest Game State Protocol (FGSP) v0.1
*   **Transport Layer:** WebSocket (for real-time, bidirectional communication)
*   **Serialization Format:** JSON (for lightweight, human-readable messages)
*   **Communication Model:** Server-authoritative (server maintains the definitive game state)

**Core Message Types:**

1.  **`FGSP_CONNECT`** (Client -> Server)
    *   **Purpose:** Initiates a connection and authenticates the player.
    *   **Payload:** `{ "type": "FGSP_CONNECT", "playerId": "...", "authToken": "..." }`
2.  **`FGSP_WELCOME`** (Server -> Client)
    *   **Purpose:** Confirms successful connection and provides initial game state.
    *   **Payload:** `{ "type": "FGSP_WELCOME", "sessionId": "...", "initialState": { ... } }`
3.  **`FGSP_GAME_STATE_UPDATE`** (Server -> Client)
    *   **Purpose:** Broadcasts updates to the game state (full or delta).
    *   **Payload:** `{ "type": "FGSP_GAME_STATE_UPDATE", "state": { ... }, "delta": { ... } }`
4.  **`FGSP_PLAYER_ACTION`** (Client -> Server)
    *   **Purpose:** Sends a player's action/input to the server.
    *   **Payload:** `{ "type": "FGSP_PLAYER_ACTION", "action": "...", "data": { ... } }` (e.g., `{"action": "bet", "amount": 100}`)
5.  **`FGSP_PAYMENT_REQUEST`** (Server -> Client)
    *   **Purpose:** Server requests a Fiber payment from the client.
    *   **Payload:** `{ "type": "FGSP_PAYMENT_REQUEST", "paymentId": "...", "amount": "...", "currency": "FIBER", "reason": "buy-in" }`
6.  **`FGSP_PAYMENT_CONFIRM`** (Client -> Server)
    *   **Purpose:** Client confirms a successful payment to the server.
    *   **Payload:** `{ "type": "FGSP_PAYMENT_CONFIRM", "paymentId": "...", "transactionId": "...", "status": "success" }`
7.  **`FGSP_ERROR`** (Server -> Client)
    *   **Purpose:** Notifies the client of an error.
    *   **Payload:** `{ "type": "FGSP_ERROR", "code": "...", "message": "..." }`

### (4) Updated game catalog additions from poker research

Based on the poker research, the primary game catalog addition is:

*   **Texas Hold'em**

The research also implies the potential for other card games, but Texas Hold'em is explicitly highlighted as a strong starting point.

### (5) Honest assessment: can two players across the internet reliably play SF2 with per-hit Fiber payments? What's the architecture that makes this work?

**Honest Assessment:** No, two players across the internet **cannot reliably play SF2 with per-hit Fiber payments**.

**Reasoning:**
*   **Latency:** Integrating Fiber payments *directly* into every game action (like a per-hit payment in SF2) is highly challenging due to the inherent latency of payment confirmation. Real-time fighting games like SF2 demand extremely low-latency input and state synchronization (often relying on rollback netcode) to feel responsive. A payment round-trip for every hit would introduce unacceptable delays and break the gameplay experience.
*   **Payment Confirmation:** Payment systems, especially blockchain-based ones like Fiber, involve network latency for transaction processing and confirmation, which is incompatible with the millisecond-level responsiveness required for per-hit actions in a fighting game.

**Architecture for *Feasible* Payments in SF2 (Not per-hit):**
For SF2, Fiber payments would need to be integrated as an **overlay for meta-actions**, not direct gameplay actions. The architecture would involve:

1.  **Core Gameplay Layer (Netplay):** The actual SF2 gameplay would be handled by a robust Netplay solution (e.g., GGPO or RetroArch's netcode). This layer focuses solely on synchronizing game state and player inputs with minimal latency, often using rollback netcode.
2.  **FiberQuest Wrapper/Meta-Layer:** A separate application layer would wrap the Netplay experience. This layer would:
    *   **Intercept Game Events:** Monitor for significant game events like "match start," "round end," or "continue screen."
    *   **Initiate Payments:** When a meta-action requiring payment occurs (e.g., starting a new match, buying a "continue"), this wrapper would use the FiberQuest Protocol (specifically `FGSP_PAYMENT_REQUEST`) to prompt the player for payment.
    *   **Process Confirmation:** Upon receiving `FGSP_PAYMENT_CONFIRM` from the client (indicating a successful Fiber transaction), the wrapper would then allow the corresponding game action to proceed (e.g., start the match, grant a continue).
    *   **Examples of Payments:** Game start fees, continue payments after a loss, or per-round fees.

This architecture decouples the payment flow from the critical, low-latency game loop, making Fiber payments feasible for higher-level game interactions.

### (6) What's the most impressive demo we can build in 2 weeks that showcases online multiplayer + Fiber payments?

The most impressive demo that can be built in 2 weeks, showcasing online multiplayer and Fiber payments, is a **fully functional Texas Hold'em game with real-time multiplayer and Fiber payments for buy-ins and pot contributions.**

**Why this is impressive and achievable:**
*   **Clear Value Proposition:** Directly demonstrates how Fiber payments can be integrated into a popular game for core mechanics (buy-ins, pot contributions).
*   **Achievable Complexity:** Texas Hold'em is a turn-based game, making it well-suited for implementation with a custom protocol (FGSP). This avoids the significant complexity of real-time rollback netcode required for fighting games.
*   **Leverages Existing Libraries:** Can utilize existing JavaScript poker engines (`PokerEngine.js`, `TexasHoldem.js`) and UI components (`CardTable.js`) to accelerate development.
*   **Showcases Core Features:** Effectively highlights both online multiplayer and the specific payment integration capabilities of FiberQuest.
*   **User Engagement:** A playable poker game is inherently engaging and provides a clear context for the payment system.

### Gaps / Follow-up

*   **Fiber Payment API Details:** The provided content does not specify the actual Fiber payment API or SDK that would be used by the client to fulfill `FGSP_PAYMENT_REQUEST` and send `FGSP_PAYMENT_CONFIRM`. This is a critical piece of information for implementation.
*   **Authentication Mechanism:** While `authToken` is mentioned in `FGSP_CONNECT`, the specifics of how this token is generated, validated, and managed (e.g., OAuth, JWT) are not detailed.
*   **Error Handling and Recovery:** The `FGSP_ERROR` message is defined, but a comprehensive strategy for handling various error scenarios (e.g., payment failure, network disconnects, invalid actions) and client/server recovery is not outlined.
*   **Scalability:** The current protocol design is lightweight but does not address scalability concerns for a large number of concurrent players or games.
*   **UI/UX for Payment Flows:** Details on how payment requests and confirmations would be presented to the user within the game client are not covered.

### Relevant Code/API Snippets

**From `fiberquest-poker-games.md` (Poker Engine Interaction):**

```javascript
// Example PokerEngine.js API calls
game.deal();
game.bet(player, amount);
game.fold(player);
game.call(player);
game.raise(player, amount);
```

**From `fiberquest-custom-protocol.md` (FiberQuest Game State Protocol - FGSP):**

```json
// FGSP_CONNECT message (Client -> Server)
{
  "type": "FGSP_CONNECT",
  "playerId": "user_alice_123",
  "authToken": "jwt_token_here"
}

// FGSP_GAME_STATE_UPDATE message (Server -> Client)
{
  "type": "FGSP_GAME_STATE_UPDATE",
  "state": {
    "round": "pre-flop",
    "pot": 500,
    "players": [
      {"id": "user_alice_123", "chips": 9500, "hand": ["Ah", "Ks"]},
      {"id": "user_bob_456", "chips": 10000, "hand": []}
    ]
  }
}

// FGSP_PLAYER_ACTION message (Client -> Server)
{
  "type": "FGSP_PLAYER_ACTION",
  "action": "bet",
  "data": {
    "amount": 100
  }
}

// FGSP_PAYMENT_REQUEST message (Server -> Client)
{
  "type": "FGSP_PAYMENT_REQUEST",
  "paymentId": "pay_req_001",
  "amount": "500",
  "currency": "FIBER",
  "reason": "buy-in"
}

// FGSP_PAYMENT_CONFIRM message (Client -> Server)
{
  "type": "FGSP_PAYMENT_CONFIRM",
  "paymentId": "pay_req_001",
  "transactionId": "fiber_tx_abc123",
  "status": "success"
}
```