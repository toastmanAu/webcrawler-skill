#!/bin/bash
# Dashboard Summary Bot — posts to @DashSummaryBot every 4h
# Token: 8223793509:AAFJOol4r2dXJsph2uhMql8n3FlddlC5t6g

BOT_TOKEN="8223793509:AAFJOol4r2dXJsph2uhMql8n3FlddlC5t6g"
# DashSummaryBot — need to get chat_id after first /start
# Use @get_id_bot or send /start and check updates
CHAT_ID_FILE="/home/phill/.openclaw/workspace/scripts/.dashbot-chat-id"

send_msg() {
  local msg="$1"
  local chat_id="$2"
  curl -sf "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
    -d chat_id="$chat_id" \
    -d text="$msg" \
    -d parse_mode="HTML" > /dev/null 2>&1
}

get_chat_id() {
  curl -sf "https://api.telegram.org/bot${BOT_TOKEN}/getUpdates" | \
    python3 -c "
import sys,json
data=json.load(sys.stdin)
results=data.get('result',[])
if results:
    msg=results[-1].get('message',{})
    cid=msg.get('chat',{}).get('id')
    if cid: print(cid)
" 2>/dev/null
}

# Get or load chat_id
if [ -f "$CHAT_ID_FILE" ]; then
  CHAT_ID=$(cat "$CHAT_ID_FILE")
else
  CHAT_ID=$(get_chat_id)
  if [ -z "$CHAT_ID" ]; then
    echo "No chat_id yet — user needs to send /start to @DashSummaryBot"
    exit 1
  fi
  echo "$CHAT_ID" > "$CHAT_ID_FILE"
fi

NOW=$(date "+%H:%M %Z")
DATE=$(date "+%a %d %b %Y")
FAILURES=""

# ── CKB Node Dashboard ─────────────────────────────────────────────────
CKB_DATA=$(curl -sf http://localhost:8080/api/stats 2>/dev/null || curl -sf http://localhost:8080/health 2>/dev/null)
if [ -n "$CKB_DATA" ]; then
  BLOCK=$(echo "$CKB_DATA" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tipBlockNumber', d.get('block','?')))" 2>/dev/null)
  PEERS=$(echo "$CKB_DATA" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('peersCount', d.get('peers','?')))" 2>/dev/null)
  CKB_STATUS="✅ Online"
else
  CKB_STATUS="❌ Unreachable"
  BLOCK="?" ; PEERS="?"
  FAILURES="$FAILURES CKB_DASH"
fi

# ── Stratum Proxy ──────────────────────────────────────────────────────
STRAT_DATA=$(curl -sf http://localhost:8081/ 2>/dev/null)
if [ -n "$STRAT_DATA" ]; then
  HASHRATE=$(echo "$STRAT_DATA" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('hashrate','?'))" 2>/dev/null)
  MINERS=$(echo "$STRAT_DATA" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('connectedMiners', d.get('miners','?')))" 2>/dev/null)
  SHARES=$(echo "$STRAT_DATA" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('totalShares','?'))" 2>/dev/null)
  STRAT_STATUS="✅ Online"
else
  STRAT_STATUS="❌ Down"
  HASHRATE="?" ; MINERS="?" ; SHARES="?"
  FAILURES="$FAILURES STRATUM"
fi

# ── Fiber Dashboard ────────────────────────────────────────────────────
FIBER_DATA=$(curl -sf http://192.168.68.91:9091/api/nodes 2>/dev/null)
if [ -n "$FIBER_DATA" ]; then
  FIBER_SUMMARY=$(echo "$FIBER_DATA" | python3 -c "
import sys,json
nodes=json.load(sys.stdin)
parts=[]
for n in nodes:
    status='✅' if n.get('online') else '❌'
    info=n.get('info') or {}
    peers=int(info.get('peers_count','0x0'),16) if info else 0
    chs=len(n.get('channels',[]))
    parts.append(f\"{status} {n['name']}: {peers} peers, {chs} ch\")
print(' | '.join(parts))
" 2>/dev/null)
  FIBER_STATUS="✅ Online"
else
  FIBER_STATUS="❌ Unreachable"
  FIBER_SUMMARY="N/A"
  FAILURES="$FAILURES FIBER"
fi

# ── CKB Node (direct RPC) ──────────────────────────────────────────────
CKBNODE_DATA=$(ssh -o ConnectTimeout=5 ckbnode \
  'curl -sf http://localhost:8114 -H "Content-Type: application/json" \
  -d "{\"id\":1,\"jsonrpc\":\"2.0\",\"method\":\"get_tip_block_number\",\"params\":[]}"' 2>/dev/null)
if [ -n "$CKBNODE_DATA" ]; then
  TIP=$(echo "$CKBNODE_DATA" | python3 -c "import sys,json; r=json.load(sys.stdin); print(int(r['result'],16))" 2>/dev/null)
  CKBNODE_STATUS="✅ Synced"
else
  TIP="?"
  CKBNODE_STATUS="❌ Offline"
  FAILURES="$FAILURES CKBNODE"
fi

# ── UV Tracker ─────────────────────────────────────────────────────────
UV_UP=$(curl -sf http://localhost:9988/ > /dev/null 2>&1 && echo "✅ Online" || echo "❌ Down")

# ── Trading Bot ────────────────────────────────────────────────────────
TRADE_LOG=$(ssh -o ConnectTimeout=5 n100 'tail -5 ~/binance-bot/logs/bot.log' 2>/dev/null)
if [ -n "$TRADE_LOG" ]; then
  LAST_TRADE=$(echo "$TRADE_LOG" | grep -oE "(BUY|SELL|Waiting|RSI)[^\"]*" | tail -1 | cut -c1-50)
  TRADE_STATUS="✅ Running"
else
  LAST_TRADE="No recent log"
  TRADE_STATUS="⚠️ Unknown"
fi

# ── Whale Bot ──────────────────────────────────────────────────────────
WHALE_UP=$(ps aux | grep whale-bot.js | grep -v grep > /dev/null 2>&1 && echo "✅ Running" || echo "❌ Down")

# ── Build message ──────────────────────────────────────────────────────
MSG="<b>📊 DASHBOARD SUMMARY</b>
<i>${DATE} · ${NOW}</i>

<b>⛓️ CKB NODE</b>
Status: ${CKBNODE_STATUS}
Block: ${TIP}
Dashboard: ${CKB_STATUS} | Block: ${BLOCK} | Peers: ${PEERS}

<b>⛏️ MINING (Stratum Proxy)</b>
Status: ${STRAT_STATUS}
Hashrate: ${HASHRATE} H/s
Miners: ${MINERS} | Total shares: ${SHARES}

<b>⚡ FIBER NETWORK</b>
Status: ${FIBER_STATUS}
${FIBER_SUMMARY}

<b>🤖 BOTS &amp; SERVICES</b>
Whale Bot: ${WHALE_UP}
UV Tracker: ${UV_UP}
Trading Bot: ${TRADE_STATUS}
  └ ${LAST_TRADE}"

if [ -n "$FAILURES" ]; then
  MSG="${MSG}

⚠️ <b>FAILURES:</b>${FAILURES}"
fi

send_msg "$MSG" "$CHAT_ID"
echo "Summary sent at $(date)"
