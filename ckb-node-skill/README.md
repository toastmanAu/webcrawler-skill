# ⬡ CKB Node Monitor — Alexa Skill

A publishable Alexa Skill that displays real-time CKB (Nervos Network) node statistics on Echo Show devices via an APL visual dashboard.

**Anyone can install it:**
- 🖥 **Node runners** → enter your RPC IP once, get live personal stats
- 🌐 **Everyone else** → falls back to the public mainnet node with a nudge to run your own

---

## 📸 Dashboard Preview

```
╔══════════════════════════════════════════════════════════════════════╗
║  ⬡ CKB Node Monitor          🌐 Public node: mainnet.ckb.dev  [↻ Refresh]
║  ──────────────────────────────────────────────  ✓ HEALTHY          ║
║                                                                      ║
║  ┌──────────────────────────────┐  ┌───────────────────────────┐   ║
║  │ 🔗 BLOCK HEIGHT              │  │ 🌐 PEERS CONNECTED        │   ║
║  │ 14,823,441                   │  │ 38                        │   ║
║  │ Tip: 0x3f8a1c…a4e2           │  │ 38 peers                  │   ║
║  └──────────────────────────────┘  └───────────────────────────┘   ║
║                                                                      ║
║  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  ║
║  │ ⏱ EPOCH      │  │ ⛓ CHAIN      │  │ 🔖 NODE VERSION          │  ║
║  │ 5821 (12/...)│  │  CKB         │  │  0.118.0                 │  ║
║  └──────────────┘  └──────────────┘  └──────────────────────────┘  ║
║                                                                      ║
║  💡 Showing public node data — run your own for real-time stats!    ║
║     Say: "Alexa, set my node to 192.168.1.100"                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | ≥ 18 | https://nodejs.org |
| ASK CLI | ≥ 2.x | `npm install -g ask-cli` |
| AWS CLI | any | https://aws.amazon.com/cli |
| AWS account | — | https://aws.amazon.com |
| Amazon Developer account | — | https://developer.amazon.com |

### 1. Configure credentials

```bash
# Configure AWS CLI (Lambda + DynamoDB access needed)
aws configure

# Configure ASK CLI (links to your Amazon Developer account)
ask configure
```

### 2. Clone / copy the skill

```bash
cd /path/to/ckb-node-skill
npm install --prefix lambda
```

### 3. Deploy

```bash
# Full deploy — creates/updates Lambda, syncs interaction model
ask deploy

# First deploy only: also provision DynamoDB via CloudFormation (optional)
aws cloudformation deploy \
  --template-file infrastructure/cfn/template.yaml \
  --stack-name ckb-node-monitor \
  --parameter-overrides SkillId=<YOUR_SKILL_ID> \
  --capabilities CAPABILITY_NAMED_IAM
```

> **Tip:** `ask deploy` with `createTable: true` in the SDK will auto-create the DynamoDB table on first invocation. The CFN template is for explicit infra-as-code management.

### 4. Test in the Alexa Developer Console

1. Go to https://developer.amazon.com/alexa/console/ask
2. Find **CKB Node Monitor** → click **Test**
3. Set **Skill testing is enabled in: Development**
4. Type or say: `open c k b node monitor`

---

## 🗣 Voice Commands

| What you say | What happens |
|---|---|
| `Alexa, open CKB node monitor` | Shows dashboard (public or personal) |
| `Alexa, ask CKB node monitor for my block height` | Fetches stats, speaks block height |
| `Alexa, ask CKB node monitor to set my node to 192.168.1.100` | Saves your node IP |
| `Alexa, ask CKB node monitor to show my node stats` | Re-fetches and displays dashboard |
| `Alexa, ask CKB node monitor to clear my node` | Reverts to public fallback |
| `Alexa, ask CKB node monitor for help` | Explains available commands |

### Echo Show — on-screen
- Tap **↻ Refresh** button to re-fetch stats
- Status badge top-right: **✓ HEALTHY** / **⟳ SYNCING** / **✕ OFFLINE**

---

## 🏗 Project Structure

```
ckb-node-skill/
├── .ask/
│   └── ask-states.json          # ASK CLI state (skill ID, deploy hashes)
├── skill-package/
│   ├── skill.json               # Skill manifest (name, category, permissions)
│   ├── interactionModels/
│   │   └── custom/
│   │       └── en-US.json       # Interaction model (intents, utterances, slots)
│   └── apl/
│       └── dashboard.json       # APL document for Echo Show display
├── lambda/
│   ├── index.js                 # Main Lambda handler (all skill logic)
│   ├── package.json             # Dependencies
│   ├── lambda.json              # Lambda config (runtime, memory, timeout)
│   └── apl/
│       └── dashboard.json       # APL document copy (bundled with Lambda)
├── infrastructure/
│   └── cfn/
│       └── template.yaml        # CloudFormation (DynamoDB + IAM role)
└── README.md
```

---

## ⚙️ Configuration

### Environment Variables (Lambda)

| Variable | Default | Description |
|---|---|---|
| `DYNAMODB_TABLE` | `ckb-node-monitor-attributes` | DynamoDB table for user node IPs |

Set via AWS Console → Lambda → Configuration → Environment variables, or in `lambda.json`.

### Public Fallback RPC

Hardcoded in `lambda/index.js`:
```js
const PUBLIC_RPC_URL = 'https://mainnet.ckb.dev/rpc';
```
Change this if you prefer a different public endpoint.

### RPC Port

```js
const RPC_PORT = 8114; // standard CKB RPC port
```

---

## 🔌 CKB RPC Calls Used

| Method | Data extracted |
|---|---|
| `get_blockchain_info` | Block height, epoch, chain, sync status, tip hash, warnings |
| `get_peers` | Peer count |
| `local_node_info` | Node version, node ID |

All calls are made in parallel via `Promise.allSettled()` — if `get_peers` or `local_node_info` fail, the dashboard still renders with partial data.

**RPC format:**
```json
POST http://<your-node-ip>:8114
Content-Type: application/json

{"id": 1, "jsonrpc": "2.0", "method": "get_blockchain_info", "params": []}
```

---

## 🔒 Security Notes

- User node IPs are stored in **DynamoDB**, scoped to Alexa account (via `persistentUnitId`)
- Personal node requests go over **plain HTTP on your LAN** — this is expected for home nodes
- The skill only reads from your node — it never writes or controls it
- No API keys or secrets are stored in the skill

### Firewall / Router

If your Echo device is on a different subnet than your CKB node:
- Allow TCP port 8114 from your Echo's IP to your node
- **Do NOT** expose port 8114 to the internet

---

## 📦 Publishing to Alexa Store

### Icons Required

| Size | File | Location |
|---|---|---|
| 108×108 px | `ckb-node-monitor-108.png` | Upload in Developer Console |
| 512×512 px | `ckb-node-monitor-512.png` | Upload in Developer Console |

### Publishing checklist

- [ ] Skill tested on physical Echo Show device
- [ ] All example phrases work correctly
- [ ] Privacy policy URL filled in `skill.json` (required for submission)
- [ ] Terms of use URL filled in `skill.json`
- [ ] Icons uploaded (108×108 and 512×512)
- [ ] Testing instructions updated in `skill.json`
- [ ] Category set to `TOOLS`
- [ ] Submit for certification in Developer Console

### Certification tips

- The skill must handle `AMAZON.CancelIntent`, `AMAZON.StopIntent`, and `AMAZON.HelpIntent` — ✅ done
- APL must not be the only output — voice response always included — ✅ done
- Skills with `isChildDirected: false` skip COPPA review

---

## 🐛 Troubleshooting

### "Cannot reach node" error
1. Check your CKB node is running: `ckb --version`
2. Check RPC is enabled in `ckb.toml`:
   ```toml
   [rpc]
   listen_address = "0.0.0.0:8114"
   ```
3. Check firewall: `curl http://<your-ip>:8114 -d '{"id":1,"jsonrpc":"2.0","method":"get_blockchain_info","params":[]}'`

### APL not showing (voice-only device)
- APL only renders on Echo Show, Echo Spot, and Fire TV
- On Echo (audio-only), the skill still works — voice responses only

### DynamoDB permission errors
- Ensure Lambda execution role has `dynamodb:GetItem`, `PutItem`, `UpdateItem`, `DeleteItem`, `CreateTable`, `DescribeTable` on your table
- Use the provided CloudFormation template to set this up correctly

### IP address not parsed correctly
- Alexa STT sometimes says "192 dot 168 dot 1 dot 100" — the skill normalises this automatically
- If issues persist, try: "set my node to one nine two dot one six eight dot one dot one zero zero"

---

## 🛠 Local Development

```bash
# Install deps
npm install --prefix lambda

# Syntax check
npm test --prefix lambda

# Deploy to dev stage
ask deploy --target skill-metadata
ask deploy --target lambda
ask deploy --target interaction-model

# Or all at once
ask deploy
```

### Simulating locally (no Echo needed)

Use the Alexa Developer Console simulator, or install the ASK toolkit for VS Code.

---

## 📝 License

MIT — free to use, fork, and publish.

---

## 🙏 Credits

- [Nervos Network](https://www.nervos.org/) — CKB blockchain
- [Alexa Skills Kit SDK v2](https://github.com/alexa/alexa-skills-kit-sdk-for-nodejs)
- [APL](https://developer.amazon.com/en-US/docs/alexa/alexa-presentation-language/apl-overview.html) — Alexa Presentation Language

---

*Built for the CKB community. Run your node, monitor it from your couch.* ⬡
