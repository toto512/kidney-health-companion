// The 50 medicines a person can pick, grouped as in the project's medication list (names only).
// Deliberately NOT here until verified from official sources: descriptions, uses, doses, schedules, interactions, advice.
// `brands` are the brand names as written in the source list. A separate research thread will fill `brands_ca`, `brands_us`
// and `official_links` (one verified official page per medicine and country). Until then `official_links` is empty and the
// "Official page" link stays hidden.
export type OfficialLink = { country: 'CA' | 'US' | 'GB'; publisher: string; url: string; quote?: string; page_reviewed?: string; page_title?: string; checked_on: string };
export type MedItem = { med_id: string; group: string; generic: string; brands: string[]; brands_ca: string[]; brands_us: string[]; official_links: OfficialLink[] };

export const MED_GROUPS = ["Heart Disease & High Blood Pressure (Cardiovascular)", "Diabetes & Endocrine Disorders", "Mental Health & Neurological Conditions", "Respiratory & Allergy Conditions", "Gastrointestinal (Digestive) Disorders", "Pain, Inflammation & Infections", "Urology & Eye Conditions"] as const;

const m = (group: number, med_id: string, generic: string, brands: string[] = []): MedItem => ({ med_id, group: MED_GROUPS[group], generic, brands, brands_ca: [], brands_us: [], official_links: [] });

export const MED_LIST: MedItem[] = [
  m(0, "atorvastatin", "Atorvastatin", ["Lipitor"]),
  m(0, "amlodipine", "Amlodipine", ["Norvasc"]),
  m(0, "lisinopril", "Lisinopril", ["Zestril"]),
  m(0, "losartan", "Losartan", ["Cozaar"]),
  m(0, "metoprolol", "Metoprolol", ["Lopressor", "Toprol XL"]),
  m(0, "rosuvastatin", "Rosuvastatin", ["Crestor"]),
  m(0, "hydrochlorothiazide", "Hydrochlorothiazide", ["Microzide"]),
  m(0, "apixaban", "Apixaban", ["Eliquis"]),
  m(0, "simvastatin", "Simvastatin", ["Zocor"]),
  m(0, "furosemide", "Furosemide", ["Lasix"]),
  m(0, "carvedilol", "Carvedilol", ["Coreg"]),
  m(0, "clopidogrel", "Clopidogrel", ["Plavix"]),
  m(0, "spironolactone", "Spironolactone", ["Aldactone"]),
  m(0, "ramipril", "Ramipril", ["Altace"]),
  m(1, "levothyroxine", "Levothyroxine", ["Synthroid"]),
  m(1, "metformin", "Metformin", ["Glucophage"]),
  m(1, "semaglutide", "Semaglutide", ["Ozempic", "Wegovy"]),
  m(1, "empagliflozin", "Empagliflozin", ["Jardiance"]),
  m(1, "insulin-glargine", "Insulin Glargine", ["Lantus"]),
  m(1, "dulaglutide", "Dulaglutide", ["Trulicity"]),
  m(1, "glipizide", "Glipizide", ["Glucotrol"]),
  m(1, "estradiol", "Estradiol", ["Estrace"]),
  m(2, "gabapentin", "Gabapentin", ["Neurontin"]),
  m(2, "sertraline", "Sertraline", ["Zoloft"]),
  m(2, "escitalopram", "Escitalopram", ["Lexapro", "Cipralex"]),
  m(2, "amphetamine-dextroamphetamine", "Amphetamine / Dextroamphetamine", ["Adderall"]),
  m(2, "bupropion", "Bupropion", ["Wellbutrin"]),
  m(2, "fluoxetine", "Fluoxetine", ["Prozac"]),
  m(2, "trazodone", "Trazodone", ["Desyrel"]),
  m(2, "duloxetine", "Duloxetine", ["Cymbalta"]),
  m(2, "venlafaxine", "Venlafaxine", ["Effexor"]),
  m(2, "alprazolam", "Alprazolam", ["Xanax"]),
  m(2, "pregabalin", "Pregabalin", ["Lyrica"]),
  m(3, "albuterol-salbutamol", "Albuterol / Salbutamol", ["Ventolin"]),
  m(3, "montelukast", "Montelukast", ["Singulair"]),
  m(3, "fluticasone", "Fluticasone", ["Flonase", "Flovent"]),
  m(3, "cetirizine", "Cetirizine", ["Zyrtec", "Reactine"]),
  m(3, "budesonide-formoterol", "Budesonide / Formoterol", ["Symbicort"]),
  m(4, "omeprazole", "Omeprazole", ["Prilosec"]),
  m(4, "pantoprazole", "Pantoprazole", ["Protonix"]),
  m(4, "ondansetron", "Ondansetron", ["Zofran"]),
  m(4, "famotidine", "Famotidine", ["Pepcid"]),
  m(5, "ibuprofen", "Ibuprofen", ["Advil", "Motrin"]),
  m(5, "acetaminophen-paracetamol", "Acetaminophen / Paracetamol", ["Tylenol"]),
  m(5, "meloxicam", "Meloxicam", ["Mobic"]),
  m(5, "prednisone", "Prednisone"),
  m(5, "cyclobenzaprine", "Cyclobenzaprine", ["Flexeril"]),
  m(5, "amoxicillin", "Amoxicillin"),
  m(5, "azithromycin", "Azithromycin", ["Zithromax"]),
  m(6, "tamsulosin", "Tamsulosin", ["Flomax"]),
];

// Links are added only after the live page was read by scripts/verify-med-links.mjs (title matched the generic name,
// or the brand exists in the Health Canada DPD) on checked_on. Anything that failed or is unchecked stays hidden.
// Source list: plan/medications-official-links.md. `page_title` is set where the page covers only part of the entry.
const CHECKED = '2026-11-16';
const us = (id: string, code: string, reviewed?: string, page_title?: string): [string, OfficialLink] => [id, { country: 'US', publisher: 'MedlinePlus (US National Library of Medicine)', url: `https://medlineplus.gov/druginfo/meds/${code}.html`, ...(reviewed ? { page_reviewed: reviewed } : {}), ...(page_title ? { page_title } : {}), checked_on: CHECKED }];
const gb = (id: string, slug: string, page_title?: string): [string, OfficialLink] => [id, { country: 'GB', publisher: 'NHS', url: `https://www.nhs.uk/medicines/${slug}/`, ...(page_title ? { page_title } : {}), checked_on: CHECKED }];
const ca = (id: string, code: number, brand: string): [string, OfficialLink] => [id, { country: 'CA', publisher: 'Health Canada Drug Product Database', url: `https://health-products.canada.ca/dpd-bdpp/info?lang=eng&code=${code}`, page_title: `Brand record: ${brand}`, checked_on: CHECKED }];
const VERIFIED: [string, OfficialLink][] = [
  us('atorvastatin', 'a600045', '2026-02-15'),
  gb('atorvastatin', 'atorvastatin'),
  ca('atorvastatin', 49973, 'Lipitor'),
  us('amlodipine', 'a692044', '2025-09-15'),
  gb('amlodipine', 'amlodipine'),
  ca('amlodipine', 43612, 'Norvasc'),
  us('lisinopril', 'a692051', '2021-02-15'),
  gb('lisinopril', 'lisinopril'),
  ca('lisinopril', 17126, 'Zestril'),
  us('losartan', 'a695008', '2018-02-15'),
  gb('losartan', 'losartan'),
  ca('losartan', 19167, 'Cozaar'),
  us('metoprolol', 'a682864', '2026-03-15'),
  gb('metoprolol', 'metoprolol'),
  us('rosuvastatin', 'a603033', '2026-02-15'),
  gb('rosuvastatin', 'rosuvastatin'),
  us('hydrochlorothiazide', 'a682571', '2021-02-15'),
  us('apixaban', 'a613032', '2025-10-15'),
  gb('apixaban', 'apixaban'),
  ca('apixaban', 86287, 'Eliquis'),
  us('simvastatin', 'a692030', '2026-02-15'),
  gb('simvastatin', 'simvastatin'),
  ca('simvastatin', 11337, 'Zocor'),
  us('furosemide', 'a682858', '2025-04-15'),
  gb('furosemide', 'furosemide'),
  ca('furosemide', 37369, 'Lasix'),
  us('carvedilol', 'a697042', '2026-03-15'),
  gb('carvedilol', 'carvedilol'),
  us('clopidogrel', 'a601040', '2026-08-15'),
  gb('clopidogrel', 'clopidogrel'),
  ca('clopidogrel', 62114, 'Plavix'),
  us('spironolactone', 'a682627', '2018-02-15'),
  gb('spironolactone', 'spironolactone'),
  us('ramipril', 'a692027', '2026-01-15'),
  gb('ramipril', 'ramipril'),
  ca('ramipril', 43308, 'Altace'),
  us('levothyroxine', 'a682461', undefined),
  gb('levothyroxine', 'levothyroxine'),
  ca('levothyroxine', 19589, 'Synthroid'),
  us('metformin', 'a696005', undefined),
  gb('metformin', 'metformin'),
  ca('metformin', 17104, 'Glucophage'),
  us('semaglutide', 'a618008', undefined, 'Semaglutide Injection'),
  gb('semaglutide', 'semaglutide'),
  ca('semaglutide', 96058, 'Ozempic'),
  us('empagliflozin', 'a614043', undefined),
  gb('empagliflozin', 'empagliflozin'),
  ca('empagliflozin', 92871, 'Jardiance'),
  us('insulin-glargine', 'a600027', undefined, 'Insulin Glargine (rDNA origin) Injection'),
  ca('insulin-glargine', 69790, 'Lantus'),
  us('dulaglutide', 'a614047', undefined, 'Dulaglutide Injection'),
  ca('dulaglutide', 93428, 'Trulicity'),
  us('glipizide', 'a684060', undefined),
  us('gabapentin', 'a694007', undefined),
  gb('gabapentin', 'gabapentin'),
  ca('gabapentin', 15944, 'Neurontin'),
  us('sertraline', 'a697048', undefined),
  gb('sertraline', 'sertraline'),
  ca('sertraline', 13392, 'Zoloft'),
  us('escitalopram', 'a603005', undefined),
  gb('escitalopram', 'escitalopram'),
  us('bupropion', 'a695033', undefined),
  us('fluoxetine', 'a689006', undefined),
  gb('fluoxetine', 'fluoxetine'),
  us('trazodone', 'a681038', undefined),
  gb('trazodone', 'trazodone'),
  us('duloxetine', 'a604030', undefined),
  gb('duloxetine', 'duloxetine'),
  ca('duloxetine', 78681, 'Cymbalta'),
  us('venlafaxine', 'a694020', undefined),
  gb('venlafaxine', 'venlafaxine'),
  us('alprazolam', 'a684001', undefined),
  ca('alprazolam', 4471, 'Xanax'),
  us('pregabalin', 'a605045', undefined),
  gb('pregabalin', 'pregabalin'),
  ca('pregabalin', 75379, 'Lyrica'),
  us('montelukast', 'a600014', undefined),
  gb('montelukast', 'montelukast'),
  ca('montelukast', 61609, 'Singulair'),
  us('fluticasone', 'a695002', undefined, 'Fluticasone Nasal Spray'),
  gb('fluticasone', 'fluticasone-nasal-spray-and-drops', 'Fluticasone nasal spray and drops'),
  us('cetirizine', 'a623043', undefined),
  gb('cetirizine', 'cetirizine'),
  ca('cetirizine', 43369, 'Reactine'),
  us('omeprazole', 'a693050', undefined),
  gb('omeprazole', 'omeprazole'),
  us('pantoprazole', 'a601246', undefined),
  gb('pantoprazole', 'pantoprazole'),
  ca('pantoprazole', 47339, 'Pantoloc'),
  us('ondansetron', 'a601209', undefined),
  ca('ondansetron', 43116, 'Zofran'),
  us('famotidine', 'a687011', undefined),
  us('ibuprofen', 'a682159', undefined),
  gb('ibuprofen', 'ibuprofen-for-adults', 'Ibuprofen for adults'),
  us('meloxicam', 'a601242', undefined),
  us('prednisone', 'a601102', undefined),
  us('cyclobenzaprine', 'a682514', undefined),
  ca('cyclobenzaprine', 98534, 'Flexeril'),
  us('amoxicillin', 'a685001', undefined),
  gb('amoxicillin', 'amoxicillin'),
  ca('amoxicillin', 14574, 'Amoxil'),
  us('azithromycin', 'a697037', undefined),
  gb('azithromycin', 'azithromycin'),
  ca('azithromycin', 43063, 'Zithromax'),
  us('tamsulosin', 'a698012', undefined),
  gb('tamsulosin', 'tamsulosin'),
  ca('tamsulosin', 61517, 'Flomax'),
];
for (const [id, link] of VERIFIED) MED_LIST.find((x) => x.med_id === id)!.official_links.push(link);

// The link for the person's country only, or undefined (then nothing is shown).
export const linkFor = (x: MedItem, country: string | null | undefined): OfficialLink | undefined => x.official_links.find((l) => l.country === country);

export const medById = (id: string) => MED_LIST.find((x) => x.med_id === id);

// Every brand name we hold for a medicine, once each, in the order: as listed, then Canada, then US.
export const allBrands = (x: MedItem): string[] => [...new Set([...x.brands, ...x.brands_ca, ...x.brands_us])];

// "Atorvastatin (Lipitor)": the generic name first, brands beside it.
export const medLabel = (x: MedItem): string => (allBrands(x).length ? `${x.generic} (${allBrands(x).join(', ')})` : x.generic);

const flat = (s: string) => s.toLowerCase();
// Matches the generic name or any brand; an empty query matches everything. Sorted A to Z by generic name.
export const searchMeds = (q: string): MedItem[] => {
  const t = flat(q.trim());
  const hit = t ? MED_LIST.filter((x) => flat(x.generic).includes(t) || allBrands(x).some((b) => flat(b).includes(t))) : MED_LIST;
  return [...hit].sort((a, b) => a.generic.localeCompare(b.generic));
};

export const groupMeds = (list: MedItem[]) => MED_GROUPS.map((g) => ({ group: g, items: list.filter((x) => x.group === g) })).filter((g) => g.items.length > 0);
