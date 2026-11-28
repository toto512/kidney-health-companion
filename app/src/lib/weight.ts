// Body weight helpers. Input checks only: nothing here says what a healthy weight is, and there is no target weight.
// The canonical value is kilograms with 2 decimals, so a weight typed in pounds converts back to the same pounds.
export type WeightUnit = 'kg' | 'lb';
export const UNITS: readonly WeightUnit[] = ['kg', 'lb'];
export const KG_PER_LB = 0.45359237;

// What the app lets a person save, per unit. Outside these a number is much more likely a typing slip than a real weight.
// Not medical thresholds. The database limit (10 to 500 kg) stays wider.
export const WEIGHT_LIMITS: Record<WeightUnit, { min: number; max: number }> = { kg: { min: 20, max: 300 }, lb: { min: 45, max: 660 } };

export const isUnit = (u: unknown): u is WeightUnit => u === 'kg' || u === 'lb';

export const toKg = (value: number, unit: WeightUnit): number => Math.round((unit === 'kg' ? value : value * KG_PER_LB) * 100) / 100;
// Shown with one decimal in the chosen unit.
export const fromKg = (kg: number, unit: WeightUnit): number => Math.round((unit === 'kg' ? kg : kg / KG_PER_LB) * 10) / 10;
export const formatWeight = (kg: number, unit: WeightUnit, locale?: string): string =>
  fromKg(kg, unit).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export type WeightResult = { ok: true; value: { kg: number; unit: WeightUnit } } | { ok: false; error: 'missing' | 'range' };

// Two choices on screen: the whole number, then the tenth (0 to 9). Both are digit strings.
export function parseWeight(unit: WeightUnit, whole: string, tenth: string): WeightResult {
  if (!/^\d{1,3}$/.test(whole.trim())) return { ok: false, error: 'missing' };
  const t = tenth.trim() === '' ? '0' : tenth.trim();
  if (!/^\d$/.test(t)) return { ok: false, error: 'range' };
  const v = Number(whole.trim()) + Number(t) / 10;
  const { min, max } = WEIGHT_LIMITS[unit];
  if (v < min || v > max + 0.9) return { ok: false, error: 'range' };
  return { ok: true, value: { kg: toKg(v, unit), unit } };
}

// Typing-slip check only: a weight 10% or more away from the last one saved gets one second look. Not a medical judgement.
export const CHECK_JUMP = 0.1;
export function jumpsFromLast(kg: number, lastKg: number | null | undefined): boolean {
  return lastKg != null && lastKg > 0 && Math.abs(kg - lastKg) / lastKg >= CHECK_JUMP;
}

// Dropdown choices for the whole number, then the tenth.
export const wholeOptions = (unit: WeightUnit) => {
  const { min, max } = WEIGHT_LIMITS[unit];
  return Array.from({ length: max - min + 1 }, (_, i) => ({ value: String(min + i), label: String(min + i) }));
};
export const TENTH_OPTIONS = Array.from({ length: 10 }, (_, i) => ({ value: String(i), label: `.${i}` }));
