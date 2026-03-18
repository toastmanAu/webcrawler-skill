#!/usr/bin/env python3
"""
sync-shannon-findings.py — Pull completed research findings from Shannon (OPi5+)
into this machine's research/findings/ folder.

Copies any .md files from Shannon's findings/ that don't already exist here.
New files get logged. Designed to run before backup.sh so they get pushed to GitHub.

Usage:
    python3 sync-shannon-findings.py           # sync now
    python3 sync-shannon-findings.py --dry-run # show what would be copied
"""

import os
import sys
import subprocess
import argparse
from pathlib import Path
from datetime import datetime

SHANNON_HOST = "phill@192.168.68.89"
SHANNON_FINDINGS = "~/.openclaw/workspace/research/findings/"
LOCAL_FINDINGS = Path(__file__).parent.parent / "research" / "findings"
LOG_FILE = Path("/tmp/shannon-sync.log")


def log(msg: str):
    ts = datetime.now().strftime("%H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    LOCAL_FINDINGS.mkdir(parents=True, exist_ok=True)

    log(f"Syncing findings from Shannon ({SHANNON_HOST})...")

    # Get list of files Shannon has
    result = subprocess.run(
        ["ssh", SHANNON_HOST, f"ls {SHANNON_FINDINGS}*.md 2>/dev/null || echo EMPTY"],
        capture_output=True, text=True, timeout=15
    )

    if result.returncode != 0 or "EMPTY" in result.stdout:
        log("Shannon findings folder empty or unreachable — skipping")
        return

    shannon_files = [Path(f.strip()).name for f in result.stdout.strip().splitlines() if f.strip().endswith(".md")]
    local_files = {f.name for f in LOCAL_FINDINGS.glob("*.md")}

    new_files = [f for f in shannon_files if f not in local_files]

    if not new_files:
        log(f"Nothing new — Shannon has {len(shannon_files)} findings, all already synced")
        return

    log(f"Found {len(new_files)} new finding(s) to pull:")
    for f in new_files:
        log(f"  + {f}")

    if args.dry_run:
        log("[dry-run] Would copy above files — no changes made")
        return

    # rsync just the new files
    for filename in new_files:
        src = f"{SHANNON_HOST}:{SHANNON_FINDINGS}{filename}"
        dst = str(LOCAL_FINDINGS / filename)
        r = subprocess.run(
            ["scp", "-q", src, dst],
            capture_output=True, text=True, timeout=30
        )
        if r.returncode == 0:
            log(f"  ✓ Copied: {filename}")
        else:
            log(f"  ✗ Failed: {filename} — {r.stderr.strip()}")

    log(f"Sync complete — pulled {len(new_files)} new finding(s)")


if __name__ == "__main__":
    main()
