import { MED_LIST } from '../content/medList';
import { diffSelection, knownIds } from './conditionSelection';
import { diffCustom } from './medSelection';
import { supabase } from './supabase';

const KNOWN = MED_LIST.map((m) => m.med_id);
export type MyMeds = { ids: string[]; custom: string[] };

// The signed-in person's own medicines. Row-level security limits this to their own rows. null means it could not be loaded.
export async function loadMyMeds(): Promise<MyMeds | null> {
  const { data, error } = await supabase.from('user_medications').select('med_id,custom_name').order('created_at', { ascending: true });
  if (error) return null;
  const rows = data ?? [];
  return {
    ids: knownIds(rows.map((r) => r.med_id as string | null).filter((x): x is string => !!x), KNOWN),
    custom: rows.map((r) => r.custom_name as string | null).filter((x): x is string => !!x),
  };
}

export async function saveMyMeds(saved: MyMeds, wanted: MyMeds): Promise<boolean> {
  const ids = diffSelection(saved.ids, wanted.ids);
  const custom = diffCustom(saved.custom, wanted.custom);
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) return false;
  if (ids.remove.length) { const { error } = await supabase.from('user_medications').delete().in('med_id', ids.remove); if (error) return false; }
  if (custom.remove.length) { const { error } = await supabase.from('user_medications').delete().in('custom_name', custom.remove); if (error) return false; }
  const rows = [...ids.add.map((med_id) => ({ user_id: uid, med_id })), ...custom.add.map((custom_name) => ({ user_id: uid, custom_name }))];
  if (rows.length) { const { error } = await supabase.from('user_medications').insert(rows); if (error) return false; }
  return true;
}
