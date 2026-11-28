import { describe, expect, it } from 'vitest';
import { readBpText, sane, takenAtFrom } from './bpReader';

const today = new Date(2026, 10, 18, 12, 0);

describe('readBpText', () => {
  it('reads top/bottom pairs with pulse, date and time on one line', () => {
    expect(readBpText('2026-11-10 08:30  128/82  pulse 71', today)).toEqual([{ systolic: 128, diastolic: 82, pulse: 71, date: '2026-11-10', time: '08:30' }]);
  });
  it('reads labelled values on separate lines (monitor printout)', () => {
    const r = readBpText('Date 10/11/2026\nTime 07:45\nSYS 135 mmHg\nDIA 85 mmHg\nPUL 66 /min', today);
    // 10/11/2026 is ambiguous (10 Nov or 11 Oct): no date is chosen.
    expect(r).toEqual([{ systolic: 135, diastolic: 85, pulse: 66, date: null, time: '07:45' }]);
  });
  it('carries an unambiguous date to the readings below it and reads several readings', () => {
    const r = readBpText('Nov 10, 2026\n120/80\n131/84 72 bpm\n2026-11-11\n118/76', today);
    expect(r.map((x) => [x.systolic, x.diastolic, x.pulse, x.date])).toEqual([[120, 80, null, '2026-11-10'], [131, 84, 72, '2026-11-10'], [118, 76, null, '2026-11-11']]);
  });
  it('reads French and Spanish labels and PM times', () => {
    expect(readBpText('Systolique 142\nDiastolique 90\nPouls 80', today)[0]).toMatchObject({ systolic: 142, diastolic: 90, pulse: 80 });
    expect(readBpText('Sistólica 110\nDiastólica 70\nPulso 64', today)[0]).toMatchObject({ systolic: 110, diastolic: 70, pulse: 64 });
    expect(readBpText('2026-11-10 6:05 pm 125/80', today)[0].time).toBe('18:05');
  });
  it('rejects values outside a sane range instead of guessing', () => {
    expect(readBpText('12/80\n300/80\n128/8\n90/85\n260/90\n128/200', today)).toEqual([]);
    expect(readBpText('SYS 28 DIA 82', today)).toEqual([]);
  });
  it('does not read dates, times or lab numbers as a reading', () => {
    expect(readBpText('Date 12/11/2026\nTime 10:30\nCreatinine 98\nPhone 514-555-0199\nLot 2026/11/10', today)).toEqual([]);
  });
  it('ignores "dia" (Spanish for day) and "pulmonary" when no systolic value came first', () => {
    expect(readBpText('dia 15\npulmonary 70\npulso 72', today)).toEqual([]);
  });
  it('leaves out a pulse outside 30 to 220 and keeps the reading', () => {
    expect(readBpText('128/82 pulse 9', today)[0].pulse).toBeNull();
  });
  it('returns the same reading once, and caps the list', () => {
    expect(readBpText('128/82\n128/82', today)).toHaveLength(1);
    const many = Array.from({ length: 40 }, (_, i) => `${100 + i}/70`).join('\n');
    expect(readBpText(many, today).length).toBeLessThanOrEqual(20);
  });
  it('returns nothing for empty or unrelated text', () => {
    expect(readBpText('', today)).toEqual([]);
    expect(readBpText('Hello world', today)).toEqual([]);
  });
});

describe('sane', () => {
  it('needs top above bottom and a home-monitor range', () => {
    expect(sane(128, 82)).toBe(true);
    expect(sane(82, 128)).toBe(false);
    expect(sane(60, 40)).toBe(false);
  });
});

describe('takenAtFrom', () => {
  it('turns local date and time into an instant', () => {
    expect(takenAtFrom('2026-11-10', '08:30', today)).toBe(new Date(2026, 10, 10, 8, 30).toISOString());
  });
  it('rejects bad, impossible and future values', () => {
    expect(takenAtFrom('2026-13-10', '08:30', today)).toBeNull();
    expect(takenAtFrom('2026-02-30', '08:30', today)).toBeNull();
    expect(takenAtFrom('2026-11-10', '25:00', today)).toBeNull();
    expect(takenAtFrom('2026-11-10', '', today)).toBeNull();
    expect(takenAtFrom('2026-12-25', '08:30', today)).toBeNull();
  });
});
