# Changelog — webcrawler skill

All notable changes to this skill are documented here.
Format: [vX.Y.Z] — YYYY-MM-DD — description

---

## [v1.2.0] — 2026-03-19
### Added
- `scripts/research-intake-bot.py` — interactive Telegram bot flow for submitting research tasks
- Guided Q&A: Task ID → Priority → Goal → Seeds (validated) → Questions → Tags → Preview → Confirm
- Live URL validation with GitHub blob/tree detection and raw URL suggestions
- Duplicate task ID detection against existing queue
- SYNTHESIS priority auto-skips seed collection
- Session state persisted in `/tmp/research-intake-<user_id>.json` between turns
- Agent wiring pattern documented in SKILL.md

### Changed
- SKILL.md: added `/research` command section with wiring pattern
- SKILL.md: version field added to frontmatter (now `1.2.0`)

---

## [v1.1.0] — 2026-03-18
### Added
- `scripts/queue-intake.py` — intake processor: normalises formatting, validates structure, moves to queue or rejects with report
- `research/intake/` folder structure (processed/, rejected/ subdirs)
- Shannon sync cron: rsync findings from OPi5+ → Pi5 after each completed task
- Support for `--watch` mode on queue-intake.py (polls intake/ every 30s)
- Duplicate detection across PENDING/DONE/CLAIMED/IN_PROGRESS states

### Changed
- research-crawl.py: auto-calls jsdocs-fetch.js for JS-rendered seed URLs

---

## [v1.0.0] — 2026-03-18
### Added
- `scripts/research-crawl.py` — Gemini 2.5 Flash research crawler
  - Picks next PENDING task from queue.md (HIGH → MEDIUM → LOW → SYNTHESIS)
  - Claim-based multi-worker locking (prevents duplicate work)
  - SYNTHESIS tasks: reads completed findings + MEMORY.md, no web crawl
  - `--filter` flag for tag/prefix filtering
  - Auto-queues follow-up tasks from findings
- `scripts/jsdocs-fetch.js` — JS-rendered docs fetcher (Playwright)
  - Auto-detects JS vs static pages (Playwright fallback when < 300 chars)
  - Single page or full sitemap crawl
  - Saves one `.md` per page + `INDEX.md`
- `references/SETUP.md` — prerequisites and configuration guide
- `references/QUEUE_FORMAT.md` — queue file format reference
- Published to GitHub: https://github.com/toastmanAu/webcrawler-skill
