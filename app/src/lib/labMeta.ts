// Reads the collection date and the lab name from the text of a lab sheet. These are only suggestions for the confirm screen:
// when the text is unclear the answer is "none" or "ambiguous", never a guess, and the date is never defaulted to today.

export type DateRead =
  | { kind: 'iso'; value: string; raw: string }
  | { kind: 'ambiguous'; raw: string; dayFirst: string; monthFirst: string }
  | { kind: 'none' };

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Lines that name the collection date (English, French, Spanish). A date on any other line (reported, printed, birth) is ignored.
const COLLECTED = /\b(collected|collection|drawn|specimen|sampled|date of (test|sample|draw)|collecte|preleve|prelevement|date du prelevement|fecha de (toma|extraccion|recoleccion)|toma de muestra|muestra)\b/;

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, janvier: 1, enero: 1, feb: 2, february: 2, fevrier: 2, febrero: 2, mar: 3, march: 3, mars: 3, marzo: 3,
  apr: 4, april: 4, avril: 4, abril: 4, may: 5, mai: 5, mayo: 5, jun: 6, june: 6, juin: 6, junio: 6, jul: 7, july: 7, juillet: 7, julio: 7,
  aug: 8, august: 8, aout: 8, agosto: 8, sep: 9, sept: 9, september: 9, septembre: 9, septiembre: 9, setiembre: 9,
  oct: 10, october: 10, octobre: 10, octubre: 10, nov: 11, november: 11, novembre: 11, noviembre: 11, dec: 12, december: 12, decembre: 12, diciembre: 12,
};

const pad = (n: number) => String(n).padStart(2, '0');
export function validIso(y: number, m: number, d: number, today: Date): string | null {
  if (y < 1900 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const t = Date.UTC(y, m - 1, d);
  const dt = new Date(t);
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  if (t > today.getTime() + 86400000) return null; // a collection date in the future is a misread
  return `${y}-${pad(m)}-${pad(d)}`;
}

type Found = { kind: 'iso'; value: string; raw: string } | { kind: 'ambiguous'; raw: string; dayFirst: string; monthFirst: string };

export function datesInLine(line: string, today: Date): Found[] {
  const out: Found[] = [];
  let m: RegExpExecArray | null;
  const ymd = /(?<!\d)(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?!\d)/g;
  while ((m = ymd.exec(line))) { const v = validIso(+m[1], +m[2], +m[3], today); if (v) out.push({ kind: 'iso', value: v, raw: m[0] }); }
  const dmy = /(?<![\d/.-])(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})(?!\d)/g;
  while ((m = dmy.exec(line))) {
    const a = +m[1], b = +m[2], y = +m[3];
    const dayFirst = validIso(y, b, a, today); // a = day, b = month
    const monthFirst = validIso(y, a, b, today); // a = month, b = day
    if (a === b && dayFirst) out.push({ kind: 'iso', value: dayFirst, raw: m[0] });
    else if (dayFirst && monthFirst) out.push({ kind: 'ambiguous', raw: m[0], dayFirst, monthFirst });
    else if (dayFirst) out.push({ kind: 'iso', value: dayFirst, raw: m[0] });
    else if (monthFirst) out.push({ kind: 'iso', value: monthFirst, raw: m[0] });
  }
  const dMonY = /(?<!\d)(\d{1,2})(?:st|nd|rd|th|er)?\s+(?:de\s+)?([a-z]{3,10})\.?,?\s+(?:de\s+)?(\d{4})(?!\d)/g;
  while ((m = dMonY.exec(line))) { const mo = MONTHS[m[2]]; const v = mo ? validIso(+m[3], mo, +m[1], today) : null; if (v) out.push({ kind: 'iso', value: v, raw: m[0] }); }
  const monDY = /\b([a-z]{3,10})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})(?!\d)/g;
  while ((m = monDY.exec(line))) { const mo = MONTHS[m[1]]; const v = mo ? validIso(+m[3], mo, +m[2], today) : null; if (v) out.push({ kind: 'iso', value: v, raw: m[0] }); }
  return out;
}

export function readCollectionDate(text: string, today: Date): DateRead {
  const found: Found[] = [];
  for (const line of text.split(/\r?\n/)) {
    const f = fold(line);
    if (COLLECTED.test(f)) found.push(...datesInLine(f, today));
  }
  if (found.length === 0) return { kind: 'none' };
  // Two different dates on collection lines (for example a draw date and a received date): do not choose.
  const key = (d: Found) => (d.kind === 'iso' ? d.value : d.dayFirst + '|' + d.monthFirst);
  if (new Set(found.map(key)).size > 1) return { kind: 'none' };
  return found[0];
}

// Lab name: a "Lab: name" line, or a line whose words include laboratory. More than one different candidate means unclear, so none.
const LAB_WORD = /\b(laboratory|laboratories|laboratoire|laboratoires|laboratorio|laboratorios|diagnostics|diagnostic labs?)\b/;
export function readLabName(text: string): string | null {
  const names = new Set<string>();
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\s+/g, ' ').trim();
    if (line.length < 3 || line.length > 80) continue;
    const labeled = /^(?:lab(?:oratory|oratoire|oratorio)?|performing lab|laboratoire)\s*[:\-]\s*(.+)$/i.exec(line);
    const name = labeled ? labeled[1].trim() : LAB_WORD.test(fold(line)) && !/:/.test(line) && !/\d{4}/.test(line) ? line : null;
    if (name && name.length >= 3 && name.length <= 80) names.add(name);
  }
  return names.size === 1 ? [...names][0] : null;
}
