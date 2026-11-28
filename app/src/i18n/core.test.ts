import { describe, expect, it } from 'vitest';
import { DEFAULT_LANG, format, formatDate, isRtl, languageFromTags, LANGUAGES, resolveLanguage, translate, nowHeading, calendarDate } from './core';
import { DICTS } from './strings';
import { en } from './strings/en';

describe('language choice', () => {
  it('maps device tags to a supported language', () => {
    expect(languageFromTags(['he-IL'])).toBe('he');
    expect(languageFromTags(['iw'])).toBe('he');
    expect(languageFromTags(['fr-CA', 'en-CA'])).toBe('fr');
    expect(languageFromTags(['es_MX'])).toBe('es');
  });
  it('skips unsupported tags and falls back to English', () => {
    expect(languageFromTags(['de-DE', 'fr-FR'])).toBe('fr');
    expect(languageFromTags(['ja-JP'])).toBe(DEFAULT_LANG);
    expect(languageFromTags([])).toBe(DEFAULT_LANG);
  });
  it('a saved choice wins over the device', () => {
    expect(resolveLanguage('en', ['he-IL'])).toBe('en');
    expect(resolveLanguage(null, ['he-IL'])).toBe('he');
    expect(resolveLanguage('xx', ['fr'])).toBe('fr');
  });
  it('only Hebrew is right to left for now', () => {
    expect(LANGUAGES.filter((l) => isRtl(l.code)).map((l) => l.code)).toEqual(['he']);
  });
});

describe('translate', () => {
  it('fills variables and keeps unknown ones visible', () => {
    expect(format('Hi {name}', { name: 'Ana' })).toBe('Hi Ana');
    expect(format('Hi {name}')).toBe('Hi {name}');
    expect(format('Hi {name}', {})).toBe('Hi {name}');
  });
  it('falls back to English, then to the key', () => {
    const d = { ...DICTS, fr: {} };
    expect(translate(d, 'fr', 'tab.today')).toBe(en['tab.today']);
    expect(translate(d, 'fr', 'nope')).toBe('nope');
  });
  it('formats dates with Western digits for Hebrew', () => {
    expect(formatDate('2026-11-16T12:00:00Z', 'he')).toMatch(/2026/);
  });
});

describe('every language is complete', () => {
  const vars = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(',');
  for (const l of LANGUAGES) {
    it(`${l.code} has exactly the English keys and the same placeholders`, () => {
      const d = DICTS[l.code];
      expect(Object.keys(d).sort()).toEqual(Object.keys(en).sort());
      for (const k of Object.keys(en)) {
        expect(d[k], `${l.code}.${k}`).toBeTruthy();
        // Hebrew says "one reading" without the number, so the singular form may drop {n}.
        if (!(l.code === 'he' && (k === 'chart.one' || k === 'weight.one'))) expect(vars(d[k]), `${l.code}.${k}`).toBe(vars(en[k as keyof typeof en]));
      }
    });
  }
});

import { trError } from './labels';
import { validateContact } from '../lib/contactLogic';
import { parseProfile } from '../lib/profile';
describe('validation messages are all translatable', () => {
  const t = (k: string) => `T:${k}`;
  it('maps contact and profile errors', () => {
    const cases = [
      validateContact({ name: '', relationship: 'doctor', phone: '+16135550123' }, 'CA'),
      validateContact({ name: 'A', relationship: '', phone: '+16135550123' }, 'CA'),
      validateContact({ name: 'A', relationship: 'doctor', phone: 'x' }, 'CA'),
      validateContact({ name: 'A'.repeat(61), relationship: 'doctor', phone: '+16135550123' }, 'CA'),
      parseProfile({ name: '', dob: '', sex: '', height: '', weight: '', country: '' }, new Date()),
      parseProfile({ name: '', dob: 'x', sex: '', height: '', weight: '', country: 'CA' }, new Date()),
      parseProfile({ name: '', dob: '1950-03-27', sex: '', height: '', weight: '', country: 'CA' }, new Date()),
      parseProfile({ name: '', dob: '1950-03-27', sex: 'male', height: '10', weight: '', country: 'CA' }, new Date()),
      parseProfile({ name: '', dob: '1950-03-27', sex: 'male', height: '170', weight: '1', country: 'CA' }, new Date()),
    ];
    for (const c of cases) { expect(c.ok).toBe(false); if (!c.ok) expect(trError(t as never, c.error), c.error).toMatch(/^T:err\./); }
  });
});

describe('phone and emergency numbers in right-to-left text', () => {
  const strip = (s: string) => s.replace(/[⁦⁩]/g, '');
  it('every {number} and {phone} placeholder in every language is isolated and keeps its characters', () => {
    for (const lang of ['en', 'fr', 'es', 'he'] as const) {
      for (const [key, tpl] of Object.entries(DICTS[lang])) {
        if (!/\{(number|phone)\}/.test(tpl)) continue;
        const out = translate(DICTS, lang, key, { number: '9-1-1', phone: '+1 613 555 0123', name: 'X', label: 'L', relationship: 'R' });
        for (const v of ['9-1-1', '+1 613 555 0123']) {
          if (out.includes(v)) expect(out, `${lang} ${key}`).toContain('⁦' + v + '⁩');
        }
        expect(strip(out), `${lang} ${key}`).not.toMatch(/\{(number|phone)\}/);
      }
    }
  });
  it('Hebrew emergency call text contains the number unchanged inside an isolate', () => {
    const out = translate(DICTS, 'he', 'emergency.callNow', { number: '9-1-1' });
    expect(out).toBe('להתקשר עכשיו אל ⁦9-1-1⁩');
  });
});

describe('Today heading with the real day and time', () => {
  const thu = new Date(2026, 10, 19, 21, 51); // Thursday 19 November 2026, 21:51 local
  const strip = (s: string) => s.replace(/[\u2066\u2069]/g, '');
  it('English shows the weekday, day-first date and 24-hour time', () => {
    expect(strip(nowHeading(thu, 'en'))).toBe('Thursday, 19 November, 21:51');
  });
  it('midnight is 00:05 and noon 12:00, never 24:05 or AM/PM', () => {
    expect(strip(nowHeading(new Date(2026, 10, 20, 0, 5), 'en'))).toMatch(/, 00:05$/);
    expect(strip(nowHeading(new Date(2026, 10, 20, 12, 0), 'en'))).toMatch(/, 12:00$/);
    for (const l of LANGUAGES) expect(strip(nowHeading(new Date(2026, 10, 20, 15, 7), l.code)), l.code).not.toMatch(/AM|PM|\bam\b|\bpm\b/i);
  });
  it('every language gives a different weekday name and Latin digits, with the time kept left-to-right', () => {
    const heads = LANGUAGES.map((l) => nowHeading(thu, l.code));
    expect(new Set(heads.map(strip)).size).toBe(LANGUAGES.length);
    for (const h of heads) { expect(h).toContain('\u206621:51\u2069'); expect(h).toMatch(/19/); }
  });
});

describe('calendarDate', () => {
  const d = new Date(2026, 10, 19);
  it('English is day first', () => expect(calendarDate(d, 'en', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })).toMatch(/^Thursday,? 19 November 2026$/));
  it('month and year only', () => expect(calendarDate(d, 'en', { month: 'long', year: 'numeric' })).toBe('November 2026'));
  it('French uses its own month name', () => expect(calendarDate(d, 'fr', { month: 'long', year: 'numeric' })).toBe('novembre 2026'));
});
