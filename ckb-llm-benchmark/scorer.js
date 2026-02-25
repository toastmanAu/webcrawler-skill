'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Score a task response.
 * Returns { score: 0.0-1.0 | null, detail: string }
 *
 * Score meanings:
 *   1.0  = fully correct
 *   0.5  = partially correct (some keywords missing, partial JSON, etc.)
 *   0.0  = failed / wrong
 *   null = needs human review
 */
async function score(task, responseText) {
  const evalCfg = task.evaluation;
  if (!evalCfg) return { score: null, detail: 'no evaluation config' };

  switch (evalCfg.type) {
    case 'contains_keywords':
      return scoreKeywords(evalCfg, responseText);

    case 'json_valid':
      return scoreJson(evalCfg, responseText);

    case 'code_execution':
      return await scoreCodeExecution(task, evalCfg, responseText);

    case 'human':
      return { score: null, detail: 'requires human review' };

    default:
      return { score: null, detail: `unknown eval type: ${evalCfg.type}` };
  }
}

// ─── Keyword scorer ───────────────────────────────────────────────────────────

function scoreKeywords(evalCfg, responseText) {
  const keywords = evalCfg.keywords || [];
  if (keywords.length === 0) return { score: 1.0, detail: 'no keywords to check' };

  const lower = responseText.toLowerCase();
  const hits = keywords.filter(kw => lower.includes(kw.toLowerCase()));
  const misses = keywords.filter(kw => !lower.includes(kw.toLowerCase()));

  const score = hits.length / keywords.length;
  const detail = misses.length === 0
    ? `all ${keywords.length} keywords found`
    : `${hits.length}/${keywords.length} keywords found; missing: ${misses.slice(0, 5).join(', ')}`;

  return { score, detail };
}

// ─── JSON validator ───────────────────────────────────────────────────────────

function scoreJson(evalCfg, responseText) {
  // Strip markdown code fences if present
  let text = responseText.trim();
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) text = fenceMatch[1].trim();

  // Also try to extract first JSON object from the text
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) text = jsonMatch[0];

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    return { score: 0.0, detail: `invalid JSON: ${e.message.slice(0, 80)}` };
  }

  const requiredKeys = evalCfg.required_keys || evalCfg.keywords || [];
  const missingKeys = requiredKeys.filter(k => !(k in parsed));

  if (missingKeys.length === 0) {
    return { score: 1.0, detail: `valid JSON with all ${requiredKeys.length} required keys` };
  }

  const score = (requiredKeys.length - missingKeys.length) / requiredKeys.length;
  return {
    score,
    detail: `valid JSON but missing keys: ${missingKeys.join(', ')}`,
  };
}

// ─── Code execution scorer ────────────────────────────────────────────────────

async function scoreCodeExecution(task, evalCfg, responseText) {
  // Extract code block from response
  const code = extractCode(responseText, ['javascript', 'js', '']);
  if (!code) {
    // Fall back to keyword scoring if no code found
    if (evalCfg.keywords && evalCfg.keywords.length > 0) {
      const kw = scoreKeywords(evalCfg, responseText);
      return { score: kw.score * 0.5, detail: `no code block found; keyword fallback: ${kw.detail}` };
    }
    return { score: 0.0, detail: 'no code block found in response' };
  }

  const testCode = evalCfg.test_code || '';
  const expectedOutput = (evalCfg.expected_output || '').trim();

  if (!testCode || !expectedOutput) {
    // Can't auto-execute — fall back to keyword check
    if (evalCfg.keywords && evalCfg.keywords.length > 0) {
      return scoreKeywords(evalCfg, responseText);
    }
    return { score: null, detail: 'code found but no test_code/expected_output — needs human review' };
  }

  // Write to temp file and execute
  const tmpFile = path.join(require('os').tmpdir(), `ckb_bench_${Date.now()}_${Math.random().toString(36).slice(2)}.js`);
  const fullCode = `${code}\n\n${testCode}`;

  try {
    fs.writeFileSync(tmpFile, fullCode);
    const output = execSync(`node "${tmpFile}"`, {
      timeout: 10000,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();

    fs.unlinkSync(tmpFile);

    if (output === expectedOutput) {
      return { score: 1.0, detail: 'code executed correctly — output matches expected' };
    }

    // Partial match check
    const expectedLines = expectedOutput.split('\n');
    const outputLines = output.split('\n');
    const matchingLines = expectedLines.filter((l, i) => outputLines[i] === l);
    const partialScore = matchingLines.length / expectedLines.length;

    if (partialScore > 0) {
      return {
        score: partialScore,
        detail: `partial match: ${matchingLines.length}/${expectedLines.length} lines correct. Got: ${output.slice(0, 120)}`,
      };
    }

    return {
      score: 0.0,
      detail: `wrong output. Expected: ${expectedOutput.slice(0, 80)} | Got: ${output.slice(0, 80)}`,
    };

  } catch (err) {
    try { fs.unlinkSync(tmpFile); } catch {}

    const errMsg = (err.stderr || err.message || '').toString().slice(0, 120);

    // If execution fails, fall back to keyword scoring at reduced weight
    if (evalCfg.keywords && evalCfg.keywords.length > 0) {
      const kw = scoreKeywords(evalCfg, responseText);
      return {
        score: kw.score * 0.4,
        detail: `execution failed (${errMsg}); keyword fallback ${kw.detail}`,
      };
    }

    return { score: 0.0, detail: `execution failed: ${errMsg}` };
  }
}

// ─── Code extractor ───────────────────────────────────────────────────────────

function extractCode(text, preferredLangs = []) {
  // Try preferred language fences first
  for (const lang of preferredLangs) {
    const pattern = lang
      ? new RegExp('```' + lang + '\\s*\\n([\\s\\S]*?)```', 'i')
      : /```\s*\n([\s\S]*?)```/;
    const m = text.match(pattern);
    if (m) return m[1].trim();
  }

  // Any code fence
  const any = text.match(/```(?:\w+)?\s*\n([\s\S]*?)```/);
  if (any) return any[1].trim();

  return null;
}

module.exports = { score, scoreKeywords, scoreJson, scoreCodeExecution, extractCode };
