---
name: webcrawler
description: "AI-powered research crawler combining JS-rendered docs fetching (Playwright) with Gemini-based research task processing. Use when fetching documentation from JS-rendered sites (React/Next.js/Docusaurus) that web_fetch can't read, running research crawl tasks from a queue file with Gemini analysis, or saving docs sites as local markdown references. Includes auto-detection of JS-rendered pages, claim-based multi-worker locking, SYNTHESIS tasks, and automatic queuing of new tasks from findings. See references/SETUP.md for initial setup and references/QUEUE_FORMAT.md for queue file format."
---

# webcrawler

Two tools that work together: a JS-aware docs fetcher and an AI research crawler.

## jsdocs-fetch.js — Fetch JS-rendered docs

```bash
# Single page (auto-detects JS vs static)
node scripts/jsdocs-fetch.js <url> --out <output-dir>

# Full site crawl
node scripts/jsdocs-fetch.js <url> --sitemap --out <output-dir>

# Custom selector (default: article)
node scripts/jsdocs-fetch.js <url> --selector main --out <output-dir>
```

- Auto-detects JS-rendered pages (Playwright fallback when static text < 300 chars)
- No API keys needed
- Saves one `.md` per page + `INDEX.md`
- Save output to `research/references/<site-name>/` for reuse

## research-crawl.py — AI research crawler

```bash
python3 scripts/research-crawl.py              # run next PENDING task
python3 scripts/research-crawl.py --task <id>  # run specific task
python3 scripts/research-crawl.py --filter tag # filter by tag/prefix
python3 scripts/research-crawl.py --list       # list pending tasks
python3 scripts/research-crawl.py --dry-run    # test without API calls
```

Requires `GEMINI_API_KEY` in env or `.env` file. See `references/SETUP.md`.

## When to use which tool

| Situation | Use |
|-----------|-----|
| Save docs site for reference | `jsdocs-fetch.js --sitemap` |
| Run a research task from queue | `research-crawl.py` |
| web_fetch returns thin content | `jsdocs-fetch.js` on the URL |
| Batch research from a task list | `research-crawl.py --all` |

## Setup

First time: read `references/SETUP.md` for prerequisites and configuration.

## Queue format

See `references/QUEUE_FORMAT.md` for the task file format.
