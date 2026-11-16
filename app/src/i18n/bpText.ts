import { binLabel, type Bin, type ChartRow, type Weekly } from '../lib/bpChart';
import { localeTag, type Lang } from './core';
import type { Key } from './strings/en';

type T = (k: Key, v?: Record<string, string | number>) => string;

export const readingsText = (t: T, n: number) => t(n === 1 ? 'chart.one' : 'chart.many', { n });
export const dayText = (iso: string | number | Date, lang: Lang) => new Date(iso).toLocaleDateString(localeTag(lang), { month: 'short', day: 'numeric' });
export const dateTimeText = (iso: string | number | Date, lang: Lang) => new Date(iso).toLocaleString(localeTag(lang), { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

// Same sentences as src/lib/bpChart.ts, in the chosen language. Numbers are never changed.
export function lineSummary(t: T, rows: ChartRow[], days: number): string {
  if (rows.length === 0) return t('chart.noReadings', { days });
  const span = (a: number[]) => (Math.min(...a) === Math.max(...a) ? `${Math.min(...a)}` : t('chart.to', { a: Math.min(...a), b: Math.max(...a) }));
  return t('chart.summaryLine', { days, count: readingsText(t, rows.length), sys: span(rows.map((r) => r.systolic)), dia: span(rows.map((r) => r.diastolic)) });
}
export function weeklyText(t: T, lang: Lang, w: Weekly[], days: number): string {
  if (w.length === 0) return t('chart.noReadings', { days });
  return t('chart.weeklyPrefix', { days }) + w.map((x) => t('chart.weekItem', { date: dayText(x.end, lang), sys: x.sys, dia: x.dia, count: readingsText(t, x.n) })).join('; ') + '.';
}
export function spreadText(t: T, b: Bin[], label: string, days: number): string {
  const used = b.filter((x) => x.count > 0);
  if (used.length === 0) return t('chart.noReadings', { days });
  return t('chart.spreadPrefix', { label, days }) + used.map((x) => `${binLabel(x)}: ${x.count} (${x.percent}%)`).join('; ') + '.';
}
