import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * A stable per-install device id and per-check-in session id, used only as soft
 * rate-limit keys by the AI proxy (see worker/). These are NOT security tokens —
 * they can be spoofed; the proxy's global daily circuit breaker is the real cap.
 */

const DEVICE_ID_KEY = 'knockknock.deviceId';

/** RFC-4122-ish v4 id. Math.random is fine here (not a security context). */
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let cachedDeviceId: string | null = null;

/** Get (or lazily create + persist) this install's device id. */
export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;
  try {
    const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (existing) {
      cachedDeviceId = existing;
      return existing;
    }
  } catch {
    // fall through to generate a fresh (unpersisted) id
  }
  const id = generateId();
  cachedDeviceId = id;
  try {
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  } catch {
    // best-effort; a non-persisted id still works for the session
  }
  return id;
}
