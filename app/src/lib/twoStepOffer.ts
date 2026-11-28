import AsyncStorage from '@react-native-async-storage/async-storage';

// The signup offer for two-step sign-in is shown once per account on this device. Not sensitive, so plain storage is fine.
const key = (uid: string) => `twostep.offered.${uid}`;

export async function wasOffered(uid: string): Promise<boolean> {
  try { return (await AsyncStorage.getItem(key(uid))) === '1'; } catch { return true; } // if storage fails, do not nag
}
export async function markOffered(uid: string): Promise<void> {
  try { await AsyncStorage.setItem(key(uid), '1'); } catch { /* ignore */ }
}
