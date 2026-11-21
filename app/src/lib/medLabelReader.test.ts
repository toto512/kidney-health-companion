import { describe, expect, it } from 'vitest';
import { matchMed, readMedLabel } from './medLabelReader';

describe('readMedLabel', () => {
  it('reads name and strength from one line', () => {
    expect(readMedLabel('METFORMIN 500 mg tablets\nTake 1 tablet twice daily')).toEqual({ name: 'Metformin', strength: '500 mg' });
  });
  it('uses the line above the strength when the number starts the line', () => {
    expect(readMedLabel('Rx 0000123\nAMLODIPINE\n5 mg tablets')).toEqual({ name: 'Amlodipine', strength: '5 mg' });
  });
  it('reads a labelled name, French and Spanish words, and compound strengths', () => {
    expect(readMedLabel('Médicament : Ramipril 10 mg comprimés').name).toBe('Ramipril');
    expect(readMedLabel('Medicamento: Atorvastatina\n20 mg').name).toBe('Atorvastatina');
    expect(readMedLabel('Amoxicillin 250 mg/5 ml suspension').strength).toBe('250 mg/5 ml');
    expect(readMedLabel('Levothyroxine 0.075 mg').strength).toBe('0.075 mg');
  });
  it('does not take the pharmacy, the patient or the directions as the name', () => {
    const r = readMedLabel('SHOPPERS PHARMACY\nJOHN SMITH\nTake 1 tablet by mouth daily\nRefills: 3\nQty 30');
    expect(r.name).toBeNull();
    expect(r.strength).toBeNull();
  });
  it('does not treat counts, times, dates or phone numbers as a strength', () => {
    expect(readMedLabel('Qty 30 tablets\nTake every 8 hours\n2026-11-10\n514-555-0199').strength).toBeNull();
  });
  it('gives no suggestion for empty or unreadable text, and never invents a name', () => {
    expect(readMedLabel('')).toEqual({ name: null, strength: null });
    expect(readMedLabel('x#@ ~~ 4 | ;;')).toEqual({ name: null, strength: null });
  });
  it('keeps a long or sentence-like line out of the name', () => {
    expect(readMedLabel('This medicine is for the treatment of high blood pressure 5 mg').name).toBeNull();
  });
});

describe('matchMed', () => {
  it('matches the generic name or a listed brand, ignoring case and accents', () => {
    expect(matchMed('metformin')?.med_id).toBe('metformin');
    expect(matchMed('  LIPITOR ')?.med_id).toBe('atorvastatin');
    expect(matchMed('Toprol-XL')?.med_id).toBe('metoprolol');
  });
  it('allows a salt word after the generic name', () => {
    expect(matchMed('Metoprolol Tartrate')?.med_id).toBe('metoprolol');
  });
  it('does not match near spellings, combinations or unknown names', () => {
    expect(matchMed('Metformine')).toBeNull();
    expect(matchMed('Losartan Hydrochlorothiazide')).toBeNull();
    expect(matchMed('Zzyzx')).toBeNull();
    expect(matchMed('')).toBeNull();
  });
});
