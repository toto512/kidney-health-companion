import type { Key } from './strings/en';
import type { DialTarget } from '../content/emergencyDial';

// Label for a one-tap emergency button. The number itself comes from the verified list; only the words around it are translated.
export function dialText(t: (k: Key, v?: Record<string, string | number>) => string, d: DialTarget): string {
  const label = /ambulance/i.test(d.label) ? t('emergency.ambulance') : /medical/i.test(d.label) ? t('emergency.medical') : d.label;
  return label ? t('emergency.callNowLabel', { number: d.display, label }) : t('emergency.callNow', { number: d.display });
}
