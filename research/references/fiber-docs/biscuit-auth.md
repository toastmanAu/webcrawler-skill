# Biscuit Authentication in Fiber

Source: https://docs.fiber.world/docs/guide/biscuit-auth  
Saved: 2026-03-18

## Overview

Biscuit is a modern authorization token format (similar to JWTs) for distributed verification. In Fiber it protects RPC endpoints — disabled by default when RPC listens on localhost, **mandatory** when listening on a public IP.

## How It Works

1. Client sends RPC request with `Authorization: Bearer <base64-token>` header
2. `BiscuitAuthMiddleware` intercepts every request
3. Token signature verified against server's configured Ed25519 public key
4. Authorizer checks token permissions against method-specific rules
5. Contextual facts (current time, request params) added to authorizer
6. Pass → request forwarded; Fail → `Unauthorized` error

## Method Permission Rules

```
// Cch
send_btc          → write("cch")
receive_btc       → read("cch")
get_cch_order     → read("cch")
// Channels
open_channel      → write("channels")
accept_channel    → write("channels")
abandon_channel   → write("channels")
list_channels     → read("channels")
shutdown_channel  → write("channels")
update_channel    → write("channels")
// Graph
graph_nodes       → read("graph")
graph_channels    → read("graph")
// Info
node_info         → read("node")
// Invoices
new_invoice       → write("invoices")
parse_invoice     → read("invoices")
get_invoice       → read("invoices")
cancel_invoice    → write("invoices")
settle_invoice    → write("invoices")
// Payment
send_payment      → write("payments")
get_payment       → read("payments")
build_router      → read("payments")
// Peer
connect_peer      → write("peers")
disconnect_peer   → write("peers")
list_peers        → read("peers")
// Watchtower
create_watch_channel → write("watchtower") or right({channel_id}, "watchtower")
```

**Note:** `get_balance` is NOT a listed RPC method — querying balance must be done via CKB chain RPC directly.

## Setup (if enabling auth)

### 1. Generate key pair
```bash
cargo install biscuit-cli --vers 0.6.0-beta.2
biscuit keypair
# Output:
# Private key: ed25519-private/89d6c889...
# Public key:  ed25519/17b17274...
```

### 2. Configure public key (config.yml)
```yaml
rpc:
  listening_addr: "0.0.0.0:8227"
  biscuit_public_key: "ed25519/17b172749be74276f0ed35a5d0685752684a3c5722114bba447a2f301136db79"
```

Or via env var: `RPC_BISCUIT_PUBLIC_KEY="ed25519/..."` or CLI flag `--rpc-biscuit-public-key`

### 3. Create a token
```bash
# permissions.bc
read("peers");
write("payments");
write("channels");
check if time($time), $time <= 2026-01-01T00:00:00Z;

biscuit generate --private-key ed25519-private/<key> permissions.bc
```

### 4. Use token in RPC calls
```bash
curl http://127.0.0.1:8227 \
  -H "Authorization: Bearer <base64-token>" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"list_channels","params":[{}],"id":1}'
```

## Key Facts

- If `biscuit_public_key` is absent → auth DISABLED (open RPC) — safe for localhost-only nodes
- Fiber **refuses to start** on a public IP without auth enabled
- Tokens are Ed25519 signed, Base64-encoded
- Token expiry enforced via `check if time($time), $time <= <timestamp>Z`
- Revocation list supported via config

## Source Code References
- `crates/fiber-lib/src/rpc/biscuit.rs` — auth logic + unit tests
- `crates/fiber-lib/src/rpc/config.rs` — `RpcConfig.biscuit_public_key` field
- `crates/fiber-lib/src/rpc/mod.rs` — `BiscuitAuthMiddleware` wiring
- `crates/fiber-lib/src/fiber/tests/rpc.rs` — integration tests
