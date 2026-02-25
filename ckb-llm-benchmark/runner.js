#!/usr/bin/env node
'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

// ─── CLI args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const flags = {};
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const key = args[i].slice(2);
    const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
    flags[key] = val;
  }
}

const DRY_RUN     = !!flags['dry-run'];
const FILTER_MODEL    = flags['model']    || null;
const FILTER_TASK     = flags['task']     || null;
const FILTER_CATEGORY = flags['category'] || null;

// ─── Load tasks ──────────────────────────────────────────────────────────────

const tasksDir = path.join(__dirname, 'tasks');
let tasks = fs.readdirSync(tasksDir)
  .filter(f => f.endsWith('.json'))
  .sort()
  .map(f => JSON.parse(fs.readFileSync(path.join(tasksDir, f), 'utf8')));

if (FILTER_TASK)     tasks = tasks.filter(t => t.id === FILTER_TASK);
if (FILTER_CATEGORY) tasks = tasks.filter(t => t.category === FILTER_CATEGORY);

// ─── Load models ─────────────────────────────────────────────────────────────

let models = config.models;
if (FILTER_MODEL) models = models.filter(m => m.id === FILTER_MODEL || m.name === FILTER_MODEL);

// ─── Dry run ─────────────────────────────────────────────────────────────────

if (DRY_RUN) {
  console.log(`\n📋 DRY RUN — would run ${tasks.length} tasks × ${models.length} models = ${tasks.length * models.length} calls\n`);
  console.log('MODELS:');
  models.forEach(m => console.log(`  • ${m.name} (${m.id})`));
  console.log('\nTASKS:');
  tasks.forEach(t => console.log(`  • [${t.category}] ${t.id}: ${t.title}`));
  process.exit(0);
}

if (tasks.length === 0) { console.error('No tasks matched filters.'); process.exit(1); }
if (models.length === 0) { console.error('No models matched filters.'); process.exit(1); }

// ─── Results directory ───────────────────────────────────────────────────────

const now = new Date();
const pad = n => String(n).padStart(2, '0');
const runId = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}`;
const resultsDir = path.join(__dirname, config.settings.resultsDir, runId);
fs.mkdirSync(resultsDir, { recursive: true });

// symlink latest
const latestLink = path.join(__dirname, config.settings.resultsDir, 'latest');
try { fs.unlinkSync(latestLink); } catch {}
try { fs.symlinkSync(runId, latestLink); } catch {}

console.log(`\n🧪 CKB LLM Benchmark — Run ${runId}`);
console.log(`   Tasks: ${tasks.length}  |  Models: ${models.length}  |  Total calls: ${tasks.length * models.length}`);
console.log(`   Results: ${resultsDir}\n`);

// ─── API caller ──────────────────────────────────────────────────────────────

async function callModel(model, task, attempt = 1) {
  const apiKey = model.apiKeyEnv ? process.env[model.apiKeyEnv] : null;
  const timeout = config.settings.timeoutMs || 30000;

  const messages = [{ role: 'user', content: task.prompt }];

  const body = {
    model: model.id,
    messages,
    max_tokens: task.max_tokens || 1024,
    temperature: task.temperature ?? 0,
  };

  // Anthropic native API needs slightly different headers
  const headers = { 'Content-Type': 'application/json' };
  if (model.provider === 'anthropic') {
    headers['x-api-key'] = apiKey;
    headers['anthropic-version'] = '2023-06-01';
  } else if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const url = `${model.baseUrl}/chat/completions`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const t0 = Date.now();
  let response, data;

  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await response.text();
    clearTimeout(timer);

    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Non-JSON response (${response.status}): ${text.slice(0, 200)}`);
    }

    if (!response.ok) {
      const msg = data?.error?.message || data?.message || JSON.stringify(data);
      throw new Error(`HTTP ${response.status}: ${msg}`);
    }

  } catch (err) {
    clearTimeout(timer);
    if (attempt === 1 && config.settings.retryOnce) {
      console.log(`     ↻ Retrying after error: ${err.message.slice(0, 80)}`);
      await sleep(2000);
      return callModel(model, task, 2);
    }
    return { error: err.message, time_ms: Date.now() - t0 };
  }

  const elapsed = Date.now() - t0;
  const choice = data.choices?.[0];
  const content = choice?.message?.content || '';
  const usage = data.usage || {};

  return {
    response_text: content,
    time_ms: elapsed,
    prompt_tokens: usage.prompt_tokens || usage.input_tokens || null,
    completion_tokens: usage.completion_tokens || usage.output_tokens || null,
    finish_reason: choice?.finish_reason || null,
    raw_response: data,
  };
}

// ─── Scorer (inline, delegates to scorer.js) ─────────────────────────────────

const scorer = require('./scorer');

// ─── Progress helpers ─────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function progressBar(done, total, width = 30) {
  const filled = Math.round((done / total) * width);
  return '[' + '█'.repeat(filled) + '░'.repeat(width - filled) + `] ${done}/${total}`;
}

function categoryIcon(cat) {
  return { code_generation: '💻', debugging: '🐛', reasoning: '🧠', domain_knowledge: '📚', instruction_following: '📋' }[cat] || '❓';
}

// ─── Main run loop ────────────────────────────────────────────────────────────

async function main() {

const allResults = [];
let totalCalls = 0;
const grandTotal = tasks.length * models.length;

for (const model of models) {
  console.log(`\n┌─ Model: ${model.name}`);
  console.log(`│  Provider: ${model.provider}  |  API: ${model.baseUrl}`);

  // Check API key
  if (model.apiKeyEnv && !process.env[model.apiKeyEnv]) {
    console.log(`│  ⚠️  WARNING: env var ${model.apiKeyEnv} not set — calls will likely fail`);
  }

  const modelResults = [];
  const modelFile = path.join(resultsDir, `${model.id.replace(/\//g, '_')}.json`);

  for (let ti = 0; ti < tasks.length; ti++) {
    const task = tasks[ti];
    totalCalls++;

    process.stdout.write(
      `│  ${progressBar(totalCalls, grandTotal)}  ${categoryIcon(task.category)} ${task.id} ... `
    );

    const result = await callModel(model, task);

    let score = null;
    let scoreDetail = null;
    if (!result.error) {
      const scored = await scorer.score(task, result.response_text);
      score = scored.score;
      scoreDetail = scored.detail;
    }

    const record = {
      model_id: model.id,
      model_name: model.name,
      task_id: task.id,
      category: task.category,
      difficulty: task.difficulty,
      title: task.title,
      timestamp: new Date().toISOString(),
      ...result,
      score,
      score_detail: scoreDetail,
    };

    modelResults.push(record);
    allResults.push(record);

    // Save partial results immediately (crash-safe)
    fs.writeFileSync(modelFile, JSON.stringify(modelResults, null, 2));

    // Print result line
    if (result.error) {
      console.log(`❌ ERROR: ${result.error.slice(0, 60)}`);
    } else {
      const toks = result.completion_tokens ? `${result.completion_tokens}tok` : '?tok';
      const tps = result.completion_tokens && result.time_ms
        ? `${((result.completion_tokens / result.time_ms) * 1000).toFixed(1)}tok/s`
        : '';
      const scoreStr = score !== null ? (score === 1 ? '✅' : score === 0 ? '❌' : `🟡${(score*100).toFixed(0)}%`) : '👁️ human';
      console.log(`${scoreStr}  ${result.time_ms}ms  ${toks}  ${tps}`);
    }
  }

  console.log(`└─ Done. Saved → ${path.basename(modelFile)}`);

  // Pause between models
  if (models.indexOf(model) < models.length - 1) {
    const pause = config.settings.pauseBetweenModelsMs || 2000;
    await sleep(pause);
  }
}

// ─── Save combined results ────────────────────────────────────────────────────

const combinedFile = path.join(resultsDir, '_all_results.json');
fs.writeFileSync(combinedFile, JSON.stringify({
  run_id: runId,
  timestamp: new Date().toISOString(),
  models: models.map(m => ({ id: m.id, name: m.name })),
  tasks: tasks.map(t => ({ id: t.id, category: t.category, title: t.title })),
  results: allResults,
}, null, 2));

console.log(`\n✅ Run complete! ${allResults.length} results saved to ${resultsDir}`);
console.log(`   Run report generator: node report.js\n`);

} // end main()

main().catch(err => {
  console.error('\n💥 Fatal error:', err.message);
  process.exit(1);
});
