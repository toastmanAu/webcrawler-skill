# Free Agent Kit — Zero-Cost OpenClaw Deployment

Deploy a fully functional OpenClaw agent on any Pi (or cheap VPS) using
**only free model sources**. No credit card, no API billing.

## What you get

- Full OpenClaw agent with tool access (read/write/exec/web search)
- HuggingFace Inference free tier as primary (DeepSeek V3.2, Llama 3.3 70B, etc.)
- Telegram as the channel (free bot token)
- Heartbeat monitoring, memory, cron — everything works
- Tested on: Pi 3B+ (1GB RAM), Pi 4 (2GB), Orange Pi 3B (8GB)

## Minimum hardware

| Board | RAM | Works? | Notes |
|---|---|---|---|
| Pi Zero 2W | 512MB | ⚠️ | Tight — swap required, slow |
| Pi 3B/3B+ | 1GB | ✅ | Needs swap, single agent only |
| Pi 4 2GB | 2GB | ✅ | Comfortable |
| Pi 4 4GB+ | 4GB+ | ✅ | Plenty of room |
| Orange Pi 3B | 8GB | ✅ | Runs fine alongside other services |

## Quick start (5 minutes)

```bash
# 1. Install OpenClaw
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash

# 2. Get a free HuggingFace token
# → https://huggingface.co/settings/tokens
# → New token → Fine-grained → "Make calls to Inference Providers" ✓
# → Copy the hf_xxx token

# 3. Run this setup script
bash setup.sh YOUR_HF_TOKEN YOUR_TELEGRAM_BOT_TOKEN
```

That's it. The agent starts automatically and connects to Telegram.

## Files in this kit

- `setup.sh` — automated setup script
- `openclaw-free.json` — the config (merged into openclaw.json by setup.sh)
- `workspace/` — pre-seeded agent workspace files

## Free model sources

| Provider | Auth needed | Models | Limits |
|---|---|---|---|
| HuggingFace router | Free token (no billing) | DeepSeek V3.2, Llama 3.3 70B, Qwen3 32B | Rate limited at peak |
| Qwen Portal | OAuth login (device code) | Qwen Coder, Qwen Vision | 2,000 req/day |
| Gemini CLI | Google account (OAuth) | Gemini 2.5 Pro, 2.0 Flash | Personal quota |

## Notes

- No image *generation* (Gemini CLI can *analyse* images)
- Brave Search API key for web search is also free (1,000 searches/day free tier)
  → https://api.search.brave.com/app/keys
- The agent is smart enough to route heavy tasks to stronger models in fallback
