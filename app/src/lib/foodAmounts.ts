import { FOOD_NUTRITION, NUTRITION_CHECKED_ON, type FormKind, type Nutrient, type NutrientClass, type Per100 } from '../content/foodNutrition';

// Per-food pages: the CNF page for a Food_Code (Health Canada's Canadian Nutrient File site, English or French) and the FoodData Central nutrients page for an FDC ID.
export const cnfUrl = (code: number, lang: string) => `https://${lang === 'fr' ? 'aliments-nutrition' : 'food-nutrition'}.canada.ca/cnf-fce/serving-portion?id=${code}`;
// Official pages the person can open to look a food up themselves. The USDA search page fills in the food name. The CNF and CoFID links open each programme's own page.
export type LookupKind = 'usda' | 'cnf' | 'cofid';
export function lookupLinks(name: string, country: string | null | undefined, lang = 'en'): { kind: LookupKind; url: string }[] {
  const out: { kind: LookupKind; url: string }[] = [{ kind: 'usda', url: `https://fdc.nal.usda.gov/food-search/?query=${encodeURIComponent(name)}` }];
  if (country === 'CA') out.unshift({ kind: 'cnf', url: `https://${lang === 'fr' ? 'aliments-nutrition' : 'food-nutrition'}.canada.ca/cnf-fce/` });
  if (country === 'GB') out.unshift({ kind: 'cofid', url: 'https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid' });
  return out;
}
export const usdaUrl = (fdcId: number) => `https://fdc.nal.usda.gov/food-details/${fdcId}/nutrients`;
// Why a value needs review, from its CNF source code.
export function reviewReason(src: number | null): 'zero' | 'prov' | 'lit' | 'intl' | 'other' {
  if (src === 12) return 'zero';
  if (src === 14) return 'prov';
  if (src === 10) return 'lit';
  if (src !== null && src >= 81 && src <= 83) return 'intl';
  return 'other';
}
export const NUTRIENTS: Nutrient[] = ['sodiumMg', 'potassiumMg', 'phosphorusMg', 'proteinG'];

export type AmountRow = { nutrient: Nutrient; value: number | null; cls: NutrientClass | null; src: number | null }; // src: CNF nutrient source code
export type ResolvedAmounts = {
  source: 'cnf' | 'usda';
  form: FormKind; // the form shown
  forms: FormKind[]; // forms that have an official record
  variant: boolean; // one common variant was picked from several official records: other types can differ
  missing: 'raw' | 'cooked' | null; // the other form, when the shown one is raw or cooked and no official record exists for the other
  serving: string;
  servingG: number; // weight of the official serving, grams
  per100: Per100; // the record's values per 100 g, as published
  rows: AmountRow[];
  recordName: string;
  recordId: number;
  file?: string; // USDA file the record came from
  url: string;
  checkedOn: string;
};

// Canadian users read the Canadian Nutrient File first. Everyone else reads USDA first. The other source fills in when a food has only one.
export function amountsFor(foodId: string, country: string | null | undefined, wanted?: FormKind | null, lang = 'en'): ResolvedAmounts | null {
  const food = FOOD_NUTRITION[foodId];
  if (!food) return null;
  const n = food.forms.find((f) => f.form === wanted) ?? food.forms[food.default];
  const order: ('cnf' | 'usda')[] = country === 'CA' ? ['cnf', 'usda'] : ['usda', 'cnf'];
  const source = order.find((s) => (s === 'cnf' ? !!n.cnf : !!n.usda));
  if (!source) return null;
  const rec = source === 'cnf' ? n.cnf! : n.usda!;
  const rows: AmountRow[] = NUTRIENTS.map((k) => {
    const v = rec.per100[k];
    return { nutrient: k, value: v === undefined ? null : perServing(k, v, n.servingG), cls: source === 'cnf' ? n.cnf!.cls[k] ?? null : null, src: source === 'cnf' ? n.cnf!.src[k] ?? null : null };
  });
  const forms = food.forms.map((f) => f.form);
  // The note only makes sense where people eat both forms: fruit, nuts and dried legumes are not flagged.
  const flag = /^(vegetables|meat-poultry|fish-seafood|eggs)\//.test(foodId);
  const missing = n.form === 'other' || food.single || !flag ? null : forms.includes(n.form === 'raw' ? 'cooked' : 'raw') ? null : n.form === 'raw' ? 'cooked' : 'raw';
  return {
    source,
    form: n.form,
    forms,
    missing,
    variant: !!food.variant,
    serving: /\bg$/.test(n.servingLabel) ? n.servingLabel : `${n.servingLabel} (${Math.round(n.servingG)} g)`,
    servingG: n.servingG,
    per100: rec.per100,
    rows,
    recordName: rec.name,
    recordId: source === 'cnf' ? n.cnf!.code : n.usda!.fdcId,
    file: source === 'usda' ? n.usda!.file : undefined,
    url: source === 'cnf' ? cnfUrl(n.cnf!.code, lang) : usdaUrl(n.usda!.fdcId),
    checkedOn: NUTRITION_CHECKED_ON,
  };
}

const round1 = (x: number) => Math.round(x * 10) / 10;
// Scaling by serving weight only. Values under 10 keep one decimal, larger minerals show whole numbers.
export function perServing(k: Nutrient, per100: number, servingG: number): number {
  const v = (per100 * servingG) / 100;
  return k === 'proteinG' || v < 10 ? round1(v) : Math.round(v);
}
