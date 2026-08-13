# knockKnock AI proxy

A tiny Cloudflare Worker that sits between the app and the Anthropic API. It:

- **Hides the API key** — the key is a Worker secret, never shipped in the app bundle.
- **Validates & clamps requests** — forces the Haiku 4.5 model, caps `max_tokens` (≤300),
  rejects oversized bodies, and drops unexpected fields, so a leaked proxy URL can't be
  used as a free general-purpose Claude endpoint.
- **Rate limits** — a soft per-device cap of **5 check-ins/day** and a hard global daily
  circuit breaker (**~$5/day**, `GLOBAL_DAILY_CALL_CAP = 1600` calls) that bounds spend.

All limits are constants at the top of [`src/index.ts`](src/index.ts) — tune them there.

## Deploy (one time)

```sh
cd worker
npm install

# 1. Log in to Cloudflare
npx wrangler login

# 2. Create the KV namespace, then paste the printed id into wrangler.toml
npx wrangler kv namespace create RL

# 3. Store the Anthropic API key as a secret (paste the key when prompted)
npx wrangler secret put ANTHROPIC_API_KEY

# 4. Deploy — note the printed https://knockknock-ai-proxy.<subdomain>.workers.dev URL
npx wrangler deploy
```

## Point the app at the proxy

In the app root `.env`:

```
EXPO_PUBLIC_AI_PROXY_URL=https://knockknock-ai-proxy.<subdomain>.workers.dev
```

Then restart Expo. When `EXPO_PUBLIC_AI_PROXY_URL` is set, the app routes all AI calls
through the proxy and sends **no** API key. For production builds, remove
`EXPO_PUBLIC_ANTHROPIC_API_KEY` from `.env` entirely so it never enters the bundle.

Leaving `EXPO_PUBLIC_AI_PROXY_URL` unset keeps the old direct-to-Anthropic behavior
(handy for local dev).

## Rate-limit responses

- `429 {"error":"device_cap"}` — this device hit 5 check-ins today.
- `503 {"error":"global_cap"}` — the global daily cap was reached.

The app maps both to a gentle "try again later" message.

## Local test

```sh
npx wrangler dev   # runs the worker locally; set the secret via a .dev.vars file:
# .dev.vars  ->  ANTHROPIC_API_KEY=sk-ant-...
```

## Note on limits

KV is eventually consistent, so the counters are approximate — fine for soft rate
limiting. The global breaker is the real cost guarantee. For strict per-request
accuracy you'd move the counters to a Durable Object (needs the paid Workers plan).
