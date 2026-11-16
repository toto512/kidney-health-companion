// The 50 medicines a person can pick, grouped as in the project's medication list (names only).
// Deliberately NOT here until verified from official sources: descriptions, uses, doses, schedules, interactions, advice.
// `brands` are the brand names as written in the source list. A separate research thread will fill `brands_ca`, `brands_us`
// and `official_links` (one verified official page per medicine and country). Until then `official_links` is empty and the
// "Official page" link stays hidden.
export type OfficialLink = { country: 'CA' | 'US' | 'GB'; publisher: string; url: string; quote?: string; page_reviewed?: string; checked_on: string };
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
