// Recovery codes look like ABCDE-FGHIJ. The alphabet leaves out I, L, O, 0 and 1 so codes are easy to read and copy by hand.
export const RECOVERY_LENGTH = 10;

// Strips spaces and hyphens and upper-cases, so "abcde fghij" and "ABCDE-FGHIJ" are the same code.
export const normalizeRecoveryCode = (s: string) => s.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

export const isRecoveryCodeShape = (s: string) => normalizeRecoveryCode(s).length === RECOVERY_LENGTH;

// Shows what the person typed as ABCDE-FGHIJ while they type.
export const formatRecoveryInput = (s: string) => {
  const n = normalizeRecoveryCode(s).slice(0, RECOVERY_LENGTH);
  return n.length > 5 ? `${n.slice(0, 5)}-${n.slice(5)}` : n;
};

export type RedeemResult = 'ok' | 'wrong' | 'locked' | 'off' | 'error';

// Maps the database function's outcome to a result the screen can word plainly.
export function redeemResult(data: unknown, error: { message?: string } | null): RedeemResult {
  if (error) {
    const m = error.message ?? '';
    if (/too_many_attempts/.test(m)) return 'locked';
    if (/two_step_off/.test(m)) return 'off';
    return 'error';
  }
  return data === true ? 'ok' : 'wrong';
}

export type GenerateError = 'missing' | 'off' | 'aal2' | 'signedOut' | 'other';

// Maps the error from generate_recovery_codes. PGRST202 / "Could not find the function" means migration 0006 was not run.
export function generateError(error: { message?: string; code?: string; status?: number } | null): GenerateError {
  const m = `${error?.code ?? ''} ${error?.message ?? ''}`;
  if (/PGRST202|Could not find the function|schema cache/i.test(m) || error?.status === 404) return 'missing';
  if (/two_step_off/.test(m)) return 'off';
  if (/aal2_required/.test(m)) return 'aal2';
  if (/not_signed_in/.test(m) || error?.status === 401) return 'signedOut';
  return 'other';
}
