// Pure helpers for the "conditions I want to track" picker. Ids are the slugs from content/conditionList.ts.
export const toggleId = (selected: string[], id: string): string[] => (selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

// What to write to the database to go from `saved` to `wanted`.
export function diffSelection(saved: string[], wanted: string[]): { add: string[]; remove: string[] } {
  const s = new Set(saved); const w = new Set(wanted);
  return { add: [...w].filter((x) => !s.has(x)), remove: [...s].filter((x) => !w.has(x)) };
}

// Keeps only ids the app knows, once each, so an old or edited row never breaks the dashboard.
export const knownIds = (ids: string[], known: string[]): string[] => {
  const k = new Set(known);
  return [...new Set(ids)].filter((x) => k.has(x));
};
