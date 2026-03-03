#!/usr/bin/env python3
"""
update-test-results.py — runs host test suites, writes JSON for tests.html
"""
import subprocess, json, re, os, datetime, sys

SITE = os.path.expanduser("~/workspace/wyltek-industries-site")
TESTS_DIR = os.path.join(SITE, "tests")
os.makedirs(TESTS_DIR, exist_ok=True)

REPOS = {
    "ckb-esp32": {
        "path": os.path.expanduser("~/workspace/CKB-ESP32"),
        "cmd": ["bash", "test/run_tests.sh"],
        "out": os.path.join(TESTS_DIR, "ckb-esp32.json"),
    },
    "ckb-light-esp": {
        "path": os.path.expanduser("~/workspace/ckb-light-esp"),
        "cmd": ["bash", "test/run_tests.sh"],
        "out": os.path.join(TESTS_DIR, "ckb-light-esp.json"),
    },
}

def strip_ansi(s):
    return re.sub(r'\x1b\[[0-9;]*[A-Za-z]', '', s)

def get_commit(path):
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "--short", "HEAD"], cwd=path, text=True
        ).strip()
    except:
        return "unknown"

def parse_ckbesp32(lines):
    """Parse CKB-ESP32 format: box-drawing table + PASS:/FAIL: lines."""
    suites = {}
    order = []

    # Parse box-drawing table: │ name  │  pass  │  fail  │  time │
    for line in lines:
        # Match: │ blake2b   │  12  │  0  │  1 │   (skip TOTAL row)
        m = re.match(r'\s*[│|]\s*([\w_-]+)\s*[│|]\s*(\d+)\s*[│|]\s*(\d+)\s*[│|]\s*(\d+)\s*[│|]', line)
        if m and m.group(1).upper() != 'TOTAL' and m.group(1) not in ('Suite', 'suite'):
            name = m.group(1).strip()
            if name not in suites:
                suites[name] = {"name": name, "pass": int(m.group(2)), "fail": int(m.group(3)), "time": m.group(4)+"s", "tests": []}
                order.append(name)

    # Collect PASS:/FAIL: lines — attribute to suite based on context
    # CKB-ESP32 report groups them under suite headers in --md output
    # but plain output has them sequenced after suite runs
    # We'll just collect all and assign to suite by sequence
    current = None
    suite_idx = 0
    for line in lines:
        line = line.strip()
        # Suite transition: checkmark or cross line
        for name in order:
            if re.search(rf'\b{re.escape(name)}\b', line) and ('tests' in line or 'passed' in line or 'failed' in line):
                current = suites.get(name)
                break
        if current and re.match(r'(PASS|FAIL):', line):
            current["tests"].append(line)

    return list(suites[k] for k in order)

def parse_ckblightesp(lines):
    """Parse ckb-light-esp format: ASCII box table + per-suite case lists."""
    suites = {}
    order = []

    # Table format: │  name  │  pass  │  fail  │  time  │  status  │
    for line in lines:
        m = re.match(r'\s*[│|]\s*([\w_-]+)\s*[│|]\s*(\d+)\s*[│|]\s*(\d+)\s*[│|]\s*(\d+\w*)\s*[│|]', line)
        if m:
            name = m.group(1).strip()
            if name.upper() in ('TOTAL', 'SUITE', 'SUITES'):
                continue
            if name not in suites:
                suites[name] = {"name": name, "pass": int(m.group(2)), "fail": int(m.group(3)), "time": m.group(4), "tests": []}
                order.append(name)

    # Per-suite detail: "  name    N cases"  then case lines "    · case name"
    current = None
    for line in lines:
        stripped = line.strip()
        # Suite header in details section: "  blake2b      12 cases"
        for name in order:
            if re.match(rf'\s*{re.escape(name)}\s+\d+\s+cases?', line):
                current = suites[name]
                break
        # Case lines: "    · some test name" or "    ✓ some test" or "    ✗ some test"
        if current:
            m = re.match(r'\s*[·•✓✗\-]\s+(.+)', stripped)
            if m:
                text = m.group(1).strip()
                # Don't include sub-headers as test cases
                if text and not text.endswith(':') and len(text) > 2:
                    prefix = "PASS: " if "✗" not in stripped else "FAIL: "
                    current["tests"].append(prefix + text)

    return list(suites[k] for k in order)

def run_repo(key, cfg):
    print(f"[tests] Running {key}...")
    commit = get_commit(cfg["path"])
    try:
        result = subprocess.run(
            cfg["cmd"], cwd=cfg["path"],
            capture_output=True, text=True, timeout=300
        )
        raw = result.stdout + result.stderr
    except subprocess.TimeoutExpired:
        print(f"[tests] TIMEOUT: {key}")
        raw = ""

    lines = [strip_ansi(l) for l in raw.splitlines()]

    if key == "ckb-esp32":
        suites = parse_ckbesp32(lines)
    else:
        suites = parse_ckblightesp(lines)

    total_pass = sum(s["pass"] for s in suites)
    total_fail = sum(s["fail"] for s in suites)

    # Extract metadata from output
    compiler = "g++"
    platform = "aarch64 Linux (Pi 5)"
    total_time = "—"
    for line in lines:
        m = re.search(r'g\+\+[^0-9]*(\d+\.\d+\.\d+)', line)
        if m:
            compiler = f"g++ {m.group(1)}"
        # Total time line
        m2 = re.search(r'Total time[^\d]*(\d+\w+)', line, re.I)
        if m2:
            total_time = m2.group(1)
        # TOTAL row time
        m3 = re.match(r'\s*[│|]\s*TOTAL\s*[│|][^│|]*[│|][^│|]*[│|]\s*(\d+\w*)\s*[│|]', line)
        if m3:
            total_time = m3.group(1)

    data = {
        "date": datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
        "commit": commit,
        "platform": platform,
        "compiler": compiler,
        "total_pass": total_pass,
        "total_fail": total_fail,
        "total_time": total_time,
        "suites": suites,
    }

    with open(cfg["out"], "w") as f:
        json.dump(data, f, indent=2)

    status = "✅ ALL PASS" if total_fail == 0 else f"❌ {total_fail} FAILING"
    print(f"[tests] {key}: {total_pass} pass, {total_fail} fail — {status}")
    return total_fail == 0

def main():
    all_ok = True
    for key, cfg in REPOS.items():
        ok = run_repo(key, cfg)
        if not ok:
            all_ok = False

    # Commit and push if JSON changed
    os.chdir(SITE)
    diff = subprocess.run(["git", "diff", "--quiet", "tests/"], capture_output=True)
    untracked = subprocess.run(
        ["git", "ls-files", "--others", "--exclude-standard", "tests/"],
        capture_output=True, text=True
    )
    if diff.returncode != 0 or untracked.stdout.strip():
        subprocess.run(["git", "add", "tests/"])
        subprocess.run(["git", "commit", "-m", f"tests: update results [{datetime.date.today()}]"])
        subprocess.run(["git", "push"])
        print("[tests] Pushed to GitHub")
    else:
        print("[tests] No changes, skipping commit")

    sys.exit(0 if all_ok else 1)

if __name__ == "__main__":
    main()
