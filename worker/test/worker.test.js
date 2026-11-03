import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import worker, { normalizeQuery, normalizeFdcFood, normalizeOffProduct } from '../src/index.js';

const ORIGIN = 'https://health.carciente.ca';
let calls, store, limitOk, fdcResponse, offResponse;

const env = () => ({ FDC_API_KEY: 'secret-key', ALLOWED_ORIGIN: ORIGIN, RATE_LIMITER: { limit: async () => ({ success: limitOk }) } });
const ctx = { waitUntil: (p) => p };
const req = (path, init = {}) => new Request(`https://w.example${path}`, { headers: { Origin: ORIGIN, 'CF-Connecting-IP': '1.2.3.4' }, ...init });

beforeEach(() => {
  calls = [];
  store = new Map();
  limitOk = true;
  fdcResponse = () => Response.json({ foods: [] });
  offResponse = () => Response.json({ products: [] });
  globalThis.caches = {
    default: {
      match: async (r) => store.get(r.url)?.clone(),
      put: async (r, res) => void store.set(r.url, res),
    },
  };
  globalThis.fetch = async (url, init) => {
    const u = String(url);
    calls.push({ url: u, init });
    return u.includes('nal.usda.gov') ? fdcResponse() : offResponse();
  };
});

const fdcFood = {
  fdcId: 170,
  description: 'Rice, white',
  dataType: 'SR Legacy',
  foodNutrients: [
    { nutrientId: 1093, unitName: 'MG', value: 1 },
    { nutrientId: 1092, unitName: 'MG', value: 35 },
    { nutrientId: 1091, unitName: 'MG', value: 43 },
    { nutrientId: 1003, unitName: 'G', value: 2.69 },
  ],
};

test('normalizeQuery validation', () => {
  assert.equal(normalizeQuery('  Rice   white ').q, 'Rice white');
  assert.ok(normalizeQuery('a').error);
  assert.ok(normalizeQuery('x'.repeat(81)).error);
  assert.ok(normalizeQuery('rice<script>').error);
  assert.ok(normalizeQuery(null).error);
});

test('FDC: keeps absent nutrients null, rejects unexpected units', () => {
  const f = normalizeFdcFood({ ...fdcFood, foodNutrients: [{ nutrientId: 1093, unitName: 'UG', value: 5 }, { nutrientId: 1003, unitName: 'G', value: 2 }] });
  assert.deepEqual(f.per100g, { sodium_mg: null, potassium_mg: null, phosphorus_mg: null, protein_g: 2 });
  assert.equal(normalizeFdcFood({ ...fdcFood, foodNutrients: [] }), null);
});

test('OFF: converts g to mg, null when missing', () => {
  const p = normalizeOffProduct({ code: '123', product_name: 'Crackers', brands: 'Acme, Other', nutriments: { sodium_100g: 0.5, proteins_100g: 8 } });
  assert.deepEqual(p.per100g, { sodium_mg: 500, potassium_mg: null, phosphorus_mg: null, protein_g: 8 });
  assert.equal(p.brand, 'Acme');
  assert.equal(normalizeOffProduct({ code: '1', product_name: 'x', nutriments: {} }), null);
});

test('GET returns USDA data with attribution and sends key by header only', async () => {
  fdcResponse = () => Response.json({ foods: [fdcFood] });
  const res = await worker.fetch(req('/api/food?q=rice'), env(), ctx);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), ORIGIN);
  const body = await res.json();
  assert.equal(body.foods[0].per100g.sodium_mg, 1);
  assert.equal(body.attribution[0].name, 'USDA FoodData Central');
  assert.equal(calls.length, 1);
  assert.ok(!calls[0].url.includes('secret-key'));
  assert.equal(calls[0].init.headers['X-Api-Key'], 'secret-key');
  assert.ok(!JSON.stringify(body).includes('secret-key'));
});

test('falls back to Open Food Facts when USDA has no usable results', async () => {
  offResponse = () => Response.json({ products: [{ code: '9', product_name: 'Cheese puffs', nutriments: { sodium_100g: 1.2 } }] });
  const body = await (await worker.fetch(req('/api/food?q=cheese+puffs'), env(), ctx)).json();
  assert.equal(body.foods[0].source, 'openfoodfacts');
  assert.equal(body.foods[0].per100g.sodium_mg, 1200);
  assert.equal(body.attribution[0].name, 'Open Food Facts');
});

test('falls back to OFF when USDA errors', async () => {
  fdcResponse = () => new Response('x', { status: 500 });
  offResponse = () => Response.json({ products: [{ code: '9', product_name: 'Soup', nutriments: { proteins_100g: 3 } }] });
  const res = await worker.fetch(req('/api/food?q=soup'), env(), ctx);
  assert.equal(res.status, 200);
});

test('does not cache results produced after a partial upstream failure', async () => {
  fdcResponse = () => new Response('x', { status: 500 });
  offResponse = () => Response.json({ products: [{ code: '9', product_name: 'Soup', nutriments: { proteins_100g: 3 } }] });
  const first = await worker.fetch(req('/api/food?q=soup'), env(), ctx);
  assert.equal(first.headers.get('Cache-Control'), 'no-store');
  assert.equal(calls.length, 2);
  await worker.fetch(req('/api/food?q=soup'), env(), ctx);
  assert.equal(calls.length, 4);
  // USDA empty and OFF failing must not cache an empty result either.
  calls.length = 0;
  fdcResponse = () => Response.json({ foods: [] });
  offResponse = () => new Response('x', { status: 503 });
  await worker.fetch(req('/api/food?q=beans'), env(), ctx);
  await worker.fetch(req('/api/food?q=beans'), env(), ctx);
  assert.equal(calls.length, 4);
});

test('502 when both sources fail; empty result is 200 with no foods', async () => {
  fdcResponse = () => new Response('x', { status: 500 });
  offResponse = () => new Response('x', { status: 503 });
  assert.equal((await worker.fetch(req('/api/food?q=soup'), env(), ctx)).status, 502);
  fdcResponse = () => Response.json({ foods: [] });
  offResponse = () => Response.json({ products: [] });
  const res = await worker.fetch(req('/api/food?q=zzzzqq'), env(), ctx);
  assert.equal(res.status, 200);
  assert.deepEqual((await res.json()).foods, []);
});

test('caches: second identical request makes no upstream call', async () => {
  fdcResponse = () => Response.json({ foods: [fdcFood] });
  await worker.fetch(req('/api/food?q=Rice'), env(), ctx);
  const res = await worker.fetch(req('/api/food?q=rice'), env(), ctx);
  assert.equal(res.headers.get('X-Cache'), 'HIT');
  assert.equal(calls.length, 1);
});

test('rejects wrong or missing Origin, bad method, bad path, bad query', async () => {
  const e = env();
  const bad = await worker.fetch(new Request('https://w.example/api/food?q=rice', { headers: { Origin: 'https://evil.example' } }), e, ctx);
  assert.equal(bad.status, 403);
  assert.equal(bad.headers.get('Access-Control-Allow-Origin'), null);
  assert.equal((await worker.fetch(new Request('https://w.example/api/food?q=rice'), e, ctx)).status, 403);
  assert.equal((await worker.fetch(req('/api/food?q=rice', { method: 'POST' }), e, ctx)).status, 405);
  assert.equal((await worker.fetch(req('/other'), e, ctx)).status, 404);
  assert.equal((await worker.fetch(req('/api/food?q=a'), e, ctx)).status, 400);
  assert.equal(calls.length, 0);
});

test('OPTIONS preflight', async () => {
  const ok = await worker.fetch(req('/api/food', { method: 'OPTIONS' }), env(), ctx);
  assert.equal(ok.status, 204);
  assert.equal(ok.headers.get('Access-Control-Allow-Origin'), ORIGIN);
  const no = await worker.fetch(new Request('https://w.example/api/food', { method: 'OPTIONS', headers: { Origin: 'https://evil.example' } }), env(), ctx);
  assert.equal(no.status, 403);
});

test('rate limit returns 429 before any upstream call', async () => {
  limitOk = false;
  const res = await worker.fetch(req('/api/food?q=rice'), env(), ctx);
  assert.equal(res.status, 429);
  assert.equal(calls.length, 0);
});

test('500 when secret is not configured', async () => {
  const e = env();
  delete e.FDC_API_KEY;
  assert.equal((await worker.fetch(req('/api/food?q=rice'), e, ctx)).status, 500);
});
