import { MED_LIST } from '../content/medList';
import { diffSelection, knownIds } from './conditionSelection';
import { changedStrengths, customKey, diffCustom, listKey } from './medSelection';
import { supabase } from './supabase';

const KNOWN = MED_LIST.map((m) => m.med_id);
// strengths is keyed by listKey(med_id) or customKey(name): the person's own text, empty or missing means none.
export type MyMeds = { ids: string[]; custom: string[]; strengths: Record<string, string> };
export const emptyMeds = (): MyMeds => ({ ids: [], custom: [], strengths: {} });

// The signed-in person's own medicines. Row-level security limits this to their own rows. null means it could not be loaded.
export async function loadMyMeds(): Promise<MyMeds | null> {
  const { data, error } = await supabase.from('user_medications').select('med_id,custom_name,strength').order('created_at', { ascending: true });
  if (error) return null;
  const out = emptyMeds();
  const seen = new Set(knownIds((data ?? []).map((r) => r.med_id as string | null).filter((x): x is string => !!x), KNOWN));
  for (const r of data ?? []) {
    const strength = (r.strength as string | null) ?? '';
    if (r.med_id && seen.has(r.med_id as string)) { out.ids.push(r.med_id as string); if (strength) out.strengths[listKey(r.med_id as string)] = strength; }
    else if (r.custom_name) { out.custom.push(r.custom_name as string); if (strength) out.strengths[customKey(r.custom_name as string)] = strength; }
  }
  return out;
}

export async function saveMyMeds(saved: MyMeds, wanted: MyMeds): Promise<boolean> {
  const ids = diffSelection(saved.ids, wanted.ids);
  const custom = diffCustom(saved.custom, wanted.custom);
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) return false;
  const sv = (k: string) => (wanted.strengths[k] ?? '').trim() || null;
  if (ids.remove.length) { const { error } = await supabase.from('user_medications').delete().in('med_id', ids.remove); if (error) return false; }
  if (custom.remove.length) { const { error } = await supabase.from('user_medications').delete().in('custom_name', custom.remove); if (error) return false; }
  const rows = [
    ...ids.add.map((med_id) => ({ user_id: uid, med_id, strength: sv(listKey(med_id)) })),
    ...custom.add.map((custom_name) => ({ user_id: uid, custom_name, strength: sv(customKey(custom_name)) })),
  ];
  if (rows.length) { const { error } = await supabase.from('user_medications').insert(rows); if (error) return false; }
  // Medicines that stay on the list but whose strength was edited.
  const keptList = wanted.ids.filter((i) => saved.ids.includes(i));
  for (const id of changedStrengths(saved.strengths, wanted.strengths, keptList.map(listKey))) {
    const medId = id.slice(2);
    const { error } = await supabase.from('user_medications').update({ strength: sv(id) }).eq('med_id', medId);
    if (error) return false;
  }
  const savedByKey = new Map(saved.custom.map((n) => [customKey(n), n]));
  const keptCustom = wanted.custom.map(customKey).filter((k) => savedByKey.has(k));
  for (const k of changedStrengths(saved.strengths, wanted.strengths, keptCustom)) {
    const { error } = await supabase.from('user_medications').update({ strength: sv(k) }).eq('custom_name', savedByKey.get(k)!);
    if (error) return false;
  }
  return true;
}
