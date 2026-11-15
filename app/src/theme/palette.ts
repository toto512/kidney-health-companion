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
};
export const dark: Palette = {
  bg: '#0E1513',
  surface: '#18231F',
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
};
export type Palette = typeof light;
export const palettes = { light, dark };
