# Research: fiber-channel-funding-ux

**Date:** 2026-03-04  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/nervosnetwork/fiber/main/docs/specs/channel-announcement.md, https://raw.githubusercontent.com/nervosnetwork/fiber/main/docs/payment-lifecycle.md, https://raw.githubusercontent.com/nervosnetwork/fiber/main/docs/quick-start.md, https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/README.md, https://raw.githubusercontent.com/nervosnetwork/fiber/main/tests/bruno/fiber/open_channel.bru, https://api.github.com/repos/nervosnetwork/fiber/releases/latest

---

## Research Note: fiber-channel-funding-ux

**Date:** 2026-03-04

### Summary
This research analyzes the Fiber channel lifecycle based on the provided documentation. The available content primarily details the RPC methods for channel management (opening, accepting, closing) and the payment lifecycle within established channels. However, critical information regarding specific CKB requirements for auto-acceptance, recommended channel capacities for different node types, explicit channel rebalancing mechanisms, and detailed channel close flows (time locks, on-chain fees) is largely absent due due to missing documentation files. The `fiber-lib/src/rpc/README.md` provides a good overview of the programmatic interface for interacting with Fiber nodes.

### 1. Minimum CKB to auto-accept channels — is 99 CKB correct or is it configurable?
The provided content **does not contain information** to confirm if 99 CKB is the correct minimum for auto-accepting channels or if this value is configurable. The `channel-announcement.md` and `quick-start.md` files, which might have contained this detail, returned fetch errors. The `fiber-lib/src/rpc/README.md` lists an `accept_channel` method but does not specify any minimum CKB requirements or configuration options related to it.

### 2. What's the recommended channel capacity for a routing node vs an app endpoint?
The provided content **does not contain information** regarding recommended channel capacities for routing nodes versus app endpoints. The `channel-announcement.md` and `quick-start.md` files, which might have provided such guidance, returned fetch errors. The `open_channel` RPC method is listed, but its documentation does not specify parameters for initial capacity or provide recommendations.

### 3. How do you rebalance a channel that's become one-sided (all capacity on one end)?
The provided content **does not explicitly describe mechanisms or APIs for rebalancing a one-sided channel**. The `payment-lifecycle.md` document illustrates how payments flow and affect channel balances, but it does not detail strategies like circular rebalances or submarine swaps. The `fiber-lib/src/rpc/README.md` lists a `send_payment` method, which can be used to move funds, but there is no dedicated "rebalance" RPC method. The `update_channel` method exists, but its specific functionality for rebalancing is not detailed.

### 4. Channel close flow: cooperative vs unilateral — time locks, on-chain fees?
The provided content offers limited insight into the channel close flow. The `fiber-lib/src/rpc/README.md` lists two relevant RPC methods:
*   `shutdown_channel`: This method likely initiates a cooperative channel closure.
*   `abandon_channel`: This method might be used for unilateral closure or to abandon a channel that failed to open properly.

However, the documentation **does not provide details** on the differences between cooperative and unilateral closures, associated time locks, or on-chain fees for either type of closure. The `channel-announcement.md` file, which might have contained these protocol-level details, returned a fetch error.

### 5. For ckb-chess: what capacity is needed per game session (typical move payment size × expected moves)?
The provided content **does not contain any information** specific to ckb-chess, typical move payment sizes, or expected moves. Therefore, it is not possible to determine the required channel capacity per game session from the given sources.

### Gaps / Follow-up
1.  **Minimum CKB for auto-acceptance:** Investigate Fiber node configuration files or other documentation (if available) for `min_channel_capacity` or similar parameters.
2.  **Recommended Channel Capacity:** Seek best practices or examples for setting channel capacities for different node roles (routing vs. endpoint).
3.  **Channel Rebalancing:** Explore if Fiber supports specific rebalancing techniques (e.g., circular payments, swap services) and if there are corresponding RPC methods or recommended workflows.
4.  **Detailed Channel Closure:** Find documentation detailing the protocol differences between cooperative and unilateral channel closures, including time locks (e.g., `to_self_delay`), dispute resolution mechanisms, and estimated on-chain transaction fees.
5.  **ckb-chess Specifics:** Consult ckb-chess documentation or developers to determine typical payment sizes per move and expected number of moves per game to calculate required channel capacity.
6.  **Missing Documentation:** The `channel-announcement.md`, `quick-start.md`, and `open_channel.bru` files were not found. Accessing these documents would likely provide answers to several of the unanswered questions.

### Relevant Code/API Snippets
The `Fiber Network Node RPC` documentation (`fiber-lib/src/rpc/README.md`) provides the following relevant RPC methods for channel management and payments:

**Module `Channel`**
*   `open_channel`: Attempts to open a channel with a peer.
*   `accept_channel`: Accepts an incoming channel opening request.
*   `abandon_channel`: Abandons a channel (details on implications are not provided).
*   `list_channels`: Lists all active channels.
*   `shutdown_channel`: Initiates the process to close a channel.
*   `update_channel`: Updates channel parameters (specific use cases like rebalancing are not detailed).

**Module `Payment`**
*   `send_payment`: Sends a payment through the Fiber network.
*   `get_payment`: Retrieves information about a specific payment.
*   `build_router`: Builds a payment route.
*   `send_payment_with_router`: Sends a payment using a pre-built route.