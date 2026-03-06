# Research: fiberquest-tournament-escrow-patterns

**Date:** 2026-03-06  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/nervosnetwork/rfcs/main/rfcs/0023-dao-deposit-withdraw/0023-dao-deposit-withdraw.md, https://raw.githubusercontent.com/nervosnetwork/rfcs/main/rfcs/0022-transaction-structure/0022-transaction-structure.md, https://raw.githubusercontent.com/nervosnetwork/fiber/main/docs/rpc.md, https://raw.githubusercontent.com/ckb-ccc/ccc/main/packages/core/src/ckb/transaction.ts, https://raw.githubusercontent.com/nervosnetwork/ckb-system-scripts/main/c/secp256k1_blake160_sighash_all.c

---

Date: 2026-03-06

## Summary

This research explores multi-party escrow patterns on the CKB Layer 1 blockchain for tournament prize pools, focusing on accumulating entry fees and distributing payouts. The CKB cell model, with its capacity, lock script, type script, and data fields, is foundational for implementing these patterns. A `Type Script` on an escrow cell can enforce rules for registration, atomic fee collection, balance verification, and conditional refunds. While an agent is required to initiate transactions, `Type Scripts` provide on-chain enforcement. The Fiber Network, being a payment channel network for routing payments, is explicitly stated as unsuitable for storing arbitrary data or holding funds in a stateful escrow manner.

## Questions to Answer

### 1. What's the cleanest pattern for an escrow cell that grows as players register (each registration tx adds to the escrow balance)?

The cleanest pattern for an escrow cell that grows with player registrations leverages CKB's UTXO-like cell model. Since CKB cells have a fixed capacity, "growing" an escrow means consuming an existing escrow cell and producing a new one with increased capacity.

1.  **Escrow Cell Structure**: A dedicated CKB cell would serve as the escrow. Its structure would be:
    *   **Capacity**: The total CKB held in escrow.
    *   **Lock Script**: Defines who can spend the cell (e.g., a multi-sig of tournament organizers, or a specific agent after certain conditions are met).
    *   **Type Script**: This is crucial. It defines the rules for how the cell can be consumed and how its state transitions.
    *   **Data**: Stores tournament-specific metadata, such as `tournament_id`, `entry_fee_amount`, `min_players`, `max_players`, `current_player_count`, and potentially a list of registered player addresses and their contributions.

2.  **Registration Transaction Flow**:
    *   A player initiates a transaction to register.
    *   This transaction would take the *current* escrow cell as an input (if it exists) and the player's CKB cell (for the entry fee) as another input.
    *   The transaction would output a *new* escrow cell.
    *   The `Type Script` of the *new* escrow cell would verify that:
        *   The `capacity` of the new escrow cell equals the `capacity` of the old escrow cell (or initial funding) plus the `entry_fee_amount` from the player.
        *   The `current_player_count` in the `data` field is incremented by one.
        *   The player's address is added to the list of registered players in the `data` field.
        *   Other tournament rules (e.g., `max_players` not exceeded) are met.

This pattern ensures that the escrow balance is always represented by a single, auditable cell whose state transitions are governed by its `Type Script`.

### 2. How do you enforce entry fee payment atomically with tournament cell registration in a single tx?

Atomicity in CKB is inherent to its transaction model: all inputs are consumed, and all outputs are created, or the entire transaction fails. To enforce entry fee payment atomically with tournament registration:

1.  **Single Transaction**: The registration process must occur within a single CKB transaction.
2.  **Transaction Inputs**:
    *   **Player's CKB Input**: A cell owned by the player, containing at least the `entry_fee_amount` plus transaction fees.
    *   **Existing Escrow Input (Optional)**: If this is not the very first registration, the current escrow cell is consumed as an input.
3.  **Transaction Outputs**:
    *   **New Escrow Output**: A new escrow cell is created with its `capacity` updated to include the new entry fee, and its `data` field updated to reflect the new `current_player_count` and registered player information. This cell will have the same `Lock Script` and `Type Script` as the previous escrow cell (or the initial escrow setup).
    *   **Player's Change Output**: A cell returning any remaining CKB to the player from their input cell.
    *   **Player's Registration Output (Optional)**: A separate cell could be created for the player, perhaps with a specific `Type Script` indicating their registration for the tournament, or simply storing their registration details in its `data` field.
4.  **Type Script Enforcement**: The `Type Script` of the *new* escrow cell is critical for enforcement. It would be executed during transaction validation and must verify:
    *   The transaction includes an input that contributes the exact `entry_fee_amount` to the escrow's capacity.
    *   The `data` field of the new escrow cell correctly reflects the incremented player count and the addition of the new player's details.
    *   The `capacity` of the new escrow cell is consistent with the sum of previous escrow capacity and the new entry fee.

This ensures that a player cannot register without paying the fee, and the fee cannot be paid without the registration being recorded in the escrow cell's state, all within one atomic operation.

### 3. For entry-fee-only tournaments, how do you prove the escrow balance = sum of all entry fees on-chain?

To prove `escrow balance = sum of all entry fees` on-chain for entry-fee-only tournaments, the `Type Script` of the escrow cell must maintain and verify this invariant.

1.  **Data Field Tracking**: The `data` field of the escrow cell would store:
    *   `entry_fee_amount`: The fixed fee for each player.
    *   `current_player_count`: The total number of players who have successfully registered.
2.  **Type Script Invariant Enforcement**:
    *   **Initial State**: When the first player registers (or the escrow is initially funded), the `Type Script` verifies that the `capacity` of the escrow cell equals `entry_fee_amount * 1` and `current_player_count` is 1.
    *   **Subsequent Registrations**: For every subsequent registration transaction that consumes an old escrow cell and creates a new one:
        *   The `Type Script` verifies that the `capacity` of the *new* escrow cell is exactly `(old_current_player_count + 1) * entry_fee_amount`.
        *   It also verifies that the `current_player_count` in the `data` field of the new escrow cell is `old_current_player_count + 1`.
    *   **Payout/Refund Transactions**: When the escrow cell is consumed for payouts or refunds, the `Type Script` can still verify that the total `capacity` being distributed matches `current_player_count * entry_fee_amount` (minus transaction fees), ensuring no funds are lost or created.

By embedding this logic within the `Type Script`, every valid state transition of the escrow cell on-chain inherently proves that its capacity (balance) is the direct sum of all collected entry fees.

### 4. What's the best pattern for batch payouts — one tx that outputs to N winners simultaneously?

CKB's UTXO-like model naturally supports batch payouts in a single transaction.

1.  **Single Payout Transaction**: A single CKB transaction would be constructed to handle all payouts.
2.  **Transaction Inputs**:
    *   **Escrow Cell Input**: The current escrow cell (containing the prize pool) is consumed as an input.
3.  **Transaction Outputs**:
    *   **Winner Output Cells**: For each of the N winners, a separate output cell is created. Each output cell's `capacity` would be the specific prize amount allocated to that winner, and its `Lock Script` would be the winner's CKB address (or a script they control).
    *   **Change Output (Optional)**: If there's any remaining capacity after payouts (e.g., for transaction fees or a small remainder), a change cell can be created.
4.  **Script Enforcement**:
    *   **Escrow Lock Script**: The `Lock Script` of the escrow cell must permit this payout transaction. This could involve:
        *   A multi-signature from tournament organizers.
        *   A signature from a designated agent after a specific time or event (e.g., tournament completion).
    *   **Escrow Type Script**: The `Type Script` of the escrow cell can enforce the payout logic. It would verify:
        *   The total `capacity` of all winner output cells (plus transaction fees) equals the `capacity` of the consumed escrow input cell.
        *   The distribution of prizes among winners adheres to predefined rules (e.g., 1st place gets X%, 2nd place gets Y%, etc., which would be encoded in the `Type Script` or its `data` field).
        *   The recipient addresses correspond to the actual winners (which would require the `Type Script` to have access to or verify the winner list, perhaps stored in its `data` field or provided as a witness).

This pattern ensures that the entire prize pool is distributed in a single, atomic, and verifiable transaction, reducing transaction fees and simplifying the payout process.

### 5. How do you handle automatic refunds if min_players not met — can a Type Script enforce this, or does it require the agent to initiate the tx?

A `Type Script` can enforce the conditions for automatic refunds if `min_players` is not met, but an agent is still required to initiate the refund transaction. CKB scripts are passive validators; they do not initiate transactions themselves.

1.  **Type Script Logic**: The `Type Script` of the escrow cell would contain logic to handle refunds:
    *   **State Tracking**: The `data` field of the escrow cell would store `min_players`, `current_player_count`, a `deadline` timestamp (or block number), and a list of `(player_address, contributed_amount)` pairs.
    *   **Conditional Spending**: The `Type Script` would define two primary spending conditions for the escrow cell:
        *   **Payout Condition**: If `current_player_count >= min_players` and the `deadline` has passed (or the tournament is completed), allow spending for payouts to winners (as described in Q4).
        *   **Refund Condition**: If `current_player_count < min_players` and the `deadline` has passed, *only allow* spending if the transaction outputs refund the players.
    *   **Refund Verification**: Under the refund condition, the `Type Script` would verify that:
        *   The total `capacity` of the output cells equals the total `capacity` of the input escrow cell (minus transaction fees).
        *   Each output cell's `capacity` and `Lock Script` corresponds to a `(contributed_amount, player_address)` pair from the stored list, ensuring each player receives their original entry fee back.

2.  **Agent Initiation**: An external agent (e.g., a Wyltek server, a cron job on the Pi5) would be responsible for:
    *   Monitoring the `current_player_count` and the `deadline` of the escrow cell.
    *   If the refund conditions are met, constructing and submitting a refund transaction that adheres to the `Type Script`'s refund logic.

The `Type Script` acts as an on-chain "smart contract" that dictates *how* the funds can be moved under different circumstances, but it relies on an external entity to trigger those movements.

### 6. Any Fiber Network patterns for holding funds in escrow pending a future event?

Based on the provided "Project Ground Truth":

"Fiber is a **payment channel network** — similar to Bitcoin's Lightning Network, built on CKB L1. Fiber channels open/close via CKB on-chain transactions; everything in between is off-chain. Fiber **CANNOT store arbitrary data or files** — only routes payments (CKB, UDTs)."

Given this explicit statement, the Fiber Network is **not suitable for holding funds in escrow pending a future event** in the same way a CKB Layer 1 cell with a `Type Script` can.

Fiber's purpose is to facilitate rapid, low-fee, off-chain *payments*. While funds are locked on CKB Layer 1 to open a Fiber channel, the channel itself is a mechanism for routing value, not for maintaining a stateful escrow that holds funds under complex, event-driven conditions. Fiber channels are designed for liquidity and payment flow, not for arbitrary data storage or complex conditional spending logic that defines an escrow.

Therefore, there are no Fiber Network patterns for holding funds in escrow pending a future event. Escrow functionality, as described in the previous questions, must be implemented on CKB Layer 1 using its cell model, `Lock Scripts`, and `Type Scripts`. Fiber could potentially be used for the *final distribution* of funds *after* an L1 escrow cell has been unlocked and disbursed, allowing winners to receive their payouts via Fiber channels for faster, cheaper transfers.

## Gaps / Follow-up

1.  **Detailed CKB Scripting Primitives**: The provided source content (RFCs 0022 and 0023, `secp256k1_blake160_sighash_all.c`) failed to fetch. This limits the ability to cite specific CKB script opcodes, transaction structure details, or existing script examples that could inform the implementation of the `Type Script` logic for escrow.
2.  **CKB-CCC Transaction Building Details**: The `ckb-ccc/core/src/ckb/transaction.ts` file also failed to fetch. While `@ckb-ccc/core` is identified as the primary JS SDK, specific code snippets for constructing complex transactions (e.g., with multiple inputs/outputs, custom type scripts, or witness structures for script arguments) are missing.
3.  **On-chain Time/Block Number Access**: The discussion of `deadline` for refunds implies the ability for a `Type Script` to access the current block timestamp or block number. While this is a common blockchain primitive, its specific implementation and reliability within CKB scripts were not detailed in the provided content.
4.  **Gas Costs / Cell Occupied Capacity**: While the patterns are described, the practical implications of storing player lists and complex logic in cell `data` and `Type Scripts` regarding cell occupied capacity and transaction fees were not covered.
5.  **Off-chain Agent Implementation**: The need for an off-chain agent to initiate transactions (e.g., refunds, payouts) is clear. Details on how Wyltek's existing infrastructure (Pi5, NucBox) or `wyltek-embedded-builder` might be leveraged for this agent role, especially for monitoring and transaction submission, are not fully explored.

## Relevant Code/API Snippets

Due to the "FETCH ERROR: HTTP Error 404: Not Found" for all provided source content URLs, no specific code or API snippets from those sources can be cited.

However, based on the "Project Ground Truth":

*   **CKB Transaction Building**: The `@ckb-ccc/core` SDK is identified as the "primary JS SDK for CKB transaction building". This would be used by an off-chain agent (e.g., a Node.js application) to construct and sign the complex transactions required for registration, payouts, and refunds.
    *   `@ckb-ccc/core` would be used to:
        *   Define transaction inputs (consuming player's CKB, existing escrow cell).
        *   Define transaction outputs (new escrow cell, player's change, winner payout cells).
        *   Construct `Lock Script` and `Type Script` instances for the escrow cell.
        *   Sign the transaction using `JoyID` (as it's the primary wallet).

*   **CKB Cell Model**: The fundamental structure for escrow is the CKB cell:
    ```
    Cell {
        capacity: u64,
        lock_script: Script, // Defines who can spend
        type_script: Option<Script>, // Defines state transitions/behavior
        data: Bytes, // Stores metadata like player count, entry fee, deadline, player list
    }
    ```
    The `Script` type for `lock_script` and `type_script` would refer to the compiled CKB-VM bytecode of the respective scripts.