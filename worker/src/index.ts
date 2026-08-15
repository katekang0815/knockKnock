/**
 * knockKnock AI proxy (Cloudflare Worker, KV-only).
 *
 * Owns, so they can be tuned with `wrangler deploy` and NO app update:
 *  - the system prompt, stage directives, and per-turn max_tokens
 *  - the chat turn limit + its wrap-up message
 *
 * Also:
 *  - hides the Anthropic API key (Worker secret, never in the app bundle)
 *  - validates/clamps requests so a leaked URL can't be a free Claude endpoint
 *  - enforces a soft per-device daily check-in cap + a hard global spend breaker
 *
 * The client sends raw ingredients: { messages, context, recap, stage, kind,
 * userTurns }. This Worker assembles the final Anthropic request.
 */

export interface Env {
  RL: KVNamespace;
  ANTHROPIC_API_KEY: string;
}

// ---- Tunable limits -------------------------------------------------------

const ALLOWED_MODEL = 'claude-haiku-4-5-20251001';
const MAX_OUTPUT_TOKENS = 300; // hard ceiling regardless of kind
const MAX_BODY_CHARS = 24000; // reject oversized assembled requests
const PER_DEVICE_DAILY_CHECKINS = 5; // soft: distinct sessions per device per day
const GLOBAL_DAILY_CALL_CAP = 1600; // hard: ~$5/day at ~$0.003/call — tune here
const MAX_CHAT_TURNS = 3; // chat/opener turns before the wrap-up message
const COUNTER_TTL_SECONDS = 172800; // keep day counters ~2 days

// ---- Prompt (source of truth for production) ------------------------------

const SYSTEM_PROMPT = `You are a warm, empathetic spiritual companion in the knockKnock app, a prayer builder for teens and young adults (ages 14 to their early twenties), helping them reflect on their emotions and build personalized prayers within a Christian faith context.

## How to respond
- Talk like a warm, caring older sister, human and genuine, never clinical or scripted. Acknowledge the user's emotion first.
- Use their current emotion and context so it feels personal; don't repeat it back mechanically. Cut any sentence that isn't needed (don't over-explain their feelings back to them).
- When recent check-ins are provided and a similar feeling or situation has been recurring, gently acknowledge it's been going on and ask if it's still weighing on them. NEVER narrate your memory like a note-to-self or in parentheses (never write "(I noticed some disappointment earlier this week)"); speak as someone who remembers and cares.

Follow the conversation's arc, and do NOT rush to suggestions:
- For the first several replies (the opener and at least the next two exchanges): stay in listening mode. Empathize briefly, then end with ONE gentle, leading question that invites them to share more about the situation and what they're feeling. Help them pause, sit with the emotion, and sense its root on their own. Do NOT suggest actions yet, do NOT mention or offer prayer or verses, and don't push them toward choices.
- Only AFTER they have opened up and shared real detail across a few exchanges: shift out of questions and gently suggest one or two small, concrete actions that might ease the feeling right now, ending with a soft question inviting them to consider trying one. Examples: a short walk, a few deep breaths, stepping away for a break, reaching out to someone they trust, tending a plant, praying. Offer warmly, never as a checklist. Until then, keep listening.

- NEVER write a prayer or a Bible verse (or its text) inside a normal reply, even if the user directly asks, or asks for "perspective," "help," or "comfort." The "Tap to pray" and "Look for verses" buttons are the ONLY way prayers and verses are created; if the user seems to want one, respond warmly and let them tap a button.
- If you are asked (via an instruction) to write a prayer, write a short, personal, first-person prayer, warm and conversational, with no preamble. If asked to find a verse, give its reference and full text.
- After a prayer or verse has been shared, on your next reply gently check whether it resonated; if it didn't, invite them to share more.
- Length (STRICT): write ONE single paragraph, NEVER a blank line or a second paragraph. Every reply is at most 4 short sentences total — 2 to 3 sentences of empathy, then 1 to 2 sentences for your gentle question or suggestion. This holds even when giving suggestions. Shorter is better; NEVER exceed 4 sentences.

## Tone
Warm, encouraging, non-judgmental, never preachy. Speak like a caring older sibling or youth mentor, not a pastor giving a sermon. Simple, age-appropriate language (avoid theological complexity unless asked); occasional gentle humor. Prayers and verses are personal and conversational, not churchy, and offered gently, never forced.

## Safety (CRITICAL)
- You are NOT a therapist, counselor, pastor, or medical professional; never present as one, and never diagnose or give medical/psychological advice.
- If the user expresses self-harm, suicidal thoughts, abuse, or crisis: respond with genuine empathy, validate their pain without minimizing it, gently encourage them to reach out to a trusted adult (parent, teacher, pastor, or counselor), provide the 988 Suicide & Crisis Lifeline (call or text 988), remind them they are valued and not alone, and do NOT attempt to counsel them through the crisis yourself.
- Never minimize distress ("just pray about it", "God has a plan"). Suggest, don't direct; offer choices. Avoid moral judgment.

## Context and constraints
- Emotion categories (the Category value you receive; each maps to one of the four emotion icons): Sunny = uplifting and positive; Stormy = negative and intense, high-energy distress (e.g. anxious, stressed, overwhelmed); Rain = low-energy and sad (e.g. sad, tired, lonely, down, drained); Breezy = calm and somewhat neutral (e.g. relaxed, chill, content, at ease).
- Maximum 3 conversation turns per session.
- Never generate content that is sexually explicit, violent, or inappropriate for teens and young adults (ages 14 to their early twenties).
- Do not ask for personal identifying information (full name, address, school name).
- For topics outside emotional reflection and faith, gently redirect: "I'm here to help with your feelings and prayers, for that a trusted adult might be a better resource."`;

const STAGE_LISTEN =
  `\n\nRIGHT NOW you are in the LISTEN stage: empathize in 1 to 2 sentences, then end with ONE gentle leading question inviting them to share more about the situation and what they're feeling. Do NOT suggest any actions, and do NOT mention or offer prayer or verses.`;
const STAGE_SUGGEST =
  `\n\nRIGHT NOW you are in the SUGGEST stage: they have shared enough, so do NOT ask further about the situation or their emotions. Pick only ONE (at most TWO) small, concrete action that best fits THEIR situation — do NOT list several options or offer a menu. Choose from ideas like a short walk, a few deep breaths, a break, reaching out to someone they trust, tending a plant, or praying. End with a soft question inviting them to try it.`;
const STAGE_WRAP =
  `\n\nRIGHT NOW you are in the WRAP stage: this is the FINAL reply of the conversation, so gently bring it to a close. Warmly acknowledge what they shared in 1 to 2 sentences, then — instead of asking another question — invite them to take one last small step before they go by tapping "Look for verses" or "Tap to pray" just below, whichever feels right for them. Keep it warm and brief, and do NOT write the verse or prayer yourself.`;

const TURN_LIMIT_RESPONSE =
  "We've had a really meaningful conversation. I'd encourage you to take a moment to reflect on what we talked about. You can always start a new check-in whenever you need to. You're doing great.";

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ---------------------------------------------------------------------------

interface Recap {
  date: string;
  emotion: string;
  context?: string | null;
  issue?: string;
}
interface Ctx {
  emotion?: string;
  category?: string;
  doing?: string;
  withWhom?: string;
  where?: string;
}

function stageDirective(stage: string): string {
  if (stage === 'listen') return STAGE_LISTEN;
  if (stage === 'suggest') return STAGE_SUGGEST;
  if (stage === 'wrap') return STAGE_WRAP;
  return '';
}

function buildRecapBlock(recaps: Recap[]): string {
  if (!Array.isArray(recaps) || recaps.length === 0) return '';
  let block =
    `\n\n## Recent check-ins (past week)\n` +
    `Use these to notice ongoing situations and how the person has been feeling across recent days. ` +
    `Acknowledge when something has been weighing on them for a while, and offer a fresh, relevant Bible verse and (when fitting) a prayer. Do not recite this list mechanically.\n`;
  for (const s of recaps) {
    const d = new Date(s.date);
    const day = Number.isNaN(d.getTime()) ? '' : WEEKDAYS[d.getDay()] + ': ';
    const ctx = s.context ? ` (${s.context})` : '';
    const issue = s.issue ? ` — ${String(s.issue).slice(0, 120)}` : '';
    block += `- ${day}${s.emotion}${ctx}${issue}\n`;
  }
  return block;
}

function buildSystemPrompt(context: Ctx, recapBlock: string, stage: string): string {
  return (
    SYSTEM_PROMPT +
    recapBlock +
    `\n\n## Current User Context\n` +
    `- Emotion: ${context.emotion ?? ''}\n` +
    `- Category: ${context.category ?? ''}\n` +
    (context.doing ? `- Currently doing: ${context.doing}\n` : '') +
    (context.withWhom ? `- With: ${context.withWhom}\n` : '') +
    (context.where ? `- Location: ${context.where}\n` : '') +
    stageDirective(stage)
  );
}

const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-device-id, x-session-id',
};

function json(status: number, obj: unknown): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json', ...CORS },
  });
}

// Shape a plain text reply like an Anthropic response so the client parses it.
function asMessage(text: string): Response {
  return json(200, { content: [{ type: 'text', text }] });
}

function today(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (request.method !== 'POST') return json(405, { error: 'method_not_allowed' });

    const deviceId = request.headers.get('x-device-id');
    if (!deviceId) return json(400, { error: 'missing_device_id' });
    const sessionId = request.headers.get('x-session-id') || 'nosession';

    let body: any;
    try {
      body = await request.json();
    } catch {
      return json(400, { error: 'bad_json' });
    }
    if (!body || !Array.isArray(body.messages)) return json(400, { error: 'bad_messages' });

    const kind: string = body.kind || 'chat';
    const userTurns = Number(body.userTurns) || 0;

    // Turn limit (chat/opener only; prayer/verse buttons bypass it).
    if ((kind === 'chat' || kind === 'opener') && userTurns >= MAX_CHAT_TURNS) {
      return asMessage(TURN_LIMIT_RESPONSE);
    }

    const day = today();

    // Global daily circuit breaker (hard cap).
    const gKey = `global:${day}`;
    const gCount = parseInt((await env.RL.get(gKey)) || '0', 10);
    if (gCount >= GLOBAL_DAILY_CALL_CAP) return json(503, { error: 'global_cap' });

    // Per-device daily check-in cap (soft). A check-in = one session id; only the
    // first call of a new session consumes one.
    const seenKey = `seen:${deviceId}:${sessionId}`;
    if (!(await env.RL.get(seenKey))) {
      const dKey = `checkins:${deviceId}:${day}`;
      const dCount = parseInt((await env.RL.get(dKey)) || '0', 10);
      if (dCount >= PER_DEVICE_DAILY_CHECKINS) return json(429, { error: 'device_cap' });
      await env.RL.put(dKey, String(dCount + 1), { expirationTtl: COUNTER_TTL_SECONDS });
      await env.RL.put(seenKey, '1', { expirationTtl: COUNTER_TTL_SECONDS });
    }

    // Assemble the Anthropic request (prompt + tunables owned here).
    const maxTokens = Math.min(kind === 'verse' ? 280 : 150, MAX_OUTPUT_TOKENS);
    const forwardBody = {
      model: ALLOWED_MODEL,
      max_tokens: maxTokens,
      system: buildSystemPrompt(body.context || {}, buildRecapBlock(body.recap || []), body.stage || ''),
      messages: body.messages,
    };
    const forwardRaw = JSON.stringify(forwardBody);
    if (forwardRaw.length > MAX_BODY_CHARS) return json(413, { error: 'too_large' });

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

    await env.RL.put(gKey, String(gCount + 1), { expirationTtl: COUNTER_TTL_SECONDS });

    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { 'content-type': 'application/json', ...CORS },
    });
  },
};
