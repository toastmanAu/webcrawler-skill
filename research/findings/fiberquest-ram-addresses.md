# Research: fiberquest-ram-addresses

**Date:** 2026-03-05  
**Status:** AUTO-CRAWLED (Gemini gemini-2.5-flash)  
**Seeds:** https://gamehacking.org/system/snes, https://raw.githubusercontent.com/RetroAchievements/RALibretro/master/README.md, https://tcrf.net/Street_Fighter_II_Turbo:_Hyper_Fighting_(SNES), https://tcrf.net/Super_Bomberman_(SNES), https://datacrystal.romhacking.net/wiki/Street_Fighter_II_Turbo:_Hyper_Fighting:RAM_map, https://datacrystal.romhacking.net/wiki/Super_Bomberman:RAM_map

---

## Research Note: fiberquest-ram-addresses

**Date:** 2026-03-05

### Summary
This research aimed to identify concrete RAM addresses for critical game state variables (Player 1 HP/lives, Player 2 HP/lives, score, round/match state, game-over flag) for ten target games across various retro consoles. The primary sources specified were RetroAchievements achievement condition strings, GameHacking.org RAM maps, TCRF.net game internals, and GitHub repositories with memory maps. However, the provided source content did not contain any specific RAM addresses, RetroAchievements condition strings, or detailed memory maps for the target games. Consequently, no concrete RAM addresses could be extracted from the given materials.

### Concrete RAM Addresses for Top 10 FiberQuest Target Games

The goal was to provide a JSON-ready lookup table with RAM addresses for specific game states. Unfortunately, the provided source content does not contain the necessary information to fulfill this request.

*   The `gamehacking.org/system/snes` page is a general system overview and does not list specific RAM maps or addresses for individual games. While it shows "Score Modifier P1" and "Score Modifier P2" for games like "Super Slap Shot," it does not provide the actual memory addresses for these modifiers.
*   The `RALibretro` README describes the emulator and its integration with RetroAchievements but does not include any actual RetroAchievements achievement condition strings that encode memory addresses.
*   The links to `tcrf.net` and `datacrystal.romhacking.net` for "Street Fighter II Turbo: Hyper Fighting (SNES)" and "Super Bomberman (SNES)" resulted in `HTTP Error 404: Not Found`, rendering them unusable for this research.
*   No other GitHub repositories with documented memory maps were provided.

Therefore, the lookup table below reflects the inability to find the requested data within the given sources.

```json
[
  {
    "gameName": "Street Fighter II Turbo",
    "console": "SNES",
    "core": "snes9x_libretro",
    "addresses": {
      "p1hp": "N/A - Not found in provided content",
      "p2hp": "N/A - Not found in provided content",
      "score": "N/A - Not found in provided content",
      "roundState": "N/A - Not found in provided content",
      "gameOverFlag": "N/A - Not found in provided content"
    },
    "paymentTriggers": []
  },
  {
    "gameName": "Super Street Fighter II",
    "console": "SNES",
    "core": "snes9x_libretro",
    "addresses": {
      "p1hp": "N/A - Not found in provided content",
      "p2hp": "N/A - Not found in provided content",
      "score": "N/A - Not found in provided content",
      "roundState": "N/A - Not found in provided content",
      "gameOverFlag": "N/A - Not found in provided content"
    },
    "paymentTriggers": []
  },
  {
    "gameName": "Mortal Kombat",
    "console": "SNES",
    "core": "snes9x_libretro",
    "addresses": {
      "p1hp": "N/A - Not found in provided content",
      "p2hp": "N/A - Not found in provided content",
      "score": "N/A - Not found in provided content",
      "roundState": "N/A - Not found in provided content",
      "gameOverFlag": "N/A - Not found in provided content"
    },
    "paymentTriggers": []
  },
  {
    "gameName": "Mortal Kombat",
    "console": "Genesis",
    "core": "picodrive_libretro",
    "addresses": {
      "p1hp": "N/A - Not found in provided content",
      "p2hp": "N/A - Not found in provided content",
      "score": "N/A - Not found in provided content",
      "roundState": "N/A - Not found in provided content",
      "gameOverFlag": "N/A - Not found in provided content"
    },
    "paymentTriggers": []
  },
  {
    "gameName": "Super Bomberman",
    "console": "SNES",
    "core": "snes9x_libretro",
    "addresses": {
      "p1hp": "N/A - Not found in provided content",
      "p2hp": "N/A - Not found in provided content",
      "score": "N/A - Not found in provided content",
      "roundState": "N/A - Not found in provided content",
      "gameOverFlag": "N/A - Not found in provided content"
    },
    "paymentTriggers": []
  },
  {
    "gameName": "NBA Jam",
    "console": "SNES",
    "core": "snes9x_libretro",
    "addresses": {
      "p1hp": "N/A - Not found in provided content",
      "p2hp": "N/A - Not found in provided content",
      "score": "N/A - Not found in provided content",
      "roundState": "N/A - Not found in provided content",
      "gameOverFlag": "N/A - Not found in provided content"
    },
    "paymentTriggers": []
  },
  {
    "gameName": "NBA Jam",
    "console": "Genesis",
    "core": "picodrive_libretro",
    "addresses": {
      "p1hp": "N/A - Not found in provided content",
      "p2hp": "N/A - Not found in provided content",
      "score": "N/A - Not found in provided content",
      "roundState": "N/A - Not found in provided content",
      "gameOverFlag": "N/A - Not found in provided content"
    },
    "paymentTriggers": []
  },
  {
    "gameName": "Pong variants",
    "console": "Atari 2600",
    "core": "stella_libretro",
    "addresses": {
      "p1hp": "N/A - Not found in provided content",
      "p2hp": "N/A - Not found in provided content",
      "score": "N/A - Not found in provided content",
      "roundState": "N/A - Not found in provided content",
      "gameOverFlag": "N/A - Not found in provided content"
    },
    "paymentTriggers": []
  },
  {
    "gameName": "Dr. Mario",
    "console": "NES",
    "core": "nestopia_libretro",
    "addresses": {
      "p1hp": "N/A - Not found in provided content",
      "p2hp": "N/A - Not found in provided content",
      "score": "N/A - Not found in provided content",
      "roundState": "N/A - Not found in provided content",
      "gameOverFlag": "N/A - Not found in provided content"
    },
    "paymentTriggers": []
  },
  {
    "gameName": "Tetris",
    "console": "Game Boy",
    "core": "gambatte_libretro",
    "addresses": {
      "p1hp": "N/A - Not found in provided content",
      "p2hp": "N/A - Not found in provided content",
      "score": "N/A - Not found in provided content",
      "roundState": "N/A - Not found in provided content",
      "gameOverFlag": "N/A - Not found in provided content"
    },
    "paymentTriggers": []
  },
  {
    "gameName": "F-Zero",
    "console": "SNES",
    "core": "snes9x_libretro",
    "addresses": {
      "p1hp": "N/A - Not found in provided content",
      "p2hp": "N/A - Not found in provided content",
      "score": "N/A - Not found in provided content",
      "roundState": "N/A - Not found in provided content",
      "gameOverFlag": "N/A - Not found in provided content"
    },
    "paymentTriggers": []
  }
]
```

### Gaps / Follow-up
1.  **RetroAchievements Condition Strings**: The most significant gap is the lack of actual RetroAchievements achievement condition strings. These strings are explicitly mentioned as encoding exact addresses and would be the most direct way to obtain the required data. Accessing the RetroAchievements.org database or a repository of achievement definitions would be crucial.
2.  **GameHacking.org Specific Game Pages**: The provided `gamehacking.org` link was a general system page. To find RAM maps or code addresses, specific game pages (e.g., `gamehacking.org/game/snes/Street_Fighter_II_Turbo`) would need to be accessed and parsed.
3.  **TCRF.net and Datacrystal.romhacking.net**: The 404 errors for the provided TCRF.net and Datacrystal links indicate that these specific URLs were incorrect or the pages do not exist. Further investigation would require finding the correct URLs for the target games' RAM maps or internals on these sites.
4.  **GitHub Repositories**: No specific GitHub repositories containing documented memory maps for the target games were provided. A broader search on GitHub for "SNES memory map," "Genesis RAM map," etc., for each specific game would be necessary.
5.  **Payment Triggers**: The concept of `paymentTriggers` was mentioned in the desired output format, but no information or context on how to derive or find these triggers was present in the provided content. This would require further clarification or additional data sources.

### Relevant Code/API Snippets
While no specific RAM addresses were found, the `RALibretro` README provides context on how RetroAchievements are developed and integrated with emulators. The command-line arguments for `RALibretro.exe` are relevant for understanding how games are launched with specific cores and systems:

```
Argument|Description
-|-
-c [--core]|the core's name, e.g. `--core picodrive_libretro`
-s [--system]|the system id, see ConsoleID in [RAInterface/RA_Consoles.h](https://github.com/RetroAchievements/RAInterface/blob/master/RA_Consoles.h), e.g. `--system 1`
-g [--game]|full path to the game's file, e.g. `--game "C:\ROMS\GEN\Demons Of Asteborg Demo.gen"`
```
This snippet is relevant for understanding the emulation environment where these RAM addresses would be monitored. The `ConsoleID` reference points to `RAInterface/RA_Consoles.h`, which would contain a mapping of system IDs to console names, useful for populating the `console` and `core` fields in the JSON output if the core names were consistently derived. For example, `picodrive_libretro` is suggested for Genesis. For SNES, `snes9x_libretro` is a common core. For NES, `nestopia_libretro` or `fceumm_libretro`. For Game Boy, `gambatte_libretro`. For Atari 2600, `stella_libretro`. These core names are inferred based on common libretro usage, as they were not explicitly provided for all target games in the source.