import { useColorScheme } from 'react-native';
import { dark, light, Palette } from './palette';

export type { AccentName, Palette } from './palette';
export { mix, palettes } from './palette';

// Follows the device setting (light or dark).
export function useColors(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}

export const font = { body: 18, label: 20, h2: 26, h1: 32 } as const;
export const space = { s: 8, m: 16, l: 24 } as const;
export const MIN_TOUCH = 56;
