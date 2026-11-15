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

export type ProfileInput = { name: string | null; dob: string | null; height_cm: number | null; weight_kg: number | null; country_code: string };
export type ProfileResult = { ok: true; value: ProfileInput } | { ok: false; error: string };

const optNum = (s: string, min: number, max: number): number | null | 'bad' => {
  const t = s.trim();
  if (t === '') return null;
  if (!/^\d{1,3}(\.\d)?$/.test(t)) return 'bad';
  const n = Number(t);
  return n >= min && n <= max ? n : 'bad';
};

// `today` is injected so the check is testable. Format is YYYY-MM-DD.
export function parseProfile(f: { name: string; dob: string; height: string; weight: string; country: string }, today: Date): ProfileResult {
  if (!f.country || !WORLD_COUNTRIES.some((c) => c.code === f.country)) return { ok: false, error: 'Choose your country.' };
  const name = f.name.trim();
  if (name.length > 80) return { ok: false, error: 'Name is too long.' };
  let dob: string | null = null;
  const d = f.dob.trim();
  if (d !== '') {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
    const dt = m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
    const real = !!dt && dt.getUTCFullYear() === +m![1] && dt.getUTCMonth() === +m![2] - 1 && dt.getUTCDate() === +m![3];
    if (!real || +m![1] < 1900 || dt!.getTime() > today.getTime()) return { ok: false, error: 'Date of birth must be a real past date, written year-month-day, for example 1950-03-27.' };
    dob = d;
  }
  const h = optNum(f.height, 50, 250);
  if (h === 'bad') return { ok: false, error: 'Height must be from 50 to 250 cm, or leave it empty.' };
  const w = optNum(f.weight, 20, 400);
  if (w === 'bad') return { ok: false, error: 'Weight must be from 20 to 400 kg, or leave it empty.' };
  return { ok: true, value: { name: name || null, dob, height_cm: h, weight_kg: w, country_code: f.country } };
}
