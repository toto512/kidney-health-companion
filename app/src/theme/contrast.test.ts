import { describe, expect, it } from 'vitest';
import { AccentName, dark, light, mix, Palette } from './palette';

// WCAG 2.x relative luminance and contrast ratio.
const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (hex: string) => {
  const n = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => lin(parseInt(n.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// [foreground, background, minimum]. 4.5 for text, 3 for large text, icons and control boundaries (WCAG 2.2 1.4.3, 1.4.11).
type K = Exclude<keyof Palette, 'accent'>;
const PAIRS: [K, K, number][] = [
  ['text', 'bg', 4.5], ['text', 'surface', 4.5], ['text', 'primaryTint', 4.5],
  ['muted', 'bg', 4.5], ['muted', 'surface', 4.5], ['muted', 'primaryTint', 4.5],
  ['primary', 'bg', 4.5], ['primary', 'surface', 4.5], ['primary', 'primaryTint', 4.5],
  ['primaryText', 'primary', 4.5],
  ['danger', 'bg', 4.5], ['danger', 'surface', 4.5], ['danger', 'primaryTint', 4.5],
  ['warn', 'bg', 4.5], ['warn', 'surface', 4.5],
  ['inputBorder', 'surface', 3], ['inputBorder', 'bg', 3],
  ['outline', 'bg', 3], ['outline', 'surface', 3],
  ['primary', 'bg', 3],
  ['border', 'bg', 1.5], ['border', 'surface', 1.5],
];

describe.each([['light', light], ['dark', dark]] as const)('%s palette contrast', (_n, p) => {
  it.each(PAIRS)('%s on %s is at least %s:1', (fg, bg, min) => {
    expect(ratio(p[fg], p[bg])).toBeGreaterThanOrEqual(min);
  });
});

const ACCENTS = Object.keys(light.accent) as AccentName[];
describe.each([['light', light], ['dark', dark]] as const)('%s accent colours', (_n, p) => {
  it.each(ACCENTS)('%s text is at least 4.5:1 on the page and on cards', (a) => {
    expect(ratio(p.accent[a], p.bg)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(p.accent[a], p.surface)).toBeGreaterThanOrEqual(4.5);
  });
  it.each(ACCENTS)('%s icon is at least 3:1 on its own soft icon background (graphics, no text sits there)', (a) => {
    expect(ratio(p.accent[a], mix(p.accent[a], p.surface, 0.16))).toBeGreaterThanOrEqual(3);
  });
});

import { ramp } from './palette';
describe.each([['light', light], ['dark', dark]] as const)('%s chart ramp', (_n, p) => {
  it.each([1, 3, 8, 25])('every one of %s slices is at least 3:1 on the card (graphics)', (n) => {
    for (const c of [...ramp(p, n, 'blue'), ...ramp(p, n, 'red')]) expect(ratio(c, p.surface)).toBeGreaterThanOrEqual(3);
  });
});

describe.each([['light', light], ['dark', dark]] as const)('%s reference toggle', (_n, p) => {
  it.each(ACCENTS)('%s text is at least 4.5:1 on its own 6% tint', (a) => {
    expect(ratio(p.accent[a], mix(p.accent[a], p.surface, 0.06))).toBeGreaterThanOrEqual(4.5);
  });
});
