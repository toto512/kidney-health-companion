// @ts-ignore node types are not installed in this Expo project; vitest runs on node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// On web, react-native-svg forwards press and responder props on shapes to the DOM and React warns
// ("Unknown event handler property onResponderTerminate"). Tap handling must live on React Native views.
describe('svg shapes carry no event handlers', () => {
  it('BpChart.tsx', () => {
    const src = readFileSync(new URL('./BpChart.tsx', import.meta.url), 'utf8');
    const tags = src.match(/<(Svg|Circle|Rect|G|Path|Line|Polyline|SvgText)\b[^>]*>/g) ?? [];
    expect(tags.length).toBeGreaterThan(5);
    for (const t of tags) expect(t).not.toMatch(/\bon[A-Z]\w*=/);
  });
});

describe('upload buttons', () => {
  it('icons are decorative (hidden from screen readers) and carry no event handlers; the buttons have full spoken labels', () => {
    const src = readFileSync(new URL('./UploadButtons.tsx', import.meta.url), 'utf8');
    const tags = src.match(/<(Svg|Circle|Rect|Path)\b[^>]*>/g) ?? [];
    expect(tags.length).toBeGreaterThanOrEqual(6);
    for (const t of tags) expect(t).not.toMatch(/\bon[A-Z]\w*=/);
    expect(src.match(/importantForAccessibility="no-hide-descendants"/g)?.length).toBe(2);
    expect(src).toContain("t('upload.fileA11y')");
    expect(src).toContain("t('upload.photoA11y')");
  });
});
