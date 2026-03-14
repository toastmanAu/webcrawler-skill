/**
 * Research Toolkit — Browser Automation + Web Scraping
 * For research crawler to extract content from URLs
 */

const puppeteer = require('puppeteer');
const playwright = require('playwright');

class ResearchBrowser {
  constructor() {
    this.browsers = {
      chromium: null,
      firefox: null,
    };
  }

  async initialize() {
    /**
     * Launch browsers for parallel research crawling
     */
    this.browsers.chromium = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    console.log('✅ Chromium (Puppeteer) ready for research');
  }

  async extractContent(url, selectors = {}) {
    /**
     * Navigate to URL, extract structured content
     * Used by research crawler to get data from targets
     */
    if (!this.browsers.chromium) await this.initialize();

    const page = await this.browsers.chromium.newPage();
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Extract based on selectors (title, content, links, code blocks)
      const content = await page.evaluate((sel) => {
        return {
          title: document.querySelector(sel.title || 'h1')?.textContent || '',
          content: document.querySelector(sel.content || 'main')?.innerText || '',
          links: Array.from(document.querySelectorAll('a'))
            .map((a) => ({ text: a.textContent, href: a.href }))
            .slice(0, 10),
          code: Array.from(document.querySelectorAll('pre, code'))
            .map((c) => c.textContent)
            .slice(0, 5),
          metadata: {
            url: window.location.href,
            title: document.title,
            description: document.querySelector('meta[name="description"]')?.content || '',
          },
        };
      }, selectors);

      return content;
    } catch (e) {
      console.error(`Failed to extract from ${url}:`, e.message);
      return null;
    } finally {
      await page.close();
    }
  }

  async searchAndExtract(query, siteFilter = '', maxResults = 5) {
    /**
     * Use Google search + extract top results
     * Replaces manual URL curation
     */
    // This would integrate with google-search API
    // For now, returns placeholder
    return {
      query,
      siteFilter,
      results: [],
      note: 'Wire to SerpAPI or Google Custom Search API for live results',
    };
  }

  async closeBrowsers() {
    if (this.browsers.chromium) await this.browsers.chromium.close();
    console.log('✅ Browsers closed');
  }
}

module.exports = ResearchBrowser;
