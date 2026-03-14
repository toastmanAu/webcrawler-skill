# FiberQuest Hackathon Progress Tracker
**Deadline:** March 25, 2026 (11 days remaining)  
**Judging Priority:** Autonomy > Novelty > Completeness > Soundness > UX > Viability

---

## 🎯 Core Mission
Autonomous tournament agent that:
1. ✅ Monitors game state via RetroArch RAM polling
2. ✅ Validates addresses against known game definitions  
3. ⏳ Creates tournaments with entry fee cells on CKB
4. ⏳ Opens Fiber payment channels
5. ⏳ Scores players in real-time
6. ⏳ Autonomously executes payouts when tournament ends

---

## Phase 1: RAM Monitoring ✅ DONE (2026-03-14)

### Deliverables
- [x] **RAM Viewer Dashboard** (http://192.168.68.79:8767)
  - [x] Web UI with settings panel
  - [x] Game auto-detection via RetroArch UDP
  - [x] Live console with 6-message buffer
  - [x] WebSocket streaming architecture
  - [x] Configurable Ollama integration

- [x] **Discovery Engine** (ram-watcher.js)
  - [x] Continuous memory polling (1000ms intervals)
  - [x] Pattern detection (incrementing, toggle/state, variable, unknown)
  - [x] Event logging to JSONL (50MB+ per session)
  - [x] 7,918+ addresses discovered in test run

- [x] **Address Validator** (address-validator.js)
  - [x] Loads FiberQuest game definitions
  - [x] Compares discovered addresses against known addresses
  - [x] Marks addresses as VERIFIED when behavior matches expected
  - [x] Confidence scoring (low → medium → high)
  - [x] JSON validation reports with "safe for payouts" flag

- [x] **Game Definitions** (fiberquest/games/*.json)
  - [x] Harvest Moon SNES (addresses: gold, day, season, year, items)
  - [x] Donkey Kong Country SNES (basic definition loaded)
  - [x] Other games pre-defined (SF2, Metroid, Mario Kart, etc.)

---

## Phase 2: CKB Tournament Cell ⏳ TODO

### Deliverables
- [ ] **Tournament Cell Creation** (src/tournament-manager.js)
  - [ ] Accept tournament parameters (game, win condition, entry fee, payout structure)
  - [ ] Build cell with `since` time-lock for entry fee
  - [ ] Create agent-controlled capacity lock
  - [ ] Publish cell to CKB blockchain
  - [ ] Return cell ID for reference

- [ ] **Cell Schema** (CKB UTXO design)
  - [ ] `data`: Tournament config (game ID, duration, win condition, payout %)
  - [ ] `lock`: Time-locked script (since block number)
  - [ ] `type`: (optional) Helps with indexing + validation
  - [ ] Capacity: entry_fee × max_players + agent fee

- [ ] **Test Cases**
  - [ ] Create tournament cell for Harvest Moon Gold Rush
  - [ ] Verify cell locked until tournament end time
  - [ ] Test with both testnet + mainnet

---

## Phase 3: Fiber Payment Channels ⏳ TODO

### Deliverables
- [ ] **Fiber Client Integration** (src/fiber-client.js)
  - [ ] Enhance existing RPC client with channel operations
  - [ ] `new_invoice()` for entry fee collection
  - [ ] `add_invoice_data()` for player identity linking
  - [ ] `send()` for payout execution
  - [ ] Channel balance tracking

- [ ] **Player Entry Flow**
  - [ ] Generate unique invoice per player
  - [ ] Link invoice to player ID + tournament cell
  - [ ] Verify payment received (listen_invoice callback)
  - [ ] Open payment channel for future payout

- [ ] **Test Cases**
  - [ ] Create 2 invoices for test players
  - [ ] Simulate payments via Fiber testnet
  - [ ] Verify channel opens correctly

---

## Phase 4: Real-Time Scoring ⏳ TODO

### Deliverables
- [ ] **Score Accumulator** (src/tournament-manager.js)
  - [ ] Read game definition's `tournament.metrics` (what to track: gold, score, etc.)
  - [ ] Match discovered RAM changes to metric types
  - [ ] Build per-player score ledger in memory
  - [ ] Track win condition progress (time left, score gap, rounds won)

- [ ] **Event Triggers** (address-validator.js feedback loop)
  - [ ] When VERIFIED address changes → update player score
  - [ ] Log events to file for tournament audit trail
  - [ ] Broadcast score updates to Electron UI

- [ ] **Test Cases**
  - [ ] Play Harvest Moon for 5 min, verify gold changes trigger score updates
  - [ ] Test 2-player simultaneous play, separate score tracking
  - [ ] Verify audit trail is complete + tamper-evident

---

## Phase 5: Autonomous Payout ⏳ TODO

### Deliverables
- [ ] **Payout Builder** (src/tournament-manager.js + src/agent-wallet.js)
  - [ ] When tournament ends (time or win condition met):
    - Determine winner(s) by score
    - Calculate payout amounts (winner_takes_all, top2_split, etc.)
    - Build CKB transaction to unlock tournament cell
    - Build CKB transaction to transfer capacity to winners
  - [ ] Sign transaction with agent key (CCC)
  - [ ] Send transaction via CKB RPC
  - [ ] Send payout to winners via Fiber channel

- [ ] **Payment Execution** (src/fiber-client.js)
  - [ ] Call `send()` to deliver payout via Fiber
  - [ ] Verify transaction settled on-chain
  - [ ] Log payout receipt + block number
  - [ ] Emit event to Electron UI (tournament complete)

- [ ] **Safety Checks**
  - [ ] Only payout from VERIFIED addresses (high confidence only)
  - [ ] Verify winner score difference (prevent disputes)
  - [ ] Require both on-chain + Fiber confirmations
  - [ ] Audit trail: tx hash, block num, timestamp, winner ID

- [ ] **Test Cases**
  - [ ] Simulate complete tournament (2 players, 10 min play, gold race)
  - [ ] Verify CKB tx built correctly (inputs, outputs, witnesses)
  - [ ] Verify payout reaches winner via Fiber
  - [ ] Verify loser receives no funds
  - [ ] Test on testnet with real Fiber channels

---

## Phase 6: Electron UI ⏳ TODO

### Deliverables
- [ ] **Main Process** (src/main.js)
  - [ ] IPC bridge between Electron + Node.js agent
  - [ ] Agent lifecycle (start, stop, restart)
  - [ ] Window creation + DevTools

- [ ] **Renderer** (renderer/index.html + CSS)
  - [ ] Retro game UI (Press Start 2P font)
  - [ ] Tournament creation form
  - [ ] Active tournaments list
  - [ ] Live score display
  - [ ] Payout status panel
  - [ ] Agent health indicators

- [ ] **UX Features**
  - [ ] One-click tournament creation
  - [ ] Real-time score updates
  - [ ] Winner announcement
  - [ ] Transaction links (CKB explorer, Fiber receipt)

---

## 📋 Supporting Infrastructure

### ✅ Completed
- [x] RAM Viewer (standalone web app, fully functional)
- [x] Address validator (validates 7,918+ discovered addresses)
- [x] Game definition format (JSON schema proven with Harvest Moon)
- [x] VS Code toolchain (95 extensions, ErrorLens, REST Client, GitLens active)
- [x] Fiber RPC client (existing, tested against live fnn v0.7.0)
- [x] CCC integration (JavaScript CKB transaction builder available)
- [x] Local infrastructure (Fiber node at 192.168.68.79, CKB node at 192.168.68.87)

### ⏳ In Progress
- [ ] Tournament manager core logic
- [ ] Payout builder + signer
- [ ] Electron UI
- [ ] End-to-end test (2 players, full tournament cycle)

---

## 🎮 Game Definitions Status

| Game | Status | Addresses | Confidence | Tested |
|------|--------|-----------|------------|--------|
| Harvest Moon SNES | ✅ Ready | gold (0x1F04-06), day, season, year | MEDIUM | ✅ 7,918 discovered |
| Donkey Kong Country SNES | ⏳ Basic | score, level, lives | LOW | Loaded |
| Street Fighter II | 📝 Planned | health (P1/P2), round, wins | LOW | Not yet |
| Super Metroid | 📝 Planned | energy, missiles, items | LOW | Not yet |
| Mario Kart 64 | 📝 Planned | lap, position, items | LOW | Not yet |

---

## 📊 Metrics for Judging

| Metric | Status | Evidence |
|--------|--------|----------|
| **Autonomy** | 🟡 Partial | RAM monitoring ✅, Address validation ✅, Payout execution ⏳ |
| **Novelty** | 🟢 Strong | First open-source Node.js Fiber client, automated address validation framework |
| **Completeness** | 🟡 50% | RAM layer done, CKB/Fiber layer TODO, UI TODO |
| **Soundness** | 🟢 High | Address validation prevents false payouts, all changes logged |
| **UX** | 🟡 Basic | RAM Viewer works, Electron UI TODO |
| **Viability** | 🟡 Partial | Fiber + CKB integration tested separately, need full integration test |

---

## 🚀 Next 72 Hours (Critical Path)

### By Tomorrow (Saturday, March 15)
1. [ ] Open final-server.js in VS Code, enable ErrorLens
2. [ ] Test address-validator with live play (30 min Harvest Moon)
3. [ ] Verify HIGH-confidence addresses for gold, day, season
4. [ ] Save validation report

### By Sunday (March 16)
5. [ ] Implement tournament-manager.js (cell creation + scoring)
6. [ ] Build CKB transaction signer (CCC integration)
7. [ ] Test cell creation on testnet

### By Tuesday (March 18)
8. [ ] Implement payout builder + Fiber send()
9. [ ] End-to-end test: 2-player Harvest Moon tournament
10. [ ] Verify payouts reach winners

### By March 25 (Submission)
11. [ ] Electron UI (basic but functional)
12. [ ] Demo video (tournament from start to payout)
13. [ ] Documentation + README
14. [ ] Deploy to GitHub

---

## 🔗 Key Links

- **Repo:** https://github.com/toastmanAu/fiberquest
- **RAM Viewer:** http://192.168.68.79:8767
- **Fiber Node:** 192.168.68.79:8227 (localhost-only, needs SSH tunnel)
- **CKB Node:** 192.168.68.87:8114 (testnet)
- **Game Defs:** ~/.openclaw/workspace/fiberquest/games/
- **Code:** ~/.openclaw/workspace/fiberquest/src/

---

## 🎯 Confidence Level

**Overall:** 🟡 **60% Confident** (RAM layer solid, CKB/Fiber integration needed)

- RAM monitoring: 🟢 100% (proven with 7,918 addresses)
- Address validation: 🟢 95% (logic correct, needs more game data)
- CKB integration: 🟡 70% (CCC available, need tournament-manager)
- Fiber integration: 🟡 60% (client exists, payout flow untested)
- Electron UI: 🔴 10% (not started)
- Hackathon submission: 🟡 40% (achievable by March 25 with focus)

---

**Last Updated:** 2026-03-14 00:51 ACST  
**Author:** Kernel (AI Assistant)  
**Status:** 🚀 Building momentum — RAM layer complete, CKB/Fiber phase starting
