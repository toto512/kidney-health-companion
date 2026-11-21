// Pure rules for the Calendar: the month grid, which things fall on which day, appointment checks, in-app reminders and the .ics file.
// No react-native imports so vitest can run it. Reminders here are shown inside the app only; nothing rings or sends.
// My day tasks are never stored as calendar rows: they are worked out from each task's days (see dueTasks).
import { Lang } from '../i18n/core';
import { dueTasks, localDateKey, Task } from './myDayLogic';

export const MAX_APPOINTMENTS = 100;
export const MAX_APPT_TITLE = 60;
export const MAX_APPT_NOTE = 200;
export const REPEATS = ['none', 'weekly', 'monthly'] as const;
export type Repeat = (typeof REPEATS)[number];
// Minutes before the start. 0 means no reminder.
export const REMIND_OPTIONS = [0, 60, 1440] as const;
export type RemindMinutes = (typeof REMIND_OPTIONS)[number];

export type Appointment = { id: string; title: string; note: string | null; starts_on: string; starts_at: string; repeat: Repeat; remind_minutes: RemindMinutes };

// First day of the week: 0 Sunday, 1 Monday. English and Hebrew start on Sunday, French and Spanish on Monday.
export const weekStartFor = (l: Lang): 0 | 1 => (l === 'fr' || l === 'es' ? 1 : 0);
// JS getDay() values in display order, for example [0..6] from Sunday or [1..6, 0] from Monday.
export const weekdayOrder = (start: 0 | 1): number[] => Array.from({ length: 7 }, (_, i) => (start + i) % 7);

const KEY = /^(\d{4})-(\d{2})-(\d{2})$/;
export function parseKey(key: string): Date | null {
  const m = KEY.exec(key);
  if (!m) return null;
  const y = +m[1], mo = +m[2], d = +m[3];
  const date = new Date(y, mo - 1, d);
  return date.getFullYear() === y && date.getMonth() === mo - 1 && date.getDate() === d ? date : null;
}
const TIME = /^([01]\d|2[0-3]):([0-5]\d)(?::00)?$/;
// "09:30" or "09:30:00" (what the database returns) to "09:30"; null when it is not a 24-hour time.
export function cleanTime(v: string): string | null {
  const m = TIME.exec(v.trim());
  return m ? `${m[1]}:${m[2]}` : null;
}
export const startOf = (a: Pick<Appointment, 'starts_at'>, day: Date): Date => {
  const [h, m] = (cleanTime(a.starts_at) ?? '00:00').split(':').map(Number);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m);
};

export type Cell = { key: string; day: number; inMonth: boolean };
// Whole weeks covering the month (4 to 6 rows of 7). `month` is 0 to 11.
export function monthGrid(year: number, month: number, weekStart: 0 | 1): Cell[][] {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() - weekStart + 7) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const total = Math.ceil((lead + daysInMonth) / 7) * 7;
  const rows: Cell[][] = [];
  for (let i = 0; i < total; i += 7) {
    rows.push(Array.from({ length: 7 }, (_, j) => {
      const d = new Date(year, month, 1 - lead + i + j);
      return { key: localDateKey(d), day: d.getDate(), inMonth: d.getMonth() === month };
    }));
  }
  return rows;
}
export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

// Does this appointment fall on this day? Monthly repeats skip a month that has no such day (31st in a 30-day month).
export function occursOn(a: Pick<Appointment, 'starts_on' | 'repeat'>, d: Date): boolean {
  const start = parseKey(a.starts_on);
  if (!start) return false;
  const k = localDateKey(d);
  if (k < a.starts_on) return false;
  if (a.repeat === 'weekly') return d.getDay() === start.getDay();
  if (a.repeat === 'monthly') return d.getDate() === start.getDate();
  return k === a.starts_on;
}

export type DayItems = { tasks: Task[]; appointments: Appointment[] };
export function itemsOn(tasks: readonly Task[], appointments: readonly Appointment[], d: Date): DayItems {
  return {
    tasks: dueTasks(tasks, d), // sorted by time of day
    appointments: appointments.filter((a) => occursOn(a, d)).sort((a, b) => (cleanTime(a.starts_at) ?? '').localeCompare(cleanTime(b.starts_at) ?? '') || a.title.localeCompare(b.title)),
  };
}
// Which days of the grid have something, for the small markers.
export function markersFor(cells: readonly Cell[], tasks: readonly Task[], appointments: readonly Appointment[]): Map<string, { tasks: boolean; appointments: boolean }> {
  const out = new Map<string, { tasks: boolean; appointments: boolean }>();
  for (const c of cells) {
    const d = parseKey(c.key);
    if (!d) continue;
    const it = itemsOn(tasks, appointments, d);
    if (it.tasks.length || it.appointments.length) out.set(c.key, { tasks: it.tasks.length > 0, appointments: it.appointments.length > 0 });
  }
  return out;
}

// Appointments whose reminder time has arrived but which have not started yet (today or tomorrow, since the longest lead is one day).
export function upcomingReminders(appointments: readonly Appointment[], now: Date): { appointment: Appointment; start: Date }[] {
  const out: { appointment: Appointment; start: Date }[] = [];
  for (const offset of [0, 1]) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    for (const a of appointments) {
      if (a.remind_minutes <= 0 || !occursOn(a, day)) continue;
      const start = startOf(a, day);
      if (start.getTime() > now.getTime() && now.getTime() >= start.getTime() - a.remind_minutes * 60000) out.push({ appointment: a, start });
    }
  }
  return out.sort((x, y) => x.start.getTime() - y.start.getTime());
}

export type ApptInput = { title: string; note: string; date: string; time: string; repeat: string; remind: number };
export type ApptValid = { title: string; note: string | null; starts_on: string; starts_at: string; repeat: Repeat; remind_minutes: RemindMinutes };
export function validateAppointment(i: ApptInput): { ok: true; value: ApptValid } | { ok: false; error: string } {
  const title = i.title.trim();
  if (title.length < 1 || title.length > MAX_APPT_TITLE) return { ok: false, error: 'Enter a title of 1 to 60 characters.' };
  const note = i.note.trim();
  if (note.length > MAX_APPT_NOTE) return { ok: false, error: 'A note can be up to 200 characters.' };
  const date = parseKey(i.date.trim());
  if (!date || date.getFullYear() < 2000 || date.getFullYear() > 2100) return { ok: false, error: 'Enter a date as year-month-day, for example 2026-12-01.' };
  const time = cleanTime(i.time);
  if (!time) return { ok: false, error: 'Enter a time from 00:00 to 23:59.' };
  if (!(REPEATS as readonly string[]).includes(i.repeat)) return { ok: false, error: 'Choose how often it repeats.' };
  if (!(REMIND_OPTIONS as readonly number[]).includes(i.remind)) return { ok: false, error: 'Choose when to be reminded.' };
  return { ok: true, value: { title, note: note || null, starts_on: localDateKey(date), starts_at: time, repeat: i.repeat as Repeat, remind_minutes: i.remind as RemindMinutes } };
}
export const canAddAppointment = (count: number): boolean => count < MAX_APPOINTMENTS;

// ---- .ics file (RFC 5545). Times are "floating" (the calendar app reads them as the person's own local time). ----
const esc = (s: string): string => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r\n|\r|\n/g, '\\n');
const utf8Len = (cp: number): number => (cp < 0x80 ? 1 : cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4);
// Lines are folded at 75 bytes; the continuation starts with one space. Never splits a character.
export function fold(line: string): string {
  const parts: string[] = [];
  let cur = '', bytes = 0, limit = 75;
  for (const ch of line) {
    const n = utf8Len(ch.codePointAt(0) ?? 0);
    if (bytes + n > limit) { parts.push(cur); cur = ' '; bytes = 1; limit = 75; }
    cur += ch; bytes += n;
  }
  parts.push(cur);
  return parts.join('\r\n');
}
const stamp = (d: Date): string => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}00`;
const utcStamp = (d: Date): string => `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}T${String(d.getUTCHours()).padStart(2, '0')}${String(d.getUTCMinutes()).padStart(2, '0')}${String(d.getUTCSeconds()).padStart(2, '0')}Z`;

export function buildIcs(a: Appointment, now: Date): string {
  const first = parseKey(a.starts_on) ?? new Date(now);
  const start = startOf(a, first);
  const end = new Date(start.getTime() + 3600000);
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Health Companion//Calendar//EN', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT', `UID:${a.id}@health-companion`, `DTSTAMP:${utcStamp(now)}`,
    `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`, `SUMMARY:${esc(a.title)}`,
  ];
  if (a.note) lines.push(`DESCRIPTION:${esc(a.note)}`);
  if (a.repeat === 'weekly') lines.push('RRULE:FREQ=WEEKLY');
  if (a.repeat === 'monthly') lines.push('RRULE:FREQ=MONTHLY');
  if (a.remind_minutes > 0) lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(a.title)}`, `TRIGGER:-PT${a.remind_minutes}M`, 'END:VALARM');
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}
// A file name with no title in it, so the title is not exposed in a download list or share sheet.
export const icsFileName = (a: Pick<Appointment, 'starts_on'>): string => `appointment-${a.starts_on}.ics`;

// ---- Steppers: the appointment form has no typing for date and time, so nothing invalid can be entered. ----
export type DateUnit = 'day' | 'month' | 'year';
// Moves a year-month-day by one unit. A day past the end of the month is pulled back (31 January plus a month is 28 or 29 February). Years stay 2000 to 2100.
export function stepDate(key: string, unit: DateUnit, delta: number): string {
  const d = parseKey(key) ?? new Date();
  let y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
  if (unit === 'year') y = Math.min(2100, Math.max(2000, y + delta));
  if (unit === 'month') { const s = shiftMonth(y, m, delta); y = Math.min(2100, Math.max(2000, s.year)); m = s.year === y ? s.month : (delta > 0 ? 11 : 0); }
  const last = new Date(y, m + 1, 0).getDate();
  if (unit === 'day') { const n = new Date(y, m, day + delta); y = Math.min(2100, Math.max(2000, n.getFullYear())); return localDateKey(n.getFullYear() === y ? n : new Date(y, delta > 0 ? 11 : 0, delta > 0 ? 31 : 1)); }
  return localDateKey(new Date(y, m, Math.min(day, last)));
}
export type TimeUnit = 'hour' | 'minute';
// Hours wrap 23 to 0; minutes move in steps of 5 and wrap 55 to 0 without changing the hour.
export function stepTime(time: string, unit: TimeUnit, delta: number): string {
  const [h, m] = (cleanTime(time) ?? '09:00').split(':').map(Number);
  const nh = unit === 'hour' ? (h + delta + 24) % 24 : h;
  const nm = unit === 'minute' ? (m + delta * 5 + 60) % 60 : m;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}
