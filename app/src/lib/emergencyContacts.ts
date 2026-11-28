import AsyncStorage from '@react-native-async-storage/async-storage';
import { ContactValid, isE164, MAX_CONTACTS } from './contactLogic';
import { supabase } from './supabase';

export type Contact = ContactValid & { id: string };

// Owner-only rows (row-level security). null means the list could not be loaded.
export async function loadContacts(): Promise<Contact[] | null> {
  const { data, error } = await supabase.from('emergency_contacts').select('id,name,relationship,phone').order('created_at', { ascending: true });
  if (error) return null;
  return (data ?? []) as Contact[];
}
export async function addContact(c: ContactValid): Promise<'ok' | 'limit' | 'error'> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user?.id) return 'error';
  const { error } = await supabase.from('emergency_contacts').insert({ user_id: u.user.id, ...c });
  if (!error) return 'ok';
  return error.code === '23514' && /up to 5/i.test(error.message) ? 'limit' : 'error';
}
export async function updateContact(id: string, c: ContactValid): Promise<boolean> {
  const { error } = await supabase.from('emergency_contacts').update({ name: c.name, relationship: c.relationship, phone: c.phone }).eq('id', id);
  return !error;
}
export async function deleteContact(id: string): Promise<boolean> {
  const { error } = await supabase.from('emergency_contacts').delete().eq('id', id);
  return !error;
}

// Optional copy on this device so the numbers still show with no connection. OFF by default: names and numbers are
// sensitive and a shared phone or computer would show them without a sign-in. Plain storage, so only for people who choose it.
const copyKey = (uid: string) => `contacts.copy.${uid}`;
const onKey = (uid: string) => `contacts.copy.on.${uid}`;
export async function deviceCopyOn(uid: string): Promise<boolean> {
  try { return (await AsyncStorage.getItem(onKey(uid))) === '1'; } catch { return false; }
}
export async function setDeviceCopy(uid: string, on: boolean, current: Contact[]): Promise<void> {
  try {
    if (on) { await AsyncStorage.setItem(onKey(uid), '1'); await AsyncStorage.setItem(copyKey(uid), JSON.stringify(current)); }
    else { await AsyncStorage.removeItem(onKey(uid)); await AsyncStorage.removeItem(copyKey(uid)); }
  } catch { /* ignore */ }
}
export async function refreshDeviceCopy(uid: string, current: Contact[]): Promise<void> {
  if (await deviceCopyOn(uid)) { try { await AsyncStorage.setItem(copyKey(uid), JSON.stringify(current)); } catch { /* ignore */ } }
}
export async function readDeviceCopy(uid: string): Promise<Contact[] | null> {
  try {
    if (!(await deviceCopyOn(uid))) return null;
    const raw = await AsyncStorage.getItem(copyKey(uid));
    const v = raw ? JSON.parse(raw) : null;
    if (!Array.isArray(v)) return null;
    return v.filter((c) => c && typeof c.id === 'string' && typeof c.name === 'string' && typeof c.phone === 'string' && isE164(c.phone)).slice(0, MAX_CONTACTS) as Contact[];
  } catch { return null; }
}
// Online list first; if that fails, the device copy when the person turned it on.
export async function loadContactsOrCopy(uid: string): Promise<{ list: Contact[]; offline: boolean } | null> {
  const online = await loadContacts();
  if (online) { void refreshDeviceCopy(uid, online); return { list: online, offline: false }; }
  const copy = await readDeviceCopy(uid);
  return copy ? { list: copy, offline: true } : null;
}
