# FiberQuest Game Catalog
**Date:** 2026-03-05  
**Status:** MANUALLY COMPILED (web search + game hacking databases)

---

## RAM Address Reference
SNES WRAM addresses use the `7Exxxx` format. RetroArch `READ_CORE_MEMORY` uses the last 4 hex digits (e.g., `7E0530` → address `0x0530`, size 1).

---

## 🥊 FIGHTING GAMES

### Street Fighter II Turbo: Hyper Fighting (SNES)
- **Core:** `snes9x` ✅ Best RA support
- **P1 Health:** `0x0530` (max `0xA0` = 160, empty = `0x00`)
- **P2 Health:** `0x0730`
- **Payment trigger:** Per HP delta — 1 shannon per HP lost
- **Default wager:** 10 shannons/HP (so one fireball = ~320 shannons)
- **Settlement:** Round end (detect health hit 0), match end
- **Why it works:** Universal game recognition, clean binary health bars, TV-friendly for demo video
- **UI copy:** *"Hadouken! −32 HP → −320 shannons"*

### Mortal Kombat (SNES)
- **Core:** `snes9x` ✅
- **P1 Health:** `0x04B9` (max `0xA1`)
- **P2 Health:** `0x04BB`
- **Payment trigger:** Per damage, round win, FATALITY bonus (detect KO state)
- **Default wager:** 10 shannons/HP + 5000 shannon fatality bonus
- **UI copy:** *"FATALITY. +5000 shannons to winner."*

### Mortal Kombat II (SNES)
- **Core:** `snes9x` ✅
- **P1 Health:** `0x3254`
- **P2 Health:** `0x30AA`
- **Payment trigger:** Same as MK1

### Killer Instinct (SNES)
- **Core:** `snes9x` ✅
- **RAM:** Needs mapping — add as stretch goal after SF2 confirmed
- **Payment trigger:** Per combo hit, C-C-C-COMBO bonus multiplier

---

## 💣 VERSUS / PUZZLE

### Super Bomberman (SNES)
- **Core:** `snes9x` ✅
- **P1 Lives:** ~`0x0434` (per SB4 series reference — needs in-emulator verification)
- **P2 Lives:** ~`0x0436`
- **Payment trigger:** Per death (life lost = pay opponent), last survivor wins pot
- **Default wager:** 500 shannons per death, 2000 shannons winner bonus
- **Why it works:** 4-player capable, arcade feel, explosive deaths = great for video
- **UI copy:** *"💥 P2 eliminated! −500 shannons"*

### Dr. Mario (NES)
- **Core:** `fceumm` or `nestopia` ✅
- **RAM:** Score-based (needs mapping)
- **Payment trigger:** Per level cleared faster than opponent, per garbage sent
- **Why it works:** Pure skill, minimal prior knowledge needed, good visual

### Tetris (Game Boy)
- **Core:** `Gambatte` ✅ Most recommended for RA
- **RAM:** Score + lines cleared (needs mapping)
- **Payment trigger:** Per 4-line Tetris = payment, per garbage block sent
- **Model:** "garbage economy" — send lines, collect shannons

---

## 🏀 SPORTS

### NBA Jam (SNES)
- **Core:** `snes9x` ✅
- **P2 Score:** `0x0CB9` (confirmed via gamehacking.org)
- **Related:** `0x0CBD`, `0x0CBF`
- **P1 Score:** Likely `0x0CB5` or nearby — needs in-emulator verification
- **Payment trigger:** Per basket scored (2pt = X shannons, 3pt = 1.5X, dunk = 2X)
- **On Fire bonus:** Detect "on fire" state → payment multiplier
- **UI copy:** *"BOOM SHAKALAKA! 3-pointer +1500 shannons 🔥"*

### NBA Jam (Genesis)
- **Core:** `genesis_plus_gx` ✅
- **Score area:** `0xFF1CAC` region (needs byte-level verification)

### Tecmo Super Bowl (NES)
- **Core:** `fceumm` ✅
- **Payment trigger:** Per touchdown, per safety, final score settle
- **Why it works:** Beloved by speedrunners, NFL nostalgia

### Sensible Soccer / International Superstar Soccer (SNES)
- **Core:** `snes9x` ✅
- **Payment trigger:** Per goal, per penalty kick, final result settle
- **Model:** Match bet — open channel at kickoff, settle at full time

---

## 🏎️ RACING

### F-Zero (SNES)
- **Core:** `snes9x` ✅
- **RAM:** Position/rank bytes (needs mapping)
- **Payment trigger:** Per position change, lap splits, finish order
- **Model:** Position-based streaming — leading earns shannons per second

### Super Mario Kart (SNES)
- **Core:** `snes9x` ✅
- **Payment trigger:** Per position, per item hit (blue shell = big payment), race result
- **Model:** Place-based payout (1st=100%, 2nd=80%, etc.)
- **Why it works:** Universally loved, chaotic = entertaining for spectators

### Rock n' Roll Racing (SNES/Genesis)
- **Core:** `snes9x` / `genesis_plus_gx` ✅
- **Payment trigger:** Per kill, per lap, race result
- **Why it works:** Weapons + racing = natural money stakes

---

## 🕹️ ARCADE / CLASSIC

### Pong (Atari 2600)
- **Core:** `stella` ✅
- **RAM:** Score at `0x00` and `0x01` (one of the simplest RAM maps ever)
- **Payment trigger:** Per point scored
- **Default wager:** 1000 shannons per point
- **Why it works:** Universal recognition, trivially simple to map, great for demo fallback
- **UI copy:** *"Point scored! +1000 shannons"*

### Galaga (Arcade/NES)
- **Core:** `FinalBurn Neo` (arcade) or `fceumm` (NES) ✅
- **Payment trigger:** Co-op — per wave cleared, per boss galaga destroyed, share pot at game over
- **Model:** Co-op pool — both contribute, split proportional to score

### Pac-Man (Arcade)
- **Core:** `FinalBurn Neo` ✅
- **Payment trigger:** Competitive time trial — who clears more levels per session
- **Model:** Score-based, settle at agreed time limit

---

## 🤜 CO-OP BRAWLERS (pay-to-revive model)

### Streets of Rage 2 (Genesis)
- **Core:** `genesis_plus_gx` ✅ Best Genesis core for RA
- **P1 Lives/Health:** Needs mapping
- **Payment trigger:** Player death = 1000 shannons to "revive pot", boss kill = share reward
- **Model:** Cooperative pool — both fund it, losing a life costs you, completing stages pays you
- **Why it works:** Pay-to-revive is a completely new mechanic — genuinely novel

### Double Dragon (NES/Arcade)
- **Core:** `fceumm` / `FinalBurn Neo` ✅
- **Payment trigger:** Per enemy defeat (score), per continue used (pay pot)

### Contra (NES)
- **Core:** `fceumm` ✅
- **Payment trigger:** Per life lost = pay partner, completing a stage = shared bonus

---

## Recommended Launch Lineup (5 games for v1.0)

| # | Game | Console | Core | Trigger Model | Demo Value |
|---|------|---------|------|---------------|-----------|
| 1 | **Street Fighter II Turbo** | SNES | snes9x | Per-HP damage | ⭐⭐⭐ Perfect for video |
| 2 | **Pong** | Atari 2600 | stella | Per point | ⭐⭐⭐ Universal fallback |
| 3 | **NBA Jam** | SNES | snes9x | Per basket | ⭐⭐⭐ Crowd pleaser |
| 4 | **Super Bomberman** | SNES | snes9x | Per death | ⭐⭐ Great multiplayer |
| 5 | **Mortal Kombat** | SNES | snes9x | Per-HP + fatality bonus | ⭐⭐ Shock value |

---

## Notes on RAM address verification
All SNES addresses need verification against a live RetroArch + Snes9x session:
```bash
# Test read from RetroArch UDP
echo -n "READ_CORE_MEMORY 0x0530 1\n" | nc -u -w1 127.0.0.1 55355
# Response: READ_CORE_MEMORY 0x0530 1 A0
# That's P1 health = 160 (max) at fight start
```
First dev task on March 11: boot SF2 in RetroArch and verify these addresses live.

---

## Payment mechanic defaults (configurable)
```yaml
# config.yaml
wager:
  per_hp: 10          # shannons per 1 HP lost (fighting games)
  per_point: 1000     # shannons per point (sports/arcade)  
  per_death: 500      # shannons per life lost (platformers/bomberman)
  round_bonus: 2000   # bonus for winning a round
  match_bonus: 5000   # bonus for winning the match
  fatality_bonus: 5000 # bonus for finishing moves (MK)
```
