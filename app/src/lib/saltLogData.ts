import type { SaltDraft, SaltRow } from './saltLog';
import { supabase } from './supabase';

// Owner-only rows (row-level security, migration 0019). null means the list could not be loaded. Never log what is in a row.
const COLS = 'id,logged_on,sodium_mg,foods_counted,foods_total';
export async function loadSalt(): Promise<SaltRow[] | null> {
  const { data, error } = await supabase.from('salt_log').select(COLS).order('logged_on', { ascending: true }).order('created_at', { ascending: true });
  if (error) return null;
  return (data ?? []) as SaltRow[];
}
export async function addSalt(d: SaltDraft): Promise<'ok' | 'limit' | 'error'> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user?.id) return 'error';
  const { error } = await supabase.from('salt_log').insert({ user_id: u.user.id, ...d });
  if (!error) return 'ok';
  return error.code === '23514' && /up to \d+ plates/i.test(error.message) ? 'limit' : 'error';
}
export async function deleteSalt(id: string): Promise<boolean> {
  const { error } = await supabase.from('salt_log').delete().eq('id', id);
  return !error;
}
