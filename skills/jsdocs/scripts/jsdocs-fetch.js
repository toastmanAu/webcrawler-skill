#!/usr/bin/env node
/**
 * jsdocs-fetch.js — Fetch JS-rendered documentation and save as markdown
 * Uses Playwright (Chromium) to fully render pages before extracting text.
 *
 * Usage:
 *   node jsdocs-fetch.js <url> [url2...] [--out <dir>] [--selector <css>] [--sitemap] [--delay <ms>]
 *
 * Options:
 *   --out <dir>       Output directory (default: ./jsdocs-output)
 *   --selector <css>  CSS selector for content (default: article)
 *   --sitemap         Discover and crawl all internal links from seed pages
 *   --delay <ms>      Delay between pages in ms (default: 800)
 *   --timeout <ms>    Page load timeout in ms (default: 15000)
 *
 * Examples:
 *   node jsdocs-fetch.js https://docs.fiber.world/docs/guide/biscuit-auth --out ./fiber-docs
 *   node jsdocs-fetch.js https://docs.fiber.world/docs --sitemap --out ./fiber-docs
 *   node jsdocs-fetch.js https://vitepress-site.com --selector .content --out ./refs
 */

const { chromium } = require('playwright');
const fs   = require('fs');
const path = require('path');

// ─── Args ────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const seedUrls = [];
let outDir    = './jsdocs-output';
let selector  = 'article';
let doSitemap = false;
let delay     = 800;
let timeout   = 15000;

for (let i = 0; i < args.length; i++) {
  if      (args[i] === '--out')      outDir   = args[++i];
  else if (args[i] === '--selector') selector = args[++i];
  else if (args[i] === '--sitemap')  doSitemap = true;
  else if (args[i] === '--delay')    delay    = parseInt(args[++i]);
  else if (args[i] === '--timeout')  timeout  = parseInt(args[++i]);
  else if (args[i].startsWith('http')) seedUrls.push(args[i]);
}

if (!seedUrls.length) {
  console.error('Usage: node jsdocs-fetch.js <url> [--out <dir>] [--selector <css>] [--sitemap]');
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

// ─── Helpers ─────────────────────────────────────────────────────────────────
function urlToFilename(url) {
  try {
    const u = new URL(url);
    const slug = u.pathname.replace(/^\//, '').replace(/\/$/, '').replace(/\//g, '-') || 'index';
    return slug.replace(/[^a-z0-9-_]/gi, '_') + '.md';
  } catch { return 'page.md'; }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`📚 jsdocs-fetch (Playwright)`);
  console.log(`   Output:   ${outDir}`);
  console.log(`   Selector: ${selector}`);
  console.log(`   Sitemap:  ${doSitemap}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
  });
  const page = await context.newPage();

  const baseOrigin = new URL(seedUrls[0]).origin;
  const visited = new Set();
  const queue   = [...seedUrls];
  const saved   = [];

  while (queue.length > 0) {
    const url = queue.shift();
    if (visited.has(url)) continue;
    visited.add(url);

    process.stdout.write(`→ ${url} ... `);

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout });

      // Try provided selector, fall back to main, then body
      let text = '';
      for (const sel of [selector, 'main', 'body']) {
        try {
          text = await page.$eval(sel, el => el.innerText);
          if (text.trim().length > 100) break;
        } catch {}
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

      // Collect internal links for sitemap crawl
      if (doSitemap) {
        const links = await page.$$eval('a[href]', els =>
          els.map(a => a.href).filter(h => h.startsWith('http'))
        );
        for (const link of links) {
          const clean = link.split('#')[0]; // strip anchors
          if (clean.startsWith(baseOrigin) && !visited.has(clean)) {
            queue.push(clean);
          }
        }
      }

    } catch (e) {
      console.log(`⚠️  ${e.message.split('\n')[0]}`);
    }

    if (queue.length > 0) await sleep(delay);
  }

  await browser.close();

  // Write index
  const index = [
    `# jsdocs Index`,
    ``,
    `Generated: ${new Date().toISOString().split('T')[0]}`,
    `Base URL: ${seedUrls[0]}`,
    `Pages: ${saved.length}`,
    ``,
    `## Pages`,
    ``,
    ...saved.map(({ filename, url }) => `- [${filename.replace('.md', '')}](./${filename}) — ${url}`),
  ].join('\n');
  fs.writeFileSync(path.join(outDir, 'INDEX.md'), index);

  console.log(`\n✅ Done — ${saved.length} pages saved to ${outDir}/`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
