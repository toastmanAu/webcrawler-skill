# HEARTBEAT.md

## Basic health (check every ~2h)

```bash
df -h / | awk 'NR==2 {if ($5+0 > 85) print "DISK WARN: " $5 " used on /"}'
free -m | awk '/Mem/ {if ($3/$2 > 0.90) print "MEM WARN: " $3 "MB/" $2 "MB used"}'
uptime | awk -F'load average:' '{split($2,a,","); if (a[1]+0 > 4) print "LOAD WARN: " a[1]}'
```

## Services on this machine (check 2x/day)

```bash
# Trading dashboard
curl -sf http://localhost:9090/ > /dev/null && echo "dashboard: ok" || echo "dashboard: DOWN"

# Fiber node
curl -sf http://localhost:9091/ > /dev/null && echo "fiber-dash: ok" || echo "fiber-dash: DOWN"

# Trading bot (paper mode)
ps aux | grep -q "[b]ot.py" && echo "trading-bot: running" || echo "trading-bot: stopped"
```

Alert Phill if dashboard or fiber node is unreachable.
Trading bot stopped = notify (not urgent, paper mode).

## Collective Group Report (1x/day)

Post a brief update. Format: `[Wyltek/N100] <status>`
Include:
- Which HF model is responding well / poorly right now
- Any rate limits hit
- Services status summary
- Anything interesting

Then read recent messages from Kernel and other agents, update COLLECTIVE.md.

## Model health (track in memory/heartbeat-state.json)

After each heartbeat, note which model responded and approximate latency.
If a model 429s twice in a row, bump it down the fallback list.

## Model Usage
HuggingFace free tier has rate limits — go easy on API calls.
Keep responses short, don't chain multiple tool calls unnecessarily.
If all models hit cooldown, wait ~1 hour and they'll recover automatically.
