# Research Task: CKB Explorer Alternative Hosting — Cost & Viability Analysis

**Commissioned by:** Phill (Wyltek)  
**Date:** 2026-03-10  
**Priority:** HIGH  
**Output:** Human-readable economic report with real numbers  
**Not part of Wyltek Industries research queue — standalone deliverable**

---

## Background

The CKB blockchain explorer (explorer.nervos.org) is currently operated by App5 Labs (formerly Nervina Labs). The reported operational cost is approximately **$20,000 USD/month**. For context, CKB is a low-market-cap Layer 1 with a relatively small but growing ecosystem.

The question: Is $20k/month justified? What would it cost to run an equivalent explorer using modern infrastructure, and what alternatives exist?

---

## Known Architecture (confirmed from source)

**Stack:**
- Backend: Ruby on Rails (Ruby app)
- DB: PostgreSQL 14
- Cache: Redis 6+ + Memcached  
- Processes: `web` (Puma), `worker` (Sidekiq), `blocksyncer`, `scheduler`, `poolsyncer`
- Frontend: React (separate repo: `nervosnetwork/ckb-explorer-frontend`)
- Docker Compose deployable

**Data scale (as of 2026-03-10):**
- ~18.8 million blocks
- ~6 second block time → ~14,400 new blocks/day
- Typical CKB tx throughput: low currently, but needs to scale for ecosystem growth
- DB size: estimate ~500GB–2TB PostgreSQL (all historical indexed data)

**Scaling characteristics:**
- `web` + `worker`: horizontally scalable
- `blocksyncer` + `scheduler`: singleton (can't scale horizontally)
- Read-heavy workload (explorer queries >> writes)

---

## Research Questions

### 1. What does $20k/month actually buy?
Reverse-engineer what infrastructure at $20k/month looks like:
- AWS/GCP/Azure compute for Rails app servers at this scale
- Managed PostgreSQL at 500GB–2TB
- Redis/Memcached managed services
- CDN for frontend (CloudFront, Cloudflare)
- Load balancers, egress, monitoring
- Ops/DevOps labor (if included in the $20k figure)
- Is $20k reasonable for a managed production deployment? Or is it padded?

### 2. Self-hosted alternatives — real cost breakdown
What would it cost a technically capable team (or community) to run this themselves?

**Option A: Bare metal / colocation**
- Hetzner, OVH, or equivalent dedicated servers
- Spec requirements: estimate based on 18.8M blocks, growing
- DB server: how much RAM, storage, IOPS needed for PG at this scale?
- App servers: Rails is memory-hungry — estimate instance count
- Real monthly cost with reasonable redundancy

**Option B: VPS/cloud (budget cloud)**
- Hetzner Cloud, Vultr, DigitalOcean
- Managed PG options vs self-managed
- Redis hosting costs
- Total at minimal viable production config

**Option C: Hybrid (community nodes + cloud DB)**
- Community-run app servers (like CKB nodes today)
- Centralised managed DB (only component that truly needs it)
- Cloudflare Pages for frontend (free)
- What's the irreducible infrastructure cost?

### 3. Technology alternatives — could a rewrite reduce costs?
- Is Ruby on Rails the right choice for a blockchain explorer in 2026?
- Go/Rust alternatives: lighter memory footprint, better raw throughput
- Existing open-source explorers for other chains that could be adapted:
  - Blockscout (Ethereum — Go/Elixir)
  - Otterscan (Ethereum — lightweight)
  - Any RISC-V/CKB-specific indexers in development?
- Would a GraphQL indexer approach (like The Graph, but self-hosted) reduce infra needs?
- **CKB Light Client angle**: can a light-client-aware explorer serve some queries without full node?

### 4. Traffic and throughput requirements
- What is the current explorer traffic? (Estimate from public signals — Similarweb, etc.)
- What does 10x ecosystem growth look like in terms of infrastructure demand?
- At what TPS does the current architecture become a bottleneck?
- CDN cache hit ratio matters hugely for read-heavy explorers — what % of requests can be cached?

### 5. Community/decentralised hosting model
- Could the explorer be run as a community project with distributed funding?
- Nervos DAO treasury: is funding community infra a valid use?
- Precedent from other chains (Etherscan vs community alternatives, etc.)
- What's the minimum viable "community explorer" that covers 80% of use cases?

### 6. Specific cost line items to research
- PostgreSQL at ~1TB: managed (AWS RDS, Supabase, Neon) vs self-hosted cost comparison
- Redis: managed vs self-hosted at this scale
- Rails app server memory profile: how many GB per worker process?
- Egress costs: blockchain explorers serve a lot of data — what's realistic monthly egress?
- Monitoring/alerting: Datadog vs self-hosted (Prometheus/Grafana)

---

## Deliverable Format

Human-readable report with:
1. **Executive summary** (is $20k justified? what's the real number?)
2. **Architecture analysis** (what the current setup needs to run)
3. **Cost comparison table** (current vs Option A/B/C)
4. **Technology alternatives** (rewrite vs adapt)
5. **Community hosting model** (feasibility + funding path)
6. **Recommendation** (what Phill/Wyltek would actually build if taking this on)

Target: a document you could share in the Nervos community Discord to start a real conversation.

---

## Seeds / Starting Points

- Repo: https://raw.githubusercontent.com/nervosnetwork/ckb-explorer/master/README.md
- Docker compose: https://raw.githubusercontent.com/nervosnetwork/ckb-explorer/master/docker-compose.yml
- Frontend repo: https://github.com/nervosnetwork/ckb-explorer-frontend
- Hetzner pricing: https://www.hetzner.com/dedicated-rootserver/matrix-ax/
- Hetzner Cloud DB: https://www.hetzner.com/cloud/
- Supabase pricing (managed PG): https://supabase.com/pricing
- Neon pricing (serverless PG): https://neon.tech/pricing
- AWS RDS PostgreSQL pricing calculator reference
- Similarweb for explorer.nervos.org traffic estimate
- Blockscout (alternative explorer): https://github.com/blockscout/blockscout
- CKB indexer (alternative backend): https://github.com/nervosnetwork/ckb-indexer
