// Sections that have a real screen. Anything else opens the generic "not built yet" page (app/feature/[id].tsx).
// Browse uses this, and so does the generic page itself, so a saved link, a browser history entry or an old bookmark to
// /feature/appointments lands on the Calendar instead of the placeholder.
export const BUILT_SECTIONS = { tasks: '/feature/my-day', appointments: '/feature/calendar' } as const;
export type BuiltHref = (typeof BUILT_SECTIONS)[keyof typeof BUILT_SECTIONS];
export const builtHref = (id: string | null | undefined): BuiltHref | null =>
  id && Object.prototype.hasOwnProperty.call(BUILT_SECTIONS, id) ? BUILT_SECTIONS[id as keyof typeof BUILT_SECTIONS] : null;
