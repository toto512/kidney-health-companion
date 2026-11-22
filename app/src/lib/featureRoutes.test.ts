// @ts-ignore node types are not installed in this Expo project; vitest runs on node
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BUILT_SECTIONS, builtHref } from './featureRoutes';
import { TEMPLATES } from './myDayLogic';

const src = (rel: string): string => readFileSync(new URL(rel, import.meta.url), 'utf8');
describe('no link to a built section reaches the placeholder', () => {
  it('maps the built sections and ignores everything else', () => {
    expect(builtHref('appointments')).toBe('/feature/calendar');
    expect(builtHref('tasks')).toBe('/feature/my-day');
    for (const id of ['settings', 'food', '', null, undefined, 'toString', '__proto__']) expect(builtHref(id as never)).toBeNull();
  });
  it('every target screen exists', () => {
    for (const href of Object.values(BUILT_SECTIONS)) expect(() => src(`../app${href}.tsx`), href).not.toThrow();
  });
  it('the generic page redirects built sections', () => {
    const page = src('../app/feature/[id].tsx');
    expect(page).toContain('builtHref(');
    expect(page).toContain('<Redirect');
  });
  it('Browse sends every tile through builtHref, and Browse has the appointments tile', () => {
    const browse = src('../app/(tabs)/browse.tsx');
    expect(browse).toContain("id: 'appointments'");
    expect(browse).toContain('builtHref(c.id)');
  });
  it('no source file links straight to the placeholder for a built section', () => {
    const walk = (dir: URL): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((e: { name: string; isDirectory(): boolean }) =>
      e.isDirectory() ? walk(new URL(`${e.name}/`, dir)) : /\.(ts|tsx)$/.test(e.name) && !/\.test\./.test(e.name) ? [new URL(e.name, dir).pathname] : []);
    for (const f of walk(new URL('../', import.meta.url))) {
      const text = readFileSync(f, 'utf8');
      expect(text, f).not.toMatch(/\/feature\/(appointments|tasks)['"`]/);
      expect(text, f).not.toMatch(/id:\s*['"](appointments|tasks)['"]\s*\}\s*\}/);
    }
  });
  it('My day rows for calendar and appointments open the Calendar', () => {
    for (const k of ['calendar', 'appointments']) expect((TEMPLATES as readonly { key: string; link?: string }[]).find((t) => t.key === k)?.link).toBe('/feature/calendar');
  });
});

describe('first-login wizard', () => {
  it('lets the calendar step through the two-step offer redirect (it comes right after My people)', () => {
    const layout = src('../app/_layout.tsx');
    const line = layout.split('\n').find((l) => l.includes('/offer-two-step" />')) ?? '';
    expect(line).toContain("'/feature/calendar-app'");
    expect(line).toContain("'/feature/my-people'");
  });
});

describe('My conditions shows only what the person chose', () => {
  const screen = src('../app/feature/conditions.tsx');
  it('has no default list of conditions as a fallback', () => {
    expect(screen).not.toMatch(/CONDITIONS\.map\(/);
    expect(screen).toContain('picked && picked.length ? cardsFor(picked) : []');
  });
  it('says plainly when nothing is chosen or the list cannot be read', () => {
    expect(screen).toContain("t('cond.nonePicked')");
    expect(screen).toContain("t('cond.errLoad')");
  });
});
