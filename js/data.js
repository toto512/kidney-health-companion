// Data access layer. Static JSON and guide documents are fetched relative to the
// page, so the same files work on GitHub Pages and inside a Capacitor web view.
export const GUIDE_DOCS = ['patient', 'renal'];

export function guideUrl(which) {
  return GUIDE_DOCS.includes(which) ? `guides/${which}.html` : null;
}

export async function loadFoods() {
  const response = await fetch('data/foods.json');
  if (!response.ok) throw new Error(`foods.json: HTTP ${response.status}`);
  const foods = await response.json();
  if (!Array.isArray(foods)) throw new Error('foods.json: expected an array');
  return foods;
}
