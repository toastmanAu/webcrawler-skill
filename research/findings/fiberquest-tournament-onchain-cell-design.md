# Research: fiberquest-tournament-onchain-cell-design

**Date:** 2026-03-06  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/nervosnetwork/rfcs/main/rfcs/0022-transaction-structure/0022-transaction-structure.md, https://raw.githubusercontent.com/nervosnetwork/rfcs/main/rfcs/0009-vm-syscalls/0009-vm-syscalls.md, https://raw.githubusercontent.com/sporeprotocol/spore-sdk/main/README.md, https://raw.githubusercontent.com/nervosnetwork/rfcs/main/rfcs/0019-data-structures/0019-data-structures.md, https://raw.githubusercontent.com/ckb-ccc/ccc/main/README.md

---

Date: 2026-03-06

## Summary
This research explores the design of CKB on-chain objects for a tournament, focusing on state machine enforcement via Type Scripts and cell linking. Due to the unavailability of core CKB RFCs and SDK documentation, detailed pseudo-code for script validation and precise syscalls cannot be provided. However, general principles for state transitions, cell identification, and capacity management are discussed based on the CKB cell model. The Spore Protocol, which the project already uses, offers a high-level SDK for managing on-chain assets but does not delve into the low-level script logic required for these specific questions.

## Questions to Answer

### (1) How do you design a Type Script that enforces a state machine (OPEN→LOCKED→ACTIVE→SETTLED) — what does the script validation logic look like in pseudo-code?
The provided content lacks the necessary CKB RFCs (e.g., `0022-transaction-structure`, `0009-vm-syscalls`, `0019-data-structures`) to detail specific CKB VM syscalls or precise transaction structure for pseudo-code. Therefore, a definitive pseudo-code for script validation cannot be provided from the given sources.

However, based on the general understanding of CKB's cell model and Type Scripts, the conceptual approach would involve:
1.  **State Representation**: The current state (OPEN, LOCKED, ACTIVE, SETTLED) would be encoded within the `data` field of the tournament cell. This could be a single byte or an enum value.
2.  **Type Script Parameter**: The Type Script's `args` could contain an identifier for the tournament (e.g., a `type_id` generated from the first transaction that creates the cell, or a unique hash). This ensures that only cells belonging to *this specific tournament type* are validated by this script.
3.  **Validation Logic (Conceptual Pseudo-code)**:
    *   **Identify Input/Output Cells**: The script would need to identify the input tournament cell (the one being consumed) and the output tournament cell (the new state, if applicable).
    *   **Read Current State**: Load the `data` from the input tournament cell to determine its current state.
    *   **Determine Transition**: Based on the current state and the transaction's structure (e.g., presence of specific witnesses, other linked cells, or transaction `lock_time`), determine the allowed next state.
    *   **Validate Next State**:
        *   **OPEN → LOCKED**: Requires specific conditions, e.g., a minimum number of participants, a time lock, or an "admin" signature. The output cell's state must be LOCKED.
        *   **LOCKED → ACTIVE**: Requires a time lock to expire, or a specific action by an "admin" (e.g., a signature from a predefined lock script). The output cell's state must be ACTIVE.
        *   **ACTIVE → SETTLED**: Requires game completion conditions to be met