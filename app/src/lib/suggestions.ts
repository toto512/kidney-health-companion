import AsyncStorage from '@react-native-async-storage/async-storage';

// Dismissed tip cards are remembered per account on this device. Not sensitive, so plain storage is fine.
const key = (id: string, uid: string) => `suggest.dismissed.${id}.${uid}`;

export async function wasDismissed(id: string, uid: string): Promise<boolean> {
  try { return (await AsyncStorage.getItem(key(id, uid))) === '1'; } catch { return true; } // if storage fails, do not nag
}
export async function dismiss(id: string, uid: string): Promise<void> {
  try { await AsyncStorage.setItem(key(id, uid), '1'); } catch { /* ignore */ }
}
