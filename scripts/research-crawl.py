#!/usr/bin/env python3
"""
research-crawl.py — Idle research crawler using Gemini Flash
Picks the next PENDING task from research/queue.md, crawls seed URLs,
writes structured findings to research/findings/<id>.md

Usage: python3 research-crawl.py [--task <id>] [--all]
Cost: ~$0.01-0.05 per task at Gemini Flash rates
"""

import os, sys, re, json, time, argparse
import urllib.request, urllib.error

WORKSPACE = os.path.expanduser("~/.openclaw/workspace")
QUEUE_FILE = os.path.join(WORKSPACE, "research/queue.md")
FINDINGS_DIR = os.path.join(WORKSPACE, "research/findings")
ENV_FILE = os.path.expanduser("~/.openclaw/.env")

GEMINI_MODEL = "gemini-2.5-flash"
GEMINI_API = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"

MAX_URL_CHARS = 40000   # truncate fetched content to keep costs sane
MAX_URLS_PER_TASK = 6   # don't fetch more than this per task


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
    """Fetch a URL and return truncated text content."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (research-crawl/1.0)"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            raw = resp.read(max_chars * 2).decode("utf-8", errors="replace")
            # Strip HTML tags roughly
            raw = re.sub(r"<script[^>]*>.*?</script>", "", raw, flags=re.DOTALL)
            raw = re.sub(r"<style[^>]*>.*?</style>", "", raw, flags=re.DOTALL)
            raw = re.sub(r"<[^>]+>", " ", raw)
            raw = re.sub(r"\s+", " ", raw).strip()
            return raw[:max_chars]
    except Exception as e:
        return f"[FETCH ERROR: {e}]"


def gemini_query(api_key, prompt):
    """Send a prompt to Gemini Flash and return the response text."""
    url = GEMINI_API.format(model=GEMINI_MODEL, key=api_key)
    payload = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 8192,
        }
    }).encode()
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.load(resp)
        return data["candidates"][0]["content"]["parts"][0]["text"]


def parse_tasks(queue_text):
    """Parse tasks from queue.md — returns list of dicts."""
    tasks = []
    # Match task blocks
    blocks = re.split(r"\n---\n", queue_text)
    for block in blocks:
        m = re.search(r"\[(\w+)\]\s+(\S+)", block)
        if not m:
            continue
        status, task_id = m.group(1), m.group(2)
        priority = re.search(r"\*\*Priority:\*\*\s*(\w+)", block)
        output = re.search(r"\*\*Output:\*\*\s*(\S+)", block)
        goal = re.search(r"\*\*Goal:\*\*\s*(.+?)(?=\n\*\*|\Z)", block, re.DOTALL)
        seeds = re.findall(r"- (https?://\S+)", block)
        questions_block = re.search(r"\*\*Questions to answer:\*\*\n(.*?)(?=\n---|\Z)", block, re.DOTALL)
        questions = []
        if questions_block:
            questions = re.findall(r"\d+\.\s+(.+)", questions_block.group(1))
        tasks.append({
            "id": task_id,
            "status": status,
            "priority": priority.group(1) if priority else "MEDIUM",
            "output": output.group(1) if output else f"findings/{task_id}.md",
            "goal": goal.group(1).strip() if goal else "",
            "seeds": seeds[:MAX_URLS_PER_TASK],
            "questions": questions,
        })
    return tasks


def mark_in_progress(task_id):
    with open(QUEUE_FILE) as f:
        content = f.read()
    content = content.replace(f"[PENDING] {task_id}", f"[IN_PROGRESS] {task_id}", 1)
    with open(QUEUE_FILE, "w") as f:
        f.write(content)


def mark_done(task_id):
    with open(QUEUE_FILE) as f:
        content = f.read()
    content = content.replace(f"[IN_PROGRESS] {task_id}", f"[DONE] {task_id}", 1)
    with open(QUEUE_FILE, "w") as f:
        f.write(content)


def run_task(task, api_key, dry_run=False):
    print(f"\n{'='*60}")
    print(f"Task: {task['id']} [{task['priority']}]")
    print(f"Seeds: {len(task['seeds'])} URLs")

    mark_in_progress(task["id"])

    # Step 1: Fetch all seed URLs
    fetched = {}
    for url in task["seeds"]:
        print(f"  Fetching: {url}")
        if not dry_run:
            fetched[url] = fetch_url(url)
            time.sleep(1)  # polite crawl delay
        else:
            fetched[url] = "[DRY RUN - not fetched]"

    # Step 2: Build prompt
    questions_text = "\n".join(f"{i+1}. {q}" for i, q in enumerate(task["questions"]))
    fetched_text = "\n\n".join(
        f"=== {url} ===\n{content[:8000]}"
        for url, content in fetched.items()
    )

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

    # Step 3: Query Gemini
    print(f"  Querying Gemini {GEMINI_MODEL}...")
    if dry_run:
        result = "[DRY RUN - Gemini not called]"
    else:
        result = gemini_query(api_key, prompt)

    # Step 4: Write findings
    output_path = os.path.join(WORKSPACE, "research", task["output"])
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    header = f"# Research: {task['id']}\n\n**Date:** {time.strftime('%Y-%m-%d')}  \n**Status:** AUTO-CRAWLED (Gemini {GEMINI_MODEL})  \n**Seeds:** {', '.join(task['seeds'])}\n\n---\n\n"

    with open(output_path, "w") as f:
        f.write(header + result)

    print(f"  Written: {output_path}")
    mark_done(task["id"])
    return output_path


def main():
    parser = argparse.ArgumentParser(description="Research crawler using Gemini Flash")
    parser.add_argument("--task", help="Run specific task by id")
    parser.add_argument("--all", action="store_true", help="Run all PENDING tasks")
    parser.add_argument("--dry-run", action="store_true", help="Don't fetch or call API")
    parser.add_argument("--list", action="store_true", help="List all tasks and status")
    args = parser.parse_args()

    env = load_env()
    api_key = env.get("GEMINI_API_KEY")
    if not api_key and not args.dry_run and not args.list:
        print("ERROR: GEMINI_API_KEY not found in ~/.openclaw/.env")
        sys.exit(1)

    with open(QUEUE_FILE) as f:
        queue_text = f.read()

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
        # Default: run next single PENDING task (priority: HIGH first)
        pending = [t for t in tasks if t["status"] == "PENDING"]
        priority_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
        pending.sort(key=lambda t: priority_order.get(t["priority"], 9))
        tasks = pending[:1]

    if not tasks:
        print("No PENDING tasks found.")
        return

    for task in tasks:
        run_task(task, api_key, dry_run=args.dry_run)

    print(f"\nDone. {len(tasks)} task(s) completed.")


if __name__ == "__main__":
    main()
