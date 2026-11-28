import { describe, expect, it } from 'vitest';
import { badgeSize, contactLayout } from './contactLayout';

// Row width on a 390 px phone: 390 - 2*24 screen padding - 2*2 border - 2*10 padding = 318.
describe('contactLayout', () => {
  const row = 318;
  const chars = '+1 (514) 219-5897'.length;
  it('keeps the button beside the text at Normal size', () => expect(contactLayout(row, chars, 18)).toBe('side'));
  it('stacks at Large and Extra large so the number never breaks', () => {
    expect(contactLayout(row, chars, 22)).toBe('stacked');
    expect(contactLayout(row, chars, 25)).toBe('stacked');
  });
  it('stays beside the text on a wide screen at any size', () => expect(contactLayout(600, chars, 25)).toBe('side'));
  it('defaults to side before the row is measured', () => expect(contactLayout(0, chars, 25)).toBe('side'));
});

describe('badgeSize', () => {
  it('shrinks under 400 px only', () => {
    expect(badgeSize(48, 390)).toBe(41);
    expect(badgeSize(48, 400)).toBe(48);
    expect(badgeSize(52, 375)).toBe(44);
  });
});
