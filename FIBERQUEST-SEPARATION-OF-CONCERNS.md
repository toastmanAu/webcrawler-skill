# FiberQuest — Clear Separation of Concerns

## One-Line Summary
**Website facilitates logins. Agent handles/monitors funds.**

---

## Responsibility Matrix

| Task | Website | Agent |
|------|---------|-------|
| **User Authentication** | ✅ JoyID login | — |
| **Tournament Browsing** | ✅ List/filter | — |
| **Join Form UI** | ✅ Display form | — |
| **Escrow Address Display** | ✅ Show (public) | — |
| **Account Dashboard** | ✅ Show entries | — |
| **Status Queries** | ✅ Read DB | — |
| | | |
| **Hold Private Keys** | ❌ Never | ✅ CKB_ESCROW_PRIVATE_KEY |
| **Monitor Escrow** | ❌ No | ✅ Every 6s |
| **Detect Payments** | ❌ No | ✅ Watch address |
| **Auto-Publish** | ❌ No | ✅ At block cutoff |
| **Open Channels** | ❌ No | ✅ Fiber multi-sig |
| **Settle Payouts** | ❌ No | ✅ CKB transfers |
| **Refund Players** | ❌ No | ✅ If min not met |
| **Sign Transactions** | ❌ No | ✅ All CKB ops |

---

## Data Flow

```
USER JOINS TOURNAMENT
│
├─ POST /api/tournaments/[id]/join (website)
│  ├─ Validate tournament recruiting
│  ├─ Check user not duplicate
│  ├─ Add to DB: { status: "awaiting_payment" }
│  └─ Return: { escrowAddress: "ckt1q..." }
│
└─ User receives address (public, no secret)


USER SENDS CKB
│
└─ Transfer 100 CKB → escrow address (blockchain)


AGENT DETECTS PAYMENT
│
├─ Poll escrow every 6 seconds (agent)
├─ Match payment to tournament + player
├─ Update DB: { status: "payment_confirmed" }
└─ Check: Does tournament have min entrants?


AT BLOCK CUTOFF
│
├─ Agent checks block height
├─ If min entrants met:
│  ├─ Write tournament to CKB cell (agent)
│  ├─ Open Fiber channel (agent)
│  ├─ Lock funds to channel (agent)
│  └─ Update DB: { status: "active" }
│
└─ If min NOT met:
   ├─ Refund all entrants (agent)
   └─ Update DB: { status: "cancelled" }


TOURNAMENT RUNS
│
├─ Player plays game
├─ RAM Viewer captures events
└─ Validator checks for cheating


PRIZE SETTLEMENT
│
├─ Validator generates proof (validator)
├─ Agent receives proof
├─ Agent verifies signature
├─ Agent closes Fiber channel (agent)
├─ Agent sends CKB to winner (agent)
└─ Update DB: { status: "settled", winner: "..." }
```

---

## Code Ownership

### Website (`/home/phill/fiberquest/`)

**Owns:**
- Landing page UI (`src/pages/index.tsx`)
- JoyID OAuth callback (`src/pages/api/auth/joyid-callback.ts`)
- Tournament list API (`src/pages/api/tournaments/list.ts`)
- Join endpoint (`src/pages/api/tournaments/[id]/join.ts`)
- Account dashboard UI
- Environment: `.env.local` (no private keys)

**Never touches:**
- CKB_ESCROW_PRIVATE_KEY
- Fund transfers
- Fiber channel operations
- Auto-publish logic
- Escrow monitoring

### Agent (`/home/phill/fiberquest-agent/` — to be built)

**Owns:**
- Escrow monitor (`src/escrow-monitor.ts`)
- Auto-publisher (`src/auto-publisher.ts`)
- Fiber manager (`src/fiber-manager.ts`)
- Settlement logic (`src/settlement.ts`)
- Environment: `.env.agent` (private key here)

**Never touches:**
- UI code
- User authentication
- Public-facing endpoints
- Tournament browsing

---

## Security Model

### Website Layer (Public)

```typescript
// SAFE to expose
const publicEnv = {
  NEXT_PUBLIC_CKB_RPC_URL,        // Public RPC
  NEXT_PUBLIC_CKB_ESCROW_ADDRESS, // Public address (no funds yet)
  NEXT_PUBLIC_JOYID_CLIENT_ID,    // OAuth client ID
};

// NEVER COMMIT
const secrets = {
  JOYID_CLIENT_SECRET,  // Private, server-side only
  DATABASE_URL,         // Private, server-side only
};

// NEVER, EVER HERE
const escrow = {
  CKB_ESCROW_PRIVATE_KEY, // ❌ This belongs in AGENT only
};
```

### Agent Layer (Private)

```typescript
// ONLY in agent
const agentSecrets = {
  CKB_ESCROW_PRIVATE_KEY,  // ✅ Only agent has this
  FIBER_NODE_PRIVATE_KEY,  // ✅ Agent signs Fiber ops
  DATABASE_URL,            // ✅ Shared with website
};

// Never exposed to web tier
```

---

## Testing Scenario

```
SETUP:
Website running on port 3000
Agent running in background
Testnet CKB node + Fiber available

TEST FLOW:

1. User visits http://localhost:3000
   → Landing page loads
   → "Login with JoyID" button ready

2. User clicks login → JoyID popup
   → User signs with passkey
   → Website creates session
   → Redirects to /tournaments

3. User browses tournaments
   → GET /api/tournaments/list
   → Shows 3 recruiting tournaments

4. User clicks "Join" on MK2 tournament
   → Modal appears with escrow address
   → User clicks "Register"
   → Confirm checkbox required
   → POST /api/tournaments/mk2-001/join
   → Website returns escrow address + amount

5. User copies escrow address
   → Opens CKB wallet
   → Sends 100 CKB to escrow address
   → Transaction confirms (30-60s)

6. AGENT detects payment (6s poll cycle)
   → Detects 100 CKB received
   → Matches to mk2-001 tournament
   → Updates DB: status = "payment_confirmed"
   → User's tournament entry now shows "Confirmed"

7. Time passes until block cutoff
   → All 8 entrants have paid ✓
   → Min 2 required ✓
   → Agent checks: ready to publish ✓

8. At block 18700500 (cutoff):
   → Agent publishes tournament to CKB cell
   → Agent opens Fiber multi-sig channel
   → All funds locked in channel
   → Tournament status: "active"
   → Website shows: "Tournament Started!"

9. Tournament runs (player plays game)
   → Session recorded to RAM Viewer
   → Results captured

10. Validator checks for cheating
    → Generates proof: { valid: true, winner: "player_1" }

11. Agent receives proof
    → Verifies signature ✓
    → Settles Fiber channel
    → Sends 180 CKB to winner (90% of pool)
    → Sends 20 CKB to house (10%)
    → Updates DB: status = "settled"

12. Winner sees prize in their wallet
    → 180 CKB received
    → Website shows: "You won! Prize claimed!"

RESULT: Full end-to-end flow with clear separation ✓
```

---

## Deployment Checklist

### Website Deployment

- [ ] Set `NEXT_PUBLIC_*` vars (public, safe)
- [ ] Set private env vars (server-side only)
- [ ] **NO private keys in .env files**
- [ ] Deploy to Vercel / Docker / VPS
- [ ] Test: `/api/tournaments/list` returns tournaments
- [ ] Test: JoyID login works
- [ ] Test: Join form returns escrow address

### Agent Deployment

- [ ] Create `.env.agent` with `CKB_ESCROW_PRIVATE_KEY`
- [ ] Set database connection (shared with website)
- [ ] Build agent code
- [ ] Test: Agent can poll escrow address
- [ ] Deploy as systemd service or long-running process
- [ ] Monitor logs for payment detections

### Integration Deployment

- [ ] Website + Agent on same database
- [ ] Website returns escrow address agent will monitor
- [ ] Agent can update DB that website reads
- [ ] Testnet transaction flow works end-to-end
- [ ] Mainnet cutover (flip RPC URLs)

---

## Summary

| Aspect | Website | Agent |
|--------|---------|-------|
| **Purpose** | User-facing UI | Background automation |
| **Runs** | Web server (port 3000) | Continuous loop (background) |
| **Private Keys** | ❌ None | ✅ Escrow only |
| **Blockchain Ops** | ❌ No | ✅ All transfers |
| **User Interaction** | ✅ Landing, browse, join | ❌ None (silent) |
| **Monitoring** | ❌ No | ✅ Every 6s |
| **Auto Actions** | ❌ No | ✅ Publish, refund, settle |
| **Cost** | Vercel free tier | Zero (local inference) |

---

**Clean separation. Website facilitates logins. Agent handles/monitors funds.** ✅
