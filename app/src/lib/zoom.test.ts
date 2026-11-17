/// <reference types="node" />
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Older people must be able to pinch-zoom the page and use system text scaling. This fails if code switches either off.
const files = (dir: string): string[] => readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? files(p) : /\.(tsx?|json|html)$/.test(f) && !/zoom\.test\.ts$/.test(f) ? [p] : []; });
const FORBIDDEN: [string, RegExp][] = [
  ['user-scalable=no', /user-scalable\s*=\s*(no|0)/i],
  ['maximum-scale', /maximum-scale/i],
  ['touch-action that blocks pinch', /touch-?action['"]?\s*:\s*['"]?(none|pan-x|pan-y|pan-left|pan-right|pan-up|pan-down)\b/i],
  ['allowFontScaling off', /allowFontScaling\s*=\s*\{\s*false\s*\}/],
  ['maxFontSizeMultiplier', /maxFontSizeMultiplier/],
  ['pinch gesture handler', /PinchGestureHandler|Gesture\.Pinch/],
];
describe('zoom and text scaling stay on', () => {
  const all = [...files(join(__dirname, '..')), join(__dirname, '../../app.json')];
  for (const [name, re] of FORBIDDEN) it(`no ${name}`, () => { for (const f of all) expect(readFileSync(f, 'utf8'), f).not.toMatch(re); });
});
