/** Pure inactivity check so it can be unit tested. Client-side only: server-enforced timeouts need the Supabase Pro plan. */
export function isExpired(lastActivityMs: number, nowMs: number, limitMinutes: number): boolean {
  return nowMs - lastActivityMs >= limitMinutes * 60_000;
}
