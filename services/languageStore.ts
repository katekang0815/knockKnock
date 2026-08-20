import AsyncStorage from '@react-native-async-storage/async-storage';

/** Selected app language (code). UI-only for now — the app isn't localized yet. */

const KEY = 'knockknock.language.v1';
export const DEFAULT_LANGUAGE = 'en';

export async function getLanguage(): Promise<string> {
  try {
    return (await AsyncStorage.getItem(KEY)) || DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export async function setLanguage(code: string): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, code);
  } catch {
    // best-effort
  }
}
