// The calendar the person says they use. Only this choice is stored; the app does not connect to any calendar.
// Pure so vitest can run it. Null means not asked or skipped.
export const CALENDAR_APPS = ['google', 'outlook', 'apple', 'other', 'none', 'unsure'] as const;
export type CalendarApp = (typeof CALENDAR_APPS)[number];
export const isCalendarApp = (v: unknown): v is CalendarApp => typeof v === 'string' && (CALENDAR_APPS as readonly string[]).includes(v);
