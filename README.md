# webcrawler — OpenClaw Skill

An AI-powered research toolkit combining JS-rendered docs fetching with Gemini-based research crawling.

## Tools included

| Script | Purpose |
|--------|---------|
| `scripts/jsdocs-fetch.js` | Fetch JS-rendered docs (Playwright auto-detect) |
| `scripts/research-crawl.py` | AI research crawler — Gemini, Ollama, or OpenAI-compatible |

## Quick install (OpenClaw)

```bash
clawhub install webcrawler
```

Or manually:
```bash
git clone https://github.com/toastmanAu/webcrawler-skill
```

## Setup

See [references/SETUP.md](references/SETUP.md) for full setup instructions.

**TL;DR (Gemini — free tier, 1500 req/day):**
```bash
npx playwright install chromium
echo "GEMINI_API_KEY=your_key_here" >> ~/.openclaw/workspace/.env
python3 scripts/research-crawl.py
```

**TL;DR (local Ollama — completely free, no API key):**
```bash
npx playwright install chromium
export MODEL_PROVIDER=ollama
export OLLAMA_BASE_URL=http://localhost:11434
export MODEL=granite4:3b
python3 scripts/research-crawl.py
```

## Model Providers

Switch between providers with a single env var:

```env
# Google Gemini (default) — free tier: 1500 req/day
MODEL_PROVIDER=gemini
GEMINI_API_KEY=AIza...

# Local Ollama — completely free, runs on your hardware
MODEL_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
MODEL=granite4:3b

# OpenAI-compatible (OpenRouter, LM Studio, etc.)
MODEL_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://openrouter.ai/api/v1
MODEL=anthropic/claude-3-haiku
```

## Ollama Model Benchmarks

Real-world benchmark: same Nervos CKB Fiber Network research task on 10 models, identical hardware (NucBox K8 Plus · AMD Ryzen 7 8845HS · 32GB RAM · CPU inference, no discrete GPU).

| Model | Params | Context | Time | Quality | Notes |
|-------|--------|---------|------|---------|-------|
| **granite4:3b** | 3B | 128K | **174s** | ⭐⭐⭐⭐⭐ | 🏆 Best for overnight batch crawling |
| phi4:latest | 14B | 16K | 287s | ⭐⭐⭐⭐⭐ | Solid all-rounder |
| deepseek-r1:14b | 14B | ~32K | 401s | ⭐⭐⭐⭐⭐ | Good reasoning |
| mistral-nemo:12b | 12B | **1,024K** | 453s | ⭐⭐⭐⭐⭐ | 🗃️ Best for synthesis (1M context at 6GB) |
| qwen2.5:14b | 14B | 32K | 605s | ⭐⭐⭐⭐⭐ | Reliable |
| **qwen3:30b** | 30B | **262K** | 625s | ⭐⭐⭐⭐⭐ | 🧠 Best output quality + 13.2 tok/s |
| mistral-small3.1:24b | 24B | 131K | ~15min | — | Works individually, slow sequentially |
| gemma3:27b | 27B | 131K | ~15min | — | Works individually, slow sequentially |

> All models scored 5/5 quality when they completed — every model correctly identified all research gaps, cited specific APIs, and produced structured markdown output. The benchmark measures **throughput**, not capability.

### Recommendations by use case

| Use Case | Model | Why |
|----------|-------|-----|
| Overnight crawl (many tasks) | `granite4:3b` | 3min/task, ~2GB RAM, 128K context |
| Single deep-dive | `qwen3:30b` | Most detailed output, surprisingly fast |
| Synthesis across many docs | `mistral-nemo:12b` | 1M token context fits entire research corpus |
| Balanced quality/speed | `phi4:latest` | 5min/task, structured output |
| 8GB RAM machine | `granite4:3b` | Only model that fits comfortably |

### Overnight schedule (local Ollama, zero cost)

A 32GB machine running `granite4:3b` completes **~20-25 research tasks overnight** with no cloud costs:

```bash
# Cron: run every 20min overnight
*/20 23-6 * * * MODEL_PROVIDER=ollama MODEL=granite4:3b python3 research-crawl.py
```

For synthesis tasks (reading many findings at once), switch to `mistral-nemo:12b` — its 1M token context window handles entire research corpora in a single pass.

## Features

- **Auto JS detection** — static fetch first, Playwright fallback for React/Next.js/Docusaurus sites
- **Multi-provider** — Gemini, Ollama, OpenAI-compatible (one env var to switch)
- **No hardcoded secrets** — all config via env vars or `.env` file
- **Claim locking** — multiple crawlers on different machines without duplicate work
- **SYNTHESIS tasks** — reads completed findings and generates gap analysis (no web crawl needed)
- **Auto-queue** — new tasks extracted from synthesis output and queued automatically

## Queue format

See [references/QUEUE_FORMAT.md](references/QUEUE_FORMAT.md).

## Cost

| Provider | Cost |
|----------|------|
| `jsdocs-fetch.js` | Free (local Playwright) |
| Gemini 2.5 Flash | ~$0.01–0.05/task (free tier: 1500 req/day) |
| Ollama (local) | **Free** — runs on your own hardware |
| OpenAI gpt-4o-mini | ~$0.05–0.10/task |

## License

MIT
