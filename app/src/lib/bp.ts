// Input checks only mirror the database limits. They say nothing about what a good reading is.
export type BpInput = { systolic: number; diastolic: number; pulse: number | null };
export type BpResult = { ok: true; value: BpInput } | { ok: false; error: string };

const num = (s: string) => (/^\d{1,3}$/.test(s.trim()) ? Number(s.trim()) : NaN);

export function parseReading(sys: string, dia: string, pulse: string): BpResult {
  const systolic = num(sys);
  const diastolic = num(dia);
  if (Number.isNaN(systolic) || systolic < 40 || systolic > 300) return { ok: false, error: 'Top number must be a whole number from 40 to 300.' };
  if (Number.isNaN(diastolic) || diastolic < 20 || diastolic > 200) return { ok: false, error: 'Bottom number must be a whole number from 20 to 200.' };
  if (systolic <= diastolic) return { ok: false, error: 'The top number must be higher than the bottom number. Check both numbers.' };
  let p: number | null = null;
  if (pulse.trim() !== '') {
    p = num(pulse);
    if (Number.isNaN(p) || p < 20 || p > 250) return { ok: false, error: 'Pulse must be a whole number from 20 to 250, or leave it empty.' };
  }
  return { ok: true, value: { systolic, diastolic, pulse: p } };
}
