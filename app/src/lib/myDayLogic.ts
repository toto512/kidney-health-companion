// Pure rules for "My day", the daily checklist a person builds for themselves. No react-native imports so vitest can run it.
// The list is a reminder the person ticks. Nothing here tracks doses, sets amounts or alerts anyone.
import { Lang, localeTag } from '../i18n/core';

export const MAX_TASKS = 20;
export const MAX_TITLE = 60;
export const TIMES = ['morning', 'midday', 'afternoon', 'evening', 'bedtime'] as const;
export type TimeOfDay = (typeof TIMES)[number];
export const isTime = (v: unknown): v is TimeOfDay => typeof v === 'string' && (TIMES as readonly string[]).includes(v);

// Days of the week as a bit mask, Monday first: Monday 1, Tuesday 2, Wednesday 4 ... Sunday 64. 127 is every day. Same as the database.
export const EVERY_DAY = 127;
export const DAY_BITS = [1, 2, 4, 8, 16, 32, 64] as const;
export const dayBit = (d: Date): number => 1 << ((d.getDay() + 6) % 7); // getDay: Sunday 0 ... Saturday 6
export const isDueOn = (mask: number, d: Date): boolean => (mask & dayBit(d)) !== 0;
export const toggleDay = (mask: number, bit: number): number => mask ^ bit;
export const isValidDays = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= EVERY_DAY;

// The person's own calendar date as year-month-day (not UTC), so "today" is their today.
export const localDateKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Menu templates. The words come from the language files (myday.tpl.<key>, and myday.hint.<key> for a short hint). No amounts: the person adds any number themselves.
// `link` is an existing screen the row can open; the tick is always manual. `habit` tasks repeat every day with no day choice; the rest are chores with their own days.
// `legacy` tasks are no longer on the menu but stay valid so tasks people saved earlier still show and work.
export type TemplateLink = '/feature/medications' | '/feature/blood-pressure' | '/feature/my-people' | '/feature/conditions';
export const TEMPLATES = [
  // Morning
  { key: 'bathroom', time: 'morning', days: EVERY_DAY, habit: true },
  { key: 'wash-dress', time: 'morning', days: EVERY_DAY, habit: true },
  { key: 'breakfast', time: 'morning', days: EVERY_DAY, habit: true },
  { key: 'medicines', time: 'morning', days: EVERY_DAY, habit: true, link: '/feature/medications' },
  { key: 'blood-pressure', time: 'morning', days: EVERY_DAY, habit: true, link: '/feature/blood-pressure' },
  { key: 'calendar', time: 'morning', days: EVERY_DAY },
  // Midday
  { key: 'lunch', time: 'midday', days: EVERY_DAY, habit: true },
  { key: 'water', time: 'midday', days: EVERY_DAY, habit: true, link: '/feature/conditions' }, // "Follow my fluid advice": official condition pages, no target
  { key: 'walk', time: 'midday', days: EVERY_DAY },
  { key: 'chore', time: 'midday', days: EVERY_DAY },
  { key: 'mail', time: 'midday', days: EVERY_DAY },
  // Afternoon
  { key: 'rest', time: 'afternoon', days: EVERY_DAY, habit: true },
  { key: 'social', time: 'afternoon', days: EVERY_DAY },
  { key: 'afternoon-medicines', time: 'afternoon', days: EVERY_DAY, habit: true, link: '/feature/medications' },
  // Evening
  { key: 'dinner', time: 'evening', days: EVERY_DAY, habit: true },
  { key: 'evening-medicines', time: 'evening', days: EVERY_DAY, habit: true, link: '/feature/medications' },
  { key: 'call', time: 'evening', days: EVERY_DAY, link: '/feature/my-people' },
  // Bedtime
  { key: 'night-medicines', time: 'bedtime', days: EVERY_DAY, habit: true, link: '/feature/medications' },
  { key: 'walkways', time: 'bedtime', days: EVERY_DAY, habit: true },
  { key: 'clothes', time: 'bedtime', days: EVERY_DAY, habit: true },
  // Earlier menu tasks, kept valid for tasks already saved
  { key: 'meal', time: 'midday', days: EVERY_DAY, habit: true, legacy: true },
  { key: 'bed', time: 'bedtime', days: EVERY_DAY, habit: true, legacy: true },
  { key: 'pillbox', time: 'morning', days: 64, link: '/feature/medications', legacy: true }, // Sunday
  { key: 'groceries', time: 'midday', days: 32, legacy: true }, // Saturday
  { key: 'laundry', time: 'midday', days: 4, legacy: true }, // Wednesday
  { key: 'appointments', time: 'midday', days: 1, legacy: true }, // Monday
] as const satisfies readonly { key: string; time: TimeOfDay; days: number; link?: TemplateLink; habit?: true; legacy?: true }[];
export type TemplateKey = (typeof TEMPLATES)[number]['key'];
export type Template = { key: TemplateKey; time: TimeOfDay; days: number; link?: TemplateLink; habit?: true; legacy?: true };
export const templateFor = (key: string | null): Template | undefined => (TEMPLATES as readonly Template[]).find((t) => t.key === key);
// What the person can pick from. Daily habits repeat every day with no day choice; chores keep a day choice.
export const MENU: readonly Template[] = (TEMPLATES as readonly Template[]).filter((t) => !t.legacy);
export const isHabit = (key: string): boolean => templateFor(key)?.habit === true;
// The menu under a time-of-day heading: only the tasks whose usual time is that heading, so nothing is filed under the wrong time.
export const menuAt = (time: TimeOfDay): Template[] => MENU.filter((t) => t.time === time);

// A saved task. Exactly one of template_key and title is set.
export type Task = { id: string; template_key: TemplateKey | null; title: string | null; time_of_day: TimeOfDay; days: number };

export type TaskInput = { template: string | null; title: string; time: string; days: number };
export type TaskValid = { template_key: TemplateKey | null; title: string | null; time_of_day: TimeOfDay; days: number };
// Messages are exact English text; labels.ts maps them to the chosen language.
export function validateTask(i: TaskInput): { ok: true; value: TaskValid } | { ok: false; error: string } {
  if (!isTime(i.time)) return { ok: false, error: 'Choose a time of day.' };
  if (!isValidDays(i.days)) return { ok: false, error: 'Choose at least one day.' };
  if (i.template !== null) {
    const t = templateFor(i.template);
    if (!t) return { ok: false, error: 'Choose a task from the list.' };
    return { ok: true, value: { template_key: t.key, title: null, time_of_day: i.time, days: i.days } };
  }
  const title = i.title.trim().replace(/\s+/g, ' ');
  if (!title) return { ok: false, error: 'Type what you want to do.' };
  if (title.length > MAX_TITLE) return { ok: false, error: 'Use 60 letters or fewer for the task.' };
  return { ok: true, value: { template_key: null, title, time_of_day: i.time, days: i.days } };
}
export const slotsLeft = (count: number): number => Math.max(0, MAX_TASKS - count);
export const canAddMore = (count: number): boolean => count < MAX_TASKS;

// Tasks due on a date, in time-of-day order (then the order they were added).
export function dueTasks(tasks: readonly Task[], d: Date): Task[] {
  return tasks
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => isDueOn(t.days, d))
    .sort((a, b) => TIMES.indexOf(a.t.time_of_day) - TIMES.indexOf(b.t.time_of_day) || a.i - b.i)
    .map(({ t }) => t);
}
export type Group = { time: TimeOfDay; tasks: Task[] };
export function groupByTime(tasks: readonly Task[], d: Date): Group[] {
  const due = dueTasks(tasks, d);
  return TIMES.map((time) => ({ time, tasks: due.filter((t) => t.time_of_day === time) })).filter((g) => g.tasks.length > 0);
}
// "3 of 8 done today": only tasks due on that date count, and only ticks for those tasks.
export function progress(tasks: readonly Task[], doneIds: ReadonlySet<string>, d: Date): { done: number; total: number } {
  const due = dueTasks(tasks, d);
  return { done: due.filter((t) => doneIds.has(t.id)).length, total: due.length };
}

// Weekday names come from the device's calendar data in the chosen language (Monday first). 1 January 2024 was a Monday.
export const weekdayName = (index: number, lang: Lang, style: 'short' | 'long'): string =>
  new Date(2024, 0, 1 + index).toLocaleDateString(localeTag(lang), { weekday: style });
// "every day", or the short names joined, for example "Mon, Wed".
export function daysSummary(mask: number, lang: Lang, everyDayText: string): string {
  if (mask === EVERY_DAY) return everyDayText;
  return DAY_BITS.map((bit, i) => ((mask & bit) !== 0 ? weekdayName(i, lang, 'short') : null)).filter(Boolean).join(', ');
}
