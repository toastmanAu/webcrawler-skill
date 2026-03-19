#!/usr/bin/env python3
"""
queue-intake.py — Research task intake processor for Shannon's research queue.

Watches research/intake/ for new .md/.txt files, normalises formatting,
validates structure, and either appends to queue.md or moves to rejected/.

Usage:
    python3 queue-intake.py           # process all files in intake/
    python3 queue-intake.py --watch   # poll every 30s continuously
    python3 queue-intake.py --dry-run # show what would happen, no changes
"""

import os
import sys
import re
import shutil
import time
import argparse
from pathlib import Path
from datetime import datetime
from urllib.parse import urlparse

# ── Paths ────────────────────────────────────────────────────────────────────
# Script lives at skills/webcrawler/scripts/ — workspace root is 3 levels up
BASE_DIR = Path(__file__).parent.parent.parent.parent  # workspace root
INTAKE_DIR = BASE_DIR / "research" / "intake"
PROCESSED_DIR = INTAKE_DIR / "processed"
REJECTED_DIR = INTAKE_DIR / "rejected"
QUEUE_FILE = BASE_DIR / "research" / "queue.md"

# ── Required fields ──────────────────────────────────────────────────────────
REQUIRED_FIELDS = ["Priority", "Output", "Tags", "Goal", "Seeds", "Questions to answer"]
VALID_PRIORITIES = {"HIGH", "MEDIUM", "LOW"}


def log(msg: str):
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] {msg}")


# ── Normalise formatting ─────────────────────────────────────────────────────
def normalise(text: str) -> str:
    """Fix common formatting issues from GPT/chatbot output."""
    lines = text.splitlines()
    out = []
    in_seeds = False

    for line in lines:
        # Detect Seeds section
        if re.match(r"\*?\*?Seeds\*?\*?:", line.strip()):
            in_seeds = True
        elif re.match(r"\*?\*?Questions", line.strip()):
            in_seeds = False

        # Fix bullet characters → dashes (in seeds block)
        if in_seeds and re.match(r"^\s*[•·▸▹◦‣⁃]\s+", line):
            line = re.sub(r"^\s*[•·▸▹◦‣⁃]\s+", "- ", line)

        # Fix missing ** around field names (skip if already wrapped)
        for field in ["Priority", "Output", "Tags", "Goal", "Seeds", "Questions to answer"]:
            # Only fix lines that are "Field: value" WITHOUT ** already
            pattern = rf"^({re.escape(field)}):\s*(.*)"
            already_wrapped = re.match(rf"^\*\*{re.escape(field)}\*\*:", line.strip())
            if not already_wrapped and re.match(pattern, line.strip()):
                line = re.sub(pattern, rf"**\1:** \2", line.strip())
                break

        # Fix [PENDING] lines — ensure no extra whitespace
        if line.strip().startswith("[PENDING]"):
            line = line.strip()

        out.append(line)

    return "\n".join(out)


# ── Validate task block ───────────────────────────────────────────────────────
def validate(text: str) -> list[str]:
    """Return list of error strings, empty = valid."""
    errors = []

    # Must have [PENDING] id
    id_match = re.search(r"\[PENDING\]\s+(\S+)", text)
    if not id_match:
        errors.append("Missing [PENDING] <task-id> line")
    else:
        task_id = id_match.group(1)
        if not re.match(r"^[a-z0-9][a-z0-9\-]+$", task_id):
            errors.append(f"Task ID '{task_id}' must be lowercase letters, numbers, hyphens only")

    # Check required fields present — accept both **Field:** and **Field**:
    for field in REQUIRED_FIELDS:
        pattern1 = rf"\*\*{re.escape(field)}\*\*:"   # **Field**:
        pattern2 = rf"\*\*{re.escape(field)}:\*\*"   # **Field:**
        if not (re.search(pattern1, text) or re.search(pattern2, text)):
            errors.append(f"Missing field: **{field}:**")

    # Validate priority value
    priority_match = re.search(r"\*\*Priority[:\*]+\*?\s*(\w+)", text)
    if priority_match:
        p = priority_match.group(1).upper()
        if p not in VALID_PRIORITIES:
            errors.append(f"Invalid priority '{p}' — must be HIGH, MEDIUM, or LOW")

    # Check seeds are URLs
    seeds_match = re.search(r"\*\*Seeds[:\*]+\*?(.*?)(?=\*\*Questions|\Z)", text, re.DOTALL)
    if seeds_match:
        seed_block = seeds_match.group(1)
        seed_lines = [l.strip() for l in seed_block.splitlines() if l.strip().startswith("-")]
        if not seed_lines:
            errors.append("No seeds found — add at least one URL starting with -")
        for seed in seed_lines:
            url = seed.lstrip("- ").strip()
            try:
                parsed = urlparse(url)
                if parsed.scheme not in ("http", "https"):
                    errors.append(f"Seed not a valid URL: {url}")
                # Warn about GitHub blob/tree pages
                if "github.com" in url and ("/blob/" in url or "/tree/" in url):
                    errors.append(f"GitHub blob/tree URL won't return raw content: {url}\n  → Use: https://raw.githubusercontent.com/...")
            except Exception:
                errors.append(f"Could not parse seed URL: {url}")
    else:
        errors.append("Could not locate Seeds section")

    # Check Output path matches task ID
    if id_match:
        task_id = id_match.group(1)
        output_match = re.search(r"\*\*Output[:\*]+\*?\s*(.+)", text)
        if output_match:
            output_path = output_match.group(1).strip()
            if task_id not in output_path:
                errors.append(f"Output path '{output_path}' should contain task ID '{task_id}'")

    return errors


# ── Process a single file ────────────────────────────────────────────────────
def process_file(filepath: Path, dry_run: bool = False) -> bool:
    log(f"Processing: {filepath.name}")
    text = filepath.read_text(encoding="utf-8").strip()

    # Normalise formatting
    normalised = normalise(text)

    # Validate
    errors = validate(normalised)

    if errors:
        log(f"  ❌ REJECTED ({len(errors)} issue{'s' if len(errors)>1 else ''}):")
        for e in errors:
            log(f"     • {e}")

        # Write rejection report alongside the file
        reject_path = REJECTED_DIR / filepath.name
        report_path = REJECTED_DIR / (filepath.stem + ".rejection-report.txt")

        if not dry_run:
            shutil.copy(filepath, reject_path)
            report_path.write_text(
                f"# Rejection Report — {filepath.name}\n"
                f"Processed: {datetime.now().isoformat()}\n\n"
                f"## Issues ({len(errors)})\n"
                + "\n".join(f"- {e}" for e in errors)
                + "\n\n## Normalised content (fix and re-drop into intake/):\n\n"
                + normalised
            )
            filepath.unlink()
            log(f"  → Moved to rejected/ with report: {report_path.name}")
        else:
            log(f"  [dry-run] Would reject to {reject_path}")
        return False

    # Valid — append to queue.md
    task_id = re.search(r"\[PENDING\]\s+(\S+)", normalised).group(1)
    log(f"  ✅ Valid task: {task_id}")

    # Check for duplicate in queue
    if QUEUE_FILE.exists():
        existing = QUEUE_FILE.read_text(encoding="utf-8")
        if f"[PENDING] {task_id}" in existing or f"[DONE] {task_id}" in existing or f"[CLAIMED] {task_id}" in existing:
            log(f"  ⚠️  Task '{task_id}' already exists in queue.md — skipping duplicate")
            if not dry_run:
                shutil.move(filepath, PROCESSED_DIR / filepath.name)
            return False

    if not dry_run:
        # Append to queue.md with separator
        with open(QUEUE_FILE, "a", encoding="utf-8") as f:
            f.write(f"\n\n---\n\n{normalised}\n")

        # Move to processed
        shutil.move(str(filepath), PROCESSED_DIR / filepath.name)
        log(f"  → Appended to queue.md, moved to processed/")
    else:
        log(f"  [dry-run] Would append to queue.md and move to processed/")

    return True


# ── Main ─────────────────────────────────────────────────────────────────────
def run_once(dry_run: bool = False) -> int:
    files = list(INTAKE_DIR.glob("*.md")) + list(INTAKE_DIR.glob("*.txt"))
    if not files:
        return 0

    processed = 0
    for f in sorted(files):
        if process_file(f, dry_run=dry_run):
            processed += 1

    return processed


def main():
    parser = argparse.ArgumentParser(description="Research task intake processor")
    parser.add_argument("--watch", action="store_true", help="Poll intake/ every 30s")
    parser.add_argument("--dry-run", action="store_true", help="Show actions without making changes")
    parser.add_argument("--interval", type=int, default=30, help="Poll interval in seconds (default: 30)")
    args = parser.parse_args()

    # Ensure dirs exist
    for d in [INTAKE_DIR, PROCESSED_DIR, REJECTED_DIR]:
        d.mkdir(parents=True, exist_ok=True)

    if not QUEUE_FILE.exists():
        QUEUE_FILE.write_text("# Research Queue\n\n")

    if args.watch:
        log(f"Watching {INTAKE_DIR} every {args.interval}s (Ctrl+C to stop)")
        try:
            while True:
                n = run_once(dry_run=args.dry_run)
                if n:
                    log(f"Processed {n} file(s)")
                time.sleep(args.interval)
        except KeyboardInterrupt:
            log("Stopped.")
    else:
        n = run_once(dry_run=args.dry_run)
        log(f"Done — {n} task(s) queued")


if __name__ == "__main__":
    main()
