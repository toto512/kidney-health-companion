// Pure text-size rules (no React Native import) so vitest can check them.
export const TEXT_STEPS = ['normal', 'large', 'xlarge'] as const;
export type TextStep = (typeof TEXT_STEPS)[number];
export const TEXT_STEP_LABELS: Record<TextStep, string> = { normal: 'Normal', large: 'Large', xlarge: 'Extra large' };
const SCALE: Record<TextStep, number> = { normal: 1, large: 1.2, xlarge: 1.4 };
export const BASE_FONT = { body: 18, label: 20, h2: 26, h1: 32 };
export type FontSizes = { body: number; label: number; h2: number; h1: number };

export const isTextStep = (v: unknown): v is TextStep => typeof v === 'string' && (TEXT_STEPS as readonly string[]).includes(v);
// Body text never goes below 18.
export function scaledFont(step: TextStep): FontSizes {
  const k = SCALE[step];
  const r = (n: number) => Math.round(n * k);
  return { body: Math.max(18, r(BASE_FONT.body)), label: r(BASE_FONT.label), h2: r(BASE_FONT.h2), h1: r(BASE_FONT.h1) };
}
