import type { Lang } from './core';
import type { TemplateKey, TimeOfDay } from '../lib/myDayLogic';
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
  'Top number must be a whole number from 70 to 300.': 'err.bpTop',
  'Bottom number must be a whole number from 40 to 200.': 'err.bpBottom',
  'The top number must be higher than the bottom number. Check both numbers.': 'err.bpGap',
  'Pulse must be a whole number from 30 to 250, or leave it empty.': 'err.bpPulse',
  'Type a name first.': 'err.typeName',
  'That name is already on your list.': 'err.dupName',
  'Use letters, numbers and simple marks only, for example 150 mcg.': 'err.strengthChars',
  'Enter their name.': 'err.contactName',
  'Use 60 letters or fewer for the name.': 'err.contactNameLong',
  'Choose who they are to you.': 'err.contactRole',
  'Check the phone number. Include the area code, or start with + and the country code.': 'err.contactPhone',
  'Choose a time of day.': 'err.mydayTime',
  'Choose at least one day.': 'err.mydayDays',
  'Choose a task from the list.': 'err.mydayTemplate',
  'Type what you want to do.': 'err.mydayTitle',
  'Use 60 letters or fewer for the task.': 'err.mydayTitleLong',
  'Enter a title of 1 to 60 characters.': 'err.apptTitle',
  'A note can be up to 200 characters.': 'err.apptNote',
  'Enter a date as year-month-day, for example 2026-12-01.': 'err.apptCheck',
  'Enter a time from 00:00 to 23:59.': 'err.apptCheck',
  'Choose how often it repeats.': 'err.apptCheck',
  'Choose when to be reminded.': 'err.apptCheck',
};
export const trError = (t: T, msg: string) => {
  if (ERR[msg]) return t(ERR[msg]);
  const m = /^Use (\d+) characters or fewer\.$/.exec(msg);
  return m ? t('err.chars', { n: m[1] }) : msg;
};

// My day: menu task names, short hints and the five times of day.
const TPL: Record<TemplateKey, Key> = {
  bathroom: 'myday.tpl.bathroom', 'wash-dress': 'myday.tpl.wash-dress', breakfast: 'myday.tpl.breakfast', medicines: 'myday.tpl.medicines', 'blood-pressure': 'myday.tpl.blood-pressure', calendar: 'myday.tpl.calendar',
  lunch: 'myday.tpl.lunch', water: 'myday.tpl.water', walk: 'myday.tpl.walk', chore: 'myday.tpl.chore', mail: 'myday.tpl.mail',
  rest: 'myday.tpl.rest', social: 'myday.tpl.social', 'afternoon-medicines': 'myday.tpl.afternoon-medicines',
  dinner: 'myday.tpl.dinner', 'evening-medicines': 'myday.tpl.evening-medicines', call: 'myday.tpl.call',
  'night-medicines': 'myday.tpl.night-medicines', walkways: 'myday.tpl.walkways', clothes: 'myday.tpl.clothes',
  meal: 'myday.tpl.meal', bed: 'myday.tpl.bed', pillbox: 'myday.tpl.pillbox', groceries: 'myday.tpl.groceries', laundry: 'myday.tpl.laundry', appointments: 'myday.tpl.appointments',
};
export const templateName = (t: T, k: TemplateKey) => t(TPL[k]);
const HINT: Partial<Record<TemplateKey, Key>> = { 'wash-dress': 'myday.hint.wash-dress', chore: 'myday.hint.chore', dinner: 'myday.hint.dinner', 'night-medicines': 'myday.hint.night-medicines' };
export const templateHint = (t: T, k: string | null): string | null => { const h = k ? HINT[k as TemplateKey] : undefined; return h ? t(h) : null; };
const TIME: Record<TimeOfDay, Key> = { morning: 'myday.time.morning', midday: 'myday.time.midday', afternoon: 'myday.time.afternoon', evening: 'myday.time.evening', bedtime: 'myday.time.bedtime' };
export const timeLabel = (t: T, v: TimeOfDay) => t(TIME[v]);

// Country names in the chosen language where the device supports it, else the English name.
export function countryLabel(code: string, lang: Lang, fallback: string): string {
  try { return new Intl.DisplayNames([lang], { type: 'region' }).of(code) ?? fallback; } catch { return fallback; }
}

// Calendar: how an appointment repeats and when its in-app reminder shows.
export const repeatLabel = (t: T, r: string) => t(r === 'weekly' ? 'cal.repeat.weekly' : r === 'monthly' ? 'cal.repeat.monthly' : 'cal.repeat.none');
export const remindLabel = (t: T, m: number) => t(m === 60 ? 'cal.remind.60' : m === 1440 ? 'cal.remind.1440' : 'cal.remind.0');
