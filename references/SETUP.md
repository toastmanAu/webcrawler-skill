# webcrawler Skill — Setup Guide

A combined JS-docs fetcher + AI research crawler for OpenClaw agents.

---

## What's included

| Script | Purpose |
|--------|---------|
| `scripts/jsdocs-fetch.js` | Fetch JS-rendered docs sites (Playwright) |
| `scripts/research-crawl.py` | AI-powered research task runner (Gemini) |

---

## Prerequisites

### Node.js (v18+)
```bash
node --version   # must be 18+
```

### Python (3.10+)
```bash
python3 --version
```

### Playwright Chromium browser
```bash
npx playwright install chromium
# installs ~120MB headless Chrome — only needed once
```

### Gemini API key (free tier works)
1. Go to https://aistudio.google.com/apikey
2. Click **Create API Key**
3. Copy the key (starts with `AIza...`)

---

## Configuration

Create a `.env` file in your workspace directory (e.g. `~/.openclaw/workspace/.env`):

```env
# ── Model provider (choose one) ──────────────────────────────────────────────

# Option A: Google Gemini (default, free tier = 1500 req/day)
MODEL_PROVIDER=gemini
GEMINI_API_KEY=AIzaSy...your_key_here
MODEL=gemini-2.5-flash

# Option B: Local Ollama (no API key, fully private)
# MODEL_PROVIDER=ollama
# OLLAMA_BASE_URL=http://localhost:11434   # or remote: http://192.168.1.x:11434
# MODEL=qwen2.5:14b

# Option C: OpenAI or any OpenAI-compatible API (OpenRouter, LM Studio, etc.)
# MODEL_PROVIDER=openai
# OPENAI_API_KEY=sk-...
# OPENAI_BASE_URL=https://api.openai.com/v1        # OpenAI
# OPENAI_BASE_URL=https://openrouter.ai/api/v1     # OpenRouter
# OPENAI_BASE_URL=http://localhost:1234/v1          # LM Studio
# MODEL=gpt-4o-mini

# ── Paths (optional, defaults shown) ─────────────────────────────────────────
# WORKSPACE_DIR=~/.openclaw/workspace
# QUEUE_FILE=~/.openclaw/workspace/research/queue.md
# FINDINGS_DIR=~/.openclaw/workspace/research/findings
# CLAIMS_DIR=~/.openclaw/workspace/research/claims
# MEMORY_FILE=~/.openclaw/workspace/MEMORY.md
# STACK_FILE=~/.openclaw/workspace/STACK.md

# ── Notifications (optional) ─────────────────────────────────────────────────
# Shell command to run on task completion. {msg} is replaced with status text.
# NOTIFY_CMD=curl -s "https://api.telegram.org/bot{TOKEN}/sendMessage?chat_id={ID}&text={msg}"
```

---

## Running jsdocs-fetch.js

Fetch a single JS-rendered documentation page:
```bash
node scripts/jsdocs-fetch.js https://docs.fiber.world/docs/guide/biscuit-auth \
  --out ./refs/fiber-docs
```

Crawl an entire docs site:
```bash
node scripts/jsdocs-fetch.js https://docs.fiber.world/docs \
  --sitemap \
  --out ./refs/fiber-docs
```

Options:
```
--out <dir>        Output directory (default: ./jsdocs-output)
--selector <css>   CSS selector for content (default: article)
--sitemap          Follow all internal links and crawl full site
--delay <ms>       Delay between pages (default: 800ms)
--timeout <ms>     Page load timeout (default: 15000ms)
--no-playwright    Static HTML only, no browser rendering
```

Output: one `.md` file per page + `INDEX.md` summary.

---

## Running research-crawl.py

### Create your queue file

First, create `research/queue.md` with tasks. See `references/QUEUE_FORMAT.md` for the format.

### Run the next pending task
```bash
python3 scripts/research-crawl.py
```

### Run a specific task
```bash
python3 scripts/research-crawl.py --task my-task-id
```

### Run all pending tasks
```bash
python3 scripts/research-crawl.py --all
```

### Filter by tag/prefix
```bash
python3 scripts/research-crawl.py --filter fiber
```

### Dry run (no API calls)
```bash
python3 scripts/research-crawl.py --dry-run
```

### List pending tasks
```bash
python3 scripts/research-crawl.py --list
```

Output: findings saved to `research/findings/<task-id>.md`

---

## How JS auto-detection works

`research-crawl.py` automatically detects JS-rendered pages:
1. Fetches URL with a plain HTTP GET + strips HTML tags
2. If the result is <300 chars but the raw HTML was >5KB → JS-rendered app detected
3. Automatically calls `jsdocs-fetch.js` via subprocess to render with Playwright
4. Uses the Playwright-rendered content for Gemini analysis

This means dead seeds from React/Next.js/Docusaurus docs sites are automatically handled.

---

## Common issues

### `GEMINI_API_KEY not set`
Add it to your `.env` file or export it: `export GEMINI_API_KEY=your_key`

### `Playwright not installed`
Run: `npx playwright install chromium`

### `Task already claimed`
Another crawler instance is running this task. Claim files are in `research/claims/`.
Stale claims (>2 hours old) are automatically cleared.

### `Queue file not found`
Create `research/queue.md` — see `references/QUEUE_FORMAT.md` for format.

### jsdocs-fetch returns empty pages
Try a different selector: `--selector main` or `--selector ".content"`

---

## Running on a schedule (cron)

```cron
# Run research crawler every 15 minutes
*/15 * * * * cd ~/.openclaw/workspace && GEMINI_API_KEY=your_key python3 skills/webcrawler/scripts/research-crawl.py >> /tmp/research-crawl.log 2>&1
```

---

## Cost estimate

- `jsdocs-fetch.js`: **$0** — runs locally
- `research-crawl.py`: **~$0.01–0.05 per task** (Gemini 2.5 Flash free tier: 1500 req/day)
- Free tier is sufficient for typical usage (5–20 tasks/day)
