# Research: harvest-moon-snes-ram-map

**Date:** 2026-03-05  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://datacrystal.tcrf.net/wiki/Harvest_Moon_(SNES)/RAM_map, https://www.retroachievements.org/game/1582, https://raw.githubusercontent.com/RetroAchievements/RAScripts/master/SNES/HarvestMoon.lua, https://datacrystal.tcrf.net/wiki/Harvest_Moon_(SNES), https://www.romhacking.net/games/306/

---

## Research Note: Harvest Moon SNES RAM Map

**Date:** 2026-03-05

### Summary

The provided web content for "Harvest Moon (SNES)/RAM map" on Data Crystal is a stub, containing only one general RAM address for music control. Attempts to access RetroAchievements resources, which often contain detailed memory maps in their achievement scripts, resulted in fetch errors (403 Forbidden and 404 Not Found). The Romhacking.net link provided was for a different game (Front Mission) and thus irrelevant. Consequently, the specific RAM addresses for gold/money balance, crop sale events, shop purchase events, or shipping bin contents, particularly those that change discretely on transaction events, could not be identified from the given sources.

### Gold/money balance

The RAM address for the player's gold or money balance was not found in the provided content. The `datacrystal.tcrf.net/wiki/Harvest_Moon_(SNES)/RAM_map` page is a stub and does not list this information.

### Crop sale events

Specific RAM addresses that change discretely upon crop sale events were not found in the provided content. The available RAM map is incomplete.

### Shop purchase events

Specific RAM addresses that change discretely upon shop purchase events were not found in the provided content. The available RAM map is incomplete.

### Shipping bin contents

Specific RAM addresses detailing the contents of the shipping bin or changes related to it were not found in the provided content. The available RAM map is incomplete.

### Gaps / Follow-up

The primary source for Harvest Moon (SNES) RAM mapping, `datacrystal.tcrf.net/wiki/Harvest_Moon_(SNES)/RAM_map`, is a highly incomplete stub. The RetroAchievements links, which were expected to contain detailed memory addresses often used in achievement logic (e.g., in Lua scripts), failed to fetch.

To find the required RAM addresses, further research is needed from more comprehensive sources, such as:
1.  **Alternative RAM map databases**: Search for other community-maintained RAM maps or memory addresses for Harvest Moon (SNES).
2.  **RetroAchievements scripts**: Investigate why the `raw.githubusercontent.com` link for `HarvestMoon.lua` resulted in a 404. It's possible the script has been moved, renamed, or is located elsewhere within the RetroAchievements repository structure. If found, these scripts often contain direct memory address lookups.
3.  **Game-specific hacking communities/forums**: Consult forums or wikis dedicated to SNES game hacking or Harvest Moon speedrunning/modding, as these communities often reverse-engineer memory layouts.
4.  **SNES emulation debugging**: If no external sources are found, direct debugging of the game within an SNES emulator (e.g., Mesen-S, bsnes/higan) could be used to identify memory locations that change during the specified events.

### Relevant Code/API Snippets

No relevant code or API snippets could be extracted as no specific RAM addresses for the requested events were found in the provided content. The only address found was:

*   `RAM $000110 = Controls what song to play.` (from `datacrystal.tcrf.net/wiki/Harvest_Moon_(SNES)/RAM_map`)