# FiberQuest Extended Game RAM Maps
**Date:** 2026-03-15
**Status:** RESEARCHED (web scrape via web_fetch + web_search)
**Sources:** sneslab.net, gamehacking.org, DataCrystal, RetroAchievements community, SMWCentral

---

## Notes on RetroArch RAM Access
- SNES WRAM addresses: use `7Exxxx` format. RetroArch `READ_CORE_MEMORY` uses last 4 hex digits.
  - e.g. `7E00C9` → address `0x00C9`, size 2
- **SRAM ≠ WRAM**: Some games (Zelda) store persistent data in SRAM (save battery), not WRAM. SRAM is at `7Exxxx` addresses but may only update on save events. Use with caution.
- All addresses below are **WRAM** unless noted as SRAM.

---

## 🏎️ F-Zero (SNES)
**Source:** https://sneslab.net/wiki/F-Zero_RAM_Map (comprehensive community map)

| Address | Size | Description | Notes |
|---------|------|-------------|-------|
| `0x00C9` | 2 bytes | Player machine power (energy/HP bar) | Game allows negative values — triggers explosion |
| `0x0059` | 1 byte | Spare machines (extra lives) | |
| `0x0053` | 1 byte | Current race number | 0x00-0x04 GP mode, 0x00-0x06 Practice |
| `0x0090` | 1 byte | Current league | 0x00=Knight, 0x01=Queen, 0x02=King |
| `0x00C0` | 1 byte | Race timer (minutes) | |
| `0x00C1` | 1 byte | Race timer (seconds) | |
| `0x00C2` | 1 byte | Race timer (centiseconds) | |
| `0x1150` | 1 byte | Player race position/rank | 0x00 = 1st place (confirmed via Game Genie) |
| `0x0057` | 1 byte | Difficulty | 0x00=Beginner, 0x01=Standard, 0x02=Expert/Master |
| `0x0052` | 1 byte | Player car type | 0x00=Blue Falcon, 0x01=Wild Goose, 0x02=Golden Fox, 0x03=Fire Stingray |

**Payment trigger ideas:**
- Per position change (overtake = opponent pays)
- Machine power threshold (drops below 25% = risk payment)
- Race finish position (winner takes pot)
- Best lap time (fastest lap bonus)

**FiberQuest economy:**
- Wager per position: e.g. 500 shannons per place gained
- Energy-based: drop below half power = lose 1000 shannons
- Race winner: takes pot from all entrants

---

## 🥊 Killer Instinct (SNES)
**Source:** gamehacking.org game #43445

| Address | Size | Description | Notes |
|---------|------|-------------|-------|
| `0x0D28` | 1 byte | P2 Health (high byte) | Max `0x78` (120) |
| `0x0D2A` | 1 byte | P2 Health (confirmed) | Same as above, two bytes written together |
| `0x0250` | 1 byte | P1 Costume Color Modifier | Non-health, but confirms P1 data region |
| `0x08A3` | 1 byte | P1 Jump Height Modifier | Non-health, useful for jump detection |

**⚠️ Gap:** P1 health not explicitly mapped. Likely nearby P2 health (`0x0B28` or `0x0D26`?). Needs in-emulator verification.

**Payment trigger ideas:**
- Per HP delta (1 shannon per HP lost, as per SF2 model)
- Combo bonus: detect combo chain length
- C-C-C-COMBO multiplier: pay multiplier based on combo count
- ULTIMATE/ULTRA finish: bonus payout

---

## 🎮 Super Mario World (SNES)
**Source:** SMWCentral / gamehacking.org game #44865 + #88006

| Address | Size | Description | Notes |
|---------|------|-------------|-------|
| `0x0DBF` | 1 byte | Current coins | 0-99 |
| `0x0DC0` | 1 byte | Bonus Block Count Counter | Starts at 30, decreases per coin |

**⚠️ Gaps:**
- Lives address: DataCrystal page is a stub, SMWCentral has it but behind JS wall
- Score: SMW doesn't have a traditional score — combo points only. Not ideal for payment trigger.
- Lives mentioned as "Mario's Lives (Fake)" in SMWCentral but no confirmed address found

**Better payment models for SMW:**
- Per coin collected (increments `0x0DBF`) → 1 coin = X shannons
- Per Yoshi coin (special collectibles) — needs address
- Time-based level completion bonus

**Recommendation:** SMW is better as a speedrun format (time-to-clear) than a per-event payment game. Use coins as the micro-payment trigger.

---

## 🗡️ Zelda: A Link to the Past (SNES)
**Source:** alttp.run RAM map / romhacking.net

| Address | Size | Description | Notes |
|---------|------|-------------|-------|
| `0xF36C` | 1 byte | **SRAM** — Health capacity | Each increment of 0x08 = 1 full heart. Max 0xA0 |
| `0xF36D` | 1 byte | **SRAM** — Current health | Same 0x08/heart encoding |
| `0xF36B` | 1 byte | **SRAM** — Heart pieces collected | Out of 4 per full heart |
| `0xF028` | 2 bytes | **SRAM** — Rupee count | ~7EF028 in WRAM bank |

**⚠️ Important:** These are SRAM save-slot offsets, not live WRAM. SRAM is saved to battery when you save the game. Live WRAM mirrors may exist at different addresses.

**For RetroArch READ_CORE_MEMORY:** SRAM in SNES is at WRAM bank `0x70-0x7D` or `0xE0-0xFF`. RetroArch's `snes9x` exposes SRAM — test `READ_CORE_MEMORY 0xF028 2` for rupees.

**Payment trigger ideas:**
- Per rupee spent (shop interaction triggers payment to opponent)
- Per heart lost (health hit → payment)
- Per boss kill (dungeon clear bonus)

---

## 💣 Super Bomberman (SNES)
**Source:** Partial — gamehacking.org + GitHub disassembly note

| Address | Size | Description | Notes |
|---------|------|-------------|-------|
| `~0x0434` | 1 byte | P1 lives (estimated from SB4 series) | **Unverified** |
| `~0x0436` | 1 byte | P2 lives (estimated) | **Unverified** |

**⚠️ Status:** RAM not fully documented. GitHub disassembly (LIJI32/superbomberman) exists but notes "RAM is not entirely mapped." RetroAchievements has achievements which confirms RAM is findable, but not published publicly.

**Recommendation:** Use in-emulator RAM search (retroarch + BSNES debugger) to find live player state. Search for value that changes when a player dies. Should be near `0x0400-0x0500` range based on series data.

---

## 🚗 Super Mario Kart (SNES)
**Status:** Not found in this session. DataCrystal page exists but no RAM map content.

**Recommended approach:** RetroAchievements has SMK achievements — contact RA devs or check their code notes at:
`https://retroachievements.org/game/1074` (SMK SNES game ID)

---

## 🥊 Streets of Rage 2 (Genesis/Mega Drive)
**Status:** DataCrystal has no page. Separate from SNES — Genesis RAM is at `0xFF0000-0xFFFFFF`.

**Recommended approach:** Check:
- `https://datacrystal.tcrf.net/wiki/Streets_of_Rage_2_(Genesis)/RAM_map`
- Or genesis-specific tools (BizHawk Genesis debugger)

---

## Summary Table

| Game | P1 Health | P2 Health | Lives/Machines | Score/Coins | Rank/Position | Status |
|------|-----------|-----------|----------------|-------------|---------------|--------|
| F-Zero (SNES) | `0x00C9` (2B) | N/A | `0x0059` | N/A | `0x1150` | ✅ Ready |
| Killer Instinct (SNES) | ⚠️ ~`0x0B28`? | `0x0D28` | N/A | N/A | N/A | 🔶 P1 needs verify |
| Super Mario World (SNES) | N/A | N/A | ⚠️ unknown | `0x0DBF` (coins) | N/A | 🔶 Lives gap |
| Zelda: ALttP (SNES) | `0xF36D` (SRAM) | N/A | N/A | `0xF028` (rupees) | N/A | 🔶 SRAM caveat |
| Super Bomberman (SNES) | N/A | N/A | ~`0x0434` | N/A | N/A | ❌ Unverified |
| Super Mario Kart (SNES) | N/A | N/A | N/A | N/A | unknown | ❌ Not found |
| Streets of Rage 2 (Gen) | unknown | unknown | unknown | unknown | N/A | ❌ Not found |

---

## Recommended Next Steps

1. **F-Zero** — ✅ Ready to implement. `0x00C9` for energy, `0x1150` for position. High confidence.
2. **Killer Instinct** — P1 health needs in-emulator search. Load game, search RAM for value that drops when P1 takes damage. Likely at `0x0D26` or `0x0B28`.
3. **SMW** — Coins at `0x0DBF` confirmed. Lives needs SMWCentral RAM map (requires browser login wall). Alternative: search in BSNES debugger.
4. **Zelda ALttP** — Test `READ_CORE_MEMORY 0xF028 2` in RetroArch snes9x. If rupees update live, it's usable.
5. **Bomberman** — Use in-emulator RAM search: load game, note current lives value, lose a life, search for changed value. Should be deterministic.
