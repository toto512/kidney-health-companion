import { describe, expect, it } from 'vitest';
import { isTextStep, scaledFont } from './textSize';

describe('text size', () => {
  it('normal keeps the current sizes', () => { expect(scaledFont('normal')).toEqual({ body: 18, label: 20, h2: 26, h1: 32 }); });
  it('each step is larger, body never below 18', () => {
    const n = scaledFont('normal'), l = scaledFont('large'), x = scaledFont('xlarge');
    for (const k of ['body', 'label', 'h2', 'h1'] as const) { expect(l[k]).toBeGreaterThan(n[k]); expect(x[k]).toBeGreaterThan(l[k]); }
    expect(n.body).toBeGreaterThanOrEqual(18);
  });
  it('validates stored values', () => { expect(isTextStep('large')).toBe(true); expect(isTextStep('huge')).toBe(false); expect(isTextStep(null)).toBe(false); });
});
