# HEARTBEAT.md

## Dashboard Monitor
Check http://localhost:8080/rpc (CKB node dashboard proxy).
- If unreachable or block number hasn't advanced in >2h: alert Phill
- Normal state: ~6s block time, 20+ peers, no warnings
- Port: 8080 · Node: 192.168.68.87:8114

## Node Status
Last known: block ~18,674,521, 21 peers, healthy

## Alerts
- Dashboard down → notify Phill (user 1790655432, Telegram)
- Block stuck >2h → notify
- Peers drop below 5 → notify

## NerdMiner CKB
- Pushed to GitHub (dev branch) - no action needed
- Next action when Phill wakes: `gh auth refresh -s workflow` to restore git push
