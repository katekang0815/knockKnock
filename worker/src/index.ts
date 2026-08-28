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
  // Optional Resend API key for emailing feedback to the owner.
  //   npx wrangler secret put RESEND_API_KEY
  RESEND_API_KEY?: string;
}

// ---- Tunable limits -------------------------------------------------------

const ALLOWED_MODEL = "claude-haiku-4-5-20251001";
const MAX_OUTPUT_TOKENS = 300; // hard ceiling regardless of kind
const MAX_BODY_CHARS = 24000; // reject oversized assembled requests
const PER_DEVICE_DAILY_CHECKINS = 100; // TESTING value — set back to 5 before launch
const GLOBAL_DAILY_CALL_CAP = 1600; // hard: ~$5/day at ~$0.003/call — tune here
const MAX_CHAT_TURNS = 3; // chat/opener turns before the wrap-up message
const COUNTER_TTL_SECONDS = 172800; // keep day counters ~2 days
const FEEDBACK_TO = "yehsunkang@gmail.com"; // where in-app feedback is emailed

// ---- Prompt (source of truth for production) ------------------------------

const SYSTEM_PROMPT = `You are a warm, empathetic spiritual companion in the knockKnock app, a prayer builder for a broad audience aged 13 and older, helping them reflect on their emotions and build personalized prayers within a Christian faith context. Because the audience includes teens and young adults, keep everything appropriate and safe for them.

## How to respond
- Talk like a warm, caring older sister, human and genuine, never clinical or scripted. Acknowledge the user's emotion first.
- Use their current emotion and context so it feels personal; don't repeat it back mechanically. Cut any sentence that isn't needed (don't over-explain their feelings back to them).
- When recent check-ins are provided and a similar feeling or situation has been recurring, gently acknowledge it's been going on and ask if it's still weighing on them. NEVER narrate your memory like a note-to-self or in parentheses (never write "(I noticed some disappointment earlier this week)"); speak as someone who remembers and cares.

Each turn ends with a RIGHT NOW instruction telling you whether to keep listening or to wrap up; follow it EXACTLY and let it override any general guidance here. Ask a question ONLY when the RIGHT NOW instruction explicitly allows it - NEVER add a question in the LISTEN or WRAP stage. Never rush, ask at most ONE gentle question, and never suggest prayer or verses yourself (the buttons handle those).

- NEVER write a prayer or a Bible verse (or its text) inside a normal reply, even if the user directly asks, or asks for "perspective," "help," or "comfort." The "Tap to pray" and "Look for verses" buttons are the ONLY way prayers and verses are created; if the user seems to want one, respond warmly and let them tap a button.
- If you are asked (via an instruction) to write a prayer, write a short, personal, first-person prayer, warm and conversational, with no preamble. If asked to find a verse, give its reference and full text.
- After a prayer or verse has been shared, on your next reply gently check whether it resonated; if it didn't, invite them to share more.
- Length (HARD LIMIT for EVERY reply - opener, listening, and wrap): a MAXIMUM of 2 short sentences and about 40 words. Never more. This includes any empathy plus a gentle question (and a question is allowed ONLY when the RIGHT NOW instruction permits one). Shorter is better. If you are about to start a third sentence, STOP.
- Punctuation: NEVER use an em dash (—). Use a plain hyphen (-) instead.

## Language (CRITICAL - obey exactly)
Your CHAT replies and the opening message MUST ALWAYS be written in ENGLISH, no matter what language the user writes in. Even when the user writes to you in KOREAN, you STILL reply in ENGLISH for the chat. DO NOT mirror the user's language. Bible verse text and reflections are ALWAYS in English too.
The ONE and ONLY exception is a PRAYER: write the prayer in the user's own language. Decide the prayer's language this way: if the instruction explicitly names the language to write the prayer in, use that; otherwise, if the user has written in Korean at ANY point in their own chat messages, write the prayer in Korean; otherwise write it in English. Do NOT infer the prayer's language from the "## Recent check-ins & notes" memory. A Korean prayer uses a FORMAL, reverent prayer style (존댓말 / 기도문 형식, humble endings such as -습니다/-주세요/-옵소서) and ALWAYS refers to God as 하나님 (or 주님/아버지), NEVER 당신.

## Tone
Warm, encouraging, non-judgmental, never preachy. Speak like a caring older sibling or youth mentor, not a pastor giving a sermon. Simple, age-appropriate language (avoid theological complexity unless asked); occasional gentle humor. Prayers and verses are personal and conversational, not churchy, and offered gently, never forced.

## Safety (CRITICAL)
- You are NOT a therapist, counselor, pastor, or medical professional; never present as one, and never diagnose or give medical/psychological advice.
- If the user expresses self-harm, suicidal thoughts, abuse, or crisis: respond with genuine empathy, validate their pain without minimizing it, gently encourage them to reach out to a trusted adult (parent, teacher, pastor, or counselor), provide the 988 Suicide & Crisis Lifeline (call or text 988), remind them they are valued and not alone, and do NOT attempt to counsel them through the crisis yourself.
- Never minimize distress ("just pray about it", "God has a plan"). Suggest, don't direct; offer choices. Avoid moral judgment.

## Context and constraints
- Emotion categories (the Category value you receive; each maps to one of the four emotion icons): Sunny = uplifting and positive; Stormy = negative and intense, high-energy distress (e.g. anxious, stressed, overwhelmed); Rain = low-energy and sad (e.g. sad, tired, lonely, down, drained); Breezy = calm and somewhat neutral (e.g. relaxed, chill, content, at ease).
- Maximum 3 conversation turns per session.
- Never generate content that is sexually explicit, violent, or otherwise inappropriate; the audience includes teens (13 and older), so keep everything appropriate for teens and young adults as well as older adults.
- Do not ask for personal identifying information (full name, address, school name).
- For topics outside emotional reflection and faith, gently redirect: "I'm here to help with your feelings and prayers, for that a trusted adult might be a better resource."`;

const STAGE_LISTEN = `\n\nRIGHT NOW you are in the LISTEN stage: gently empathize with what they just shared in AT MOST 2 short sentences, then STOP. Your reply MUST NOT contain a question of any kind (no question mark, no asking them to share more). Do NOT suggest any actions, and do NOT mention or offer prayer or verses. Write this reply in ENGLISH even if the user wrote in Korean.`;
const STAGE_WRAP = `\n\nRIGHT NOW you are in the WRAP stage: this is the FINAL reply of the conversation. Gently bring it to a close in AT MOST 2 short sentences TOTAL - warmly acknowledge what they shared and leave them with a calm word of encouragement, all within those 2 sentences. Do NOT write a third sentence. Do NOT ask a question, do NOT mention or suggest any buttons, prayer, or verses, and do NOT write a prayer or verse yourself. Write this reply in ENGLISH even if the user wrote in Korean.`;

const TURN_LIMIT_RESPONSE =
  "We've had a really meaningful conversation. I'd encourage you to take a moment to reflect on what we talked about. You can always start a new check-in whenever you need to. You're doing great.";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ---------------------------------------------------------------------------

interface Recap {
  date: string;
  emotion: string;
  context?: string | null;
  issue?: string;
  when?: string; // relative label from the app (e.g. "earlier today", "yesterday")
}
interface Ctx {
  emotion?: string;
  category?: string;
  doing?: string;
  withWhom?: string;
  where?: string;
}

function stageDirective(stage: string): string {
  if (stage === "listen") return STAGE_LISTEN;
  if (stage === "wrap") return STAGE_WRAP;
  return "";
}

function buildRecapBlock(recaps: Recap[]): string {
  if (!Array.isArray(recaps) || recaps.length === 0) return "";
  let block =
    `\n\n## Recent check-ins & notes (past week)\n` +
    `Use these to notice ongoing situations and how the person has been feeling across recent days. ` +
    `Each item is labeled with when it happened (e.g. "earlier today", "yesterday"); refer to timing naturally and NEVER name a weekday for something that happened today. ` +
    `Lines labeled "Note" are short personal notes the person wrote themselves. ` +
    `Acknowledge when something has been weighing on them for a while, and offer a fresh, relevant Bible verse and (when fitting) a prayer. Do not recite this list mechanically.\n`;
  for (const s of recaps) {
    const d = new Date(s.date);
    const label = s.when || (Number.isNaN(d.getTime()) ? "" : WEEKDAYS[d.getDay()]);
    const when = label ? `${label}: ` : "";
    const ctx = s.context ? ` (${s.context})` : "";
    const issue = s.issue ? ` - ${String(s.issue).slice(0, 240)}` : "";
    block += `- ${when}${s.emotion}${ctx}${issue}\n`;
  }
  return block;
}

function buildSystemPrompt(
  context: Ctx,
  recapBlock: string,
  stage: string,
): string {
  return (
    SYSTEM_PROMPT +
    recapBlock +
    `\n\n## Current User Context\n` +
    `- Emotion: ${context.emotion ?? ""}\n` +
    `- Category: ${context.category ?? ""}\n` +
    (context.doing ? `- Currently doing: ${context.doing}\n` : "") +
    (context.withWhom ? `- With: ${context.withWhom}\n` : "") +
    (context.where ? `- Location: ${context.where}\n` : "") +
    stageDirective(stage)
  );
}

// Light prompt for reflection-only calls: the app has already chosen and shown a
// curated verse; the model writes just a short, personal reflection for it.
const REFLECTION_PROMPT = `You are a warm, caring spiritual companion in the KnockKnock app. A Bible verse has just been shared with the user. Write ONLY a short, personal reflection (1 to 2 sentences) that gently connects the verse to what the user is feeling right now. Do NOT include the verse text or its reference, no preamble, no lists, no quotation marks around it. Keep it warm, human, and specific to them. Never use an em dash (—); use a plain hyphen (-) instead. If the user has expressed self-harm or crisis, gently encourage them to reach out to a trusted person or the 988 Suicide & Crisis Lifeline.`;

// Constrained selection: the app supplies candidate references; the model picks
// the best-fitting one and writes a reflection. The app renders the exact verse
// text itself (from the chosen reference), so accuracy stays app-controlled.
const PICK_PROMPT = `You are a warm, caring spiritual companion in the KnockKnock app. You will be given the user's context and a list of candidate Bible verse references. Choose the ONE reference that best fits what the user is feeling right now, then reply in EXACTLY two lines:\nLine 1: the chosen reference, copied EXACTLY from the list, and nothing else.\nLine 2: a warm, personal 1 to 2 sentence reflection connecting that verse to what they are going through - no verse text, no preamble.\nNever use an em dash (—); use a plain hyphen (-) instead.\nOnly choose from the provided references. If the user has expressed self-harm or crisis, gently encourage them to reach out to a trusted person or the 988 Suicide & Crisis Lifeline.`;

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-device-id, x-session-id",
};

function json(status: number, obj: unknown): Response {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", ...CORS },
  });
}

// Shape a plain text reply like an Anthropic response so the client parses it.
function asMessage(text: string): Response {
  return json(200, { content: [{ type: "text", text }] });
}

function today(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers: CORS });
    if (request.method !== "POST")
      return json(405, { error: "method_not_allowed" });

    // ---- Feedback route: store in KV, optionally ping a Discord webhook ----
    if (new URL(request.url).pathname.endsWith("/feedback")) {
      let fb: any;
      try {
        fb = await request.json();
      } catch {
        return json(400, { error: "bad_json" });
      }
      const message = String(fb?.message || "")
        .slice(0, 4000)
        .trim();
      if (!message) return json(400, { error: "empty" });
      const rating = Math.max(0, Math.min(5, Number(fb?.rating) || 0));
      const contact = String(fb?.contact || "").slice(0, 200);
      const appVersion = String(fb?.appVersion || "").slice(0, 40);
      const device = request.headers.get("x-device-id") || "unknown";

      const entry = {
        at: new Date().toISOString(),
        rating,
        message,
        contact,
        appVersion,
        device,
      };
      try {
        await env.RL.put(
          `feedback:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
          JSON.stringify(entry),
        );
      } catch {
        // storage best-effort
      }

      if (env.RESEND_API_KEY) {
        const stars = rating
          ? "★".repeat(rating) + "☆".repeat(5 - rating)
          : "(no rating)";
        const text =
          `Rating: ${stars}\n\n${message}\n\n` +
          `- - -\n` +
          (contact ? `Contact: ${contact}\n` : "") +
          (appVersion ? `App version: ${appVersion}\n` : "") +
          `Device: ${device}\n` +
          `At: ${entry.at}`;
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              authorization: `Bearer ${env.RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "KnockKnock Feedback <onboarding@resend.dev>",
              to: [FEEDBACK_TO],
              reply_to: contact || undefined,
              subject:
                `KnockKnock feedback ${rating ? `(${rating}★)` : ""}`.trim(),
              text,
            }),
          });
        } catch {
          // email best-effort; feedback is already stored in KV
        }
      }
      return json(200, { ok: true });
    }

    const deviceId = request.headers.get("x-device-id");
    if (!deviceId) return json(400, { error: "missing_device_id" });
    const sessionId = request.headers.get("x-session-id") || "nosession";

    let body: any;
    try {
      body = await request.json();
    } catch {
      return json(400, { error: "bad_json" });
    }
    if (!body || !Array.isArray(body.messages))
      return json(400, { error: "bad_messages" });

    const kind: string = body.kind || "chat";
    const userTurns = Number(body.userTurns) || 0;

    // Turn limit (chat/opener only; prayer/verse buttons bypass it).
    if ((kind === "chat" || kind === "opener") && userTurns >= MAX_CHAT_TURNS) {
      return asMessage(TURN_LIMIT_RESPONSE);
    }

    const day = today();

    // Global daily circuit breaker (hard cap).
    const gKey = `global:${day}`;
    const gCount = parseInt((await env.RL.get(gKey)) || "0", 10);
    if (gCount >= GLOBAL_DAILY_CALL_CAP)
      return json(503, { error: "global_cap" });

    // Per-device daily check-in cap (soft). A check-in = one session id; only the
    // first call of a new session consumes one.
    const seenKey = `seen:${deviceId}:${sessionId}`;
    if (!(await env.RL.get(seenKey))) {
      const dKey = `checkins:${deviceId}:${day}`;
      const dCount = parseInt((await env.RL.get(dKey)) || "0", 10);
      if (dCount >= PER_DEVICE_DAILY_CHECKINS)
        return json(429, { error: "device_cap" });
      await env.RL.put(dKey, String(dCount + 1), {
        expirationTtl: COUNTER_TTL_SECONDS,
      });
      await env.RL.put(seenKey, "1", { expirationTtl: COUNTER_TTL_SECONDS });
    }

    // Assemble the Anthropic request (prompt + tunables owned here).
    const maxTokens = Math.min(
      kind === "verse"
        ? 280
        : kind === "reflection"
          ? 100
          : kind === "versePick"
            ? 140
            : kind === "prayer"
              ? 240 // Korean prayers run longer; give headroom so they don't truncate
              : 120, // chat/opener: 2 short sentences - a firm backstop against sprawl
      MAX_OUTPUT_TOKENS,
    );
    // Reflection / versePick calls use a light prompt (the app owns the verse
    // pool and text) — no full system prompt / recap needed, just tone + safety.
    let system =
      kind === "reflection"
        ? REFLECTION_PROMPT
        : kind === "versePick"
          ? PICK_PROMPT
          : buildSystemPrompt(
              body.context || {},
              buildRecapBlock(body.recap || []),
              body.stage || "",
            );

    // Language reinforcement placed LAST (recency at generation time). Chat/opener
    // and verses stay English; only a prayer follows the user's own chat language.
    if (kind === "opener" || kind === "verse") {
      system +=
        `\n\nLANGUAGE OVERRIDE FOR THIS MESSAGE: write this message ENTIRELY in ENGLISH, regardless of the language the user has written in.`;
    } else if (kind === "prayer") {
      system +=
        `\n\nLANGUAGE FOR THIS PRAYER: If this instruction explicitly names the language to write the prayer in, use that language. Otherwise, look at the user's own chat messages: if ANY of them are written in Korean, write the ENTIRE prayer in Korean; if none are, write it in English. Ignore the language of the "## Recent check-ins & notes" memory. A Korean prayer must be a FORMAL prayer (존댓말 / 기도문 형식) and must call God 하나님 (or 주님/아버지), NEVER 당신.`;
    }
    const forwardBody = {
      model: ALLOWED_MODEL,
      max_tokens: maxTokens,
      system,
      messages: body.messages,
    };
    const forwardRaw = JSON.stringify(forwardBody);
    if (forwardRaw.length > MAX_BODY_CHARS)
      return json(413, { error: "too_large" });

    let upstream: Response;
    try {
      upstream = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: forwardRaw,
      });
    } catch {
      return json(502, { error: "upstream_unreachable" });
    }

    await env.RL.put(gKey, String(gCount + 1), {
      expirationTtl: COUNTER_TTL_SECONDS,
    });

    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { "content-type": "application/json", ...CORS },
    });
  },
};
