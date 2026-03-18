#!/usr/bin/env python3
"""
research-crawl.py — AI-powered research crawler using Gemini Flash
Part of the webcrawler OpenClaw skill.

Picks the next PENDING task from a queue file, crawls seed URLs
(with automatic JS rendering via Playwright for JS-heavy sites),
and writes structured findings using Gemini AI analysis.

Priority order: HIGH > MEDIUM > LOW > SYNTHESIS
SYNTHESIS tasks synthesise across completed findings instead of crawling URLs.

Configuration via environment variables or .env file:
  GEMINI_API_KEY     — Required. Get free key at https://aistudio.google.com/apikey
  WORKSPACE_DIR      — Default: ~/.openclaw/workspace
  QUEUE_FILE         — Default: $WORKSPACE_DIR/research/queue.md
  FINDINGS_DIR       — Default: $WORKSPACE_DIR/research/findings/
  CLAIMS_DIR         — Default: $WORKSPACE_DIR/research/claims/
  MEMORY_FILE        — Default: $WORKSPACE_DIR/MEMORY.md
  STACK_FILE         — Default: $WORKSPACE_DIR/STACK.md
  JSDOCS_SCRIPT      — Default: (auto-detect next to this script)
  NOTIFY_CMD         — Optional. Shell command to run on task completion (e.g. telegram notify)

Usage:
  python3 research-crawl.py                  # pick next PENDING task
  python3 research-crawl.py --task <id>      # run specific task
  python3 research-crawl.py --filter fiber   # only tasks matching tag
  python3 research-crawl.py --dry-run        # show what would run, don't crawl
  python3 research-crawl.py --all            # run all PENDING tasks

Cost: ~$0.01-0.05 per task at Gemini 2.5 Flash rates
"""

import os, sys, re, json, time, argparse, glob, subprocess
import urllib.request, urllib.error

# ─── Configuration ────────────────────────────────────────────────────────────

def load_dotenv(path):
    """Load key=value pairs from a .env file into os.environ."""
    if not os.path.exists(path):
        return
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                k, v = k.strip(), v.strip().strip('"').strip("'")
                if k not in os.environ:
                    os.environ[k] = v

# Search for .env in common locations
for _env_path in [
    os.path.join(os.path.dirname(__file__), '..', '.env'),
    os.path.expanduser('~/.openclaw/.env'),
    os.path.expanduser('~/.env'),
    '.env',
]:
    load_dotenv(os.path.expanduser(_env_path))

WORKSPACE    = os.path.expanduser(os.environ.get('WORKSPACE_DIR', '~/.openclaw/workspace'))
QUEUE_FILE   = os.environ.get('QUEUE_FILE',   os.path.join(WORKSPACE, 'research/queue.md'))
FINDINGS_DIR = os.environ.get('FINDINGS_DIR', os.path.join(WORKSPACE, 'research/findings'))
CLAIMS_DIR   = os.environ.get('CLAIMS_DIR',   os.path.join(WORKSPACE, 'research/claims'))
MEMORY_FILE  = os.environ.get('MEMORY_FILE',  os.path.join(WORKSPACE, 'MEMORY.md'))
STACK_FILE   = os.environ.get('STACK_FILE',   os.path.join(WORKSPACE, 'STACK.md'))
NOTIFY_CMD   = os.environ.get('NOTIFY_CMD',   '')

# Auto-detect jsdocs-fetch.js (same directory as this script)
_script_dir = os.path.dirname(os.path.abspath(__file__))
JSDOCS_SCRIPT = os.environ.get('JSDOCS_SCRIPT', os.path.join(_script_dir, 'jsdocs-fetch.js'))

MAX_URL_CHARS    = 40000
MAX_URLS_PER_TASK = 6
JS_DETECT_THRESHOLD = 300  # chars — if static text < this, try Playwright

# ─── Model provider config ────────────────────────────────────────────────────
#
# MODEL_PROVIDER controls which AI backend to use:
#
#   gemini      — Google Gemini (default). Needs GEMINI_API_KEY.
#                 Free tier: 1500 req/day. Key: https://aistudio.google.com/apikey
#                 MODEL env var default: gemini-2.5-flash
#
#   ollama      — Local Ollama (no API key needed).
#                 OLLAMA_BASE_URL default: http://localhost:11434
#                 MODEL env var default: qwen2.5:14b
#
#   openai      — OpenAI or any OpenAI-compatible API (OpenRouter, LM Studio, etc).
#                 Needs OPENAI_API_KEY. OPENAI_BASE_URL default: https://api.openai.com/v1
#                 MODEL env var default: gpt-4o-mini
#
# Examples in .env:
#   MODEL_PROVIDER=gemini
#   GEMINI_API_KEY=AIza...
#   MODEL=gemini-2.5-flash
#
#   MODEL_PROVIDER=ollama
#   OLLAMA_BASE_URL=http://192.168.68.79:11434
#   MODEL=qwen2.5:14b
#
#   MODEL_PROVIDER=openai
#   OPENAI_API_KEY=sk-...
#   OPENAI_BASE_URL=https://openrouter.ai/api/v1
#   MODEL=anthropic/claude-3-haiku

MODEL_PROVIDER   = os.environ.get('MODEL_PROVIDER', 'gemini').lower()
MODEL            = os.environ.get('MODEL', '')  # provider-specific default applied below
OLLAMA_BASE_URL  = os.environ.get('OLLAMA_BASE_URL', 'http://localhost:11434')
OPENAI_BASE_URL  = os.environ.get('OPENAI_BASE_URL', 'https://api.openai.com/v1')

# Apply provider defaults for MODEL
if not MODEL:
    MODEL = {
        'gemini': 'gemini-2.5-flash',
        'ollama': 'qwen2.5:14b',
        'openai': 'gpt-4o-mini',
    }.get(MODEL_PROVIDER, 'gemini-2.5-flash')


# ─── JS-aware fetch ───────────────────────────────────────────────────────────

def fetch_url_static(url, max_chars=MAX_URL_CHARS):
    """Fetch URL and strip HTML. Returns (text, is_js_rendered_hint)."""
    try:
        req = urllib.request.Request(
            url, headers={'User-Agent': 'Mozilla/5.0 (webcrawler-research/2.0)'}
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            raw = resp.read(max_chars * 4).decode('utf-8', errors='replace')
            raw_len = len(raw)
            text = re.sub(r'<script[^>]*>.*?</script>', '', raw, flags=re.DOTALL)
            text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL)
            text = re.sub(r'<[^>]+>', ' ', text)
            text = re.sub(r'&[a-z#0-9]+;', ' ', text, flags=re.I)
            text = re.sub(r'\s+', ' ', text).strip()
            # Hint: big HTML but tiny text = JS-rendered app
            is_js_hint = raw_len > 5000 and len(text) < JS_DETECT_THRESHOLD
            return text[:max_chars], is_js_hint
    except Exception as e:
        return f'[FETCH ERROR: {e}]', False


def fetch_url_playwright(url, max_chars=MAX_URL_CHARS):
    """Fetch JS-rendered page using jsdocs-fetch.js via subprocess."""
    if not os.path.exists(JSDOCS_SCRIPT):
        print(f'  [warn] jsdocs-fetch.js not found at {JSDOCS_SCRIPT}, using static fetch only')
        text, _ = fetch_url_static(url)
        return text

    import tempfile
    tmp_dir = tempfile.mkdtemp(prefix='webcrawler_')
    try:
        result = subprocess.run(
            ['node', JSDOCS_SCRIPT, url, '--out', tmp_dir, '--no-playwright-skip'],
            capture_output=True, text=True, timeout=30
        )
        # Find the output file
        files = glob.glob(os.path.join(tmp_dir, '*.md'))
        files = [f for f in files if not f.endswith('INDEX.md')]
        if files:
            content = open(files[0]).read()
            # Strip the Source/Saved header lines
            content = re.sub(r'^Source:.*?\n.*?\n---\n\n', '', content, flags=re.DOTALL)
            return content[:max_chars]
        return f'[PLAYWRIGHT ERROR: no output file. stderr: {result.stderr[:200]}]'
    except subprocess.TimeoutExpired:
        return '[PLAYWRIGHT TIMEOUT]'
    except Exception as e:
        return f'[PLAYWRIGHT ERROR: {e}]'
    finally:
        import shutil
        shutil.rmtree(tmp_dir, ignore_errors=True)


def fetch_url(url, max_chars=MAX_URL_CHARS):
    """Smart fetch: try static first, fall back to Playwright for JS-rendered pages."""
    text, is_js = fetch_url_static(url, max_chars)
    if is_js:
        print(f'    → JS-rendered detected, using Playwright...')
        pw_text = fetch_url_playwright(url, max_chars)
        if len(pw_text) > len(text):
            return pw_text
    return text


# ─── LLM abstraction ─────────────────────────────────────────────────────────

def llm_query(prompt):
    """Query the configured LLM provider. Raises on error."""
    if MODEL_PROVIDER == 'gemini':
        return _query_gemini(prompt)
    elif MODEL_PROVIDER == 'ollama':
        return _query_ollama(prompt)
    elif MODEL_PROVIDER == 'openai':
        return _query_openai(prompt)
    else:
        raise ValueError(f"Unknown MODEL_PROVIDER: {MODEL_PROVIDER!r}. Use gemini, ollama, or openai.")


def _query_gemini(prompt):
    api_key = os.environ.get('GEMINI_API_KEY', '')
    if not api_key:
        raise ValueError('GEMINI_API_KEY not set. Get one free at https://aistudio.google.com/apikey')
    url = f'https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={api_key}'
    payload = json.dumps({
        'contents': [{'parts': [{'text': prompt}]}],
        'generationConfig': {'temperature': 0.3, 'maxOutputTokens': 16384},
    }).encode()
    req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = json.load(resp)
        return data['candidates'][0]['content']['parts'][0]['text']


def _query_ollama(prompt):
    url = f'{OLLAMA_BASE_URL.rstrip("/")}/api/generate'
    payload = json.dumps({
        'model': MODEL,
        'prompt': prompt,
        'stream': False,
        'options': {'temperature': 0.3, 'num_predict': 8192},
    }).encode()
    req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=1800) as resp:  # 30min — large local models can be slow
        data = json.load(resp)
        return data['response']


def _query_openai(prompt):
    api_key = os.environ.get('OPENAI_API_KEY', '')
    if not api_key:
        raise ValueError('OPENAI_API_KEY not set.')
    url = f'{OPENAI_BASE_URL.rstrip("/")}/chat/completions'
    payload = json.dumps({
        'model': MODEL,
        'messages': [{'role': 'user', 'content': prompt}],
        'temperature': 0.3,
        'max_tokens': 8192,
    }).encode()
    req = urllib.request.Request(url, data=payload, headers={
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {api_key}',
    })
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = json.load(resp)
        return data['choices'][0]['message']['content']


# Legacy alias
def gemini_query(api_key, prompt):
    return llm_query(prompt)


# ─── Claim locking ────────────────────────────────────────────────────────────

def claim_task(task_id, worker_id=None):
    import socket
    os.makedirs(CLAIMS_DIR, exist_ok=True)
    claim_file = os.path.join(CLAIMS_DIR, f'{task_id}.claimed')
    if os.path.exists(claim_file):
        age = time.time() - os.path.getmtime(claim_file)
        if age < 7200:
            return False
        print(f'  [claim] Stale claim on {task_id} ({int(age/60)}min) — overriding')
    worker = worker_id or socket.gethostname()
    with open(claim_file, 'w') as f:
        json.dump({'task': task_id, 'worker': worker, 'claimed_at': time.time()}, f)
    return True


def release_claim(task_id):
    try:
        os.remove(os.path.join(CLAIMS_DIR, f'{task_id}.claimed'))
    except FileNotFoundError:
        pass


# ─── Queue parsing ────────────────────────────────────────────────────────────

def parse_tasks(queue_text):
    tasks = []
    blocks = re.split(r'\n---\n', queue_text)
    for block in blocks:
        m = re.search(r'\[(\w+)\]\s+(\S+)', block)
        if not m:
            continue
        status, task_id = m.group(1), m.group(2)
        priority = re.search(r'\*\*Priority:\*\*\s*(\w+)', block)
        output   = re.search(r'\*\*Output:\*\*\s*(\S+)', block)
        goal     = re.search(r'\*\*Goal:\*\*\s*(.+?)(?=\n\*\*|\Z)', block, re.DOTALL)
        seeds    = re.findall(r'- (https?://\S+)', block)
        q_block  = re.search(r'\*\*Questions to answer:\*\*\n(.*?)(?=\n---|\Z)', block, re.DOTALL)
        questions = re.findall(r'\d+\.\s+(.+)', q_block.group(1)) if q_block else []
        tags_m   = re.search(r'\*\*Tags:\*\*\s*(.+)', block)
        tags     = [t.strip() for t in tags_m.group(1).split(',')] if tags_m else []
        tasks.append({
            'id':        task_id,
            'status':    status,
            'priority':  priority.group(1) if priority else 'MEDIUM',
            'output':    output.group(1) if output else f'findings/{task_id}.md',
            'goal':      goal.group(1).strip() if goal else '',
            'seeds':     seeds[:MAX_URLS_PER_TASK],
            'questions': questions,
            'tags':      tags,
        })
    return tasks


def mark_status(task_id, old_status, new_status):
    content = open(QUEUE_FILE).read()
    open(QUEUE_FILE, 'w').write(
        content.replace(f'[{old_status}] {task_id}', f'[{new_status}] {task_id}', 1)
    )


# ─── Synthesis ────────────────────────────────────────────────────────────────

def load_synthesis_context(task_id=None):
    parts = []
    if os.path.exists(STACK_FILE):
        parts.append(f'=== STACK.md ===\n{open(STACK_FILE).read()}')
    if os.path.exists(MEMORY_FILE):
        parts.append(f'=== MEMORY.md ===\n{open(MEMORY_FILE).read()[:10000]}')
    all_findings = sorted(glob.glob(os.path.join(FINDINGS_DIR, '*.md')))
    for p in all_findings:
        parts.append(f'=== Finding: {os.path.basename(p)} ===\n{open(p).read()[:1500]}')
    return '\n\n'.join(parts)


# ─── Task runner ─────────────────────────────────────────────────────────────

def run_task(task, api_key=None, dry_run=False):
    print(f"\n{'='*60}")
    print(f"Task:  {task['id']} [{task['priority']}]")
    print(f"Goal:  {task['goal'][:80]}...")

    mark_status(task['id'], 'PENDING', 'IN_PROGRESS')
    os.makedirs(FINDINGS_DIR, exist_ok=True)

    is_synthesis = task['priority'] == 'SYNTHESIS'
    questions_text = '\n'.join(f"{i+1}. {q}" for i, q in enumerate(task['questions']))

    if is_synthesis:
        print('  Mode: SYNTHESIS')
        source_text = '[DRY RUN]' if dry_run else load_synthesis_context(task['id'])
        prompt = f"""You are a technical architect. Synthesise the research findings and answer the questions below.
Be concrete. Reference specific projects and findings.

## Task: {task['id']}
## Goal
{task['goal']}

## Questions
{questions_text}

## Source Material
{source_text}

## Output
Write a structured markdown report with:
- Executive summary
- Answer to each question
- Prioritised action table
- New research tasks (if gaps found) in this format:

## [NEW_TASK]
**id:** kebab-case-id
**Priority:** HIGH|MEDIUM|LOW
**Goal:** What to research and why.
**Seeds:**
- https://raw.githubusercontent.com/...
**Questions to answer:**
1. Specific question?
## [/NEW_TASK]

Date: {time.strftime('%Y-%m-%d')}
"""
    else:
        print(f'  Seeds: {len(task["seeds"])}')
        fetched = {}
        for url in task['seeds']:
            print(f'  Fetching: {url}')
            if not dry_run:
                fetched[url] = fetch_url(url)
                time.sleep(1)
            else:
                fetched[url] = '[DRY RUN]'

        fetched_text = '\n\n'.join(
            f'=== {url} ===\n{text[:8000]}' for url, text in fetched.items()
        )
        prompt = f"""You are a technical research assistant. Analyse the web content and answer the questions precisely.
Cite specific APIs, code, or docs. If info is missing from the content, say so explicitly.

## Task: {task['id']}
## Goal
{task['goal']}

## Questions
{questions_text}

## Web Content
{fetched_text}

## Output
Write a structured markdown research finding:
- Brief summary
- Answer each question with evidence from the content
- Key facts, code snippets, version numbers
- Gaps / unanswered questions
- Recommended next steps (if any)
- Sources consulted

Date: {time.strftime('%Y-%m-%d')}
"""

    if dry_run:
        print('  [DRY RUN] Would call LLM here')
        finding = '# DRY RUN\n\nNo actual analysis performed.'
    else:
        print(f'  Calling {MODEL_PROVIDER}/{MODEL}...')
        t0 = time.time()
        finding = llm_query(prompt)
        print(f'  ✓ {len(finding)} chars in {time.time()-t0:.1f}s')

    # Save finding
    out_path = os.path.join(WORKSPACE, task['output'])
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    header = f"# Research Finding: {task['id']}\n\nDate: {time.strftime('%Y-%m-%d')}\nTask: {task['id']}\nPriority: {task['priority']}\n\n---\n\n"
    with open(out_path, 'w') as f:
        f.write(header + finding)
    print(f'  Saved: {out_path}')

    mark_status(task['id'], 'IN_PROGRESS', 'DONE')
    release_claim(task['id'])

    # Extract and queue new tasks from synthesis output
    new_tasks = re.findall(r'## \[NEW_TASK\](.*?)## \[/NEW_TASK\]', finding, re.DOTALL)
    for nt in new_tasks:
        id_m = re.search(r'\*\*id:\*\*\s*(\S+)', nt)
        if id_m:
            new_id = id_m.group(1)
            queue_content = open(QUEUE_FILE).read()
            if new_id not in queue_content:
                with open(QUEUE_FILE, 'a') as qf:
                    qf.write(f'\n---\n\n[PENDING] {new_id}\n{nt.strip()}\n')
                print(f'  → Queued new task: {new_id}')

    # Optional notification
    if NOTIFY_CMD and not dry_run:
        msg = f'🔬 Research done: {task["id"]} → {task["output"]}'
        try:
            subprocess.run(NOTIFY_CMD.replace('{msg}', msg), shell=True, timeout=10)
        except Exception:
            pass

    return True


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description='AI-powered research crawler')
    parser.add_argument('--task',    help='Run specific task ID')
    parser.add_argument('--filter',  help='Only run tasks matching this tag/prefix')
    parser.add_argument('--all',     action='store_true', help='Run all PENDING tasks')
    parser.add_argument('--dry-run', action='store_true', help='Show what would run, skip API calls')
    parser.add_argument('--list',    action='store_true', help='List pending tasks and exit')
    args = parser.parse_args()

    # API key check
    if MODEL_PROVIDER == 'gemini' and not os.environ.get('GEMINI_API_KEY') and not args.dry_run and not args.list:
        print('ERROR: GEMINI_API_KEY not set.')
        print('Get a free key at https://aistudio.google.com/apikey')
        print('Or switch provider: MODEL_PROVIDER=ollama (no key needed)')
        sys.exit(1)
    elif MODEL_PROVIDER == 'openai' and not os.environ.get('OPENAI_API_KEY') and not args.dry_run and not args.list:
        print('ERROR: OPENAI_API_KEY not set.')
        sys.exit(1)

    print(f'Provider: {MODEL_PROVIDER} / Model: {MODEL}')

    if not os.path.exists(QUEUE_FILE):
        print(f'ERROR: Queue file not found: {QUEUE_FILE}')
        print('Create it with tasks in the format described in references/QUEUE_FORMAT.md')
        sys.exit(1)

    queue_text = open(QUEUE_FILE).read()
    all_tasks  = parse_tasks(queue_text)

    # Priority order
    priority_order = {'HIGH': 0, 'MEDIUM': 1, 'LOW': 2, 'SYNTHESIS': 3}
    pending = [t for t in all_tasks if t['status'] == 'PENDING']
    pending.sort(key=lambda t: priority_order.get(t['priority'], 99))

    # Apply filter
    if args.filter:
        pending = [t for t in pending if args.filter.lower() in t['id'].lower()
                   or any(args.filter.lower() in tag.lower() for tag in t['tags'])]

    if args.list:
        print(f'\nPending tasks ({len(pending)}):')
        for t in pending:
            print(f'  [{t["priority"]:10}] {t["id"]}')
        return

    # Pick tasks to run
    if args.task:
        tasks_to_run = [t for t in pending if t['id'] == args.task]
        if not tasks_to_run:
            # Also check non-pending
            tasks_to_run = [t for t in all_tasks if t['id'] == args.task]
        if not tasks_to_run:
            print(f'ERROR: Task not found: {args.task}')
            sys.exit(1)
    elif args.all:
        tasks_to_run = pending
    else:
        tasks_to_run = pending[:1]  # just the top task

    if not tasks_to_run:
        print('No pending tasks found.')
        return

    for task in tasks_to_run:
        if not claim_task(task['id']):
            print(f'  Skipping {task["id"]} — claimed by another worker')
            continue
        try:
            run_task(task, dry_run=args.dry_run)
        except Exception as e:
            print(f'  ERROR on {task["id"]}: {e}')
            release_claim(task['id'])
            mark_status(task['id'], 'IN_PROGRESS', 'PENDING')
            raise


if __name__ == '__main__':
    main()
