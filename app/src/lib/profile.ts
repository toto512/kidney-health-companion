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

const reqNum = (s: string, min: number, max: number): number | null => {
  const t = s.trim();
  if (!/^\d{1,3}(\.\d)?$/.test(t)) return null;
  const n = Number(t);
  return n >= min && n <= max ? n : null;
};

// A saved profile is complete when every required field is present. Name is the only optional field.
export const isProfileComplete = (p: { country_code?: string | null; dob?: string | null; sex_at_birth?: string | null; height_cm?: number | null; weight_kg?: number | null } | null | undefined) =>
  !!p && !!p.country_code && !!p.dob && !!p.sex_at_birth && p.height_cm != null && p.weight_kg != null;

// `today` is injected so the check is testable. Date format is YYYY-MM-DD.
export function parseProfile(f: { name: string; dob: string; sex: string; height: string; weight: string; country: string }, today: Date): ProfileResult {
  if (!f.country || !WORLD_COUNTRIES.some((c) => c.code === f.country)) return { ok: false, error: 'Choose your country.' };
  const name = f.name.trim();
  if (name.length > 80) return { ok: false, error: 'Name is too long.' };
  const d = f.dob.trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
  const dt = m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
  const real = !!dt && dt.getUTCFullYear() === +m![1] && dt.getUTCMonth() === +m![2] - 1 && dt.getUTCDate() === +m![3];
  if (!real || +m![1] < 1900 || dt!.getTime() > today.getTime()) return { ok: false, error: 'Enter your date of birth as a real past date, year-month-day, for example 1950-03-27.' };
  if (!SEX_OPTIONS.some((o) => o.value === f.sex)) return { ok: false, error: 'Choose your sex at birth.' };
  const h = reqNum(f.height, 50, 250);
  if (h === null) return { ok: false, error: 'Enter your height in cm, from 50 to 250.' };
  const w = reqNum(f.weight, 20, 400);
  if (w === null) return { ok: false, error: 'Enter your weight in kg, from 20 to 400.' };
  return { ok: true, value: { name: name || null, dob: d, sex_at_birth: f.sex as Sex, height_cm: h, weight_kg: w, country_code: f.country } };
}
