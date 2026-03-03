# Research: fiber-trampoline-routing

**Date:** 2026-03-03  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/nervosnetwork/fiber/main/docs/specs/trampoline-routing.md, https://raw.githubusercontent.com/nervosnetwork/fiber/main/docs/payment-lifecycle.md, https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/README.md, https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/payment.rs, https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/invoice.rs, https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/channel.rs

---

## Research Note: Fiber v0.7.0 Trampoline Routing

**Date:** 2026-03-03

### Summary
Fiber v0.7.0 introduces trampoline routing, a mechanism that allows senders with limited routing information to delegate pathfinding to intermediate "trampoline" nodes. The sender constructs an outer onion to the first trampoline node and embeds an inner onion containing the remaining route. This significantly reduces the sender's burden of knowing the full path for multi-hop payments. RPC changes include the addition of `trampoline_hops` to `send_payment` and `allow_trampoline_routing` to `new_invoice`. One-way channels are also introduced, allowing channels to be opened for single-direction payments without network broadcast, though funding requirements appear unchanged.

### 1. What is trampoline routing and how does it differ from standard onion routing?

Trampoline routing is a payment forwarding mechanism where the sender only needs to know the route to the *first* trampoline node. The remaining path to the final recipient is encoded within an "inner trampoline onion" which is then forwarded hop-by-hop by subsequent trampoline nodes. The final recipient only processes the final payload and settles the payment.

This differs from standard onion routing in that, with standard onion routing, the sender typically constructs the *entire* path (the full onion) from sender to recipient. In trampoline routing, the sender delegates the pathfinding for the latter part of the route to intermediate trampoline nodes, reducing the amount of routing information the sender needs to possess.

**Source:**
*   `trampoline-routing.md`: "The sender only needs to reach the first trampoline node. - The rest of the route is encoded inside an inner trampoline onion and forwarded hop-by-hop by trampoline nodes. - The final recipient only sees the final payload and settles the payment."
*   `trampoline-routing.md`, "Detailed Specification - Overview": "Trampoline routing lets a sender with limited routing information delegate pathfinding to intermediate trampoline nodes. The sender builds a normal outer onion to the first trampoline and embeds an inner trampoline onion that encodes the remaining hops."

### 2. Does v0.7.0 require both endpoints to support trampoline, or just the routing nodes?

Trampoline routing primarily requires the *routing nodes* (specifically, the designated trampoline nodes) to support the trampoline protocol. The sender needs to be able to construct the outer onion and embed the inner trampoline onion, and the final recipient needs to be able to process the final payload.

The specification states:
*   "The sender only needs to reach the first trampoline node."
*   "The final recipient only sees the final payload and settles the payment."
*   During sender route construction, it's necessary to "ensure all hops support trampoline routing." This refers to the intermediate nodes specified in `trampoline_hops`.

This implies that while the sender initiates the trampoline payment and the recipient receives the final payment, it is the intermediate trampoline nodes that must implement the specific trampoline forwarding logic.

**Source:**
*   `trampoline-routing.md`, "What it does (high-level)"
*   `trampoline-routing.md`, "Detailed Specification - Sender: route construction", point 1

### 3. What RPC changes in v0.7.0 affect send_payment / new_invoice?

The following RPC changes affect `send_payment` and `new_invoice`:

*   **`send_payment` (Module `Payment`, Method `send_payment`)**:
    *   A new optional parameter `trampoline_hops: Option<Vec<Pubkey>>` has been added to `SendPaymentCommandParams`. This allows the sender to explicitly list trampoline nodes for routing.
    *   The `max_fee_amount` parameter is noted to be used as the total fee budget in trampoline routing mode.

*   **`new_invoice` (Module `Invoice`, Method `new_invoice`)**:
    *   A new optional parameter `allow_trampoline_routing: Option<bool>` has been added to `NewInvoiceParams`. This allows an invoice creator to specify whether payments to this invoice can use trampoline routing.

**Source:**
*   `trampoline-routing.md`, "How to use it (RPC)": "Use `trampoline_hops` in SendPayment RPC to provide explicit trampoline nodes."
*   `crates/fiber-lib/src/rpc/payment.rs` (lines 131-148, 172-174): Defines `trampoline_hops` and clarifies `max_fee_amount` usage in `SendPaymentCommandParams`.
*   `crates/fiber-lib/src/rpc/invoice.rs` (line 204): Defines `allow_trampoline_routing` in `NewInvoiceParams`.

### 4. One-way channels — what exactly changed, and does it affect channel funding requirements?

One-way channels are introduced as an option when opening a channel. The `OpenChannelParams` RPC method now includes an optional parameter `one_way: Option<bool>`, which defaults to `false`.

If `one_way` is set to `true`, the channel:
*   Will not be broadcasted to the network.
*   Can only be used to send payments in one direction (from the opener's side).

Regarding funding requirements, the `funding_amount: u128` parameter is still present and required in both `OpenChannelParams` and `AcceptChannelParams`, regardless of whether `one_way` is set. The provided content does not indicate any change to the *amount* or *necessity* of funding for one-way channels, only to their broadcast behavior and payment direction.

**Source:**
*   `crates/fiber-lib/src/rpc/channel.rs` (lines 44-45, 54-55): Defines `one_way` in `OpenChannelParams` and describes its behavior.
*   `crates/fiber-lib/src/rpc/channel.rs` (lines 41-42, 107-108): Shows `funding_amount` as a required parameter for both `open_channel` and `accept_channel`.

### 5. Impact on ckb-chess: do we need to update Fiber RPC calls?

The provided source content describes the Fiber network, its trampoline routing specification, and its RPC interfaces. It does not contain any information about `ckb-chess`, its architecture, how it currently interacts with Fiber RPCs, or its specific payment flow.

Therefore, based solely on the provided content, it is **not possible to determine** whether `ckb-chess` needs to update its Fiber RPC calls. This would depend on how `ckb-chess` currently initiates payments and generates invoices, and whether it intends to leverage the new trampoline routing or one-way channel features.

### Gaps / Follow-up

*   **Standard Onion Routing Definition:** While the differences are inferred, an explicit definition or reference for "standard onion routing" within the Fiber context would provide clearer contrast.
*   **One-Way Channel Funding Nuances:** The documentation states `funding_amount` is still required for one-way channels. It doesn't elaborate on whether the *other* party in a one-way channel still needs to contribute funding, or if it can be a zero-funded channel from their perspective, or if the `funding_amount` is solely for the initiating party.
*   **`ckb-chess` Integration Details:** To assess the impact on `ckb-chess`, further information about its current payment implementation and its specific use cases for Fiber would be required. This would include details on whether `ckb-chess` acts as a sender, recipient, or routing node, and its current reliance on full path knowledge.

### Relevant Code/API Snippets

```rust
// From crates/fiber-lib/src/rpc/payment.rs
#[serde_as]
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SendPaymentCommandParams {
    // ... other fields ...

    /// Optional explicit trampoline hops.
    ///
    /// When set to a non-empty list `[t1, t2, ...]`, routing will only find a path from the
    /// payer to `t1`, and the inner trampoline onion will encode `t1 -> t2 -> ... -> final`.
    pub trampoline_hops: Option<Vec<Pubkey>>,

    // ... other fields ...
}

// From crates/fiber-lib/src/rpc/invoice.rs
#[serde_as]
#[derive(Serialize, Deserialize, Default, Clone)]
pub struct NewInvoiceParams {
    // ... other fields ...

    /// Whether allow payment to use trampoline routing
    pub allow_trampoline_routing: Option<bool>,
}

// From crates/fiber-lib/src/rpc/channel.rs
#[serde_as]
#[derive(Serialize, Deserialize, Debug)]
pub struct OpenChannelParams {
    // ... other fields ...

    /// Whether this is a one-way channel (will not be broadcasted to network, and can only be used to send payment one way), an optional parameter, default value is false.
    pub one_way: Option<bool>,

    // ... other fields ...
}
```