// Finds a saved report that probably is the same sheet: same collection date, and every value about to be saved already exists in that
// report (same test, same number, same unit). Files are never compared: a PDF and a photo of one sheet are different files.
export type SavedValue = { test: string; value: number; unit: string };
export type SavedReport = { id: string; taken_on: string; results: SavedValue[] };
export type NewValue = { test: string; value: number; unit: string };

export function findDuplicate(saved: SavedReport[], takenOn: string, values: NewValue[]): SavedReport | null {
  if (values.length === 0) return null;
  for (const r of saved) {
    if (r.taken_on !== takenOn) continue;
    const all = values.every((v) => r.results.some((s) => s.test === v.test && s.unit === v.unit && Number(s.value) === Number(v.value)));
    if (all) return r;
  }
  return null;
}

// Changes to the date or any value must ask again, so the answer is tied to exactly what was shown.
export const signature = (takenOn: string, values: NewValue[]) =>
  takenOn + '|' + [...values].sort((a, b) => a.test.localeCompare(b.test)).map((v) => `${v.test}=${v.value}${v.unit}`).join(',');
