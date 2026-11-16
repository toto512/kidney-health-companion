import { describe, expect, it } from 'vitest';
import { allBrands, groupMeds, linkFor, MED_GROUPS, MED_LIST, medById, medLabel, searchMeds } from './medList';

describe('medicine list', () => {
  it('has 50 medicines in 7 groups with unique ids and generic names', () => {
    expect(MED_LIST).toHaveLength(50);
    expect(MED_GROUPS).toHaveLength(7);
    expect(new Set(MED_LIST.map((x) => x.med_id)).size).toBe(50);
    expect(new Set(MED_LIST.map((x) => x.generic.toLowerCase())).size).toBe(50);
    for (const x of MED_LIST) expect(x.med_id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });
  it('gives every medicine a non-empty generic name and a known group', () => {
    for (const x of MED_LIST) {
      expect(x.generic.trim().length, x.med_id).toBeGreaterThan(2);
      expect(MED_GROUPS, x.med_id).toContain(x.group);
      for (const b of allBrands(x)) expect(b.trim().length, x.med_id).toBeGreaterThan(1);
    }
    for (const g of MED_GROUPS) expect(MED_LIST.some((x) => x.group === g), g).toBe(true);
  });
  it('is ready for research output: link fields exist and are empty, links must be https with a check date', () => {
    for (const x of MED_LIST) {
      expect(Array.isArray(x.brands_ca) && Array.isArray(x.brands_us) && Array.isArray(x.official_links), x.med_id).toBe(true);
      for (const l of x.official_links) { expect(l.url.startsWith('https://'), x.med_id).toBe(true); expect(l.checked_on, x.med_id).toMatch(/^\d{4}-\d{2}-\d{2}$/); }
    }
  });
  it('holds names only: no description, dose or advice fields', () => {
    for (const x of MED_LIST) expect(Object.keys(x).sort()).toEqual(['brands', 'brands_ca', 'brands_us', 'generic', 'group', 'med_id', 'official_links']);
  });
  it('labels generic first with brands beside it', () => {
    expect(medLabel(medById('atorvastatin')!)).toBe('Atorvastatin (Lipitor)');
    expect(medLabel(medById('amoxicillin')!)).toBe('Amoxicillin');
  });
  it('searches by generic or brand and sorts A to Z', () => {
    expect(searchMeds('lipitor').map((x) => x.med_id)).toEqual(['atorvastatin']);
    expect(searchMeds('SALBUT').map((x) => x.med_id)).toEqual(['albuterol-salbutamol']);
    expect(searchMeds('zzzz')).toEqual([]);
    const names = searchMeds('').map((x) => x.generic);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    expect(groupMeds(MED_LIST)).toHaveLength(7);
  });

  it('links only by the matching country, on the official host, with a check date', () => {
    const host: Record<string, string> = { US: 'medlineplus.gov', CA: 'health-products.canada.ca', GB: 'www.nhs.uk' };
    for (const x of MED_LIST) for (const l of x.official_links) {
      expect(new URL(l.url).host, x.med_id).toBe(host[l.country]);
      expect(l.url.startsWith('https://'), x.med_id).toBe(true);
    }
    const a = medById('atorvastatin')!;
    expect(linkFor(a, 'US')?.url).toContain('medlineplus.gov');
    expect(linkFor(a, 'CA')?.url).toContain('health-products.canada.ca');
    expect(linkFor(a, 'GB')?.url).toBe('https://www.nhs.uk/medicines/atorvastatin/');
    expect(linkFor(a, null)).toBeUndefined();
    for (const id of ['amphetamine-dextroamphetamine', 'budesonide-formoterol', 'estradiol']) expect(medById(id)!.official_links, id).toEqual([]);
    expect(MED_LIST.every((x) => x.official_links.every((l) => l.checked_on === '2026-11-16'))).toBe(true);
    expect(MED_LIST.every((x) => new Set(x.official_links.map((l) => l.country)).size === x.official_links.length)).toBe(true);
  });
});
