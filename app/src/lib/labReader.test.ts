import { describe, expect, it } from 'vitest';
import { readLabText } from './labReader';
import { checkEntry, normUnit } from './labTests';

const SHEET = `
Fake Lab Report
Creatinine      88   umol/L    60 - 110
eGFR            72   mL/min/1.73m2
Urea            5,4  mmol/L    2.5-8.0
Potassium       4.1  mmol/L
Sodium          139  mmol/L
Uric acid       0.35 mmol/L
HbA1c           6.2  %
Glucose         5.6  mmol/L
`;

describe('readLabText', () => {
  it('reads each of the eight tests with value and unit', () => {
    const r = Object.fromEntries(readLabText(SHEET).map((c) => [c.test, c]));
    expect(r.creatinine).toMatchObject({ value: '88', unit: 'umol/L' });
    expect(r.egfr).toMatchObject({ value: '72', unit: 'mL/min/1.73m2' });
    expect(r.urea).toMatchObject({ value: '5.4', unit: 'mmol/L' });
    expect(r.potassium).toMatchObject({ value: '4.1' });
    expect(r.sodium).toMatchObject({ value: '139' });
    expect(r.hba1c).toMatchObject({ value: '6.2', unit: '%' });
    expect(r.glucose).toMatchObject({ value: '5.6' });
    expect(Object.keys(r)).toHaveLength(8);
  });
  it('does not take the reference range as the value', () => {
    expect(readLabText('Creatinine 60 - 110 umol/L')).toEqual([]);
  });
  it('skips limits such as "<5"', () => {
    expect(readLabText('Glucose <5 mmol/L')).toEqual([]);
  });
  it('reads French lab words, accents and mu sign', () => {
    const r = readLabText('Créatinine : 92 µmol/L\nGlycémie 5,1 mmol/L\nAcide urique 310 µmol/L');
    expect(r.map((c) => [c.test, c.value, c.unit])).toEqual([['creatinine', '92', 'umol/L'], ['uric_acid', '310', 'umol/L'], ['glucose', '5.1', 'mmol/L']]);
  });
  it('does not match a test name inside another word', () => {
    expect(readLabText('Nonsodium 140')).toEqual([]);
  });
  it('returns nothing for empty or unrelated text', () => {
    expect(readLabText('')).toEqual([]);
    expect(readLabText('Hello world 12')).toEqual([]);
  });
  it('first value wins when a test appears twice', () => {
    expect(readLabText('Potassium 4.0 mmol/L\nPotassium 3.1 mmol/L')[0].value).toBe('4.0');
  });
});

describe('checkEntry', () => {
  const today = new Date('2026-11-16T12:00:00Z');
  it('accepts a normal entry and accepts a comma decimal', () => {
    expect(checkEntry('potassium', '4,2', 'mmol/L', '2026-11-01', today)).toEqual({ ok: true, value: 4.2, unit: 'mmol/L', check: false });
  });
  it('flags an implausible number to look again, without calling it abnormal', () => {
    const r = checkEntry('potassium', '42', 'mmol/L', '2026-11-01', today);
    expect(r).toMatchObject({ ok: true, check: true });
  });
  it('rejects bad test, value, unit and date', () => {
    expect(checkEntry('x', '1', 'mmol/L', '2026-11-01', today)).toEqual({ ok: false, error: 'test' });
    expect(checkEntry('sodium', '1e3', 'mmol/L', '2026-11-01', today)).toEqual({ ok: false, error: 'value' });
    expect(checkEntry('sodium', '140', 'mg/dL', '2026-11-01', today)).toEqual({ ok: false, error: 'unit' });
    expect(checkEntry('sodium', '140', 'mmol/L', '2026-02-30', today)).toEqual({ ok: false, error: 'date' });
    expect(checkEntry('sodium', '140', 'mmol/L', '2027-01-01', today)).toEqual({ ok: false, error: 'date' });
  });
  it('normalises units', () => {
    expect(normUnit('µmol/L')).toBe('umol/L');
    expect(normUnit('ml/min/1.73m²')).toBe('mL/min/1.73m2');
    expect(normUnit('foo')).toBeNull();
  });
});

describe('common misreads', () => {
  it('reads HbA1c when the camera sees a lowercase L for the 1', () => {
    expect(readLabText('HbAlc   6.2   %')[0]).toMatchObject({ test: 'hba1c', value: '6.2', unit: '%' });
  });
});
