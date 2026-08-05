import {
  SYSTEM_PROMPT,
  SAFETY_KEYWORDS,
  SAFETY_FALLBACK_RESPONSE,
  API_FALLBACK_RESPONSE,
  MAX_CHAT_TURNS,
  BELIEF_EXTRACTION_PROMPT,
} from '@/constants/aiPrompt';
import { loadBeliefStore } from '@/services/beliefStore';
import type { BeliefProfile, SessionRecord } from '@/types/belief';
import type { BeliefUpdate, SessionMeta } from '@/services/beliefStore';

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
}

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';
const API_TIMEOUT = 15000; // 15 seconds

/**
 * Check if user message contains crisis/safety keywords.
 */
export function containsSafetyKeywords(message: string): boolean {
  const lower = message.toLowerCase();
  return SAFETY_KEYWORDS.some((keyword) => lower.includes(keyword));
}

/**
 * Format the stored belief memory (profile + most recent 1–2 check-ins) into a
 * prompt block. Returns '' when there's nothing yet (first-ever session).
 */
function buildMemoryBlock(profile: BeliefProfile, recent: SessionRecord[]): string {
  const hasProfile =
    !!profile.currentStance ||
    profile.coreBeliefs.length > 0 ||
    profile.openQuestions.length > 0 ||
    !!profile.toneNotes;

  if (!hasProfile && recent.length === 0) return '';

  let block = `\n\n## What you remember about this person (from past check-ins)\n`;
  if (profile.currentStance) block += `- Where they are spiritually: ${profile.currentStance}\n`;
  if (profile.coreBeliefs.length) block += `- Core beliefs: ${profile.coreBeliefs.join('; ')}\n`;
  if (profile.openQuestions.length)
    block += `- Questions they're wrestling with: ${profile.openQuestions.join('; ')}\n`;
  if (profile.toneNotes) block += `- How to speak with them: ${profile.toneNotes}\n`;

  if (recent.length) {
    block += `\n### Recent check-ins\n`;
    for (const s of recent) {
      const issues = s.issues.length ? ` about ${s.issues.join(', ')}` : '';
      block += `- Felt ${s.emotion}${issues}. ${s.summary}\n`;
    }
  }

  block +=
    `\nUse this memory naturally to show continuity ("last time you mentioned...") and to walk with them through how their faith is changing. Do not recite it mechanically or assume nothing has changed.`;
  return block;
}

/**
 * Build the system prompt with user context and long-term belief memory injected.
 */
function buildSystemPrompt(context: ChatContext, memoryBlock: string): string {
  return (
    SYSTEM_PROMPT +
    memoryBlock +
    `\n\n## Current User Context\n` +
    `- Emotion: ${context.emotion}\n` +
    `- Category: ${context.category}\n` +
    (context.doing ? `- Currently doing: ${context.doing}\n` : '') +
    (context.withWhom ? `- With: ${context.withWhom}\n` : '') +
    (context.where ? `- Location: ${context.where}\n` : '')
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
): Promise<string> {
  // Safety check — return safety response immediately if crisis detected
  if (containsSafetyKeywords(userMessage)) {
    return SAFETY_FALLBACK_RESPONSE;
  }

  // Check turn limit
  const userTurns = history.filter((m) => m.role === 'user').length;
  if (userTurns >= MAX_CHAT_TURNS) {
    return "We've had a really meaningful conversation. I'd encourage you to take a moment to reflect on what we talked about. You can always start a new check-in whenever you need to. You're doing great.";
  }

  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn('ANTHROPIC_API_KEY not set — using fallback response');
    return API_FALLBACK_RESPONSE;
  }

  // Load long-term belief memory (profile + last 1–2 check-ins) for continuity.
  let memoryBlock = '';
  try {
    const store = await loadBeliefStore();
    memoryBlock = buildMemoryBlock(store.profile, store.sessions.slice(0, 2));
  } catch {
    // No memory yet, or read failed — proceed context-only.
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 512,
        system: buildSystemPrompt(context, memoryBlock),
        messages: buildMessages(userMessage, history),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

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

// JSON schema for the end-of-session extraction (structured output).
const BELIEF_UPDATE_SCHEMA = {
  type: 'object',
  properties: {
    currentStance: { type: 'string' },
    coreBeliefs: { type: 'array', items: { type: 'string' } },
    openQuestions: { type: 'array', items: { type: 'string' } },
    toneNotes: { anyOf: [{ type: 'null' }, { type: 'string' }] },
    summary: { type: 'string' },
    issues: { type: 'array', items: { type: 'string' } },
    verse: {
      anyOf: [
        { type: 'null' },
        {
          type: 'object',
          properties: {
            reference: { type: 'string' },
            text: { type: 'string' },
          },
          required: ['reference', 'text'],
          additionalProperties: false,
        },
      ],
    },
  },
  required: [
    'currentStance',
    'coreBeliefs',
    'openQuestions',
    'toneNotes',
    'summary',
    'issues',
    'verse',
  ],
  additionalProperties: false,
} as const;

/** Parse JSON, tolerating stray text around the object. */
function safeParseJSON(raw: string): any | null {
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(raw.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * End-of-session belief extraction. Reads the finished conversation and the
 * existing profile, and returns an updated profile + session summary + issues +
 * the verse the AI shared, via structured output. Returns null on failure so the
 * caller can skip recording without breaking the check-in flow.
 */
export async function extractBeliefUpdate(
  transcript: ChatMessage[],
  meta: SessionMeta,
): Promise<BeliefUpdate | null> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey || transcript.length === 0) return null;

  let oldProfile;
  try {
    oldProfile = (await loadBeliefStore()).profile;
  } catch {
    oldProfile = null;
  }

  const convo = transcript
    .map((m) => `${m.role === 'ai' ? 'Guide' : 'User'}: ${m.text}`)
    .join('\n');

  const userContent =
    `EXISTING PROFILE (JSON):\n${JSON.stringify(oldProfile ?? {})}\n\n` +
    `SESSION CONTEXT:\n- Emotion: ${meta.emotion}\n- Category: ${meta.category}\n- Context: ${meta.context ?? 'n/a'}\n\n` +
    `CONVERSATION:\n${convo}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 800,
        system: BELIEF_EXTRACTION_PROMPT,
        output_config: { format: { type: 'json_schema', schema: BELIEF_UPDATE_SCHEMA } },
        messages: [{ role: 'user', content: userContent }],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error('Belief extraction API error:', response.status);
      return null;
    }

    const data = await response.json();
    const text = data?.content?.[0]?.text;
    if (!text) return null;

    const parsed = safeParseJSON(text);
    if (!parsed || typeof parsed !== 'object') return null;

    return {
      currentStance: typeof parsed.currentStance === 'string' ? parsed.currentStance : '',
      coreBeliefs: Array.isArray(parsed.coreBeliefs) ? parsed.coreBeliefs : [],
      openQuestions: Array.isArray(parsed.openQuestions) ? parsed.openQuestions : [],
      toneNotes: typeof parsed.toneNotes === 'string' ? parsed.toneNotes : null,
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
      verse:
        parsed.verse &&
        typeof parsed.verse === 'object' &&
        typeof parsed.verse.reference === 'string' &&
        typeof parsed.verse.text === 'string'
          ? { reference: parsed.verse.reference, text: parsed.verse.text }
          : null,
    };
  } catch (error) {
    clearTimeout(timeout);
    console.error('Belief extraction failed:', error);
    return null;
  }
}
