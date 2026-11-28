import { describe, expect, it } from 'vitest';
import { readCollectionDate, readLabName } from './labMeta';

const today = new Date('2026-11-17T12:00:00Z');
const d = (t: string) => readCollectionDate(t, today);

describe('readCollectionDate', () => {
  it('reads an ISO collection date', () => expect(d('Collected: 2026-10-20    Report: Chemistry panel')).toEqual({ kind: 'iso', value: '2026-10-20', raw: '2026-10-20' }));
  it('takes day-first when the first number is above 12', () => expect(d('Date collected: 25/10/2026')).toMatchObject({ kind: 'iso', value: '2026-10-25' }));
  it('takes month-first when the second number is above 12', () => expect(d('Collected 10/25/2026')).toMatchObject({ kind: 'iso', value: '2026-10-25' }));
  it('does not guess when both orders are real dates', () => expect(d('Collected: 03/04/2026')).toMatchObject({ kind: 'ambiguous', dayFirst: '2026-04-03', monthFirst: '2026-03-04' }));
  it('treats 05/05/2026 as one date', () => expect(d('Collected: 05/05/2026')).toMatchObject({ kind: 'iso', value: '2026-05-05' }));
  it('reads month names in English, French and Spanish', () => {
    expect(d('Collected: October 20, 2026')).toMatchObject({ value: '2026-10-20' });
    expect(d('Date du prélèvement : 20 octobre 2026')).toMatchObject({ value: '2026-10-20' });
    expect(d('Fecha de toma: 20 de octubre de 2026')).toMatchObject({ value: '2026-10-20' });
    expect(d('Collected 3 Mar 2026')).toMatchObject({ value: '2026-03-03' });
  });
  it('ignores dates on lines that are not about collection', () => {
    expect(d('Date of birth: 1950-03-27\nPrinted: 2026-11-01')).toEqual({ kind: 'none' });
  });
  it('gives none when two different collection dates appear', () => expect(d('Collected: 2026-10-20\nSpecimen drawn 2026-10-21')).toEqual({ kind: 'none' }));
  it('rejects impossible and future dates', () => {
    expect(d('Collected: 2026-02-30')).toEqual({ kind: 'none' });
    expect(d('Collected: 2027-01-05')).toEqual({ kind: 'none' });
    expect(d('Collected: 31/31/2026')).toEqual({ kind: 'none' });
  });
  it('never invents a date', () => { expect(d('')).toEqual({ kind: 'none' }); expect(d('Creatinine 88')).toEqual({ kind: 'none' }); });
  it('ignores two-digit years', () => expect(d('Collected: 20/10/26')).toEqual({ kind: 'none' }));
});

describe('readLabName', () => {
  it('reads a header line with the word laboratory', () => expect(readLabName('FAKESVILLE SAMPLE LABORATORY\nPatient: X')).toBe('FAKESVILLE SAMPLE LABORATORY'));
  it('reads a "Lab:" line', () => expect(readLabName('Lab: North Clinic Lab\nCreatinine 88')).toBe('North Clinic Lab'));
  it('reads a French laboratory', () => expect(readLabName('Laboratoire Saint-Luc')).toBe('Laboratoire Saint-Luc'));
  it('gives null when two different names appear', () => expect(readLabName('Alpha Laboratory\nBeta Laboratory')).toBeNull());
  it('gives null when none is found', () => expect(readLabName('Creatinine 88 umol/L')).toBeNull());
  it('skips label lines like "Laboratory report date: 2026-01-01"', () => expect(readLabName('Laboratory report date: 2026-01-01')).toBeNull());
  it('skips very long lines', () => expect(readLabName('Laboratory ' + 'x'.repeat(100))).toBeNull());
});
