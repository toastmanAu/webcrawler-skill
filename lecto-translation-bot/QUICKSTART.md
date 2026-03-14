# Lecto Bot — Quick Start (5 Min Setup)

## Before You Return

**What you need to provide:**
1. Telegram Bot Token (from @BotFather)
2. Lecto API Key (from lecto.ai)
3. Your Telegram numeric ID (from @userinfobot)

## When You're Back

### Step 1: Install & Setup (3 minutes)

```bash
cd /home/phill/.openclaw/workspace/lecto-translation-bot
npm install
wrangler kv:namespace create "KV_STORE"
# Note the namespace ID from output
```

### Step 2: Configure (2 minutes)

Edit `wrangler.toml`:

```toml
[env.production.vars]
TELEGRAM_BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"
TELEGRAM_OWNER_ID = "YOUR_NUMERIC_ID_HERE"
LECTO_API_KEY = "YOUR_LECTO_KEY_HERE"

[env.production.kv_namespaces]
KV_STORE = { id = "YOUR_KV_NAMESPACE_ID" }
```

### Step 3: Deploy (1 minute)

```bash
wrangler deploy --env production
# Outputs: https://lecto-translation-bot.YOUR-ACCOUNT.workers.dev
```

### Step 4: Set Webhook (1 minute)

```bash
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook?url=YOUR_WORKER_URL/webhook"
```

### Done! Test It

- Send `/start` to your bot
- Reply to any message and send `/translate`
- Pick a language — bot translates

**Total time: 5-10 minutes**

See `DEPLOYMENT.md` for detailed steps.
