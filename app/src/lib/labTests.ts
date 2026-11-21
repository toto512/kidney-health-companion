// The eight blood tests the app reads. Plain data and checks only: no labels like "good" or "high", because official ranges are not verified yet.
export type TestKey = 'creatinine' | 'egfr' | 'urea' | 'potassium' | 'sodium' | 'uric_acid' | 'hba1c' | 'glucose';

export type TestDef = {
  key: TestKey;
  // Units the app accepts, first one is the default. Matching is done on a normalised form (see normUnit).
  units: readonly string[];
  // Plausible printed range per unit. Outside it the value is flagged "check this number" (a likely misread), never "abnormal".
  plausible: Record<string, readonly [number, number]>;
  // Words that name the test on a lab sheet (English, French, Spanish). Matched case-insensitively, accents ignored.
  aliases: readonly string[];
};

export const TESTS: readonly TestDef[] = [
  { key: 'creatinine', units: ['umol/L', 'mg/dL'], plausible: { 'umol/L': [10, 2500], 'mg/dL': [0.1, 30] }, aliases: ['creatinine', 'creatinina'] },
  { key: 'egfr', units: ['mL/min/1.73m2'], plausible: { 'mL/min/1.73m2': [1, 200] }, aliases: ['egfr', 'dfge', 'dfg', 'tfge', 'estimated gfr', 'gfr', 'filtration glomerulaire', 'filtrado glomerular'] },
  { key: 'urea', units: ['mmol/L', 'mg/dL'], plausible: { 'mmol/L': [0.5, 100], 'mg/dL': [3, 300] }, aliases: ['urea', 'uree', 'bun', 'blood urea nitrogen'] },
  { key: 'potassium', units: ['mmol/L', 'mEq/L'], plausible: { 'mmol/L': [1.5, 9], 'mEq/L': [1.5, 9] }, aliases: ['potassium', 'potasio', 'k+'] },
  { key: 'sodium', units: ['mmol/L', 'mEq/L'], plausible: { 'mmol/L': [100, 180], 'mEq/L': [100, 180] }, aliases: ['sodium', 'sodio'] },
  { key: 'uric_acid', units: ['umol/L', 'mmol/L', 'mg/dL'], plausible: { 'umol/L': [50, 900], 'mmol/L': [0.05, 0.9], 'mg/dL': [0.8, 15] }, aliases: ['uric acid', 'urate', 'acide urique', 'acido urico'] },
  { key: 'hba1c', units: ['%', 'mmol/mol'], plausible: { '%': [3, 20], 'mmol/mol': [9, 200] }, aliases: ['hba1c', 'hbalc', 'hba 1c', 'hb a1c', 'a1c', 'hemoglobin a1c', 'glycated hemoglobin', 'glycohemoglobine', 'hemoglobina glicosilada', 'hemoglobine glyquee'] },
  { key: 'glucose', units: ['mmol/L', 'mg/dL'], plausible: { 'mmol/L': [1, 60], 'mg/dL': [18, 1100] }, aliases: ['glucose', 'glycemie', 'glucosa', 'glicemia', 'blood sugar'] },
] as const;

export const TEST_KEYS: readonly TestKey[] = TESTS.map((t) => t.key);
export const testDef = (k: TestKey): TestDef => TESTS.find((t) => t.key === k) as TestDef;
export const isTestKey = (v: unknown): v is TestKey => typeof v === 'string' && (TEST_KEYS as readonly string[]).includes(v);

// "µmol/L", "umol/l", "μmol / L" -> "umol/L". Returns null for a unit the app does not know.
export function normUnit(raw: string): string | null {
  const s = raw.trim().replace(/[µμ]/g, 'u').replace(/\s+/g, '').toLowerCase();
  if (s === 'umol/l' || s === 'micromol/l') return 'umol/L';
  if (s === 'mmol/l') return 'mmol/L';
  if (s === 'meq/l') return 'mEq/L';
  if (s === 'mg/dl') return 'mg/dL';
  if (s === '%') return '%';
  if (s === 'mmol/mol') return 'mmol/mol';
  if (/^ml\/min(\/1\.73m[2²])?$/.test(s) || s === 'ml/min/1,73m2' || s === 'ml/min/1.73m^2') return 'mL/min/1.73m2';
  return null;
}

export type EntryError = 'test' | 'value' | 'unit' | 'date';
export type EntryCheck = { ok: true; value: number; unit: string; check: boolean } | { ok: false; error: EntryError };

// Validates one value the person typed or confirmed. `check` is true when the number is outside the plausible printed range, so the screen can ask them to look again.
export function checkEntry(test: string, valueRaw: string | number, unitRaw: string, takenOn: string, today: Date): EntryCheck {
  if (!isTestKey(test)) return { ok: false, error: 'test' };
  const text = String(valueRaw).trim().replace(',', '.');
  if (!/^\d{1,6}(\.\d{1,3})?$/.test(text)) return { ok: false, error: 'value' };
  const value = Number(text);
  const unit = normUnit(unitRaw);
  const def = testDef(test);
  if (!unit || !def.units.includes(unit)) return { ok: false, error: 'unit' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(takenOn)) return { ok: false, error: 'date' };
  const d = new Date(takenOn + 'T00:00:00Z');
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== takenOn) return { ok: false, error: 'date' };
  if (d.getTime() < Date.UTC(1900, 0, 1) || d.getTime() > today.getTime() + 86400000) return { ok: false, error: 'date' };
  const [lo, hi] = def.plausible[unit];
  return { ok: true, value, unit, check: value < lo || value > hi };
}
