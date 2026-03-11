/**
 * wydash-oauth — Cloudflare Worker
 * Swaps GitHub OAuth code → access token (can't do this client-side)
 * 
 * Deploy:
 *   wrangler deploy
 * 
 * Secrets (set via wrangler secret put):
 *   GH_CLIENT_ID      — GitHub OAuth App client ID
 *   GH_CLIENT_SECRET  — GitHub OAuth App client secret
 * 
 * Env vars in wrangler.toml:
 *   ALLOWED_ORIGINS   — comma-separated list of allowed origins (your WyDash IPs)
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';

    // CORS — allow any origin (worker only swaps code→token, secrets stay server-side)
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (url.pathname === '/token') {
      const code = url.searchParams.get('code');
      if (!code) {
        return new Response(JSON.stringify({ error: 'missing code' }), {
          status: 400, headers: { ...cors, 'Content-Type': 'application/json' }
        });
      }

      // Exchange code for token with GitHub
      const ghRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          client_id:     env.GH_CLIENT_ID,
          client_secret: env.GH_CLIENT_SECRET,
          code,
        }),
      });

      const data = await ghRes.json();

      if (data.error) {
        return new Response(JSON.stringify({ error: data.error, description: data.error_description }), {
          status: 400, headers: { ...cors, 'Content-Type': 'application/json' }
        });
      }

      // Return just the token (don't expose secret to client)
      return new Response(JSON.stringify({ access_token: data.access_token, scope: data.scope }), {
        status: 200, headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ ok: true, service: 'wydash-oauth' }), {
      status: 200, headers: { ...cors, 'Content-Type': 'application/json' }
    });
  }
};
