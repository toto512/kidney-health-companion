// Food lookup proxy. Returns only nutrient values that USDA FoodData Central or
// Open Food Facts actually supply. Nothing is estimated or generated here.

const FDC_SEARCH = 'https://api.nal.usda.gov/fdc/v1/foods/search';
const OFF_SEARCH = 'https://world.openfoodfacts.org/cgi/search.pl';
const USER_AGENT = 'KidneyHealthCompanion-FoodLookup/1.0 (https://health.carciente.ca)';

const MIN_QUERY = 2;
const MAX_QUERY = 80;
const MAX_RESULTS = 8;
const UPSTREAM_TIMEOUT_MS = 6000;
const CACHE_TTL_S = 60 * 60 * 24; // 24 h for hits
const CACHE_TTL_EMPTY_S = 60 * 10; // 10 min for empty results

// FDC nutrient ids -> output key, expected unit, divisor to reach output unit.
const FDC_NUTRIENTS = {
  1093: { key: 'sodium_mg', unit: 'MG' },
  1092: { key: 'potassium_mg', unit: 'MG' },
  1091: { key: 'phosphorus_mg', unit: 'MG' },
  1003: { key: 'protein_g', unit: 'G' },
};

const ATTRIBUTION = {
  usda: {
    name: 'USDA FoodData Central',
    url: 'https://fdc.nal.usda.gov/',
    license: 'Public domain (CC0 1.0)',
  },
  openfoodfacts: {
    name: 'Open Food Facts',
    url: 'https://world.openfoodfacts.org/',
    license: 'Open Database License (ODbL) 1.0; contributors, crowd-sourced',
  },
};

class UpstreamError extends Error {}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(body, status, origin, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      ...(origin ? corsHeaders(origin) : { Vary: 'Origin' }),
      ...extra,
    },
  });
}

export function normalizeQuery(raw) {
  if (typeof raw !== 'string') return { error: 'Missing query parameter q.' };
  const q = raw.normalize('NFKC').replace(/\s+/g, ' ').trim();
  if (q.length < MIN_QUERY) return { error: `Query must be at least ${MIN_QUERY} characters.` };
  if (q.length > MAX_QUERY) return { error: `Query must be at most ${MAX_QUERY} characters.` };
  // Letters, digits, space and a few food-name punctuation marks only.
  if (!/^[\p{L}\p{N} .,'&%()\-\/]+$/u.test(q)) return { error: 'Query contains unsupported characters.' };
  return { q };
}

function finiteNumber(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function round(n) {
  return Math.round(n * 100) / 100;
}

function hasAnyNutrient(per100g) {
  return Object.values(per100g).some((v) => v !== null);
}

export function normalizeFdcFood(f) {
  const per100g = { sodium_mg: null, potassium_mg: null, phosphorus_mg: null, protein_g: null };
  for (const n of Array.isArray(f.foodNutrients) ? f.foodNutrients : []) {
    const spec = FDC_NUTRIENTS[Number(n.nutrientId)];
    if (!spec) continue;
    // Accept only the expected unit; anything else stays null instead of being converted by guess.
    if (String(n.unitName || '').toUpperCase() !== spec.unit) continue;
    const v = finiteNumber(n.value);
    if (v !== null) per100g[spec.key] = round(v);
  }
  if (!hasAnyNutrient(per100g) || !f.description) return null;
  return {
    source: 'usda',
    id: String(f.fdcId),
    description: String(f.description),
    brand: f.brandOwner || f.brandName || null,
    dataType: f.dataType || null,
    per100g,
    sourceUrl: `https://fdc.nal.usda.gov/fdc-app.html#/food-details/${encodeURIComponent(f.fdcId)}/nutrients`,
  };
}

export function normalizeOffProduct(p) {
  const nu = p.nutriments || {};
  // OFF stores sodium, potassium, phosphorus and proteins per 100 g in grams.
  const mg = (v) => {
    const n = finiteNumber(v);
    return n === null ? null : round(n * 1000);
  };
  const g = (v) => {
    const n = finiteNumber(v);
    return n === null ? null : round(n);
  };
  const per100g = {
    sodium_mg: mg(nu.sodium_100g),
    potassium_mg: mg(nu.potassium_100g),
    phosphorus_mg: mg(nu.phosphorus_100g),
    protein_g: g(nu.proteins_100g),
  };
  const name = p.product_name || p.product_name_en;
  if (!name || !p.code || !hasAnyNutrient(per100g)) return null;
  return {
    source: 'openfoodfacts',
    id: String(p.code),
    description: String(name),
    brand: p.brands ? String(p.brands).split(',')[0].trim() || null : null,
    dataType: 'Packaged',
    per100g,
    sourceUrl: `https://world.openfoodfacts.org/product/${encodeURIComponent(p.code)}`,
  };
}

async function fetchJson(url, init) {
  let res;
  try {
    res = await fetch(url, { ...init, signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });
  } catch {
    throw new UpstreamError('timeout or network failure');
  }
  if (!res.ok) throw new UpstreamError(`status ${res.status}`);
  try {
    return await res.json();
  } catch {
    throw new UpstreamError('invalid JSON');
  }
}

async function searchUsda(q, apiKey) {
  const data = await fetchJson(FDC_SEARCH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey, 'User-Agent': USER_AGENT },
    body: JSON.stringify({ query: q, pageSize: MAX_RESULTS * 2, dataType: ['Foundation', 'SR Legacy', 'Branded'] }),
  });
  return (Array.isArray(data.foods) ? data.foods : []).map(normalizeFdcFood).filter(Boolean).slice(0, MAX_RESULTS);
}

async function searchOff(q) {
  const u = new URL(OFF_SEARCH);
  u.searchParams.set('search_terms', q);
  u.searchParams.set('search_simple', '1');
  u.searchParams.set('action', 'process');
  u.searchParams.set('json', '1');
  u.searchParams.set('page_size', String(MAX_RESULTS * 3));
  u.searchParams.set('fields', 'code,product_name,product_name_en,brands,nutriments');
  const data = await fetchJson(u, { headers: { 'User-Agent': USER_AGENT } });
  return (Array.isArray(data.products) ? data.products : []).map(normalizeOffProduct).filter(Boolean).slice(0, MAX_RESULTS);
}

async function lookup(q, env) {
  const errors = [];
  let foods = [];
  try {
    foods = await searchUsda(q, env.FDC_API_KEY);
  } catch (e) {
    errors.push('usda');
  }
  if (!foods.length) {
    try {
      foods = await searchOff(q);
    } catch (e) {
      errors.push('openfoodfacts');
    }
  }
  // Both sources failed: do not report "no matches", report an upstream failure.
  if (!foods.length && errors.length === 2) throw new UpstreamError('all sources failed');
  const sources = [...new Set(foods.map((f) => f.source))].map((s) => ATTRIBUTION[s]);
  return {
    // Any upstream failure means the result may be incomplete or lower quality; do not cache it.
    degraded: errors.length > 0,
    payload: {
      query: q,
      foods,
      attribution: sources,
      note: 'Values are per 100 g as published by the listed source. A null value means the source did not provide it.',
    },
  };
}

export default {
  async fetch(request, env, ctx) {
    const allowed = env.ALLOWED_ORIGIN;
    const origin = request.headers.get('Origin');
    const originOk = origin === allowed;

    if (request.method === 'OPTIONS') {
      if (!originOk) return new Response(null, { status: 403 });
      return new Response(null, { status: 204, headers: corsHeaders(allowed) });
    }
    if (request.method !== 'GET') return json({ error: 'Method not allowed.' }, 405, originOk ? allowed : null, { Allow: 'GET, OPTIONS' });

    const url = new URL(request.url);
    if (url.pathname !== '/api/food') return json({ error: 'Not found.' }, 404, originOk ? allowed : null);
    // Browsers always send Origin on cross-origin fetch. Reject anything else.
    if (!originOk) return json({ error: 'Origin not allowed.' }, 403, null);

    if (!env.FDC_API_KEY) return json({ error: 'Service not configured.' }, 500, allowed);

    const { q, error } = normalizeQuery(url.searchParams.get('q'));
    if (error) return json({ error }, 400, allowed);

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const { success } = await env.RATE_LIMITER.limit({ key: ip });
    if (!success) return json({ error: 'Too many requests. Try again in a minute.' }, 429, allowed, { 'Retry-After': '60' });

    const cache = caches.default;
    const cacheKey = new Request(`https://cache.invalid/api/food?q=${encodeURIComponent(q.toLowerCase())}`);
    const hit = await cache.match(cacheKey);
    if (hit) {
      const res = new Response(hit.body, hit);
      res.headers.set('X-Cache', 'HIT');
      for (const [k, v] of Object.entries(corsHeaders(allowed))) res.headers.set(k, v);
      return res;
    }

    let result;
    try {
      result = await lookup(q, env);
    } catch {
      return json({ error: 'Food data sources are unavailable. Try again later.' }, 502, allowed);
    }
    const { payload, degraded } = result;
    const ttl = payload.foods.length ? CACHE_TTL_S : CACHE_TTL_EMPTY_S;
    const res = json(payload, 200, allowed, {
      'Cache-Control': degraded ? 'no-store' : `public, max-age=${ttl}`,
      'X-Cache': 'MISS',
    });
    if (!degraded) ctx.waitUntil(cache.put(cacheKey, res.clone()));
    return res;
  },
};
