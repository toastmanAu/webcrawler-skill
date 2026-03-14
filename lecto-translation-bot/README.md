# Lecto Translation Bot

Production-ready Telegram translation bot on Cloudflare Workers.

## Features

- ✅ **Reply + /translate workflow** — Reply to any message, tap /translate, pick language
- ✅ **15 languages** with emoji flags and pagination
- ✅ **Owner-only admin controls** — API key setup, group whitelisting
- ✅ **Group whitelisting** — /allowgroup, /disallowgroup, /groups
- ✅ **Lecto.ai integration** — Fast, accurate translations
- ✅ **Temp storage in KV** — Source text cached during translation (5min TTL)
- ✅ **Type-safe TypeScript** — Full Telegram API typing
- ✅ **Zero cost** — Free Cloudflare tier (100k req/day, 1k KV ops/day)

## Tech Stack

- **Cloudflare Workers** — Serverless compute
- **TypeScript** — Type safety
- **Itty Router** — Lightweight HTTP routing
- **Cloudflare KV** — State storage
- **Telegram Bot API** — Webhook mode
- **Lecto.ai API** — Translation service

## Quick Start

### 1. Prerequisites

```bash
npm install -g wrangler
# Ensure you have a Cloudflare account
```

### 2. Clone & Install

```bash
cd lecto-translation-bot
npm install
```

### 3. Create Telegram Bot

1. Talk to [@BotFather](https://t.me/botfather) on Telegram
2. Create a new bot: `/newbot`
3. Note the bot token (e.g., `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)
4. Set commands (copy from `BOTFATHER-COMMANDS.txt`):
   ```
   /start - Start the bot
   /translate - Translate replied message
   /setkey - Set Lecto API key (owner only)
   /allowgroup - Whitelist this group
   /disallowgroup - Remove group whitelist
   /groups - List whitelisted groups
   ```

### 4. Get Lecto API Key

1. Sign up at https://lecto.ai/
2. Go to API settings
3. Copy your API key

### 5. Get Your Telegram ID

Send any message to [@userinfobot](https://t.me/userinfobot) to get your numeric user ID.

### 6. Create KV Namespace

```bash
wrangler kv:namespace create "KV_STORE"
# Note the namespace ID from output
```

### 7. Configure wrangler.toml

Edit `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "KV_STORE"
id = "YOUR_KV_NAMESPACE_ID"

[env.production.vars]
TELEGRAM_BOT_TOKEN = "your_bot_token_here"
TELEGRAM_OWNER_ID = "your_numeric_id_here"
LECTO_API_KEY = "your_lecto_api_key_here"
```

### 8. Deploy

```bash
wrangler deploy --env production
```

This outputs your Worker URL, e.g., `https://lecto-bot.your-account.workers.dev`

### 9. Set Webhook

Replace `YOUR_BOT_TOKEN` and `YOUR_WORKER_URL`:

```bash
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook?url=YOUR_WORKER_URL/webhook"
```

Example:
```bash
curl "https://api.telegram.org/bot123456:ABC-DEF1234/setWebhook?url=https://lecto-bot.my-account.workers.dev/webhook"
```

Verify webhook is set:
```bash
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/getWebhookInfo"
```

### 10. Test

1. Send `/start` to your bot on Telegram
2. Reply to any message with `/translate`
3. Tap a language — translation appears in chat

## Usage

### User Commands

- `/start` — Show welcome message
- `/translate` — Translate replied message (must reply to text message first)

### Owner Commands (private chat only)

- `/setkey <api_key>` — Store Lecto API key in KV (override env variable)
- `/allowgroup` — Run in a group to whitelist it
- `/disallowgroup` — Remove group from whitelist
- `/groups` — Show whitelisting status (limited by KV design)

### Group Usage

1. Owner runs `/allowgroup` in the group once
2. Any group member can reply to messages and use `/translate`
3. Owner can `/disallowgroup` to revoke access

## File Structure

```
src/index.ts          — Main Worker code (400 lines, fully typed)
package.json          — Dependencies
wrangler.toml         — Cloudflare config
tsconfig.json         — TypeScript config
README.md             — This file
BOTFATHER-COMMANDS.txt — BotFather command list
DEPLOYMENT.md         — Detailed deployment guide
```

## Code Highlights

### Type Safety

```typescript
interface TelegramUpdate { /* ... */ }
interface TelegramMessage { /* ... */ }
interface TelegramCallbackQuery { /* ... */ }
```

Every Telegram API call is fully typed.

### Language Pagination

```typescript
const LANGS_PER_PAGE = 5;
function buildLanguageKeyboard(page = 0) { /* ... */ }
```

15 languages split across paginated inline keyboards.

### Temp Storage

```typescript
const storeKey = `translate_${chatId}_${messageId}`;
await env.KV_STORE.put(storeKey, sourceText, { expirationTtl: 300 });
```

Source text cached in KV with 5-minute auto-expiry.

### MarkdownV2 Escaping

```typescript
function escapeMarkdown(text: string): string {
  // Safely escape special chars for Telegram MarkdownV2
}
```

Prevents injection and formatting issues.

## Cost Breakdown

| Service | Free Tier | Usage | Cost |
|---------|-----------|-------|------|
| Cloudflare Workers | 100k req/day | ~2 req per translate | $0 |
| Cloudflare KV | 1k ops/day | ~10 ops per translate | $0 |
| Lecto.ai | — | $0.0001 per char | ~$0.02/1000 translates |
| **Total** | — | — | **~$0.02/month** |

## Limitations & Design Notes

1. **KV no list operation** — `/groups` can't enumerate whitelisted groups dynamically. Workaround: track in a separate list key (optional enhancement).
2. **No message editing after translate** — Result sends as a new message. Telegram doesn't allow editing messages sent by webhooks easily.
3. **Single language per translate** — Each callback does one translation. Multi-language requires separate clicks (keeps it simple).
4. **TTL on source text** — Translations must happen within 5 minutes of replying. Prevents data bloat in KV.
5. **No user auth beyond owner ID** — Groups are whitelisted as a whole; no per-user permissions within groups.

## Troubleshooting

### "Translation failed"
- Check Lecto API key is valid
- Verify text is not empty
- Check Lecto API status

### "This group is not whitelisted"
- Owner must run `/allowgroup` in the group first
- Verify group ID is being stored correctly (check KV in Cloudflare dashboard)

### Webhook errors
- Verify webhook URL is correct: `https://api.telegram.org/botTOKEN/getWebhookInfo`
- Check Worker logs in Cloudflare dashboard
- Ensure TELEGRAM_BOT_TOKEN is set in wrangler.toml

### No response from bot
- Check Worker is deployed: `wrangler deployments list`
- Verify webhook is set
- Check CloudFlare Worker logs for errors

## Enhancements (Future)

- [ ] Multi-language translate (pick multiple languages)
- [ ] Translation history in private chat
- [ ] Cost tracking per user
- [ ] Language preference per user
- [ ] Bulk file translation (documents)

## License

MIT

---

**Built for production. Deploy with confidence.** 🚀
