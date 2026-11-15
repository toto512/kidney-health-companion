import { describe, expect, it } from 'vitest';
import { normalizeSvgDataUri } from './qr';

describe('normalizeSvgDataUri', () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg"><rect fill="#000"/></svg>';
  it('re-encodes the unencoded utf-8 form', () => {
    const out = normalizeSvgDataUri(`data:image/svg+xml;utf-8,${svg}`);
    expect(out).toBe(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
  });
  it('is stable on already-encoded input', () => {
    const once = normalizeSvgDataUri(`data:image/svg+xml;utf-8,${svg}`);
    expect(normalizeSvgDataUri(once)).toBe(once);
  });
  it('leaves other values alone', () => expect(normalizeSvgDataUri('https://x/y.png')).toBe('https://x/y.png'));
});
