import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = ['dashboard', 'foods', 'tracking', 'profile', 'tips'];
// Known axe findings on the current base, tracked so CI is green but any NEW rule on any
// page fails. Remove an entry when its fix lands; the test fails if an entry goes stale.
const KNOWN_AXE = {
  foods: ['color-contrast', 'label-content-name-mismatch'],
  tips: ['label-content-name-mismatch'],
};
const FOOD_API = 'https://food-api.carciente.ca/api/food**';

// Stub the Worker so tests are deterministic and never hit the network.
async function stubFoodApi(page, body = { foods: [] }) {
  await page.route(FOOD_API, (r) => r.fulfill({
    status: 200, contentType: 'application/json',
    headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body),
  }));
}

// Fail on console errors, uncaught exceptions, and CSP violations.
function watchErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  return errors;
}

async function open(page, name) {
  await page.goto('/index.html');
  if (name !== 'dashboard') await page.locator(`.sidebar [data-page="${name}"]`).click();
  await expect(page.locator(`#page-${name}`)).toHaveClass(/active/);
}

for (const name of PAGES) {
  test(`page "${name}" loads with no console, script, or CSP errors`, async ({ page }) => {
    const errors = watchErrors(page);
    await stubFoodApi(page);
    await open(page, name);
    expect(errors).toEqual([]);
  });

  test(`page "${name}" has no axe violations (WCAG 2.x A/AA)`, async ({ page }) => {
    await stubFoodApi(page);
    await open(page, name);
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const known = KNOWN_AXE[name] || [];
    const found = violations.map((v) => v.id);
    expect(found.filter((id) => !known.includes(id)), 'new violations').toEqual([]);
    expect(known.filter((id) => !found.includes(id)), 'fixed: remove from KNOWN_AXE').toEqual([]);
  });
}

test('manifest is valid JSON with required PWA fields and its icon is served', async ({ request }) => {
  const res = await request.get('/manifest.webmanifest');
  expect(res.ok()).toBeTruthy();
  const m = await res.json();
  for (const k of ['name', 'start_url', 'display', 'icons']) expect(m, k).toHaveProperty(k);
  for (const icon of m.icons) expect((await request.get(icon.src.replace(/^\.?\/?/, '/'))).ok(), icon.src).toBeTruthy();
});

// Regression guards: unknown foods must always offer the online lookup and never read as safe.
test.describe('unknown-food lookup', () => {
  async function checkFood(page, q) {
    await open(page, 'foods');
    await page.locator('#foodSearch').fill(q);
    await page.locator('#analyzeBtn').click();
    await expect(page.locator('#foodDetail')).toBeVisible();
  }

  test('an unknown food shows a visible, enabled "Search online food data" button', async ({ page }) => {
    await stubFoodApi(page);
    await checkFood(page, 'zzqx unknown dish');
    const btn = page.locator('#lookupUsdaBtn');
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  });

  test('an unknown food is "Needs review", never a green verdict', async ({ page }) => {
    await stubFoodApi(page);
    await checkFood(page, 'zzqx unknown dish');
    await expect(page.locator('#foodDetail')).toContainText(/needs review|information needed/i);
    await expect(page.locator('#foodDetail .pill.green')).toHaveCount(0);
  });

  test('lookup renders Worker results with the source, and "use this reference" fills the form', async ({ page }) => {
    await stubFoodApi(page, { foods: [{
      description: 'Dragon fruit, raw', dataType: 'Foundation', source: 'fdc',
      per100g: { sodium_mg: 1, potassium_mg: 180, phosphorus_mg: 22, protein_g: 1.1 },
    }] });
    await checkFood(page, 'zzqx unknown dish');
    await expect(page.locator('#usdaResults .usda-result')).toHaveCount(1);
    await expect(page.locator('#usdaResults')).toContainText('USDA FoodData Central');
    await page.locator('[data-usda-index="0"]').click();
    await expect(page.locator('#labelPotassium')).toHaveValue('180');
  });

  test('a lookup with no matches says unknown does not mean safe', async ({ page }) => {
    await stubFoodApi(page, { foods: [] });
    await checkFood(page, 'zzqx unknown dish');
    await expect(page.locator('#usdaResults')).toContainText(/unknown does not mean safe/i);
  });
});
