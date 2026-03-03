# Research: ckb-chess-fiber-rpcs-revisit

**Date:** 2026-03-03  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/payment.rs, https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/invoice.rs, https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/channel.rs, https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/README.md, https://raw.githubusercontent.com/nervosnetwork/fiber/main/docs/payment-lifecycle.md, https://raw.githubusercontent.com/toastmanAu/ckb-chess/main/README.md

---

## Research Note: ckb-chess-fiber-rpcs-revisit

**Date:** 2026-03-03

### Summary
The ckb-chess project leverages Nervos Fiber payment channels for on-chain chess games, treating each move as a micro-payment with the game state hash embedded within the message. This approach uses Fiber for state transport, escrow, and settlement, eliminating the need for a separate P2P layer. The Fiber RPCs provide the necessary interface for channel management (opening, closing), payment execution, and invoice handling, which are fundamental to the ckb-chess game lifecycle. Custom records within Fiber payment messages are identified as the mechanism for embedding game state hashes.

### 1. Exact RPCs needed for relayer: open_channel, send_payment, new_invoice, get_invoice, list_channels?

Yes, all the listed RPCs are available and relevant for the ckb-chess relayer, along with their respective parameters.

*   **`open_channel`**:
    *   **Purpose**: Initiates the opening of a payment channel between two peers, locking CKB or UDT funds. This is used at the start of a ckb-chess game to establish the escrow.
    *   **Source**: `https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/channel.rs`
    *   **Method Signature**: `#[method(name = "open_channel")] async fn open_channel(&self, params: OpenChannelParams) -> Result<OpenChannelResult>;`
    *   **Key Parameters**: `peer_id`, `funding_amount`.

*   **`send_payment`**:
    *   **Purpose**: Sends a payment through a Fiber channel. In ckb-chess, each move is represented as a micro-payment, with game state embedded.
    *   **Source**: `https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/payment.rs` (listed in `rpc/README.md` under Module Payment)
    *   **Method Signature**: `#[method(name = "send_payment")] async fn send_payment(&self, params: SendPaymentCommandParams) -> Result<GetPaymentCommandResult>;` (inferred from `README.md` and `SendPaymentCommandParams` struct)
    *   **Key Parameters**: `target_pubkey`, `amount`, `invoice`, `custom_records`.

*   **`new_invoice`**:
    *   **Purpose**: Generates a new invoice for receiving payments. In ckb-chess, the player expecting a "move-payment" would generate an invoice.
    *   **Source**: `https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/invoice.rs`
    *   **Method Signature**: `#[method(name = "new_invoice")] async fn new_invoice(&self, params: NewInvoiceParams) -> Result<InvoiceResult>;`
    *   **Key Parameters**: `amount`, `description`, `currency`, `payment_hash`.

*   **`get_invoice`**:
    *   **Purpose**: Retrieves the details and status of an existing invoice using its payment hash.
    *   **Source**: `https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/invoice.rs`
    *   **Method Signature**: `#[method(name = "get_invoice")] async fn get_invoice(&self, payment_hash: InvoiceParams) -> Result<GetInvoiceResult>;`
    *   **Key Parameters**: `payment_hash`.

*   **`list_channels`**:
    *   **Purpose**: Lists all active or closed channels for a given peer or all peers. Useful for monitoring game channels.
    *   **Source**: `https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/channel.rs`
    *   **Method Signature**: `#[method(name = "list_channels")] async fn list_channels(&self, params: ListChannelsParams) -> Result<ListChannelsResult>;`
    *   **Key Parameters**: `peer_id`, `include_closed`.

### 2. How to embed game state hash in Fiber payment messages?

The game state hash can be embedded in Fiber payment messages using the `custom_records` field within the `SendPaymentCommandParams` struct.

The `ckb-chess/README.md` explicitly states: "Each move shifts 1 microCKB from loser-in-progress to winner-in-progress, with the game state hash embedded in the message."

The `SendPaymentCommandParams` struct, defined in `crates/fiber-lib/src/rpc/payment.rs`, includes:
```rust
pub struct SendPaymentCommandParams {
    // ... other fields ...
    /// Some custom records for the payment which contains a map of u32 to Vec<u8>
    /// The key is the record type, and the value is the serialized data
    pub custom_records: Option<PaymentCustomRecords>,
    // ... other fields ...
}
```
The `PaymentCustomRecords` struct is defined as:
```rust
pub struct PaymentCustomRecords {
    #[serde(flatten)]
    #[serde_as(as = "HashMap<U32Hex, SliceHex>")]
    pub data: HashMap<u32, Vec<u8>>,
}
```
The `move_hash` (which is `Blake2b(prev_state_hash || move_notation || move_number || player_pubkey || timestamp_claim)`) can be serialized into a `Vec<u8>` and then included as a value in the `data` HashMap of `PaymentCustomRecords`. A specific `u32` key (e.g., `0x1`) can be designated for the ckb-chess game state hash.

### 3. Full RPC call sequence for a complete ckb-chess game lifecycle?

Based on the `ckb-chess/README.md` lifecycle and Fiber RPCs, a complete ckb-chess game lifecycle would involve the following sequence:

**I. Game Setup (Channel Opening)**
1.  **Peer Connection**: Both players (A and B) establish a connection.
    *   **RPC**: `peer_connect_peer`
    *   **Source**: `https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/README.md`
2.  **Channel Initiation**: One player (e.g., Player A) initiates the channel opening.
    *   **RPC**: `channel_open_channel`
    *   **Parameters**: `OpenChannelParams` including `peer_id` of Player B, `funding_amount` (initial escrow), and other channel configurations.
    *   **Source**: `https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/channel.rs`
3.  **Channel Acceptance**: The other player (Player B) accepts the channel.
    *   **RPC**: `channel_accept_channel`
    *   **Parameters**: `AcceptChannelParams` including `temporary_channel_id` from Player A's `OpenChannelResult`, `funding_amount`, etc.
    *   **Source**: `https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/channel.rs`
    *   *Result*: A funded Fiber channel is established, serving as the escrow for the game.

**II. Game Play (Moves)**
For each move in the game (e.g., Player A makes a move, then Player B makes a move):
1.  **Move Hash Calculation**: The player whose turn it is calculates the `move_hash` as `Blake2b(prev_state_hash || move_notation || move_number || player_pubkey || timestamp_claim)`.
    *   **Source**: `https://raw.githubusercontent.com/toastmanAu/ckb-chess/main/README.md`
2.  **Invoice Generation**: The player who is about to receive the "move-payment" (i.e., the player who just made a valid move or the one whose turn it is to be paid) generates an invoice for a micro-CKB amount (e.g., 1 microCKB).
    *   **RPC**: `invoice_new_invoice`
    *   **Parameters**: `NewInvoiceParams` including `amount` (1 microCKB), `description` (can include game ID, move number), and optionally `payment_hash` or `payment_preimage`.
    *   **Source**: `https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/invoice.rs`
3.  **Payment with Embedded State**: The player whose turn it was (the "loser-in-progress") sends the micro-payment to the recipient, embedding the calculated `move_hash` in the `custom_records`.
    *   **RPC**: `payment_send_payment`
    *   **Parameters**: `SendPaymentCommandParams` including `target_pubkey` (of the recipient), `amount` (1 microCKB), `invoice` (the generated invoice string), and `custom_records` containing the `move_hash`.
    *   **Source**: `https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/payment.rs`
4.  **Invoice Retrieval (Optional)**: The recipient can retrieve the invoice details to confirm the payment.
    *   **RPC**: `invoice_get_invoice`
    *   **Parameters**: `InvoiceParams` with the `payment_hash` from the invoice.
    *   **Source**: `https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/invoice.rs`

**III. Game End (Channel Closing)**
1.  **Game Conclusion**: Once the game reaches a final state (e.g., checkmate, stalemate, resignation), the winner is determined.
2.  **Channel Shutdown**: The channel is closed, reflecting the final balance distribution based on the game's outcome. The ckb-chess contract on CKB will validate the full move history (implicitly committed via the `move_hash` in each payment) and release funds to the winner.
    *   **RPC**: `channel_shutdown_channel`
    *   **Parameters**: `ShutdownChannelParams` (not fully shown in snippets, but listed in `rpc/README.md`) including the `channel_id`.
    *   **Source**: `https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/README.md`

**IV. Dispute / Timeout (Off-chain claim, on-chain validation)**
1.  **Timeout Claim**: If a player stops responding, the other player can claim a timeout.
    *   **Fiber RPCs**: While Fiber can facilitate monitoring (`channel_list_channels`) or potentially submitting transactions, the core logic for *claiming* the timeout and validating it against the game's timelock is handled by the ckb-chess contract on the CKB chain, not directly by a specific Fiber RPC for dispute resolution. The `ckb-chess/README.md` states this involves submitting the claim on-chain.

### Gaps / Follow-up

1.  **Full `channel_shutdown_channel` parameters**: The provided content lists `channel_shutdown_channel` in `rpc/README.md` but does not include its parameter struct in `rpc/channel.rs`. Understanding its parameters would clarify how the final settlement is initiated.
2.  **Specific `u32` key for `custom_records`**: While `custom_records` is identified for embedding the game state hash, the specific `u32` key to be used (e.g., `0x1`, `0x2`) would need to be defined as part of the ckb-chess protocol specification.
3.  **Error Handling and Retries**: The provided content describes the happy path. A full relayer implementation would need to detail error handling, payment retries, and channel recovery mechanisms, which are not explicitly covered by the RPC definitions themselves.
4.  **On-chain Contract Interaction**: The `ckb-chess` contract's interaction with the CKB chain (e.g., submitting the final signed state, claiming timeout) is mentioned as external to Fiber RPCs. Further research into the CKB SDK would be needed to understand how the relayer would interact with the contract for these final on-chain steps.

### Relevant Code/API Snippets

**Embedding Game State Hash (`payment_send_payment`):**
From `https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/payment.rs`:
```rust
#[serde_as]
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SendPaymentCommandParams {
    // ... other fields ...
    /// Some custom records for the payment which contains a map of u32 to Vec<u8>
    /// The key is the record type, and the value is the serialized data
    pub custom_records: Option<PaymentCustomRecords>,
    // ... other fields ...
}

#[serde_as]
#[derive(Clone, Debug, Eq, PartialEq, Serialize, Deserialize, Default)]
pub struct PaymentCustomRecords {
    /// The custom records to be included in the payment.
    #[serde(flatten)]
    #[serde_as(as = "HashMap<U32Hex, SliceHex>")]
    pub data: HashMap<u32, Vec<u8>>,
}
```

**`open_channel` RPC:**
From `https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/channel.rs`:
```rust
#[cfg(not(target_arch = "wasm32"))]
#[rpc(server)]
trait ChannelRpc {
    /// Attempts to open a channel with a peer.
    #[method(name = "open_channel")]
    async fn open_channel(
        &self,
        params: OpenChannelParams,
    ) -> Result<OpenChannelResult>;
    // ... other channel methods ...
}
```

**`new_invoice` RPC:**
From `https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/invoice.rs`:
```rust
#[cfg(not(target_arch = "wasm32"))]
#[rpc(server)]
trait InvoiceRpc {
    /// Generates a new invoice.
    #[method(name = "new_invoice")]
    async fn new_invoice(
        &self,
        params: NewInvoiceParams,
    ) -> Result<InvoiceResult>;
    // ... other invoice methods ...
}
```