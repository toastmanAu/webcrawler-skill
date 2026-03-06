# Research: fiberquest-hackathon-submission-prep

**Date:** 2026-03-06  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://dorahacks.io/hackathon/fiber-network, https://raw.githubusercontent.com/nervosnetwork/fiber/main/README.md, https://www.nervos.org/blog, https://raw.githubusercontent.com/nervosnetwork/awesome-nervos/main/README.md, https://dorahacks.io/hackathon/nervos

---

## Research Note: fiberquest-hackathon-submission-prep

**Date:** 2026-03-06

### Summary
This research aims to optimize FiberQuest's positioning for the upcoming hackathon by analyzing available information on the Fiber Network and hackathon requirements. Due to fetch errors for critical DoraHacks pages, specific judging criteria, weightings, and prior winning entries could not be retrieved. However, the Fiber Network's features (low-cost micropayments, instant swaps, PTLCs, composability) and the identified "key gap" of a missing Node.js Fiber client library are crucial. FiberQuest's design, involving automated, conditional micropayments triggered by game events via a Node.js sidecar, inherently aligns with an "agent-based" application. Emphasizing the technical achievement of building the Node.js client and the innovative real-time integration will be key.

### 1. Exact judging criteria and weightings — how is "agent-based" defined, what does autonomy mean to judges?
The exact judging criteria and weightings for the hackathon, as well as specific definitions for "agent-based" and "autonomy" from the judges' perspective, could not be found in the provided content. The primary source for this information (`https://dorahacks.io/hackathon/fiber-network`) returned an HTTP Error 405: Not Allowed.

### 2. What makes a strong agent submission vs a basic Fiber app?
The provided content does not explicitly define what constitutes a "strong agent submission" versus a "basic Fiber app" in the context of judging. However, based on the Fiber Network's features and the nature of "agent-based" applications, a strong submission would likely demonstrate:
*   **Automation and Conditional Logic:** Payments or actions are triggered automatically based on predefined conditions, rather than manual initiation. FiberQuest's concept of game events (health damage, score, KO) triggering payments exemplifies this. The Fiber Network's `README.md` lists "Programmable conditional payment" as a TODO, suggesting this is a desired advanced feature.
*   **Integration with External Systems:** An agent typically interacts with external data sources or applications. FiberQuest's integration with RetroArch (emulator) via UDP RAM polling is a strong example.
*   **Technical Depth and Contribution:** The "key gap" identified for FiberQuest is the lack of an official Node.js Fiber client library, requiring it to be built from the Rust RPC source. Successfully implementing this would demonstrate significant technical skill and contribute a valuable tool to the ecosystem, likely scoring highly.
*   **Leveraging Fiber's Unique Features:** Highlighting the use of Fiber's low-cost micropayments, low latency (~20ms), and PTLCs for enhanced privacy and security would differentiate it from a simple CKB L1 transaction.
*   **Innovation and Use Case:** Applying Fiber to a novel domain like real-time gaming payments showcases innovative thinking beyond typical financial transactions.

A "basic Fiber app" might involve manual channel opening/closing and simple payment sending, without the automated, conditional, or integrated aspects of an agent.

### 3. Prior Nervos/Fiber hackathon winning entries — what patterns made them stand out?
Information regarding prior Nervos/Fiber hackathon winning entries and the patterns that made them stand out could not be found. The relevant URLs (`https://dorahacks.io/hackathon/fiber-network`, `https://dorahacks.io/hackathon/nervos`, `https://www.nervos.org/blog`, `https://raw.githubusercontent.com/nervosnetwork/awesome-nervos/main/README.md`) either returned fetch errors or were not found.

### 4. Video demo requirements — length, format, what to show?
The video demo requirements, including length, format, and specific content to show, could not be found in the provided content. The relevant DoraHacks pages returned fetch errors.

### 5. How important is deployed/live demo vs code-only?
The importance of a deployed/live demo versus a code-only submission for *this specific hackathon* could not be determined from the provided content, as the relevant DoraHacks pages returned fetch errors.

However, Wyltek Industries' existing projects, such as the `ckb-dob-minter` (deployed at `wyltekindustries.com/mint/`) and the `Wyltek Industries site` (live on GitHub Pages/Cloudflare CDN), indicate a strong preference and capability for live, deployed applications. While not a direct hackathon requirement, having a live demo would align with Wyltek's established practice and likely enhance the presentation.

### 6. How should we frame FiberQuest's sidecar as an autonomous payment agent to maximise score?
FiberQuest's sidecar can be framed as an autonomous payment agent by emphasizing the following aspects, directly addressing the "agent-based" and "autonomy" concepts:

1.  **Autonomous Decision-Making:** The sidecar independently monitors game state (via UDP RAM polling for `READ_CORE_MEMORY` on port 55355) and makes real-time decisions to initiate payments without human intervention. This highlights its self-operating nature.
2.  **Conditional Payment Logic:** Payments are not arbitrary but are triggered by specific, predefined game events (e.g., "health damage," "score increment," "KO"). This demonstrates a sophisticated, rule-based agent.
3.  **Real-time Micropayment Execution:** The agent leverages Fiber Network's capabilities for instant, extremely low-cost micropayments (~0.00000001 cent fee, ~20ms latency), making the in-game economic interactions seamless and practical.
4.  **Bridging Digital Worlds:** The sidecar acts as an intelligent bridge, translating events from a traditional gaming environment (RetroArch emulator) into on-chain economic actions on the CKB/Fiber network.
5.  **Technical Prowess (Node.js Fiber Client):** Crucially, highlight the development of the Node.js Fiber client library from the Rust RPC source. This addresses a "key gap" in the Fiber ecosystem and showcases significant technical contribution and understanding of the Fiber protocol. This is a major differentiator.
6.  **Embedded Autonomy (Stretch Goal):** If the ESP32-P4 stretch goal is achieved, emphasize the ability to run the full stack (emulator, light client, signer) concurrently on resource-constrained embedded hardware, demonstrating a highly self-contained and autonomous agent.
7.  **Innovative Use Case:** Position it as a pioneering example of how blockchain micropayments can create new economic models, incentives, and interactive experiences within gaming.

**Example Framing:**
"FiberQuest's Node.js sidecar is a truly autonomous payment agent, designed to seamlessly integrate real-time game events with the CKB Fiber Network. It autonomously monitors game RAM for critical events like health changes or score updates, and based on pre-programmed conditional logic, it instantly triggers micropayments via Fiber channels. This agent not only demonstrates the power of automated, conditional blockchain transactions but also fills a critical ecosystem gap by providing the first Node.js client for the Fiber Network, built directly from its Rust RPC source. This enables a new paradigm of in-game economies, where every action can have a real-world, low-cost financial consequence, even on embedded hardware like the ESP32-P4."

### Gaps / Follow-up
The following critical information could not be retrieved from the provided content due to fetch errors or lack of specific details:
*   Exact judging criteria and weightings for the hackathon.
*   Specific definitions of "agent-based" and "autonomy" as understood by the judges.
*   Examples and patterns from prior Nervos/Fiber hackathon winning entries.
*   Specific video demo requirements (length, format, content).
*   The explicit importance of a deployed/live demo versus a code-only submission for this hackathon.

**Follow-up Action:** Attempt to access the DoraHacks pages (`https://dorahacks.io/hackathon/fiber-network`, `https://dorahacks.io/hackathon/nervos`) again, or seek alternative channels (e.g., Nervos Discord, official announcements) for hackathon rules, judging criteria, and past winners.

### Relevant Code/API Snippets
*   **Fiber Network Node (FNN) RPC methods:**
    *   `open_channel`
    *   `send_payment`
    *   `list_channels`
    *   `new_invoice`
    *   `get_invoice`
    *   `channel_list_channels` (from `crates/fiber-lib/src/rpc/README.md`)
    *   `channel_shutdown_channel` (from `crates/fiber-lib/src/rpc/README.md`)
*   **FNN Wallet Configuration:**
    *   `ckb-cli account export --lock-arg --extended-privkey-path ./ckb/exported-key` (to generate/export key)
    *   `head -n 1 ./ckb/exported-key > ./ckb/key` (to extract private key)
    *   `FIBER_SECRET_KEY_PASSWORD='YOUR_PASSWORD'` (environment variable for encryption)
    *   `RUST_LOG='info'` (environment variable for logging verbosity)
    *   `./fnn -c config.yml -d .` (command to start FNN)
*   **CKBFS V3 Identifiers:**
    *   `code_hash`: `0xb5d13ffe0547c78021c01fe24dce2e959a1ed8edbca3cb93dd2e9f57fb56d695`
    *   `type_id`: `0xcc5411e8b70e551d7a3dd806256533cff6bc12118b48dd7b2d5d2292c3651add`
*   **Fiber Network TODOs (potential areas for innovation/focus):**
    *   `[ ] Web-browser friendly runtime`
    *   `[ ] Programmable conditional payment`
    *   `[ ] Advanced channel liquidity management`
    *   `[ ] Atomic multi-path payment`