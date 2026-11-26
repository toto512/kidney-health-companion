// Colours only (no React Native import), so the contrast test can read them.
// border: quiet divider for panels. outline: boundary of tappable cards and tiles (3:1 against the page and card colours).
export const light = {
  bg: '#F2F2F7',
  surface: '#FFFFFF',
  border: '#C4C4CA',
  outline: '#7A8782',
  inputBorder: '#5B6762',
  muted: '#3F4B47',
  primaryTint: '#E2F0EC',
  text: '#111827',
  primary: '#0B5F4E',
  primaryText: '#FFFFFF',
  danger: '#B42318',
  warn: '#8A4B00',
  shadow: '#0F2A24',
  accent: { red: '#C1272D', orange: '#B45309', green: '#137535', teal: '#0F766E', blue: '#1D4ED8', indigo: '#4338CA', purple: '#7E22CE' },
  // Soft header wash behind the top of each screen (pink to lilac to periwinkle), fading into bg.
  gradient: ['#FFD3CC', '#F4D9F0', '#D8D5FF'] as [string, string, string],
};
export const dark: Palette = {
  bg: '#000000',
  surface: '#1C1C1E',
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
  gradient: ['#4A2A30', '#3A2A48', '#2A2D56'] as [string, string, string],
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
export function ramp(p: Palette, n: number, accent: 'red' | 'blue' = 'blue'): string[] {
  return Array.from({ length: n }, (_, i) => mix(p.accent[accent], p.surface, n === 1 ? 1 : 1 - (i / (n - 1)) * 0.35));
}
