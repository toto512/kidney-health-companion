import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type DeleteError = 'twostep' | 'notSetUp' | 'signin' | 'failed';

// Asks the delete-account server function to remove the files, data and sign-in of the current person, then signs out on this device.
export async function deleteMyAccount(): Promise<{ ok: true } | { ok: false; error: DeleteError }> {
  const { error } = await supabase.functions.invoke('delete-account', { body: { confirm: 'DELETE' } });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const status = error.context.status;
      if (status === 404) return { ok: false, error: 'notSetUp' };
      if (status === 403) return { ok: false, error: 'twostep' };
      if (status === 401) return { ok: false, error: 'signin' };
    }
    return { ok: false, error: 'failed' };
  }
  await supabase.auth.signOut({ scope: 'local' });
  return { ok: true };
}
