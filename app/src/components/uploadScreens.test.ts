// @ts-ignore node types are not installed in this Expo project; vitest runs on node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Every screen where a file or picture can be read uses the one shared File and Photo block.
describe('shared upload block', () => {
  for (const f of ['add-blood-test', 'blood-pressure', 'choose-medicines', 'medications']) {
    it(`${f} uses UploadButtons`, () => {
      const src = readFileSync(new URL(`../app/feature/${f}.tsx`, import.meta.url), 'utf8');
      expect(src).toContain('<UploadButtons');
      expect(src).not.toMatch(/launchCameraAsync/);
    });
  }
  it('My medications hands the chosen file to the confirm screen, which reads it only after the saved list has loaded', () => {
    const list = readFileSync(new URL('../app/feature/medications.tsx', import.meta.url), 'utf8');
    const pick = readFileSync(new URL('../app/feature/choose-medicines.tsx', import.meta.url), 'utf8');
    expect(list).toContain("pathname: '/feature/choose-medicines'");
    expect(pick).toContain('useLocalSearchParams');
    expect(pick).toMatch(/saved === undefined \|\| started\.current/);
  });
});
