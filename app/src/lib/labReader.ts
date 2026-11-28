import { TESTS, normUnit, testDef, type TestKey } from './labTests';

// A guess read from the text of a lab sheet. Never saved by itself: the person sees it next to the original and confirms or corrects it.
export type Candidate = { test: TestKey; value: string; unit: string; line: string };

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Number, then an optional unit, straight after the test name. Handles "88", "5,4", "5.4 mmol/L", "88 µmol/L". Ranges such as "60-110" are skipped.
const NUM = /^[\s:=.\-_|]*([<>]?\s*\d{1,6}(?:[.,]\d{1,3})?)(?![\d.,]*\s*[-–]\s*\d)\s*(%|[a-zA-Zµμ]+(?:\s?\/\s?[a-zA-Z0-9.,²^]+)*)?/;

// Finds the first value for each test. When a test appears twice (for example a history table), the first one wins and the person can fix it.
export function readLabText(text: string): Candidate[] {
  const found = new Map<TestKey, Candidate>();
  for (const rawLine of text.split(/\r?\n/)) {
    const line = fold(rawLine);
    for (const def of TESTS) {
      if (found.has(def.key)) continue;
      for (const alias of def.aliases) {
        const m = new RegExp('(?:^|[^a-z0-9])' + esc(fold(alias)) + '(?![a-z0-9])').exec(line);
        if (!m) continue;
        const rest = rawLine.slice(m.index + m[0].length);
        const n = NUM.exec(rest);
        if (!n) continue;
        const num = n[1].replace(/\s/g, '');
        if (/^[<>]/.test(num)) continue; // "<5" is a limit, not a measured value
        const unit = n[2] ? normUnit(n[2]) : null;
        const defaultUnit = def.units[0];
        found.set(def.key, { test: def.key, value: num.replace(',', '.'), unit: unit && def.units.includes(unit) ? unit : defaultUnit, line: rawLine.trim() });
        break;
      }
    }
  }
  return TESTS.map((t) => found.get(t.key)).filter((c): c is Candidate => !!c);
}

export const defaultUnit = (t: TestKey) => testDef(t).units[0];
