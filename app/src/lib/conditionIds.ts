import { CONDITION_LIST } from '../content/conditionList';

// The picker (80 conditions) and the official content (definitions, tiles) use different ids for a few conditions.
export const OFFICIAL_ID: Record<string, string> = { hypertension: 'hbp', 'type-2-diabetes': 'diabetes', 'ischemic-heart-disease': 'heart', 'coronary-artery-disease': 'heart' };
export const officialId = (pickerId: string) => OFFICIAL_ID[pickerId] ?? pickerId;

export type ConditionCard = { key: string; officialId: string; label: string };

// One card per picked condition, in picker order. Conditions that share official content (two heart conditions) show one card.
export function cardsFor(picked: string[]): ConditionCard[] {
  const out: ConditionCard[] = [];
  const seen = new Set<string>();
  for (const id of picked) {
    const oid = officialId(id);
    if (seen.has(oid)) continue;
    seen.add(oid);
    const name = CONDITION_LIST.find((c) => c.id === id)?.name ?? id;
    out.push({ key: oid, officialId: oid, label: name });
  }
  return out;
}
