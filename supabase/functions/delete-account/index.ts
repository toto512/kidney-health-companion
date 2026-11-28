// Deletes the signed-in person's account: their files in the lab-files bucket first, then the auth user.
// Every table row is removed by "on delete cascade" from auth.users. The service-role key is injected by Supabase into
// this function's environment; it never reaches the app or the repository.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { aalFromJwt, blockedByTwoStep, confirmed, corsOrigin } from './logic.ts';

const BUCKET = 'lab-files';

Deno.serve(async (req: Request) => {
  const allow = corsOrigin(req.headers.get('origin'), Deno.env.get('ALLOWED_ORIGINS'));
  const headers: Record<string, string> = { 'Content-Type': 'application/json', Vary: 'Origin' };
  if (allow) {
    headers['Access-Control-Allow-Origin'] = allow;
    headers['Access-Control-Allow-Headers'] = 'authorization, apikey, x-client-info, content-type';
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
  }
  const reply = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), { status, headers });

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return reply(405, { error: 'method' });

  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return reply(401, { error: 'signin' });
  let body: unknown = null;
  try { body = await req.json(); } catch { /* handled below */ }
  if (!confirmed(body)) return reply(400, { error: 'confirm' });

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } });

  // The person is whoever the token belongs to. The id is never taken from the request body.
  const { data: who, error: whoErr } = await admin.auth.getUser(token);
  if (whoErr || !who.user) return reply(401, { error: 'signin' });
  const uid = who.user.id;

  const factors = await admin.auth.admin.mfa.listFactors({ userId: uid });
  if (factors.error) return reply(500, { error: 'failed' });
  const hasVerified = (factors.data.factors ?? []).some((f: { status: string }) => f.status === 'verified');
  if (blockedByTwoStep(aalFromJwt(token), hasVerified)) return reply(403, { error: 'twostep' });

  // Files first. Supabase refuses to delete a user who still owns objects, and the files would otherwise stay behind.
  for (let guard = 0; guard < 100; guard++) {
    const { data: files, error: listErr } = await admin.storage.from(BUCKET).list(uid, { limit: 100 });
    if (listErr) return reply(500, { error: 'failed' });
    if (!files || files.length === 0) break;
    const { error: rmErr } = await admin.storage.from(BUCKET).remove(files.map((f: { name: string }) => `${uid}/${f.name}`));
    if (rmErr) return reply(500, { error: 'failed' });
  }

  const del = await admin.auth.admin.deleteUser(uid);
  if (del.error) return reply(500, { error: 'failed' });
  return reply(200, { ok: true });
});
