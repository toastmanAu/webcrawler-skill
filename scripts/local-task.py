#!/usr/bin/env python3
"""
local-task.py — Route tasks to local Ollama inference machines
Instead of burning Claude tokens, offload eligible tasks to LAN hardware.

Usage:
  python3 local-task.py --task "summarise this file" --file foo.py
  python3 local-task.py --task "review this code for bugs" --stdin < foo.py
  python3 local-task.py --task "write a README for this" --file foo.js --machine drivethree
  python3 local-task.py --probe           # test all machines, show availability
  cat file.txt | python3 local-task.py --task "summarise this"

Machines (auto-selected by complexity if --machine not given):
  nucbox      192.168.68.79:11434   qwen2.5:14b  (primary workhorse, always on)
  drivethree  192.168.68.88:11434   qwen2.5:14b  (GPU-accelerated, faster, on-demand)
  opi5        192.168.68.100:11434  qwen2.5:3b   (always on, simple tasks only)

Task tiers (auto-detected from --tier or keywords in --task):
  simple   → opi5 first, nucbox fallback   (summarise, list, classify, format, rename)
  medium   → nucbox first, drivethree fall  (review, explain, document, analyse, translate)
  heavy    → drivethree first, nucbox fall  (refactor, design, debug complex, generate large)
"""

import sys, os, json, argparse, urllib.request, urllib.error, time

MACHINES = {
    'nucbox':     {'host': '192.168.68.79', 'port': 11434, 'model': 'qwen2.5:14b',    'tier': 'medium'},
    'drivethree': {'host': '192.168.68.88', 'port': 11434, 'model': 'qwen2.5:14b',    'tier': 'heavy'},
    'opi5':       {'host': '192.168.68.100','port': 11434, 'model': 'qwen2.5:3b',     'tier': 'simple'},
}

TIER_ORDER = {
    'simple': ['opi5', 'nucbox', 'drivethree'],
    'medium': ['nucbox', 'drivethree', 'opi5'],
    'heavy':  ['drivethree', 'nucbox'],
}

SIMPLE_KEYWORDS  = ['summarise','summarize','list','classify','format','rename','label','count','extract','short']
HEAVY_KEYWORDS   = ['refactor','redesign','architect','rewrite','debug','implement','generate','create','build']

def detect_tier(task: str) -> str:
    t = task.lower()
    if any(k in t for k in HEAVY_KEYWORDS):  return 'heavy'
    if any(k in t for k in SIMPLE_KEYWORDS): return 'simple'
    return 'medium'

def probe_machine(name: str, m: dict, timeout=3) -> dict:
    url = f"http://{m['host']}:{m['port']}/api/tags"
    try:
        start = time.time()
        with urllib.request.urlopen(url, timeout=timeout) as r:
            data = json.loads(r.read())
        ms = int((time.time() - start) * 1000)
        models = [x['name'] for x in data.get('models', [])]
        return {'ok': True, 'models': models, 'ms': ms}
    except Exception as e:
        return {'ok': False, 'error': str(e)}

def call_ollama(host: str, port: int, model: str, prompt: str, timeout=120) -> str:
    url = f"http://{host}:{port}/api/generate"
    body = json.dumps({'model': model, 'prompt': prompt, 'stream': False}).encode()
    req = urllib.request.Request(url, data=body,
        headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        data = json.loads(r.read())
    return data.get('response', '').strip()

def run_on_machine(name: str, m: dict, prompt: str) -> tuple[bool, str]:
    try:
        result = call_ollama(m['host'], m['port'], m['model'], prompt)
        return True, result
    except urllib.error.URLError as e:
        return False, f"unreachable: {e.reason}"
    except Exception as e:
        return False, str(e)

def main():
    parser = argparse.ArgumentParser(description='Route tasks to local Ollama machines')
    parser.add_argument('--task',    help='Task description / instruction for the model')
    parser.add_argument('--file',    help='File to include as context')
    parser.add_argument('--stdin',   action='store_true', help='Read context from stdin')
    parser.add_argument('--machine', choices=list(MACHINES.keys()), help='Force specific machine')
    parser.add_argument('--tier',    choices=['simple','medium','heavy'], help='Force task tier')
    parser.add_argument('--model',   help='Override model name')
    parser.add_argument('--probe',   action='store_true', help='Probe all machines and exit')
    parser.add_argument('--json',    action='store_true', help='Output JSON result')
    parser.add_argument('--timeout', type=int, default=120, help='Ollama timeout seconds')
    args = parser.parse_args()

    # ── Probe mode ──────────────────────────────────────────────────────────────
    if args.probe:
        print("Probing local inference machines...\n")
        for name, m in MACHINES.items():
            result = probe_machine(name, m)
            if result['ok']:
                models_str = ', '.join(result['models'][:3])
                print(f"  ✅ {name:12} {m['host']}:{m['port']}  {result['ms']}ms  [{models_str}]")
            else:
                print(f"  ❌ {name:12} {m['host']}:{m['port']}  OFFLINE  ({result['error']})")
        return

    if not args.task:
        parser.print_help()
        sys.exit(1)

    # ── Build prompt ────────────────────────────────────────────────────────────
    context = ''
    if args.file:
        try:
            context = open(args.file).read()
        except Exception as e:
            print(f"Error reading file: {e}", file=sys.stderr)
            sys.exit(1)
    elif args.stdin or not sys.stdin.isatty():
        context = sys.stdin.read()

    prompt = args.task
    if context:
        prompt = f"{args.task}\n\n---\n{context}\n---"

    # ── Select tier + machine order ─────────────────────────────────────────────
    tier = args.tier or detect_tier(args.task)
    order = [args.machine] if args.machine else TIER_ORDER[tier]

    if not args.json:
        print(f"[local-task] tier={tier}  trying: {' → '.join(order)}", file=sys.stderr)

    # ── Try machines in order ───────────────────────────────────────────────────
    for name in order:
        m = MACHINES[name].copy()
        if args.model:
            m['model'] = args.model
        if not args.json:
            print(f"[local-task] → {name} ({m['host']}) model={m['model']}", file=sys.stderr)
        ok, result = run_on_machine(name, m, prompt)
        if ok:
            if args.json:
                print(json.dumps({'ok': True, 'machine': name, 'model': m['model'], 'result': result}))
            else:
                print(result)
            return
        else:
            print(f"[local-task] ✗ {name}: {result}", file=sys.stderr)

    # All failed
    if args.json:
        print(json.dumps({'ok': False, 'error': 'All machines unreachable'}))
    else:
        print("ERROR: All local inference machines unreachable", file=sys.stderr)
    sys.exit(1)

if __name__ == '__main__':
    main()
