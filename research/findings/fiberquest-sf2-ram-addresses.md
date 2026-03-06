# Research: fiberquest-sf2-ram-addresses

**Date:** 2026-03-06  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://datacrystal.tcrf.net/wiki/Street_Fighter_II_Turbo:_Hyper_Fighting/RAM_map, https://www.retroachievements.org/game/1185, https://raw.githubusercontent.com/RetroAchievements/RAScripts/master/SNES/StreetFighterIITurbo.lua, https://gamehacking.org/game/5894, https://www.zophar.net/cheats/snes/street-fighter-ii-turbo-hyper-fighting.html

---

## Research Note: fiberquest-sf2-ram-addresses

**Date:** 2026-03-06

### Summary
The research goal was to identify confirmed working RAM addresses for key game states in Street Fighter II Turbo (SNES) for the FiberQuest project, specifically focusing on player health, round timer, match win counters, and current screen/mode. Unfortunately, the provided web content did not yield any of the requested RAM map information. The links to Data Crystal, RetroAchievements, and GitHub for RAScripts resulted in fetch errors (404 or 403), while GameHacking.org pointed to an unrelated GBA game, and Zophar's Domain provided only a game selection list without actual cheat codes or RAM maps for Street Fighter II Turbo. Therefore, none of the specific RAM addresses could be identified from the given sources.

### P1 health address, P2 health address, and byte size/encoding
The provided content does not contain confirmed working RAM addresses for P1 or P2 health, nor details on their byte size or encoding. The previously suggested P1 health address of `0x0530` could not be verified from the provided sources.

### Round timer address
The provided content does not contain a confirmed working RAM address for the round timer.

### Match win counter per player
The provided content does not contain confirmed working RAM addresses for match win counters for either player.

### Current screen/mode address (title screen vs fight vs continue screen)
The provided content does not contain a confirmed working RAM address for detecting the current game screen or mode.

### Are these addresses consistent across all SF2 Turbo regions (USA/JP/EUR)?
The provided content does not contain any information regarding the consistency of RAM addresses across different regions (USA/JP/EUR) for Street Fighter II Turbo.

### Gaps / Follow-up
The primary gap is the complete lack of RAM map information in the provided sources. To address this, the following follow-up actions are recommended:
1.  **Verify Source URLs:** Re-check the URLs for `datacrystal.tcrf.net/wiki/Street_Fighter_II_Turbo:_Hyper_Fighting/RAM_map`, `retroachievements.org/game/1185`, and `raw.githubusercontent.com/RetroAchievements/RAScripts/master/SNES/StreetFighterIITurbo.lua` to ensure they are correct and accessible. It's possible the URLs are outdated or have moved.
2.  **Alternative Search:** Conduct a broader search for SNES Street Fighter II Turbo RAM maps, cheat codes, or RetroAchievements scripts from other reliable emulation or game hacking communities.
3.  **Direct Emulator Debugging:** If external sources remain elusive, consider using an SNES emulator with debugging capabilities (e.g., BizHawk, SNES9x with debuggers) to manually identify RAM addresses by observing memory changes during gameplay. This would involve playing the game and monitoring memory regions while health, timer, or screen states change.

### Relevant Code/API Snippets
No relevant code or API snippets can be provided as no RAM addresses were found in the source content. The FiberQuest project's `UDP RAM polling (READ_CORE_MEMORY, port 55355)` mechanism is designed to consume these addresses, but the addresses themselves are currently unknown.