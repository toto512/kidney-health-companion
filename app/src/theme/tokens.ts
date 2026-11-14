// Minimum body text 18, headings larger. Contrast pairs chosen for WCAG AA on white (to be verified by the Phase 2 accessibility check).
export const color = {
  bg: '#FFFFFF',
  text: '#111827',
  primary: '#0B5F4E',
  primaryText: '#FFFFFF',
  danger: '#B42318',
  warn: '#8A4B00',
  tiles: ['#0B5F4E', '#1D4ED8', '#7C2D92', '#B45309', '#BE123C', '#0E7490', '#4D7C0F', '#334155'],
} as const;

export const font = { body: 18, label: 20, h2: 26, h1: 32 } as const;
export const space = { s: 8, m: 16, l: 24 } as const;
export const MIN_TOUCH = 56;
