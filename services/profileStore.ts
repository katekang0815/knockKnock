import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * The user's profile — display name and a locally-stored photo URI. On-device
 * only (no server), consistent with the app's privacy model.
 */

const NAME_KEY = 'knockknock.profile.name.v1';
const PHOTO_KEY = 'knockknock.profile.photo.v1';

export const DEFAULT_DISPLAY_NAME = 'Yehsun Kang';

export async function getDisplayName(): Promise<string> {
  try {
    const raw = await AsyncStorage.getItem(NAME_KEY);
    return raw && raw.trim() ? raw : DEFAULT_DISPLAY_NAME;
  } catch {
    return DEFAULT_DISPLAY_NAME;
  }
}

export async function setDisplayName(name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) return;
  try {
    await AsyncStorage.setItem(NAME_KEY, trimmed);
  } catch {
    // best-effort
  }
}

export async function getPhotoUri(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(PHOTO_KEY);
  } catch {
    return null;
  }
}

export async function setPhotoUri(uri: string): Promise<void> {
  try {
    await AsyncStorage.setItem(PHOTO_KEY, uri);
  } catch {
    // best-effort
  }
}
