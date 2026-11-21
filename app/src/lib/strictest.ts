export type Verdict = 'allowed' | 'check' | 'not_allowed';
const RANK: Record<Verdict, number> = { allowed: 0, check: 1, not_allowed: 2 };

/** Strictest rule wins: any condition forbidding a food makes it not_allowed. No rules at all returns 'check', never 'allowed'. */
export function combineVerdicts(verdicts: Verdict[]): Verdict {
  if (verdicts.length === 0) return 'check';
  return verdicts.reduce((a, b) => (RANK[b] > RANK[a] ? b : a));
}
