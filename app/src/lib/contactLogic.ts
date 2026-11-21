// Pure rules for "My people" emergency contacts. No react-native imports so vitest can run it.
export const MAX_CONTACTS = 5;

export const RELATIONSHIPS = [
  { value: 'doctor', label: 'Doctor' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'parent', label: 'Parent' },
  { value: 'partner', label: 'Partner or spouse' },
  { value: 'child', label: 'Son or daughter' },
  { value: 'sibling', label: 'Brother or sister' },
  { value: 'friend', label: 'Friend' },
  { value: 'neighbour', label: 'Neighbour' },
  { value: 'other', label: 'Someone else' },
] as const;
export type Relationship = (typeof RELATIONSHIPS)[number]['value'];
export const relationshipLabel = (v: string): string => RELATIONSHIPS.find((r) => r.value === v)?.label ?? 'Someone else';

const E164 = /^\+[1-9][0-9]{6,14}$/;
export const isE164 = (s: string): boolean => E164.test(s);

// Turns what a person types into +digits. A leading + is kept as typed. Without one, only countries with a known
// national format (CA, US: +1; GB: +44) are accepted, so a wrong guess never dials a stranger. null means invalid.
export function normalizePhone(raw: string, countryCode: string | null | undefined): string | null {
  const t = raw.trim();
  if (!t || /[^0-9+\s().-]/.test(t)) return null;
  const hasPlus = t.startsWith('+');
  if (t.indexOf('+', 1) !== -1) return null;
  const digits = t.replace(/\D/g, '');
  if (hasPlus) { const e = `+${digits}`; return isE164(e) ? e : null; }
  if (countryCode === 'CA' || countryCode === 'US') {
    if (digits.length === 10 && /^[2-9]/.test(digits)) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith('1') && /^[2-9]/.test(digits.slice(1))) return `+${digits}`;
    return null;
  }
  if (countryCode === 'GB') {
    if (digits.startsWith('0') && digits.length >= 10 && digits.length <= 11) { const e = `+44${digits.slice(1)}`; return isE164(e) ? e : null; }
    return null;
  }
  return null;
}

export type ContactInput = { name: string; relationship: string; phone: string };
export type ContactValid = { name: string; relationship: Relationship; phone: string };
export function validateContact(i: ContactInput, countryCode: string | null | undefined): { ok: true; value: ContactValid } | { ok: false; error: string } {
  const name = i.name.trim().replace(/\s+/g, ' ');
  if (!name) return { ok: false, error: 'Enter their name.' };
  if (name.length > 60) return { ok: false, error: 'Use 60 letters or fewer for the name.' };
  const rel = RELATIONSHIPS.find((r) => r.value === i.relationship);
  if (!rel) return { ok: false, error: 'Choose who they are to you.' };
  const phone = normalizePhone(i.phone, countryCode);
  if (!phone) return { ok: false, error: 'Check the phone number. Include the area code, or start with + and the country code.' };
  return { ok: true, value: { name, relationship: rel.value, phone } };
}

// Readable form. Canada and US numbers are grouped as +1 (613) 555-0123; others stay as +digits.
export function displayPhone(e164: string): string {
  const m = /^\+1([2-9][0-9]{2})([0-9]{3})([0-9]{4})$/.exec(e164);
  return m ? `+1 (${m[1]}) ${m[2]}-${m[3]}` : e164;
}
export const telHref = (e164: string): string | null => (isE164(e164) ? `tel:${e164}` : null);
export const canAddMore = (count: number): boolean => count < MAX_CONTACTS;
