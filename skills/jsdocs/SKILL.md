---
name: jsdocs
description: Fetch and save JS-rendered documentation sites as local markdown reference files. Use when a documentation site uses JavaScript/React/Next.js rendering that web_fetch can't read (returns empty or minimal content). Triggers on phrases like "save these docs locally", "crawl this docs site", "save as reference", "fetch JS docs", or when web_fetch fails on a docs site. Uses OpenClaw's CDP browser bridge to fully render pages before extracting text.
---

# jsdocs — JS-Rendered Docs Fetcher

Fetches JavaScript-rendered documentation pages via CDP and saves as local `.md` files.

## When to use

- `web_fetch` returns thin/empty content on a docs site
- Site uses Next.js, React, Docusaurus, VitePress or similar JS frameworks
- User asks to "save docs locally" or "save as reference"

## Quick start

```bash
# Single page
node scripts/jsdocs-fetch.js https://docs.example.com/page --out ./refs/my-docs

# Full site crawl (follows all internal links)
node scripts/jsdocs-fetch.js https://docs.example.com --sitemap --out ./refs/my-docs

# Custom content selector (default: article)
node scripts/jsdocs-fetch.js https://docs.example.com/page --selector main --out ./refs/my-docs
```

## Requirements

- OpenClaw browser tool must be running (port 18800) — it always is in normal operation
- `ws` node module at `/home/phill/node_modules/ws/index.js`
- Script path: `~/.openclaw/workspace/skills/jsdocs/scripts/jsdocs-fetch.js`

## Output

- One `.md` file per page, named from URL path (e.g. `docs-guide-biscuit-auth.md`)
- `INDEX.md` with list of all saved pages
- Recommend saving to `~/.openclaw/workspace/research/references/<site-name>/`

## Workflow

1. Try `web_fetch` first — if content is ≥500 chars of useful text, no need for this skill
2. If thin/empty, run `jsdocs-fetch.js` with the URL
3. For full site: use `--sitemap` flag (crawls all internal links)
4. Save output to `research/references/<site-name>/`
5. Add an `INDEX.md` summary of what's in the reference (auto-generated)

## Selector tips

| Site type | Best selector |
|-----------|--------------|
| Docusaurus | `article` |
| VitePress  | `.content` or `main` |
| GitBook    | `main` |
| Next.js docs | `article` or `[role=main]` |
| Unknown    | try `article` first, fall back to `main` then `body` |

## Notes

- 1.5s delay between pages by default (--delay to adjust)
- Pages shorter than 100 chars are skipped (probably nav-only)
- The CDP browser tab is shared — avoid navigating it manually while crawl is running
