import { useColorScheme } from 'react-native';

// Minimum body text 18, headings larger. Both palettes keep text and background at WCAG AA contrast or better (to be verified by the Phase 2 accessibility check).
const light = {
  bg: '#F2F6F5',
  surface: '#FFFFFF',
  border: '#C9D5D1',
  inputBorder: '#5B6762',
  muted: '#3F4B47',
  primaryTint: '#E2F0EC',
  text: '#111827',
  primary: '#0B5F4E',
  primaryText: '#FFFFFF',
  danger: '#B42318',
  warn: '#8A4B00',
  shadow: '#0F2A24',
};
const dark: Palette = {
  bg: '#0E1513',
  surface: '#18231F',
  border: '#34443F',
  inputBorder: '#9BB0AA',
  muted: '#C3CFCB',
  primaryTint: '#1F3A33',
  text: '#F1F5F4',
  primary: '#5CC8AE',
  primaryText: '#06201A',
  danger: '#FF8A7A',
  warn: '#F5B66B',
  shadow: '#000000',
};
export type Palette = typeof light;
export const palettes = { light, dark };

// Follows the device setting (light or dark).
export function useColors(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}

export const font = { body: 18, label: 20, h2: 26, h1: 32 } as const;
export const space = { s: 8, m: 16, l: 24 } as const;
export const MIN_TOUCH = 56;
