import { EMERGENCY, emergencyView, LISTED_EMERGENCY } from './emergency';

// One tap-to-call number for a country, taken from the verified `number` text. No number is added that the list does not already state.
export type DialTarget = { display: string; tel: string; label: string; text: string };

const SKIP = /\b(police|fire)\b/i;
const MEDICAL = /ambulance|medical/i;

// Label = the words right after the number: "144 ambulance" -> "ambulance", "911 (Buenos Aires Province)" -> "Buenos Aires Province".
function labelAfter(number: string, token: string): string {
  const i = number.indexOf(token);
  if (i < 0) return '';
  const rest = number.slice(i + token.length);
  const paren = /^\s*\(([A-Za-z][^)]*)\)/.exec(rest);
  if (paren) return paren[1].trim();
  const word = /^\s+([A-Za-z][A-Za-z ]*?)(?=\s*(?:,|\(|\bor\b\s*\d|$|\)))/.exec(rest);
  return word ? word[1].trim() : '';
}

export function dialTargets(number: string, tokens: string[]): DialTarget[] {
  const out: DialTarget[] = [];
  for (const t of tokens) {
    const label = labelAfter(number, t);
    if (SKIP.test(label) && !MEDICAL.test(label)) continue; // police and fire only: not offered as a one-tap button
    const digits = t.replace(/-/g, '');
    if (!/^[0-9]{2,4}$/.test(digits)) continue;
    out.push({ display: t, tel: `tel:${digits}`, label, text: `Call ${t} now${label ? ` (${label})` : ''}` });
  }
  return out;
}

// Buttons for a saved profile country. Countries on the fallback (no verified number) get none.
export function emergencyDialFor(country: string | null | undefined): DialTarget[] {
  const v = emergencyView(country);
  if (v.kind === 'supported') { const n = EMERGENCY[v.country].number; return dialTargets(n, [n]); }
  if (v.kind === 'listed') { const e = LISTED_EMERGENCY[v.code]; return dialTargets(e.number, e.tokens); }
  return [];
}
