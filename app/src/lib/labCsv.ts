export type CsvRow = { taken_on: string; test: string; value: number | string; unit: string; lab: string | null };

// A cell starting with = + - @ tab or CR can run as a formula when the file is opened in a spreadsheet, so those get a leading apostrophe.
// A plain negative number is not text, so numbers are written as they are.
export function csvCell(v: string | number | null | undefined): string {
  if (v == null) return '';
  if (typeof v === 'number') return String(v);
  const s = /^[=+\-@\t\r]/.test(v) ? "'" + v : v;
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export function labCsv(rows: CsvRow[]): string {
  const head = 'date,test,value,unit,lab';
  const body = rows.map((r) => [r.taken_on, r.test, r.value, r.unit, r.lab].map(csvCell).join(','));
  return [head, ...body].join('\r\n') + '\r\n';
}
