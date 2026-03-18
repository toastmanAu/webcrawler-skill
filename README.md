# webcrawler — OpenClaw Skill

An AI-powered research toolkit combining JS-rendered docs fetching with Gemini-based research crawling.

## Tools included

| Script | Purpose |
|--------|---------|
| `scripts/jsdocs-fetch.js` | Fetch JS-rendered docs (Playwright auto-detect) |
| `scripts/research-crawl.py` | AI research crawler with Gemini analysis |

## Quick install (OpenClaw)

```bash
clawhub install webcrawler
```

Or manually:
```bash
git clone https://github.com/toastmanAu/webcrawler-skill
# copy scripts/jsdocs-fetch.js and scripts/research-crawl.py to your workspace
```

## Setup

See [references/SETUP.md](references/SETUP.md) for full setup instructions.

**TL;DR:**
```bash
# 1. Install Playwright browser (one time)
npx playwright install chromium

# 2. Get a free Gemini API key
# https://aistudio.google.com/apikey

# 3. Create .env in your workspace
echo "GEMINI_API_KEY=your_key_here" >> ~/.openclaw/workspace/.env

# 4. Run
node scripts/jsdocs-fetch.js https://docs.example.com --out ./refs/example
python3 scripts/research-crawl.py
```

## Features

- **Auto JS detection** — tries static fetch first, falls back to Playwright automatically
- **No hardcoded secrets** — all config via env vars or `.env` file
- **Claim locking** — multiple crawlers can run in parallel without duplicate work
- **SYNTHESIS tasks** — reads completed findings and generates gap analysis
- **Auto-queue** — new research tasks extracted from findings and added to queue automatically

## Queue format

See [references/QUEUE_FORMAT.md](references/QUEUE_FORMAT.md).

## Cost

- `jsdocs-fetch.js`: **free** (runs locally)
- `research-crawl.py`: **~$0.01–0.05 per task** (Gemini 2.5 Flash free tier: 1500 req/day)

## License

MIT
