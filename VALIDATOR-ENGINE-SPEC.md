# FiberQuest Validator Engine — Architecture

## Purpose
Receives a completed game session recording and validates it against known cheating signatures. Returns a pass/fail verdict + list of detected violations.

## Input
A game session object:
```typescript
{
  gameId: "mortal-kombat-ii_snes_usa",
  playerId: "player_123",
  startTime: 1710430200,
  endTime: 1710430320,
  events: [
    { timestamp: 1710430205, address: 0x0001, value: 120 },
    { timestamp: 1710430206, address: 0x0001, value: 119 },
    { timestamp: 1710430207, address: 0x0001, value: 45 },  // health drop
    ...
  ]
}
```

## Output
```typescript
{
  valid: boolean,
  cheatingSignatures: [
    "health_jump_backwards: Player 1 health jumped 95→120 (+25 in 1 frame)",
    "health_exceed_max: Player 2 health 255 exceeds max 120",
  ],
  gameState: {
    finalWinner: "player_1",
    healthHistory: { player1: [120, 119, 45, 0], player2: [100, 95, 90, 0] }
  }
}
```

## What It Interacts With

### 1. Game Definition File
Reads from: `/ram-viewer/games/{gameId}.json`

Example structure:
```json
{
  "gameId": "mortal-kombat-ii_snes_usa",
  "addresses": {
    "player1_health": { "address": 0x0001, "type": "u8", "max": 120 },
    "player2_health": { "address": 0x0400, "type": "u8", "max": 120 },
    "round_counter": { "address": 0x0800, "type": "u8", "max": 3 },
    "match_timer": { "address": 0x0900, "type": "u16", "min": 0, "max": 99 }
  },
  "validationRules": {
    "health": {
      "maxJumpPerFrame": 50,      // Can't heal >50 per frame
      "neverExceedMax": true,
      "neverNegative": true
    },
    "timer": {
      "neverBackwards": true,
      "incrementBy1PerFrame": true
    }
  },
  "cheatingSignatures": [
    { name: "instant_health_heal", rule: "health > +50 per frame during match" },
    { name: "impossible_state", rule: "both players health >0 at match end" }
  ]
}
```

### 2. Event Log
Reads from: `/ram-viewer/events-YYYY-MM-DD.jsonl`

Each line is a captured memory change:
```json
{"timestamp": 1710430205, "address": "0x0001", "oldValue": 120, "newValue": 119, "gameId": "mortal-kombat-ii_snes_usa"}
```

### 3. RAM Watcher System (outputs events)
- Runs continuously, captures address changes
- Writes to event log
- Validator reads after session ends

## Core Logic

### Phase 1: Parse Events
```
1. Load game definition (addresses + rules)
2. Filter events for this session's timeframe + gameId
3. Map events to address names (0x0001 → "player1_health")
4. Build value history per address
```

### Phase 2: Apply Validation Rules
```
1. For each address with a rule:
   - Check min/max bounds
   - Check rate-of-change limits
   - Check immutability rules
   - Check temporal rules (never backwards)
   
2. For each cheating signature:
   - Scan history for the pattern
   - Record violations with timestamp + values
```

### Phase 3: Determine Winner
```
1. Check game-specific win conditions:
   - MK2: One player health = 0
   - Pokemon: Most Pokemon caught
   - Mario Kart: Highest points
   - Harvest Moon: Most gold
   - DKC: Lowest time
   
2. Verify winner state is legal
```

### Phase 4: Return Result
```
{
  valid: true/false,
  violations: [...],
  winner: "player_id",
  signature: "tournament_valid_xyz123"
}
```

## Per-Game Validation Rules

### Mortal Kombat II
- Player 1 & 2 health: 0-120, max jump +50/frame
- Round counter: 0-3, never backwards
- Match timer: 0-99, increments 1/frame, never backwards
- Win condition: One player health = 0, other > 0
- Cheating: Instant heal, health exceed max, time reverse

### Pokemon Fire Red
- Pokédex caught count: 0-150, only increases
- Trainer ID: immutable (set once at start)
- Party Pokemon health: 0-max_hp_for_level, never negative
- Level: immutable per session (caught Pokemon don't level mid-tournament)
- Win condition: Highest caught count after 1 hour
- Cheating: Level jump, caught decrease, trainer ID change, health > max

### Mario Kart 64
- Position: 1-4, only changes during race
- Lap counter: 0-4, only increases by 1 per lap
- Race time: 0-999, never backwards, increments 1/frame
- Points: accumulate, never decrease
- Win condition: Highest points after 4 tracks
- Cheating: Position teleport, lap jump, time reverse, points appear without race

### Harvest Moon
- Gold: 0-999999, increases only via sales/fishing
- Day: 1-30, increments by 1 per day, never backwards
- Stamina: 0-100, decreases with work, increases with sleep
- Crops: counts only increase or stay same
- Win condition: Most gold at day 30
- Cheating: Gold jump 10k+/frame, day skip, stamina never decreases, crops without planting

### Donkey Kong Country
- Elapsed time: 0-999 seconds, increments 1/frame
- Level position: encoded state, only advances through doors
- Health (bananas): 0-5, can fluctuate but has limits
- Completion flag: only set after all sections visited
- Win condition: Lowest time to complete
- Cheating: Time reverse, position teleport, health infinite, completion fake

## Database Interactions

### Read
- Game definitions from `/ram-viewer/games/`
- Event log from `/ram-viewer/events-YYYY-MM-DD.jsonl`

### Write (future)
- Validation results to validation database (TBD)
- Payment triggers to Fiber channel (TBD)

## Error Handling

```typescript
// Game definition not found
throw new Error(`Game ${gameId} not defined in games/`);

// No events for this session
throw new Error(`No events found for session ${sessionId}`);

// Invalid game state
throw new Error(`Session ended with both players alive: invalid MK2 state`);

// Event parsing error
throw new Error(`Malformed event: ${event}`);
```

## Code Structure

```
validator-engine/
├── src/
│   ├── index.ts              (entry point, 60 lines)
│   ├── types.ts              (TypeScript interfaces, 100 lines)
│   ├── gameDefinitions.ts    (load + validate game defs, 80 lines)
│   ├── eventParser.ts        (parse event log, 120 lines)
│   ├── rules/
│   │   ├── baseRules.ts      (generic validation, 150 lines)
│   │   ├── mortalKombat.ts   (MK2-specific, 80 lines)
│   │   ├── pokemon.ts        (Pokemon-specific, 100 lines)
│   │   ├── marioKart.ts      (Mario Kart-specific, 80 lines)
│   │   ├── harvestMoon.ts    (Harvest Moon-specific, 100 lines)
│   │   └── donkeyKong.ts     (DKC-specific, 80 lines)
│   └── validator.ts          (core validation loop, 150 lines)
├── test/
│   ├── fixtures/             (sample game defs + events)
│   └── validator.test.ts     (test suite)
├── package.json
├── tsconfig.json
└── README.md
```

**Total:** ~1000 lines TypeScript, fully typed, modular per-game rules.

## Usage Example

```typescript
import { ValidatorEngine } from './src/validator';

const engine = new ValidatorEngine('/home/phill/ram-viewer');

const result = await engine.validate({
  gameId: 'mortal-kombat-ii_snes_usa',
  playerId: 'player_123',
  sessionId: 'session_abc123',
  startTime: 1710430200,
  endTime: 1710430320
});

if (result.valid) {
  console.log(`✅ Valid. Winner: ${result.winner}`);
  // Trigger Fiber payment
} else {
  console.log(`❌ Cheating detected:`);
  result.cheatingSignatures.forEach(sig => console.log(`  - ${sig}`));
}
```

## Testing Strategy

1. **Legit sessions** — validate real gameplay recordings (should all pass)
2. **Simulated cheating** — inject fake events, confirm detection
3. **Edge cases** — boundary values, timing glitches, malformed events
4. **Per-game** — 2-3 tests per game covering main cheating vectors

---

## Ready for Prompt

This is what the validator engine needs to do. When you have the detailed build prompt, it will:
1. Implement these validation rules
2. Parse game definitions + event logs
3. Detect cheating signatures
4. Return typed validation results
5. Be testable and production-ready

All ready for your targeted prompt. 🚀
