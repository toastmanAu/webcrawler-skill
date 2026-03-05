# Research: fiberquest-web-client

**Date:** 2026-03-05  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://web.libretro.com/, https://raw.githubusercontent.com/libretro/RetroArch/master/pkg/emscripten/README.md, https://raw.githubusercontent.com/ckb-ecell/ckb-ccc/main/README.md, https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/README.md

---

## Research Topic: fiberquest-web-client

### Summary
Building a web-based FiberQuest client involves integrating a WebAssembly-compiled RetroArch with Fiber payments. The RetroArch Web Player is feasible for in-browser gameplay, but its network control interface (UDP port 55355) and direct emulator memory access via WASM exports are not detailed in the provided documentation. For Fiber payments, the Fiber Network Node RPC offers comprehensive channel and payment management methods, but a browser-compatible JavaScript SDK is not explicitly mentioned, nor is direct WebSocket connectivity from a browser confirmed, though JSON-RPC often supports it. The ideal flow of a fully in-browser game with direct wallet integration and per-event payments is conceptually possible given the components, but specific browser-side SDKs and integration details are missing. A fallback web dashboard showing live Fiber payment activity, while the game runs natively, appears more immediately achievable by querying the Fiber RPC. WebRTC for P2P game state sync is not mentioned in the provided content.

### Questions to Answer

#### 1. WebAssembly RetroArch — RetroArch has a web player (https://web.libretro.com/), does it expose the network control interface (UDP port 55355) to JavaScript? Or can we access emulator memory via WASM exports?

*   **Network Control Interface (UDP port 55355):** The provided content, specifically the `RetroArch Web Player README.md`, details how to compile RetroArch for Emscripten and run it in a browser, including options for threading and WebGL. However, it **does not mention or expose any network control interface like UDP port 55355 to JavaScript**. The documentation focuses on the compilation process, asset management, and web server setup, not external programmatic control or network communication for features like Netplay.
*   **Access Emulator Memory via WASM Exports:** The `README.md` describes the output of the Emscripten compilation as `.js` and `.wasm` files (e.g., `fceumm_libretro.js`, `fceumm_libretro.wasm`). This implies standard WebAssembly module interaction. While WebAssembly allows for memory access and exports, the provided documentation **does not explicitly detail specific WASM exports for direct emulator memory access from JavaScript** for external control or manipulation. It describes compile-time settings like `HAVE_THREADS`, `PROXY_TO_PTHREAD`, `HAVE_OPENGLES3`, but these relate to internal RetroArch functionality and performance within the browser environment, not external API exposure for memory.

#### 2. CKB/Fiber in the browser — CCC (CKBer's Codebase) already runs in browser. Does Fiber have a browser-compatible JS SDK? Can we connect to a Fiber node via WebSocket from a browser?

*   **CCC (CKBer's Codebase) in browser:** The provided link for `ckb-ccc/README.md` resulted in a `FETCH ERROR: HTTP Error 404: Not Found`. Therefore, **it cannot be confirmed from the provided content whether CCC already runs in the browser.**
*   **Fiber browser-compatible JS SDK:** The `Fiber Network Node RPC README.md` describes the RPC module and its various methods for interacting with a Fiber Network Node (FNN), covering channel management, payments, invoices, and peer connectivity. However, **the provided content does not mention or describe a specific browser-compatible JavaScript SDK for Fiber.** The documentation focuses on the RPC interface itself, which is language-agnostic.
*   **Connect to a Fiber node via WebSocket from a browser:** The `Fiber Network Node RPC README.md` refers to a "JSON-RPC port" and warns about the security implications of exposing `rpc.listening_addr`. JSON-RPC can be implemented over various transports, including HTTP and WebSockets. While the document describes the RPC methods, **it does not explicitly state whether the Fiber node's RPC supports WebSocket connections or if such connections are intended to be made directly from a browser.** The security warning implies a network connection, but the specific protocol and browser compatibility (e.g., CORS implications) are not detailed.

#### 3. The ideal web flow: open browser → connect JoyID wallet → game loads in browser tab → Fiber channel opens → play with per-event payments → channel settles → done. No installation required.

*   **Open browser → game loads in browser tab:** This part is directly supported by the RetroArch Web Player, as demonstrated by `https://web.libretro.com/` and detailed in the `RetroArch Web Player README.md` for compiling and serving the emulator in a browser.
*   **Connect JoyID wallet:** **JoyID wallet is not mentioned in any of the provided content.** Therefore, its integration into this flow cannot be assessed based on the given information.
*   **Fiber channel opens → play with per-event payments → channel settles:** The Fiber Network Node RPC (`fiber/main/crates/fiber-lib/src/rpc/README.md`) provides the necessary backend methods for managing channels and payments:
    *   `channel-open_channel`: To open a channel.
    *   `channel-update_channel`: To update channel state, potentially for per-event payments.
    *   `payment-send_payment`: To send payments.
    *   `channel-shutdown_channel`: To settle/close a channel.
    If a browser-based client can connect to the Fiber RPC (see Q2), these operations could theoretically be initiated from the browser. However, the specific client-side integration (e.g., how the browser app would sign transactions or interact with a wallet) is not covered.
*   **No installation required:** For the game, the RetroArch Web Player aims for this. For Fiber, a Fiber node would still need to be running somewhere (local or remote), which would require installation of the node itself, even if the browser client requires no installation.

#### 4. Fallback: web DASHBOARD only (no in-browser game) — browser shows live channel balance, payment feed, game state while RetroArch runs natively. This is simpler and more achievable.

*   **Browser shows live channel balance, payment feed:** This is achievable by having a web page connect to and query the Fiber Network Node RPC. The RPC provides methods such as:
    *   `channel-list_channels`: To get information about open channels, which would include balances.
    *   `payment-get_payment`: To retrieve payment details.
    *   `info-node_info`: To get general node information.
    If the browser can establish a connection to the Fiber RPC (e.g., via HTTP or WebSocket, assuming CORS is handled), it can poll these endpoints to display live data.
*   **Game state while RetroArch runs natively:** The provided RetroArch documentation focuses on compiling the emulator for the web or native execution. **It does not describe any mechanism for an external web dashboard to read the live game state from a natively running RetroArch instance.** This would typically require RetroArch to expose an API or logging mechanism, which is not mentioned.

#### 5. WebRTC for P2P game state sync between two browser tabs or two machines — could replace RetroArch Netplay for certain simple games.

*   **WebRTC for P2P game state sync:** **The provided content does not mention WebRTC, P2P game state synchronization, or any alternative to RetroArch Netplay.** The RetroArch documentation focuses on single-player web execution and compilation details, not multiplayer networking beyond the implicit capabilities of the core emulator.

#### 6. What's the lightest possible web experience — a single HTML page that connects to a local Fiber node RPC and shows live payment activity while the user plays RetroArch natively?

*   **Single HTML page that connects to a local Fiber node RPC:** This is technically feasible. A simple HTML page with JavaScript could make HTTP requests (or WebSocket connections, if supported) to a local Fiber node's RPC endpoint. The `Fiber Network Node RPC README.md` describes the RPC interface. The main challenge would be ensuring the browser's security policies (e.g., Same-Origin Policy, CORS) allow the connection to `localhost` or a specific local IP, and that the Fiber node's `rpc.listening_addr` is configured to accept connections from the browser's origin. The RPC documentation warns about exposing `rpc.listening_addr` for security reasons, implying it's designed for trusted access, but a local setup might be manageable.
*   **Shows live payment activity:** As discussed in Q4, the Fiber RPC methods like `payment-get_payment` and `channel-list_channels` can be queried to retrieve and display payment and channel status. The HTML page could periodically poll these endpoints.
*   **While the user plays RetroArch natively:** This scenario explicitly separates the web dashboard from the game, avoiding the complexities of in-browser emulation and integration. This part is entirely outside the scope of the web page's functionality and relies on the user running RetroArch natively.

### Gaps / Follow-up

1.  **RetroArch Web Player Network/Memory API:** The provided content does not detail any JavaScript API for controlling RetroArch's network features (like Netplay UDP port 55355) or directly accessing emulator memory from the browser. Further investigation into Emscripten's capabilities for WASM exports and RetroArch's specific Emscripten build would be needed.
2.  **Fiber Browser SDK and WebSocket Support:** A dedicated JavaScript SDK for Fiber would greatly simplify browser integration. The current RPC documentation doesn't mention one. Explicit confirmation and documentation of WebSocket support for the Fiber RPC, including details on browser compatibility and CORS configuration, are needed.
3.  **JoyID Wallet Integration:** The provided content does not mention JoyID. Research into JoyID's browser integration capabilities (e.g., browser extensions, SDKs) and how it could interact with Fiber transactions is required.
4.  **Native RetroArch Game State Export:** For a dashboard to show native game state, RetroArch would need to expose an API or mechanism (e.g., a local HTTP server, file output) for external applications to read its current state. This is not covered.
5.  **WebRTC for P2P:** The content does not discuss WebRTC. Research into existing RetroArch Netplay implementations (if any) that use WebRTC or the feasibility of building a custom WebRTC layer for game state synchronization would be necessary.
6.  **CKB-CCC Status:** The `FETCH ERROR` for `ckb-ccc/README.md` means its browser compatibility could not be verified. This needs to be re-evaluated with correct access to the documentation.

### Relevant Code/API Snippets

**RetroArch Web Player Compilation (from `pkg/emscripten/README.md`):**

```bash
# Example for compiling a core (fceumm)
emmake make -f Makefile.libretro platform=emscripten

# Example for compiling the frontend with a core
emmake make -f Makefile.emscripten LIBRETRO=fceumm -j all

# Example for threaded builds (melonDS)
# Modify Makefile to enable threads: HAVE_THREADS = 1, CFLAGS += -pthread, LDFLAGS += -pthread, CXXFLAGS += -pthread
emmake make -f Makefile platform=emscripten
emmake make -f Makefile.emscripten LIBRETRO=melonds HAVE_THREADS=1 -j all

# Web server headers for threaded builds:
# Node.js Express:
app.use(function(req, res, next) {
  res.header("Cross-Origin-Embedder-Policy", "require-corp");
  res.header("Cross-Origin-Opener-Policy", "same-origin");
  res.header("Cross-Origin-Resource-Policy", "same-origin");
  next();
});
```

**Fiber Network Node RPC Methods (from `fiber/main/crates/fiber-lib/src/rpc/README.md`):**

*   **Channel Management:**
    *   `channel-open_channel`
    *   `channel-accept_channel`
    *   `channel-abandon_channel`
    *   `channel-list_channels`
    *   `channel-shutdown_channel`
    *   `channel-update_channel`
*   **Payment Management:**
    *   `payment-send_payment`
    *   `payment-get_payment`
    *   `payment-build_router`
    *   `payment-send_payment_with_router`
*   **Invoice Management:**
    *   `invoice-new_invoice`
    *   `invoice-parse_invoice`
    *   `invoice-get_invoice`
    *   `invoice-cancel_invoice`
    *   `invoice-settle_invoice`
*   **Node Information:**
    *   `info-node_info`
*   **Peer Management:**
    *   `peer-connect_peer`
    *   `peer-disconnect_peer`
    *   `peer-list_peers`

**Date: 2026-03-05**