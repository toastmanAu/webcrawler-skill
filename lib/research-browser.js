/**
 * Research Toolkit — Browser Automation + Web Scraping
 * Delegates heavy scraping to NucBox (192.168.68.79) via SSH + temp file
 * Falls back to web_fetch for static pages
 */

const { execSync } = require('child_process');
const { execFile } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const os = require('os');

const NUCBOX = 'phill@192.168.68.79';

/**
 * Run a Puppeteer scrape on the NucBox.
 * Writes script to a temp file, SCPs it over, runs it, returns JSON.
 */
async function scrapeRemote(url, keywords = [], maxRows = 30) {
  const tmpLocal = path.join(os.tmpdir(), `scrape-${Date.now()}.js`);
  const tmpRemote = `/tmp/scrape-${Date.now()}.js`;

  const script = `
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36');
  try {
    await page.goto(${JSON.stringify(url)}, { waitUntil: 'domcontentloaded', timeout: 25000 });
    const keywords = ${JSON.stringify(keywords)};
    const maxRows = ${maxRows};
    const data = await page.evaluate((kw, max) => {
      const rows = [];
      for (const row of document.querySelectorAll('tr')) {
        const cells = Array.from(row.querySelectorAll('td,th')).map(c => c.textContent.trim());
        if (cells.length >= 2) {
          const text = cells.join(' ').toLowerCase();
          if (!kw.length || kw.some(k => text.includes(k))) rows.push(cells.slice(0, 5));
        }
      }
      const code = Array.from(document.querySelectorAll('pre,code'))
        .map(c => c.textContent.trim()).filter(Boolean).slice(0, 5);
      const links = Array.from(document.querySelectorAll('a'))
        .map(a => ({ text: a.textContent.trim(), href: a.href }))
        .filter(l => l.href && l.href.startsWith('http')).slice(0, 20);
      return {
        title: document.title,
        h1: document.querySelector('h1') ? document.querySelector('h1').textContent.trim() : '',
        bodyText: document.body ? document.body.innerText.slice(0, 8000) : '',
        rows: rows.slice(0, max),
        code,
        links,
      };
    }, keywords, maxRows);
    process.stdout.write(JSON.stringify({ ok: true, url: ${JSON.stringify(url)}, ...data }));
  } catch(e) {
    process.stdout.write(JSON.stringify({ ok: false, url: ${JSON.stringify(url)}, error: e.message }));
  } finally {
    await browser.close();
  }
})();
`;

  try {
    fs.writeFileSync(tmpLocal, script);
    // SCP to NucBox
    execSync(`scp -q ${tmpLocal} ${NUCBOX}:${tmpRemote}`, { timeout: 10000 });
    // Run on NucBox
    const result = execSync(`ssh ${NUCBOX} 'cd ~ && NODE_PATH=~/node_modules node ${tmpRemote}'`, { timeout: 60000 });
    // Cleanup
    execSync(`ssh ${NUCBOX} 'rm -f ${tmpRemote}'`);
    fs.unlinkSync(tmpLocal);
    return JSON.parse(result.toString().trim());
  } catch (e) {
    try { fs.unlinkSync(tmpLocal); } catch {}
    throw new Error(`NucBox scrape failed: ${e.message.slice(0, 200)}`);
  }
}

/**
 * Extract structured content from a URL via NucBox Puppeteer.
 * Handles JS-rendered pages, SPAs, dynamic dashboards.
 *
 * @param {string} url
 * @param {object} opts - { keywords: string[], maxRows: number }
 * @returns {object} { ok, title, h1, bodyText, rows, code, links }
 */
async function extractContent(url, opts = {}) {
  const { keywords = [], maxRows = 30 } = opts;
  return scrapeRemote(url, keywords, maxRows);
}

/**
 * Scrape multiple URLs in parallel on the NucBox.
 * @param {Array<{url, keywords, label, maxRows}>} targets
 * @returns {Array} results with label attached
 */
async function scrapeMany(targets) {
  return Promise.all(
    targets.map(t =>
      extractContent(t.url, { keywords: t.keywords || [], maxRows: t.maxRows || 30 })
        .then(r => ({ ...r, label: t.label || t.url }))
        .catch(e => ({ ok: false, label: t.label || t.url, error: e.message }))
    )
  );
}

module.exports = { extractContent, scrapeMany };
