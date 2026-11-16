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
