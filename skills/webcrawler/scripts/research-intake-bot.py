#!/usr/bin/env python3
"""
research-intake-bot.py — Interactive Telegram bot flow for submitting research tasks.

This script is called by the OpenClaw agent when the user triggers /research.
It conducts a guided Q&A session, assembles a valid task block, validates it
via queue-intake.py logic, and drops the file into research/intake/.

Usage (called by agent, not directly):
    python3 research-intake-bot.py --session <session-file> --input "<user message>"

Session file is a JSON file in /tmp/ tracking conversation state between turns.

State machine:
    START → TASK_ID → PRIORITY → GOAL → SEEDS → QUESTIONS → TAGS → CONFIRM → DONE

Each call processes one user message and returns:
    {
        "state": "<next state>",
        "reply": "<message to send to user>",
        "done": false,
        "task_id": "<id if DONE>"
    }
"""

import json
import sys
import re
import os
import argparse
from pathlib import Path
from datetime import datetime
from urllib.parse import urlparse

# ── Paths ────────────────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).parent
BASE_DIR = SCRIPT_DIR.parent.parent.parent.parent  # workspace root
INTAKE_DIR = BASE_DIR / "research" / "intake"
PROCESSED_DIR = INTAKE_DIR / "processed"
REJECTED_DIR = INTAKE_DIR / "rejected"
QUEUE_FILE = BASE_DIR / "research" / "queue.md"

VALID_PRIORITIES = {"HIGH", "MEDIUM", "LOW", "SYNTHESIS"}

PROMPTS = {
    "START": (
        "🔬 *New research task*\n\n"
        "I'll walk you through it step by step.\n\n"
        "First, give me a *task ID* — short, lowercase, hyphenated.\n"
        "Example: `fiber-payment-routing` or `ckb-vm-opcodes`"
    ),
    "PRIORITY": (
        "Priority?\n\n"
        "• HIGH — blocking a decision\n"
        "• MEDIUM — normal research\n"
        "• LOW — nice to have\n"
        "• SYNTHESIS — no URLs, reads completed findings instead"
    ),
    "GOAL": (
        "What's the *goal*? Write a sentence or two:\n"
        "— what to research\n"
        "— why it matters\n"
        "— what decision or build it informs"
    ),
    "SEEDS": (
        "Send me *seed URLs* one at a time. Type `done` when finished.\n\n"
        "⚠️ Raw URLs only — no GitHub blob/tree links:\n"
        "✅ `https://raw.githubusercontent.com/org/repo/main/README.md`\n"
        "✅ `https://api.github.com/repos/org/repo/releases/latest`\n"
        "❌ `https://github.com/org/repo/blob/main/file.md`"
    ),
    "SEEDS_SYNTHESIS": (
        "SYNTHESIS tasks don't need seed URLs — they read completed findings.\n\n"
        "Send me *questions to answer* (numbered list), or type `skip` for none.\n"
        "Example:\n1. What are the critical missing pieces?\n2. What should we build first?"
    ),
    "QUESTIONS": (
        "Send me *questions to answer* (numbered list), or type `skip` for none.\n"
        "Example:\n1. What is the exact API for X?\n2. What are the version constraints?\n3. Any known bugs?"
    ),
    "TAGS": (
        "Any *tags*? Comma-separated, or type `skip`.\n"
        "Example: `fiber, javascript, rpc`\n\n"
        "Tags are used for filtering: `research-crawl.py --filter fiber`"
    ),
}


# ── Validators ───────────────────────────────────────────────────────────────

def validate_task_id(val: str) -> tuple[bool, str]:
    val = val.strip().lower()
    if not re.match(r"^[a-z0-9][a-z0-9\-]+$", val):
        return False, "Task ID must be lowercase letters, numbers, and hyphens only. Try again:"
    if len(val) < 3:
        return False, "Task ID is too short. Try again:"
    return True, val


def validate_priority(val: str) -> tuple[bool, str]:
    v = val.strip().upper()
    if v not in VALID_PRIORITIES:
        return False, f"Must be HIGH, MEDIUM, LOW, or SYNTHESIS. Got: `{val}` — try again:"
    return True, v


def validate_url(url: str) -> tuple[bool, str]:
    url = url.strip()
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return False, f"Not a valid URL (must start with http/https): `{url}`"
        if "github.com" in url and ("/blob/" in url or "/tree/" in url):
            raw = url.replace("github.com", "raw.githubusercontent.com")
            raw = re.sub(r"/blob/", "/", raw)
            raw = re.sub(r"/tree/", "/", raw)
            return False, (
                f"GitHub blob/tree URLs return HTML, not raw content.\n"
                f"Try the raw URL instead:\n`{raw}`"
            )
        return True, url
    except Exception:
        return False, f"Could not parse URL: `{url}`"


# ── Assemble task block ───────────────────────────────────────────────────────

def assemble_task(session: dict) -> str:
    task_id = session["task_id"]
    priority = session["priority"]
    goal = session["goal"]
    seeds = session.get("seeds", [])
    questions = session.get("questions", [])
    tags = session.get("tags", "")
    output = f"findings/{task_id}.md"

    lines = [
        f"[PENDING] {task_id}",
        f"**Priority:** {priority}",
        f"**Output:** {output}",
    ]

    if tags:
        lines.append(f"**Tags:** {tags}")

    lines.append(f"**Goal:** {goal}")

    if seeds:
        lines.append("**Seeds:**")
        for url in seeds:
            lines.append(f"- {url}")

    if questions:
        lines.append("**Questions to answer:**")
        # Ensure numbered
        for i, q in enumerate(questions, 1):
            q = q.strip().lstrip("0123456789.-) ").strip()
            lines.append(f"{i}. {q}")

    return "\n".join(lines)


# ── Write to intake ───────────────────────────────────────────────────────────

def write_to_intake(task_id: str, content: str) -> Path:
    INTAKE_DIR.mkdir(parents=True, exist_ok=True)
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    REJECTED_DIR.mkdir(parents=True, exist_ok=True)

    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    filename = f"{task_id}-{ts}.md"
    filepath = INTAKE_DIR / filename
    filepath.write_text(content, encoding="utf-8")
    return filepath


# ── Check duplicate ───────────────────────────────────────────────────────────

def is_duplicate(task_id: str) -> bool:
    if not QUEUE_FILE.exists():
        return False
    content = QUEUE_FILE.read_text(encoding="utf-8")
    return (
        f"[PENDING] {task_id}" in content
        or f"[DONE] {task_id}" in content
        or f"[CLAIMED] {task_id}" in content
        or f"[IN_PROGRESS] {task_id}" in content
    )


# ── State machine ─────────────────────────────────────────────────────────────

def process(session: dict, user_input: str) -> dict:
    state = session.get("state", "START")
    user_input = user_input.strip()

    # ── START: initialise, send first prompt ──────────────────────────────────
    if state == "START":
        session["state"] = "TASK_ID"
        return {"state": "TASK_ID", "reply": PROMPTS["START"], "done": False}

    # ── TASK_ID ───────────────────────────────────────────────────────────────
    if state == "TASK_ID":
        ok, result = validate_task_id(user_input)
        if not ok:
            return {"state": "TASK_ID", "reply": result, "done": False}
        if is_duplicate(result):
            return {
                "state": "TASK_ID",
                "reply": f"⚠️ Task ID `{result}` already exists in the queue. Choose a different ID:",
                "done": False,
            }
        session["task_id"] = result
        session["state"] = "PRIORITY"
        return {"state": "PRIORITY", "reply": PROMPTS["PRIORITY"], "done": False}

    # ── PRIORITY ──────────────────────────────────────────────────────────────
    if state == "PRIORITY":
        ok, result = validate_priority(user_input)
        if not ok:
            return {"state": "PRIORITY", "reply": result, "done": False}
        session["priority"] = result
        session["state"] = "GOAL"
        return {"state": "GOAL", "reply": PROMPTS["GOAL"], "done": False}

    # ── GOAL ──────────────────────────────────────────────────────────────────
    if state == "GOAL":
        if len(user_input) < 10:
            return {"state": "GOAL", "reply": "Goal is too short — give me at least a sentence:", "done": False}
        session["goal"] = user_input
        # SYNTHESIS skips seeds
        if session.get("priority") == "SYNTHESIS":
            session["state"] = "QUESTIONS"
            return {"state": "QUESTIONS", "reply": PROMPTS["SEEDS_SYNTHESIS"], "done": False}
        session["seeds"] = []
        session["state"] = "SEEDS"
        return {"state": "SEEDS", "reply": PROMPTS["SEEDS"], "done": False}

    # ── SEEDS ─────────────────────────────────────────────────────────────────
    if state == "SEEDS":
        if user_input.lower() == "done":
            if not session.get("seeds"):
                return {"state": "SEEDS", "reply": "Need at least one seed URL. Add a URL or type `done` if this should be SYNTHESIS priority instead:", "done": False}
            session["state"] = "QUESTIONS"
            return {"state": "QUESTIONS", "reply": PROMPTS["QUESTIONS"], "done": False}
        ok, result = validate_url(user_input)
        if not ok:
            return {"state": "SEEDS", "reply": f"❌ {result}\n\nTry again, or type `done` to finish seeds:", "done": False}
        session.setdefault("seeds", []).append(result)
        count = len(session["seeds"])
        return {
            "state": "SEEDS",
            "reply": f"✅ Added ({count} so far). Next URL, or type `done` to continue:",
            "done": False,
        }

    # ── QUESTIONS ─────────────────────────────────────────────────────────────
    if state == "QUESTIONS":
        if user_input.lower() == "skip":
            session["questions"] = []
        else:
            # Split on newlines or numbered items
            lines = [l.strip() for l in re.split(r"\n+", user_input) if l.strip()]
            session["questions"] = lines
        session["state"] = "TAGS"
        return {"state": "TAGS", "reply": PROMPTS["TAGS"], "done": False}

    # ── TAGS ──────────────────────────────────────────────────────────────────
    if state == "TAGS":
        if user_input.lower() == "skip":
            session["tags"] = ""
        else:
            session["tags"] = user_input.strip()
        # Build preview
        task_block = assemble_task(session)
        session["assembled"] = task_block
        session["state"] = "CONFIRM"
        preview = f"📋 *Task preview:*\n\n```\n{task_block}\n```\n\nType `yes` to queue it, `no` to cancel, or `edit` to start over."
        return {"state": "CONFIRM", "reply": preview, "done": False}

    # ── CONFIRM ───────────────────────────────────────────────────────────────
    if state == "CONFIRM":
        v = user_input.lower()
        if v == "no":
            session["state"] = "DONE"
            return {"state": "DONE", "reply": "❌ Cancelled. Type /research to start a new task.", "done": True, "cancelled": True}
        if v == "edit":
            # Reset to start
            task_id = session.get("task_id", "")
            session.clear()
            session["state"] = "START"
            return {"state": "START", "reply": f"Starting over. Previous ID was `{task_id}`.\n\n" + PROMPTS["START"], "done": False}
        if v != "yes":
            return {"state": "CONFIRM", "reply": "Type `yes` to confirm, `no` to cancel, or `edit` to start over:", "done": False}

        # Write to intake
        task_block = session["assembled"]
        task_id = session["task_id"]
        filepath = write_to_intake(task_id, task_block)

        session["state"] = "DONE"
        return {
            "state": "DONE",
            "reply": (
                f"✅ Task `{task_id}` dropped into intake queue.\n\n"
                f"The formatter will validate and move it to the research queue automatically. "
                f"Results will appear in `research/findings/{task_id}.md` once crawled."
            ),
            "done": True,
            "task_id": task_id,
            "filepath": str(filepath),
        }

    return {"state": state, "reply": "Unknown state. Type /research to start over.", "done": True}


# ── CLI entrypoint ────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--session", required=True, help="Path to JSON session state file")
    parser.add_argument("--input", required=True, help="User's message text")
    args = parser.parse_args()

    session_path = Path(args.session)

    # Load or init session
    if session_path.exists():
        session = json.loads(session_path.read_text())
    else:
        session = {"state": "START"}

    # Process
    result = process(session, args.input)

    # Update state in session
    session["state"] = result["state"]

    # Save session (delete if done)
    if result.get("done"):
        if session_path.exists():
            session_path.unlink()
    else:
        session_path.write_text(json.dumps(session, indent=2))

    # Output result as JSON for the agent to read
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
