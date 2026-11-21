import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type Per100 = { sodiumMg?: number; potassiumMg?: number; phosphorusMg?: number; proteinG?: number };
export type LookupHit = { fdcId: number; name: string; dataType: 'Foundation' | 'SR Legacy'; per100: Per100 };
export type LookupError = 'notSetUp' | 'busy' | 'signin' | 'failed';

// Asks the food-search server function to search USDA FoodData Central. The USDA key stays inside Supabase.
export async function searchUsda(q: string): Promise<{ ok: true; foods: LookupHit[] } | { ok: false; error: LookupError }> {
  const { data, error } = await supabase.functions.invoke('food-search', { body: { q } });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const status = error.context.status;
      if (status === 404 || status === 503) return { ok: false, error: 'notSetUp' };
      if (status === 429) return { ok: false, error: 'busy' };
      if (status === 401) return { ok: false, error: 'signin' };
    }
    return { ok: false, error: 'failed' };
  }
  const foods = (data as { foods?: LookupHit[] } | null)?.foods;
  return Array.isArray(foods) ? { ok: true, foods } : { ok: false, error: 'failed' };
}
