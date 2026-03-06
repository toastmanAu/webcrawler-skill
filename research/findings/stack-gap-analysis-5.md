# Research: stack-gap-analysis-5

**Date:** 2026-03-06
**Status:** SYNTHESIS
**Seeds:** local findings + MEMORY.md

---

## FiberQuest — Gap Analysis & Dev Week Planning (March 6, 2026)

*This synthesis covers ~90 research findings accumulated since March 3. Phill has one full dev week starting March 10. This analysis identifies what to build first, what's still unknown, and what tasks the crawler should tackle next.*

---

## What We Know Solidly ✅

### Architecture
- **Data flow is clear**: RetroArch (UDP port 55355) → Node.js sidecar → Fiber RPC (JSON-RPC HTTP) → CKB L1
- **Electron is the right shell**: Main process hosts UDP poller + Fiber client; renderer gets events via `contextBridge` / `ipcRenderer.on`. This is fully documented.
- **Packaging**: `electron-builder` for ARM64 AppImage on Pi5 (standard, well-supported)
- **Autostart**: `.desktop` file in `~/.config/autostart/` — simplest, works on Wayland/Pi OS Bookworm

### Fiber Network
- **Both nodes running**: ckbnode (P2P 8228, RPC 127.0.0.1:8227) + N100 (P2P 8229, RPC 127.0.0.1:8226)
- **SSH tunnel**: N100:8237 → ckbnode:8227 (autossh service — both nodes accessible from Pi5)
- **Key RPC calls confirmed**: `open_channel`, `send_payment`, `list_channels`, `close_channel`
- **Performance**: ~20ms latency, ~0 fees — totally suitable for per-event micropayments
- **N100 needs funding** — 99+ CKB needed before it can auto-accept channels

### RetroArch/SNES
- **Network command protocol**: UDP, plaintext, newline-delimited. Port 55355.
- **READ_CORE_MEMORY / WRITE_CORE_MEMORY** exist but the exact format is unverified from source — need empirical test
- **RAM addresses for SF2 Turbo**: P1 health ~0x0530, P2 health ~0x0730 (from architecture synthesis, high confidence)
- **snes9x-libretro** is the recommended SNES core for Pi5

### SDK Design
- **RAM map JSON schema**: Designed — `game_id`, `memory_regions`, `variables` with event trigger rules
- **Payment rule schema**: per-event, threshold-based, configurable per game
- **SDK can be game-agnostic**: just swap the JSON map file

### UI
- **Animate.css** confirmed for slide-in toast notifications
- **Retro terminal aesthetic**: dark background, neon accents, pixel/monospace fonts, scanline CSS overlay
- **Plain HTML/CSS/JS** wins for hackathon Electron renderer (faster than React, no bundler needed)

---

## Critical Gaps ❌

### Gap 1: READ_CORE_MEMORY exact wire format (BLOCKING)
Research consistently found the *concept* but not the exact string format. The command.c source doesn't contain the handler. We need to empirically test it:
- Enable network commands in retroarch.cfg (`network_cmd_enable = "true"`, `network_cmd_port = "55355"`)
- Send a raw UDP packet and observe the response
- **This is Day 1 work** — everything else depends on it

### Gap 2: Fiber RPC exact JSON format (BLOCKING)
The RPC reference exists but wasn't confirmed working from Node.js. Need to:
- Make a raw `curl` call to `localhost:8227` with `open_channel` params
- Verify the response structure
- Test `send_payment` with a real invoice
- **Can test immediately** — both nodes are running

### Gap 3: N100 Fiber node funding (BLOCKING for multi-player)
N100 wallet needs 99+ CKB to auto-accept incoming channels. Without this, can't open a channel from ckbnode→N100.
- **Quick fix**: send CKB from Phill's wallet to N100 Fiber wallet address

### Gap 4: RAM addresses for demo game (HIGH PRIORITY)
SF2 Turbo health addresses are the best lead but unconfirmed empirically. Options:
- Use RetroArch's built-in memory viewer to find them live
- Or use Mesen-S debugger offline
- Harvest Moon, Zelda RAM maps came back empty from web crawl — need emulator-based discovery

### Gap 5: Sidecar implementation (needs building)
The architecture is fully designed but the code doesn't exist yet. Core modules needed:
1. `retroarch-udp.js` — UDP client to poll RAM
2. `fiber-rpc.js` — JSON-RPC client for Fiber node
3. `game-engine.js` — load RAM map JSON, detect events, emit payment triggers
4. `main.js` — Electron main, wires everything together
5. `preload.js` + `renderer/` — overlay UI

### Gap 6: Pi5 RetroArch + RetroPie setup
The Pi5 RetroPie page was inaccessible during crawl. Unknown:
- Does official RetroPie installer support Pi5 Bookworm?
- Best SNES core performance?
- Side-by-side window layout at 1024x600?
- **May need empirical test** — install RetroPie and see what works

### Gap 7: Live transaction feed UI reference
No concrete design references found. The retro-meets-crypto aesthetic is clear conceptually but needs a working mockup to validate before building.

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| READ_CORE_MEMORY format wrong | HIGH | Test empirically on Day 1 |
| Fiber RPC format mismatch | HIGH | curl test immediately |
| N100 unfunded | MEDIUM | Send CKB now |
| Ram addresses wrong | MEDIUM | Use emulator debugger |
| RetroPie Pi5 support | MEDIUM | May need manual RetroArch install |
| Fiber testnet flakiness | LOW | ckbnode is stable, have fallback to mock |

---

## Recommended Dev Week Order (March 10–14)

### Day 1: Prove the stack works end-to-end
1. Fund N100 Fiber wallet
2. `curl` test Fiber RPC → confirm `open_channel` JSON format
3. Install RetroArch on Pi5, enable network commands, test `READ_CORE_MEMORY` empirically
4. Open a real Fiber channel between ckbnode↔N100
5. Send a test micropayment through the tunnel

### Day 2: Sidecar MVP
1. `retroarch-udp.js` — reads a known RAM address
2. `fiber-rpc.js` — wraps open/send/close
3. `game-engine.js` — hardcoded SF2 health addresses for now
4. Console-only (no UI yet) — prove the loop works

### Day 3: Electron shell + UI
1. Wrap sidecar in Electron main process
2. Build overlay renderer — payment notification toasts
3. Side-by-side layout on Pi5 display

### Day 4: Game packs + polish
1. Add Zelda / Mario RAM maps (from emulator discovery)
2. SDK JSON schema for game-agnostic config
3. Channel auto-open at game launch, auto-close at quit

### Day 5: Demo prep
1. Record demo video
2. Write README / hackathon submission
3. Stress test — rapid payments, channel close/settle

---

## New Research Tasks

See below — adding to queue.

