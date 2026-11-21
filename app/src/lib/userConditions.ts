import { CONDITION_LIST } from '../content/conditionList';
import { diffSelection, knownIds } from './conditionSelection';
import { supabase } from './supabase';

const KNOWN = CONDITION_LIST.map((c) => c.id);

// The signed-in person's chosen condition ids. Row-level security limits this to their own rows.
export async function loadMyConditionIds(): Promise<string[] | null> {
  const { data, error } = await supabase.from('user_conditions').select('condition_id');
  if (error) return null;
  return knownIds((data ?? []).map((r) => r.condition_id as string), KNOWN);
}

export async function saveMyConditionIds(saved: string[], wanted: string[]): Promise<boolean> {
  const { add, remove } = diffSelection(saved, wanted);
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) return false;
  if (remove.length) {
    const { error } = await supabase.from('user_conditions').delete().in('condition_id', remove);
    if (error) return false;
  }
  if (add.length) {
    const { error } = await supabase.from('user_conditions').insert(add.map((condition_id) => ({ user_id: uid, condition_id })));
    if (error) return false;
  }
  return true;
}
