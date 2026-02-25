# HEARTBEAT.md

## Dashboard Monitor
Check http://localhost:8080/health (CKB node dashboard proxy — lightweight health endpoint).
- If unreachable: **restart it** → `bash /home/phill/ckb-dashboard/start.sh`
- After restart, verify it responds, then notify Phill it was restarted
- If block number hasn't advanced in >2h: alert Phill
- Normal state: ~6s block time, 20+ peers, no warnings
- Port: 8080 · Node: 192.168.68.87:8114

## CKB Node Service (ckbnode)
Check via SSH: `ssh ckbnode 'systemctl is-active ckb'`
- If inactive: `ssh ckbnode 'sudo systemctl start ckb'` then notify Phill
- Node: orangepi@192.168.68.87 · CKB v0.204.0 · systemd service enabled

## Model Health
Run `bash /home/phill/.openclaw/workspace/scripts/check-models.sh --quiet` — check every ~1 hour (track last check in heartbeat-state.json under key `modelCheck`).
- If Anthropic primary returns billing/quota error → notify Phill immediately, confirm CKBDev fallback is active
- If CKBDev also fails → notify Phill that we're on HuggingFace free tier
- If ALL providers fail → urgent alert

## Node Status
Last known: block ~18,674,521, 21 peers, healthy

## Alerts
- Dashboard down → notify Phill (user 1790655432, Telegram)
- Block stuck >2h → notify
- Peers drop below 5 → notify

## Stratum Proxy (Solo Mode)
Check `curl -sf http://localhost:8081/` — if down, run `systemctl --user restart ckb-stratum`
Alert Phill if it can't be restarted.
Mode: SOLO — direct to ckbnode (192.168.68.87:8114). Rewards go to Phill's address.

## Backup (1x/day — ~4pm ACST)
Run `bash /home/phill/.openclaw/workspace/scripts/backup.sh` — track last run in heartbeat-state.json under key `backup`.
- Pushes workspace to GitHub (toastmanAu/kernel-workspace, private)
- Rsyncs configs + secrets to EliteDesk (192.168.68.97:~/backups/pi5/)
- If EliteDesk unreachable: skip rsync, still push GitHub, log warning
- If GitHub push fails: alert Phill

## UV Tracker
Check `curl -sf http://localhost:9988/` — if down, run:
`cd /home/phill/uv-tracker && setsid python3 -m http.server 9988 --bind 0.0.0.0 >> /tmp/uv-server.log 2>&1 &`

## Whale Bot
Check `ps aux | grep whale-bot | grep -v grep` — if not running, run /home/phill/ckb-whale-bot/start.sh
PID file: /home/phill/ckb-whale-bot/whale-bot.pid

## PoPo Anti-Scam Bot (check 2x/day — ~9am and ~9pm ACST)
Run: `node /home/phill/ckb-antiscam/analyse-events.js 12`
- If `event-log.jsonl` doesn't exist yet → bot hasn't received admin rights, skip
- Review output for: high lurker rates, fresh account waves, fast posters, forward sources
- If lurker rate >50%: note it, may need to lower leave-without-post score threshold
- If fresh account joins >10 in 12h: alert Phill — possible bot wave incoming
- If any bans in dry_run mode show `trigger: trading-spam` or `bot-behaviour`: report patterns to Phill with suggestion to go live
- Check `tail -5 /home/phill/ckb-antiscam/antiscam.log` for any ERROR lines

## NerdMiner CKB
- Pushed to GitHub (dev branch) - no action needed
- Next action when Phill wakes: `gh auth refresh -s workflow` to restore git push

## Agent Collective Group (1x/day)
Once group is created and ID is in COLLECTIVE.md:
- Post brief status: current model, any issues, anything interesting from the last 24h
- Read other agents' posts, update COLLECTIVE.md with anything worth keeping
- Format: `[Kernel/Pi5] <3 lines max>`
- Group ID: -1003828360343
