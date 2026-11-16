import type { Lang } from './core';
import type { Key } from './strings/en';

type T = (k: Key, v?: Record<string, string | number>) => string;

// Labels and messages come from pure logic files in English. These map them to the chosen language, falling back to the English text.
const REL: Record<string, Key> = { doctor: 'rel.doctor', nurse: 'rel.nurse', parent: 'rel.parent', partner: 'rel.partner', child: 'rel.child', sibling: 'rel.sibling', friend: 'rel.friend', neighbour: 'rel.neighbour', other: 'rel.other' };
export const relLabel = (t: T, v: string, fallback: string) => (REL[v] ? t(REL[v]) : fallback);

const SEX: Record<string, Key> = { female: 'sex.female', male: 'sex.male', other: 'sex.other' };
export const sexLabel = (t: T, v: string, fallback: string) => (SEX[v] ? t(SEX[v]) : fallback);

const STEP: Record<string, Key> = { normal: 'text.normal', large: 'text.large', xlarge: 'text.xlarge' };
export const stepLabel = (t: T, v: string, fallback: string) => (STEP[v] ? t(STEP[v]) : fallback);

// Validation messages (exact English text from profile.ts and contactLogic.ts).
const ERR: Record<string, Key> = {
  'Choose your country.': 'err.country',
  'Name is too long.': 'err.nameLong',
  'Enter your date of birth as a real past date, year-month-day, for example 1950-03-27.': 'err.dob',
  'Choose your sex at birth.': 'err.sex',
  'Enter your height in cm, from 50 to 250.': 'err.heightCm',
  'Enter your height as feet from 1 to 8 and inches from 0 to 11. The total must be between 1 ft 8 in and 8 ft 2 in.': 'err.heightFt',
  'Enter your weight in kg, from 20 to 400.': 'err.weightKg',
  'Enter your weight in lb, from 45 to 880.': 'err.weightLb',
  'Top number must be a whole number from 40 to 300.': 'err.bpTop',
  'Bottom number must be a whole number from 20 to 200.': 'err.bpBottom',
  'The top number must be higher than the bottom number. Check both numbers.': 'err.bpGap',
  'Pulse must be a whole number from 20 to 250, or leave it empty.': 'err.bpPulse',
  'Enter their name.': 'err.contactName',
  'Use 60 letters or fewer for the name.': 'err.contactNameLong',
  'Choose who they are to you.': 'err.contactRole',
  'Check the phone number. Include the area code, or start with + and the country code.': 'err.contactPhone',
};
export const trError = (t: T, msg: string) => (ERR[msg] ? t(ERR[msg]) : msg);

// Country names in the chosen language where the device supports it, else the English name.
export function countryLabel(code: string, lang: Lang, fallback: string): string {
  try { return new Intl.DisplayNames([lang], { type: 'region' }).of(code) ?? fallback; } catch { return fallback; }
}
