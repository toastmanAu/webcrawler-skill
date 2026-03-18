# Queue File Format

The queue file (`research/queue.md`) defines research tasks for the crawler.

---

## Task block format

Tasks are separated by `---` (horizontal rule). Each task looks like this:

```markdown
---

[PENDING] my-task-id
**Priority:** HIGH
**Output:** findings/my-task-id.md
**Tags:** fiber, protocol
**Goal:** One paragraph describing what to research, why it matters, and what decision it informs.
**Seeds:**
- https://raw.githubusercontent.com/org/repo/main/README.md
- https://docs.example.com/api-reference
**Questions to answer:**
1. What is the exact API signature for X?
2. What are the version compatibility constraints?
3. Are there known limitations or bugs?

---
```

## Status values

| Status | Meaning |
|--------|---------|
| `[PENDING]` | Ready to crawl — will be picked up by crawler |
| `[IN_PROGRESS]` | Currently being crawled (set automatically) |
| `[DONE]` | Completed — finding saved to output path |
| `[SKIP]` | Manually marked to skip |

## Priority values

| Priority | Meaning |
|----------|---------|
| `HIGH` | Crawled first — blocking decisions |
| `MEDIUM` | Normal research tasks |
| `LOW` | Nice to have, crawled last |
| `SYNTHESIS` | No seeds — reads completed findings and generates a gap analysis |

## Fields

| Field | Required | Description |
|-------|----------|-------------|
| `[STATUS] task-id` | ✅ | Status + unique kebab-case ID |
| `**Priority:**` | ✅ | HIGH / MEDIUM / LOW / SYNTHESIS |
| `**Output:**` | ✅ | Relative path for the finding file |
| `**Goal:**` | ✅ | What to research and why |
| `**Seeds:**` | ✅ (except SYNTHESIS) | List of URLs to crawl |
| `**Tags:**` | Optional | Comma-separated tags for filtering |
| `**Questions to answer:**` | Optional but recommended | Numbered questions Gemini should answer |

## Seed URL rules

Seeds must return raw text/JSON — NOT HTML-rendered pages:

```
✅ https://raw.githubusercontent.com/org/repo/main/file.md   ← raw content
✅ https://api.github.com/repos/org/repo/releases/latest     ← JSON API
✅ https://docs.example.com/page                              ← HTML (auto-rendered if JS)

❌ https://github.com/org/repo/blob/main/file.md              ← renders HTML, useless
❌ https://github.com/org/repo/tree/main/src                  ← directory listing HTML
```

## SYNTHESIS task format

SYNTHESIS tasks have no seeds — they read completed findings instead:

```markdown
---

[PENDING] my-synthesis-task
**Priority:** SYNTHESIS
**Output:** findings/my-synthesis-task.md
**Goal:** Synthesise findings from all fiber-* tasks and produce a prioritised build plan.
**Questions to answer:**
1. What are the critical missing pieces?
2. What should we build first?
3. What external dependencies block us?

---
```

## Filtering

Use `--filter <tag>` to run only matching tasks:
```bash
python3 research-crawl.py --filter fiber      # tasks with "fiber" in id or tags
python3 research-crawl.py --filter fiberquest # only fiberquest-* tasks
```

## Example queue file

```markdown
# Research Queue

---

[DONE] fiber-rpc-api
**Priority:** HIGH
**Output:** findings/fiber-rpc-api.md
**Goal:** Understand the Fiber Network RPC API for Node.js integration.
**Seeds:**
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/README.md
**Questions to answer:**
1. What methods are available?
2. What auth is required?

---

[PENDING] fiber-js-sdk-options
**Priority:** HIGH
**Output:** findings/fiber-js-sdk-options.md
**Tags:** fiber, javascript
**Goal:** Find or evaluate options for a JavaScript client library for the Fiber RPC API.
**Seeds:**
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/README.md
- https://raw.githubusercontent.com/nervosnetwork/fiber/main/crates/fiber-lib/src/rpc/README.md
**Questions to answer:**
1. Does an official JS SDK exist?
2. What are the RPC endpoints we need to wrap?
3. What authentication method is required?

---

[PENDING] my-synthesis
**Priority:** SYNTHESIS
**Output:** findings/synthesis-v1.md
**Goal:** Synthesise all completed findings and produce a gap analysis.
**Questions to answer:**
1. What are the highest-priority missing pieces?
2. What should we build or research next?
```
