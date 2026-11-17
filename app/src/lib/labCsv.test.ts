import { describe, expect, it } from 'vitest';
import { csvCell, labCsv } from './labCsv';

describe('labCsv', () => {
  it('writes a header and one line per value', () => {
    expect(labCsv([{ taken_on: '2026-11-01', test: 'sodium', value: 139, unit: 'mmol/L', lab: null }])).toBe('date,test,value,unit,lab\r\n2026-11-01,sodium,139,mmol/L,\r\n');
  });
  it('quotes commas and quotes', () => {
    expect(csvCell('Lab "A", North')).toBe('"Lab ""A"", North"');
  });
  it('defuses spreadsheet formulas in text', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe('"\'=HYPERLINK(""x"")"');
    expect(csvCell('+1')).toBe("'+1");
    expect(csvCell('@a')).toBe("'@a");
  });
  it('leaves numbers alone', () => {
    expect(csvCell(-1)).toBe('-1');
  });
});

describe('labCsv with hostile lab names', () => {
  const row = (lab: string | null) => ({ taken_on: '2026-11-01', test: 'sodium', value: 139, unit: 'mmol/L', lab });
  const cell = (csv: string) => csv.split('\r\n')[1].split(',').slice(4).join(',');
  it.each(['=1+1', '+1+1', '-1+1', '@SUM(A1)', '\t=1+1', '\r=1+1', '=cmd|\' /C calc\'!A0'])('neutralises %j', (lab) => {
    const out = cell(labCsv([row(lab)]));
    expect(out.replace(/^"/, '')).toMatch(/^'/);
  });
  it('keeps a lab name that merely contains a formula character', () => {
    expect(cell(labCsv([row('North = South')]))).toBe('North = South');
  });
  it('keeps embedded line breaks inside one quoted cell', () => {
    expect(cell(labCsv([row('Line1\nLine2')]))).toBe('"Line1\nLine2"');
  });
  it('writes a missing lab name as an empty cell', () => {
    expect(cell(labCsv([row(null)]))).toBe('');
  });
});
