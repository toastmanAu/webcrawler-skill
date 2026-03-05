# Research: fiberquest-ram-maps-multi-game

**Date:** 2026-03-05  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://datacrystal.tcrf.net/wiki/Super_Mario_World_(SNES)/RAM_map, https://datacrystal.tcrf.net/wiki/The_Legend_of_Zelda:_A_Link_to_the_Past/RAM_map, https://www.zophar.net/cheats/snes/super-mario-world.html, https://www.zophar.net/cheats/snes/the-legend-of-zelda-a-link-to-the-past.html, https://gamehacking.org/game/7740, https://gamehacking.org/game/6871

---

Date: 2026-03-05

## Summary

The research aimed to identify specific RAM addresses for key game metrics and events in Super Mario World, Super Bomberman, International Superstar Soccer Deluxe, and Zelda: A Link to the Past, to support the FiberQuest multi-game economy pack. Based on the provided web content, direct RAM addresses for game-specific metrics such as coins, lives, score, health, kill counters, rupees, or event flags (e.g., goal, shop purchase, enemy kill) were largely not found. The Super Mario World RAM map only provided controller input data, and no relevant information was available for Super Bomberman or International Superstar Soccer Deluxe. The provided link for Zelda: A Link to the Past RAM map resulted in a 404 error.

## Super Mario World — coins, lives, score

The provided RAM map for Super Mario World on Data Crystal (`https://datacrystal.tcrf.net/wiki/Super_Mario_World_(SNES)/RAM_map`) details controller input data but does not contain RAM addresses for coins, lives, or score.

*   **Controller Data (example):**
    *   `7E0015`: "Currently Pressed" data, set 1
    *   `7E0016`: "Just Pressed this Frame" data, set 1
    *   `7E0017`: "Currently Pressed" data, set 2
    *   `7E0018`: "Just Pressed this Frame" data, set 2
    *   Specific buttons are checked by ANDing with values like `01` (Right), `02` (Left), `10` (Start), `40` (X), `80` (A/B).

The Zophar's Domain cheats page (`https://www.zophar.net/cheats/snes/super-mario-world.html`) lists various cheat files (e.g., GG codes, PAR codes) that claim to modify aspects like invincibility, infinite lives, or item drop boxes. However, the page does not explicitly provide the underlying RAM addresses used by these cheats in a human-readable format. The content only offers downloads of cheat files, which cannot be parsed in this research context.

Therefore, specific RAM addresses for coins, lives, or score for Super Mario World were not found in the provided content.

## Super Bomberman — player health/alive status, kill counter

No web content was provided for Super Bomberman. Therefore, RAM addresses for player health/alive status or kill counters could not be identified.

## International Superstar Soccer Deluxe — score per team, goal event

No web content was provided for International Superstar Soccer Deluxe. Therefore, RAM addresses for score per team or goal events could not be identified.

## Zelda: A Link to the Past — rupees (money), shop purchase event, enemy kill

The primary source for RAM maps, `https://datacrystal.tcrf.net/wiki/The_Legend_of_Zelda:_A_Link_to_the_Past/RAM_map`, returned a `[FETCH ERROR: HTTP Error 404: Not Found]`, rendering it unusable.

The Zophar's Domain page for Zelda: A Link to the Past cheats (`https://www.zophar.net/cheats/snes/the-legend-of_zelda-a-link_to_the_past.html`) is a game selection menu and does not directly provide cheat codes or RAM addresses on the page itself.

Therefore, specific RAM addresses for rupees, shop purchase events, or enemy kills for Zelda: A Link to the Past were not found in the provided content.

## Gaps / Follow-Up

The provided web content is insufficient to answer the research questions regarding RAM addresses for Super Mario World (coins, lives, score), Super Bomberman (health, kill counter), International Superstar Soccer Deluxe (score, goal event), and Zelda: A Link to the Past (rupees, shop purchase, enemy kill).

**Follow-up actions should include:**

1.  **Super Mario World:**
    *   Investigate the "SMW Central's RAM Map" mentioned in the Data Crystal article, as this was not provided in the source content.
    *   Obtain and parse the cheat files from Zophar's Domain or similar sites to extract the underlying RAM addresses. This would require tools to interpret Game Genie (GG) or Pro Action Replay (PAR) codes.
    *   Search for more comprehensive Super Mario World RAM maps on other game hacking or emulation communities.
2.  **Super Bomberman & International Superstar Soccer Deluxe:**
    *   Conduct a broad search for RAM maps, cheat codes, or game hacking resources specifically for these SNES titles.
    *   Explore emulation debugging tools (e.g., in RetroArch, BizHawk) to dynamically identify changing RAM addresses during gameplay for the desired metrics and events.
3.  **Zelda: A Link to the Past:**
    *   Find an alternative, working RAM map for Zelda: A Link to the Past, as the Data Crystal link was broken.
    *   Similar to Super Mario World, investigate cheat codes from Zophar's Domain or other sources and parse them for RAM addresses.
    *   Utilize emulation debugging to pinpoint addresses for rupees, shop purchase flags, and enemy kill events.
4.  **Discrete Event Detection:** For all games, once potential RAM addresses are found, further analysis or in-emulator testing will be required to confirm if they represent discrete events (e.g., a flag that briefly changes on a goal) or simply a continuously updated state (e.g., a score counter). The Node.js sidecar will need to implement logic to detect changes in these addresses.

## Relevant Code/API Snippets

No specific RAM addresses were identified from the provided content that would warrant a code snippet for polling. The `READ_CORE_MEMORY` RPC method (port 55355) mentioned in the FiberQuest project description would be the relevant API for polling these addresses once identified.