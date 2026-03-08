# HEARTBEAT.md

## Dead Seed Reseeder (1x/day — runs after research crawler)
Run `python3 /home/phill/.openclaw/workspace/scripts/reseed-dead-findings.py`
- Scans all findings/ for 404 indicators, "thin findings", "quality note", dead seed phrases
- For each dead finding: asks Gemini to find replacement URLs, verifies they're reachable
- Auto-queues a `<task-id>-reseed` PENDING task with verified seeds
- Skips if revisit/reseed already queued
- Tracks last run in heartbeat-state.json under key `lastReseedCheck` (runs once per day)
- If reseeded > 0: notify Phill with count

## Idle Research Crawler (runs automatically when nothing else needs attention)
**Split responsibility:**
- **Pi (Kernel/me)** → FiberQuest tasks only (fiberquest-* and fiber-* tagged tasks) — private until comp starts
- **NucBox** → all other general stack research (already running via cron every 15min)

Rule: if there are PENDING fiberquest-* or fiber-* tasks in `research/queue.md` AND `lastResearchCrawl` in heartbeat-state.json is >15min ago → run one task.
Command: sync claims from NucBox first, then crawl:
```
rsync -q phill@192.168.68.79:/home/phill/workspace/research/claims/ /home/phill/.openclaw/workspace/research/claims/ 2>/dev/null; python3 /home/phill/.openclaw/workspace/scripts/research-crawl.py --filter fiberquest,fiber
```
- If no fiberquest/fiber tasks pending: skip silently (NucBox handles the rest)
- Script picks the next task automatically: HIGH → MEDIUM → LOW → SYNTHESIS
- SYNTHESIS tasks run last — they read all completed findings + MEMORY.md and produce a stack gap analysis (no web crawl needed)
- Script updates `lastResearchCrawl` timestamp itself — no manual step needed
- On completion: notify Phill: "🔬 Research done: <task-id> → research/findings/<id>.md"
- Cost: ~$0.03-0.05/task (Gemini 2.5 Flash) — run freely, no approval needed

## Research Dashboard (port 9989) — LOCAL TESTBED ONLY
⚠️ Local only — not public facing. Accessible via Tailscale at http://100.115.197.42:9989
Check `systemctl --user is-active research-dashboard` — if inactive, restart:
`systemctl --user restart research-dashboard`
- Silent restart, no notification needed

## Kernel Dashboard (port 9999) — PRIVATE, Tailscale only
Unified local dashboard at http://100.115.197.42:9999
Check `systemctl --user is-active kernel-dash` — if inactive, restart: `systemctl --user restart kernel-dash`
- Silent restart, no notification needed unless it fails to come back up

## DOB Minter Dev Server (port 5173) — LOCAL TESTBED ONLY
⚠️ This is a local dev/test server — NOT public facing. Public minter is at wyltekindustries.com/mint/ (GitHub Pages/Cloudflare CDN).
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

## Founding Member DOB Minter (check every heartbeat)
Run: `node /home/phill/ckb-dob-minter-script/mint-queue-runner.js --mainnet 2>&1`
- If output contains "Would mint" or "✅ Spore ID" → notify Phill: "🎉 Founding Member #X DOB minted → <address>", then update projects: `node /home/phill/kernel-dash/update-projects.js founding-member-dob done:add "Member #X minted: <spore-id>"`
- If output contains "No pending entries" → silent (nothing to do)
- If output contains error → alert Phill immediately
- Track last mint in heartbeat-state.json under key `lastMint`


Check `curl -sf http://localhost:8081/` — if down, run `systemctl --user restart ckb-stratum`
Alert Phill if it can't be restarted.
Mode: SOLO — direct to ckbnode (192.168.68.87:8114). Rewards go to Phill's address.

## Snapshot Pipeline Monitor (while snapshotInProgress in heartbeat-state.json)
If `snapshotInProgress` key exists in heartbeat-state.json:
- Check: `ssh phill@192.168.68.79 'du -sh /tmp/ckb-snapshot-staging/ 2>/dev/null && tail -3 ~/ckb-snapshot.log'`
- If rsync finished (log shows "Compressing\|Uploading\|DONE\|complete"): update projects.json → `node /home/phill/kernel-dash/update-projects.js ckb-snapshot status live`, set progress 90, clear blocked, notify Phill
- If still running: update `node /home/phill/kernel-dash/update-projects.js ckb-snapshot in_progress:clear` then add current size/total line — silent
- If log shows ERROR: notify Phill immediately
- Remove `snapshotInProgress` from heartbeat-state.json once pipeline is DONE or FAILED

## Backup (1x/day — ~4pm ACST)
Run `bash /home/phill/.openclaw/workspace/scripts/backup.sh` — track last run in heartbeat-state.json under key `backup`.
- Pushes workspace to GitHub (toastmanAu/kernel-workspace, private)
- Rsyncs configs + secrets to EliteDesk (192.168.68.97:~/backups/pi5/)
- If EliteDesk unreachable: skip rsync, still push GitHub, log warning
- If GitHub push fails: alert Phill

## Wyltek Lounge Relay
Check `systemctl --user is-active wyltek-lounge-relay` — if inactive, restart: `systemctl --user restart wyltek-lounge-relay`
- Polls Supabase lounge_messages every 10s, forwards to Phill's DM via @wyltekLoungeBot (bot token: 8775043920:AAFahyrwVxgpZWv4rg1k0-ASO8i9mVhSyg8)
- Silent restart, no notification needed unless it fails to come back up

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

## Anti-Scam Daily Summary (1x/day — ~9pm ACST)
Run: `node /home/phill/ckb-antiscam/daily-summary.js --notify --save`
- Sends Telegram digest to Nervos Network group with: joins, leaves, messages, bot flags, admin actions, learn mode accuracy (precision/recall), top triggers
- Saves to `data/-1001154129103/daily-stats.jsonl` for trend tracking
- After running: update projects → `node /home/phill/kernel-dash/update-projects.js ckb-antiscam in_progress:clear` then add "Day X of 14 calibration — check calibrate.js for current accuracy"
- Track last run in heartbeat-state.json under key `antiscamDailySummary`
- Only run once per day — skip if already run today

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

## Bug Reports (every 4 hours)
Run `node /home/phill/.openclaw/workspace/scripts/check-bug-reports.js` — track last run in heartbeat-state.json under key `bugReports`.
- If count > 0: notify Phill with the summary (issue numbers, severity, titles)
- If count == 0: silent (nothing to report)
- Include link to repo: https://github.com/toastmanAu/wyltek-bug-reports/issues

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
