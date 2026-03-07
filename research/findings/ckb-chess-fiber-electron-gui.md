# Research: ckb-chess-fiber-electron-gui

**Date:** 2026-03-07  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/nervosnetwork/fiber/main/README.md, https://raw.githubusercontent.com/nervosnetwork/fiber/main/docs/architecture.md, https://raw.githubusercontent.com/chess-js/chess.js/master/README.md, https://raw.githubusercontent.com/nicholasstephan/ckb-chess/main/README.md

---

Date: 2026-03-07

## Summary
This research investigates the design of an Electron GUI for CKB Chess, integrating Fiber for per-move micropayments within the Common Knowledge Hub (CKH) app. The analysis confirms that Fiber channels are suitable for low-latency, low-cost micropayments, with the "FiberQuest" project suggesting a "one channel per game" model. Integration with existing Fiber nodes would occur via RPC, requiring a custom Node.js client due to the absence of an official library. While specific CKB Chess implementations and Electron UI library details were not found in the provided content, DOBs are identified as a viable option for on-chain game records or achievements.

## Questions to Answer

### 1. What existing CKB Chess implementations exist (on-chain, off-chain, Fiber-based)? Any prior art to build on?
The provided content does not detail any existing CKB Chess implementations (on-chain, off-chain, or Fiber-based). The link `https://raw.githubusercontent.com/nicholasstephan/ckb-chess/main/README.md` resulted in a "FETCH ERROR", so no information could be retrieved from that source. The "FiberQuest" project demonstrates a similar concept of game events triggering Fiber micropayments, but it is for an emulator, not a native chess game.

### 2. How does a Fiber channel handle per-move micropayments — is one channel opened per game, or per session?
Based on the "FiberQuest" project description, which involves game events triggering payments, the model is that "Channels open at game start, settle at game end." This strongly suggests that one Fiber channel would be opened per game for per-move micropayments, rather than per session. Fiber is designed for "extremely low-cost micropayments" with "low latency" (e.g., 20ms), making it suitable for per-move payments.

### 3. What Fiber RPC calls are needed for: open channel, send payment, settle game, close channel?
Based on the provided content, the following Fiber RPC calls are directly mentioned:
*   **Open channel**: `open_channel` (listed under FNN binary RPC methods in the "Fiber Network" section).
*   **Send payment**: `send_payment` (listed under FNN binary RPC methods in the "Fiber Network" section).
*   **Close channel**: `shutdown_channel` (mentioned in `nervosnetwork/fiber/main/README.md` under "Testnet compatibility issues" as a way to "close them via RPC").
The concept of "settle game" is likely an application-level process that would involve closing the channel (`shutdown_channel`) and potentially recording the game outcome, rather than a distinct Fiber RPC call. The `nervosnetwork/fiber/main/README.md` also points to "[RPC Documentation](./crates/fiber-lib/src/rpc/README.md)" for further details.

### 4. What chess UI libraries work well in Electron — chessboard.js, chess.js, cm-chessboard? License compatibility?
The provided content does not contain information about which chess UI libraries (like `chessboard.js`, `chess.js`, or `cm-chessboard`) work well in Electron, nor does it discuss their license compatibility. The link `https://raw.githubusercontent.com/chess-js/chess.js/master/README.md` resulted in a "FETCH ERROR", so no information could be retrieved from that source.

### 5. What's the minimum Fiber channel capacity needed for a full chess game (say 100 moves at 1 CKB/move)?
For a full chess game with 100 moves at 1 CKB per move, the minimum Fiber channel capacity needed would be 100 CKB. This capacity would cover the total potential payments exchanged throughout the game.

### 6. How should the game handle disconnection mid-game — timeout rules, channel force-close?
The provided content does not explicitly detail how the game should handle disconnection mid-game, including specific timeout rules or channel force-close mechanisms. While Fiber supports "Watchtower support" to "make it easier for node operators" in maintaining channel security, the specifics of game-level disconnection handling are not covered.

### 7. How does the chess app integrate with CKH's existing Fiber node management (already running on same machine)?
The chess app, being an Electron application (which is Node.js-based), would integrate with CKH's existing Fiber node management by communicating with the local Fiber node via its RPC interface. The `ckbnode` (192.168.68.87) is already running a funded Fiber node on the mainnet. As noted in the "FiberQuest" project, there is "no official Node.js Fiber client library," meaning a custom client or a Node.js sidecar would need to be built to interact with the Rust-based Fiber Network Node (FNN) RPC. This interaction would involve calling the FNN binary RPC methods like `open_channel`, `send_payment`, and `shutdown_channel`.

### 8. Should game state be stored on-chain (Spore/DOB per game record) or off-chain (local DB)?
The decision to store game state on-chain or off-chain depends on the desired properties.
*   **On-chain (Spore/DOB)**: The "Spore Protocol / DOB NFTs" section indicates that DOBs are CKB NFTs, and question 10 explores using DOBs for game records or achievements with embedded move history. This would provide immutability and public verifiability for game records. However, Fiber itself "CANNOT store arbitrary data or files." CKBFS is for on-chain file storage and could potentially store game state files, but DOBs are a more specific NFT standard.
*   **Off-chain (local DB)**: Given that Fiber channels handle payments off-chain and only open/close via on-chain transactions, the active, real-time game state during play would likely be managed off-chain (e.g., in a local database or application memory) for performance and cost efficiency. Only the final game outcome or specific milestones might be committed on-chain.
The content suggests that active game state would be off-chain, with the option to record final outcomes or achievements on-chain using DOBs.

### 9. What's the UX flow: challenge opponent → open channel → play → settle → close? Or always-open channel pool?
Based on the "FiberQuest" project, which uses Fiber for game-event triggered micropayments, the UX flow described is "Channels open at game start, settle at game end." This aligns with the flow: challenge opponent → open channel → play → settle game → close channel. The concept of an "always-open channel pool" is not mentioned or supported by the provided content for this use case.

### 10. Could DOBs represent game records / achievements — e.g. mint a DOB for a won game with move history embedded?
Yes, based on the provided content, DOBs could represent game records or achievements. DOBs are Spore NFTs, and Wyltek Industries already has a production `ckb-dob-minter` that supports "cluster creation, CKBFS V2/V3 image upload, batch mint, burn." The `@wyltek/ckbfs-browser` SDK is used in the DOB minter for image uploads, handling "chunking, cell building, type script construction." This infrastructure could be leveraged to mint a DOB for a won game, potentially embedding metadata about the game directly in the Spore cell or linking to a CKBFS V3 file containing the full move history.

## Gaps / Follow-up
*   **Existing CKB Chess Implementations**: Further research is needed to identify any existing CKB Chess implementations or prior art, as the provided link resulted in a fetch error.
*   **Electron UI Libraries for Chess**: Specific recommendations and license compatibility for Electron-friendly chess UI libraries (e.g., `chessboard.js`, `chess.js`, `cm-chessboard`) are not available in the provided content.
*   **Detailed Fiber RPC Documentation**: While a path to RPC documentation was provided (`./crates/fiber-lib/src/rpc/README.md`), the content itself was not included, limiting detailed understanding of all available RPC methods and their parameters.
*   **Game-level Disconnection Handling**: Specific timeout rules, dispute resolution mechanisms, and channel force-close procedures for mid-game disconnections within a Fiber-based chess application are not detailed.
*   **Node.js Fiber Client Library Implementation**: The "key gap" of "no official Node.js Fiber client library" means significant development effort will be required to build a custom client from the Rust RPC source.
*   **Secure FNN Wallet Management**: How the Electron app will securely manage the `FIBER_SECRET_KEY_PASSWORD` for the FNN's built-in wallet functionality in a user-friendly GUI context needs to be determined.
*   **DOB/CKBFS Data Structure for Game Records**: The exact schema or structure for embedding game records (e.g., move history, winner, timestamp) within a DOB or a linked CKBFS V3 file needs to be designed.

## Relevant Code/API Snippets
*   **Fiber Network Node (FNN) RPC Methods (mentioned)**: `open_channel`, `send_payment`, `list_channels`, `new_invoice`, `get_invoice`, `shutdown_channel`.
*   **FNN Configuration**: `FIBER_SECRET_KEY_PASSWORD='YOUR_PASSWORD' RUST_LOG='info' ./fnn -c config.yml -d .` (from `nervosnetwork/fiber/main/README.md`).
*   **CKBFS V3 code_hash**: `0xb5d13ffe0547c78021c01fe24dce2e959a1ed8edbca3cb93dd2e9f57fb56d695`
*   **CKBFS V3 type_id**: `0xcc5411e8b70e551d7a3dd806256533cff6bc12118b48dd7b2d5d2292c3651add`
*   **Wyltek DOB Minter Mainnet Cluster**: `0x54ba3ee23016ab6e2e20792d8fd69057c62392ca1997b622147a5bd98979f4e8`