# fiber-poker

> Texas Hold'em poker with real Fiber Network micropayments.

Parked from FiberQuest hackathon (2026-03-11). The game-server.js here is a
working FGSP WebSocket server with a full Texas Hold'em state machine wired to
Fiber RPC calls — every blind, bet, raise, and pot settlement triggers a real
payment.

## Status
Parked / future project. Core logic complete. Needs:
- Electron UI
- JoyID buy-in signing
- Multi-player (3–6 players)
- Channel open/close UX

## Files
- `game-server.js` — FGSP v0.1 WebSocket server, Texas Hold'em state machine

## Related
- fiber-client.js lives in the fiberquest repo — will need to be extracted to a
  shared package when this project resumes.
