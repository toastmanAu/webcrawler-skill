# CKB LLM Benchmark

A reproducible benchmark harness for comparing AI model capabilities on CKB/Nervos-specific tasks. Designed to support community decision-making around shared inference infrastructure — specifically the question of whether self-hosted open models can approach the quality of Claude Sonnet 4.6 (which the community already has free via the CKBDev shared API key).

**The central question this benchmark answers:**
> Can self-hosted open models on consumer hardware match or approach Claude Sonnet 4.6 quality — which the CKB community already gets free via CKBDev — while providing community sovereignty and independence from third-party API dependency?

The benchmark results and costing report can be used directly as supporting material for a community infrastructure grant proposal. See [§6 of the generated report](#using-results-for-a-grant-proposal) for a ready-to-adapt draft.

---

## What it tests

25 CKB-specific tasks across 5 categories:

| Category | Tasks | What it measures |
|---|---|---|
| **Code Generation** | 5 | Writing working CKB-related code from scratch |
| **Debugging** | 5 | Finding and fixing bugs in CKB/blockchain code |
| **Reasoning** | 5 | Multi-step technical reasoning about CKB systems |
| **Domain Knowledge** | 5 | CKB/Nervos factual and conceptual understanding |
| **Instruction Following** | 5 | Format compliance, completeness, constraint adherence |

Models tested by default:
- Claude Sonnet 4.6 via Anthropic direct API
- Claude Sonnet 4.6 via CKBDev shared API (**baseline** — free community access)
- DeepSeek V3.2 (HuggingFace)
- Llama 3.3 70B (HuggingFace)
- Qwen3 32B (HuggingFace)
- Qwen2.5 3B (local Ollama — existing OPi5+ hardware)

---

## Setup

**Requirements:** Node.js 18+, npm

```bash
git clone https://github.com/toastmanAu/ckb-llm-benchmark
cd ckb-llm-benchmark
npm install
cp .env.example .env
```

Edit `.env` and add your API keys:

```
ANTHROPIC_API_KEY=sk-ant-...   # optional — skip to test free models only
CKBDEV_API_KEY=...             # CKBDev community key
HF_API_KEY=hf_...              # HuggingFace — free at hf.co/settings/tokens
```

You can run **without any paid keys** using HuggingFace free tier and local Ollama. This still gives you meaningful benchmark data for open models.

---

## Usage

### Run the full benchmark

```bash
node runner.js
```

### Filter by category or model

```bash
# Test only reasoning tasks
node runner.js --category reasoning

# Test only domain knowledge
node runner.js --category domain_knowledge

# Test a specific model
node runner.js --model "meta-llama/Llama-3.3-70B-Instruct"

# Test a specific task
node runner.js --task reason-003

# Combine filters
node runner.js --category code_generation --model "Qwen/Qwen3-32B"
```

### See what would run without calling any APIs

```bash
node runner.js --dry-run
```

### Generate the report

```bash
node report.js
```

Report is written to `results/latest/report.md` and `results/latest/report.json`.

To generate a report for a specific past run:
```bash
node report.js 2026-02-25-14-00
```

---

## Quick start (free models only, ~10 minutes)

This runs only the free-tier models and gives you enough data to see the quality gap:

```bash
# 1. Get a free HuggingFace token at hf.co/settings/tokens
echo "HF_API_KEY=hf_your_token_here" > .env

# 2. Run domain knowledge + reasoning (most revealing for CKB quality)
node runner.js --category domain_knowledge
node runner.js --category reasoning

# 3. Generate report
node report.js

# 4. Read the results
cat results/latest/report.md
```

---

## How scoring works

Each task specifies an evaluation type:

| Type | How it's scored |
|---|---|
| `contains_keywords` | Checks response contains all required keywords (case-insensitive). Score = keywords found / total keywords |
| `json_valid` | Parses JSON from response, checks required keys present. Score = keys found / total keys |
| `code_execution` | Extracts code block, runs in sandboxed Node.js child process with 10s timeout, compares stdout to expected output |
| `human` | Marked 👁️ in report — requires human review, score = null |

**Score range:** 0.0–1.0 (shown as percentages in reports)

**Relative scores** in the summary table are vs the CKBDev Claude Sonnet 4.6 baseline (= 100%). This is the real baseline because the community already has free access to it.

---

## How to add new tasks

Create a JSON file in `tasks/` following this schema:

```json
{
  "id": "code-006",
  "category": "code_generation",
  "difficulty": "medium",
  "title": "Short descriptive title",
  "prompt": "The full prompt sent to the model...",
  "evaluation": {
    "type": "contains_keywords",
    "keywords": ["keyword1", "keyword2", "keyword3"]
  },
  "max_tokens": 1024,
  "temperature": 0
}
```

**Evaluation types and their fields:**

```json
// Keyword check
"evaluation": {
  "type": "contains_keywords",
  "keywords": ["must", "contain", "these"]
}

// JSON structure check
"evaluation": {
  "type": "json_valid",
  "required_keys": ["key1", "key2"]
}

// Code execution (extracts JS code block and runs it)
"evaluation": {
  "type": "code_execution",
  "test_code": "// code appended after model's response to test it\nconsole.log(myFunction('input'));",
  "expected_output": "expected stdout output"
}

// Human review required
"evaluation": {
  "type": "human"
}
```

**Categories:** `code_generation`, `debugging`, `reasoning`, `domain_knowledge`, `instruction_following`

**Difficulty:** `easy`, `medium`, `hard`

Tasks are loaded alphabetically from `tasks/`. The `id` field is used for filtering (`--task code-006`).

---

## Config reference (`config.json`)

```json
{
  "models": [ ... ],
  "settings": {
    "timeoutMs": 30000,      // Per-call timeout (ms)
    "retryOnce": true,       // Retry once on network error
    "pauseBetweenModelsMs": 2000,  // Pause between models
    "resultsDir": "results"  // Where to save results
  }
}
```

To add a model, add an entry to the `models` array:

```json
{
  "id": "model-id-as-passed-to-api",
  "name": "Human readable name",
  "baseUrl": "https://api.example.com/v1",
  "apiKeyEnv": "MY_API_KEY_ENV_VAR",
  "provider": "openai-compat"
}
```

**Providers:**
- `openai-compat` — standard OpenAI `/chat/completions` format
- `anthropic` — Anthropic native API (uses `x-api-key` header)
- `ollama` — local Ollama instance (no auth required, set `apiKeyEnv: null`)

---

## Interpreting results

### Summary table
The main table shows raw scores (% of max possible) per category per model, plus a **vs Baseline** column showing performance relative to CKBDev Claude Sonnet 4.6.

Example interpretation:
- Model scores 78% overall, 65% vs baseline → performs at 65% of Claude quality on CKB tasks
- Model scores 92% on instruction_following but 45% on reasoning → strong at format, weak at logic

### Speed vs quality tradeoff
The speed table (§3) shows tok/s alongside quality. Local models are much faster per-token but may produce lower quality. For a community node, interactive speed (>10 tok/s) matters — users won't wait 30 seconds for a response.

### The 70B threshold
Benchmark data consistently shows:
- **7–8B models:** ~45–50% of Claude quality → development/personal use only
- **32B models:** ~65–75% → approaching useful but short of community-grade
- **70B models:** ~80–88% → community-grade; most users won't notice the gap on typical tasks
- **70B Q8 on 48GB:** ~90–93% → near-Claude; recommended if budget allows

---

## Using results for a grant proposal

The benchmark report is designed to be used as supporting material for a community infrastructure grant. The generated `report.md` includes:

- **§5 (Costing):** Real usage data, hardware comparison table, quality ladder vs Claude baseline, sovereignty vs dependency analysis
- **§6 (Grant Proposal):** Ready-to-adapt draft proposal for the Nervos community treasury / Nervos Foundation

**To run a fresh benchmark and share results with the community:**

```bash
# 1. Run with whatever keys you have (HF free tier is enough for open models)
node runner.js

# 2. Generate report
node report.js

# 3. Share results/latest/report.md on the Nervos forum or Discord
# 4. Invite others to reproduce: "Run it yourself and post your numbers"
```

The goal is reproducible, community-verifiable data — not a single source-of-truth report. Multiple people running this benchmark and comparing results is more convincing than any single run.

**Repository:** https://github.com/toastmanAu/ckb-llm-benchmark  
**Forum discussion:** [link to Nervos forum thread]  
**Contact:** Phill / toastmanAu on Discord, Telegram, or Nervos Forum

---

## Results directory structure

```
results/
  latest -> 2026-02-25-14-00/   (symlink to most recent run)
  2026-02-25-14-00/
    _all_results.json            Combined results from all models
    report.md                    Full markdown report
    report.json                  Machine-readable report summary
    anthropic_claude-sonnet-4-6.json      Per-model partial results
    ckbdev_claude-sonnet-4-6.json
    ...
```

Partial results are saved after every task call. If the runner crashes, you can re-run missing models and all previous work is preserved.

---

## License

MIT. Use freely. Run it, share results, fork it, improve the tasks.

If you use this for a community grant proposal or publish results, attribution appreciated but not required.
