# FiberQuest Architecture Locked — Agent Handler Model ✅

## Decision Made (2026-03-14)

Escrow wallet now controlled by dedicated **FiberQuest Agent**, not website backend.

### Why This Model?

✅ **Security** — Private key isolated from web tier
✅ **Reliability** — Continuous 24/7 monitoring (not event-driven)
✅ **Determinism** — Block-based triggers can't be gamed
✅ **Cost** — Free local inference (qwen2.5:3b/14b)
✅ **Simplicity** — Clear separation of concerns

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FiberQuest System                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  WEBSITE (Next.js Frontend)       AGENT (Continuous Loop)  │
│  ├─ Landing page                 ├─ Escrow Monitor        │
│  ├─ Tournament browser           ├─ Auto-Publisher        │
│  ├─ Join form                    ├─ Fiber Manager         │
│  └─ Account dashboard            └─ Settlement Logic      │
│                                                             │
│  SHARED DATABASE (Single Source of Truth)                  │
│  ├─ tournaments table                                       │
│  ├─ entrants table                                          │
│  └─ validation_results table                                │
│                                                             │
│  BLOCKCHAIN LAYER                                           │
│  ├─ CKB Node (escrow monitoring)                            │
│  ├─ Fiber Network (channels)                                │
│  └─ Validator Engine (cheating detection)                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Tournament Flow

```
PLAYER                    WEBSITE                  AGENT               BLOCKCHAIN
  │                         │                       │                      │
  ├─ Login (JoyID) ────────→ ├─ Auth               │                      │
  │                         │ Redirect /tournaments│                      │
  │                         │                       │                      │
  ├─ Click "Join" ────────→ ├─ Add to DB           │                      │
  │                         │ status: awaiting     │                      │
  │ (← escrow address)      │                       │                      │
  │                         │                       │                      │
  ├─ Send 100 CKB ─────────────────────────────────────────────────────→ Escrow
  │                         │                       │                      │
  │                         │                       ├─ Poll escrow (6s)   │
  │                         │                       │ Detected! ← Payment ─┤
  │                         │ ← Query status ◄─────┤                      │
  │ (show confirmed)        │ payment_confirmed    │                      │
  │                         │                       │                      │
  │                         │                       │ At block cutoff:    │
  │                         │                       ├─ Check entrants     │
  │                         │ ← Active! ◄──────────┤ Min met? YES        │
  │                         │                       ├─ Publish to CKB ───→ CKB
  │                         │                       ├─ Open Fiber channel ──→ Fiber
  │                         │                       │                      │
  ├─ Play game ───────────────────────────────────────→ RAM Viewer ───────→ Events
  │                         │                       │                      │
  │                         │                       │ After session:      │
  │                         │                       ├─ Validate session ─→ Validator
  │                         │                       │                      │
  │ (if winner) ┌───────────┴──────────────────────┤                      │
  │             │                                  ├─ Get proof ◄────────┤
  │             └─ Claim prize ──────────────────→ ├─ Settle Fiber ─────→ Fiber
  │                                                 │                      │
  │ (← 90 CKB) ◄───────────────────────────────────┴─ Send CKB ─────────→ Your Wallet
```

---

## File Changes

**Updated:**
- ✅ `.env.example` — Escrow key removed
- ✅ `src/config/env.ts` — Website doesn't load private key
- ✅ `src/pages/api/tournaments/[id]/join.ts` — Updated comments
- ✅ `README.md` — Agent architecture documented

**New:**
- ✅ `AGENT-SPEC.md` — Full agent specification (7.6 KB)

**Committed:**
- ✅ Commit: `29c49e8` — "refactor: move escrow to dedicated FiberQuest Agent"

---

## What Website Does (No Changes to Core Logic)

```
POST /api/tournaments/[id]/join
  1. Verify tournament recruiting
  2. Check user not already joined
  3. Add to DB: { status: "awaiting_payment" }
  4. Return: { escrowAddress, amountRequired }

GET /api/tournaments/list
  (unchanged, just list recruiting tournaments)

GET /api/auth/joyid-callback
  (unchanged, JoyID OAuth handler)
```

**Key:** Website only READS escrow address, never controls it.

---

## What Agent Does (New)

```
Initialization:
  1. Load CKB_ESCROW_PRIVATE_KEY from .env.agent
  2. Connect to CKB RPC + Fiber RPC
  3. Connect to shared database
  4. Start monitoring loop

Every 6 seconds (one block):
  1. Poll escrow address for new payments
  2. If payment found:
     ├─ Match to tournament + player
     ├─ Update DB: { status: "payment_confirmed" }
     └─ Check if tournament now has min entrants
  
At block cutoff (tournament.publishBlock):
  1. Get tournament state from DB
  2. If all entrants paid && min met:
     ├─ Write to CKB cell
     ├─ Open Fiber multi-sig channel
     ├─ Lock funds to channel
     └─ Update DB: { status: "active" }
  3. Else (min not met):
     ├─ Refund all entrants
     └─ Update DB: { status: "cancelled" }

When validation proof received:
  1. Verify signature from validator
  2. Calculate winner payout
  3. Update DB: { winner, status: "settling" }
  4. Close Fiber channel with settlement
  5. Update DB: { status: "settled" }
```

---

## Environment Variables

### Website `.env.local`

```bash
# Safe to expose:
NEXT_PUBLIC_CKB_RPC_URL=https://testnet.ckb.dev
NEXT_PUBLIC_CKB_ESCROW_ADDRESS=ckt1q...

# Private (server-side only):
JOYID_CLIENT_SECRET=...
DATABASE_URL=...
```

**Website has NO private keys. Period.**

### Agent `.env.agent` (Separate File)

```bash
# The escrow key lives here (ONLY):
CKB_ESCROW_PRIVATE_KEY=0x...
FIBER_NODE_PRIVATE_KEY=0x...

# Shared with website:
DATABASE_URL=...
CKB_RPC_URL=...
```

**Agent is the only process with private keys.**

---

## Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Website Frontend | ✅ Demo Ready | Run `bash demo.sh` |
| Website Backend APIs | ✅ Stubbed | Ready to wire to agent |
| Secret Management | ✅ Locked | Website: no keys. Agent: escrow only |
| Validator Engine | ✅ Built | 946 lines, all 5 games |
| Database Schema | 🔄 Ready | Migrations still needed |
| FiberQuest Agent | 🔴 TODO | Build next (polling + auto-publish) |
| Fiber Integration | 🔴 TODO | Channel opening + settlement |
| Testing | 🔄 Ready | Test fixtures needed |

---

## Next Sprint

1. **Build FiberQuest Agent** (~8 hours)
   - Escrow monitor (detect payments)
   - Auto-publisher (block cutoff)
   - Fiber channel manager

2. **Database** (~4 hours)
   - Create tables + migrations
   - Prisma schema

3. **Integration Testing** (~4 hours)
   - E2E testnet flow
   - Handle edge cases

4. **Mainnet Deploy** (~2 hours)
   - Flip to mainnet RPC
   - Set real API keys

---

## Architecture Benefits Summary

✅ **No Key Leakage** — Escrow key never leaves agent process
✅ **24/7 Monitoring** — Agent always watching, not just when website gets requests
✅ **Deterministic** — Block heights can't be gamed
✅ **Free Operation** — Local inference, zero API costs
✅ **Audit Trail** — All operations logged
✅ **Simple Website** — Frontend doesn't worry about blockchain
✅ **Isolated Concerns** — Website ≠ Funds. Agent = Funds.

---

**Locked in. Ready to build.** 🚀

See `AGENT-SPEC.md` for full agent specification.
