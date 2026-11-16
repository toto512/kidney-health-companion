// Pure helpers for the blood pressure chart. Nothing here says what a good or bad reading is.
export type ChartRow = { id: string; systolic: number; diastolic: number; pulse: number | null; taken_at: string };

export const RANGES = [7, 30, 90] as const;
export type RangeDays = (typeof RANGES)[number];

const DAY = 86_400_000;

// Readings taken within the last `days` days (up to `now`), oldest first.
export function windowRows(rows: ChartRow[], days: number, now: number): ChartRow[] {
  const from = now - days * DAY;
  return rows
    .filter((r) => { const t = Date.parse(r.taken_at); return Number.isFinite(t) && t >= from && t <= now + DAY; })
    .sort((a, b) => Date.parse(a.taken_at) - Date.parse(b.taken_at));
}

// A tidy vertical axis: 10 below the lowest bottom number, 10 above the highest top number, in steps that give at most 6 lines.
export function yScale(rows: ChartRow[]): { min: number; max: number; ticks: number[] } {
  const lo = Math.min(...rows.map((r) => r.diastolic));
  const hi = Math.max(...rows.map((r) => r.systolic));
  const min = Math.max(0, Math.floor((lo - 10) / 10) * 10);
  const max = Math.ceil((hi + 10) / 10) * 10;
  const step = [10, 20, 25, 50, 100].find((s) => (max - min) / s <= 5) ?? 100;
  const ticks: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max; v += step) ticks.push(v);
  return { min, max, ticks };
}

// Position along the time axis, 0 at the start of the window and 1 at the end.
export const xFraction = (t: number, from: number, to: number) => (to === from ? 0.5 : Math.min(1, Math.max(0, (t - from) / (to - from))));

// One line of text for the chart, also read out to screen readers.
export function summary(rows: ChartRow[], days: number): string {
  if (rows.length === 0) return `Last ${days} days: no readings.`;
  const sys = rows.map((r) => r.systolic); const dia = rows.map((r) => r.diastolic);
  const span = (a: number[]) => (Math.min(...a) === Math.max(...a) ? `${Math.min(...a)}` : `${Math.min(...a)} to ${Math.max(...a)}`);
  return `Last ${days} days: ${rows.length} ${rows.length === 1 ? 'reading' : 'readings'}, top ${span(sys)}, bottom ${span(dia)}.`;
}
