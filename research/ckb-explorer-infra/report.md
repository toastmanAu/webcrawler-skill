# CKB Explorer Infrastructure: Cost Analysis & Alternative Hosting Report
**v2 — Updated 2026-03-10 after App5 Labs Reddit post**  
**Commissioned by:** Phill (Wyltek Industries)  
**Status:** Research complete — intended for Nervos community discussion

---

## What Changed Since v1

The v1 report assumed the explorer was still running the legacy Ruby on Rails stack. **It isn't.**

App5 Labs (operating under the Magickbase umbrella) has already shipped a new Rust + Java architecture at `explorer.app5.org`. It launched on testnet around November 2025 and is currently syncing/live on mainnet. The old `explorer.nervos.org` (Rails) is legacy. The new explorer is a fundamentally different beast.

This changes the cost analysis significantly — but doesn't change the conclusion that $20k/month is primarily a staffing cost, not a compute cost.

---

## Executive Summary

App5 Labs has rebuilt the CKB Explorer from scratch in **Rust + Java**, deployed at `explorer.app5.org`. The new architecture is a proper big data platform — Rust for high-performance indexing, Java for API/ecosystem layer, with batch + stream processing, incremental view maintenance, and a layered frontend/API/data architecture. This is the right technical direction.

**The $20k/month cost figure is almost certainly still predominantly staffing, not compute.** The new Rust + Java stack will be significantly cheaper to run than the old Rails stack — Rust services are lightweight, and the architecture is designed for horizontal scaling. But the cost of the *team* maintaining and evolving it doesn't shrink with the infrastructure.

**Key findings:**
- The new explorer is already live: `explorer.app5.org` (mainnet) + `testnet.explorer.app5.org`
- Stack: Rust (core indexing) + Java (API/ecosystem) + TypeScript frontend
- Architecture: big data platform — batch + stream processing, incremental view maintenance
- The explorer is just one application layer on top of a broader data platform
- Infrastructure costs for this stack: **$500–1,500/month** (vs $2,000–4,000 for the old Rails stack)
- The remaining ~$18–19k/month is almost certainly developer salaries + org overhead
- There are now **two explorers**: App5's new one + Magickbase's legacy Rails one (still at nervos.org for now)

---

## 1. The New Architecture

### What App5 Built

From the Reddit post (confirmed):

> *"The refactoring of the underlying framework of the new version of CKB Explorer: from 'Ruby' to 'Rust + Java'"*

> *"Establishes a dual-mode system of batch processing + stream processing to handle data with different attributes separately."*

> *"Adopts a layered architecture of 'Frontend - API Layer - Data Layer' combined with incremental view maintenance"*

> *"From a 'Single Tool' to an 'Ecosystem Data Foundation,' the core architecture of the new CKB Explorer is a big data platform, with the Explorer serving merely as an application layer built upon it."*

This is a proper data platform architecture. The explorer frontend is just one consumer — the same Rust indexing layer can power data reports, indexing services, and API services for wallets and dapps.

### Stack Breakdown

| Layer | Technology | Role |
|---|---|---|
| Core indexing | **Rust** | High-performance block/tx/cell processing |
| API + ecosystem | **Java** | REST/GraphQL API layer, ecosystem compatibility |
| Frontend | **TypeScript/React** | Browser UI (same frontend team as before) |
| Data ingestion | Batch + stream processing | Handles different data velocities separately |
| View layer | Incremental view maintenance | Pre-computed views updated on new blocks |

### Why This Architecture Is Right

**Rust for indexing:** Near-zero memory overhead per connection, no GC pauses, predictable latency. The old Rails blocksyncer was a single-threaded Ruby process. A Rust indexer can process blocks in parallel, handle reorgs cleanly, and run on minimal RAM.

**Java for API:** Java's ecosystem (Spring Boot, Kafka, Flink, etc.) is mature for big data pipelines. JVM tuning is well-understood at scale. The choice makes sense for the "ecosystem data foundation" vision — Java libraries for analytics, reporting, and data APIs are rich.

**Batch + stream separation:** Batch for historical data (fast bulk load), stream for new blocks (low latency updates). This is how Etherscan and major chain explorers operate at scale.

**Incremental view maintenance:** Pre-compute complex aggregations (address balances, token stats, DAO metrics) and update them incrementally rather than recomputing on every query. This is the key to low-cost, low-latency explorer queries at scale.

---

## 2. Infrastructure Cost Estimate (New Stack)

The Rust + Java stack has a fundamentally different resource profile than Rails.

### Rust Indexer Resource Profile
- Typical Rust service memory: **50–200 MB per process** (vs 1–1.8 GB per Rails Puma worker)
- CPU: burst on new blocks, near-zero between blocks (6s block time = mostly idle)
- No GC pauses, predictable latency
- Can run on a single 4-core, 8GB server comfortably at CKB's current volume

### Java API Layer Resource Profile
- Spring Boot service: **256–512 MB per instance** (with JVM tuning)
- Horizontal scaling: easy — stateless API servers behind a load balancer
- JVM warm-up time: 30–60s on cold start (manageable with proper health checks)

### Database
The new architecture likely uses a purpose-built or hybrid storage approach:
- Rust indexer probably writes to **RocksDB** (embedded, zero external dependency) or PostgreSQL
- Java API layer reads from the same store + any pre-computed view tables
- Redis/Memcached still useful for hot query caching

### Revised Cost Estimates

**Option A: Hetzner bare metal (self-hosted)**

| Component | Spec | Monthly |
|---|---|---|
| Indexer server | AX41 (Ryzen 5, 64GB RAM, NVMe) | ~$43 |
| API server | CPX31 (4 vCPU, 8GB cloud) | ~$15 |
| Database | AX41 or managed (Hetzner) | ~$43 |
| Backup storage | 10TB Hetzner storage box | ~$40 |
| Redis (Upstash) | Managed serverless | ~$20 |
| Cloudflare Pages (frontend) | Free | $0 |
| Cloudflare Pro | WAF, DDoS | $25 |
| **Total** | | **~$186/month** |

With redundancy (standby DB, second API server): **~$300/month**
After Hetzner April 2026 price increase (~30%): **~$390/month**

**Option B: Cloud managed (AWS)**

| Component | Spec | Monthly |
|---|---|---|
| EC2 (indexer) | c6g.xlarge (4 vCPU, 8GB) | ~$90 |
| EC2 (API, ×2) | t4g.medium (2 vCPU, 4GB) | ~$50 |
| RDS PostgreSQL | db.t4g.large + 1TB gp3 | ~$350 |
| ElastiCache Redis | cache.t3.small | ~$25 |
| ALB | | ~$25 |
| CloudFront | 5TB egress | ~$425 |
| **Total** | | **~$965/month** |

**Option C: Hybrid community**

| Component | Approach | Monthly |
|---|---|---|
| Hetzner dedicated (indexer + DB) | 1× AX52 | ~$65 |
| Cloud API tier | 2× Hetzner CCX13 (2vCPU, 8GB) | ~$30 |
| Upstash Redis | Managed | ~$20 |
| Cloudflare Pages | Frontend | $0 |
| Cloudflare Pro | WAF | $25 |
| Backup | Storage box | ~$40 |
| **Total** | | **~$180/month** |

### Summary Cost Table (Updated)

| Scenario | Monthly Cost | Notes |
|---|---|---|
| **App5 Labs (reported)** | **~$20,000** | Includes developer salaries + org overhead |
| **Estimated pure App5 infra** | **~$1,500–3,000** | Best guess for their actual compute (new stack) |
| **Option A: Hetzner bare metal** | **~$300–390** | Self-managed, redundant, post-April pricing |
| **Option B: AWS managed** | **~$965–1,500** | Fully managed, multi-AZ |
| **Option C: Hybrid community** | **~$180–300** | Cheapest credible production config |

The new Rust + Java stack reduces infrastructure costs by roughly **3–5× compared to the old Rails stack**. But the conclusion is the same: the $20k/month is overwhelmingly labor, not servers.

---

## 3. The Two-Explorer Situation

There are now two CKB explorers:

| Explorer | URL | Stack | Status |
|---|---|---|---|
| **App5 new** | `explorer.app5.org` | Rust + Java | Live (mainnet syncing) |
| **Magickbase legacy** | `explorer.nervos.org` | Ruby on Rails | Still live (legacy) |

This is temporarily confusing for the community but actually healthy — the new platform is being built and validated alongside the old one rather than a big-bang cutover.

The question of which becomes the "canonical" CKB explorer depends on:
- When App5's new explorer reaches full feature parity
- Whether Nervos Foundation officially redirects `explorer.nervos.org`
- Community adoption and trust

---

## 4. What This Means for Community Hosting

The new Rust + Java stack is **harder to self-host** than the old Rails stack, but for different reasons:

**Easier:**
- Much lower memory requirements
- No complex Ruby gem dependencies
- Rust binary is a single compiled artifact
- Java API can be containerised cleanly

**Harder:**
- The new architecture is proprietary (no public source repo confirmed)
- "Big data platform" implies more moving parts (stream processing, batch jobs, view maintenance)
- Java ecosystem knowledge required for API tier
- Less documentation than the mature Rails app

**Key question:** Is the new App5 explorer open source?

The original `nervosnetwork/ckb-explorer` (Rails) is MIT licensed and fully open. If the new Rust + Java platform is closed source, community hosting of the *new* explorer isn't possible without a rewrite. If App5 open-sources it (they've been community-oriented), it becomes an excellent foundation.

This is the single most important thing to clarify with Matt / App5.

---

## 5. Revised Recommendations

> ⚠️ **Pending confirmation:** App5 has indicated the new platform *should* be open sourced but no public repository has been found as of 2026-03-10. The two paths below branch on this single unknown. Update this section once confirmed.

---

### 🟢 Path A — If Open Source

**Scenario:** App5 publishes the Rust + Java explorer platform publicly (expected based on community signals from Matt).

#### Option A1 (Best): Community mirror on Hetzner
- Deploy the App5 Rust + Java stack on Hetzner dedicated hardware
- Cloudflare Pages for frontend (free)
- Upstash for managed Redis
- **Cost: ~$300–390/month** infrastructure
- **Effort: ~40–80 hours** to stand up + configure
- Fund via Community Fund DAO (~$2,000–2,500/month total including part-time maintenance)
- Pitch: "redundancy and community ownership of critical infrastructure"

#### Option A2: Run just the Rust indexer as a community data layer
- The Rust indexer is the valuable standalone piece — run it independently
- Feed a simpler custom Go/Rust API on top
- Other apps (wallets, dapps, Wyltek mini app) consume this instead of App5's hosted API
- **Cost: ~$150–200/month** (single Hetzner server)
- **Effort: ~100–200 hours** (custom API layer needed)
- Provides independence from App5's hosted endpoints without requiring the full Java stack

#### Contribution path
- Open source → PRs welcome
- Rust indexer improvements align with Phill's skillset
- Earns co-maintainer standing, which is worth more long-term than hosting a fork

---

### 🔴 Path B — If Closed Source

**Scenario:** App5 keeps the new Rust + Java platform proprietary. Community is locked out of the new architecture.

#### Option B1 (Immediate): Fork and self-host the legacy Rails explorer
- `nervosnetwork/ckb-explorer` is MIT licensed — permanently forkable
- Deploy on Hetzner: PostgreSQL + Redis + Puma + Sidekiq
- **Cost: ~$500/month** Hetzner (Rails is heavier than Rust)
- **Effort: ~40–80 hours** initial setup + ongoing Rails maintenance
- Risk: becomes increasingly stale as App5's new explorer diverges from the chain's new features
- Mitigation: community can still submit PRs to the original Rails repo

#### Option B2 (Medium-term): Build a lightweight explorer on ckb-indexer
- `nervosnetwork/ckb-indexer` (Rust, MIT, official) is always available as a data layer
- Build a thin Go or Rust HTTP API on top
- Adapt the existing TypeScript/React frontend
- **Cost: ~$150–200/month** infra, once built
- **Effort: ~400–800 hours** for v1 feature parity
- This path gives the community a fully independent explorer with no dependency on App5 at all
- The right long-term answer if App5 goes dark or pivots away from CKB

#### Key risk if closed source
App5 also operates indexing services and data APIs that wallets and dapps may depend on. If those endpoints are on the same proprietary platform, the ecosystem has a single point of failure. A closed-source explorer is a governance and resilience problem, not just a hosting question.

---

### Community Funding (both paths)
The **CKB Community Fund DAO** is the natural vehicle regardless of path:
- $65k was approved for Rosen protocol integration (Jan 2026) — explorer maintenance is a comparable ask
- Realistic request: **$2,000–3,000/month** (infra + part-time maintainer) for 6-month trial
- At current CKB price (~$0.0015), $3k/month ≈ 2M CKB/month — modest DAO spend
- Framing that works: "community-operated backup and redundancy for critical explorer infrastructure"

---

## 6. Open Questions to Resolve

1. **Is `explorer.app5.org` open source?** — Check App5's GitHub for any new repos
2. **What is the $20k/month breakdown?** — Is it primarily salaries? Is there a Nervos Foundation grant covering it?
3. **Is the Nervos Foundation funding App5 to run the explorer?** — If so, is this sustainable at CKB's current price?
4. **When does the old `explorer.nervos.org` get deprecated?** — Timeline matters for community planning
5. **What does the API surface look like?** — If App5 runs indexing services + data APIs, community dapps might depend on these endpoints

---

*Report v2 produced by Kernel (Wyltek AI Infrastructure Research), 2026-03-10.*  
*Sources: App5 Reddit post `r/NervosNetwork/comments/1posu7o`, Magickbase GitHub org, web search. Pricing from Hetzner/AWS public rate cards.*
