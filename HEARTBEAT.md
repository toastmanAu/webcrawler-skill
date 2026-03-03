# HEARTBEAT.md

## Idle Research Crawler (runs automatically when nothing else needs attention)
Rule: if there are PENDING tasks in `research/queue.md` AND `lastResearchCrawl` in heartbeat-state.json is >15min ago → run one task.
Command: `python3 /home/phill/.openclaw/workspace/scripts/research-crawl.py`
- Script picks the next task automatically: HIGH → MEDIUM → LOW → SYNTHESIS
- SYNTHESIS tasks run last — they read all completed findings + MEMORY.md and produce a stack gap analysis (no web crawl needed)
- Script updates `lastResearchCrawl` timestamp itself — no manual step needed
- On completion: notify Phill: "🔬 Research done: <task-id> → research/findings/<id>.md"
- Cost: ~$0.03-0.05/task (Gemini 2.5 Flash) — run freely, no approval needed
- If ALL tasks DONE (including SYNTHESIS): skip silently

## Research Dashboard (port 9989)
Check `curl -sf http://localhost:9989/ -o /dev/null` — if down, restart:
`python3 /home/phill/research-dashboard/server.py &`
- Silent restart, no notification needed

## DOB Minter Dev Server (port 5173)
Check `systemctl --user is-active ckb-dob-minter` — if inactive, restart: `systemctl --user restart ckb-dob-minter`
- Silent restart, no notification needed unless it fails to come back up

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

## Chat Bridge (Matterbridge)
Check `systemctl --user is-active ckb-chat-bridge.service` — if inactive, restart: `systemctl --user restart ckb-chat-bridge.service`
- Also check logs: `journalctl --user -u ckb-chat-bridge.service -n 5 --no-pager`
- If logs show repeated `SendMessage failed` errors → notify Phill, bridge may need rejoin
- Service bridges: Nervos Nation TG (-1001623077152) ↔ Nervos Network Discord (#nervos-nation-bridge)
- Config: /home/phill/ckb-chat-bridge/matterbridge.toml

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

## Obsidian Vault (1x/day — ~10pm ACST)
Review recent session memory files and update the Obsidian vault:
- Scan `memory/YYYY-MM-DD.md` for today + yesterday
- Create/update notes in `/home/phill/obsidian-vault/` for any new projects, ideas, or decisions discussed
- Add wikilinks between related concepts
- Update open questions / next steps in relevant project notes
- Commit vault to git if changes made: `cd /home/phill/obsidian-vault && git add -A && git commit -m "vault update: YYYY-MM-DD" && git push`
- Track last run in heartbeat-state.json under key `vaultUpdate`


Once group is created and ID is in COLLECTIVE.md:
- Post brief status: current model, any issues, anything interesting from the last 24h
- Read other agents' posts, update COLLECTIVE.md with anything worth keeping
- Format: `[Kernel/Pi5] <3 lines max>`
- Group ID: -1003828360343

## Wyltek Site Stats (1x/day — ~9am ACST)
Run `bash /home/phill/.openclaw/workspace/scripts/update-site-stats.sh` — track last run in heartbeat-state.json under key `siteStats`.
- Counts board targets (boards.h), sensor drivers (sensors/drivers/), public repos (gh CLI)
- Patches index.html stat cards + feature description, commits + pushes if changed
- No notification needed unless push fails

## Test Results (1x/day — ~8am ACST)
Run `python3 /home/phill/.openclaw/workspace/scripts/update-test-results.py` — track last run in heartbeat-state.json under key `testResults`.
- Runs CKB-ESP32 + ckb-light-esp host test suites
- Writes JSON to wyltek-industries-site/tests/, commits + pushes if changed
- If any tests fail: notify Phill immediately with repo name + failure count
