#!/usr/bin/env python3
import json, sys, os

path = '/home/phill/.openclaw/workspace/memory/heartbeat-state.json'
with open(path) as f:
    data = json.load(f)

now_ms = 1773351499642  # from earlier
now_s = now_ms // 1000

# Update lastChecks
if 'lastChecks' in data:
    data['lastChecks']['modelCheck'] = now_ms
    data['lastChecks']['bugReports'] = now_ms
    data['lastChecks']['siteStats'] = now_ms

# Update top-level duplicates
data['modelCheck'] = now_s
data['bugReports'] = now_s
# siteStats top-level doesn't exist, add?
if 'siteStats' not in data:
    data['siteStats'] = now_s

with open(path, 'w') as f:
    json.dump(data, f, indent=2)
print('Updated heartbeat-state.json')