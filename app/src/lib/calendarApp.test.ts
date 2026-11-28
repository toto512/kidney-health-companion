// @ts-ignore node types are not installed in this Expo project; vitest runs on node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DICTS } from '../i18n/strings';
import { LANGUAGES, translate } from '../i18n/core';
import { calendarAppLabel, calendarHint } from '../i18n/labels';
import { CALENDAR_APPS, isCalendarApp } from './calendarApp';

const t = (k: string) => k;
describe('calendar the person uses', () => {
  it('knows six choices and nothing else', () => {
    expect([...CALENDAR_APPS]).toEqual(['google', 'outlook', 'apple', 'other', 'none', 'unsure']);
    for (const v of ['yahoo', '', null, undefined, 3]) expect(isCalendarApp(v)).toBe(false);
  });
  it('database list matches (0017)', () => {
    const sql = readFileSync(new URL('../../../supabase/migrations/0017_calendar_app.sql', import.meta.url), 'utf8');
    expect(/calendar_app in \(([^)]*)\)/.exec(sql)?.[1].replace(/['\s]/g, '').split(',')).toEqual([...CALENDAR_APPS]);
    expect(sql).toContain('add column if not exists calendar_app');
    expect(sql).not.toMatch(/policy|grant|revoke/i); // row-level security is unchanged
  });
  it('hint follows the choice and falls back to the generic one', () => {
    expect(calendarHint(t as never, 'google')).toBe('cal.hint.google');
    for (const v of ['none', 'unsure', null]) expect(calendarHint(t as never, v)).toBe('cal.hint.generic');
    expect(calendarAppLabel(t as never, 'apple')).toBe('calapp.apple');
  });
  it('every word resolves in all four languages, and the screen says it does not connect', () => {
    const keys = ['me.calendarApp', 'calapp.title', 'calapp.question', 'calapp.notConnected', 'calapp.continue', 'calapp.errSave', ...CALENDAR_APPS.map((v) => `calapp.${v}`), 'cal.hint.google', 'cal.hint.outlook', 'cal.hint.apple', 'cal.hint.other', 'cal.hint.generic'];
    for (const l of LANGUAGES) for (const k of keys) {
      expect(DICTS[l.code][k], `${l.code} ${k}`).toBeTruthy();
      expect(translate(DICTS, l.code, k), `${l.code} ${k}`).not.toBe(k);
    }
    expect(DICTS.en['calapp.notConnected']).toMatch(/does not connect to your calendar yet/);
    expect(DICTS.en['calapp.notConnected']).not.toMatch(/\b(soon|202\d|next month|coming)\b/i); // no promised date
  });
});
