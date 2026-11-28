// Pure helpers for the weight chart. Nothing here says what a good or bad weight is, and there is no target line.
import { fromKg, type WeightUnit } from './weight';

export type WeightRow = { id: string; weight_kg: number; entered_unit: WeightUnit; taken_at: string };

export const RANGES = [7, 30, 90] as const;
export type RangeDays = (typeof RANGES)[number];
const DAY = 86_400_000;

// Readings taken within the last `days` days (up to `now`), oldest first.
export function windowWeights(rows: WeightRow[], days: number, now: number): WeightRow[] {
  const from = now - days * DAY;
  return rows
    .filter((r) => { const t = Date.parse(r.taken_at); return Number.isFinite(t) && t >= from && t <= now + DAY; })
    .sort((a, b) => Date.parse(a.taken_at) - Date.parse(b.taken_at));
}

// A tidy vertical axis in the chosen unit: a little room under the lowest and over the highest, at most 6 lines.
export function weightScale(rows: WeightRow[], unit: WeightUnit): { min: number; max: number; ticks: number[] } {
  const v = rows.map((r) => fromKg(r.weight_kg, unit));
  const lo = Math.min(...v); const hi = Math.max(...v);
  const pad = Math.max(1, Math.ceil((hi - lo) * 0.15));
  const step = [1, 2, 5, 10, 20, 50, 100].find((s) => Math.ceil((hi + pad) / s) * s - Math.floor((lo - pad) / s) * s <= s * 5) ?? 100;
  const min = Math.max(0, Math.floor((lo - pad) / step) * step);
  const max = Math.ceil((hi + pad) / step) * step;
  const ticks: number[] = [];
  for (let t = min; t <= max + 1e-9; t += step) ticks.push(t);
  return { min, max, ticks };
}

// The lowest and highest weight in the window, in the chosen unit (for the one-line summary, also read to screen readers).
export function weightSpan(rows: WeightRow[], unit: WeightUnit): { lo: number; hi: number } | null {
  if (rows.length === 0) return null;
  const v = rows.map((r) => fromKg(r.weight_kg, unit));
  return { lo: Math.min(...v), hi: Math.max(...v) };
}

// Latest reading in the window minus the first, in the chosen unit, rounded to 1 decimal. Neutral: a number with a sign, no word like gain or loss.
export function changeInWindow(rows: WeightRow[], unit: WeightUnit): number | null {
  if (rows.length < 2) return null;
  return Math.round((fromKg(rows[rows.length - 1].weight_kg, unit) - fromKg(rows[0].weight_kg, unit)) * 10) / 10;
}
