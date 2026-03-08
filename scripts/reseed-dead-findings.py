#!/usr/bin/env python3
"""
reseed-dead-findings.py — Scans research findings for 404/dead seed indicators,
uses Gemini to find replacement URLs, and auto-queues revisit tasks.

Run from heartbeat (once per day).
"""

import os, re, glob, json, time
import urllib.request, urllib.error

WORKSPACE    = os.path.expanduser("~/.openclaw/workspace")
FINDINGS_DIR = os.path.join(WORKSPACE, "research/findings")
QUEUE_FILE   = os.path.join(WORKSPACE, "research/queue.md")
STATE_FILE   = os.path.join(WORKSPACE, "memory/heartbeat-state.json")
ENV_FILE     = os.path.expanduser("~/.openclaw/.env")
GEMINI_MODEL = "gemini-2.5-flash"
GEMINI_API   = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"

# Phrases that indicate a finding was run with dead/404 seeds
DEAD_INDICATORS = [
    "HTTP Error 404", "404: Not Found", "404 Not Found",
    "seeds did not return", "thin findings", "poor seed URLs",
    "could not be fetched", "failed to fetch", "URL returned no content",
    "no content was retrieved", "seed URLs were unavailable",
    "quality note", "⚠️ quality note",
]

def load_env():
    env = {}
    if os.path.exists(ENV_FILE):
        for line in open(ENV_FILE):
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                k, v = line.split('=', 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
    env.update(os.environ)
    return env

def load_state():
    try:
        return json.loads(open(STATE_FILE).read())
    except:
        return {}

def save_state(state):
    os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
    open(STATE_FILE, 'w').write(json.dumps(state, indent=2))

def gemini_query(api_key, prompt):
    url = GEMINI_API.format(model=GEMINI_MODEL, key=api_key)
    body = json.dumps({"contents": [{"parts": [{"text": prompt}]}],
                       "generationConfig": {"temperature": 0.3, "maxOutputTokens": 1024}})
    req = urllib.request.Request(url, data=body.encode(), headers={"Content-Type": "application/json"})
    try:
        resp = urllib.request.urlopen(req, timeout=30)
        data = json.loads(resp.read())
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception as e:
        print(f"  Gemini error: {e}")
        return None

def extract_task_id(filepath):
    """Get task ID from filename."""
    return os.path.basename(filepath)[:-3]  # strip .md

def is_dead_finding(content):
    """Return True if finding content shows signs of dead seeds."""
    lower = content.lower()
    return any(ind.lower() in lower for ind in DEAD_INDICATORS)

def get_original_seeds(content):
    """Extract seed URLs from a findings file header."""
    seeds = re.findall(r'https?://\S+', content[:2000])
    return list(dict.fromkeys(seeds))[:8]  # dedupe, max 8

def get_original_goal(task_id, queue_content):
    """Find the goal for a task ID in queue.md."""
    # Try ## [DONE] format
    m = re.search(
        rf'## \[(?:DONE|PENDING)\] {re.escape(task_id)}.*?(?=\n## |\Z)',
        queue_content, re.DOTALL
    )
    if m:
        goal_m = re.search(r'\*\*Goal:\*\*\s*(.+?)(?=\n\*\*|\Z)', m.group(), re.DOTALL)
        if goal_m:
            return goal_m.group(1).strip()[:300]
    return task_id.replace('-', ' ')

def revisit_exists(task_id, queue_content):
    """Check if a revisit task already exists in queue."""
    return f"{task_id}-reseed" in queue_content or f"{task_id}-revisit" in queue_content

def find_better_seeds(api_key, task_id, goal, dead_seeds):
    """Ask Gemini to find better seed URLs for this research topic."""
    dead_list = '\n'.join(f'- {u}' for u in dead_seeds[:5])
    prompt = f"""You are a research assistant helping find working seed URLs for a technical research task.

Task ID: {task_id}
Goal: {goal}

The following seed URLs returned 404 or empty content:
{dead_list}

Find 3-5 working replacement URLs that directly address this research goal.
Requirements:
- Must be raw text/JSON accessible URLs (raw.githubusercontent.com, api.github.com, docs sites with plain text, etc.)
- NO github.com/blob/ paths (use raw.githubusercontent.com instead)
- NO rendered HTML pages — only direct content URLs
- Prefer: GitHub raw files, official docs, RFC text, npm package READMEs, API endpoints

Respond with ONLY a JSON array of URL strings, no explanation:
["https://...", "https://..."]"""

    result = gemini_query(api_key, prompt)
    if not result:
        return []
    # Extract JSON array
    m = re.search(r'\[.*?\]', result, re.DOTALL)
    if not m:
        return []
    try:
        urls = json.loads(m.group())
        return [u for u in urls if isinstance(u, str) and u.startswith('http')][:5]
    except:
        return []

def verify_url(url):
    """Quick HEAD check — returns True if URL is reachable."""
    try:
        req = urllib.request.Request(url, method='HEAD', headers={'User-Agent': 'Mozilla/5.0'})
        urllib.request.urlopen(req, timeout=6)
        return True
    except:
        try:
            # Some servers don't support HEAD — try GET with small range
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0', 'Range': 'bytes=0-512'})
            urllib.request.urlopen(req, timeout=6)
            return True
        except:
            return False

def append_reseed_task(task_id, goal, new_seeds, queue_content):
    """Append a reseed task to queue.md."""
    reseed_id = f"{task_id}-reseed"
    seeds_list = '\n'.join(f'- {u}' for u in new_seeds)
    block = f"""
---

[PENDING] {reseed_id}
**Priority:** MEDIUM
**Output:** findings/{reseed_id}.md
**Goal:** Re-research "{task_id}" with verified replacement seeds — original seeds returned 404 or thin content. {goal}
**Seeds:**
{seeds_list}
**Questions to answer:**
1. What are the core technical details of this topic?
2. What specific APIs, protocols, or interfaces are available?
3. What are the known limitations, failure modes, or gotchas?
4. Are there working examples or reference implementations we can port?
"""
    with open(QUEUE_FILE, 'a') as f:
        f.write(block)
    print(f"  ✅ Queued reseed: {reseed_id} ({len(new_seeds)} new seeds)")

def main():
    env = load_env()
    api_key = env.get('GEMINI_API_KEY') or env.get('GOOGLE_API_KEY')
    if not api_key:
        print("No Gemini API key found — skipping reseed check")
        return

    state = load_state()
    last_run = state.get('lastReseedCheck', 0)
    now = int(time.time() * 1000)
    ONE_DAY = 86400 * 1000

    if now - last_run < ONE_DAY:
        print(f"Reseed check ran recently — skipping")
        return

    queue_content = open(QUEUE_FILE).read()
    findings = glob.glob(os.path.join(FINDINGS_DIR, "*.md"))
    
    dead = []
    for path in findings:
        content = open(path).read()
        if is_dead_finding(content):
            task_id = extract_task_id(path)
            if not revisit_exists(task_id, queue_content):
                dead.append((task_id, path, content))

    print(f"[reseed] Found {len(dead)} findings with dead/thin seeds")

    reseeded = 0
    for task_id, path, content in dead:
        print(f"\n  Checking: {task_id}")
        goal = get_original_goal(task_id, queue_content)
        dead_seeds = get_original_seeds(content)
        
        print(f"  Dead seeds: {len(dead_seeds)} — asking Gemini for replacements...")
        new_seeds = find_better_seeds(api_key, task_id, goal, dead_seeds)
        
        if not new_seeds:
            print(f"  ⚠️  Gemini couldn't find replacement seeds for {task_id}")
            continue

        # Verify at least one seed is reachable
        verified = [u for u in new_seeds if verify_url(u)]
        print(f"  Verified {len(verified)}/{len(new_seeds)} new seeds reachable")

        if not verified:
            print(f"  ⚠️  No verified seeds for {task_id} — skipping")
            continue

        # Re-read queue in case it changed
        queue_content = open(QUEUE_FILE).read()
        if not revisit_exists(task_id, queue_content):
            append_reseed_task(task_id, goal, verified, queue_content)
            queue_content = open(QUEUE_FILE).read()
            reseeded += 1
        else:
            print(f"  Already has revisit task, skipping")

        time.sleep(1)  # be gentle with Gemini rate limits

    state['lastReseedCheck'] = now
    save_state(state)
    print(f"\n[reseed] Done — {reseeded} tasks reseeded")

if __name__ == '__main__':
    main()
