# Lecto Translation Bot — Cost Analysis

## Build & Deployment Cost

### Cloudflare Workers (FREE tier)
- 100,000 requests/day free
- Typical usage: 1-2 requests per translate operation
- **Cost: $0** (well under free tier)

### Cloudflare KV (FREE tier)
- 1,000 read/write ops/day free
- Storing temp source text + API key + whitelist
- ~10-20 ops per translate cycle
- **Cost: $0** (well under free tier)

### Lecto.ai API
**Pricing:** $0.0001 per character translated (as of API docs)

**Typical usage per translate:**
- Input: English text ~100 characters
- Output: 1 target language translation ~100 characters
- Per translate: ~200 characters = **$0.00002**

**Monthly estimate (conservative):**
- 100 translations/month = **$0.002** (~0.2 cents)
- 1000 translations/month = **$0.02** (~2 cents)

### Total Monthly Cost
- Workers: $0
- KV: $0
- Lecto: ~$0.02 for 1000 translations
- **Total: essentially free** (sub-$1/month even at heavy usage)

## Build Time
- Full implementation: ~2 hours
- Type-safe, production-ready, all features
- Single Worker file (250 lines max)
- Testing: manual via Telegram (5 min)

## Summary for Phill
✅ **Cost: negligible** (free tier coverage, <$1/month at scale)
✅ **Build time: ~2 hours**
✅ **Deployment: 1 wrangler command**
