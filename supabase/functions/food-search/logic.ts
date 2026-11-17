// Pure helpers for the food-search function, kept free of Deno APIs so the app's test suite can run them.

export const DEFAULT_ORIGINS = ['https://health.carciente.ca'];

export function corsOrigin(origin: string | null, extra: string | undefined): string | null {
  if (!origin) return null;
  const list = [...DEFAULT_ORIGINS, ...(extra ?? '').split(',').map((s) => s.trim()).filter(Boolean)];
  if (list.includes(origin)) return origin;
  return /^http:\/\/localhost:\d{2,5}$/.test(origin) ? origin : null;
}

// The person is whoever the token belongs to. The gateway has already verified the signature; this only reads "sub".
export function subFromJwt(jwt: string): string | null {
  try {
    const part = jwt.split('.')[1];
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '='));
    const sub = (JSON.parse(json) as { sub?: unknown }).sub;
    return typeof sub === 'string' && sub.length > 0 ? sub : null;
  } catch {
    return null;
  }
}

// A search term: letters, numbers and common punctuation only, 2 to 80 characters. Returns null when unusable.
export function cleanQuery(q: unknown): string | null {
  if (typeof q !== 'string') return null;
  const t = q.replace(/[^\p{L}\p{N} ,'/&%()-]/gu, ' ').replace(/\s+/g, ' ').trim();
  return t.length >= 2 && t.length <= 80 ? t : null;
}

// FoodData Central allows 1,000 requests per hour per IP address (official API guide) and blocks the key for an hour beyond that.
// Every request from this function shares one IP, so each person gets a small share. Best effort: the counter lives in this instance.
export const PER_PERSON_LIMIT = 30;
export const WINDOW_MS = 60 * 60 * 1000;
export function allow(hits: Map<string, number[]>, uid: string, now: number, limit = PER_PERSON_LIMIT): boolean {
  const recent = (hits.get(uid) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= limit) { hits.set(uid, recent); return false; }
  recent.push(now);
  hits.set(uid, recent);
  return true;
}

export type Per100 = { sodiumMg?: number; potassiumMg?: number; phosphorusMg?: number; proteinG?: number };
export type FoodHit = { fdcId: number; name: string; dataType: 'Foundation' | 'SR Legacy'; per100: Per100 };
const NUM: Record<string, keyof Per100> = { '307': 'sodiumMg', '306': 'potassiumMg', '305': 'phosphorusMg', '203': 'proteinG' };

// The search API names the fields number/amount in its published spec and nutrientNumber/value in practice, so both are read.
export function parseHits(json: unknown, max = 10): FoodHit[] {
  const foods = (json as { foods?: unknown })?.foods;
  if (!Array.isArray(foods)) return [];
  const out: FoodHit[] = [];
  for (const f of foods) {
    if (out.length >= max) break;
    const r = f as { fdcId?: unknown; description?: unknown; dataType?: unknown; foodNutrients?: unknown };
    if (typeof r.fdcId !== 'number' || typeof r.description !== 'string') continue;
    if (r.dataType !== 'Foundation' && r.dataType !== 'SR Legacy') continue;
    const per100: Per100 = {};
    if (Array.isArray(r.foodNutrients)) {
      for (const n of r.foodNutrients as Record<string, unknown>[]) {
        const num = String(n.nutrientNumber ?? n.number ?? '');
        const val = n.value ?? n.amount;
        const key = NUM[num];
        if (key && typeof val === 'number' && Number.isFinite(val) && val >= 0) per100[key] = Math.round(val * 1000) / 1000;
      }
    }
    out.push({ fdcId: r.fdcId, name: r.description.slice(0, 160), dataType: r.dataType, per100 });
  }
  return out;
}
