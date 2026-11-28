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
    // Hidden from screen readers by a View around each icon. Svg itself must not carry accessibility props (web logs an unknown-prop error).
    expect(src.match(/<View accessible=\{false\} importantForAccessibility="no-hide-descendants">/g)?.length).toBe(2);
    for (const t of src.match(/<Svg\b[^>]*>/g) ?? []) expect(t).not.toMatch(/importantForAccessibility|accessibilityElementsHidden/);
    expect(src).toContain("t('upload.fileA11y')");
    expect(src).toContain("t('upload.photoA11y')");
    // Photo is always shown next to File (desktop included): the webcam on computers, with the picture file picker as the fallback.
    expect(src).not.toMatch(/cameraAvailable|cameraAvailable\(\) \?/);
    expect(src).toContain('<WebcamModal');
    expect(src).toContain('upload.noWebcam');
    expect(src.match(/<Big /g)?.length).toBe(2);
  });
});

describe('tab icons', () => {
  it('Svg carries no accessibility props (web forwards accessible={false} to the DOM and React warns); a View around it hides the icon', () => {
    const src = readFileSync(new URL('./TabIcon.tsx', import.meta.url), 'utf8');
    for (const t of src.match(/<Svg\b[^>]*>/g) ?? []) expect(t).not.toMatch(/accessible|importantForAccessibility|accessibilityElementsHidden/);
    expect(src).toContain('<View accessible={false} importantForAccessibility="no-hide-descendants">');
  });
});

describe('segmented toggle', () => {
  it('has padding so a two-line label (for example "feet and inches") never touches the border, and centres its text', () => {
    const src = readFileSync(new URL('./ui.tsx', import.meta.url), 'utf8');
    const seg = src.slice(src.indexOf('export function Segmented'));
    expect(seg).toMatch(/paddingVertical: \d+/);
    expect(seg).toMatch(/paddingHorizontal: \d+/);
    expect(seg).toContain("textAlign: 'center'");
    expect(seg).toMatch(/minWidth: font\.label/); // wraps to a second row before a word is squeezed against the border at Extra large
  });
});

describe('big button', () => {
  it('has vertical padding and centred text so a wrapped label keeps space from the edges', () => {
    const src = readFileSync(new URL('./ui.tsx', import.meta.url), 'utf8');
    expect(src).toMatch(/btn: \{[^}]*paddingVertical: \d+/);
    expect(src).toMatch(/btnText: \{[^}]*textAlign: 'center'/);
  });
});
