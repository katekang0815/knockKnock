/**
 * knockKnock AI proxy (Cloudflare Worker, KV-only).
 *
 * Purpose:
 *  - Hide the Anthropic API key (kept as a Worker secret, never in the app bundle).
 *  - Validate/clamp each request so a leaked proxy URL can't be used as a free
 *    general-purpose Claude endpoint.
 *  - Enforce a soft per-device daily check-in cap and a hard global daily
 *    circuit breaker that bounds worst-case spend.
 *
 * Storage: a single KV namespace bound as `RL`. Counters are keyed by day and
 * auto-expire. KV is eventually consistent, so the caps are approximate — good
 * enough for soft rate limiting; the global breaker is the real cost ceiling.
 */

export interface Env {
  RL: KVNamespace;
  ANTHROPIC_API_KEY: string;
}

// ---- Tunable limits -------------------------------------------------------

// Only this model may be called (prevents someone requesting a pricier model).
const ALLOWED_MODEL = 'claude-haiku-4-5-20251001';
// Hard ceiling on output tokens regardless of what the client asks for.
const MAX_OUTPUT_TOKENS = 300;
// Reject oversized request bodies (rough guard against prompt-stuffing abuse).
const MAX_BODY_CHARS = 24000;
// Soft: distinct check-ins (sessions) allowed per device per day.
const PER_DEVICE_DAILY_CHECKINS = 5;
// Hard: total upstream calls per day. ~$5/day at ~$0.003/call on Haiku 4.5.
// Tune this one line to raise/lower the worst-case daily bill.
const GLOBAL_DAILY_CALL_CAP = 1600;

// Keep counters around for 2 days so day-boundary reads stay sane.
const COUNTER_TTL_SECONDS = 172800;

// ---------------------------------------------------------------------------

function json(status: number, obj: unknown): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json', ...CORS },
  });
}

// Permissive CORS so Expo web dev works too; a native app ignores this.
const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-device-id, x-session-id',
};

function today(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }
    if (request.method !== 'POST') {
      return json(405, { error: 'method_not_allowed' });
    }

    const deviceId = request.headers.get('x-device-id');
    if (!deviceId) return json(400, { error: 'missing_device_id' });
    const sessionId = request.headers.get('x-session-id') || 'nosession';

    // Parse + size-guard the body.
    let body: any;
    try {
      body = await request.json();
    } catch {
      return json(400, { error: 'bad_json' });
    }
    if (!body || !Array.isArray(body.messages)) {
      return json(400, { error: 'bad_messages' });
    }

    // Rebuild an allow-listed body: force the model, clamp tokens, drop extras.
    const maxTokens = Math.min(
      Math.max(1, Number(body.max_tokens) || 150),
      MAX_OUTPUT_TOKENS,
    );
    const forwardBody = {
      model: ALLOWED_MODEL,
      max_tokens: maxTokens,
      system: body.system,
      messages: body.messages,
    };
    const forwardRaw = JSON.stringify(forwardBody);
    if (forwardRaw.length > MAX_BODY_CHARS) {
      return json(413, { error: 'too_large' });
    }

    const day = today();

    // --- Global daily circuit breaker (hard cap) ---
    const gKey = `global:${day}`;
    const gCount = parseInt((await env.RL.get(gKey)) || '0', 10);
    if (gCount >= GLOBAL_DAILY_CALL_CAP) {
      return json(503, { error: 'global_cap' });
    }

    // --- Per-device daily check-in cap (soft) ---
    // A check-in = one session id. All calls within an already-counted session
    // pass; only the first call of a new session consumes a check-in.
    const seenKey = `seen:${deviceId}:${sessionId}`;
    const alreadyCounted = await env.RL.get(seenKey);
    if (!alreadyCounted) {
      const dKey = `checkins:${deviceId}:${day}`;
      const dCount = parseInt((await env.RL.get(dKey)) || '0', 10);
      if (dCount >= PER_DEVICE_DAILY_CHECKINS) {
        return json(429, { error: 'device_cap' });
      }
      await env.RL.put(dKey, String(dCount + 1), { expirationTtl: COUNTER_TTL_SECONDS });
      await env.RL.put(seenKey, '1', { expirationTtl: COUNTER_TTL_SECONDS });
    }

    // --- Forward to Anthropic with the secret key ---
    let upstream: Response;
    try {
      upstream = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: forwardRaw,
      });
    } catch {
      return json(502, { error: 'upstream_unreachable' });
    }

    // Count the call against the global cap (approximate under KV consistency).
    await env.RL.put(gKey, String(gCount + 1), { expirationTtl: COUNTER_TTL_SECONDS });

    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { 'content-type': 'application/json', ...CORS },
    });
  },
};
