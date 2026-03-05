# Research: fiberquest-online-multiplayer

**Date:** 2026-03-05  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://docs.libretro.com/guides/netplay/, https://raw.githubusercontent.com/libretro/RetroArch/master/network/netplay/netplay.h, https://fightcade.com/, https://www.retroachievements.org/viewtopic.php?t=1234

---

## Research Note: fiberquest-online-multiplayer

**Date:** 2026-03-05

### Summary
The provided RetroArch `netplay.h` header file indicates that RetroArch's Netplay system supports both P2P connections (via NAT traversal) and relay servers (referred to as MITM servers). It includes mechanisms for tracking client information, room details, and potentially syncing game state via savestates. However, crucial details regarding the specific netcode implementation (rollback vs. delay-based), optimal latency for various game genres, core-specific performance, and the interaction with RetroAchievements are largely absent due to inaccessible documentation. The feasibility of real-time per-hit payments with combined latency (Fiber + Netplay) cannot be determined from the technical content alone.

### 1. RetroArch Netplay — how it works technically (rollback vs delay-based netcode, relay servers, P2P), latency requirements per game genre, which cores support it best.

*   **Rollback vs. Delay-based Netcode:** The provided `netplay.h` header file does not explicitly state whether RetroArch Netplay uses rollback or delay-based netcode. The presence of `netplay_force_send_savestate(void);` suggests a mechanism for syncing game state, which is common in both, but doesn't definitively point to one over the other. The official guide (https://docs.libretro.com/guides/netplay/) was inaccessible (HTTP Error 404), which would likely contain this information.
*   **Relay Servers (MITM) vs. P2P:** RetroArch Netplay supports both relay servers and P2P connections.
    *   **Relay Servers:** The `netplay.h` file defines `mitm_server_t` and `netplay_mitm_server_list`, indicating support for "Man-in-the-Middle" (MITM) servers, which act as relays. The `netplay_room` struct also includes fields like `mitm_handle`, `mitm_address`, and `mitm_session`.
    *   **P2P:** The `nat_traversal_data` struct within `net_driver_state_t` suggests that NAT traversal is used, which is essential for establishing direct P2P connections between players behind different NATs.
*   **Latency Requirements per Game Genre:** The provided content does not specify latency requirements for different game genres. The `netplay_client_info_t` struct includes `int32_t ping;` and `net_driver_state_t` includes `int latest_ping;`, indicating that ping is tracked, but no thresholds or recommendations are given.
*   **Which Cores Support it Best:** The provided content does not specify which cores support Netplay best. The `netplay_room` struct includes `corename` and `coreversion`, implying that core information is part of the Netplay room data, but no performance metrics or recommendations are available.

### 2. Which games work well over Netplay — fighters, sports, puzzle — what's the competitive scene?

The provided content does not offer any information on which specific games or genres work well over Netplay, nor does it discuss any competitive scene. The `netplay_room` struct contains `gamename` and `gamecrc`, but this is for identification, not performance or suitability.

### 3. RetroAchievements + Netplay interaction — do achievements fire for both players? Does RAM state sync between clients?

*   **Achievements fire for both players?** The link to `retroachievements.org` (https://www.retroachievements.org/viewtopic.php?t=1234) resulted in an HTTP Error 403 (Forbidden), preventing access to this information. The `netplay.h` header file does not contain any references to "achievements" or "retroachievements." Therefore, it cannot be determined from the provided content if achievements fire for both players during Netplay.
*   **Does RAM state sync between clients?** Yes, the presence of the function `bool netplay_force_send_savestate(void);` in `netplay.h` strongly implies that RAM state (as part of a savestate) can be explicitly sent to synchronize clients. This is a fundamental mechanism for keeping game states consistent across Netplay participants.

### 4. Kaillera, GGPO, FightCade — are any of these accessible via RetroArch cores? FightCave runs FBNeo which is a libretro core — can we hook into it?

*   **Kaillera, GGPO:** The provided content does not mention Kaillera or GGPO, nor does it indicate if they are accessible via RetroArch cores.
*   **FightCade / FBNeo:** The `fightcade.com` link only provided "fightcade-web" without technical details. While FBNeo is indeed a Libretro core, the provided `netplay.h` describes RetroArch's *native* Netplay system. The content does not indicate whether RetroArch's Netplay can "hook into" or interoperate directly with FightCade's specific netcode implementation, even if they share the same underlying core (FBNeo). RetroArch's Netplay is a separate system from FightCade's.

### 5. Latency question: Fiber send_payment is ~20ms. Netplay adds 50-150ms. Is the combined latency acceptable for real-time per-hit payments? Or do we need to batch payments per round instead?

The combined latency would be approximately 70-170ms (20ms from Fiber + 50-150ms from Netplay). The provided technical content does not offer any guidance or criteria for determining the acceptability of this combined latency for "real-time per-hit payments" or whether batching payments per round would be necessary. This is a business/design decision that falls outside the scope of the technical Netplay implementation details provided.

### 6. Can two players on opposite sides of the world play SF2 over Netplay with Fiber payments? What's the practical distance limit?

*   **Playing SF2 over Netplay with Fiber payments:** Technically, players on opposite sides of the world *can* attempt to play SF2 over RetroArch Netplay, provided their connection quality (ping, bandwidth) is sufficient. The `netplay.h` header defines structures to track `ping` (`netplay_client_info_t`, `net_driver_state_t`) and supports MITM servers which can help connect players globally. However, the feasibility and playability will heavily depend on the resulting latency. The "Fiber payments" aspect is not addressed by the technical content.
*   **Practical Distance Limit:** The provided content does not specify a practical distance limit for Netplay. While it tracks `ping`, it does not define what constitutes an "acceptable" ping for a playable experience, especially for latency-sensitive games like SF2. The practical limit is determined by the maximum acceptable latency for the specific game, which is not detailed here.

### Gaps / Follow-up

1.  **RetroArch Netplay Guide:** The primary documentation for RetroArch Netplay (https://docs.libretro.com/guides/netplay/) was inaccessible (HTTP Error 404). Accessing this guide is crucial for understanding:
    *   The specific netcode implementation (rollback vs. delay-based).
    *   Recommended latency thresholds for different game genres.
    *   Best-performing cores for Netplay.
    *   Detailed setup and troubleshooting for P2P vs. MITM connections.
2.  **RetroAchievements Netplay Policy:** The RetroAchievements forum link (https://www.retroachievements.org/viewtopic.php?t=1234) was inaccessible (HTTP Error 403). Information on how achievements interact with Netplay (e.g., if they fire for all players, host-only, or are disabled) is needed.
3.  **Netplay Performance Benchmarks:** No performance benchmarks or user experience reports for various games (e.g., SF2) over different latency conditions were provided. This would be essential for determining "practical distance limits" and playability.
4.  **Payment System Integration:** The provided content is purely about RetroArch Netplay's technical implementation, not payment systems. Further research would be needed on integrating real-time payment systems with game events and the acceptable latency for such transactions from a user experience and financial integrity perspective.
5.  **Interoperability with other Netplay systems:** Clarification on whether RetroArch Netplay can interoperate with other systems like Kaillera, GGPO, or FightCade's specific netcode (even if using the same core) is missing.

### Relevant Code/API Snippets

*   **MITM (Relay) Server Support:**
    ```c
    typedef struct mitm_server {
       const char *name;
       enum msg_hash_enums description;
    } mitm_server_t;
    extern const mitm_server_t netplay_mitm_server_list[NETPLAY_MITM_SERVERS];
    // ...
    struct netplay_room {
       // ...
       char mitm_handle[NETPLAY_HOST_STR_LEN];
       char mitm_address[NETPLAY_HOST_LONGSTR_LEN];
       char mitm_session[NETPLAY_HOST_STR_LEN];
       // ...
    };
    ```
*   **NAT Traversal (P2P Support):**
    ```c
    typedef struct {
       // ...
       /* NAT traversal info (if NAT traversal is used and serving) */
       struct nat_traversal_data nat_traversal_request;
       // ...
    } net_driver_state_t;
    ```
*   **Ping Tracking:**
    ```c
    typedef struct netplay_client_info {
       // ...
       int32_t ping;
       // ...
    } netplay_client_info_t;
    // ...
    typedef struct {
       // ...
       int latest_ping;
       // ...
    } net_driver_state_t;
    ```
*   **RAM State Synchronization (Savestates):**
    ```c
    bool netplay_force_send_savestate(void);
    ```
*   **Netplay Initialization/Deinitialization:**
    ```c
    bool init_netplay(const char *server, unsigned port, const char *mitm_session);
    bool init_netplay_deferred(const char *server, unsigned port, const char *mitm_session);
    void deinit_netplay(void);
    ```
*   **Room and Game Information:**
    ```c
    struct netplay_room {
       // ...
       int gamecrc;
       char corename[NETPLAY_HOST_STR_LEN];
       char coreversion[NETPLAY_HOST_STR_LEN];
       char gamename[NETPLAY_HOST_LONGSTR_LEN];
       // ...
    };
    ```