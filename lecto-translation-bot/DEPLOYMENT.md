# Lecto Bot — Deployment Guide

## Step-by-Step

### 1. Cloudflare Setup

Ensure you have a Cloudflare account. If not, sign up at https://dash.cloudflare.com/

### 2. Install Wrangler

```bash
npm install -g wrangler
wrangler login
# Opens browser to authenticate
```

### 3. Clone the Project

```bash
git clone <repo-url> lecto-translation-bot
cd lecto-translation-bot
npm install
```

### 4. Create Telegram Bot

1. Open Telegram and find [@BotFather](https://t.me/botfather)
2. Send `/newbot`
3. Follow prompts:
   - **Bot name:** e.g., "Lecto Bot"
   - **Username:** e.g., @lecto_translation_bot (must end with _bot)
4. BotFather returns a token: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`
5. Copy and save this token

### 5. Set Bot Commands

Still in BotFather, send `/setcommands` and paste:

```
start - Start the bot
translate - Translate replied message
setkey - Set Lecto API key (owner only)
allowgroup - Whitelist this group
disallowgroup - Remove group whitelist
groups - List whitelisted groups
```

### 6. Get Your Telegram ID

Send any message to [@userinfobot](https://t.me/userinfobot) on Telegram. It replies with your numeric user ID (e.g., `1234567890`).

### 7. Get Lecto API Key

1. Go to https://lecto.ai/
2. Sign up (free tier available)
3. Go to Account → API Keys
4. Create or copy your API key
5. Save it securely

### 8. Create KV Namespace

```bash
wrangler kv:namespace create "KV_STORE"
```

Output includes the namespace ID:
```
id = "abcdef1234567890abcdef1234567890"
```

Save this ID.

### 9. Configure wrangler.toml

Edit `wrangler.toml` and replace placeholders:

```toml
name = "lecto-translation-bot"
main = "src/index.ts"
compatibility_date = "2024-06-12"

[[kv_namespaces]]
binding = "KV_STORE"
id = "YOUR_KV_NAMESPACE_ID_HERE"

[env.production]
name = "lecto-translation-bot"

[env.production.kv_namespaces]
KV_STORE = { id = "YOUR_KV_NAMESPACE_ID_HERE" }

[env.production.vars]
TELEGRAM_BOT_TOKEN = "YOUR_TELEGRAM_BOT_TOKEN_HERE"
TELEGRAM_OWNER_ID = "YOUR_NUMERIC_TELEGRAM_ID_HERE"
LECTO_API_KEY = "YOUR_LECTO_API_KEY_HERE"
```

Example:
```toml
[env.production.vars]
TELEGRAM_BOT_TOKEN = "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
TELEGRAM_OWNER_ID = "1234567890"
LECTO_API_KEY = "sk_live_12345678901234567890abcdefghij"
```

### 10. Deploy to Cloudflare

```bash
wrangler deploy --env production
```

Output shows your Worker URL:
```
Uploaded lecto-translation-bot (0.50 sec)
https://lecto-translation-bot.your-account-name.workers.dev
```

Save this URL.

### 11. Set Telegram Webhook

Use the Worker URL from step 10. Run:

```bash
curl "https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/setWebhook?url={WORKER_URL}/webhook"
```

Replace `{TELEGRAM_BOT_TOKEN}` and `{WORKER_URL}`:

```bash
curl "https://api.telegram.org/bot123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11/setWebhook?url=https://lecto-translation-bot.your-account-name.workers.dev/webhook"
```

Success response:
```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

### 12. Verify Webhook

```bash
curl "https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getWebhookInfo"
```

Should show:
```json
{"ok":true,"result":{"url":"https://lecto-translation-bot.../webhook","has_custom_certificate":false,"pending_update_count":0}}
```

### 13. Test the Bot

1. Open Telegram
2. Find your bot by username (e.g., @lecto_translation_bot)
3. Send `/start` — should respond with welcome
4. Reply to a message and send `/translate` — should show language picker
5. Tap a language — should show translation

## Troubleshooting

### Webhook not responding

Check your Worker is deployed:
```bash
wrangler deployments list --env production
```

Check logs:
```bash
wrangler tail --env production
```

### Bot not responding to /translate

1. Verify you're the owner (used your numeric ID in setup)
2. Make sure you're replying to a text message
3. Check KV namespace is created and ID is correct

### Lecto translation fails

1. Verify API key is correct in `wrangler.toml`
2. Test API key directly:
   ```bash
   curl -X POST https://api.lecto.ai/v1/translate/text \
     -H "X-API-Key: YOUR_KEY" \
     -H "Content-Type: application/json" \
     -d '{"texts":["Hello"],"to":["es"]}'
   ```
3. Check Lecto API status

### KV issues

List all KV namespaces:
```bash
wrangler kv:namespace list
```

View KV data in Cloudflare dashboard:
1. Log in to https://dash.cloudflare.com/
2. Workers & Pages → KV
3. Find your namespace
4. Browse keys

### Permission denied on deploy

```bash
wrangler login
# Logs out and back in
wrangler deploy --env production
```

## Monitoring

### View Recent Logs

```bash
wrangler tail --env production
```

### Check KV Usage

Cloudflare Dashboard → Workers & Pages → KV → Your Namespace

### Monitor Costs

Cloudflare Dashboard → Billing

(Should be free tier — 100k requests/day and 1k KV ops/day)

## Next Steps

1. **Keep API key secure** — Don't commit `wrangler.toml` to public repos
2. **Enable group translations** — Owner must run `/allowgroup` in each group first
3. **Set API key via bot** — In private chat, owner can use `/setkey <key>` instead of editing `wrangler.toml` (overrides env var)
4. **Monitor usage** — Track translations in KV dashboard to watch costs

## Advanced: Update Code

To make changes:

```bash
# Edit src/index.ts
npm run build
wrangler deploy --env production
```

## Support

- Telegram Bot API Docs: https://core.telegram.org/bots/api
- Cloudflare Workers Docs: https://developers.cloudflare.com/workers/
- Lecto API Docs: https://lecto.ai/docs/

---

**Deployment complete!** 🚀
