import type { PlateTotal } from './plateScan';

// Salt log: sodium totals saved from the plate scan. Pure logic only (storage is in saltLogData.ts).
// Rules: official numbers only, no daily target, no good or bad label. A total never claims to be complete:
// every total carries how many foods were counted and how many had no official number.
export type SaltRow = { id: string; logged_on: string; sodium_mg: number; foods_counted: number; foods_total: number };
export type SaltDraft = { logged_on: string; sodium_mg: number; foods_counted: number; foods_total: number };
export const SALT_RANGES = [7, 30] as const;
export type SaltRange = (typeof SALT_RANGES)[number];
export const MAX_SALT_PLATES = 500;
export const MAX_SODIUM_MG = 100_000;
export const DAY_MS = 86_400_000;

const pad = (n: number) => String(n).padStart(2, '0');
/** The person's own calendar day as YYYY-MM-DD (device time zone, not UTC). */
export const localIso = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const isoToUtc = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d); };
export const addDays = (iso: string, n: number): string => new Date(isoToUtc(iso) + n * DAY_MS).toISOString().slice(0, 10);

/**
 * What the plate scan can save: the sodium total (whole mg) and the two food counts. null when no food on the plate has an official sodium value
 * (nothing to save) or the total is out of the range the table allows.
 */
export function draftFromTotals(totals: PlateTotal[], today: string): SaltDraft | null {
  const s = totals.find((x) => x.nutrient === 'sodiumMg');
  if (!s || s.value === null || s.counted < 1 || s.of < s.counted) return null;
  const mg = Math.round(s.value);
  if (!Number.isFinite(mg) || mg < 0 || mg > MAX_SODIUM_MG) return null;
  return { logged_on: today, sodium_mg: mg, foods_counted: s.counted, foods_total: s.of };
}

export type SaltDay = { day: string; mg: number; plates: SaltRow[]; counted: number; total: number; missing: number };
/** One entry per day that has saved plates, newest day first, plates within a day oldest first (the order they are shown as Plate 1, 2, ...). */
export function byDay(rows: SaltRow[]): SaltDay[] {
  const m = new Map<string, SaltRow[]>();
  for (const r of rows) m.set(r.logged_on, [...(m.get(r.logged_on) ?? []), r]);
  return [...m.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0))
    .map(([day, plates]) => {
      const counted = plates.reduce((a, p) => a + p.foods_counted, 0);
      const total = plates.reduce((a, p) => a + p.foods_total, 0);
      return { day, mg: plates.reduce((a, p) => a + p.sodium_mg, 0), plates, counted, total, missing: total - counted };
    });
}

export type SaltPoint = { day: string; mg: number | null };
/** Every calendar day of the window ending today (oldest first). mg is null on days with nothing saved: a gap, never a zero. */
export function windowPoints(rows: SaltRow[], days: number, today: string): SaltPoint[] {
  const sums = new Map(byDay(rows).map((d) => [d.day, d.mg] as const));
  return Array.from({ length: days }, (_, i) => { const day = addDays(today, i - (days - 1)); return { day, mg: sums.get(day) ?? null }; });
}

/** Rows inside the window (used for the day list under the chart). */
export const inWindow = (rows: SaltRow[], days: number, today: string): SaltRow[] => {
  const from = addDays(today, -(days - 1));
  return rows.filter((r) => r.logged_on >= from && r.logged_on <= today);
};

/** Top of the chart axis and up to 5 tick lines, from 0. Rounded up to a "nice" step so the lines read as plain numbers. */
export function axis(points: SaltPoint[]): { max: number; ticks: number[] } {
  const top = Math.max(0, ...points.map((p) => p.mg ?? 0));
  if (top === 0) return { max: 1000, ticks: [0, 500, 1000] };
  const steps = [100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000, 50000];
  const step = steps.find((s) => Math.ceil(top / s) <= 4) ?? 50000;
  const max = Math.ceil(top / step) * step;
  return { max, ticks: Array.from({ length: max / step + 1 }, (_, i) => i * step) };
}

/** Validate a plate before saving (the database enforces the same limits). */
export function canSave(d: SaltDraft | null, existingCount: number): 'ok' | 'none' | 'limit' {
  if (!d) return 'none';
  return existingCount >= MAX_SALT_PLATES ? 'limit' : 'ok';
}
