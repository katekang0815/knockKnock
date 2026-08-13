import {
  SYSTEM_PROMPT,
  SAFETY_KEYWORDS,
  SAFETY_FALLBACK_RESPONSE,
  API_FALLBACK_RESPONSE,
  MAX_CHAT_TURNS,
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
  "A lot of people are reflecting right now — give it a little while and try again. " +
  "In the meantime, take a slow breath; you're doing okay.";

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

/**
 * Send a chat message to Claude Haiku 4.5 and return the AI response.
 *
 * Requires EXPO_PUBLIC_ANTHROPIC_API_KEY in .env
 */
export async function sendChatMessage(
  userMessage: string,
  history: ChatMessage[],
  context: ChatContext,
  maxTokens: number = 150, // short by default (chat/opener/prayer); verses pass a larger value
  enforceTurnLimit: boolean = true, // false for prayer/verse buttons so they work past the limit
  stageHint: string = '', // per-turn stage directive (LISTEN vs SUGGEST); '' for prayer/verse
): Promise<string> {
  // Safety check — return safety response immediately if crisis detected
  if (containsSafetyKeywords(userMessage)) {
    return SAFETY_FALLBACK_RESPONSE;
  }

  // Check turn limit
  const userTurns = history.filter((m) => m.role === 'user').length;
  if (enforceTurnLimit && userTurns >= MAX_CHAT_TURNS) {
    return "We've had a really meaningful conversation. I'd encourage you to take a moment to reflect on what we talked about. You can always start a new check-in whenever you need to. You're doing great.";
  }

  // Build the request URL + headers. In production we route through the proxy
  // (which holds the key); in dev without a proxy we call Anthropic directly.
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  let url: string;
  if (PROXY_URL) {
    url = PROXY_URL;
    headers['x-device-id'] = await getDeviceId();
    if (context.sessionId) headers['x-session-id'] = context.sessionId;
  } else {
    const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.warn('ANTHROPIC_API_KEY not set and no proxy URL — using fallback response');
      return API_FALLBACK_RESPONSE;
    }
    url = API_URL;
    headers['x-api-key'] = apiKey;
    headers['anthropic-version'] = '2023-06-01';
  }

  // Load recent check-ins (past week, capped) for short-term situational memory.
  let recapBlock = '';
  try {
    const recaps = await getRecentSessions(7);
    recapBlock = buildRecapBlock(recaps.slice(0, 10));
  } catch {
    // No memory yet, or read failed — proceed context-only.
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        system: buildSystemPrompt(context, recapBlock, stageHint),
        messages: buildMessages(userMessage, history),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // Proxy rate limits: 429 = per-device cap, 503 = global daily cap.
    if (response.status === 429 || response.status === 503) {
      return RATE_LIMIT_RESPONSE;
    }

    if (!response.ok) {
      console.error('Claude API error:', response.status);
      return API_FALLBACK_RESPONSE;
    }

    const data = await response.json();
    const aiText = data?.content?.[0]?.text;

    if (!aiText) {
      return API_FALLBACK_RESPONSE;
    }

    return aiText;
  } catch (error) {
    clearTimeout(timeout);
    console.error('Claude API request failed:', error);
    return API_FALLBACK_RESPONSE;
  }
}
