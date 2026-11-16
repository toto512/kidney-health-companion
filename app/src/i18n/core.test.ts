import { describe, expect, it } from 'vitest';
import { DEFAULT_LANG, format, formatDate, isRtl, languageFromTags, LANGUAGES, resolveLanguage, translate } from './core';
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
        expect(vars(d[k]), `${l.code}.${k}`).toBe(vars(en[k as keyof typeof en]));
      }
    });
  }
});
