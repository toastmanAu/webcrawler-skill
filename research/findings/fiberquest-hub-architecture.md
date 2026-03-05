# Research: fiberquest-hub-architecture

**Date:** 2026-03-05  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/nervosnetwork/fiber/main/README.md, https://gbdev.io/pandocs/Serial_Data_Transfer_(Link_Cable).html, https://raw.githubusercontent.com/libretro/RetroArch/master/command.h, https://raw.githubusercontent.com/espressif/esp-idf/master/components/driver/spi/README.md

---

## Research Note: fiberquest-hub-architecture

**Date:** 2026-03-05

### Summary
The FiberQuest Hub aims to be a central multiplayer device for retro consoles, integrating Fiber payments. The Fiber Network Protocol (FNP) provides low-cost, instant micropayments and asset swaps, suitable for in-game transactions. For real hardware consoles, the hub would need to act as a protocol bridge, translating native console link protocols (e.g., Game Boy's serial transfer) between devices. However, for emulated environments, RetroArch's built-in Netplay functionality offers a software-based multiplayer solution, simplifying the hub's role to primarily managing payments. A hybrid approach supporting both real hardware and RetroArch Netplay seems feasible, with the Fiber payment integration likely involving the hub running a lightweight Fiber Network Node or interacting with a separate node.

### 1. Physical design: what does it look like? A box with N console controller ports + WiFi + small display? Or a dongle that plugs into one console and connects others via wireless?

Based on the goal of acting as a "central multiplayer hub for retro consoles," a **box with N console controller ports + WiFi + small display** is the more fitting physical design.

*   **Central Hub Role:** A box form factor inherently suggests a central point of connection for multiple devices.
*   **Multiple Ports:** To support "N console controller ports," a box would provide the necessary physical space and interfaces for various retro console link cables (e.g., Game Boy link ports, SNES multiplayer adapters, etc.).
*   **WiFi:** Essential for connecting to the Fiber network and potentially for wireless communication between hubs or to other devices (e.g., a payment server, or even wirelessly linked consoles if a custom wireless protocol is implemented).
*   **Small Display:** Useful for displaying payment information, connection status, player scores, or other game-related data, enhancing the user experience.
*   **Dongle Limitation:** A dongle plugging into a single console would primarily serve that console, making it less suitable as a "central multiplayer hub" for *multiple* distinct consoles. It would also likely lack the processing power and I/O for bridging multiple console types simultaneously.

### 2. Protocol bridge: how does it translate between console A's native protocol and console B's native protocol in real time? Does it need to re-implement the game's multiplayer logic, or just relay signals?

The hub would need to **re-implement the game's multiplayer logic at a low level, or at least understand and synchronize the game state, rather than just blindly relaying signals**. Simply relaying raw signals between different console protocols is insufficient because:

*   **Protocol Differences:** As exemplified by the Game Boy's "Serial Data Transfer (Link Cable)" documentation, console link protocols are often low-level, byte-oriented, and specific to the hardware's timing and register access (`FF01 — SB`, `FF02 — SC`). Different consoles have entirely different link protocols (e.g., Game Boy serial vs. SNES joypad polling).
*   **Master/Slave Dynamics:** The Game Boy link cable explicitly defines a "master" (internal clock) and "slave" (external clock) relationship. A hub connecting two Game Boys would need to mediate this, potentially acting as the "master" to both or synchronizing their "master" states.
*   **Game State Synchronization:** Multiplayer retro games often rely on precise timing and shared state. The hub would need to interpret the data being exchanged (e.g., player inputs, game state updates) and translate it into the format expected by the other console, ensuring both consoles remain in sync. This is more complex than a simple electrical signal relay.
*   **Emulation Layer:** Effectively, the hub would need to act as a lightweight emulator or hardware abstraction layer for each connected console's link port, receiving data from one, processing it, and then sending the appropriate data to the other(s) in their native format and timing. This would involve understanding the game's communication patterns, not just the raw electrical signals.

The provided content, specifically the Game Boy serial transfer documentation, details the byte-level communication and master/slave roles, reinforcing the complexity of direct protocol translation without understanding the data's context.

### 3. The key insight — if RetroArch is involved, we don't need to emulate hardware protocols at all! We can use RetroArch Netplay (software) + our sidecar for payments. The hardware hub becomes relevant only for REAL hardware consoles. Which approach is better for the hackathon?

For a hackathon, the **RetroArch Netplay (software) + sidecar for payments approach is significantly better and more feasible.**

*   **Reduced Complexity:** Implementing hardware protocol bridging for real consoles (like the Game Boy link cable, which involves byte-level shifting, master/slave clocking, and synchronization) is a substantial engineering challenge, especially for multiple console types. RetroArch Netplay abstracts this away.
*   **Leverages Existing Solutions:** RetroArch already provides robust Netplay functionality, as evidenced by `command.h` (`CMD_EVENT_NETPLAY_INIT`, `CMD_EVENT_NETPLAY_ENABLE_HOST`, etc.). This means the core multiplayer synchronization is handled by a mature, well-tested system.
*   **Focus on Core Innovation:** By using RetroArch, the hackathon team can focus their limited time and resources on the unique value proposition: integrating Fiber payments. This allows for a clearer demonstration of the "Fiber payments" aspect without getting bogged down in low-level hardware emulation.
*   **Easier Demo:** Setting up two RetroArch instances (e.g., on PCs or Raspberry Pis) and demonstrating Netplay with integrated payments is much quicker and less prone to hardware issues than debugging custom hardware interfaces for multiple retro consoles.

The hardware hub for *real* hardware consoles is a much more ambitious long-term goal.

### 4. Hybrid approach: hub supports BOTH — real hardware consoles via native protocols AND RetroArch via Netplay/UDP — same payment layer underneath.

Yes, a hybrid approach is **definitely possible and desirable for commercial viability**, though significantly more complex to implement than either approach alone.

*   **Unified Payment Layer:** The "same payment layer underneath" is the key. The Fiber Network Node (FNN) described in the `README.md` is a software implementation of the Fiber Network Protocol. This FNN can run on various devices (e.g., the ESP32-P4/S3 hub, a Raspberry Pi, a PC). The payment logic (e.g., creating invoices, handling micropayments) would be abstracted from the game's input/output.
*   **Modular Design:** The hub would need distinct modules:
    *   **Hardware Protocol Adapters:** For each supported real console (e.g., a Game Boy link cable interface, an SNES controller port interface). These would translate native console I/O into a standardized internal data format.
    *   **RetroArch Netplay Client/Server:** A software component that can connect to or host RetroArch Netplay sessions, receiving/sending game state updates via UDP (as implied by Netplay).
    *   **Game Logic/Synchronization Layer:** A central component that receives inputs from either hardware adapters or Netplay, applies game-specific logic (if necessary for synchronization), and dispatches outputs.
    *   **Fiber Payment Integration:** This layer would interact with the FNN to manage payments, potentially triggered by game events (e.g., "pay to play," "pay for power-up," "winner takes all").

The challenge lies in the "real hardware consoles via native protocols" part, which requires significant hardware and firmware development for each console type. The ESP32-P4/S3's capabilities (e.g., multiple SPI/UART interfaces, sufficient GPIOs) would be crucial for this, but the specific details of its SPI driver were not available in the provided `esp-idf` link.

### 5. What does the Fiber payment integration look like at the hub level? Hub has its own Fiber node? Or connects to a Pi? Hub holds the escrow?

The Fiber payment integration at the hub level could take a few forms, with the hub potentially having its own Fiber node or connecting to a separate one.

*   **Hub has its own Fiber node (FNN):**
    *   **Feasibility:** The `fnn` (Fiber Network Node) is described as a "reference node implementation" and can be built and run from source (`cargo build --release`). While the `README.md` shows `fnn` running on a typical Linux-like environment (using `cargo`, `mkdir`, `cp`, `ckb-cli`), a sufficiently powerful ESP32-P4/S3 (especially with enough RAM and storage) *might* be able to run a stripped-down version or a client library that interacts with a full FNN. However, running a full Rust-based FNN directly on an ESP32 might be resource-intensive.
    *   **Advantages:** Self-contained, lower latency for payment interactions, potentially more robust if network connectivity to an external node is intermittent.
    *   **Disadvantages:** Higher resource requirements for the ESP32, more complex firmware.

*   **Hub connects to a Pi (or other external device) running a Fiber node:**
    *   **Feasibility:** The hub would act as a client, communicating with the FNN running on a more powerful device like a Raspberry Pi. This communication could happen over WiFi (HTTP/RPC) or a wired connection. The `README.md` mentions "RPC Documentation" (`crates/fiber-lib/src/rpc/README.md`), indicating an API for interacting with the FNN.
    *   **Advantages:** Simplifies the hub's firmware, offloads heavy processing to the Pi, allows the Pi to manage multiple hubs or other services.
    *   **Disadvantages:** Introduces an additional point of failure (the Pi), higher latency for payment requests if the connection is slow.

*   **Hub holds the escrow:**
    *   The Fiber Network Protocol uses "channels" for payments, similar to Lightning Network. Funds are locked into these channels. The `fnn` documentation mentions "Creating and closing fiber channel" and "Payments over fiber channel (via [fiber-scripts])".
    *   If the hub runs its own FNN, then **yes, the hub (specifically, its FNN instance) would manage the local side of the payment channels and thus effectively hold the escrow funds** within its wallet (`ckb/key` and `fiber/store` as per the `README.md`).
    *   If the hub connects to an external FNN on a Pi, then the Pi's FNN would hold the escrow. The hub would merely initiate payment requests.

Given the resource constraints of an ESP32, connecting to an external Pi running the FNN is likely the more practical approach for a robust implementation, with the hub sending RPC calls to the Pi for payment initiation and status.

### 6. Minimum viable hub for hackathon demo: what's the simplest hardware that proves the concept? One SNES with two controllers? Two Game Boys linked wirelessly? Two RetroArch instances + sidecar?

The simplest hardware that proves the concept for a hackathon demo is **Two RetroArch instances + sidecar (running the Fiber Network Node).**

*   **RetroArch Instances:** Can be two laptops, two Raspberry Pis, or even two instances on the same powerful PC. This immediately solves the complex hardware protocol bridging.
*   **Sidecar for Payments:** A separate device (e.g., a Raspberry Pi, or even a laptop) running the `fnn` (Fiber Network Node) as described in the `README.md`. This sidecar would handle the actual Fiber payment logic.
*   **ESP32-P4/S3 Role (Optional but Recommended):** The ESP32-P4/S3 could act as the "hub" in this scenario, but its role would be simplified:
    *   It could host a web interface or a simple display for payment requests/status.
    *   It could communicate with the RetroArch instances (e.g., via UDP/TCP to send commands like `CMD_EVENT_NETPLAY_INIT_DIRECT` or receive game events).
    *   It would communicate with the Fiber Network Node sidecar (e.g., via HTTP/RPC) to initiate and confirm payments.

This setup allows the team to demonstrate:
1.  RetroArch Netplay for multiplayer.
2.  Integration with the Fiber Network for micropayments.
3.  The concept of a "hub" coordinating these elements, even if the hub itself isn't doing direct hardware console bridging.

### 7. What would make this commercially viable after the hackathon? Build-to-order? Open hardware? License the protocol?

To make this commercially viable after the hackathon, a multi-faceted approach combining elements of **open hardware, licensing, and a strong ecosystem** would be most effective:

1.  **Open Hardware / Modular Design:**
    *   **Concept:** Release the hardware designs (schematics, PCB layouts) for the ESP32-P4/S3 hub as open hardware. This allows enthusiasts and smaller manufacturers to build their own.
    *   **Viability:** Reduces R&D costs for the core team, fosters community contributions (e.g., support for new consoles), and creates a broader user base. The core team could then focus on selling pre-assembled, higher-quality units or specialized versions.
    *   **Example:** Similar to projects like MiSTer FPGA, where the core is open but commercial boards are sold.

2.  **License the Protocol / Software (FiberQuest Hub OS):**
    *   **Concept:** While Fiber Network Protocol itself is open, the "FiberQuest Hub OS" (the firmware running on the ESP32 and the integration logic) could be licensed. This would include the console protocol bridging implementations and the payment integration layer.
    *   **Viability:** Allows for revenue generation from larger manufacturers or game developers who want to integrate FiberQuest functionality into their own products or services. This could be a per-device license or a subscription for updates/support.

3.  **Build-to-Order (Initial Phase):**
    *   **Concept:** In the early stages, offering build-to-order units (or small batch manufacturing) allows for direct sales to early adopters and enthusiasts.
    *   **Viability:** Lowers initial investment in inventory, provides direct customer feedback, and helps refine the product before scaling.

4.  **Ecosystem Development:**
    *   **Concept:** This is crucial. Commercial viability hinges on more than just the hardware. It needs:
        *   **Game Integrations:** Tools or SDKs for game developers (or modders) to easily integrate Fiber payments into their retro games (or emulated versions).
        *   **Content Marketplace:** A platform where users can discover and pay for game content, tournaments, or unique experiences using Fiber.
        *   **Community Support:** Active forums, documentation, and tutorials to help users and developers.
        *   **Watchtower Services:** As mentioned in the Fiber `README.md`, watchtower support is a feature. Offering reliable watchtower services for a fee could be a revenue stream.
        *   **Liquidity Provision:** Facilitating channel liquidity for Fiber payments could also be a service.

A combination of open hardware to build a community, licensed software/protocol for broader adoption, and a strong ecosystem around Fiber payments for retro gaming would provide the most robust path to commercial viability.

### Gaps / Follow-up

1.  **ESP32-P4/S3 Specifics:** The `esp-idf/components/driver/spi/README.md` link resulted in a 404 error. This means specific details about the ESP32-P4/S3's SPI capabilities, number of available SPI/UART interfaces, and general I/O performance for low-level hardware protocol bridging are missing. This is critical for assessing the feasibility of the "real hardware consoles" approach.
2.  **Fiber Network Node on ESP32:** The `fnn` is a Rust project. While ESP-IDF supports Rust, running a full `fnn` binary on an ESP32-P4/S3 might be too resource-intensive (RAM, storage, CPU). Further research is needed into:
    *   Memory footprint and CPU requirements of `fnn`.
    *   Availability of a lightweight Fiber client library (e.g., in C/C++ or a stripped-down Rust version) suitable for embedded systems.
    *   Storage requirements for `fiber/store` and `ckb/key` on an ESP32.
3.  **RetroArch Netplay Protocol:** While `command.h` lists Netplay commands, the underlying network protocol (UDP/TCP, data format, synchronization mechanisms) is not detailed. Understanding this would be crucial for the ESP32 hub to interact directly with RetroArch instances without running a full RetroArch core itself.
4.  **Retro Console Protocol Details:** Beyond the Game Boy link cable, specific details for other retro console multiplayer protocols (SNES, Genesis, N64, etc.) are needed to design the hardware bridging modules.
5.  **User Interface (Display):** How would the small display be integrated? What kind of display (e.g., OLED, small LCD)? What UI framework would be used on the ESP32?

### Relevant Code/API Snippets

**Fiber Network Node (FNN) - `README.md`**

*   **Building and Running FNN:**
    ```bash
    cargo build --release
    mkdir /folder-to/my-fnn
    cp target/release/fnn /folder-to/my-fnn
    cp config/testnet/config.yml /folder-to/my-fnn
    cd /folder-to/my-fnn
    mkdir ckb
    head -n 1 ./ckb/exported-key > ./ckb/key
    FIBER_SECRET_KEY_PASSWORD='YOUR_PASSWORD' RUST_LOG='info' ./fnn -c config.yml -d .
    ```
*   **Key Features:**
    *   "Multiple assets support"
    *   "Extremely low-cost micropayments, e.g. 0.0001 cent payment with 0.00000001 cent fee"
    *   "Instant swap between any asset pairs"
    *   "Low latency, e.g. 0.0001 cent payment in your p2p connection latency, e.g. 20ms"
*   **Documentation References:**
    *   "[RPC Documentation](./crates/fiber-lib/src/rpc/README.md)"
    *   "[P2P Message Protocol](./docs/specs/p2p-message.md)"
    *   "[Invoice Protocol](./docs/specs/payment-invoice.md)"

**Game Boy Serial Data Transfer - `gbdev.io/pandocs/Serial_Data_Transfer_(Link_Cable).html`**

*   **Serial Data Register:**
    *   `FF01 — SB: Serial transfer data`
    *   "Before a transfer, it holds the next byte that will go out. During a transfer, it has a blend of the outgoing and incoming bytes."
*   **Serial Control Register:**
    *   `FF02 — SC: Serial transfer control`
    *   Bit 7: `Transfer enable` (1 = requested/in progress)
    *   Bit 1: `Clock speed` (CGB only, 1 = high speed)
    *   Bit 0: `Clock select` (0 = External/slave, 1 = Internal/master)
*   **Master/Slave Operation:**
    *   "The master Game Boy will load up a data byte in SB and then set SC to $81 (Transfer requested, use internal clock)."
    *   "The other Game Boy will load up a data byte and has to set SC’s Bit 7 (that is, SC=$80) to enable the serial port."
*   **Clock Frequencies (CGB Mode):**
    *   `8192 Hz` (1 KB/s) - Bit 1 cleared, Normal speed
    *   `524288 Hz` (64 KB/s) - Bit 1 set, Double-speed Mode

**RetroArch Netplay - `libretro/RetroArch/master/command.h`**

*   **Netplay Commands:**
    ```c
    enum event_command {
        // ...
        CMD_EVENT_NETWORK_INIT,
        CMD_EVENT_NETPLAY_INIT,
        CMD_EVENT_NETPLAY_INIT_DIRECT,
        CMD_EVENT_NETPLAY_INIT_DIRECT_DEFERRED,
        CMD_EVENT_NETPLAY_DEINIT,
        CMD_EVENT_NETPLAY_GAME_WATCH,
        CMD_EVENT_NETPLAY_PLAYER_CHAT,
        CMD_EVENT_NETPLAY_FADE_CHAT_TOGGLE,
        CMD_EVENT_NETPLAY_ENABLE_HOST,
        CMD_EVENT_NETPLAY_DISCONNECT,
        CMD_EVENT_NETPLAY_PING_TOGGLE,
        CMD_EVENT_NETPLAY_HOST_TOGGLE,
        // ...
    };
    ```
*   **Default Netplay Port:**
    ```c
    #define DEFAULT_NETWORK_CMD_PORT 55355
    ```