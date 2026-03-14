# FiberQuest MVP — Core 5 Games

## Game Selection
1. **Mortal Kombat II** (SNES) — Fighting
2. **Pokemon Fire Red** (GBA) — Collection/RPG
3. **Mario Kart 64** (N64) — Racing
4. **Harvest Moon** (SNES) — Farming/Progression
5. **Donkey Kong Country** (SNES) — Platformer

---

## 1. Mortal Kombat II (SNES)

**Current Status:** 527 addresses extracted ✅

**Tournament Format:**
- 1v1 best-of-3 fights
- Match duration: 90 seconds (2 rounds + fatality)
- Winner: Last fighter standing

**Validation Mechanics:**
- Health can't jump backwards >50 points/frame
- Health can't exceed max
- Fight end: one player health = 0
- No mid-match teleporting

**Key Addresses to Validate:**
- Player 1 health (0x0000 area from MK2 definition)
- Player 2 health (offset by ~400 bytes)
- Round counter
- Match timer

**Cheating Signatures:**
- Instant full health heal during match
- Opponent health drops to 0 without cause
- Time manipulation (timer jumps backwards)

**Payment Structure:**
- Entry: 100 CKB per player
- Winner: 180 CKB (90% of pool)
- House: 20 CKB (10%)

---

## 2. Pokemon Fire Red (GBA)

**Current Status:** 13 addresses mapped from cheat sheet ✅

**Tournament Format:**
- Single-player campaign progress tournament
- Track Pokédex completion within 1-hour session
- Winner: Most Pokémon caught OR highest level Pokemon

**Validation Mechanics:**
- Pokédex "caught" count can only increase
- Level can never decrease
- Trainer name/ID immutable
- Pokemon stats constrained by level formula

**Key Addresses to Validate:**
- Party Pokemon 1-6 health/level (0x02024284 + offsets)
- Pokédex seen/caught flags ([0x0300500C]+0x0028/0x005C)
- Trainer ID (0x0300500C+0x000A)

**Cheating Signatures:**
- Level jump (15→99 instantly)
- Caught count decrease
- Trainer ID change mid-session
- Pokemon health >max HP for level

**Payment Structure:**
- Entry: 50 CKB
- Winner: 90 CKB
- House: 10 CKB

---

## 3. Mario Kart 64 (N64)

**Current Status:** 527 addresses extracted ✅

**Tournament Format:**
- 50cc Grand Prix (4 tracks)
- Finish position tracked
- Winner: Highest points after all tracks

**Validation Mechanics:**
- Position/placing can only change during race
- Final position locked at race end
- Lap counter increments linearly
- Can't skip tracks

**Key Addresses to Validate:**
- Current position (address TBD from 527)
- Lap number (address TBD)
- Race time (address TBD)
- Points/score accumulation

**Cheating Signatures:**
- Instant position change (1st→3rd in one frame)
- Lap count jumps forward
- Negative race times
- Score appears without finishing race

**Payment Structure:**
- Entry: 75 CKB
- Winner: 130 CKB
- House: 20 CKB

---

## 4. Harvest Moon (SNES)

**Current Status:** 0 addresses (needs extraction)

**Tournament Format:**
- Farming season (spring = 30 days)
- Wealth accumulated = win metric
- Winner: Most gold earned at day 30

**Validation Mechanics:**
- Gold can only increase (via crop sales, fishing)
- Gold can't exceed reasonable daily income
- Day counter increments 1→30 linearly
- Stamina system (can't work 24/7)

**Key Addresses to Validate:**
- Current gold/money amount
- Current day (1-30)
- Crop/livestock counts
- Stamina level

**Cheating Signatures:**
- Gold jumps by 10,000+ in 1 frame
- Day counter skips (day 5→day 20)
- Stamina never decreases
- Crops appear without planting

**Payment Structure:**
- Entry: 60 CKB
- Winner: 110 CKB
- House: 10 CKB

**Note:** Needs address extraction via gameplay

---

## 5. Donkey Kong Country (SNES)

**Current Status:** 2 addresses (minimal, needs extraction)

**Tournament Format:**
- Level completion race (Jungle Hijinx)
- Fastest time to finish
- Winner: <2 min clear time = first place, etc.

**Validation Mechanics:**
- Level progress (doors/barrels visited) linear
- Can't skip sections
- Time counter increments continuously
- Health (banana count) can fluctuate but has limits

**Key Addresses to Validate:**
- Current level/world position
- Elapsed time counter
- Health/banana count
- Completion flag (did they reach the end?)

**Cheating Signatures:**
- Time goes backwards
- Level position teleports (jungle→cave rooms away)
- Health is infinite
- Completion set without visiting all doors

**Payment Structure:**
- Entry: 55 CKB
- Winner (fastest): 95 CKB
- House: 10 CKB

**Note:** Needs address extraction via gameplay

---

## Next Steps

### Phase 1: Validate Core 3 (2 weeks)
1. ✅ MK2: Test 527 addresses against real matches
2. ✅ Pokemon FR: Test 13 mapped addresses + validation rules
3. ✅ Mario Kart 64: Test 527 addresses against Grand Prix

**Goal:** Run 5-10 test matches per game, confirm no false positives

### Phase 2: Extract & Validate 2 (1 week)
4. 🔲 Harvest Moon: Play 1 full season, extract addresses via ram-watcher
5. 🔲 Donkey Kong: Play through level, extract addresses via ram-watcher

### Phase 3: Payment Integration (1 week)
- Test Fiber Network channel opening
- Automate prize distribution via CKB transfers
- Build tournament scoreboard + payment UI

### Phase 4: Live Beta (1 week)
- Run 5-person mini-tournament per game
- Real CKB at stake (small amounts, 10-50 CKB)
- Monitor for edge cases

---

## MVP Deliverables (By March 25 hackathon)
- [ ] 5 game definitions with validated addresses
- [ ] Per-game tournament rules documented
- [ ] Anti-cheat detection confirmed working
- [ ] Fiber payment integration tested
- [ ] 3-game live beta successful
