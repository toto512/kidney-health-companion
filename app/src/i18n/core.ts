// Pure language logic (no react-native imports, so it is unit tested).
export const LANGUAGES = [
  { code: 'en', native: 'English', rtl: false },
  { code: 'fr', native: 'Français', rtl: false },
  { code: 'es', native: 'Español', rtl: false },
  { code: 'he', native: 'עברית', rtl: true },
] as const;
export type Lang = (typeof LANGUAGES)[number]['code'];
export const DEFAULT_LANG: Lang = 'en';

export const isLang = (v: unknown): v is Lang => typeof v === 'string' && LANGUAGES.some((l) => l.code === v);
export const isRtl = (l: Lang) => LANGUAGES.find((x) => x.code === l)?.rtl ?? false;

// Device language tags look like "fr-CA", "he-IL", "iw" (old Hebrew code). Returns the first tag we support.
export function languageFromTags(tags: readonly string[]): Lang {
  for (const raw of tags) {
    const base = raw.toLowerCase().split(/[-_]/)[0];
    const code = base === 'iw' ? 'he' : base;
    if (isLang(code)) return code;
  }
  return DEFAULT_LANG;
}

// A saved choice (account or device) wins over the device language.
export function resolveLanguage(saved: unknown, deviceTags: readonly string[]): Lang {
  return isLang(saved) ? saved : languageFromTags(deviceTags);
}

// "Hello {name}" with { name: 'Ana' }. A missing variable stays visible as {name} so it is noticed in testing.
// Phone and emergency numbers are wrapped in a left-to-right isolate (U+2066 ... U+2069) so right-to-left text cannot reorder "9-1-1" or "+1 613 555 0123".
export const LTR_VARS = ['number', 'phone'];
export const ltrIsolate = (s: string) => '\u2066' + s + '\u2069';
export function format(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? (LTR_VARS.includes(k) ? ltrIsolate(String(vars[k])) : String(vars[k])) : m));
}

export type Dict = Record<string, string>;
// Falls back to English, then to the key itself, so a missing translation never shows a blank.
export function translate(dicts: Record<Lang, Dict>, lang: Lang, key: string, vars?: Record<string, string | number>): string {
  return format(dicts[lang][key] ?? dicts.en[key] ?? key, vars);
}

// Dates and numbers follow the language. Hebrew uses Gregorian dates with Western digits here (explicit, not left to the device).
export const localeTag = (l: Lang) => (l === 'he' ? 'he-IL-u-nu-latn' : l);
export const formatDate = (iso: string | number | Date, l: Lang) => new Date(iso).toLocaleDateString(localeTag(l));
