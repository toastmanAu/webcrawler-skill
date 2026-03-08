#!/usr/bin/env python3
"""
scan-research-comments.py — Hourly scan of research_comments in Supabase.

For each new comment since last check:
- Keyword/pattern scan for research value
- If valuable: ask Gemini to extract seeds/questions → auto-queue follow-up task
- If question answerable from findings: flag for Phill with suggested reply
- Notify Phill via Telegram if anything actionable found

Cost: ~$0 (Supabase REST) + ~$0.001/Gemini call, only when something interesting found.
"""

import os, re, json, time, glob
import urllib.request, urllib.error

WORKSPACE    = os.environ.get("RESEARCH_WORKSPACE", os.path.expanduser("~/.openclaw/workspace"))
QUEUE_FILE   = os.path.join(WORKSPACE, "research/queue.md")
FINDINGS_DIR = os.path.join(WORKSPACE, "research/findings")
STATE_FILE   = os.path.join(WORKSPACE, "memory/heartbeat-state.json")
ENV_FILE     = os.path.expanduser("~/.openclaw/.env")

SB_URL = "https://yhntwgjzrzyhyxpiqcts.supabase.co"
GEMINI_MODEL = "gemini-2.5-flash"
GEMINI_API   = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"

# Telegram bot for notifications
TG_API = "https://api.telegram.org/bot{token}/sendMessage"
TG_CHAT_ID = "1790655432"  # Phill's chat

# Patterns that suggest research value in a comment
RESEARCH_SIGNALS = [
    r'https?://\S+',                          # URLs / potential seeds
    r'github\.com/[\w\-]+/[\w\-]+',          # GitHub repos
    r'have you (seen|tried|checked|looked)',  # suggestions
    r'there\'s (also|a)\b',                  # pointing to alternatives
    r'\b(RFC|spec|paper|doc|docs|repo)\b',   # references
    r'actually\b.*\b(wrong|incorrect|not quite|mistaken)',  # corrections
    r'\b(error|bug|issue|problem) (in|with)\b',             # bug reports
    r'\bwhat about\b',                        # questions with direction
    r'\b(fix|solution|workaround|alternative)\b',
]

QUESTION_SIGNALS = [
    r'\?$',
    r'^(how|what|why|when|can|does|is|are|do)\b',
    r'\bdo you know\b',
    r'\bany idea\b',
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

def sb_get(path, sb_key, params=""):
    url = f"{SB_URL}/rest/v1/{path}{params}"
    req = urllib.request.Request(url, headers={
        "apikey": sb_key,
        "Authorization": f"Bearer {sb_key}",
    })
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        return json.loads(resp.read())
    except Exception as e:
        print(f"  Supabase error: {e}")
        return []

def gemini_query(api_key, prompt):
    url = GEMINI_API.format(model=GEMINI_MODEL, key=api_key)
    body = json.dumps({"contents": [{"parts": [{"text": prompt}]}],
                       "generationConfig": {"temperature": 0.2, "maxOutputTokens": 800}})
    req = urllib.request.Request(url, data=body.encode(),
                                 headers={"Content-Type": "application/json"})
    try:
        resp = urllib.request.urlopen(req, timeout=30)
        data = json.loads(resp.read())
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception as e:
        print(f"  Gemini error: {e}")
        return None

def tg_notify(token, msg):
    if not token: return
    url = TG_API.format(token=token)
    body = json.dumps({"chat_id": TG_CHAT_ID, "text": msg, "parse_mode": "Markdown"})
    req = urllib.request.Request(url, data=body.encode(),
                                 headers={"Content-Type": "application/json"})
    try:
        urllib.request.urlopen(req, timeout=10)
    except Exception as e:
        print(f"  TG notify error: {e}")

def is_research_valuable(body):
    lower = body.lower()
    return any(re.search(p, lower) for p in RESEARCH_SIGNALS)

def is_question(body):
    lower = body.strip().lower()
    return any(re.search(p, lower) for p in QUESTION_SIGNALS)

def get_finding(task_id):
    path = os.path.join(FINDINGS_DIR, f"{task_id}.md")
    if os.path.exists(path):
        return open(path).read()[:3000]  # first 3k chars enough for context
    return None

def queue_followup(task_id, comment_body, seeds, questions, queue_content):
    followup_id = f"{task_id}-community-followup-{int(time.time())}"
    seeds_list = '\n'.join(f'- {u}' for u in seeds[:5]) if seeds else ''
    q_list = '\n'.join(f'{i+1}. {q}' for i, q in enumerate(questions[:4]))
    block = f"""
---

[PENDING] {followup_id}
**Priority:** MEDIUM
**Output:** findings/{followup_id}.md
**Goal:** Community follow-up for {task_id} — a reader comment raised new angles or provided seed URLs worth investigating. Original comment: "{comment_body[:200]}"
**Seeds:**
{seeds_list}
**Questions to answer:**
{q_list if q_list else '1. What does the community comment add to the existing findings?\n2. Are the suggested resources accurate and relevant?'}
"""
    with open(QUEUE_FILE, 'a') as f:
        f.write(block)
    print(f"  ✅ Queued follow-up: {followup_id}")
    return followup_id

def main():
    env = load_env()
    sb_key  = env.get('SUPABASE_SERVICE_KEY') or env.get('SB_SERVICE_KEY') or \
              "sb_secret_8tdKeoNYfnaSEqrkhwYDqw_B6qJMkEq"
    gemini_key = env.get('GEMINI_API_KEY') or env.get('GOOGLE_API_KEY')
    tg_token   = env.get('TELEGRAM_BOT_TOKEN')

    state = load_state()
    last_check_iso = state.get('lastCommentScan', '2026-01-01T00:00:00Z')
    now_iso = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())

    print(f"[comment-scan] Fetching comments since {last_check_iso}")

    # Fetch new comments
    comments = sb_get(
        'research_comments',
        sb_key,
        f'?created_at=gt.{last_check_iso}&order=created_at.asc&limit=50'
    )
    print(f"[comment-scan] {len(comments)} new comments")

    if not comments:
        state['lastCommentScan'] = now_iso
        save_state(state)
        return

    queue_content = open(QUEUE_FILE).read() if os.path.exists(QUEUE_FILE) else ''
    notifications = []
    queued = 0

    for c in comments:
        task_id = c.get('task_id', 'unknown')
        body    = c.get('body', '').strip()
        addr    = c.get('ckb_address', '')[:12] + '…'
        print(f"\n  [{task_id}] {addr}: {body[:80]}")

        if not body or len(body) < 10:
            continue

        valuable  = is_research_valuable(body)
        question  = is_question(body)

        if not valuable and not question:
            print(f"  → routine comment, skipping")
            continue

        # Extract URLs from comment directly
        urls = re.findall(r'https?://\S+', body)

        if valuable and gemini_key:
            finding = get_finding(task_id)
            prompt = f"""A reader left a comment on a research finding. Assess if it adds research value.

Task: {task_id}
Comment: {body}
{"Existing finding summary (first 2000 chars):" + finding[:2000] if finding else "No existing finding."}

Respond with JSON only:
{{
  "has_value": true/false,
  "value_type": "seeds|correction|question|context|none",
  "seeds": ["url1", "url2"],
  "new_questions": ["question 1", "question 2"],
  "suggested_reply": "short reply to show to Phill if this is a question we can answer, or null",
  "summary": "one sentence summary of what's valuable"
}}"""
            result = gemini_query(gemini_key, prompt)
            if result:
                try:
                    m = re.search(r'\{.*\}', result, re.DOTALL)
                    data = json.loads(m.group()) if m else {}
                    if data.get('has_value'):
                        vtype = data.get('value_type', 'context')
                        seeds = list(set(urls + data.get('seeds', [])))
                        questions = data.get('new_questions', [])
                        summary = data.get('summary', '')
                        reply_hint = data.get('suggested_reply')

                        print(f"  → Valuable ({vtype}): {summary}")

                        if vtype in ('seeds', 'correction') and (seeds or questions):
                            fid = queue_followup(task_id, body, seeds, questions, queue_content)
                            queue_content = open(QUEUE_FILE).read()
                            queued += 1
                            notifications.append(
                                f"🔬 *New research queued* from community comment on `{task_id}`\n"
                                f"_{summary}_\nTask: `{fid}`"
                            )
                        elif reply_hint:
                            notifications.append(
                                f"💬 *Community question* on `{task_id}`:\n_{body[:200]}_\n\n"
                                f"*Suggested reply:* {reply_hint}"
                            )
                        elif vtype == 'context':
                            notifications.append(
                                f"📝 *Useful context* added to `{task_id}` by community:\n_{summary}_"
                            )
                except Exception as e:
                    print(f"  Gemini parse error: {e}")
        elif question and not valuable:
            # Simple question — check if we can point to a finding
            finding = get_finding(task_id)
            if finding and gemini_key:
                prompt = f"""A reader asked a question about a research topic. Can the existing finding answer it?

Task: {task_id}
Question: {body}
Finding (first 2000 chars): {finding[:2000]}

Reply with JSON: {{"can_answer": true/false, "suggested_reply": "brief reply text or null"}}"""
                result = gemini_query(gemini_key, prompt)
                if result:
                    try:
                        m = re.search(r'\{.*\}', result, re.DOTALL)
                        data = json.loads(m.group()) if m else {}
                        if data.get('can_answer') and data.get('suggested_reply'):
                            notifications.append(
                                f"❓ *Question on* `{task_id}`:\n_{body[:150]}_\n\n"
                                f"*Suggested reply:* {data['suggested_reply']}"
                            )
                    except:
                        pass

        time.sleep(0.5)  # gentle rate limiting

    # Send consolidated notification
    if notifications and tg_token:
        msg = f"*Research Comment Scan* — {len(comments)} new comment(s)\n\n"
        msg += '\n\n---\n\n'.join(notifications[:5])  # max 5 per batch
        tg_notify(tg_token, msg)
        print(f"\n[comment-scan] Notified Phill: {len(notifications)} actionable items")

    state['lastCommentScan'] = now_iso
    save_state(state)
    print(f"\n[comment-scan] Done — {queued} follow-up tasks queued, {len(notifications)} notifications")

if __name__ == '__main__':
    main()
