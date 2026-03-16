# Task: Nervos DAO Address Binding Tool (JoyID + Governance)

Saved: 2026-03-16 — Build after crypto-trade-dashboard completes.

## Summary
Production-grade MVP Cloudflare-native web app for Nervos DAO address binding tool.
Users connect JoyID, discover DAO deposits, sign a binding challenge, persist binding off-chain,
expose governance weight API.

## Deployment Constraint
MAINTENANCE FREE. No VPS, no always-on backend.
- Cloudflare Pages (frontend)
- Cloudflare Workers (API + verification)
- Cloudflare D1 (relational persistence)
- Cloudflare KV (nonces, challenges, cache)
- Cloudflare Cron Triggers (refresh + cleanup)
- R2 only if genuinely useful

## Product Behavior
1. User connects JoyID on CKB
2. Worker queries indexer providers for DAO cells (type script + 8-byte zero data)
3. Groups deposits by address/lock, sums capacities
4. User selects addresses to bind
5. Worker issues canonical challenge (domain, version, action=bind_dao_addresses, joyidCkbAddress, bindTargets, nonce, issuedAt, expiresAt)
6. Frontend sends challenge to JoyID signChallenge()
7. Worker verifies signature server-side
8. Persists active bindings + computes DAO weight
9. Public API: fetch bindings + current/snapshot weight

## Stack
- TypeScript
- Worker-native frontend (no Next.js/React bloat)
- Tailwind CSS
- JoyID CKB SDK (connect, signChallenge, verifySignature)
- Zod
- D1 + KV
- Wrangler
- Vitest + Playwright (1 e2e happy path)

## D1 Tables
- users
- wallet_principals
- dao_addresses
- dao_cells_cache
- bindings
- binding_snapshots
- audit_logs

## KV Keys
- nonces (one-time, short TTL)
- challenge TTL state
- discovery cache
- endpoint health cache

## Security
- Canonical JSON before signing
- One-time nonce use
- Short expiry window
- Server-side verification required
- Rate limit discovery + verify endpoints
- Signed proof bundle + audit log
- Replay protection

## UI Style
- Wyltek Industries compatible (dark, hardware-first, engineering-focused)
- Compact cards, strong typography, restrained accents
- Sections: Hero, How it works, Connect JoyID, Discovered deposits, Bindings, Weight summary, Freshness/verification, API docs, Footer

## Build Order
1. Scaffold Worker-native app
2. JoyID connect flow
3. DAO discovery (configurable provider abstraction + fallback)
4. Challenge issuance + verification
5. D1 bindings + KV nonces
6. Weight computation + display
7. Cron cleanup/refresh jobs
8. Provider health/failover
9. Wyltek UI polish
10. Tests + deployment docs

## Dev Experience
- Wrangler config
- D1 migrations
- .dev.vars.example
- Local dev instructions
- Seed/mock mode (UI dev without wallet)
- Tests: challenge gen, sig verify, DAO cell detection, provider fallback
- 1 e2e happy path test
- README with architecture + deployment docs

## Providers (configurable via env)
- CKB mainnet RPC: https://mainnet.ckbapp.dev/
- CKB indexer: https://mainnet.ckbapp.dev/indexer
- Support multiple + auto-failover
- Health scoring to prefer healthy providers
