# CKB Monitor

A React Native + Expo app for monitoring CKB (Nervos) nodes on your local network.

## Features

- **Network Scanner** — Scans your local /24 subnet for CKB full nodes on port 8114. Parallel scan (30 concurrent probes). Shows block height, peer count, sync status per node.
- **Node Monitor** — Detailed view of a selected node: block height, peer count, sync state, epoch info, node ID. Auto-refreshes every 30 seconds.
- **Stratum Manager** — Connects to a stratum proxy API on port 8081. Shows connected miners, per-miner hashrate, accepted/rejected shares.

## Quick Start

### 1. Install Expo Go on your iPhone

1. Open the App Store on your iPhone
2. Search for **"Expo Go"**
3. Install the free app by Expo

### 2. Run the dev server (on Pi5 or any machine on the same network)

```bash
cd /home/phill/.openclaw/workspace/projects/ckb-monitor-app

# Install dependencies (first time only)
npm install

# Start Expo dev server
npx expo start
```

This will display a **QR code** in the terminal.

### 3. Connect your iPhone

1. Open the **Camera** app on your iPhone
2. Point it at the QR code in the terminal
3. Tap the banner that appears → opens in Expo Go
4. The app loads! 🎉

> **Same WiFi network required** — your iPhone and Pi5 must be on the same network.

---

## Configuration

### Default node
Edit `app/(tabs)/monitor.tsx` and `app/(tabs)/stratum.tsx` to change the default IP:
```typescript
const DEFAULT_IP = '192.168.68.87';  // Your CKB node
```

### Stratum proxy
Edit `app/(tabs)/stratum.tsx`:
```typescript
const DEFAULT_HOST = '192.168.68.87';  // Pi5
const DEFAULT_PORT = 8081;
```

---

## Project Structure

```
ckb-monitor-app/
├── app/
│   ├── _layout.tsx          # Root layout (StatusBar, Stack nav)
│   └── (tabs)/
│       ├── _layout.tsx      # Tab bar config
│       ├── index.tsx        # Network Scanner screen
│       ├── monitor.tsx      # Node Monitor screen
│       └── stratum.tsx      # Stratum Manager screen
├── src/
│   ├── theme.ts             # Colors, spacing, typography
│   ├── services/
│   │   ├── ckbRpc.ts        # CKB JSON-RPC calls (port 8114)
│   │   ├── networkScanner.ts # Parallel /24 subnet scanner
│   │   └── stratumApi.ts    # Stratum proxy API (port 8081)
│   └── components/
│       ├── StatCard.tsx     # Reusable stat card
│       └── NodeCard.tsx     # Node list item card
├── assets/                  # App icons and splash screen
├── app.json                 # Expo configuration
└── package.json
```

---

## CKB RPC Details

The app uses these RPC methods on port **8114**:

| Method | Purpose |
|--------|---------|
| `get_tip_block_number` | Current block height (hex) |
| `local_node_info` | Peer count, node ID |
| `get_blockchain_info` | Chain name, epoch, IBD status |

---

## Stratum Proxy API

The app expects a JSON API on port **8081**:

```
GET http://<host>:8081/
```

Expected response shape (flexible parsing):
```json
{
  "node": "http://localhost:8114",
  "node_healthy": true,
  "connected_miners": 2,
  "total_hashrate": 1234567890,
  "miners": [
    {
      "id": "worker1",
      "name": "rig-01",
      "hashrate": 617283945,
      "shares_accepted": 150,
      "shares_rejected": 2,
      "connected": true
    }
  ]
}
```

The parser handles multiple field name conventions (snake_case, camelCase).

---

## Testing

### Test Scanner
- Tap **Scan** — it will scan your local /24 subnet
- Your node at `192.168.68.87` should appear
- Or type the IP manually in the text field and tap **Add**

### Test Monitor
- Tap any node from Scanner (auto-navigates), or type an IP
- Should show block height, peers, sync status
- Pull down to refresh manually, or wait 30s for auto-refresh

### Test Stratum
- Enter your Pi5's IP in the host field
- Tap Connect
- Should show hashrate and connected miners (or "No miners" if none)

---

## Troubleshooting

**App can't connect to node:**
- Make sure you're on the same WiFi as the Pi5
- Check CKB node is running: `curl -X POST http://192.168.68.87:8114 -H 'Content-Type: application/json' -d '{"id":1,"jsonrpc":"2.0","method":"get_tip_block_number","params":[]}'`

**Stratum not connecting:**
- Check proxy is running: `curl http://192.168.68.87:8081/`
- Verify it returns JSON

**Scanner finds nothing:**
- Check subnet detection — manually type `192.168.68` in the subnet field if needed
- The scanner probes all 254 hosts with a 3-second timeout each (batches of 30)

**Expo QR code not working:**
- Make sure Expo Go is installed
- Try running `npx expo start --tunnel` for non-local network access
