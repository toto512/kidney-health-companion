// Colours only (no React Native import), so the contrast test can read them.
// border: quiet divider for panels. outline: boundary of tappable cards and tiles (3:1 against the page and card colours).
export const light = {
  bg: '#F2F6F5',
  surface: '#FFFFFF',
  border: '#B4C3BD',
  outline: '#7E918B',
  inputBorder: '#5B6762',
  muted: '#3F4B47',
  primaryTint: '#E2F0EC',
  text: '#111827',
  primary: '#0B5F4E',
  primaryText: '#FFFFFF',
  danger: '#B42318',
  warn: '#8A4B00',
  shadow: '#0F2A24',
  accent: { red: '#C1272D', orange: '#B45309', green: '#15803D', teal: '#0F766E', blue: '#1D4ED8', indigo: '#4338CA', purple: '#7E22CE' },
};
export const dark: Palette = {
  bg: '#000000',
  surface: '#1A1C1B',
  border: '#34443F',
  outline: '#6C817A',
  inputBorder: '#9BB0AA',
  muted: '#C3CFCB',
  primaryTint: '#1F3A33',
  text: '#F1F5F4',
  primary: '#5CC8AE',
  primaryText: '#06201A',
  danger: '#FF8A7A',
  warn: '#F5B66B',
  shadow: '#000000',
  accent: { red: '#FF6B6B', orange: '#FFA040', green: '#4ADE80', teal: '#2DD4BF', blue: '#6CA8FF', indigo: '#9DA8FF', purple: '#C792FF' },
};
export type Palette = typeof light;
export type AccentName = keyof typeof light.accent;

// Blends colour a over colour b (alpha 0 to 1). Used for the soft background behind a category icon.
export function mix(a: string, b: string, alpha: number): string {
  const ch = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  const out = [0, 1, 2].map((i) => Math.round(ch(a, i) * alpha + ch(b, i) * (1 - alpha)).toString(16).padStart(2, '0'));
  return `#${out.join('')}`;
}
export const palettes = { light, dark };

// Ordered single-hue ramp for the share chart: lightest to darkest by range, so order carries meaning and every slice also has a text label.
export function ramp(p: Palette, n: number): string[] {
  return Array.from({ length: n }, (_, i) => mix(p.accent.blue, p.surface, n === 1 ? 1 : 1 - (i / (n - 1)) * 0.35));
}
