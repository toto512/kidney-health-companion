// @ts-ignore node types are not installed in this Expo project; vitest runs on node
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DICTS } from '../i18n/strings';
import { LANGUAGES, translate } from '../i18n/core';
import { MAX_APPOINTMENTS, MAX_APPT_NOTE, MAX_APPT_TITLE, REMIND_OPTIONS, REPEATS } from './calendarLogic';
import { Appointment, buildIcs, cleanTime, fold, icsFileName, itemsOn, markersFor, monthGrid, occursOn, parseKey, shiftMonth, stepDate, stepTime, upcomingReminders, validateAppointment, weekdayOrder, weekStartFor } from './calendarLogic';
import { Task } from './myDayLogic';

const appt = (o: Partial<Appointment> = {}): Appointment => ({ id: 'a1', title: 'Clinic', note: null, starts_on: '2026-11-19', starts_at: '09:30:00', repeat: 'none', remind_minutes: 0, ...o });
const task = (o: Partial<Task> = {}): Task => ({ id: 't1', template_key: null, title: 'Walk', time_of_day: 'morning', days: 127, ...o });
const d = (k: string) => parseKey(k)!;

describe('week start and grid', () => {
  it('follows the language', () => {
    expect(weekStartFor('en')).toBe(0); expect(weekStartFor('he')).toBe(0);
    expect(weekStartFor('fr')).toBe(1); expect(weekStartFor('es')).toBe(1);
    expect(weekdayOrder(0)).toEqual([0, 1, 2, 3, 4, 5, 6]); expect(weekdayOrder(1)).toEqual([1, 2, 3, 4, 5, 6, 0]);
  });
  it('November 2026 starts on a Sunday: 5 rows from Sunday, 5 rows plus a lead week from Monday', () => {
    const sun = monthGrid(2026, 10, 0);
    expect(sun).toHaveLength(5);
    expect(sun[0][0]).toEqual({ key: '2026-11-01', day: 1, inMonth: true });
    expect(sun[4][6]).toEqual({ key: '2026-12-05', day: 5, inMonth: false });
    const mon = monthGrid(2026, 10, 1);
    expect(mon).toHaveLength(6);
    expect(mon[0][0]).toEqual({ key: '2026-10-26', day: 26, inMonth: false });
    expect(mon[0][6].key).toBe('2026-11-01');
  });
  it('every row has 7 cells and every day of the month appears once', () => {
    for (const [y, m] of [[2026, 1], [2024, 1], [2026, 11], [2027, 0]]) for (const ws of [0, 1] as const) {
      const g = monthGrid(y, m, ws);
      expect(g.every((r) => r.length === 7)).toBe(true);
      const inMonth = g.flat().filter((c) => c.inMonth);
      expect(inMonth).toHaveLength(new Date(y, m + 1, 0).getDate());
    }
  });
  it('February 2026 starting on Sunday needs only 4 rows', () => expect(monthGrid(2026, 1, 0)).toHaveLength(4));
  it('shifts across years', () => {
    expect(shiftMonth(2026, 11, 1)).toEqual({ year: 2027, month: 0 });
    expect(shiftMonth(2026, 0, -1)).toEqual({ year: 2025, month: 11 });
  });
});

describe('dates and times', () => {
  it('rejects impossible dates', () => { expect(parseKey('2026-02-30')).toBeNull(); expect(parseKey('26-1-1')).toBeNull(); expect(parseKey('2026-11-19')).not.toBeNull(); });
  it('accepts 24-hour times only', () => {
    expect(cleanTime('09:30')).toBe('09:30'); expect(cleanTime('09:30:00')).toBe('09:30'); expect(cleanTime('23:59')).toBe('23:59'); expect(cleanTime('00:00')).toBe('00:00');
    for (const bad of ['24:00', '9:30', '09:60', '09:30 PM', '09:30:30', '']) expect(cleanTime(bad)).toBeNull();
  });
});

describe('which days an appointment falls on', () => {
  it('one-off: only its day', () => { expect(occursOn(appt(), d('2026-11-19'))).toBe(true); expect(occursOn(appt(), d('2026-11-20'))).toBe(false); });
  it('weekly: same weekday, never before the start', () => {
    const a = appt({ repeat: 'weekly' });
    expect(occursOn(a, d('2026-11-26'))).toBe(true); expect(occursOn(a, d('2026-11-27'))).toBe(false); expect(occursOn(a, d('2026-11-12'))).toBe(false);
  });
  it('monthly: same day of month, skips months without it', () => {
    const a = appt({ repeat: 'monthly', starts_on: '2026-01-31' });
    expect(occursOn(a, d('2026-03-31'))).toBe(true); expect(occursOn(a, d('2026-02-28'))).toBe(false); expect(occursOn(a, d('2025-12-31'))).toBe(false);
  });
  it('a bad stored date never matches', () => expect(occursOn(appt({ starts_on: 'nope' }), d('2026-11-19'))).toBe(false));
});

describe('day items and markers', () => {
  it('tasks come from their day mask (Monday 1 ... Sunday 64), appointments are sorted by time', () => {
    const tasks = [task({ id: 'mon', days: 1 }), task({ id: 'all' })];
    const a = [appt({ id: 'late', starts_at: '15:00' }), appt({ id: 'early', starts_at: '08:00' })];
    // 2026-11-19 is a Thursday
    const it = itemsOn(tasks, a, d('2026-11-19'));
    expect(it.tasks.map((x) => x.id)).toEqual(['all']);
    expect(it.appointments.map((x) => x.id)).toEqual(['early', 'late']);
    expect(itemsOn(tasks, a, d('2026-11-16')).tasks.map((x) => x.id)).toEqual(['mon', 'all']);
  });
  it('markers separate tasks from appointments and skip empty days', () => {
    const cells = monthGrid(2026, 10, 0).flat();
    const m = markersFor(cells, [task({ days: 8 })], [appt({ starts_on: '2026-11-20' })]); // Thursday tasks
    expect(m.get('2026-11-19')).toEqual({ tasks: true, appointments: false });
    expect(m.get('2026-11-20')).toEqual({ tasks: false, appointments: true });
    expect(m.get('2026-11-21')).toBeUndefined();
  });
});

describe('in-app reminders', () => {
  const now = new Date(2026, 10, 19, 8, 0);
  it('shows once the lead time has arrived and until it starts', () => {
    expect(upcomingReminders([appt({ remind_minutes: 60 })], now)).toHaveLength(0); // 09:30, window opens 08:30
    expect(upcomingReminders([appt({ remind_minutes: 60 })], new Date(2026, 10, 19, 8, 30))).toHaveLength(1);
    expect(upcomingReminders([appt({ remind_minutes: 60 })], new Date(2026, 10, 19, 9, 30))).toHaveLength(0);
  });
  it('one day before, and none when the reminder is off', () => {
    expect(upcomingReminders([appt({ remind_minutes: 1440, starts_on: '2026-11-20' })], new Date(2026, 10, 19, 12, 0))).toHaveLength(1);
    expect(upcomingReminders([appt({ remind_minutes: 0 })], new Date(2026, 10, 19, 9, 0))).toHaveLength(0);
  });
  it('a repeating appointment reminds for its next time', () => {
    expect(upcomingReminders([appt({ repeat: 'weekly', remind_minutes: 1440 })], new Date(2026, 10, 25, 10, 0))).toHaveLength(1);
  });
});

describe('validateAppointment', () => {
  const ok = { title: ' Clinic ', note: '  ', date: '2026-12-01', time: '09:30', repeat: 'weekly', remind: 60 };
  it('trims and stores an empty note as null', () => expect(validateAppointment(ok)).toEqual({ ok: true, value: { title: 'Clinic', note: null, starts_on: '2026-12-01', starts_at: '09:30', repeat: 'weekly', remind_minutes: 60 } }));
  it('refuses bad input', () => {
    for (const bad of [{ title: '' }, { title: 'x'.repeat(61) }, { note: 'n'.repeat(201) }, { date: '2026-02-30' }, { date: '1999-12-31' }, { date: '2101-01-01' }, { time: '24:00' }, { time: '9:30' }, { repeat: 'daily' }, { remind: 45 }])
      expect(validateAppointment({ ...ok, ...bad }).ok).toBe(false);
  });
});

describe('.ics', () => {
  const now = new Date(Date.UTC(2026, 10, 19, 12, 0, 0));
  const ics = buildIcs(appt({ title: 'Dr. Smith, clinic; room 2', note: 'Bring list\nand card', repeat: 'monthly', remind_minutes: 1440, starts_at: '23:30:00' }), now);
  it('uses CRLF and ends with a newline', () => { expect(ics.endsWith('\r\n')).toBe(true); expect(ics.replace(/\r\n/g, '').includes('\n')).toBe(false); });
  it('has the required parts', () => {
    for (const s of ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:', 'BEGIN:VEVENT', 'UID:a1@health-companion', 'DTSTAMP:20261119T120000Z', 'DTSTART:20261119T233000', 'DTEND:20261120T003000', 'RRULE:FREQ=MONTHLY', 'BEGIN:VALARM', 'TRIGGER:-PT1440M', 'END:VEVENT', 'END:VCALENDAR']) expect(ics).toContain(s);
  });
  it('escapes commas, semicolons and new lines', () => { expect(ics).toContain('SUMMARY:Dr. Smith\\, clinic\; room 2'); expect(ics).toContain('DESCRIPTION:Bring list\\nand card'); });
  it('leaves out the alarm and repeat when off', () => { const p = buildIcs(appt(), now); expect(p).not.toContain('VALARM'); expect(p).not.toContain('RRULE'); });
  it('folds long lines at 75 bytes without splitting a character', () => {
    const long = buildIcs(appt({ title: 'é'.repeat(60) }), now);
    for (const line of long.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(fold('A'.repeat(80)).split('\r\n')).toHaveLength(2);
    expect(long.replace(/\r\n /g, '')).toContain('SUMMARY:' + 'é'.repeat(60));
  });
  it('file name never contains the title', () => expect(icsFileName(appt({ title: 'Oncology' }))).toBe('appointment-2026-11-19.ics'));
});

describe('steppers', () => {
  it('moves a day across month and year ends', () => { expect(stepDate('2026-11-30', 'day', 1)).toBe('2026-12-01'); expect(stepDate('2026-01-01', 'day', -1)).toBe('2025-12-31'); });
  it('pulls a month step back to the last day', () => { expect(stepDate('2026-01-31', 'month', 1)).toBe('2026-02-28'); expect(stepDate('2024-01-31', 'month', 1)).toBe('2024-02-29'); expect(stepDate('2026-12-15', 'month', 1)).toBe('2027-01-15'); });
  it('a leap day moves to 28 February in a common year', () => expect(stepDate('2024-02-29', 'year', 1)).toBe('2025-02-28'));
  it('stays inside 2000 to 2100', () => { expect(stepDate('2100-06-01', 'year', 1)).toBe('2100-06-01'); expect(stepDate('2000-01-01', 'day', -1)).toBe('2000-01-01'); expect(stepDate('2100-12-31', 'day', 1)).toBe('2100-12-31'); expect(stepDate('2000-01-15', 'month', -1)).toBe('2000-01-15'); expect(stepDate('2100-12-15', 'month', 1)).toBe('2100-12-15'); });
  it('every stepped date passes validation', () => { let k = '2026-01-31'; for (let i = 0; i < 40; i++) { k = stepDate(k, 'month', 1); expect(parseKey(k)).not.toBeNull(); } });
  it('hours wrap; minutes step by 5 and wrap without touching the hour', () => {
    expect(stepTime('23:30', 'hour', 1)).toBe('00:30'); expect(stepTime('00:30', 'hour', -1)).toBe('23:30');
    expect(stepTime('09:55', 'minute', 1)).toBe('09:00'); expect(stepTime('09:00', 'minute', -1)).toBe('09:55'); expect(stepTime('09:30', 'minute', 1)).toBe('09:35');
  });
});

describe('database rules match the app rules (0016)', () => {
  const sql = readFileSync(new URL('../../../supabase/migrations/0016_appointments.sql', import.meta.url), 'utf8');
  it('repeat, reminder, limits and lengths', () => {
    expect(/repeat in \(([^)]*)\)/.exec(sql)?.[1].replace(/['\s]/g, '').split(',')).toEqual([...REPEATS]);
    expect(/remind_minutes in \(([^)]*)\)/.exec(sql)?.[1].replace(/\s/g, '').split(',').map(Number)).toEqual([...REMIND_OPTIONS]);
    expect(sql).toContain(`>= ${MAX_APPOINTMENTS} then`);
    expect(sql).toContain(`'You can save up to ${MAX_APPOINTMENTS} appointments.'`);
    expect(sql).toContain(`length(title) between 1 and ${MAX_APPT_TITLE}`);
    expect(sql).toContain(`length(note) between 1 and ${MAX_APPT_NOTE}`);
  });
  it('is owner-only with the two-step rule', () => {
    for (const s of ['enable row level security', 'revoke all on public.appointments from public, anon', 'require_aal2_if_enrolled', 'has_verified_mfa()', 'user_id = (select auth.uid())']) expect(sql).toContain(s);
  });
});

describe('every Calendar word resolves, on every screen, in every language', () => {
  const walk = (dir: URL): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((e: { name: string; isDirectory(): boolean }) =>
    e.isDirectory() ? walk(new URL(`${e.name}/`, dir)) : /\.(ts|tsx)$/.test(e.name) && !/\.test\./.test(e.name) ? [new URL(e.name, dir).pathname] : []);
  const used = new Set<string>();
  for (const f of walk(new URL('../', import.meta.url))) for (const m of readFileSync(f, 'utf8').matchAll(/['"`]((?:err\.appt[A-Za-z]*|(?:cal|appt)\.[A-Za-z0-9.]*[A-Za-z0-9]))['"`]/g)) used.add(m[1]);
  for (const r of REPEATS) used.add(`cal.repeat.${r}`);
  for (const m of REMIND_OPTIONS) used.add(`cal.remind.${m}`);
  it('finds the keys the screens use (guards the scan itself)', () => {
    for (const k of ['cal.title', 'cal.today', 'cal.remindersNote', 'appt.exportNotice', 'appt.save', 'err.apptTitle', 'cal.repeat.weekly', 'cal.remind.1440']) expect(used.has(k), k).toBe(true);
  });
  it('each key has real text in all four languages, not the key itself', () => {
    for (const l of LANGUAGES) for (const k of used) {
      expect(DICTS[l.code][k], `${l.code} ${k}`).toBeTruthy();
      expect(translate(DICTS, l.code, k), `${l.code} ${k}`).not.toBe(k);
    }
  });
  it('the on-screen reminder note says plainly that nothing rings', () => {
    expect(DICTS.en['cal.remindersNote']).toMatch(/does not ring/);
  });
});
