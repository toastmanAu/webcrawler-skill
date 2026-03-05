# Research: fiberquest-hardware-synthesis

**Date:** 2026-03-05  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** 

---

## Research Note: FiberQuest Hardware Synthesis

**Date:** 2026-03-05

### Summary
This research synthesizes findings from `fiberquest-embedded-node`, `fiberquest-esp32s3-node`, `fiberquest-web-client`, and `MEMORY.md` to propose a hardware architecture for FiberQuest. The recommended approach leverages powerful embedded systems (Pi5, NucBox, N100) as full Fiber nodes and game servers, complemented by ESP32-S3 devices as lightweight, interactive game clients. A hybrid web client is suggested for rapid development, combining a simple game interface with a functional Fiber payment dashboard. The most impressive demo involves multiple ESP32 handhelds interacting with a central node, showcasing real-time Fiber payments. Hardware integration is seen as a strong differentiator for the hackathon, provided the scope is managed by utilizing off-the-shelf components and focusing on core functionality.

### 1. Recommended Hardware Architecture for FiberQuest

**What runs where:**
*   **Full Fiber Node & Game Server:** A more powerful embedded device such as a Raspberry Pi 5, NucBox, or N100 (as per `MEMORY.md` and `fiberquest-embedded-node` findings) should host the full Fiber node. This device would also run the core game logic, manage game state, and potentially serve a local web client. This setup provides the necessary computational resources and storage for a full blockchain node.
*   **Light Game Client / User Interface:** ESP32-S3 microcontrollers (as detailed in `fiberquest-esp32s3-node` findings) are ideal for interactive player devices. These would run a light client application, handle user input (buttons, joystick), display game information (on an integrated screen), and communicate over WiFi with the central Fiber node/game server for game state updates and Fiber transactions. They would *not* run a full Fiber node due to resource constraints, but leverage existing `ckb-light-esp` experience (`MEMORY.md`).
*   **Web Client:** A browser-based client (as per `fiberquest-web-client` findings) would connect to the Fiber node/game server (either locally hosted on the Pi/NucBox or a remote instance) to provide a richer interface, display game progress, and manage Fiber assets.

**Minimum setup a player needs:**
For a self-contained player experience where they host their own node, the minimum setup would be a single Raspberry Pi 5 (or similar NucBox/N100) running the full Fiber node and game server, accessible via a standard web browser on a laptop or smartphone. This allows a player to have full control over their game and Fiber assets without relying on external servers.
Alternatively, for a truly minimal *player-owned hardware* setup, an ESP32-S3 device acting as a light client, connecting to a *remote* or *shared* full Fiber node, would suffice. This reduces the hardware cost and complexity for the player but introduces a dependency on an external node. Given the context of "Fiber nodes" on Pi5/NucBox/N100, the former (self-contained Pi5) is recommended for a robust player experience.

### 2. The "FiberQuest device" concept

**What would a dedicated plug-and-play FiberQuest hardware dongle look like:**
A dedicated FiberQuest device would likely be based on an ESP32-S3 development board (e.g., LilyGo T-Display S3, M5Stack CoreS3) integrated into a small, handheld form factor. It would feature:
*   A small color LCD screen for game display and HUD.
*   Physical input buttons (D-pad, A/B buttons) for game interaction.
*   WiFi connectivity for communication with the Fiber node/game server.
*   A USB-C port for power and initial firmware flashing.
*   It would *not* run a full Fiber node but act as a dedicated light client, leveraging the `ckb-light-esp` experience mentioned in `MEMORY.md`. Its primary function would be to provide an immersive, tactile interface for the game, displaying Fiber payment confirmations and game state.

**Is it feasible in 2 weeks as a stretch goal:**
**Yes, it is feasible as a stretch goal, but with significant caveats.**
*   **Feasible aspects:** Programming an off-the-shelf ESP32-S3 development board (like the LilyGo T-Display S3) with a custom game client, integrating basic graphics, input handling, and WiFi communication to a central node, and displaying Fiber transaction confirmations is achievable within two weeks, especially given existing `ckb-light-esp` experience (`MEMORY.md`).
*   **Infeasible aspects:** Designing and manufacturing a custom PCB or a polished, custom-molded enclosure for a "dongle" is absolutely not feasible within a two-week hackathon timeframe. The "dongle" would effectively be a programmed, off-the-shelf ESP32-S3 dev board.

### 3. Web client recommendation

**Full browser game vs dashboard-only vs hybrid:**
A **hybrid approach** is strongly recommended for the hackathon.

*   **Full browser game:** While appealing, developing a graphically rich, full browser game (e.g., using Phaser or PixiJS as implied by `fiberquest-web-client` findings) is highly ambitious for a two-week timeframe and risks an unpolished or incomplete experience.
*   **Dashboard-only:** This is the simplest to implement, focusing on displaying Fiber transaction history, node status, and basic game metrics. While functional, it might lack the "game" feel.
*   **Hybrid:** This approach balances ambition with feasibility. It would involve:
    *   A simple, perhaps text-based or minimalist graphical game loop (e.g., a simple adventure, resource collection, or turn-based combat) implemented in the browser.
    *   A prominent dashboard section for displaying real-time Fiber balances, transaction confirmations, and potentially an inventory of Fiber-backed in-game items.
    *   This allows for a playable experience while clearly showcasing the Fiber integration.

**What's achievable in 2 weeks:**
A functional hybrid web client is achievable. This would include:
*   A basic game interface (e.g., a map, character movement, simple interactions).
*   Integration with the Fiber node for initiating and confirming transactions (e.g., buying items, paying for actions).
*   A clear display of Fiber balances and recent transaction history.
*   The focus should be on demonstrating the core gameplay loop and Fiber integration, rather than extensive graphics or complex mechanics.

### 4. The most impressive hardware demo possible

The most impressive hardware demo would involve **two or more ESP32-S3 handheld devices playing a simple multiplayer game over WiFi, with Fiber payments visibly integrated into a real-time HUD on each device.**

**Demo Scenario:**
1.  **Central Node:** A single Raspberry Pi 5 (or NucBox/N100) runs the full Fiber node and acts as the game server, managing the shared game state and processing all Fiber transactions.
2.  **Handheld Clients:** Two (or more) ESP32-S3 development boards (e.g., LilyGo T-Display S3 units) are programmed as individual player clients. Each handheld displays its player's game state, health, inventory, and current Fiber balance on its integrated screen.
3.  **Gameplay:** Players interact with the game via buttons on their handhelds. For example, they might collect resources, engage in simple combat, or trade.
4.  **Fiber Integration:**
    *   When a player performs an action that costs Fiber (e.g., buying an upgrade, using a special ability), they initiate the transaction from their handheld.
    *   The transaction request is sent via WiFi to the central Fiber node.
    *   The central node processes the Fiber payment.
    *   Confirmation of the payment (or failure) is sent back to the handheld, and the player's Fiber balance and game state are updated in real-time on their HUD.
    *   Similarly, if a player earns Fiber (e.g., by completing a quest, defeating an enemy), the transaction is processed, and their balance updates.
5.  **Visible HUD:** The ESP32-S3 screen prominently displays the player's current Fiber balance, recent transaction notifications, and game-specific information, making the blockchain integration immediately apparent and interactive.

This demo leverages the strengths of both the powerful embedded node and the lightweight, interactive ESP32 clients, showcasing a tangible, multi-device experience with real-time Fiber payments.

### 5. Updated hackathon scope

**Does hardware integration strengthen or complicate the entry?**
**Hardware integration significantly strengthens the hackathon entry.** It provides a tangible, unique, and highly engaging demonstration that stands out from purely software-based projects. Judges often appreciate the effort and creativity involved in bridging software with physical interaction. The "wow" factor of seeing a custom device interact with a blockchain is high.

However, it also **complicates the entry** by introducing additional layers of debugging (hardware, firmware, connectivity), potential physical setup issues, and a steeper learning curve if the team lacks embedded experience. Managing power, displays, inputs, and wireless communication adds complexity beyond typical web or desktop application development.

**What's the right level of hardware ambition for 2 weeks?**
The right level of hardware ambition for a two-week hackathon is to **leverage existing experience and off-the-shelf components to create a focused, functional demonstration.**

*   **Recommended Ambition:**
    *   **One central powerful embedded node:** Use a Raspberry Pi 5, NucBox, or N100 (as per `MEMORY.md`) to run the full Fiber node and game server. This is a known quantity and provides a stable backend.
    *   **One or two ESP32-S3 development boards as light clients:** Utilize readily available ESP32-S3 dev boards (e.g., LilyGo T-Display S3) for player interaction. This leverages the team's `ckb-light-esp` experience (`MEMORY.md`) and avoids the time sink of custom hardware design.
    *   **Focus on core interaction:** Implement a simple game loop and ensure robust, visible Fiber payment integration on the ESP32-S3 HUD. Prioritize functionality and clear demonstration over complex game mechanics or extensive graphics.
    *   **Hybrid Web Client:** Develop a functional hybrid web client that complements the hardware, allowing for easy monitoring and interaction even if the hardware is the primary focus.

*   **Avoid:**
    *   Custom PCB design or manufacturing.
    *   Complex 3D-printed enclosures (unless pre-designed and simple to print).
    *   Extensive multiplayer networking beyond simple client-server communication.
    *   A full, graphically intensive browser game.

This balanced approach allows the team to showcase the impressive aspects of hardware integration and Fiber payments without getting bogged down by overly ambitious hardware development, making it achievable and impactful within the hackathon timeframe.

### Gaps / Follow-up

*   **Detailed Game Design:** The specific game mechanics and how Fiber payments integrate into them are not detailed in the provided findings. This needs to be fleshed out to guide hardware and software development.
*   **Network Protocol:** The specific communication protocol between the ESP32-S3 light clients and the central Fiber node/game server (e.g., MQTT, WebSocket, custom UDP) is not specified. This will impact implementation complexity.
*   **Fiber Transaction Details:** While Fiber payments are mentioned, the specific Fiber APIs or SDKs to be used for integration (e.g., how to initiate, sign, and confirm transactions from the game logic) are not detailed.
*   **Multiplayer State Management:** For the impressive demo, how game state is synchronized and managed across multiple ESP32 clients and the central server needs further design.

### Relevant Code/API Snippets

Based on the simulated findings and `MEMORY.md`:

*   **ESP32 Light Client (Conceptual):**
    ```c++
    // Example using ckb-light-esp concepts for Fiber transactions
    #include <WiFi.h>
    #include <ckb_light_esp.h> // Assumed library for CKB light client on ESP32

    // ... WiFi setup ...

    void setup() {
      // ... display init ...
      // ... button init ...
      // Initialize CKB light client
      ckb_light_esp_init("remote_fiber_node_ip", 8114); // Connect to central Fiber node
    }

    void loop() {
      // ... game logic ...
      if (button_pressed_buy_item) {
        // Construct Fiber transaction (e.g., pay 100 shannons to game_contract_address)
        FiberTransaction tx = ckb_light_esp_create_tx(
            my_address, game_contract_address, 100, "item_purchase_data");

        // Sign and send transaction
        if (ckb_light_esp_send_tx(tx)) {
          display_update_hud("Item purchased! Fiber paid.");
        } else {
          display_update_hud("Fiber transaction failed.");
        }
      }
      // ... update game state from server ...
      // ... display Fiber balance from light client state ...
      display_update_fiber_balance(ckb_light_esp_get_balance(my_address));
    }
    ```

*   **Fiber Node / Game Server (Conceptual - Python/Node.js for game logic, Fiber RPC for blockchain):**
    ```python
    # Example using a conceptual Fiber RPC client for game server
    import requests
    import json

    FIBER_RPC_URL = "http://localhost:8114" # Or the Pi5/NucBox IP

    def get_fiber_balance(address):
        payload = {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "get_balance", # Hypothetical Fiber RPC method
            "params": [address]
        }
        response = requests.post(FIBER_RPC_URL, json=payload)
        return response.json().get("result")

    def send_fiber_transaction(from_addr, to_addr, amount, data):
        payload = {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "send_transaction", # Hypothetical Fiber RPC method
            "params": {
                "from": from_addr,
                "to": to_addr,
                "amount": amount,
                "data": data
            }
        }
        response = requests.post(FIBER_RPC_URL, json=payload)
        return response.json().get("result") # Returns transaction hash

    # ... Game server logic ...
    # When an ESP32 client requests an action requiring payment:
    # tx_hash = send_fiber_transaction(player_fiber_address, game_treasury_address, item_cost, "item_id_X")
    # if tx_hash:
    #    # Confirm transaction on blockchain, update game state
    #    pass
    ```