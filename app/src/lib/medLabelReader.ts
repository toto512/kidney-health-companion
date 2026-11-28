// Suggests a medicine name and the printed strength from the text of a pill bottle or pharmacy label. Suggestions only: the person sees the
// original beside them and must confirm or edit before anything is added. Unclear text gives no suggestion, and nothing here reads
// directions, doses per day or schedules.
import type { MedItem } from '../content/medList';
import { allBrands, MED_LIST } from '../content/medList';
import { MAX_STRENGTH, normalizeCustomName, normalizeStrength } from './medSelection';

export type MedLabelRead = { name: string | null; strength: string | null };

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Strength as printed: "500 mg", "0.5 mcg", "250 mg/5 ml", "10 %". Never a count of tablets or a time.
const STRENGTH = /(?<![\d.,])(\d{1,4}(?:[.,]\d{1,3})?)\s*(mcg|µg|μg|mg|g|ml|iu|ui|units?|%)(?:\s*\/\s*(\d{0,3}(?:[.,]\d{1,2})?)\s*(ml|g|l|dose))?(?![a-z])/i;

// Lines that are about the person, the pharmacy or how to take it, never the name of a medicine.
const NOT_NAME = /\b(rx|pharmacy|pharmacie|farmacia|patient|paciente|doctor|dr\.?|dr |physician|prescriber|take|taking|prendre|tomar|directions?|use|apply|refills?|qty|quantity|quantite|cantidad|date|expir\w*|exp|lot|din|phone|tel|fax|store|address|street|avenue|ave|rd|road|discard|keep|store|warning|caution|tablets?|capsules?|comprimes?|comprimidos?|caps|tabs?|daily|twice|once|every|hours?|morning|night|with|without|food|water|mouth|oral|by|for|only|ml|mg|mcg|total|price|cost|dispensed|filled|no|number|nom|name|nombre)\b/;
const NOISE_WORDS = /\b(tablets?|tabs?|capsules?|caps|film[- ]coated|usp|oral|solution|suspension|syrup|cream|ointment|comprimes?|comprimidos?|capsulas?)\b/g;
const LABELLED = /^(?:drug|medication|medicine|medicament|medicamento|nom du medicament)\s*[:\-]\s*(.+)$/;

function cleanName(raw: string): string | null {
  let s = fold(raw).replace(/^\s*(?:drug|medication|medicine|medicament|medicamento)\b\s*[:\-]?/, ' ').replace(NOISE_WORDS, ' ').replace(/[^a-z0-9' -]+/g, ' ').replace(/\s+/g, ' ').trim();
  s = s.replace(/^[-' ]+|[-' ]+$/g, '');
  const words = s.split(' ').filter(Boolean);
  if (words.length === 0 || words.length > 4) return null;
  const letters = s.replace(/[^a-z]/g, '').length;
  if (letters < 3 || letters / s.replace(/ /g, '').length < 0.85) return null;
  if (NOT_NAME.test(s)) return null;
  // Show it as a name: first letter of each word up, the rest down (labels print drug names in capitals).
  const shown = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return normalizeCustomName(shown);
}

export function readMedLabel(text: string): MedLabelRead {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let name: string | null = null;
  let strength: string | null = null;

  for (let i = 0; i < lines.length && !strength; i++) {
    const m = STRENGTH.exec(lines[i]);
    if (!m) continue;
    const s = normalizeStrength(m[0].replace(/\s+/g, ' ').trim());
    if (s.value && s.value.length <= MAX_STRENGTH) strength = s.value;
    // The name is the text before the number on that line ("Metformin 500 mg"), or else the line just above it.
    const before = lines[i].slice(0, m.index);
    name = cleanName(before) ?? (i > 0 ? cleanName(lines[i - 1]) : null);
  }
  // A line that names the medicine ("Drug: Metformin").
  if (!name) {
    for (const l of lines) {
      const lab = LABELLED.exec(fold(l));
      if (lab) { name = cleanName(lab[1].replace(STRENGTH, ' ')); if (name) break; }
    }
  }
  return { name, strength };
}

// Match a read or typed name to the official list: the generic name or a listed brand name, exactly (case, accents and punctuation ignored).
// A salt word after the generic is allowed ("Metoprolol Tartrate"). Anything else, including combinations and near spellings, is no match.
const SALTS = new Set(['hcl', 'hydrochloride', 'sodium', 'potassium', 'calcium', 'besylate', 'maleate', 'tartrate', 'succinate', 'mesylate', 'sulfate', 'sulphate', 'acetate']);
const key = (s: string) => fold(s).replace(/[^a-z0-9]+/g, ' ').trim();
export function matchMed(name: string, list: MedItem[] = MED_LIST): MedItem | null {
  const k = key(name);
  if (!k) return null;
  for (const m of list) {
    const names = [m.generic, ...allBrands(m)].map(key);
    if (names.includes(k)) return m;
    const g = key(m.generic);
    if (k.startsWith(g + ' ') && k.slice(g.length + 1).split(' ').every((w) => SALTS.has(w))) return m;
  }
  return null;
}
