# FiberQuest — Hackathon Execution Plan
**Dates:** March 11–25, 2026 (11 days + buffer)
**Created:** 2026-03-05 by Kernel

---

## The Pitch

**FiberQuest** — Play retro games, pay real money per game event via the Fiber Network.

> "Imagine Street Fighter 2 where every hit costs Shannon. No wallets, no confirmations — just gameplay mapped to Fiber micropayments in real time."

One-liner: **Retro gaming meets Fiber micropayment triggers — pay per hit, per life, per boss.**

---

## Scope Decision (commit to this before day 1)

### MVP (must ship by day 9)
- [ ] Target game: **Street Fighter 2 Turbo (SNES)** — best RAM map coverage, clear payment events
- [ ] RetroArch running on Mac/PC, SNES core (Snes9x or bsnes)
- [ ] Node.js sidecar: polls RetroArch UDP RAM → detects events → triggers Fiber payments
- [ ] Fiber: two local nodes (ckbnode + N100), channel pre-funded, testnet
- [ ] Payment events: **player takes damage** (most reliable RAM address), optionally round win/loss
- [ ] Web UI: simple status panel — shows last payment, channel balance, event log
- [ ] Demo video: 60–90 seconds, shows live gameplay + payment firing in real time

### Stretch (days 9–11 if MVP solid)
- [ ] Multiple payment event types (health, KO, round win, perfect)
- [ ] Two-player mode — each player has their own Fiber node, pay each other
- [ ] ESP32-P4 sidecar replacing the Node.js sidecar (embedded signing, light client)

### Explicitly out of scope
- RetroAchievements integration (API auth wall, not worth the hackathon time)
- LoRa transport
- Mobile wallet UI
- NES support (SNES only — cleaner RAM maps)

---

## Architecture

```
[RetroArch SNES]
      │
      │  UDP 55355  (READ_CORE_MEMORY responses)
      ▼
[Node.js Sidecar]
  - RAM poller (polls ~60Hz, watches health addr)
  - Event detector (delta comparison → event fired)
  - Fiber RPC client (our hand-built JSON-RPC wrapper)
      │
      │  HTTP JSON-RPC 2.0
      ▼
[Fiber Node (ckbnode / N100)]
  - open_channel → pre-funded before demo
  - send_payment → fires on each game event
  - new_invoice / get_invoice → optional receipt tracking
      │
      ▼
[Web Status Panel]
  - WebSocket from sidecar → browser
  - Shows: event log, payment hash, channel balance
  - Stack: plain HTML/JS or minimal Vite, no framework needed
```

---

## Repo Structure (draft — DO NOT create yet)

```
fiberquest/
├── README.md                    # Project pitch, setup instructions, demo link
├── sidecar/
│   ├── package.json
│   ├── src/
│   │   ├── index.js             # Entry point — wires everything together
│   │   ├── retroarch-client.js  # UDP poller for READ_CORE_MEMORY
│   │   ├── event-detector.js    # Delta logic → game events
│   │   ├── fiber-rpc.js         # Hand-rolled JSON-RPC 2.0 client
│   │   ├── fiber-client.js      # High-level: open_channel, send_payment, etc.
│   │   └── web-server.js        # HTTP + WebSocket for status panel
│   └── ram-maps/
│       ├── sf2-turbo-snes.json  # RAM addresses: health, round, timer, char select
│       └── README.md
├── ui/
│   ├── index.html               # Status panel — no build step
│   ├── style.css
│   └── app.js                   # WebSocket client, renders event log + balances
├── docs/
│   ├── ARCHITECTURE.md
│   ├── FIBER-RPC.md             # Our API surface + auth notes
│   └── RAM-MAPS.md              # How RAM polling works, SF2 addresses
└── demo/
    └── DEMO-SCRIPT.md           # Exact steps to run the demo video
```

---

## Day-by-Day Build Plan

### Pre-hackathon (now → March 10)
- [ ] Finalise SF2 Turbo RAM addresses for health P1/P2 (check RA wiki manually, no auth needed to browse)
- [ ] Confirm RetroArch UDP interface: exact command format for READ_CORE_MEMORY
- [ ] Confirm Fiber testnet nodes are live (both ckbnode + N100 funded, channel open test)
- [ ] Write RAM map JSON for SF2 Turbo
- [ ] Draft `FIBER-RPC.md` — the exact methods we'll call, param shapes (from research)
- [ ] Create empty repo (README only — allowed pre-hackathon)
- [ ] Fund N100 Fiber wallet (99+ CKB) so channel auto-accept works

---

### Day 1 (March 11) — Foundation
**Goal: Fiber RPC client working, RetroArch talking to Node.js**

Morning:
- [ ] `fiber-rpc.js` — bare JSON-RPC 2.0 client (axios + manual envelope, no auth lib needed since RPC is localhost)
- [ ] `fiber-client.js` — wrap: `open_channel`, `send_payment`, `new_invoice`, `list_channels`, `get_invoice`
- [ ] Smoke test: call `list_channels` against ckbnode Fiber node → get response

Afternoon:
- [ ] `retroarch-client.js` — UDP socket, send READ_CORE_MEMORY, parse response
- [ ] Hardcode SF2 P1 health address, log value every 100ms
- [ ] Verify health value changes when player takes a hit in-game

End of day 1 milestone: **Can read P1 health from RetroArch AND call Fiber RPC separately**

---

### Day 2 (March 12) — Wire it together
**Goal: First real payment triggered by gameplay**

- [ ] `event-detector.js` — delta comparison: prev_health vs current_health → fires `DAMAGE_TAKEN` event with amount
- [ ] Wire: event → `fiber-client.send_payment()` → log result
- [ ] Pre-open a channel between ckbnode ↔ N100, fund it (1000 CKB)
- [ ] Watch a payment hash appear in logs when player takes a hit

End of day 2 milestone: **Hit detected in game → payment fires → txHash logged**

---

### Day 3 (March 13) — Stability + event model
**Goal: Reliable event detection, no false positives**

- [ ] Debounce logic — health change must be > threshold, < 1 frame apart
- [ ] Distinguish: damage taken vs round start (health resets to full — don't fire payment)
- [ ] Round end detection (both health → 0 or timer → 0)
- [ ] Payment amount model: 1 Shannon per HP point lost (or fixed per event — TBD)
- [ ] Add: `ROUND_WIN`, `KO` event types
- [ ] Error handling: Fiber payment fails → retry once, log, continue (don't crash game)

---

### Day 4 (March 14) — Web UI
**Goal: Something to show in the demo video**

- [ ] `web-server.js` — Express + ws, broadcasts events to browser
- [ ] `ui/index.html` — dark theme, event log (event type, amount, txHash truncated), channel balance
- [ ] Auto-refresh channel balance every 10s via Fiber `list_channels`
- [ ] QR code for channel funding (nice touch for demo)
- [ ] Mobile-friendly — looks good on phone too

---

### Day 5 (March 15) — Integration test day
**Goal: Full end-to-end, stress test, find edge cases**

- [ ] Run a full SF2 match, watch every payment fire
- [ ] Test: RetroArch crash → sidecar reconnects
- [ ] Test: Fiber node unreachable → graceful degradation (game continues, payments queue or drop)
- [ ] Test: Channel runs out of funds → sidecar alerts, stops payments, game continues
- [ ] Fix whatever breaks

---

### Day 6 (March 16) — Documentation + cleanup
**Goal: Someone else can clone and run this**

- [ ] `README.md` — setup steps (dependencies, RetroArch config, Fiber node config, run command)
- [ ] `ARCHITECTURE.md` — diagram + explanation of each component
- [ ] `FIBER-RPC.md` — document exactly which Fiber RPCs we use + param shapes
- [ ] `RAM-MAPS.md` — explain the RAM polling approach, how to add a new game
- [ ] Clean up logs, remove debug noise, add comments

---

### Day 7–8 (March 17–18) — Stretch + polish
If MVP is solid, pick ONE stretch goal:
- Two-player: P2 RAM addr, second Fiber node, payments go P1 → P2 on each hit
- Or: More games — add a second RAM map (Super Mario World: lives lost = payment)
- Or: Begin ESP32-P4 sidecar port (parallel effort, doesn't affect MVP)

---

### Day 9 (March 19) — Demo video
**Goal: Record the submission video**

Script (60–90 seconds):
1. Open game (SF2 Turbo, character select)
2. Show web UI panel — channel balance, empty event log
3. Start a round — first hit lands
4. Zoom to web UI — event fires, payment hash appears, balance drops
5. Ko — show final event log
6. One-liner to camera: "Every hit costs real money. No wallet pop-ups, no confirmations — just Fiber."
7. Show txHash in a block explorer (optional)

Record multiple takes. Keep it under 90 seconds. The payment firing in real time IS the demo.

---

### Day 10–11 (March 20–21) — Buffer / submission
- [ ] Final README pass
- [ ] Submission form
- [ ] Tag release on GitHub
- [ ] Rest

---

## Judging Criteria Self-Assessment

| Criterion | Score | Reasoning |
|---|---|---|
| Completeness | 🟢 High | MVP is fully scoped, achievable in 9 days |
| Soundness | 🟢 High | All tech confirmed working (Fiber RPC, RetroArch UDP, secp256k1) |
| Autonomy | 🟢 High | No manual wallet steps mid-game — fully automated payment pipeline |
| UX Abstraction | 🟢 High | Player just plays a game — payments invisible in background |
| Viability | 🟡 Medium | Testnet only, channel must be pre-funded — acknowledged in docs |
| Novelty | 🟢 High | Nothing like this exists on Fiber or any payment network |

---

## Key Technical Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Fiber testnet unreliable | Research confirmed it's stable. Pre-open channel, keep funded. |
| SF2 RAM addresses wrong | Verify manually from RA wiki before day 1. Test in RetroArch. |
| RetroArch UDP latency too high | Research shows UDP polling at 60Hz is fine. Confirmed protocol. |
| `send_payment` takes too long (blocks game) | Fire payment async — never await in the game loop |
| Fiber channel runs dry during demo | Fund with 10,000 CKB, at 1 Shannon/HP that's ~1 billion hits |
| Node.js Fiber client auth issues | RPC is localhost (127.0.0.1) → Biscuit auth not required (no public addr) |

---

## Pre-Hackathon Checklist (do before March 11)

- [ ] Find SF2 Turbo SNES P1 health RAM address (browse RA wiki, no auth needed)
- [ ] Find SF2 Turbo SNES P2 health RAM address
- [ ] Confirm RetroArch Network Commands exact format (READ_CORE_MEMORY + UDP port 55355)
- [ ] Fund N100 Fiber wallet (99+ CKB) — channel auto-accept
- [ ] Verify both Fiber nodes reachable and synced
- [ ] Draft `fiber-rpc.js` structure in a notes file (not actual code — just the function signatures)
- [ ] Decide: payments in CKB or UDT? (CKB simpler, use CKB)
- [ ] Decide: payment per hit = fixed amount or proportional to damage? (fixed is simpler)
