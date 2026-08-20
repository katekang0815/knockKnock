import { getDeviceId } from '@/services/deviceId';

/**
 * Sends in-app feedback to the Cloudflare Worker (/feedback route), which stores
 * it in KV and optionally pings a Discord webhook. Uses the same proxy base URL
 * as the AI service.
 */

const PROXY_URL = process.env.EXPO_PUBLIC_AI_PROXY_URL;

export interface FeedbackInput {
  rating?: number; // 0-5 (optional)
  message: string;
  contact?: string;
  appVersion?: string;
}

export async function sendFeedback(input: FeedbackInput): Promise<boolean> {
  const message = input.message.trim();
  if (!message) return false;
  if (!PROXY_URL) {
    // No backend configured (dev without proxy) — nothing to send to.
    console.warn('Feedback: EXPO_PUBLIC_AI_PROXY_URL not set');
    return false;
  }
  const url = `${PROXY_URL.replace(/\/$/, '')}/feedback`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': await getDeviceId(),
      },
      body: JSON.stringify({
        rating: input.rating ?? 0,
        message,
        contact: input.contact ?? '',
        appVersion: input.appVersion ?? '',
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
