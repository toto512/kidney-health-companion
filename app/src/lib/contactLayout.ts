// Pure layout rules for a contact row (no React Native import, so vitest can check them).
export const CALL_BTN_W = 96;
export const NARROW_PX = 400;
// Rough width of a phone number in bold text: about 0.52 of the font size per character in system fonts, measured at 0.52, rounded up to 0.55 for safety.
export const phoneWidth = (chars: number, fontSize: number) => Math.ceil(chars * fontSize * 0.55);
// Beside the number when it fits on one line next to the button, otherwise the button goes below the text at full width.
export function contactLayout(rowWidth: number, phoneChars: number, fontSize: number): 'side' | 'stacked' {
  if (rowWidth <= 0) return 'side';
  const textColumn = rowWidth - CALL_BTN_W - 12 - 16;
  return phoneWidth(phoneChars, fontSize) <= textColumn ? 'side' : 'stacked';
}
// Icon badges shrink a little on narrow phones.
export const badgeSize = (size: number, windowWidth: number) => (windowWidth < NARROW_PX ? Math.round(size * 0.85) : size);
