# Research: fiberquest-tournament-ui-design

**Date:** 2026-03-06  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://raw.githubusercontent.com/nicedoc/nicedoc/master/README.md, https://animate.style/, https://raw.githubusercontent.com/chartjs/Chart.js/master/README.md, https://raw.githubusercontent.com/gregberge/loadable-components/master/README.md, https://raw.githubusercontent.com/electron/electron/main/docs/tutorial/security.md

---

## Research Note: fiberquest-tournament-ui-design

**Date:** 2026-03-06

### Summary
This research explores UI patterns for an Electron application focused on FiberQuest tournament creation and browsing. The goal is to identify best practices for multi-step wizards, live data display (prize pools), tournament visualization (brackets/leaderboards), readable on-chain data presentation, asynchronous blockchain transaction progress indicators, and mobile-responsive layouts. While the provided content offers some general UI libraries like Animate.css and Chart.js, specific UI component libraries or detailed UX patterns for tournament management are not present, requiring a focus on general principles and leveraging existing project infrastructure for data sources.

### Questions to Answer

#### (1) Best UX patterns for a multi-step tournament creation wizard (type → parameters → funding → confirm → on-chain submit)?

The provided content does not include specific UI/UX patterns or libraries for multi-step wizards. However, based on general web development best practices for Electron apps (which use web technologies), common patterns include:

*   **Progress Indicators:** A visual indicator (e.g., numbered steps, a progress bar, or a series of dots) at the top or side of the wizard to show the user their current position and how many steps remain.
*   **Clear Navigation:** Prominent "Next" and "Back" buttons. The "Next" button should be disabled until all required fields on the current step are valid. A "Cancel" button should also be available.
*   **Step-by-Step Forms:** Each step should focus on a single logical group of inputs to avoid overwhelming the user.
*   **Review/Confirmation Step:** A final step summarizing all chosen options and parameters before the "on-chain submit" action, allowing the user to review and confirm.
*   **Inline Validation:** Provide immediate feedback for input errors rather than waiting until the user tries to proceed to the next step.

Given the "on-chain submit" step, integrating a wallet connector like JoyID (mentioned as the primary wallet) via `@ckb-ccc/connector-react` would be crucial for the funding and final transaction signing.

#### (2) How to display a live-updating prize pool that grows as players register (polling Supabase or CKB indexer)?

To display a live-updating prize pool, both polling Supabase and a CKB indexer are viable options, leveraging existing infrastructure:

*   **Polling Supabase:** The Wyltek Industries site already uses "JoyID CKB address → Supabase auth, RLS-protected." If player registration and associated prize pool contributions are stored in Supabase, the Electron app can poll Supabase directly for updates. This would likely involve making authenticated API calls to Supabase at a regular interval (e.g., every few seconds) to fetch the current prize pool value.
*   **Polling CKB Indexer:** The project runs `ckbnode` (mainnet full node) and `N100` (CKB + testnet light clients). An indexer service (either custom-built or a public one) would be required to efficiently query CKB cells related to tournament funding. The `@ckb-ccc/core` SDK could be used to interact with CKB nodes or an indexer to fetch cell data. The prize pool would likely be represented by the capacity of specific CKB cells locked for the tournament. Polling the indexer would involve querying these cells and summing their capacities.

**Display Patterns:**
*   **Numeric Display:** A prominent, large number displaying the current CKB amount, potentially with a USD equivalent.
*   **Animation:** Use `Animate.css` (e.g., `animate__pulse`, `animate__flash`) to draw attention to the prize pool when it updates, indicating a new player has registered or contributed.
*   **Chart Visualization:** `Chart.js` could be used to visualize the growth of the prize pool over time, showing a line or bar chart of contributions. This would require storing historical prize pool values or aggregating them from transaction data.

#### (3) Tournament bracket / leaderboard visualisation patterns for 2–8 players — what libraries or CSS patterns work well?

The provided content does not include any specific libraries or CSS patterns for tournament bracket or leaderboard visualization. `Chart.js` is for general data charting, not bracket structures.

For 2-8 players, common UI patterns for brackets include:
*   **Single-Elimination Bracket:** A tree-like structure showing matchups and progression. For 2-8 players, this is relatively simple and can often be achieved with custom CSS (flexbox/grid) and SVG for connecting lines.
*   **Round-Robin Leaderboard:** A simple table displaying player names, scores, and rankings.
*   **Hybrid:** A bracket view for ongoing matches, and a leaderboard for overall standings.

Since no specific library is mentioned, a custom implementation using standard web technologies (HTML, CSS, JavaScript) within the Electron app would be necessary.

#### (4) How to display on-chain cell data in a readable way (tournament status, edit history for editable tournaments, settlement tx links)?

Leveraging the existing CKB ecosystem and Wyltek's tools:

*   **Tournament Status:** Display key cell data fields (e.g., `data` content, `type_id` for CKBFS V3, `capacity`) in a structured, human-readable format. This could involve:
    *   **Detail Cards/Sections:** Use distinct UI sections to present different aspects of the tournament's on-chain state (e.g., "Current Status," "Participants," "Prize Pool Details").
    *   **Labels and Values:** Clearly label each piece of data (e.g., "Status: Active," "Capacity: 1000 CKB").
    *   **Interpreted Data:** Instead of raw hex data, interpret and display meaningful strings or numbers where possible (e.g., a status enum, a timestamp converted to a human-readable date).
*   **Edit History for Editable Tournaments:** If tournament state changes are recorded on-chain (e.g., via new cells or updates to existing ones), display this as a chronological list or table. Each entry could show:
    *   The change made (e.g., "Player added," "Parameter updated").
    *   The timestamp of the change.
    *   A link to the relevant transaction.
*   **Settlement Transaction Links:** Provide direct links to a CKB explorer for any relevant transaction IDs (e.g., tournament creation, funding, settlement). This allows users to verify on-chain activity. The transaction hash can be formatted as a clickable link to a public CKB explorer (e.g., `https://explorer.nervos.org/transaction/<tx_hash>`).
*   **CKBFS Viewer Integration:** Given the "CKBFS viewer" on the Wyltek Industries site, if tournament rules or assets are stored via CKBFS, the Electron app could integrate a similar viewer to display these files directly.

The `@ckb-ccc/core` SDK would be used to fetch the raw cell data, and then custom logic would parse and format it for display.

#### (5) Progress indicators for async blockchain txs (submitted → confirmed → live)?

The `ckb-dob-minter` already handles async blockchain transactions (minting DOBs), so Wyltek Industries likely has established patterns for this. Common UI patterns for indicating transaction progress include:

*   **Step-by-Step Progress Bar/Checklist:** Visually represent the stages:
    1.  **Submitted:** Transaction sent to the network.
    2.  **Pending/Confirmed (1+ confirmations):** Transaction included in a block, awaiting further confirmations.
    3.  **Live/Complete:** Transaction fully confirmed and its effects are final.
*   **Spinners/Loaders:** Display a spinner or loading animation while the transaction is in a pending state.
*   **Status Messages:** Provide clear textual feedback (e.g., "Transaction submitted, awaiting confirmation...", "Transaction confirmed!", "Error: Transaction failed.").
*   **Toast Notifications:** Use temporary, non-intrusive notifications to inform the user of status changes.
*   **Transaction Hash Link:** Once submitted, display the transaction hash with a link to a CKB explorer for the user to track its status independently.
*   **Animations:** `Animate.css` could be used for subtle animations on status changes (e.g., a `fadeIn` for a new status message, a `heartBeat` for a successful confirmation).

The Electron app would need to poll the CKB node or an indexer using `@ckb-ccc/core` to check the transaction status by its hash.

#### (6) Mobile-responsive tournament card grid patterns?

The provided content does not specify any UI framework or CSS library for responsive design, other than `Animate.css` which is for animations, not layout. The Wyltek Industries site is static and responsive, implying existing internal expertise in responsive web design.

For mobile-responsive tournament card grid patterns in an Electron app (which uses web technologies), common CSS patterns include:

*   **CSS Grid or Flexbox:** These are the standard modern CSS layout modules for creating responsive grids.
    *   **Flexbox:** Useful for arranging items in a row or column, with wrapping and alignment capabilities.
    *   **CSS Grid:** Ideal for more complex 2D layouts, allowing explicit control over rows and columns.
*   **Media Queries:** Use `@media` rules to adjust the number of columns, card sizes, and other layout properties based on screen width (e.g., `display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));` for a flexible grid that adapts).
*   **Card Components:** Each tournament can be represented as a "card" component containing key information (name, prize pool, status, player count). These cards should have internal responsive design to ensure content scales well.
*   **Frameworks (not explicitly mentioned but common):** While not in the provided content, popular responsive frameworks like Bootstrap, Tailwind CSS, or Material-UI (for React) offer pre-built grid systems and card components that simplify responsive design. If Wyltek has an existing UI component library for React (given the `ckb-dob-minter` is React/Vite), it likely includes responsive components.

### Gaps / Follow-up

1.  **Specific UI Component Libraries:** The provided content lacks specific UI component libraries (e.g., React component libraries like Ant Design, Material-UI, Chakra UI) that would offer pre-built solutions for wizards, tables, cards, or progress indicators. Research into suitable Electron/React UI libraries would be beneficial.
2.  **Tournament Bracket Library:** No specific library for drawing tournament brackets was found. Further research into JavaScript/React libraries for bracket visualization (e.g., react-tournament-bracket, d3.js-based solutions) is needed.
3.  **Node.js Fiber Client Library:** The "Key gap" for FiberQuest explicitly states "no official Node.js Fiber client library exists — must build from Rust RPC source." This is critical for the Node.js sidecar to interact with Fiber nodes for micropayments and would impact how prize pool funding and settlement are managed and displayed.
4.  **CKB Indexer Details:** While CKB nodes are running, the specific details of the CKB indexer used for efficient querying of tournament-related cells (beyond basic node RPC calls) are not provided. Clarifying this would help in designing the prize pool polling mechanism.
5.  **Supabase Schema for Tournaments:** Details on how tournament data (registration, prize pool contributions) would be structured and stored in Supabase are not available. This would be crucial for implementing the Supabase polling mechanism.

### Relevant Code/API Snippets

*   **`@ckb-ccc/core`:** Primary JS SDK for CKB transaction building and interaction. Relevant for fetching on-chain cell data and monitoring transaction status.
*   **`@ckb-ccc/connector-react`:** Used in `ckb-dob-minter` for wallet connection (JoyID). Essential for the "funding" and "on-chain submit" steps of the tournament creation wizard.
*   **`Animate.css`:**
    ```html
    <h1 class="animate__animated animate__bounce">An animated element</h1>
    ```
    Can be used for visual feedback on prize pool updates or transaction status changes.
    ```css
    /* Custom duration for an animation */
    .animate__animated.animate__bounce {
        --animate-duration: 2s;
    }
    ```
*   **`Chart.js`:**
    ```javascript
    // Example usage (conceptual, actual implementation depends on data structure)
    import { Chart } from 'chart.js';
    // ... create chart instance with data for prize pool growth
    ```
    Can be used for visualizing prize pool growth over time.
*   **Electron Security Guidelines:** The `electron/electron` security documentation emphasizes not enabling Node.js integration for remote content and enabling context isolation. This is a general architectural consideration for the Electron app, ensuring secure display of any remote content (e.g., external links to CKB explorer).
    ```js
    // main.js (Main Process) - Good practice for loading secure content
    browserWindow.loadURL('https://example.com');
    ```