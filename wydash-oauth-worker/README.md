# wydash-oauth Cloudflare Worker

Swaps GitHub OAuth `code` → `access_token` server-side (required — GitHub won't accept this from a browser).

## Setup

### 1. Register GitHub OAuth App
1. https://github.com/settings/developers → OAuth Apps → New OAuth App
2. Fill in:
   - Name: `WyDash Issue Reporter`
   - Homepage: your WyDash URL (e.g. `http://192.168.68.98:9999`)
   - Callback URL: `http://192.168.68.98:9999/report.html`
3. Copy **Client ID** and generate **Client Secret**

### 2. Deploy the worker
```bash
cd wydash-oauth-worker
npm install -g wrangler   # if not installed
wrangler login
wrangler deploy
```

### 3. Set secrets
```bash
wrangler secret put GH_CLIENT_ID
# paste client ID when prompted

wrangler secret put GH_CLIENT_SECRET
# paste client secret when prompted
```

### 4. Update report.html
Set `OAUTH_WORKER_URL` at the top of `report.html`:
```js
const OAUTH_WORKER_URL = 'https://wydash-oauth.YOUR-SUBDOMAIN.workers.dev';
```
And set `CLIENT_ID`:
```js
const clientId = 'YOUR_CLIENT_ID_HERE';
```

### 5. Add your WyDash origin to wrangler.toml
```toml
ALLOWED_ORIGINS = "http://192.168.68.98:9999,http://your-other-wydash:9999"
```

## Worker endpoint
- `GET /token?code=XXX` → exchanges code, returns `{ access_token, scope }`
- `GET /` → health check `{ ok: true }`
