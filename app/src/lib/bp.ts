// Input checks only mirror the database limits. They say nothing about what a good reading is.
export type BpInput = { systolic: number; diastolic: number; pulse: number | null };
export type BpResult = { ok: true; value: BpInput } | { ok: false; error: string };

// The ranges the app and database accept. Used by the number pickers and the checks below.
// They are input limits only, not a healthy or normal range.
export const BP_LIMITS = { systolic: { min: 40, max: 300 }, diastolic: { min: 20, max: 200 }, pulse: { min: 20, max: 250 } } as const;

const num = (s: string) => (/^\d{1,3}$/.test(s.trim()) ? Number(s.trim()) : NaN);

export function parseReading(sys: string, dia: string, pulse: string): BpResult {
  const systolic = num(sys);
  const diastolic = num(dia);
  if (Number.isNaN(systolic) || systolic < BP_LIMITS.systolic.min || systolic > BP_LIMITS.systolic.max) return { ok: false, error: 'Top number must be a whole number from 40 to 300.' };
  if (Number.isNaN(diastolic) || diastolic < BP_LIMITS.diastolic.min || diastolic > BP_LIMITS.diastolic.max) return { ok: false, error: 'Bottom number must be a whole number from 20 to 200.' };
  if (systolic <= diastolic) return { ok: false, error: 'The top number must be higher than the bottom number. Check both numbers.' };
  let p: number | null = null;
  if (pulse.trim() !== '') {
    p = num(pulse);
    if (Number.isNaN(p) || p < BP_LIMITS.pulse.min || p > BP_LIMITS.pulse.max) return { ok: false, error: 'Pulse must be a whole number from 20 to 250, or leave it empty.' };
  }
  return { ok: true, value: { systolic, diastolic, pulse: p } };
}
