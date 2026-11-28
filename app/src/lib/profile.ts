import { WORLD_COUNTRIES } from '../content/countries';

// Health content and emergency numbers are verified only for these three. Every other country can be saved but gets no health content.
export type Country = 'CA' | 'US' | 'GB';
export const COUNTRIES: { code: Country; label: string }[] = [
  { code: 'CA', label: 'Canada' },
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
];
export const isSupported = (code: string | null | undefined): code is Country => code === 'CA' || code === 'US' || code === 'GB';
export const countryName = (code: string | null | undefined) => WORLD_COUNTRIES.find((c) => c.code === code)?.name ?? code ?? '';

export type Sex = 'female' | 'male' | 'other';
export const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Another sex at birth' },
];

export type ProfileInput = { name: string | null; dob: string; sex_at_birth: Sex; height_cm: number; weight_kg: number; country_code: string };
export type ProfileResult = { ok: true; value: ProfileInput } | { ok: false; error: string };

export type HeightUnit = 'cm' | 'ft';
export type WeightUnit = 'kg' | 'lb';

const CM_PER_INCH = 2.54;
const KG_PER_LB = 0.45359237;
const round1 = (n: number) => Math.round(n * 10) / 10;

// Accepts 1 to 3 digits with an optional single decimal digit. A comma is read as a decimal point.
const num = (s: string): number | null => {
  const t = s.trim().replace(',', '.');
  return /^\d{1,3}(\.\d)?$/.test(t) ? Number(t) : null;
};
const inRange = (n: number | null, min: number, max: number) => (n !== null && n >= min && n <= max ? n : null);

// Conversions are stored as canonical cm and kg, rounded to 1 decimal.
export const feetInchesToCm = (ft: number, inch: number) => round1((ft * 12 + inch) * CM_PER_INCH);
export const cmToFeetInches = (cm: number) => {
  const total = Math.round(cm / CM_PER_INCH);
  return { ft: Math.floor(total / 12), inch: total % 12 };
};
export const lbToKg = (lb: number) => round1(lb * KG_PER_LB);
export const kgToLb = (kg: number) => round1(kg / KG_PER_LB);

// Returns canonical cm, or null when the entry is not a number or is outside 50 to 250 cm after conversion.
export function parseHeightCm(unit: HeightUnit, cm: string, ft: string, inch: string): number | null {
  if (unit === 'cm') return inRange(num(cm), 50, 250);
  const f = ft.trim(), i = inch.trim() === '' ? '0' : inch.trim();
  if (!/^\d$/.test(f) || !/^\d{1,2}$/.test(i) || Number(i) > 11) return null;
  return inRange(feetInchesToCm(Number(f), Number(i)), 50, 250);
}
// Returns canonical kg, or null when the entry is not a number or is outside 20 to 400 kg after conversion.
export function parseWeightKg(unit: WeightUnit, value: string): number | null {
  const n = num(value);
  return inRange(n === null ? null : unit === 'kg' ? n : lbToKg(n), 20, 400);
}

// A saved profile is complete when every required field is present. Name is the only optional field.
export const isProfileComplete = (p: { country_code?: string | null; dob?: string | null; sex_at_birth?: string | null; height_cm?: number | null; weight_kg?: number | null } | null | undefined) =>
  !!p && !!p.country_code && !!p.dob && !!p.sex_at_birth && p.height_cm != null && p.weight_kg != null;

// `today` is injected so the check is testable. Date format is YYYY-MM-DD.
export function parseProfile(f: { name: string; dob: string; sex: string; height: string; heightFt?: string; heightIn?: string; heightUnit?: HeightUnit; weight: string; weightUnit?: WeightUnit; country: string }, today: Date): ProfileResult {
  if (!f.country || !WORLD_COUNTRIES.some((c) => c.code === f.country)) return { ok: false, error: 'Choose your country.' };
  const name = f.name.trim();
  if (name.length > 80) return { ok: false, error: 'Name is too long.' };
  const d = f.dob.trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
  const dt = m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
  const real = !!dt && dt.getUTCFullYear() === +m![1] && dt.getUTCMonth() === +m![2] - 1 && dt.getUTCDate() === +m![3];
  if (!real || +m![1] < 1900 || dt!.getTime() > today.getTime()) return { ok: false, error: 'Enter your date of birth as a real past date, year-month-day, for example 1950-03-27.' };
  if (!SEX_OPTIONS.some((o) => o.value === f.sex)) return { ok: false, error: 'Choose your sex at birth.' };
  const hu = f.heightUnit ?? 'cm', wu = f.weightUnit ?? 'kg';
  const h = parseHeightCm(hu, f.height, f.heightFt ?? '', f.heightIn ?? '');
  if (h === null) return { ok: false, error: hu === 'cm' ? 'Enter your height in cm, from 50 to 250.' : 'Enter your height as feet from 1 to 8 and inches from 0 to 11. The total must be between 1 ft 8 in and 8 ft 2 in.' };
  const w = parseWeightKg(wu, f.weight);
  if (w === null) return { ok: false, error: wu === 'kg' ? 'Enter your weight in kg, from 20 to 400.' : 'Enter your weight in lb, from 45 to 880.' };
  return { ok: true, value: { name: name || null, dob: d, sex_at_birth: f.sex as Sex, height_cm: h, weight_kg: w, country_code: f.country } };
}
