# Research: fiberquest-sdk-design

**Date:** 2026-03-05  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/libretro/RetroArch/master/network/net_retropad/net_retropad_core.c, https://docs.libretro.com/development/cores/developing-cores/, https://raw.githubusercontent.com/RetroAchievements/rcheevos/master/include/rcheevos.h, https://raw.githubusercontent.com/RetroAchievements/rcheevos/master/src/rcheevos/rc_runtime.c

---

Date: 2026-03-05

## Summary

The FiberQuest SDK architecture is designed to enable a Fiber economy within SNES ROMs without modifying emulator C code. It leverages a Node.js sidecar to poll emulator RAM for game state changes via UDP, triggering CKB micropayments through the Fiber network. The SDK will define JSON schemas for RAM mapping and payment rules, allowing developers to configure new games by simply providing these files. Events will be exposed to a web overlay via WebSockets and to the Fiber network via its RPC interface. Bidirectional payment channels will be managed by the SDK, opening at game start and settling at game end, facilitating both earning and spending within a single session.

## (1) What does the RAM map JSON schema look like?

The provided source content does not explicitly define a RAM map JSON schema. The `net_retropad_core.c` and `rc_runtime.c` files, which might have contained relevant details, resulted in 404 errors. However, based on the "UDP RAM polling (READ_CORE_MEMORY, port 55355)" mentioned in the Project Ground Truth and the general concept of emulator memory mapping, a likely JSON schema for a game's RAM map would include:

```json
// Example: snes_super_mario_world_ram_map.json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "FiberQuest RAM Map",
  "description": "Defines memory addresses and their interpretations for a specific game.",
  "type": "object",
  "required": ["game_id", "memory_regions", "variables"],
  "properties": {
    "game_id": {
      "type": "string",
      "description": "Unique identifier for the game (e.g., ROM hash, internal ID)."
    },
    "memory_regions": {
      "type": "array",
      "description": "Definitions of memory regions within the emulator's address space.",
      "items": {
        "type": "object",
        "required": ["name", "start_address", "size"],
        "properties": {
          "name": {
            "type": "string",
            "description": "Descriptive name of the memory region (e.g., 'WRAM', 'SRAM', 'VRAM')."
          },
          "start_address": {
            "type": "string",
            "pattern": "^0x[0-9a-fA-F]+$",
            "description": "Hexadecimal start address of the region."
          },
          "size": {
            "type": "integer",
            "minimum": 1,
            "description": "Size of the region in bytes."
          }
        }
      }
    },
    "variables": {
      "type": "array",
      "description": "Mappings of game-specific values to memory addresses within defined regions.",
      "items": {
        "type": "object",
        "required": ["label", "address", "type"],
        "properties": {
          "label": {
            "type": "string",
            "description": "Human-readable label for the game variable (e.g., 'player_health', 'score', 'coins')."
          },
          "address": {
            "type": "string",
            "pattern": "^0x[0-9a-fA-F]+$",
            "description": "Hexadecimal address of the variable. Can be absolute or relative to a region (if specified)."
          },
          "region": {
            "type": "string",
            "description": "Optional: Name of the memory region this address belongs to, if relative addressing is used."
          },
          "type": {
            "type": "string",
            "enum": ["u8", "s8", "u16", "s16", "u24", "s24", "u32", "s32", "bitfield"],
            "description": "Data type of the variable."
          },
          "endianness": {
            "type": "string",
            "enum": ["little", "big"],
            "default": "little",
            "description": "Endianness for multi-byte values."
          },
          "mask": {
            "type": "string",
            "pattern": "^0x[0-9a-fA-F]+$",
            "description": "Optional: Bitmask for 'bitfield' types to extract specific bits."
          },
          "description": {
            "type": "string",
            "description": "Optional: Detailed description of the variable."
          }
        }
      }
    }
  }
}
```

## (2) What does the payment rules config look like (trigger condition, direction IN/OUT, amount formula, debounce, label)?

The payment rules configuration would be a JSON schema defining how game events, derived from RAM map variables, translate into Fiber payments. This schema is a design artifact based on the requirements outlined in the Project Ground Truth ("Game events (health damage, score, KO) trigger payments").

```json
// Example: snes_super_mario_world_payment_rules.json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "FiberQuest Payment Rules",
  "description": "Defines rules for triggering Fiber payments based on game events.",
  "type": "object",
  "required": ["game_id", "rules"],
  "properties": {
    "game_id": {
      "type": "string",
      "description": "Unique identifier for the game, matching the RAM map."
    },
    "rules": {
      "type": "array",
      "description": "List of payment rules.",
      "items": {
        "type": "object",
        "required": ["label", "trigger", "direction", "amount_formula"],
        "properties": {
          "label": {
            "type": "string",
            "description": "Human-readable label for the payment event (e.g., 'Player takes damage', 'Player scores a point')."
          },
          "trigger": {
            "type": "object",
            "description": "Defines the condition that triggers the payment.",
            "required": ["variable", "type"],
            "properties": {
              "variable": {
                "type": "string",
                "description": "Label of the RAM map variable to monitor (e.g., 'player_health', 'score')."
              },
              "type": {
                "type": "string",
                "enum": ["delta_increase", "delta_decrease", "threshold_above", "threshold_below", "equality"],
                "description": "Type of trigger condition."
              },
              "value": {
                "type": ["number", "string"],
                "description": "Target value for 'threshold_above', 'threshold_below', 'equality' triggers. Can be a number or a reference to another variable."
              },
              "delta_min": {
                "type": "number",
                "minimum": 0,
                "description": "Minimum change required for 'delta_increase' or 'delta_decrease' triggers."
              },
              "delta_max": {
                "type": "number",
                "minimum": 0,
                "description": "Maximum change allowed for 'delta_increase' or 'delta_decrease' triggers (optional)."
              }
            },
            "oneOf": [
              { "required": ["type", "variable", "delta_min"], "properties": { "type": { "enum": ["delta_increase", "delta_decrease"] } } },
              { "required": ["type", "variable", "value"], "properties": { "type": { "enum": ["threshold_above", "threshold_below", "equality"] } } }
            ]
          },
          "direction": {
            "type": "string",
            "enum": ["IN", "OUT"],
            "description": "'IN' if the player earns CKB/UDT, 'OUT' if the player pays CKB/UDT."
          },
          "amount_formula": {
            "type": "string",
            "description": "A mathematical expression to calculate the payment amount. Can use 'current_value', 'previous_value', 'delta_value' (e.g., '0.001 * delta_value', '0.005')."
          },
          "debounce_ms": {
            "type": "integer",
            "minimum": 0,
            "default": 0,
            "description": "Minimum time in milliseconds between subsequent triggers for this rule to prevent spamming."
          },
          "udt_id": {
            "type": "string",
            "description": "Optional: Type ID of the UDT to be paid. If omitted, CKB is used."
          },
          "description": {
            "type": "string",
            "description": "Optional: Detailed description of the rule."
          }
        }
      }
    }
}
```

## (3) How does the SDK expose events to the overlay and to Fiber?

**Exposing Events to Fiber:**
The SDK, implemented as a Node.js sidecar, will interact with the local Fiber node (e.g., `ckbnode` at `127.0.0.1:8227`) via its binary RPC interface. As stated in the Project Ground Truth, "no official Node.js Fiber client library exists — must build from Rust RPC source." This implies the Node.js sidecar will need to implement the necessary RPC client logic to communicate with the Fiber node.

When a payment rule is triggered:
1.  The Node.js sidecar will calculate the payment amount using the `amount_formula`.
2.  It will then call the Fiber node's `send_payment` RPC method. This method typically requires parameters such as the recipient's public key or invoice, the amount, and potentially a payment hash (for PTLCs, as Fiber uses).
3.  The SDK will manage the lifecycle of Fiber channels, using `open_channel` at game start and implicitly settling them at game end.

**Exposing Events to the Overlay:**
The Project Ground Truth does not specify an overlay mechanism. Given that the SDK is a Node.js sidecar and overlays are typically web-based, the most suitable and common approach for real-time event exposure would be **WebSockets**.

1.  **WebSocket Server:** The Node.js sidecar would host a WebSocket server (e.g., using the `ws` npm package).
2.  **Event Emission:** When a game event (e.g., player health change, score update) or a payment event (e.g., "Player earned 0.001 CKB") occurs, the sidecar would emit a structured JSON message over the WebSocket connection to all connected overlay clients.
3.  **Overlay Client:** The web-based overlay would connect to this WebSocket server and listen for incoming messages, updating its UI in real-time.

Example WebSocket event structure:
```json
// Game state update
{
  "type": "game_state_update",
  "timestamp": 1678000000000,
  "game_id": "snes_super_mario_world",
  "data": {
    "player_health": 3,
    "score": 1200,
    "coins": 50
  }
}

// Payment event
{
  "type": "payment_event",
  "timestamp": 1678000000000,
  "game_id": "snes_super_mario_world",
  "rule_label": "Player takes damage",
  "direction": "OUT",
  "amount": "0.005",
  "currency": "CKB",
  "status": "sent", // or "failed", "confirmed"
  "transaction_id": "fiber_payment_id_xyz"
}
```

## (4) What does "adding a new game" look like as a developer workflow?

The workflow for adding a new game to the FiberQuest SDK, designed to be "without touching emulator C code," would involve the following steps:

1.  **Game Analysis & RAM Mapping:**
    *   **Play the game:** Understand key game mechanics and states (e.g., player health, score, lives, item counts, boss health, level progression).
    *   **Use an emulator's memory viewer:** Utilize RetroArch's built-in memory monitoring tools (or external tools like RetroAchievements' RAM Watch) to identify the specific memory addresses that correspond to these game states. This often involves trial and error, changing values in-game and observing memory changes.
    *   **Document addresses:** Note down the addresses, their data types (e.g., 8-bit unsigned, 16-bit signed), and endianness.

2.  **Create RAM Map JSON:**
    *   Based on the identified memory addresses, create a new JSON file (e.g., `my_new_game_ram_map.json`) adhering to the RAM map JSON schema (as described in Q1).
    *   Populate `game_id`, `memory_regions` (if applicable), and `variables` with the collected information.

3.  **Define Payment Rules JSON:**
    *   Design the game's economy: Decide which in-game events should trigger payments (earning or spending).
    *   Create a new JSON file (e.g., `my_new_game_payment_rules.json`) adhering to the payment rules JSON schema (as described in Q2).
    *   For each desired event, define a `rule` object, specifying:
        *   `label`: A descriptive name.
        *   `trigger`: The condition based on a `variable` from the RAM map (e.g., `player_health` `delta_decrease` by 1, `score` `delta_increase` by 100).
        *   `direction`: `IN` (player earns) or `OUT` (player pays).
        *   `amount_formula`: How much CKB (or UDT) is paid/earned (e.g., `0.001 * delta_value`).
        *   `debounce_ms`: To prevent rapid, unwanted triggers.

4.  **Deployment & Integration:**
    *   Place the `my_new_game_ram_map.json` and `my_new_game_payment_rules.json` files into a designated `games/` directory within the FiberQuest SDK (Node.js sidecar) installation.
    *   The Node.js sidecar, upon startup or game selection, will load these configuration files.
    *   The sidecar will then begin polling the emulator's RAM (via UDP port 55355) according to the RAM map and monitoring for trigger conditions defined in the payment rules.
    *   (Optional) If a custom overlay is desired, develop the frontend to connect to the sidecar's WebSocket server and display game-specific information or payment notifications.

This workflow ensures that adding new games is a configuration-driven process, requiring no changes to the core SDK code or emulator binaries.

## (5) How does the SDK handle bidirectional channels (both earn and spend in same session)?

Fiber, as a payment channel network, inherently supports bidirectional payments within a single open channel. The SDK (Node.js sidecar) will leverage this capability to manage both earning and spending for a player within a game session.

1.  **Channel Opening (Game Start):**
    *   At the beginning of a game session, the SDK initiates the opening of a Fiber channel between the player's CKB address (or a proxy address controlled by the player's wallet, like JoyID via `@ckb-ccc/core`) and the game host's Fiber node (e.g., `ckbnode`).
    *   This involves an on-chain CKB transaction using the Fiber node's `open_channel` RPC method. The channel is funded by one or both parties with an initial capacity to cover potential payments in both directions. For FiberQuest, it's likely the player funds the channel to cover potential "OUT" payments, and the host ensures sufficient capacity for "IN" payments.
    *   The Project Ground Truth states: "Channels open at game start, settle at game end."

2.  **Off-Chain Bidirectional Payments (During Gameplay):**
    *   Once the channel is open, all subsequent payments triggered by game events (both "IN" and "OUT" as defined in the payment rules) occur off-chain within this established channel.
    *   When an "OUT" payment is triggered (player pays, e.g., for taking damage), the SDK calls the Fiber node's `send_payment` RPC method to send CKB/UDT from the player's side of the channel to the host's side.
    *   When an "IN" payment is triggered (player earns, e.g., for scoring points), the SDK calls `send_payment` to send CKB/UDT from the host's side of the channel to the player's side.
    *   Fiber's underlying PTLC (Payment Channel Lock) mechanism ensures the security and atomic nature of these off-chain transfers. The channel's internal balance is updated with each payment.

3.  **Channel Closing (Game End):**
    *   At the end of the game session, the SDK initiates the closing of the Fiber channel.
    *   This involves a final on-chain CKB transaction that records the net balance of the channel, distributing the remaining funds to the respective parties based on all the off-chain payments that occurred.
    *   This ensures that the final state of the game's economy is reflected on the CKB Layer 1 blockchain.

The SDK's responsibility is to abstract these Fiber interactions, presenting a simple "earn" or "spend" mechanism to the game logic based on the configured payment rules, while handling the complexities of channel management and off-chain state transitions.

## Gaps / Follow-up

1.  **RetroArch Memory Access API:** The most significant gap is the lack of specific documentation or code examples for RetroArch's "UDP RAM polling (READ_CORE_MEMORY, port 55355)". The `net_retropad_core.c` and `rc_runtime.c` files were not found. Understanding the exact format of the UDP requests and responses for memory reads is crucial for the Node.js sidecar implementation.
2.  **Node.js Fiber Client Library:** The Project Ground Truth explicitly states "no official Node.js Fiber client library exists — must build from Rust RPC source." This means the SDK will need to implement a custom client for Fiber's binary RPC, which is a substantial development effort. Details on the exact binary RPC protocol (message formats, serialization) are needed.
3.  **UDT Support in Fiber:** While Fiber supports UDTs, the specific RPC methods for `send_payment` with UDTs versus CKB need to be clarified from the Fiber Rust RPC source.
4.  **Error Handling and Channel Capacity:** The design should consider how the SDK handles Fiber channel errors (e.g., insufficient capacity for a payment, channel closure failures) and communicates these back to the game or player.
5.  **Security Considerations:** Details on how the Node.js sidecar securely manages player keys or interacts with JoyID for signing channel opening/closing transactions are not covered. The Project Ground Truth mentions `secp256k1` signing on ESP32-P4 and `@ckb-ccc/core` for JS transaction building, implying these will be used.

## Relevant Code/API Snippets

**From Project Ground Truth (Fiber Network):**
*   **FNN binary RPC methods:** `open_channel`, `send_payment`, `list_channels`, `new_invoice`, `get_invoice`.
    *   The SDK will primarily use `open_channel` at game start and `send_payment` during gameplay.

**From Project Ground Truth (CKB Layer 1):**
*   **JoyID:** Primary wallet.
*   **CCC (`@ckb-ccc/core`):** Primary JS SDK for CKB transaction building.
    *   This will be relevant for the Node.js sidecar to interact with player wallets for on-chain channel opening/closing transactions, if direct wallet integration is required beyond the Fiber node's RPC.

**From Project Ground Truth (FiberQuest):**
*   **UDP RAM polling:** `READ_CORE_MEMORY, port 55355`.
    *   This indicates the mechanism for the Node.js sidecar to retrieve game state from RetroArch. The exact UDP packet format is a gap.

No specific code snippets for the RAM map or payment rules were found in the provided external source content, as those are design artifacts for the SDK itself.