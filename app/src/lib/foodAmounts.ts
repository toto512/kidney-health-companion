import { FOOD_NUTRITION, NUTRITION_CHECKED_ON, type Nutrient, type NutrientClass } from '../content/foodNutrition';

export const CNF_URL = 'https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/nutrient-data.html';
export const usdaUrl = (fdcId: number) => `https://fdc.nal.usda.gov/fdc-app.html#/food-details/${fdcId}/nutrients`;
export const NUTRIENTS: Nutrient[] = ['sodiumMg', 'potassiumMg', 'phosphorusMg', 'proteinG'];

export type AmountRow = { nutrient: Nutrient; value: number | null; cls: NutrientClass | null };
export type ResolvedAmounts = {
  source: 'cnf' | 'usda';
  serving: string;
  rows: AmountRow[];
  recordName: string;
  recordId: number;
  file?: string; // USDA file the record came from
  url: string;
  checkedOn: string;
};

// Canadian users read the Canadian Nutrient File first. Everyone else reads USDA first. The other source fills in when a food has only one.
export function amountsFor(foodId: string, country: string | null | undefined): ResolvedAmounts | null {
  const n = FOOD_NUTRITION[foodId];
  if (!n) return null;
  const order: ('cnf' | 'usda')[] = country === 'CA' ? ['cnf', 'usda'] : ['usda', 'cnf'];
  const source = order.find((s) => (s === 'cnf' ? !!n.cnf : !!n.usda));
  if (!source) return null;
  const rec = source === 'cnf' ? n.cnf : n.usda!;
  const rows: AmountRow[] = NUTRIENTS.map((k) => {
    const v = rec.per100[k];
    return { nutrient: k, value: v === undefined ? null : perServing(k, v, n.servingG), cls: source === 'cnf' ? n.cnf.cls[k] ?? null : null };
  });
  return {
    source,
    serving: `${n.servingLabel}${/\bg$/.test(n.servingLabel) ? '' : ` (${round1(n.servingG)} g)`}`,
    rows,
    recordName: rec.name,
    recordId: source === 'cnf' ? n.cnf.code : n.usda!.fdcId,
    file: source === 'usda' ? n.usda!.file : undefined,
    url: source === 'cnf' ? CNF_URL : usdaUrl(n.usda!.fdcId),
    checkedOn: NUTRITION_CHECKED_ON,
  };
}

const round1 = (x: number) => Math.round(x * 10) / 10;
// Scaling by serving weight only. Values under 10 keep one decimal, larger minerals show whole numbers.
export function perServing(k: Nutrient, per100: number, servingG: number): number {
  const v = (per100 * servingG) / 100;
  return k === 'proteinG' || v < 10 ? round1(v) : Math.round(v);
}
