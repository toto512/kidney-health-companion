// Pure rules for the scrolling wheel pickers (date and time). No react-native imports so vitest can run it.
export type WheelItem = { value: number; label: string };

// Which row sits in the middle after the wheel stops at scroll offset `y`.
export const indexFromOffset = (y: number, itemHeight: number, count: number): number =>
  count <= 0 || itemHeight <= 0 ? 0 : Math.min(count - 1, Math.max(0, Math.round(y / itemHeight)));
export const offsetForIndex = (index: number, itemHeight: number): number => index * itemHeight;
// Row height grows with the text size so a row is never shorter than a comfortable tap and never clips big text.
export const rowHeight = (labelFont: number, minTouch: number): number => Math.max(minTouch, Math.ceil(labelFont * 1.8));

export const daysInMonth = (year: number, month0: number): number => new Date(year, month0 + 1, 0).getDate();
const two = (n: number): string => String(n).padStart(2, '0');

export const dayItems = (year: number, month0: number): WheelItem[] => Array.from({ length: daysInMonth(year, month0) }, (_, i) => ({ value: i + 1, label: String(i + 1) }));
export const monthItems = (name: (month0: number) => string): WheelItem[] => Array.from({ length: 12 }, (_, i) => ({ value: i, label: name(i) }));
export const yearItems = (from = 2000, to = 2100): WheelItem[] => Array.from({ length: to - from + 1 }, (_, i) => ({ value: from + i, label: String(from + i) }));
export const hourItems = (): WheelItem[] => Array.from({ length: 24 }, (_, i) => ({ value: i, label: two(i) }));
// Minutes in steps of 5. A time saved earlier that is not a multiple of 5 stays selectable.
export const minuteItems = (current?: number): WheelItem[] => {
  const base = Array.from({ length: 12 }, (_, i) => i * 5);
  if (current !== undefined && current >= 0 && current <= 59 && !base.includes(current)) base.push(current);
  return base.sort((a, b) => a - b).map((m) => ({ value: m, label: two(m) }));
};
export const indexOfValue = (items: readonly WheelItem[], value: number): number => Math.max(0, items.findIndex((i) => i.value === value));
