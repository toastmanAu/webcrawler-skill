# Research: fiberquest-target-games

**Date:** 2026-03-05  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://retroachievements.org/gameList.php?c=2&s=5, https://api.retroachievements.org/API/API_GetTopTenUsers.php, https://raw.githubusercontent.com/RetroAchievements/rcheevos/master/README.md, https://www.mobygames.com/game/snes/street-fighter-ii-turbo-hyper-fighting/, https://api.github.com/repos/RetroAchievements/RALibretro/contents/

---

Date: 2026-03-05

## Summary
The primary goal of building a catalog of retro target games for FiberQuest, including details like console, core, payment triggers, fun factor, and RetroAchievements (RA) game IDs, cannot be fulfilled based on the provided source content. Crucial external data sources such as MobyGames, RetroAchievements game lists, and specific RA API endpoints returned "FETCH ERROR: HTTP Error 403: Forbidden" or "HTTP Error 404: Not Found". While the `rcheevos` library documentation provides insight into how RetroAchievements data is processed and how emulators can integrate with the system (e.g., game identification via `rhash`, server communication via `rc_client`), it does not contain any specific game data, ratings, or documented RAM maps for individual games.

## Questions to Answer

### 1. Catalog of Target Games for FiberQuest
I am unable to provide a catalog of target games for FiberQuest. The provided links to MobyGames and RetroAchievements game lists (e.g., `https://retroachievements.org/gameList.php?c=2&s=5` and `https://www.mobygames.com/game/snes/street-fighter-ii-turbo-hyper-fighting/`) resulted in fetch errors (403 Forbidden or 404 Not Found). Without access to these external databases, it is impossible to identify highly-rated games, confirm 2-player competitive mechanics, or retrieve RetroAchievements game IDs.

### 2. Console, Core, Payment Trigger Concept, Why it's fun, and RA Game ID for each game
As I cannot generate the catalog of games, I am also unable to provide these specific details for any game. The necessary information (console, RA game ID, game mechanics for payment triggers, and general fun factor/popularity) would typically come from game databases like MobyGames, GameFAQs, or RetroAchievements, none of which were accessible.

### 3. Games with well-documented RAM maps in RetroAchievements
The `rcheevos` library documentation indicates that RetroAchievements relies on memory maps for some consoles to uniquely identify games and process achievements. Specifically, it states: "Note that some consoles in the enum are not yet fully supported (may require a memory map or some way to uniquely identify games)." This confirms that RAM maps are a concept within the RetroAchievements ecosystem. However, the provided content does *not* include documentation for *specific game* RAM maps or how to access them. The `rcheevos` README focuses on the library's API for processing achievement data and interacting with the RA server, not on providing game-specific memory addresses.

### 4. RetroAchievements API for retrieving game data (e.g., game lists, ratings, RAM map documentation)
The `rcheevos` library's `rapi` component is designed to "builds URLs to access many RetroAchievements web services" and "free the developer from having to URL-encode parameters and build correct URLs that are valid for the server." It explicitly states that `rapi` "does *not* make HTTP requests" and that `rc_client` is the "preferred way to have a client interact with the server."

While `rapi` and `rc_client` facilitate interaction with RA web services, the specific API endpoints for retrieving comprehensive game lists, user ratings, or detailed RAM map documentation for individual games are not provided or accessible in the source content. The attempt to access `https://retroachievements.org/gameList.php?c=2&s=5` resulted in a 403 Forbidden error, and `https://api.retroachievements.org/API/API_GetTopTenUsers.php` resulted in a 404 Not Found error, indicating that direct access to such data was not possible through the provided links. The `rcheevos` documentation points to the RetroAchievements developer docs and wiki for more API details, but these were not provided as direct source content.

## Gaps / Follow-up
1.  **Access to Game Databases**: The most significant gap is the inability to access MobyGames, GameFAQs, and RetroAchievements game lists/APIs. Without this, no specific game recommendations or details can be provided.
    *   **Follow-up**: Obtain working URLs or API keys/credentials to access these databases, or provide static dumps of relevant game data.
2.  **Specific RAM Map Documentation**: While the concept of memory maps is mentioned, concrete documentation for *specific game* RAM maps (e.g., memory addresses for player health, score, lives, etc.) is missing.
    *   **Follow-up**: Investigate RetroAchievements developer documentation or community resources (forums, wikis) for examples of game-specific RAM map documentation or tools used by achievement developers.
3.  **RetroAchievements API Endpoints**: The `rcheevos` library describes *how* to interact with RA services, but not *which* specific API endpoints exist for retrieving game data, ratings, or detailed achievement/memory map information.
    *   **Follow-up**: Consult the official RetroAchievements API documentation (if available) to identify endpoints for game lists, game details, and achievement data, which might indirectly lead to memory map information.

## Relevant Code/API Snippets
The `rcheevos` library provides functions for game identification and server communication, but not for retrieving game data directly from the provided content.

### Game Identification (rhash)
The `rhash` component helps generate a RetroAchievements hash for a given game, which is crucial for identifying games on the platform.

```c
// Initialize an iterator for hashing
void rc_hash_initialize_iterator(rc_hash_iterator_t* iterator, const char* path, const uint8_t* buffer, size_t buffer_size);

// Generate a hash for a given console ID and iterator
int rc_hash_generate(char hash[33], uint32_t console_id, const rc_hash_iterator_t* iterator);

// Iterate through a hash (for multi-file games, etc.)
int rc_hash_iterate(char hash[33], rc_hash_iterator_t* iterator);

// Destroy the iterator
void rc_hash_destroy_iterator(rc_hash_iterator_t* iterator);
```
*(From `https://raw.githubusercontent.com/RetroAchievements/rcheevos/master/README.md`)*

### Console Identifiers
Console identifiers are enumerated in `rc_consoles.h`.
*(From `https://raw.githubusercontent.com/RetroAchievements/rcheevos/master/README.md`)*

### Server Communication (rapi / rc_client)
The `rapi` component helps build URLs for RetroAchievements web services, and `rc_client` is the preferred way for a client to interact with the server.

```c
// Example of converting a return code to a human-readable string
const char* rc_error_str(int ret);
```
*(From `https://raw.githubusercontent.com/RetroAchievements/rcheevos/master/README.md`)*