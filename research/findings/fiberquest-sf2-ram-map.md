# Research: fiberquest-sf2-ram-map

**Date:** 2026-03-05  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://datacrystal.tcrf.net/wiki/Street_Fighter_II_Turbo:_Hyper_Fighting_(SNES)/RAM_map, https://www.romhacking.net/games/149/, https://gamehacking.org/game/6694, https://gamehacking.org/game/1, https://www.retroachievements.org/game/1273

---

## Research Note: fiberquest-sf2-ram-map

**Date:** 2026-03-05

### Summary
The primary goal of finding exact SNES Street Fighter II Turbo and Super Bomberman RAM addresses for player health, win counters, game state, and lives was not met by the provided source content. The most relevant source, `datacrystal.tcrf.net`, returned a 404 error, and the RetroAchievements link returned a 403 error, preventing access to potential data. Other provided links were irrelevant to the specified games or research topic. Consequently, no specific RAM addresses could be identified from the given materials. The RetroAchievements public API, specifically `API_GetGameInfoAndUserProgress.php`, does not expose achievement conditions (RAM addresses) without authentication.

### Questions to Answer

**1. P1 health address for SNES Street Fighter II Turbo:**
Not found in the provided content. The `datacrystal.tcrf.net` link, which was expected to contain this information, returned a "FETCH ERROR: HTTP Error 404: Not Found".

**2. P2 health address for SNES Street Fighter II Turbo:**
Not found in the provided content. The `datacrystal.tcrf.net` link, which was expected to contain this information, returned a "FETCH ERROR: HTTP Error 404: Not Found".

**3. P1 wins counter address for SNES Street Fighter II Turbo:**
Not found in the provided content. The `datacrystal.tcrf.net` link, which was expected to contain this information, returned a "FETCH ERROR: HTTP Error 404: Not Found".

**4. P2 wins counter address for SNES Street Fighter II Turbo:**
Not found in the provided content. The `datacrystal.tcrf.net` link, which was expected to contain this information, returned a "FETCH ERROR: HTTP Error 404: Not Found".

**5. Game state address (character select / fighting / round over / game over) for SNES Street Fighter II Turbo:**
Not found in the provided content. The `datacrystal.tcrf.net` link, which was expected to contain this information, returned a "FETCH ERROR: HTTP Error 404: Not Found".

**6. P1 lives address for SNES Super Bomberman:**
Not found in the provided content. None of the provided sources were relevant to Super Bomberman.

**7. P2 lives address for SNES Super Bomberman:**
Not found in the provided content. None of the provided sources were relevant to Super Bomberman.

**8. Bomb counts address for SNES Super Bomberman (if possible):**
Not found in the provided content. None of the provided sources were relevant to Super Bomberman.

**9. Does the RetroAchievements public API (no auth needed) expose achievement conditions at `https://retroachievements.org/API/API_GetGameInfoAndUserProgress.php` or similar?**
No, the RetroAchievements public API, specifically the `API_GetGameInfoAndUserProgress.php` endpoint, does not expose achievement conditions (e.g., raw RAM addresses or logic strings) without authentication. This endpoint requires `User` and `APIKey` parameters. Even with authentication, this specific endpoint primarily provides game information and user progress, not the detailed achievement definition strings. Another endpoint, `API_GetAchievementDefinition.php`, *does* provide the achievement definition string (which contains RAM addresses), but it also requires authentication (`User` and `APIKey`). Therefore, no public API endpoint without authentication exposes these conditions.

### Gaps / Follow-up
*   The critical `datacrystal.tcrf.net` link for Street Fighter II Turbo RAM map resulted in a 404. A follow-up would be to verify the URL or search for an alternative, correctly linked TCRF page or similar resource (e.g., GameHacking.org, speedrunning wikis, GitHub repos specifically for SNES RAM maps or emulators).
*   The `retroachievements.org` link resulted in a 403. A follow-up would be to investigate why access was forbidden and attempt to access it again, or search for alternative ways to view achievement conditions if they are publicly available on the site (even if not via the API without auth).
*   No sources were found for Super Bomberman SNES RAM addresses. A targeted search for "Super Bomberman SNES RAM map", "Super Bomberman SNES memory addresses", or similar on TCRF, GameHacking.org, or speedrunning communities would be necessary.
*   The prompt mentioned "any GitHub repos with SNES RAM maps". None were provided or found via the given links. A direct search on GitHub for "SNES RAM map Street Fighter II" or "SNES RAM map Super Bomberman" could yield results.

### Relevant Code/API Snippets
No relevant code or API snippets could be extracted from the provided content as the requested RAM addresses were not found, and the RetroAchievements API endpoint did not expose the conditions in the desired format without authentication.