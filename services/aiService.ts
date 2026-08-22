import {
  SYSTEM_PROMPT,
  SAFETY_KEYWORDS,
  SAFETY_FALLBACK_RESPONSE,
  API_FALLBACK_RESPONSE,
  MAX_CHAT_TURNS,
  STAGE_LISTEN,
  STAGE_SUGGEST,
  STAGE_WRAP,
} from '@/constants/aiPrompt';
import { getRecentSessions } from '@/services/beliefStore';
import { getDeviceId } from '@/services/deviceId';
import type { SessionRecord } from '@/types/belief';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

export interface ChatContext {
  emotion: string;
  category: string;
  doing?: string;
  withWhom?: string;
  where?: string;
  sessionId?: string; // one per check-in; used by the proxy to count check-ins/device
}

const API_URL = 'https://api.anthropic.com/v1/messages';
// When set, all AI calls go through our Cloudflare Worker proxy (which holds the
// API key and enforces rate limits) instead of hitting Anthropic directly.
const PROXY_URL = process.env.EXPO_PUBLIC_AI_PROXY_URL;
const MODEL = 'claude-haiku-4-5-20251001';
const API_TIMEOUT = 15000; // 15 seconds

// Shown when the proxy rate-limits the request (per-device or global daily cap).
const RATE_LIMIT_RESPONSE =
  "You've reached today's check-in limit, come back tomorrow to continue.";

// Returned when the chat turn limit is reached (dev-fallback path only; in
// production the Worker owns this message so it can be tuned without an app update).
const TURN_LIMIT_RESPONSE =
  "We've had a really meaningful conversation. I'd encourage you to take a moment to reflect on what we talked about. You can always start a new check-in whenever you need to. You're doing great.";

// What each call is for. The Worker derives max_tokens + turn enforcement from this.
// 'reflection' = a short reflection for an app-chosen (curated) verse.
export type ChatKind = 'chat' | 'opener' | 'prayer' | 'verse' | 'reflection';
// Conversation stage (chat/opener only); the Worker maps this to a stage directive.
export type ChatStage = 'listen' | 'suggest' | 'wrap' | '';

/**
 * Check if user message contains crisis/safety keywords.
 */
export function containsSafetyKeywords(message: string): boolean {
  const lower = message.toLowerCase();
  return SAFETY_KEYWORDS.some((keyword) => lower.includes(keyword));
}

/**
 * Format the recent check-ins (past week) into a prompt block so the AI can
 * track ongoing situations across recent days. Returns '' when there are none.
 */
function buildRecapBlock(recaps: SessionRecord[]): string {
  if (recaps.length === 0) return '';

  let block =
    `\n\n## Recent check-ins (past week)\n` +
    `Use these to notice ongoing situations and how the person has been feeling across recent days. ` +
    `Acknowledge when something has been weighing on them for a while, and offer a fresh, relevant Bible verse and (when fitting) a prayer. Do not recite this list mechanically.\n`;
  for (const s of recaps) {
    const d = new Date(s.date);
    const day = Number.isNaN(d.getTime()) ? '' : WEEKDAYS[d.getDay()] + ': ';
    const ctx = s.context ? ` (${s.context})` : '';
    const issue = s.issue ? ` — ${s.issue.slice(0, 120)}` : '';
    block += `- ${day}${s.emotion}${ctx}${issue}\n`;
  }
  return block;
}

/**
 * Build the system prompt with user context and recent-days memory injected.
 */
function buildSystemPrompt(context: ChatContext, recapBlock: string, stageHint: string): string {
  return (
    SYSTEM_PROMPT +
    recapBlock +
    `\n\n## Current User Context\n` +
    `- Emotion: ${context.emotion}\n` +
    `- Category: ${context.category}\n` +
    (context.doing ? `- Currently doing: ${context.doing}\n` : '') +
    (context.withWhom ? `- With: ${context.withWhom}\n` : '') +
    (context.where ? `- Location: ${context.where}\n` : '') +
    stageHint
  );
}

/**
 * Convert app chat history to Claude API message format.
 * Limits to the last MAX_CHAT_TURNS * 2 messages.
 */
function buildMessages(
  userMessage: string,
  history: ChatMessage[],
): { role: 'user' | 'assistant'; content: string }[] {
  const maxMessages = MAX_CHAT_TURNS * 2;
  const recentHistory = history.slice(-maxMessages);

  const messages = recentHistory.map((msg) => ({
    role: (msg.role === 'ai' ? 'assistant' : 'user') as 'user' | 'assistant',
    content: msg.text,
  }));

  messages.push({ role: 'user', content: userMessage });

  return messages;
}

/** Map a stage key to its directive text (dev-fallback prompt assembly only). */
function stageDirective(stage: ChatStage): string {
  if (stage === 'listen') return STAGE_LISTEN;
  if (stage === 'suggest') return STAGE_SUGGEST;
  if (stage === 'wrap') return STAGE_WRAP;
  return '';
}

/**
 * Send a chat message to Claude Haiku 4.5 and return the AI response.
 *
 * In production (EXPO_PUBLIC_AI_PROXY_URL set) the request goes to the Worker,
 * which owns the system prompt, stage directives, max_tokens, and turn limits —
 * so those can be tuned server-side without an app update. The client just sends
 * the raw ingredients (messages, context, recap, stage, kind, turn count).
 *
 * In dev without a proxy it calls Anthropic directly, assembling the prompt here
 * (requires EXPO_PUBLIC_ANTHROPIC_API_KEY).
 */
export async function sendChatMessage(
  userMessage: string,
  history: ChatMessage[],
  context: ChatContext,
  kind: ChatKind = 'chat',
  stage: ChatStage = '',
): Promise<string> {
  // Safety check — return safety response immediately if crisis detected
  if (containsSafetyKeywords(userMessage)) {
    return SAFETY_FALLBACK_RESPONSE;
  }

  const enforceTurnLimit = kind === 'chat' || kind === 'opener';
  const maxTokens = kind === 'verse' ? 280 : kind === 'reflection' ? 100 : 150;
  const userTurns = history.filter((m) => m.role === 'user').length;
  const messages = buildMessages(userMessage, history);

  // Recent check-ins (past week, capped) — situational memory for the prompt.
  let recaps: SessionRecord[] = [];
  try {
    recaps = (await getRecentSessions(7)).slice(0, 10);
  } catch {
    // No memory yet, or read failed — proceed context-only.
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    // ---- Production: the Worker owns the prompt / tunables / turn limits ----
    if (PROXY_URL) {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-device-id': await getDeviceId(),
      };
      if (context.sessionId) headers['x-session-id'] = context.sessionId;

      const response = await fetch(PROXY_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ messages, context, recap: recaps, stage, kind, userTurns }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.status === 429 || response.status === 503) {
        return RATE_LIMIT_RESPONSE;
      }
      if (!response.ok) {
        console.error('AI proxy error:', response.status);
        return API_FALLBACK_RESPONSE;
      }
      const data = await response.json();
      return data?.content?.[0]?.text || API_FALLBACK_RESPONSE;
    }

    // ---- Dev fallback: call Anthropic directly, prompt assembled here ----
    if (enforceTurnLimit && userTurns >= MAX_CHAT_TURNS) {
      clearTimeout(timeout);
      return TURN_LIMIT_RESPONSE;
    }
    const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
    if (!apiKey) {
      clearTimeout(timeout);
      console.warn('No proxy URL and no ANTHROPIC_API_KEY — using fallback response');
      return API_FALLBACK_RESPONSE;
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        system: buildSystemPrompt(context, buildRecapBlock(recaps), stageDirective(stage)),
        messages,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      console.error('Claude API error:', response.status);
      return API_FALLBACK_RESPONSE;
    }
    const data = await response.json();
    return data?.content?.[0]?.text || API_FALLBACK_RESPONSE;
  } catch (error) {
    clearTimeout(timeout);
    console.error('AI request failed:', error);
    return API_FALLBACK_RESPONSE;
  }
}
