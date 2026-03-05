# Research: fiberquest-custom-protocol

**Date:** 2026-03-05  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/README.md, https://gafferongames.com/post/what_every_programmer_needs_to_know_about_game_networking/, https://raw.githubusercontent.com/pond3r/ggpo/master/README.md, https://docs.libretro.com/guides/netplay/, https://gafferongames.com/post/introduction_to_networked_physics/

---

## Research Note: fiberquest-custom-protocol

**Date:** 2026-03-05

### Summary
This research explores the feasibility of integrating Fiber payment channels with retro console emulators for real-time, payment-driven gameplay. Existing game networking protocols like GGPO rollback netcode offer robust solutions for real-time state synchronization, mitigating latency and packet loss. While a direct integration with RetroArch Netplay is unclear due to missing documentation, a sidecar architecture or standalone payment bus leveraging Fiber's RPC methods for channel management and payments appears viable. A custom "FiberQuest Protocol" would need to define session handshakes, event formats, payment acknowledgements, and robust dispute resolution mechanisms, distinguishing between game state and financial channel state.

### 1. What existing protocols handle real-time game state sync between emulators — GGPO rollback netcode, delay-based, what are the tradeoffs?

The provided content describes several game networking models, including delay-based (peer-to-peer lockstep) and rollback netcode (GGPO).

*   **Peer-to-Peer Lockstep (Delay-based):**
    *   **Mechanism:** Each computer exchanges information in a fully connected mesh. The game is abstracted into turns, and command messages (e.g., "move unit," "attack unit") are processed at the beginning of each turn. All players run the same commands from a common initial state. To ensure identical play, the system waits for all players' commands for a turn before simulating it. This model is seen in RTS games like "Command and Conquer," "Age of Empires," and "Starcraft" where game state is too large to exchange.
    *   **Tradeoffs:**
        *   **Pros:** Simple concept, bandwidth efficient for large game states (only commands are sent).
        *   **Cons:**
            *   **Determinism Difficulty:** Extremely difficult to ensure identical execution across machines; tiny differences can lead to complete desynchronization ("butterfly effect").
            *   **Latency:** Each player experiences latency equal to the most lagged player, as the game must wait for all inputs before simulating a turn.
            *   **Late Join:** Difficult to support late joining due to the challenge of capturing and transmitting a completely deterministic starting point mid-game.
    *   **Example:** Doom initially used a peer-to-peer lockstep model, which "played terribly over the internet for typical users" due to high latency.

*   **Client/Server (with latency mitigation):**
    *   **Mechanism:** Players (clients) communicate with a central server, which holds the authoritative game state. Clients send inputs to the server, and the server updates the state and replies with packets containing relevant game state. Clients interpolate between updates for smooth movement.
    *   **Tradeoffs:**
        *   **Pros:** Improved experience compared to pure lockstep over high-latency networks, as quality depends on client-server connection, not the most lagged peer. Easier to support players joining/leaving.
        *   **Cons:** Still susceptible to latency, as clients experience delay between sending input and seeing the server's response. John Carmack noted issues with 300+ ms latencies for modem users in Quake.

*   **Rollback Networking (GGPO):**
    *   **Mechanism:** GGPO (Good Game Peace Out) uses "input prediction and speculative execution to send player inputs to the game immediately, providing the illusion of a zero-latency network." When a player's input is received, the game state is rolled back to the point where that input should have been processed, the input is applied, and the game is re-simulated forward.
    *   **Tradeoffs:**
        *   **Pros:** Provides a "sluggish, laggy game-feel" by allowing immediate input processing. Aims for "zero-latency network" illusion, preserving "timings, reactions, visual and audio queues, and muscle memory" from offline play.
        *   **Cons:** Requires the game to be deterministic to ensure that re-simulating from a past state produces the same outcome. Can lead to visual "hiccups" or "snaps" if frequent rollbacks occur due to high packet loss or significant desynchronization.
    *   **Example:** The GGPO SDK is designed to incorporate this into games, with a sample application called "Vector War."

### 2. Could FiberQuest implement a lightweight custom sync protocol ON TOP of RetroArch Netplay — i.e. a sidecar that augments the existing netplay connection with payment events?

The provided content **does not contain information about RetroArch Netplay** as the link `https://docs.libretro.com/guides/netplay/` resulted in an HTTP 404 error.

Therefore, it is not possible to determine from the given sources whether a lightweight custom sync protocol could be implemented *on top of* RetroArch Netplay or if a sidecar could augment its existing netplay connection with payment events.

However, conceptually, a sidecar model is a common pattern for extending functionality. If RetroArch Netplay exposes hooks or an API for external processes to monitor game state or inject events, a sidecar could potentially:
1.  Monitor the game state (e.g., score, game over conditions) from the emulator.
2.  Trigger Fiber payment events using the Fiber Network Node (FNN) RPC methods. Relevant Fiber RPC methods would include:
    *   `channel.open_channel`: To establish a payment channel between players.
    *   `channel.update_channel`: To update the channel state (e.g., for micro-payments).
    *   `payment.send_payment`: To send payments.
    *   `invoice.new_invoice`, `invoice.settle_invoice`: For invoice-based payments.

The sidecar would need to run alongside the emulator and communicate with both the emulator (if possible) and the local Fiber Network Node.

### 3. Alternatively: could we build a standalone game-agnostic payment event bus — two machines run RetroArch independently, our sidecar syncs game state hashes and payment triggers via a separate WebSocket channel?

Yes, building a standalone game-agnostic payment event bus is conceptually feasible based on the provided Fiber RPC capabilities, though the specifics of "game state hashes" for emulators are not detailed in the content.

In this alternative model:
*   **Independent Emulators:** Each player runs RetroArch (or any emulator) independently, potentially using its own local netplay or even just local play.
*   **Sidecar Application:** A separate "sidecar" application runs on each machine. This sidecar would:
    *   **Monitor Game State:** It would need a mechanism to read or receive game state information from the local emulator (e.g., memory scraping, emulator API hooks, or a custom emulator build that outputs state). The content does not provide details on how to obtain "game state hashes" from RetroArch or other emulators.
    *   **Sync Game State Hashes:** The sidecars would communicate with each other via a separate channel (e.g., WebSocket) to exchange game state hashes. This would allow them to verify if their independent game states are synchronized.
    *   **Payment Triggers:** Based on game events (e.g., player scores, round ends, game over), the sidecar would trigger payment events using the Fiber Network Node RPC.
        *   `channel.open_channel`, `channel.accept_channel`: To establish payment channels.
        *   `channel.update_channel`: To update channel balances for micro-payments.
        *   `payment.send_payment`: To send payments.
        *   `invoice.new_invoice`, `invoice.settle_invoice`: For invoice-based payment flows.
        *   `cch.send_btc`, `cch.receive_btc`: If cross-chain BTC payments are desired.
*   **Game Agnostic:** The payment logic would be decoupled from the emulator's internal workings, making it potentially reusable across different emulators or games, provided a consistent way to extract game state and trigger events can be established.

The Fiber RPC provides the necessary primitives for managing payment channels and sending payments, making the payment aspect of this model well-supported by the `fiber-lib/src/rpc/README.md` content.

### 4. Console-level integration: is there any way to run a Fiber-aware sidecar ON the console hardware itself (e.g., Raspberry Pi running RetroArch, Pi also runs Fiber node, all local)?

The provided content **does not explicitly state** the hardware requirements or compatibility of the Fiber Network Node (FNN) with embedded systems like a Raspberry Pi.

The `fiber-lib/src/rpc/README.md` describes the FNN RPC module as "providing a set of APIs for developers to interact with FNN." It mentions that "allowing arbitrary machines to access the JSON-RPC port... is **dangerous and strongly discouraged**" and advises strictly limiting access to trusted machines, implying the FNN is a network service.

For a Fiber-aware sidecar to run on console hardware like a Raspberry Pi alongside RetroArch, two conditions would need to be met:
1.  **Fiber Network Node Compatibility:** The Fiber Network Node software itself must be compilable and runnable on the Raspberry Pi's architecture (typically ARM) and operating system (e.g., Linux). The documentation does not specify supported architectures or minimum system requirements.
2.  **Resource Footprint:** The FNN and the sidecar application must have a sufficiently small resource footprint (CPU, RAM, storage) to run concurrently with RetroArch on the limited hardware of a Raspberry Pi without significantly impacting emulator performance. This information is not available in the provided content.

If the FNN can run on a Raspberry Pi, then a local sidecar application could certainly interact with it via its RPC interface, as the RPC is designed for local or trusted machine access.

### 5. What would a "FiberQuest Protocol" look like — a lightweight spec for: session handshake, event message format, payment acknowledgement, dispute resolution if one client disagrees on game state?

Based on the provided content, a "FiberQuest Protocol" could be outlined as follows, integrating game state synchronization concepts with Fiber's payment capabilities:

*   **Session Handshake:**
    *   **Purpose:** Establish a secure connection, exchange player identities, agree on game parameters, and initiate payment channels.
    *   **Steps:**
        1.  **Peer Connection:** Players use a game-specific discovery mechanism or direct IP to connect.
        2.  **Fiber Peer Connection:** Each player's sidecar uses `peer.connect_peer` to establish a connection with the other player's Fiber Network Node (if not already connected).
        3.  **Channel Opening:** Players propose and accept a payment channel using `channel.open_channel` and `channel.accept_channel`, specifying initial funding and terms.
        4.  **Game Parameters Exchange:** Players exchange game-specific parameters (e.g., chosen game, emulator core, ROM hash, initial game state hash if using deterministic lockstep).
        5.  **Session ID & Nonce:** A unique session ID is generated, and nonces are exchanged to prevent replay attacks.
        6.  **Readiness Confirmation:** Both players confirm readiness to start the game and payment session.

*   **Event Message Format:**
    *   **Purpose:** Standardize communication for game state updates, player inputs, and payment triggers.
    *   **Structure (Conceptual):** A JSON-based format could be used, similar to how Fiber's RPC uses JSON-RPC.
        ```json
        {
          "session_id": "uuid-v4-session-id",
          "message_type": "game_input" | "game_state_hash" | "payment_request" | "payment_ack" | "dispute_claim",
          "timestamp": 1678000000,
          "payload": {
            // Content varies by message_type
          },
          "signature": "..." // Optional: for integrity and non-repudiation
        }
        ```
    *   **Payload Examples:**
        *   `game_input`: `{ "frame": 12345, "player_id": "P1", "inputs": ["A", "LEFT"] }` (for rollback/lockstep)
        *   `game_state_hash`: `{ "frame": 12345, "hash": "sha256-of-game-state" }` (for independent sync)
        *   `payment_request`: `{ "reason": "scored_point", "amount_sats": 100, "invoice": "lnbc..." }`
        *   `payment_ack`: `{ "payment_hash": "...", "status": "settled" }`
        *   `dispute_claim`: `{ "type": "game_state_mismatch", "frame": 12340, "local_hash": "...", "remote_hash": "..." }`

*   **Payment Acknowledgement:**
    *   **Mechanism:** Leverage Fiber's existing payment flow.
    *   **Steps:**
        1.  **Invoice Generation:** The payee's sidecar generates an invoice using `invoice.new_invoice`.
        2.  **Invoice Transmission:** The invoice string (`incoming_invoice` from `cch.send_btc` or `new_invoice` from `invoice.new_invoice`) is sent to the payer via the custom protocol's event bus.
        3.  **Payment Initiation:** The payer's sidecar uses `payment.send_payment` or `payment.send_payment_with_router` with the received invoice.
        4.  **Payment Status Monitoring:** Both sidecars can monitor the payment status using `payment.get_payment` or `invoice.get_invoice`.
        5.  **Protocol-Level ACK:** Once Fiber confirms the payment (e.g., `PaymentStatus` is `Settled`), the payer's sidecar sends a protocol-level `payment_ack` message to the payee.

*   **Dispute Resolution (Game State):**
    *   **Challenge:** The provided Fiber documentation focuses on *financial* channel state, not *game* state.
    *   **Proposed Mechanism (External to Fiber):**
        1.  **Hash Mismatch Detection:** If sidecars are exchanging game state hashes (e.g., every N frames), a mismatch triggers a dispute.
        2.  **Evidence Collection:** Both clients would need to record game inputs and potentially full game states for a certain window around the dispute point.
        3.  **Replay & Verification:** A trusted third party (or a mutually agreed-upon deterministic replay mechanism) would be needed to replay the game from a common agreed-upon state using the recorded inputs to determine the correct state. This is not supported by Fiber directly.
        4.  **Escalation:** If game state cannot be resolved, the game session might be terminated, and any pending payments could be halted or reversed (if possible within Fiber's channel mechanics, e.g., by abandoning the channel or not settling invoices).
        5.  **Fiber's Role (Limited):** Fiber's `channel.abandon_channel` or `channel.shutdown_channel` could be used to close the payment channel if a game state dispute cannot be resolved, but Fiber itself would not resolve the *game state* disagreement.

### 6. Robustness: what happens if the network drops mid-game? Can we use Fiber's existing channel state as a source of truth for dispute resolution? Design the protocol as if it could become an open standard other game developers adopt.

*   **Network Drops Mid-Game (Robustness):**
    *   **Game State Synchronization:**
        *   **Rollback Netcode (GGPO):** Designed to handle transient network drops and latency. If packets are lost, the game will rollback to a previous state and re-simulate when new inputs arrive, providing a smooth experience for short drops. For prolonged drops, it would eventually lead to a disconnect.
        *   **Lockstep/State Sync:** Prolonged network drops would lead to desynchronization and eventually a game halt or disconnect, as inputs or state updates cannot be exchanged.
    *   **Payment Channel State:**
        *   Fiber channels are designed for robustness against network issues. The channel state is maintained by the Fiber Network Node. If the network drops mid-game, the *payment channel itself* does not immediately lose its state.
        *   **Unconfirmed Payments:** Any `payment.send_payment` or `channel.update_channel` operations that were in flight might be delayed or fail. The `payment.get_payment` or `invoice.get_invoice` methods can be used to query the status of payments after reconnection.
        *   **Channel Integrity:** The `watchtower` module (`create_watch_channel`, `update_revocation`, etc.) is designed to protect channel funds even if a peer goes offline or tries to broadcast an old channel state.
        *   **Reconnection:** Upon network restoration, the sidecars would attempt to re-establish the game session and query the Fiber Network Node for the latest channel state using `channel.list_channels` or `payment.get_payment` to reconcile any pending payments.

*   **Fiber's Channel State as Source of Truth for Dispute Resolution:**
    *   **No, Fiber's existing channel state cannot be used as a source of truth for *game state* dispute resolution.**
    *   **Fiber's Purpose:** Fiber's RPC methods and channel state (`ChannelState` type, `update_channel`, `submit_commitment_transaction`, `watchtower`) are designed to manage the *financial state* of a payment channel (e.g., how much CKB or BTC each party holds within the channel). It ensures that financial transactions are correctly recorded and settled, and provides mechanisms for financial disputes (e.g., if a party tries to cheat by broadcasting an old channel state).
    *   **Game State vs. Financial State:** Fiber has no inherent understanding of game logic, player actions, scores, or the internal state of an emulator. It cannot determine if a player legitimately scored a point or if a game state hash is correct.
    *   **Dispute Resolution for Payments:** Fiber *can* be the source of truth for *payment-related disputes*. For example, if one client claims they sent a payment and the other denies receiving it, Fiber's `get_payment` or `get_cch_order` methods, along with the channel's commitment transactions, would be the authoritative source for whether the payment was initiated and settled within the channel.

*   **Design for an Open Standard ("FiberQuest Protocol"):**
    To design this as an open standard, the protocol should:
    1.  **Be Modular:** Separate game state synchronization from payment logic. This allows developers to choose their preferred game netcode (GGPO, lockstep, etc.) and integrate Fiber payments as a distinct layer.
    2.  **Use Standard Formats:** Employ widely adopted data formats like JSON for messages and standard cryptographic primitives (e.g., SHA-256 for hashes, ECDSA for signatures).
    3.  **Define Clear Roles:** Explicitly define the roles of the emulator, the Fiber Network Node, and the FiberQuest sidecar.
    4.  **Specify API Interactions:** Clearly document which Fiber RPC methods are used for each payment-related action (e.g., `channel.open_channel` for setup, `payment.send_payment` for micro-transactions, `watchtower` for security).
    5.  **Handle Edge Cases:** Detail how disconnections, reconnections, and various types of disputes (game state vs. payment state) are handled, including timeouts and fallback mechanisms.
    6.  **Extensibility:** Allow for future extensions, such as new game events, different payment currencies (beyond CKB/BTC via CCH), or alternative dispute resolution mechanisms.
    7.  **Deterministic Game State:** Emphasize the requirement for deterministic game emulation if game state hashes are to be used for dispute resolution, as highlighted by the "What Every Programmer Needs To Know About Game Networking" article.

### Gaps / Follow-up
1.  **RetroArch Netplay API/Hooks:** The primary gap is the lack of information on RetroArch Netplay's internal workings, APIs, or hooks. Without this, it's impossible to assess the feasibility of a sidecar integrating *directly* with it. Further research into RetroArch's documentation or source code would be required.
2.  **Emulator Game State Hashing:** The content does not specify how to reliably generate deterministic game state hashes from retro emulators. This is crucial for any game-state-based dispute resolution or synchronization. Research into emulator APIs for state serialization/hashing would be needed.
3.  **Fiber Network Node Hardware Requirements:** Specifics on the minimum hardware requirements and supported architectures for running a Fiber Network Node (FNN) are missing. This is critical for assessing console-level integration on devices like Raspberry Pi.
4.  **Game State Dispute Resolution Mechanism:** While Fiber handles financial disputes, a robust, trustless, and efficient mechanism for resolving *game state* disagreements is not detailed. This would likely require a separate, game-specific protocol layer, potentially involving deterministic replays or a trusted oracle, which is outside the scope of Fiber.
5.  **Performance Overhead:** The performance impact of running a Fiber Network Node and a sidecar alongside an emulator on resource-constrained hardware (like a Raspberry Pi) is not addressed.

### Relevant Code/API Snippets

**Fiber Network Node RPC (from `fiber-lib/src/rpc/README.md`):**

*   **Channel Management:**
    *   `channel.open_channel(peer_id, funding_amount, ...)`: Initiates opening a payment channel.
    *   `channel.accept_channel(channel_id, ...)`: Accepts a proposed channel.
    *   `channel.update_channel(channel_id, amount, ...)`: Updates the channel state, used for sending payments within the channel.
    *   `channel.list_channels()`: Retrieves information about active channels, including their `ChannelState`.
    *   `channel.abandon_channel(channel_id)`: Abandons a channel.
    *   `channel.shutdown_channel(channel_id)`: Gracefully closes a channel.

*   **Payment Initiation & Status:**
    *   `invoice.new_invoice(amount_sats, description, ...)`: Creates a new invoice for receiving payments.
    *   `payment.send_payment(invoice_string)`: Sends a payment using an invoice.
    *   `payment.get_payment(payment_hash)`: Retrieves the status of a sent payment.
    *   `invoice.get_invoice(payment_hash)`: Retrieves the status of an invoice.
    *   `invoice.settle_invoice(payment_hash)`: Settles an invoice.

*   **Cross-Chain Hub (CCH) for BTC:**
    *   `cch.send_btc(btc_pay_req, currency)`: Creates an order to send BTC Lightning payments via Fiber.
    *   `cch.receive_btc(fiber_pay_req)`: Creates an order to receive BTC Lightning payments via Fiber.
    *   `cch.get_cch_order(payment_hash)`: Retrieves the status of a CCH order.

*   **Peer Management:**
    *   `peer.connect_peer(peer_id, address)`: Connects to a remote Fiber peer.
    *   `peer.list_peers()`: Lists connected peers.

*   **Watchtower (for Channel Security):**
    *   `watchtower.create_watch_channel(channel_id, ...)`: Registers a channel with the watchtower.
    *   `watchtower.update_revocation(channel_id, revocation_data)`: Updates revocation data for watchtower.

*   **Relevant Types:**
    *   `ChannelState`: Represents the current state of a payment channel.
    *   `PaymentStatus`: Indicates the status of a payment (e.g., `Pending`, `Settled`, `Failed`).
    *   `CchOrderStatus`: Indicates the status of a cross-chain order.
    *   `Hash256`: Used for payment hashes.