# Research: retroarch-core-blockchain

**Date:** 2026-03-04  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/libretro/RetroArch/master/libretro-common/include/libretro.h, https://raw.githubusercontent.com/RetroAchievements/rcheevos/master/README.md, https://raw.githubusercontent.com/nervosnetwork/fiber/main/README.md, https://raw.githubusercontent.com/nervosnetwork/fiber/main/docs/architecture.md

---

## Research Note: retroarch-core-blockchain

**Date:** 2026-03-04

### Summary
This research explores the feasibility of integrating blockchain-native features into retro games via the libretro/RetroArch core API. The libretro API provides robust hooks for game state access (`retro_get_memory_data`), input polling, and audio/video callbacks, enabling custom logic injection. While the API itself does not support network calls, a core could embed a CKB light client (like Fiber Network Node) by linking external libraries, requiring careful threading management. The Fiber Network is designed for sub-second micropayments, which could facilitate in-game transactions. RetroAchievements' approach to event detection, relying on memory inspection, offers a viable pattern for token triggers and on-chain leaderboards, though the practical UX of NFT minting from game events is not detailed in the provided content.

### 1. Full libretro core API surface: retro_run(), retro_serialize(), input polling, audio/video callbacks — what hooks exist for custom logic injection?

The `libretro.h` API provides a comprehensive set of functions and callbacks for custom logic injection within a core:

*   **Core Lifecycle and Main Loop:**
    *   `RETRO_API void retro_init(void)`: Called once upon core loading. Ideal for initial setup.
    *   `RETRO_API void retro_deinit(void)`: Called once upon core unloading. Ideal for cleanup.
    *   `RETRO_API void retro_run(void)`: The main emulation loop, called once per frame. This is the primary hook for game logic, state updates, and rendering.
    *   `RETRO_API void retro_load_game(const struct retro_game_info *game)`: Called to load a game.
    *   `RETRO_API void retro_unload_game(void)`: Called to unload a game.
    *   `RETRO_API void retro_reset(void)`: Resets the current game.
*   **State Management:**
    *   `RETRO_API size_t retro_serialize_size(void)`: Returns the size of the save state buffer.
    *   `RETRO_API bool retro_serialize(void *data, size_t size)`: Serializes the core's internal state to a buffer.
    *   `RETRO_API bool retro_unserialize(const void *data, size_t size)`: Deserializes the core's internal state from a buffer.
*   **Input Polling:**
    *   `RETRO_API void retro_set_input_poll(retro_input_poll_t cb)`: Sets a callback for input polling. The core calls this callback to signal that it's ready to poll input.
    *   `RETRO_API void retro_set_input_state(retro_input_state_t cb)`: Sets a callback to query input state. The core uses this callback (e.g., `cb(port, device, index, id)`) to check if a button is pressed or an axis moved.
    *   Input device types are defined (e.g., `RETRO_DEVICE_JOYPAD`, `RETRO_DEVICE_KEYBOARD`, `RETRO_DEVICE_MOUSE`).
*   **Audio/Video Callbacks:**
    *   `RETRO_API void retro_set_video_refresh(retro_video_refresh_t cb)`: Sets a callback for video output. The core calls this (e.g., `cb(data, width, height, pitch)`) to render a frame.
    *   `RETRO_API void retro_set_audio_sample(retro_audio_sample_t cb)`: Sets a callback for single audio samples.
    *   `RETRO_API void retro_set_audio_sample_batch(retro_audio_sample_batch_t cb)`: Sets a callback for batches of audio samples.
*   **Environment and Configuration:**
    *   `RETRO_API void retro_set_environment(retro_environment_t cb)`: Sets a callback for environment queries and commands. This is a critical hook for core-frontend communication, allowing the core to request services (e.g., `RETRO_ENVIRONMENT_GET_SYSTEM_DIRECTORY`, `RETRO_ENVIRONMENT_GET_SAVE_DIRECTORY`, `RETRO_ENVIRONMENT_SET_VARIABLES`, `RETRO_ENVIRONMENT_SET_MESSAGE`).
*   **Memory Access:**
    *   `RETRO_API void *retro_get_memory_data(unsigned id)`: Returns a pointer to a specific memory region (e.g., `RETRO_MEMORY_SAVE_RAM`, `RETRO_MEMORY_SYSTEM_RAM`, `RETRO_MEMORY_VIDEO_RAM`, `RETRO_MEMORY_ROM`).
    *   `RETRO_API size_t retro_get_memory_size(unsigned id)`: Returns the size of the specified memory region.

### 2. RetroAchievements technical implementation: how does rcheevos library detect game events? Same pattern usable for token triggers?

The `rcheevos` library itself does *not* directly detect game events from memory. Instead, it processes achievement data based on game state *provided by the client (emulator)*. The `rcheevos/README.md` states: "Clients must get data from RetroAchievements, and pass the response down to **rcheevos** for processing."

The core mechanism for an emulator to expose game state for event detection would be through the `libretro.h` API functions:
*   `RETRO_API void *retro_get_memory_data(unsigned id)`
*   `RETRO_API size_t retro_get_memory_size(unsigned id)`

An emulator (or a wrapper around a libretro core) would:
1.  Read specific memory regions (e.g., `RETRO_MEMORY_SYSTEM_RAM`) at regular intervals (e.g., every `retro_run()` call).
2.  Apply achievement logic (defined by `rcheevos`) to the values read from memory.
3.  Trigger events (e.g., achievement unlocked) when the conditions are met.

**Yes, this pattern is entirely usable for token triggers.** A custom libretro core, or a system interacting with it, could:
1.  Define specific memory addresses or patterns that correspond to in-game events (e.g., player collects a certain item, reaches a score threshold, defeats a boss).
2.  Use `retro_get_memory_data()` to access the game's memory.
3.  Implement logic (similar to how `rcheevos` processes achievement definitions) to detect these events by monitoring memory values.
4.  Upon event detection, trigger a token earning or NFT minting action.

### 3. Can a libretro core make network calls (HTTP/WebSocket) from within retro_run()? Threading model?

The `libretro.h` API does **not** provide any direct hooks or functions for making network calls (HTTP/WebSocket). The API is designed as a minimal abstraction layer between the game/emulator logic and the frontend.

A libretro core *could* incorporate network functionality by:
1.  **Linking external networking libraries:** The core could link against standard C/C++ networking libraries (e.g., `libcurl` for HTTP, `libwebsocket` or raw sockets).
2.  **Managing threading:** Performing blocking network calls directly within `retro_run()` would halt the emulation loop, leading to severe performance issues and unresponsiveness. Therefore, any network operations would need to be:
    *   **Asynchronous/Non-blocking:** Using non-blocking I/O.
    *   **Offloaded to a separate thread:** The core would spawn a dedicated thread for network communication, sending requests and receiving responses without blocking `retro_run()`. The `libretro.h` API itself does not define a threading model, so the core would be responsible for its own internal threading implementation (e.g., using `pthreads` or `std::thread`).

The `rcheevos/README.md` explicitly reinforces this by stating: "**rcheevos** does *not* provide HTTP network connections. Clients must get data from RetroAchievements, and pass the response down to **rcheevos** for processing." This indicates that network communication is expected to be handled by the frontend or an external client, not the core itself.

### 4. What's the minimal libretro core that compiles for ARM (R36S/Batocera) — could our CKB light client be the network layer inside a core?

The `libretro.h` header defines the API interface, not the implementation details of a minimal core or specific compilation targets. However, the API is written in standard C/C++, making it highly portable. Any core implementing these functions can be compiled for ARM (e.g., for R36S/Batocera) as long as its internal logic and any linked dependencies are also cross-compilable for ARM. The `RETRO_CALLCONV` and `RETRO_API` macros in `libretro.h` demonstrate the API's design for cross-platform compatibility.

**Yes, a CKB light client *could* technically be the network layer inside a libretro core.**
1.  **Integration:** The CKB light client (e.g., a stripped-down version of the Fiber Network Node, FNN) would need to be compiled as a static or dynamic library that the libretro core links against.
2.  **Language Interoperability:** The FNN is written in Rust (`cargo build --release`). A C/C++ libretro core would need to use Foreign Function Interface (FFI) to interact with the Rust-based light client.
3.  **Resource Management:** Embedding a full "reference node implementation" like FNN might be too resource-intensive for a minimal core or constrained ARM device. A true "light client" with minimal dependencies and memory footprint would be more suitable.
4.  **Threading:** As discussed in Q3, the light client's network operations would need to run in a separate thread or use non-blocking I/O to avoid blocking the `retro_run()` emulation loop.
5.  **API Surface:** The core would expose its blockchain-related functionality (e.g., payment requests, asset queries) through the `retro_set_environment` callback, allowing the frontend to interact with the embedded light client.

The FNN README mentions "Web-browser friendly runtime" as a TODO, which suggests future efforts towards lighter-weight or WASM-compatible clients, potentially making integration into constrained environments easier.

### 5. Fiber Network payment flow for games: what does a sub-second micropayment look like in code? Invoice → pay → confirm in <1s?

The `fiber/README.md` explicitly states that Fiber Network is designed for "Extremely low-cost micropayments, e.g. 0.0001 cent payment with 0.00000001 cent fee" and "Low latency, e.g. 0.0001 cent payment in your p2p connection latency, e.g. 20ms". This confirms the network's capability for sub-second micropayments.

However, the provided content **does not contain specific code snippets** illustrating the "Invoice → pay → confirm" flow. It refers to external documentation:
*   "[Invoice Protocol](./docs/specs/payment-invoice.md)"
*   "[RPC Documentation](./crates/fiber-lib/src/rpc/README.md)"

These documents would likely detail the API calls and data structures involved in generating an invoice, initiating a payment, and confirming its completion. Without access to these specific documents, a code-level description of the payment flow cannot be provided from the given content. The high-level features mentioned are:
*   Establishing connections with other fiber nodes.
*   Creating and closing fiber channels.
*   Payments over fiber channel (via `fiber-scripts`).

### 6. Existing blockchain game projects on RetroArch or similar — any prior art?

Based **solely on the provided content**, there is **no mention** of existing blockchain game projects on RetroArch or similar platforms. The `libretro.h` describes the core API, `rcheevos/README.md` details an achievement system, and `fiber/README.md` introduces a payment network, none of which discuss existing blockchain game integrations.

### 7. DOB minting from a game event: latency, UX, what does "item found = NFT minted" feel like in practice?

The provided content **does not describe the latency, user experience (UX), or practical feel** of "item found = NFT minted."

While the `libretro.h` API provides the technical means to detect game events (e.g., by monitoring `retro_get_memory_data` for changes in inventory or score), and the Fiber Network supports "Multiple assets support, e.g. stable coins, RGB++ assets issued on Bitcoin ledger, and UDT assets issued on CKB ledger" (which could include Digital Objects on Bitcoin, DOBs), the integration and user experience of triggering an NFT mint from such an event are not detailed.

To understand the practical feel, one would need to consider:
*   **Latency:** The time taken for the game event to be detected, the minting transaction to be initiated, processed by the blockchain, and confirmed. Fiber Network aims for 20ms payment latency, but minting an NFT on a blockchain (even a fast one like CKB) would involve more steps and potentially higher latency than a simple channel payment.
*   **UX Feedback:** How the game communicates the minting process to the player (e.g., in-game notifications, progress bars, sound effects).
*   **Wallet Integration:** How the player's wallet is involved in signing or confirming the minting transaction, and whether this is seamless or disruptive to gameplay.

### 8. Legal/IP considerations: retro game ROMs + blockchain = two complicated areas. Custom cores with original content sidestep this entirely.

The provided source content (`libretro.h`, `rcheevos/README.md`, `fiber/README.md`) **does not contain any information regarding legal or intellectual property (IP) considerations.** These documents are purely technical specifications and descriptions of software libraries.

The statement "Custom cores with original content sidestep this entirely" is a premise provided in the research question itself, rather than an answer derivable from the source material.

### Gaps / Follow-up
*   **Fiber Network RPC and Invoice Protocol:** The `fiber/README.md` refers to `docs/specs/payment-invoice.md` and `crates/fiber-lib/src/rpc/README.md`. Accessing these documents would be crucial to understand the code-level details of payment flows (invoice generation, payment initiation, confirmation) and asset management.
*   **RetroAchievements Developer Docs:** The `rcheevos/README.md` mentions `https://docs.retroachievements.org/developer-docs/`. This would provide deeper insight into how achievement logic is defined and processed, which is directly relevant to designing token triggers.
*   **CKB Light Client Details:** Further research into the specific architecture and resource requirements of a CKB light client (beyond the FNN reference node) would be needed to assess its feasibility for embedding within a constrained libretro core.
*   **FFI for Rust/C Interop:** If using the Rust-based Fiber Network Node, understanding the specifics of Rust-to-C FFI for embedding would be necessary.
*   **Practical NFT Minting UX:** Research into existing blockchain games or prototypes that mint NFTs from in-game events would provide valuable insights into latency, user feedback, and wallet integration challenges.

### Relevant Code/API Snippets

**Libretro Core API Hooks (from `libretro.h`):**

```c
// Main emulation loop
RETRO_API void retro_run(void);

// Input polling callback setup
RETRO_API void retro_set_input_poll(retro_input_poll_t cb);
RETRO_API void retro_set_input_state(retro_input_state_t cb);

// Video refresh callback setup
RETRO_API void retro_set_video_refresh(retro_video_refresh_t cb);

// Audio sample callbacks setup
RETRO_API void retro_set_audio_sample(retro_audio_sample_t cb);
RETRO_API void retro_set_audio_sample_batch(retro_audio_sample_batch_t cb);

// Environment callback for core-frontend communication
RETRO_API void retro_set_environment(retro_environment_t cb);

// Memory access for game state inspection (e.g., for token triggers)
RETRO_API void *retro_get_memory_data(unsigned id);
RETRO_API size_t retro_get_memory_size(unsigned id);

// Memory types for retro_get_memory_data/size()
#define RETRO_MEMORY_SAVE_RAM 0
#define RETRO_MEMORY_RTC 1
#define RETRO_MEMORY_SYSTEM_RAM 2
#define RETRO_MEMORY_VIDEO_RAM 3
#define RETRO_MEMORY_ROM 4
```

**rcheevos Game Identification (from `rcheevos/README.md`):**

```c
// Functions for generating a RetroAchievements hash for a game
void rc_hash_initialize_iterator(rc_hash_iterator_t* iterator, const char* path, const uint8_t* buffer, size_t buffer_size);
int rc_hash_generate(char hash[33], uint32_t console_id, const rc_hash_iterator_t* iterator);
int rc_hash_iterate(char hash[33], rc_hash_iterator_t* iterator);
void rc_hash_destroy_iterator(rc_hash_iterator_t* iterator);
```

**Fiber Network Node Build Command (from `fiber/README.md`):**

```bash
cargo build --release
```