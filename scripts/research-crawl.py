#!/usr/bin/env python3
"""
research-crawl.py — Idle research crawler using Gemini Flash
Picks the next PENDING task from research/queue.md, crawls seed URLs,
writes structured findings to research/findings/<id>.md

Priority order: HIGH > MEDIUM > LOW > SYNTHESIS
SYNTHESIS tasks run last — they read local findings + MEMORY.md instead of URLs.

Usage: python3 research-crawl.py [--task <id>] [--all]
Cost: ~$0.01-0.05 per task at Gemini Flash rates
"""

import os, sys, re, json, time, argparse, glob
import urllib.request, urllib.error

WORKSPACE       = os.path.expanduser("~/.openclaw/workspace")
QUEUE_FILE      = os.path.join(WORKSPACE, "research/queue.md")
FINDINGS_DIR    = os.path.join(WORKSPACE, "research/findings")
ENV_FILE        = os.path.expanduser("~/.openclaw/.env")
HEARTBEAT_STATE = os.path.join(WORKSPACE, "memory/heartbeat-state.json")
MEMORY_FILE     = os.path.join(WORKSPACE, "MEMORY.md")

GEMINI_MODEL = "gemini-2.5-flash"
GEMINI_API   = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"

# Telegram notify — uses OpenClaw bot to DM Phill on task completion
TG_BOT_TOKEN = "8446459270:AAFltgKPOgFc0FX4PjKJNPUxTRoRzayKAlE"
TG_CHAT_ID   = "1790655432"

MAX_URL_CHARS    = 40000
MAX_URLS_PER_TASK = 6


def send_telegram(text):
    """Send a Telegram DM to Phill via the whale bot."""
    try:
        payload = json.dumps({"chat_id": TG_CHAT_ID, "text": text}).encode()
        req = urllib.request.Request(
            f"https://api.telegram.org/bot{TG_BOT_TOKEN}/sendMessage",
            data=payload,
            headers={"Content-Type": "application/json"}
        )
        urllib.request.urlopen(req, timeout=10)
    except Exception as e:
        print(f"  [warn] Telegram notify failed: {e}")


def load_env():
    env = {}
    if os.path.exists(ENV_FILE):
        with open(ENV_FILE) as f:
            for line in f:
                line = line.strip()
                if "=" in line and not line.startswith("#"):
                    k, v = line.split("=", 1)
                    env[k.strip()] = v.strip()
    return env


def fetch_url(url, max_chars=MAX_URL_CHARS):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (research-crawl/1.0)"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            raw = resp.read(max_chars * 2).decode("utf-8", errors="replace")
            raw = re.sub(r"<script[^>]*>.*?</script>", "", raw, flags=re.DOTALL)
            raw = re.sub(r"<style[^>]*>.*?</style>", "", raw, flags=re.DOTALL)
            raw = re.sub(r"<[^>]+>", " ", raw)
            raw = re.sub(r"\s+", " ", raw).strip()
            return raw[:max_chars]
    except Exception as e:
        return f"[FETCH ERROR: {e}]"


def gemini_query(api_key, prompt):
    url = GEMINI_API.format(model=GEMINI_MODEL, key=api_key)
    payload = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.3, "maxOutputTokens": 8192},
    }).encode()
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.load(resp)
        return data["candidates"][0]["content"]["parts"][0]["text"]


def parse_tasks(queue_text):
    tasks = []
    blocks = re.split(r"\n---\n", queue_text)
    for block in blocks:
        m = re.search(r"\[(\w+)\]\s+(\S+)", block)
        if not m:
            continue
        status, task_id = m.group(1), m.group(2)
        priority     = re.search(r"\*\*Priority:\*\*\s*(\w+)", block)
        output       = re.search(r"\*\*Output:\*\*\s*(\S+)", block)
        goal         = re.search(r"\*\*Goal:\*\*\s*(.+?)(?=\n\*\*|\Z)", block, re.DOTALL)
        seeds        = re.findall(r"- (https?://\S+)", block)
        questions_block = re.search(r"\*\*Questions to answer:\*\*\n(.*?)(?=\n---|\Z)", block, re.DOTALL)
        questions = re.findall(r"\d+\.\s+(.+)", questions_block.group(1)) if questions_block else []
        tasks.append({
            "id":       task_id,
            "status":   status,
            "priority": priority.group(1) if priority else "MEDIUM",
            "output":   output.group(1) if output else f"findings/{task_id}.md",
            "goal":     goal.group(1).strip() if goal else "",
            "seeds":    seeds[:MAX_URLS_PER_TASK],
            "questions": questions,
        })
    return tasks


def mark_in_progress(task_id):
    content = open(QUEUE_FILE).read()
    open(QUEUE_FILE, "w").write(content.replace(f"[PENDING] {task_id}", f"[IN_PROGRESS] {task_id}", 1))


def mark_done(task_id):
    content = open(QUEUE_FILE).read()
    open(QUEUE_FILE, "w").write(content.replace(f"[IN_PROGRESS] {task_id}", f"[DONE] {task_id}", 1))


def load_synthesis_context():
    """Load all completed findings + MEMORY.md for synthesis tasks."""
    parts = []

    # MEMORY.md
    if os.path.exists(MEMORY_FILE):
        mem = open(MEMORY_FILE).read()[:15000]
        parts.append(f"=== MEMORY.md (stack context) ===\n{mem}")

    # All findings
    for path in sorted(glob.glob(os.path.join(FINDINGS_DIR, "*.md"))):
        name = os.path.basename(path)
        content = open(path).read()[:6000]  # cap each finding
        parts.append(f"=== Research Finding: {name} ===\n{content}")

    return "\n\n".join(parts)


def run_task(task, api_key, dry_run=False):
    print(f"\n{'='*60}")
    print(f"Task: {task['id']} [{task['priority']}]")

    mark_in_progress(task["id"])

    is_synthesis = task["priority"] == "SYNTHESIS"

    if is_synthesis:
        print("  Mode: SYNTHESIS (reading local findings + MEMORY.md)")
        if dry_run:
            source_text = "[DRY RUN - local files not read]"
        else:
            source_text = load_synthesis_context()

        questions_text = "\n".join(f"{i+1}. {q}" for i, q in enumerate(task["questions"]))
        prompt = f"""You are a technical architect and project advisor. You have access to a developer's research findings and project memory. Your job is to synthesise across all findings and produce a gap analysis, prioritised action plan, and new research tasks.

Be concrete and specific. Reference actual projects, findings, and decisions. Do not be generic.

## Task
{task['goal']}

## Questions to Answer
{questions_text}

## Source Material (research findings + project context)
{source_text}

## Output Format
Write a structured markdown report with:
- Executive summary (3-5 sentences on overall stack health)
- Section per question with specific, actionable answers
- "Build priority matrix" — ranked table of next actions by impact × effort
- "Critical bridges" — specific missing connections between components
- "New research tasks" — for each gap that needs external research before building, output a complete task block in EXACTLY this format (the system will parse and auto-queue these):

## [PENDING] kebab-case-task-id
**Priority:** HIGH|MEDIUM|LOW
**Output:** findings/kebab-case-task-id.md
**Goal:** One paragraph describing what to research and why.
**Seeds:**
- https://raw.githubusercontent.com/... (use raw/API URLs, NOT github.com/blob/ URLs)
- https://...
**Questions to answer:**
1. Specific question?
2. Specific question?

## [/PENDING]

Wrap each new task in ## [NEW_TASK] ... ## [/NEW_TASK] tags so the system can extract them.
Only generate tasks for things genuinely unknown — not things already covered in findings.

- Date: {time.strftime('%Y-%m-%d')}
"""
    else:
        # Normal crawl task
        print(f"  Seeds: {len(task['seeds'])} URLs")
        fetched = {}
        for url in task["seeds"]:
            print(f"  Fetching: {url}")
            if not dry_run:
                fetched[url] = fetch_url(url)
                time.sleep(1)
            else:
                fetched[url] = "[DRY RUN - not fetched]"

        questions_text = "\n".join(f"{i+1}. {q}" for i, q in enumerate(task["questions"]))
        fetched_text   = "\n\n".join(f"=== {url} ===\n{content[:8000]}" for url, content in fetched.items())

        prompt = f"""You are a technical research assistant. Analyse the following web content and answer the research questions. Be precise and cite specific code, APIs, or docs where relevant. Do not hallucinate — if you can't find the answer in the provided content, say so explicitly.

## Research Topic: {task['id']}

## Goal
{task['goal']}

## Questions to Answer
{questions_text}

## Source Content
{fetched_text}

## Output Format
Write a structured markdown research note with:
- A summary section (3-5 sentences)
- One section per question with a clear answer
- A "gaps / follow-up" section for anything not answered
- A "relevant code/API snippets" section if applicable
- Date: {time.strftime('%Y-%m-%d')}
"""

    print(f"  Querying Gemini {GEMINI_MODEL}...")
    result = "[DRY RUN - Gemini not called]" if dry_run else gemini_query(api_key, prompt)

    output_path = os.path.join(WORKSPACE, "research", task["output"])
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    mode_label = "SYNTHESIS" if is_synthesis else f"AUTO-CRAWLED (Gemini {GEMINI_MODEL})"
    header = f"# Research: {task['id']}\n\n**Date:** {time.strftime('%Y-%m-%d')}  \n**Status:** {mode_label}  \n**Seeds:** {'local findings + MEMORY.md' if is_synthesis else ', '.join(task['seeds'])}\n\n---\n\n"

    with open(output_path, "w") as f:
        f.write(header + result)

    print(f"  Written: {output_path}")
    mark_done(task["id"])

    # For synthesis tasks: parse any new task blocks from the result and append to queue
    if is_synthesis and not dry_run:
        _inject_new_tasks(result)

    return output_path


def _inject_new_tasks(synthesis_output):
    """
    Looks for task blocks in synthesis output (marked with ## [NEW_TASK] id)
    and appends them to queue.md as PENDING tasks.
    Also handles raw task blocks if Gemini writes them in the standard queue format.
    """
    # Match blocks the model writes as: ## [NEW_TASK] task-id ... ## [/NEW_TASK]
    new_task_blocks = re.findall(
        r"## \[NEW_TASK\](.*?)## \[/NEW_TASK\]",
        synthesis_output, re.DOTALL
    )

    # Also match standard queue-format blocks embedded in the output
    # (## [PENDING] task-id ... up to next ## or end)
    queue_blocks = re.findall(
        r"(## \[PENDING\] \S+\n\*\*Priority:.*?(?=\n## |\Z))",
        synthesis_output, re.DOTALL
    )

    injected = []
    queue_content = open(QUEUE_FILE).read()

    for block in new_task_blocks + queue_blocks:
        block = block.strip()
        if not block:
            continue
        # Normalise NEW_TASK wrapper → PENDING format
        block = re.sub(r"^\[NEW_TASK\]\s*", "## [PENDING] ", block)
        if not block.startswith("## [PENDING]"):
            block = "## [PENDING] " + block

        # Extract task id to check for duplicates — use exact line match
        m = re.search(r"## \[PENDING\]\s+(\S+)", block)
        if not m:
            continue
        task_id = m.group(1)
        # Check for exact task id in queue (avoid substring matches)
        if re.search(rf"## \[(?:PENDING|DONE|IN_PROGRESS)\]\s+{re.escape(task_id)}\b", queue_content):
            print(f"  [synthesis] Task {task_id} already in queue — skipping")
            continue

        queue_content += f"\n\n---\n\n{block}"
        injected.append(task_id)
        print(f"  [synthesis] New task queued: {task_id}")

    if injected:
        open(QUEUE_FILE, "w").write(queue_content)
        print(f"  [synthesis] {len(injected)} new task(s) added to queue: {', '.join(injected)}")


def main():
    parser = argparse.ArgumentParser(description="Research crawler using Gemini Flash")
    parser.add_argument("--task",    help="Run specific task by id")
    parser.add_argument("--all",     action="store_true", help="Run all PENDING tasks")
    parser.add_argument("--dry-run", action="store_true", help="Don't fetch or call API")
    parser.add_argument("--list",    action="store_true", help="List all tasks and status")
    args = parser.parse_args()

    env = load_env()
    api_key = env.get("GEMINI_API_KEY")
    if not api_key and not args.dry_run and not args.list:
        print("ERROR: GEMINI_API_KEY not found in ~/.openclaw/.env")
        sys.exit(1)

    queue_text = open(QUEUE_FILE).read()
    tasks = parse_tasks(queue_text)

    if args.list:
        print(f"\n{'ID':<40} {'STATUS':<15} {'PRIORITY'}")
        print("-" * 65)
        for t in tasks:
            print(f"{t['id']:<40} {t['status']:<15} {t['priority']}")
        return

    if args.task:
        tasks = [t for t in tasks if t["id"] == args.task]
        if not tasks:
            print(f"Task not found: {args.task}")
            sys.exit(1)
    elif args.all:
        tasks = [t for t in tasks if t["status"] == "PENDING"]
    else:
        # Pick next PENDING task — HIGH > MEDIUM > LOW > SYNTHESIS last
        pending = [t for t in tasks if t["status"] == "PENDING"]
        priority_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2, "SYNTHESIS": 9}
        pending.sort(key=lambda t: priority_order.get(t["priority"], 5))
        tasks = pending[:1]

    if not tasks:
        print("No PENDING tasks found.")
        return

    for task in tasks:
        run_task(task, api_key, dry_run=args.dry_run)

    # Update heartbeat timestamp
    try:
        if os.path.exists(HEARTBEAT_STATE):
            state = json.load(open(HEARTBEAT_STATE))
            state.setdefault("lastChecks", {})["lastResearchCrawl"] = int(time.time())
            json.dump(state, open(HEARTBEAT_STATE, "w"), indent=2)
    except Exception as e:
        print(f"  [warn] Could not update heartbeat-state.json: {e}")

    completed = [t["id"] for t in tasks]
    print(f"\nDone. {len(tasks)} task(s) completed: {', '.join(completed)}")

    # Notify Phill via Telegram
    for task_id in completed:
        findings_path = f"research/findings/{task_id}.md"
        send_telegram(f"🔬 Research done: {task_id} → {findings_path}")


if __name__ == "__main__":
    main()
