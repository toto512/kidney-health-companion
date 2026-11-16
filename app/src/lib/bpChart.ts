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

export type Weekly = { start: number; end: number; n: number; sys: number; dia: number };

// Average top and bottom per 7-day block, newest block ends at `now`. Blocks with no readings are left out.
export function weeklyAverages(rows: ChartRow[], days: number, now: number): Weekly[] {
  const blocks = Math.ceil(days / 7);
  const out: Weekly[] = [];
  for (let b = blocks - 1; b >= 0; b--) {
    const end = now - b * 7 * DAY; const start = end - 7 * DAY;
    const inB = rows.filter((r) => { const t = Date.parse(r.taken_at); return t > start && t <= end; });
    if (inB.length === 0) continue;
    const avg = (k: 'systolic' | 'diastolic') => Math.round(inB.reduce((s, r) => s + r[k], 0) / inB.length);
    out.push({ start, end, n: inB.length, sys: avg('systolic'), dia: avg('diastolic') });
  }
  return out;
}

export type Bin = { from: number; to: number; count: number; percent: number };

// Counts per 10 mmHg range (120 to 129 and so on), from the lowest to the highest range that has a reading. Empty ranges in between stay in.
export function bins(rows: ChartRow[], key: 'systolic' | 'diastolic'): Bin[] {
  if (rows.length === 0) return [];
  const vals = rows.map((r) => r[key]);
  const lo = Math.floor(Math.min(...vals) / 10) * 10; const hi = Math.floor(Math.max(...vals) / 10) * 10;
  const out: Bin[] = [];
  for (let f = lo; f <= hi; f += 10) {
    const count = vals.filter((v) => v >= f && v < f + 10).length;
    out.push({ from: f, to: f + 9, count, percent: Math.round((count / vals.length) * 100) });
  }
  return out;
}

export const binLabel = (b: Bin) => `${b.from} to ${b.to}`;

export function weeklySummary(w: Weekly[], days: number): string {
  if (w.length === 0) return `Last ${days} days: no readings.`;
  return `Weekly averages, last ${days} days: ` + w.map((x) => `${new Date(x.end).toLocaleDateString('en', { month: 'short', day: 'numeric' })} week, top ${x.sys}, bottom ${x.dia}, ${x.n} ${x.n === 1 ? 'reading' : 'readings'}`).join('; ') + '.';
}

export function spreadSummary(b: Bin[], label: string, days: number): string {
  const used = b.filter((x) => x.count > 0);
  if (used.length === 0) return `Last ${days} days: no readings.`;
  return `${label} number, last ${days} days, readings per 10 point range: ` + used.map((x) => `${binLabel(x)}: ${x.count} (${x.percent}%)`).join('; ') + '.';
}
