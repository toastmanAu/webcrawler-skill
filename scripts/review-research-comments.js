#!/usr/bin/env node
/**
 * review-research-comments.js
 * Fetches all research comments from Supabase, groups by task,
 * and sends a daily digest to Phill via Telegram.
 * 
 * Run: node review-research-comments.js
 * Cron: daily ~9am ACST
 */

const SUPABASE_URL  = 'https://yhntwgjzrzyhyxpiqcts.supabase.co';
const SUPABASE_KEY  = 'sb_secret_8tdKeoNYfnaSEqrkhwYDqw_B6qJMkEq';
const TG_BOT        = '8446459270:AAFltgKPOgFc0FX4PjKJNPUxTRoRzayKAlE';
const TG_CHAT       = '1790655432';
const RESEARCH_TASKS_PATH = '/home/phill/workspace/wyltek-industries-site/js/research-tasks.js';

// How far back to look (default: last 24h, or --all for everything)
const SINCE_HOURS = process.argv.includes('--all') ? 8760 : 25; // 25h catches any timezone drift

async function sbFetch(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      'apikey':        SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type':  'application/json',
      ...opts.headers,
    },
  });
  if (!res.ok) throw new Error(`Supabase ${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function tgSend(text) {
  await fetch(`https://api.telegram.org/bot${TG_BOT}/sendMessage`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ chat_id: TG_CHAT, text, parse_mode: 'Markdown', disable_web_page_preview: true }),
  });
}

function shortAddr(addr) {
  if (!addr) return 'unknown';
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

function truncate(str, n = 200) {
  return str.length > n ? str.slice(0, n) + '…' : str;
}

// Load task titles from research-tasks.js (simple regex parse — no eval)
function loadTaskTitles() {
  try {
    const fs = require('fs');
    const src = fs.readFileSync(RESEARCH_TASKS_PATH, 'utf8');
    const map = {};
    // Match: { id: 'foo', ..., goal: 'bar', ... }
    const idRe   = /id:\s*['"]([^'"]+)['"]/g;
    const goalRe = /goal:\s*['"]([^'"]+)['"]/g;
    const ids    = [...src.matchAll(idRe)].map(m => m[1]);
    const goals  = [...src.matchAll(goalRe)].map(m => m[1]);
    ids.forEach((id, i) => { map[id] = goals[i] || id; });
    return map;
  } catch {
    return {};
  }
}

async function main() {
  const since = new Date(Date.now() - SINCE_HOURS * 3600 * 1000).toISOString();

  // Fetch recent comments
  const comments = await sbFetch(
    `research_comments?created_at=gte.${since}&order=created_at.desc&limit=100`
  );

  // Fetch likes in same window
  const likes = await sbFetch(
    `research_likes?created_at=gte.${since}&order=created_at.desc&limit=200`
  ).catch(() => []);

  const taskTitles = loadTaskTitles();

  if (comments.length === 0 && likes.length === 0) {
    console.log('No new comments or toasts in the last 24h — nothing to report.');
    // Only send if --notify-empty flag set
    if (process.argv.includes('--notify-empty')) {
      await tgSend('🔬 *Research digest* — no new comments or toasts in the last 24h.');
    }
    return;
  }

  // Group by task_id
  const byTask = {};
  for (const c of comments) {
    if (!byTask[c.task_id]) byTask[c.task_id] = { comments: [], likes: 0 };
    byTask[c.task_id].comments.push(c);
  }
  for (const l of likes) {
    if (!byTask[l.task_id]) byTask[l.task_id] = { comments: [], likes: 0 };
    byTask[l.task_id].likes++;
  }

  // Sort tasks by comment count desc
  const tasks = Object.entries(byTask)
    .sort((a, b) => (b[1].comments.length + b[1].likes) - (a[1].comments.length + a[1].likes));

  // Build Telegram message
  const lines = [
    `🔬 *Research Community Digest*`,
    `_Last 24h — ${comments.length} comment${comments.length !== 1 ? 's' : ''}, ${likes.length} toast${likes.length !== 1 ? 's' : ''} across ${tasks.length} task${tasks.length !== 1 ? 's' : ''}_`,
    '',
  ];

  for (const [taskId, data] of tasks) {
    const title = taskTitles[taskId] || taskId;
    lines.push(`*${taskId}*`);
    if (title !== taskId) lines.push(`_${truncate(title, 80)}_`);
    if (data.likes > 0) lines.push(`🥂 ${data.likes} toast${data.likes !== 1 ? 's' : ''}`);
    for (const c of data.comments) {
      lines.push(`• \`${shortAddr(c.ckb_address)}\`: ${truncate(c.body, 180)}`);
    }
    lines.push('');
  }

  lines.push('_Review at wyltekindustries.com/research.html_');

  const msg = lines.join('\n');
  console.log('Sending digest...');
  console.log(msg);
  await tgSend(msg);
  console.log('Done.');
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
