import { useColorScheme } from 'react-native';
import { dark, light, Palette } from './palette';
import { scaledFont, TextStep } from './textSize';

export type { AccentName, Palette } from './palette';
export { mix, palettes, ramp } from './palette';

// Follows the device setting (light or dark).
export function useColors(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}

// Mutable on purpose: setTextSize changes the sizes in place and the app remounts (see _layout), so every screen picks them up.
export const font = scaledFont('normal');
export function setTextSize(step: TextStep): void { Object.assign(font, scaledFont(step)); }
export const space = { s: 8, m: 16, l: 24 } as const;
export const MIN_TOUCH = 56;
