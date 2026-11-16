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
