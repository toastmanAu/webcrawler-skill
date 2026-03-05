#!/usr/bin/env node
/**
 * check-bug-reports.js
 * Checks GitHub for open bug reports and summarises them.
 * Called by heartbeat every 4 hours.
 * Outputs JSON result for Kernel to format and send to Phill.
 */

const { execSync } = require('child_process');

const REPO = 'toastmanAu/wyltek-bug-reports';
const STATE = process.env.HOME + '/.openclaw/workspace/memory/heartbeat-state.json';

async function main() {
  // Fetch open issues via gh CLI
  let issues;
  try {
    const out = execSync(
      `gh api "repos/${REPO}/issues?state=open&per_page=20"`,
      { encoding: 'utf8' }
    );
    issues = JSON.parse(out);
  } catch (err) {
    process.stderr.write('Error fetching issues: ' + err.message + '\n');
    process.exit(1);
  }

  // Filter out the setup test issue
  const real = issues.filter(i => !i.title.includes('[Test] Bug reporter setup'));

  if (real.length === 0) {
    console.log(JSON.stringify({ count: 0, message: 'No open bug reports.' }));
    return;
  }

  const summary = real.map(i => {
    const sev = i.labels.find(l => l.name.startsWith('severity:'))?.name.replace('severity:', '') || 'unknown';
    return {
      number: i.number,
      title: i.title,
      severity: sev,
      created: i.created_at.slice(0, 10),
      url: i.html_url,
    };
  });

  // Sort critical/high first
  const order = { critical: 0, high: 1, medium: 2, low: 3, unknown: 4 };
  summary.sort((a, b) => (order[a.severity] ?? 4) - (order[b.severity] ?? 4));

  const lines = summary.map(i =>
    `  #${i.number} [${i.severity.toUpperCase()}] ${i.title.replace(/^[🟡🟠🔴🚨]\s*\[.*?\]\s*/, '')} (${i.created})`
  );

  console.log(JSON.stringify({
    count: real.length,
    message: `${real.length} open bug report${real.length > 1 ? 's' : ''}:\n${lines.join('\n')}`,
    issues: summary,
  }));
}

main();
