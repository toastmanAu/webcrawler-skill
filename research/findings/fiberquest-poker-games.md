# Research: fiberquest-poker-games

**Date:** 2026-03-05  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://retroachievements.org/gameList.php?c=2&s=5&f=poker, https://www.mobygames.com/game/snes/super-caesars-palace/, https://gamehacking.org/system/snes, https://www.romhacking.net/games/?name=poker&system=&region=&combo=&category=&perpage=20&page=1&submit=Go

---

## Research Note: fiberquest-poker-games

**Date:** 2026-03-05

### Summary

The provided web content is severely limited due to multiple fetch errors for key resources like RetroAchievements, MobyGames, and Romhacking.net. As a result, it is not possible to identify specific retro poker or card games with RetroAchievements support, determine their multiplayer capabilities, or assess their RAM map cleanliness for Fiber payment integration. While GameHacking.org confirms the existence of tools to find and manipulate RAM addresses (e.g., for cheat codes), it does not provide specific game data or RAM maps for any poker games. Therefore, most of the research questions cannot be answered with the given information.

### Which poker/card games exist on SNES, Genesis, NES, GBA with RA achievement sets — Texas Hold'em, Video Poker, Casino games, Blackjack, any multiplayer card games.

The provided content does not allow for the identification of specific poker or card games on SNES, Genesis, NES, or GBA that have RetroAchievements (RA) achievement sets. The links to RetroAchievements.org, MobyGames.com, and Romhacking.net, which would contain this information, all resulted in fetch errors (HTTP Error 403: Forbidden or 404: Not Found). GameHacking.org lists systems but does not provide game lists by genre or RA support.

### Specifically look for any with 2-player vs mode or link cable multiplayer.

Due to the fetch errors on game-specific databases (RetroAchievements, MobyGames, Romhacking.net), it is not possible to identify any poker or card games with 2-player vs mode or link cable multiplayer from the provided content.

### RAM map compatibility — do poker games have clean money/chip count addresses that map naturally to Fiber channel balances?

The `gamehacking.org` content indicates that "Codes" exist for various games across systems like SNES, Genesis, NES, and GBA, and mentions "Code Converter Devices" such as Game Genie, Pro Action Replay, X-Terminator, and GoldFinger. This implies that RAM addresses for game variables (like money, scores, or chip counts) can be identified and manipulated. However, the provided content *does not* offer specific RAM maps for any poker games, nor does it confirm whether these addresses are "clean" or "naturally map" to Fiber channel balances. It only confirms the general capability to find and use such addresses.

### The ideal case: a poker game where chip stack in RAM = Fiber channel balance in shannons — completely natural 1:1 mapping.

The provided content does not contain any specific game data or RAM maps that would allow for the identification of such an ideal case. This question describes a hypothetical scenario that cannot be confirmed or denied with the given information.

### Any arcade poker/gambling games on FinalBurn Neo with RA support.

The provided content does not mention FinalBurn Neo, arcade games, or their RetroAchievements support. Therefore, this question cannot be answered.

### Consider: could we make a game where the GAME ITSELF is the channel UI? Player's chip stack IS their channel balance, updated in real time via WRITE_CORE_MEMORY as payments flow. This would be unprecedented. Rate each game: RA coverage, RAM map cleanliness, multiplayer potential, Fiber integration elegance.

The concept of using `WRITE_CORE_MEMORY` to update a player's chip stack in real-time as their channel balance is an innovative idea. The `gamehacking.org` content indirectly supports the technical feasibility of *writing* to core memory (via cheat devices), which is a prerequisite for `WRITE_CORE_MEMORY`. However, the provided content does not offer any specific game data to rate *any* game on RA coverage, RAM map cleanliness, multiplayer potential, or Fiber integration elegance. Without access to game lists, RAM maps, or multiplayer details, a rating is impossible.

### Gaps / Follow-up

1.  **Access to RetroAchievements.org:** The primary gap is the inability to access `https://retroachievements.org/gameList.php?c=2&s=5&f=poker`. Gaining access to this resource is crucial for identifying games with RA support.
2.  **Access to MobyGames.com and Romhacking.net:** These sites would provide game details, genres, and potentially multiplayer information.
3.  **Specific RAM Maps:** Even if games are identified, detailed RAM maps (e.g., from GameFAQs, ROM hacking communities, or direct memory analysis) are needed to assess the "cleanliness" of chip count addresses and their suitability for 1:1 mapping.
4.  **FinalBurn Neo Game Lists:** Research into FinalBurn Neo's game library and its RA support would be required for arcade titles.
5.  **Fiber API Documentation:** While the prompt mentions `WRITE_CORE_MEMORY`, understanding the full Fiber API for real-time channel balance updates and memory interaction would be essential for the "game as UI" concept.

### Relevant Code/API Snippets

No specific code or API snippets are present in the provided source content. The prompt mentions `WRITE_CORE_MEMORY` as a conceptual API for Fiber integration, but the source content does not elaborate on it. The `gamehacking.org` content implicitly refers to memory manipulation through "Codes" and "Code Converter Devices," which are analogous to reading/writing specific RAM addresses, but no actual code is provided.