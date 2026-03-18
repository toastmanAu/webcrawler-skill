#!/usr/bin/env node
/**
 * jsdocs-fetch.js — Fetch JS-rendered (or static) documentation and save as markdown
 *
 * Auto-detects JS-rendered pages: does a lightweight HEAD/GET first; if content
 * is too thin (<300 chars after stripping tags), falls back to Playwright.
 *
 * Usage:
 *   node jsdocs-fetch.js <url> [url2...] [--out <dir>] [--selector <css>] [--sitemap] [--delay <ms>]
 *
 * Options:
 *   --out <dir>       Output directory (default: ./jsdocs-output)
 *   --selector <css>  CSS selector for content (default: article)
 *   --sitemap         Discover and crawl all internal links
 *   --delay <ms>      Delay between pages (default: 800)
 *   --timeout <ms>    Page load timeout (default: 15000)
 *   --no-playwright   Disable Playwright fallback (static HTML only)
 *
 * No env vars or API keys required.
 */

const fs   = require('fs');
const path = require('path');
const http  = require('http');
const https = require('https');

// Parse args
const args = process.argv.slice(2);
const seedUrls   = [];
let outDir       = './jsdocs-output';
let selector     = 'article';
let doSitemap    = false;
let delay        = 800;
let pageTimeout  = 15000;
let noPlaywright = false;

for (let i = 0; i < args.length; i++) {
  if      (args[i] === '--out')          outDir      = args[++i];
  else if (args[i] === '--selector')     selector    = args[++i];
  else if (args[i] === '--sitemap')      doSitemap   = true;
  else if (args[i] === '--delay')        delay       = parseInt(args[++i]);
  else if (args[i] === '--timeout')      pageTimeout = parseInt(args[++i]);
  else if (args[i] === '--no-playwright') noPlaywright = true;
  else if (args[i].startsWith('http'))   seedUrls.push(args[i]);
}

if (!seedUrls.length) {
  console.error('Usage: node jsdocs-fetch.js <url> [--out <dir>] [--selector <css>] [--sitemap]');
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

// ─── Static fetch (plain HTML) ────────────────────────────────────────────
function fetchStatic(url) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, {
      timeout: 8000,
      headers: { 'User-Agent': 'Mozilla/5.0 (webcrawler-jsdocs/2.0)' }
    }, (res) => {
      // Follow one redirect
      if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location) {
        return fetchStatic(res.headers.location).then(resolve);
      }
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        // Strip scripts, styles, tags
        let text = data
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&[a-z#0-9]+;/gi, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        resolve({ text, raw: data.length });
      });
    });
    req.on('error', () => resolve({ text: '', raw: 0 }));
    req.on('timeout', () => { req.destroy(); resolve({ text: '', raw: 0 }); });
  });
}

// ─── Playwright fetch (JS-rendered) ──────────────────────────────────────
async function fetchPlaywright(url, sel) {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch {
    try {
      ({ chromium } = require('playwright-core'));
    } catch {
      throw new Error('Playwright not installed. Run: npm install -g playwright && npx playwright install chromium');
    }
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const ctx  = await browser.newContext({
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36'
    });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout: pageTimeout });

    // Try selector, fall back to main, then body
    let text = '';
    for (const s of [sel, 'main', '[role="main"]', 'body']) {
      try {
        text = await page.$eval(s, el => el.innerText);
        if (text.trim().length > 200) break;
      } catch {}
    }

    // Get internal links if needed
    const links = doSitemap
      ? await page.$$eval('a[href]', els => els.map(a => a.href).filter(h => h.startsWith('http')))
      : [];

    return { text: text.trim(), links };
  } finally {
    await browser.close();
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function urlToFilename(url) {
  try {
    const u = new URL(url);
    const slug = u.pathname.replace(/^\/|\/$/g, '').replace(/\//g, '-') || 'index';
    return slug.replace(/[^a-z0-9-_]/gi, '_') + '.md';
  } catch { return 'page.md'; }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── Main ─────────────────────────────────────────────────────────────────
async function main() {
  console.log(`📚 jsdocs-fetch v2 (Playwright auto-detect)`);
  console.log(`   Output:   ${outDir}`);
  console.log(`   Selector: ${selector}`);
  console.log(`   Sitemap:  ${doSitemap}\n`);

  const baseOrigin = new URL(seedUrls[0]).origin;
  const visited = new Set();
  const queue   = [...seedUrls];
  const saved   = [];

  while (queue.length > 0) {
    const url = queue.shift();
    if (visited.has(url)) continue;
    visited.add(url);

    process.stdout.write(`→ ${url} ... `);

    let text = '';
    let links = [];

    try {
      // Step 1: try static fetch
      const { text: staticText, raw } = await fetchStatic(url);
      const isJsRendered = staticText.length < 300 && raw > 5000; // big HTML, tiny text = JS app

      if (!isJsRendered || noPlaywright) {
        text = staticText;
        process.stdout.write(`[static ${staticText.length}c] `);
      } else {
        // Step 2: fall back to Playwright
        process.stdout.write(`[JS→playwright] `);
        const result = await fetchPlaywright(url, selector);
        text  = result.text;
        links = result.links;
      }
    } catch (e) {
      console.log(`⚠️  ${e.message.split('\n')[0]}`);
      continue;
    }

    text = text.trim();
    if (text.length < 100) {
      console.log(`⚠️  too short (${text.length} chars)`);
      continue;
    }

    const filename = urlToFilename(url);
    const content  = `Source: ${url}\nSaved: ${new Date().toISOString().split('T')[0]}\n\n---\n\n${text}`;
    fs.writeFileSync(path.join(outDir, filename), content);
    saved.push({ filename, url });
    console.log(`✓ ${text.length} chars → ${filename}`);

    // Queue internal links for sitemap crawl
    if (doSitemap) {
      for (const link of links) {
        const clean = link.split('#')[0];
        if (clean.startsWith(baseOrigin) && !visited.has(clean) && !queue.includes(clean)) {
          queue.push(clean);
        }
      }
    }

    if (queue.length > 0) await sleep(delay);
  }

  // Write index
  const index = [
    `# jsdocs Index`,
    ``,
    `Generated: ${new Date().toISOString().split('T')[0]}`,
    `Base URL:  ${seedUrls[0]}`,
    `Pages:     ${saved.length}`,
    ``,
    `## Pages`,
    ``,
    ...saved.map(({ filename, url }) => `- [${filename.replace('.md', '')}](./${filename})\n  ${url}`),
  ].join('\n');
  fs.writeFileSync(path.join(outDir, 'INDEX.md'), index);

  console.log(`\n✅ Done — ${saved.length} pages saved to ${outDir}/`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
