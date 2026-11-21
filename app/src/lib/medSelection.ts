// Pure helpers for the "medicines I take" picker. Names only: nothing here knows about doses or schedules.
export const MAX_CUSTOM = 100;

// Trims and collapses spaces. Returns null for an empty or too-long name.
export function normalizeCustomName(raw: string): string | null {
  const s = raw.replace(/\s+/g, ' ').trim();
  return s.length >= 1 && s.length <= MAX_CUSTOM ? s : null;
}

// Adds a custom name unless the same name (ignoring case) is already there or it does not fit the limits.
export function addCustom(list: string[], raw: string): { list: string[]; error: string | null } {
  const n = normalizeCustomName(raw);
  if (!n) return { list, error: raw.trim() ? `Use ${MAX_CUSTOM} characters or fewer.` : 'Type a name first.' };
  if (list.some((x) => x.toLowerCase() === n.toLowerCase())) return { list, error: 'That name is already on your list.' };
  return { list: [...list, n], error: null };
}

const lower = (xs: string[]) => new Map(xs.map((x) => [x.toLowerCase(), x]));
// Customs compare ignoring case, matching the database's unique index.
export function diffCustom(saved: string[], wanted: string[]): { add: string[]; remove: string[] } {
  const s = lower(saved); const w = lower(wanted);
  return { add: [...w].filter(([k]) => !s.has(k)).map(([, v]) => v), remove: [...s].filter(([k]) => !w.has(k)).map(([, v]) => v) };
}

// Strength is the person's own text, as on their label ("150 mcg", "300 mg", "5 ml"). The app never suggests one.
export const MAX_STRENGTH = 40;
const STRENGTH_CHARS = /^[A-Za-z0-9µμ .,/%+()-]+$/; // same rule as the database check in migration 0009

export function normalizeStrength(raw: string): { value: string | null; error: string | null } {
  const s = raw.replace(/\s+/g, ' ').trim();
  if (!s) return { value: null, error: null }; // empty means no strength
  if (s.length > MAX_STRENGTH) return { value: null, error: `Use ${MAX_STRENGTH} characters or fewer.` };
  if (!STRENGTH_CHARS.test(s)) return { value: null, error: 'Use letters, numbers and simple marks only, for example 150 mcg.' };
  return { value: s, error: null };
}

// One key per medicine in the strengths map: list items by id, own names by lower-case name (matches the unique index).
export const listKey = (medId: string) => `m:${medId}`;
export const customKey = (name: string) => `c:${name.toLowerCase()}`;

// Keys whose strength differs between saved and wanted, among medicines present in both. Empty strings count as none.
export function changedStrengths(saved: Record<string, string>, wanted: Record<string, string>, keys: string[]): string[] {
  return keys.filter((k) => (saved[k] ?? '') !== (wanted[k] ?? ''));
}
