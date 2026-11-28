// Reads blood pressure readings from the text of a printed page or a monitor memory printout. Suggestions only: the confirm screen shows
// every value beside the original and nothing is saved until the person presses Save. Anything unclear is left out or left empty, never guessed.
import { CHECK_LIMITS, parseReading } from './bp';
import { datesInLine } from './labMeta';

export type BpCandidate = { systolic: number; diastolic: number; pulse: number | null; date: string | null; time: string | null };

const MAX_CANDIDATES = 20;
const PULSE_OK = { min: 30, max: 220 };
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const pad = (n: number) => String(n).padStart(2, '0');

// Values a home monitor shows. OCR slips (a dropped digit, 1 read as 7) usually land outside these, so such values are left out.
export function sane(s: number, d: number): boolean {
  const r = parseReading(String(s), String(d), '');
  return r.ok && s >= CHECK_LIMITS.systolic.min && s <= CHECK_LIMITS.systolic.max && d >= CHECK_LIMITS.diastolic.min && d <= CHECK_LIMITS.diastolic.max
    && s - d >= CHECK_LIMITS.gap.min && s - d <= CHECK_LIMITS.gap.max;
}
const pulseOf = (n: number | undefined): number | null => (n !== undefined && n >= PULSE_OK.min && n <= PULSE_OK.max ? n : null);

const NUM = '[^0-9\\n]{0,12}?(\\d{2,3})(?!\\d)';
const SYS = new RegExp(`\\b(?:sys|systolic|systolique|sistolica|sistolico|sis)\\b${NUM}`);
const DIA = new RegExp(`\\b(?:dia|diastolic|diastolique|diastolica|diastolico)\\b${NUM}`);
const PUL = new RegExp(`\\b(?:pul|pulse|puls|pouls|pulso|hr|bpm|fc)\\b${NUM}`);
const PUL_AFTER = /(?<!\d)(\d{2,3})\s*(?:bpm|\/\s*min|per min)/;
const PAIR = /(?<![\d/.:-])(\d{2,3})\s*[/\\|]\s*(\d{2,3})(?![\d/])/;
const TIME = /(?<![\d:])([01]?\d|2[0-3]):([0-5]\d)(?![\d:])\s*(am|pm)?/;

function timeOf(line: string): string | null {
  const m = TIME.exec(line);
  if (!m) return null;
  let h = +m[1];
  if (m[3]) { if (h < 1 || h > 12) return null; h = (h % 12) + (m[3] === 'pm' ? 12 : 0); }
  return `${pad(h)}:${m[2]}`;
}

export function readBpText(text: string, today: Date): BpCandidate[] {
  const out: BpCandidate[] = [];
  let date: string | null = null; // most recent date line (printouts often list a date, then its readings)
  let time: string | null = null;
  let timeAge = 99;
  let pend: { sys?: number; dia?: number; pul?: number; date?: string | null; time?: string | null } = {};

  const emit = (s: number | undefined, d: number | undefined, p: number | undefined, lineDate: string | null, lineTime: string | null) => {
    if (s === undefined || d === undefined || !sane(s, d)) return;
    const c: BpCandidate = { systolic: s, diastolic: d, pulse: pulseOf(p), date: lineDate ?? date, time: lineTime ?? (timeAge <= 2 ? time : null) };
    if (out.some((o) => o.systolic === c.systolic && o.diastolic === c.diastolic && o.pulse === c.pulse && o.date === c.date && o.time === c.time)) return;
    if (out.length < MAX_CANDIDATES) out.push(c);
  };
  const flush = () => { emit(pend.sys, pend.dia, pend.pul, pend.date ?? null, pend.time ?? null); pend = {}; };

  for (const raw of text.split(/\r?\n/)) {
    const line = fold(raw);
    timeAge++;
    const dts = datesInLine(line, today);
    const iso = dts.filter((d) => d.kind === 'iso');
    // A date that could be read two ways is never chosen: the reading then has no date and the person types it.
    if (iso.length === 1) date = iso[0].kind === 'iso' ? iso[0].value : date;
    else if (dts.length > 0) date = null;
    const t = timeOf(line);
    if (t) { time = t; timeAge = 0; }

    const pair = PAIR.exec(line);
    if (pair) {
      flush();
      const rest = line.slice((pair.index ?? 0) + pair[0].length);
      const lab = PUL.exec(rest) ?? PUL.exec(line);
      const after = PUL_AFTER.exec(rest);
      emit(+pair[1], +pair[2], lab ? +lab[1] : after ? +after[1] : undefined, iso.length === 1 && iso[0].kind === 'iso' ? iso[0].value : null, t);
      continue;
    }
    const s = SYS.exec(line);
    if (s) { if (pend.sys !== undefined) flush(); pend.sys = +s[1]; pend.date = date; pend.time = timeAge <= 2 ? time : null; }
    // Diastolic and pulse words count only after a systolic one ("dia" is also the Spanish word for day, "pulmonary" starts with pul).
    const d = pend.sys !== undefined ? DIA.exec(line) : null;
    if (d) pend.dia = +d[1];
    const p = pend.sys !== undefined && pend.dia !== undefined ? (PUL.exec(line) ?? PUL_AFTER.exec(line)) : null;
    if (p) pend.pul = +p[1];
  }
  flush();
  return out;
}

/** Local date (YYYY-MM-DD) and time (HH:MM) from the confirm screen to the ISO instant stored in the database. Null when either is not valid. */
export function takenAtFrom(date: string, time: string, now: Date): string | null {
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  const tm = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!dm || !tm) return null;
  const [y, mo, d, h, mi] = [+dm[1], +dm[2], +dm[3], +tm[1], +tm[2]];
  if (y < 1900 || h > 23 || mi > 59) return null;
  const at = new Date(y, mo - 1, d, h, mi);
  if (at.getFullYear() !== y || at.getMonth() !== mo - 1 || at.getDate() !== d) return null;
  if (at.getTime() > now.getTime() + 5 * 60000) return null; // a reading in the future is a misread
  return at.toISOString();
}
