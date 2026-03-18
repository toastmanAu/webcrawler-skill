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

Real-world benchmark: same Nervos CKB Fiber Network research task across 10 local models on identical hardware. Tests whether local inference is viable for overnight AI research crawling with zero cloud API cost.

**Hardware:** AMD Ryzen 7 8845HS · 32GB DDR5 · CPU inference (no discrete GPU) · Ollama over LAN

**Task:** Analyse the Fiber Network README and answer 5 structured research questions — identify ecosystem gaps, cite specific APIs, recommend next steps. Identical prompt for every model.

### Results

| Model | Params | Context | Time | Chars | Tok/s | Quality |
|-------|--------|---------|------|-------|-------|---------|
| 🥇 **granite4:3b** | 3B | 128K | **174s** | 4,015 | 5.9 | ⭐⭐⭐⭐⭐ |
| phi4 | 14B | 16K | 287s | 3,651 | 4.9 | ⭐⭐⭐⭐⭐ |
| deepseek-r1:14b | 14B | ~32K | 401s | 3,034 | 5.7 | ⭐⭐⭐⭐⭐ |
| mistral-nemo:12b | 12B | **1,024K** | 453s | 2,981 | 2.4 | ⭐⭐⭐⭐⭐ |
| cogito:32b | 32B | 131K | 511s | 3,179 | 2.7 | ⭐⭐⭐⭐⭐ |
| mistral-small3.1:24b | 24B | 131K | 576s | 3,745 | 3.7 | ⭐⭐⭐⭐⭐ |
| deepseek-r1:32b | 32B | 131K | 576s | 2,409 | 2.7 | ⭐⭐⭐⭐ |
| qwen2.5:14b | 14B | 32K | 605s | 2,834 | 5.2 | ⭐⭐⭐⭐⭐ |
| 🧠 **qwen3:30b** | 30B | **262K** | 625s | **6,224** | **13.2** | ⭐⭐⭐⭐⭐ |
| gemma3:27b | 27B | 131K | 796s | 5,279 | 3.1 | ⭐⭐⭐⭐⭐ |

> **9/10 models scored full 5/5 quality.** Every model that completed correctly identified all research gaps, cited specific APIs, and produced structured markdown output. The benchmark measures **speed and throughput**, not raw capability — all these models are capable enough for research crawling.

> The 24B–32B models were run sequentially one at a time (single model eviction between runs). The 3B–14B models ran in an earlier batch. Results reflect real-world overnight use conditions.

### Key findings

**🥇 granite4:3b is the overnight crawl champion**
3 minutes per task, ~2GB RAM, 128K context window. On a 32GB machine you can run 20–25 research tasks overnight with zero cloud cost. Best choice for Shannon (OPi5+) or any always-on ARM board.

**🧠 qwen3:30b produces the best output — and is the fastest token generator**
6,224 chars output (2× the average) at 13.2 tok/s — faster token generation than every smaller model. The extra context (262K) and reasoning depth show. Worth the 10-minute runtime for synthesis tasks or complex research.

**🗃️ mistral-nemo:12b is the synthesis specialist**
1,024,000 token context window at only ~6GB RAM. Can load an entire research corpus — dozens of findings files — in a single pass. Unbeatable for cross-document synthesis tasks where you need the full picture at once.

**deepseek-r1:32b was the only model to score 4/5**
Completed in the same time as mistral-small:24b but produced shorter output (2,409 chars). The `:14b` variant scores higher and runs faster — prefer that unless you specifically need 32B reasoning depth.

### Recommendations by use case

| Use Case | Model | Why |
|----------|-------|-----|
| Overnight batch crawl | `granite4:3b` | 3min/task, 2GB RAM, 128K context |
| Single deep-dive research | `qwen3:30b` | Best quality output + 13.2 tok/s |
| Synthesis (many findings at once) | `mistral-nemo:12b` | 1M token context, fits entire corpus |
| Balanced quality/speed | `phi4:latest` | 5min/task, solid structured output |
| Low-RAM machine (≤8GB) | `granite4:3b` | Only model that fits comfortably |
| Reasoning-heavy tasks | `cogito:32b` | Chain-of-thought, 32B depth |

### Overnight schedule (zero cost)

```bash
# Cron: run every 20min overnight (granite4:3b = ~3min/task)
*/20 23-6 * * * cd ~/.openclaw/workspace && \
  MODEL_PROVIDER=ollama MODEL=granite4:3b \
  python3 skills/webcrawler/scripts/research-crawl.py

# Synthesis pass in the morning (mistral-nemo:12b reads all findings at once)
0 7 * * * cd ~/.openclaw/workspace && \
  MODEL_PROVIDER=ollama MODEL=mistral-nemo:12b \
  python3 skills/webcrawler/scripts/research-crawl.py --filter synthesis
```

A 32GB machine running `granite4:3b` completes **~20–25 research tasks overnight** with no cloud costs. Switch to `qwen3:30b` for important tasks where output quality matters more than speed.

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
| Ollama (local) | **Free** — runs on your own hardware |
| Gemini 2.5 Flash | ~$0.01–0.05/task (free tier: 1500 req/day) |
| OpenAI gpt-4o-mini | ~$0.05–0.10/task |

## License

MIT
