// Searches USDA FoodData Central (Foundation Foods and SR Legacy only, no brand records) for a food the app has no numbers for.
// The api.data.gov key lives in this function's secrets (FDC_API_KEY). It never reaches the app or the repository.
import { allow, cleanQuery, corsOrigin, parseHits, subFromJwt } from './logic.ts';

const hits = new Map<string, number[]>();

Deno.serve(async (req: Request) => {
  const allowOrigin = corsOrigin(req.headers.get('origin'), Deno.env.get('ALLOWED_ORIGINS'));
  const headers: Record<string, string> = { 'Content-Type': 'application/json', Vary: 'Origin' };
  if (allowOrigin) {
    headers['Access-Control-Allow-Origin'] = allowOrigin;
    headers['Access-Control-Allow-Headers'] = 'authorization, apikey, x-client-info, content-type';
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
  }
  const reply = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), { status, headers });

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return reply(405, { error: 'method' });

  const uid = subFromJwt((req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, ''));
  if (!uid) return reply(401, { error: 'signin' });
  const key = Deno.env.get('FDC_API_KEY');
  if (!key) return reply(503, { error: 'notSetUp' });

  let body: unknown = null;
  try { body = await req.json(); } catch { /* handled below */ }
  const q = cleanQuery((body as { q?: unknown } | null)?.q);
  if (!q) return reply(400, { error: 'query' });
  if (!allow(hits, uid, Date.now())) return reply(429, { error: 'busy' });

  try {
    const res = await fetch('https://api.nal.usda.gov/fdc/v1/foods/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': key },
      body: JSON.stringify({ query: q, dataType: ['Foundation', 'SR Legacy'], pageSize: 25, requireAllWords: true }),
      signal: AbortSignal.timeout(10000),
    });
    if (res.status === 429) return reply(429, { error: 'busy' });
    if (!res.ok) return reply(502, { error: 'failed' });
    return reply(200, { foods: parseHits(await res.json(), 10) });
  } catch {
    return reply(502, { error: 'failed' });
  }
});
