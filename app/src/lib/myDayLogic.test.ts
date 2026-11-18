// @ts-ignore node types are not installed in this Expo project; vitest runs on node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DICTS } from '../i18n/strings';
import { LANGUAGES } from '../i18n/core';
import { trError } from '../i18n/labels';
import { canAddMore, dayBit, DAY_BITS, daysSummary, dueTasks, EVERY_DAY, groupByTime, isDueOn, isValidDays, localDateKey, MAX_TASKS, MAX_TITLE, progress, Task, TEMPLATES, TIMES, toggleDay, validateTask, weekdayName } from './myDayLogic';

const mon = new Date(2024, 0, 1); // Monday 1 January 2024
const sun = new Date(2024, 0, 7);
const sat = new Date(2024, 0, 6);
const task = (id: string, time: Task['time_of_day'], days: number, title = id): Task => ({ id, template_key: null, title, time_of_day: time, days });

describe('days of the week', () => {
  it('Monday is bit 1 and Sunday is bit 64', () => {
    expect(dayBit(mon)).toBe(1);
    expect(dayBit(sat)).toBe(32);
    expect(dayBit(sun)).toBe(64);
    expect(DAY_BITS.reduce((a, b) => a | b, 0)).toBe(EVERY_DAY);
  });
  it('isDueOn and toggleDay', () => {
    expect(isDueOn(EVERY_DAY, sun)).toBe(true);
    expect(isDueOn(1 | 4, mon)).toBe(true);
    expect(isDueOn(1 | 4, sun)).toBe(false);
    expect(toggleDay(1, 4)).toBe(5);
    expect(toggleDay(5, 4)).toBe(1);
  });
  it('days must be a whole number from 1 to 127', () => {
    for (const bad of [0, 128, -1, 1.5, NaN, '3', null]) expect(isValidDays(bad as never), String(bad)).toBe(false);
    for (const ok of [1, 64, 127]) expect(isValidDays(ok)).toBe(true);
  });
  it('the date key is the local calendar date, not UTC', () => {
    expect(localDateKey(new Date(2026, 10, 18, 23, 59))).toBe('2026-11-18');
    expect(localDateKey(new Date(2026, 0, 5, 0, 5))).toBe('2026-01-05');
  });
});

describe('template menu', () => {
  it('has the 12 agreed tasks, each once, with a valid time and days', () => {
    expect(TEMPLATES.map((t) => t.key)).toEqual(['medicines', 'blood-pressure', 'meal', 'water', 'walk', 'call', 'bed', 'pillbox', 'mail', 'groceries', 'laundry', 'appointments']);
    for (const t of TEMPLATES) {
      expect(TIMES as readonly string[]).toContain(t.time);
      expect(isValidDays(t.days), t.key).toBe(true);
    }
  });
  it('only links to screens that exist', () => {
    for (const t of TEMPLATES) {
      const link = (t as { link?: string }).link;
      if (!link) continue;
      expect(() => readFileSync(new URL(`../app${link}.tsx`, import.meta.url), 'utf8'), link).not.toThrow();
    }
  });
  it('every language has every task name, and none carries an amount or number', () => {
    for (const l of LANGUAGES) for (const t of TEMPLATES) {
      const v = DICTS[l.code][`myday.tpl.${t.key}`];
      expect(v, `${l.code} ${t.key}`).toBeTruthy();
      expect(v, `${l.code} ${t.key}`).not.toMatch(/[0-9]/);
    }
  });
  it('the database allows exactly these templates, times, days, limits and title length', () => {
    const sql = readFileSync(new URL('../../../supabase/migrations/0013_my_day.sql', import.meta.url), 'utf8');
    const list = (re: RegExp) => [...(sql.match(re)?.[1] ?? '').matchAll(/'([a-z-]+)'/g)].map((m) => m[1]);
    expect(list(/template_key in \(([^)]*)\)/)).toEqual(TEMPLATES.map((t) => t.key));
    expect(list(/time_of_day in \(([^)]*)\)/)).toEqual([...TIMES]);
    expect(sql).toContain(`days between 1 and ${EVERY_DAY}`);
    expect(sql).toContain(`length(title) between 1 and ${MAX_TITLE}`);
    expect(sql).toContain(`>= ${MAX_TASKS} then`);
    expect(sql).toContain(`up to ${MAX_TASKS} tasks`);
  });
});

describe('validateTask', () => {
  const base = { template: null, title: 'Water the plants', time: 'midday', days: 5 };
  it('accepts a typed task and tidies spaces', () => {
    expect(validateTask({ ...base, title: '  Water   the plants ' })).toEqual({ ok: true, value: { template_key: null, title: 'Water the plants', time_of_day: 'midday', days: 5 } });
  });
  it('accepts a menu task and drops any typed title', () => {
    expect(validateTask({ template: 'walk', title: 'ignored', time: 'midday', days: EVERY_DAY })).toEqual({ ok: true, value: { template_key: 'walk', title: null, time_of_day: 'midday', days: EVERY_DAY } });
  });
  it('rejects what the database would reject', () => {
    const errors = [
      validateTask({ ...base, template: 'flying' }),
      validateTask({ ...base, title: '   ' }),
      validateTask({ ...base, title: 'a'.repeat(MAX_TITLE + 1) }),
      validateTask({ ...base, time: 'afternoon' }),
      validateTask({ ...base, days: 0 }),
      validateTask({ ...base, days: 128 }),
    ];
    for (const e of errors) expect(e.ok).toBe(false);
    expect(validateTask({ ...base, title: 'a'.repeat(MAX_TITLE) }).ok).toBe(true);
  });
  it('every error message is translatable', () => {
    const t = (k: string) => `T:${k}`;
    for (const e of [
      validateTask({ ...base, template: 'flying' }), validateTask({ ...base, title: '' }), validateTask({ ...base, title: 'a'.repeat(61) }),
      validateTask({ ...base, time: 'x' }), validateTask({ ...base, days: 0 }),
    ]) { expect(e.ok).toBe(false); if (!e.ok) expect(trError(t as never, e.error), e.error).toMatch(/^T:err\.myday/); }
  });
  it('the list holds at most 20 tasks', () => {
    expect(canAddMore(MAX_TASKS - 1)).toBe(true);
    expect(canAddMore(MAX_TASKS)).toBe(false);
  });
});

describe('the list for a day', () => {
  const tasks = [task('a', 'evening', EVERY_DAY), task('b', 'morning', 1), task('c', 'morning', EVERY_DAY), task('d', 'midday', 64)];
  it('keeps only tasks due that day, in time-of-day then added order', () => {
    expect(dueTasks(tasks, mon).map((t) => t.id)).toEqual(['b', 'c', 'a']);
    expect(dueTasks(tasks, sun).map((t) => t.id)).toEqual(['c', 'd', 'a']);
  });
  it('groups by time of day and skips empty groups', () => {
    expect(groupByTime(tasks, mon).map((g) => [g.time, g.tasks.map((t) => t.id)])).toEqual([['morning', ['b', 'c']], ['evening', ['a']]]);
  });
  it('progress counts only tasks due that day and ticks for them', () => {
    expect(progress(tasks, new Set(['a', 'b']), mon)).toEqual({ done: 2, total: 3 });
    expect(progress(tasks, new Set(['d']), mon)).toEqual({ done: 0, total: 3 }); // d is not due on Monday
    expect(progress([], new Set(), mon)).toEqual({ done: 0, total: 0 });
  });
});

describe('weekday names follow the language', () => {
  it('English short names, Monday first', () => {
    expect([0, 1, 2, 3, 4, 5, 6].map((i) => weekdayName(i, 'en', 'short'))).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  });
  it('every language gives seven different names', () => {
    for (const l of LANGUAGES) expect(new Set([0, 1, 2, 3, 4, 5, 6].map((i) => weekdayName(i, l.code, 'long'))).size, l.code).toBe(7);
  });
  it('summary says every day or lists the days', () => {
    expect(daysSummary(EVERY_DAY, 'en', 'every day')).toBe('every day');
    expect(daysSummary(1 | 4, 'en', 'every day')).toBe('Mon, Wed');
  });
});
