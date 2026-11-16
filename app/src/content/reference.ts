import type { Country } from '@/lib/profile';

// Medicines named, and typical lab ranges, by country. Every quote is copied word for word from the linked official page
// (research file plan/medications-and-lab-ranges.md, live re-check 2026-11-16). Only items verified on the live page are here.
// A country only shows its own sources: no range from another country is ever used as a stand-in.
// Nothing here says what to take, what a result means for a person, or whether a number is good or bad.
export type SourceType = 'government' | 'provincial_government';
export type RefSource = {
  country: Country;
  publisher: string;
  type: SourceType;
  url: string;
  dateText: string | null; // the page's own wording of its review date, null when the page shows none
  nextReviewDue?: string; // ISO, only where the page states one
  checkedOn: string; // ISO date the live page was read
};
export type RefItem = { id: string; kind: 'medicine' | 'lab'; title: string; src: string; quotes: string[]; names?: string[] };
export type RefGap = { id: string; kind: 'lab'; title: string; gap: true };
export type RefEntry = RefItem | RefGap;
export const isGap = (e: RefEntry): e is RefGap => 'gap' in e;

const C = '2026-11-16';
const NHS = 'NHS';
const HLBC = 'HealthLink BC (British Columbia provincial government)';
const ML = 'MedlinePlus (US National Library of Medicine)';

export const SOURCES: Record<string, RefSource> = {
  // United Kingdom
  'uk-ckd-treat': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/kidney-disease/treatment/', dateText: 'Page last reviewed: 22 March 2023', nextReviewDue: '2026-03-22', checkedOn: C },
  'uk-ckd-diag': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/kidney-disease/diagnosis/', dateText: 'Page last reviewed: 22 March 2023', nextReviewDue: '2026-03-22', checkedOn: C },
  'uk-gout-treat': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/gout/treatment/', dateText: 'Page last reviewed: 24 August 2023', nextReviewDue: '2026-08-24', checkedOn: C },
  'uk-hbp': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/high-blood-pressure-hypertension/', dateText: 'Page last reviewed: 19 July 2024', nextReviewDue: '2027-07-19', checkedOn: C },
  'uk-chd-treat': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/coronary-heart-disease/treatment/', dateText: 'Page last reviewed: 17 January 2024', nextReviewDue: '2027-01-17', checkedOn: C },
  'uk-chol-treat': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/high-cholesterol/treatment/', dateText: 'Page last reviewed: 13 March 2026', nextReviewDue: '2029-03-13', checkedOn: C },
  'uk-t2d-treat': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/type-2-diabetes/treatment/', dateText: 'Page last reviewed: 10 February 2025', nextReviewDue: '2028-02-10', checkedOn: C },
  // United States
  'us-niddk-ckd-manage': { country: 'US', publisher: 'NIDDK (US National Institutes of Health)', type: 'government', url: 'https://www.niddk.nih.gov/health-information/kidney-disease/chronic-kidney-disease-ckd/managing', dateText: 'Last Reviewed October 2016', checkedOn: C },
  'us-niddk-ckd-tests': { country: 'US', publisher: 'NIDDK (US National Institutes of Health)', type: 'government', url: 'https://www.niddk.nih.gov/health-information/kidney-disease/chronic-kidney-disease-ckd/tests-diagnosis', dateText: 'Last Reviewed October 2016', checkedOn: C },
  'us-ml-creatinine': { country: 'US', publisher: ML, type: 'government', url: 'https://medlineplus.gov/ency/article/003475.htm', dateText: 'Review Date 7/13/2025', checkedOn: C },
  'us-ml-potassium': { country: 'US', publisher: ML, type: 'government', url: 'https://medlineplus.gov/ency/article/003484.htm', dateText: 'Review Date 5/19/2025', checkedOn: C },
  'us-niams-gout': { country: 'US', publisher: 'NIAMS (US National Institutes of Health)', type: 'government', url: 'https://www.niams.nih.gov/health-topics/gout/diagnosis-treatment-and-steps-to-take', dateText: null, checkedOn: C },
  'us-ml-uric': { country: 'US', publisher: ML, type: 'government', url: 'https://medlineplus.gov/ency/article/003476.htm', dateText: 'Review Date 4/1/2025', checkedOn: C },
  'us-cdc-hbp': { country: 'US', publisher: 'CDC', type: 'government', url: 'https://www.cdc.gov/high-blood-pressure/about/index.html', dateText: 'Reviewed: October 13, 2026', checkedOn: C },
  'us-nhlbi-hbp': { country: 'US', publisher: 'NHLBI (US National Institutes of Health)', type: 'government', url: 'https://www.nhlbi.nih.gov/health/high-blood-pressure/treatment', dateText: 'Last updated on April 30, 2024', checkedOn: C },
  'us-nhlbi-chd': { country: 'US', publisher: 'NHLBI (US National Institutes of Health)', type: 'government', url: 'https://www.nhlbi.nih.gov/health/coronary-heart-disease/treatment', dateText: 'Last updated on December 27, 2024', checkedOn: C },
  'us-ml-chol': { country: 'US', publisher: ML, type: 'government', url: 'https://medlineplus.gov/lab-tests/cholesterol-levels/', dateText: null, checkedOn: C },
  'us-niddk-diab-med': { country: 'US', publisher: 'NIDDK (US National Institutes of Health)', type: 'government', url: 'https://www.niddk.nih.gov/health-information/diabetes/overview/insulin-medicines-treatments', dateText: 'Last Reviewed March 2022', checkedOn: C },
  'us-niddk-a1c': { country: 'US', publisher: 'NIDDK (US National Institutes of Health)', type: 'government', url: 'https://www.niddk.nih.gov/health-information/diagnostic-tests/a1c-test', dateText: 'Last Reviewed April 2018', checkedOn: C },
  // Canada
  'ca-hlbc-ckd': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/chronic-kidney-disease', dateText: 'Current as of: March 1, 2023', checkedOn: C },
  'ca-hlbc-gfr': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/glomerular-filtration-rate-gfr', dateText: 'Current as of: March 1, 2023', checkedOn: C },
  'ca-hlbc-creatinine': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/creatinine-and-creatinine-clearance', dateText: 'Current as of: September 8, 2022', checkedOn: C },
  'ca-hlbc-gout': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/gout', dateText: 'Adaptation Date: 6/14/2023', checkedOn: C },
  'ca-gc-hbp': { country: 'CA', publisher: 'Government of Canada (Canada.ca)', type: 'government', url: 'https://www.canada.ca/en/public-health/services/diseases/heart-health/high-blood-pressure.html', dateText: 'Page details date: 2026-02-12', checkedOn: C },
  'ca-hlbc-cad': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/coronary-artery-disease-0', dateText: 'Current as of: September 7, 2022', checkedOn: C },
  'ca-hlbc-t2d': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/type-2-diabetes', dateText: 'Adaptation Date: 6/14/2023', checkedOn: C },
  'ca-gc-diabetes': { country: 'CA', publisher: 'Government of Canada (Canada.ca)', type: 'government', url: 'https://www.canada.ca/en/public-health/services/diseases/diabetes/symptoms-treatment.html', dateText: 'Page details date: 2026-11-10', checkedOn: C },
  'ca-hlbc-sugar': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/diabetes-blood-sugar-levels', dateText: 'Current as of: March 1, 2023', checkedOn: C },
};

const med = (id: string, title: string, src: string, quotes: string[], names?: string[]): RefItem => ({ id, kind: 'medicine', title, src, quotes, names });
const lab = (id: string, title: string, src: string, quotes: string[]): RefItem => ({ id, kind: 'lab', title, src, quotes });
const gap = (id: string, title: string): RefGap => ({ id, kind: 'lab', title, gap: true });

export type CondId = 'ckd' | 'gout' | 'hbp' | 'diabetes' | 'heart';
export const REFERENCE: Record<Country, Record<CondId, RefEntry[]>> = {
  GB: {
    ckd: [
      med('gb-ckd-ace', 'ACE inhibitors', 'uk-ckd-treat', ['medicines called angiotensin converting enzyme (ACE) inhibitors are often used.', 'Examples include ramipril, enalapril and lisinopril.']),
      med('gb-ckd-arb', 'ARBs', 'uk-ckd-treat', ['you can be given a medicine called an angiotensin-II receptor blocker (ARB) instead.']),
      med('gb-ckd-sglt2', 'SGLT2 inhibitor', 'uk-ckd-treat', ['An SGLT2 inhibitor called dapagliflozin is used to treat CKD.']),
      med('gb-ckd-statin', 'Statins', 'uk-ckd-treat', ['Examples include atorvastatin and simvastatin.']),
      med('gb-ckd-diuretic', 'Diuretics', 'uk-ckd-treat', ['such as furosemide.']),
      med('gb-ckd-phosphate', 'Phosphate binders', 'uk-ckd-treat', ['Commonly used medicines include calcium acetate and calcium carbonate.']),
      med('gb-ckd-vitd', 'Vitamin D', 'uk-ckd-treat', ['colecalciferol or ergocalciferol']),
      med('gb-ckd-potassium', 'High potassium', 'uk-ckd-treat', ['A medicine called sodium zirconium cyclosilicate can be used to treat hyperkalaemia in adults']),
      lab('gb-ckd-egfr', 'eGFR', 'uk-ckd-diag', ['Healthy kidneys should be able to filter more than 90ml/min.']),
      lab('gb-ckd-egfr-stages', 'eGFR stages G3a, G3b, G4, G5', 'uk-ckd-diag', ['an eGFR of 45 to 59ml/min', '30 to 44ml/min', '15 to 29ml/min', 'below 15ml/min']),
      lab('gb-ckd-acr', 'ACR (urine albumin to creatinine ratio) A1, A2, A3', 'uk-ckd-diag', ['less than 3mg/mmol', '3 to 30mg/mmol', 'more than 30mg/mmol']),
      lab('gb-ckd-creatinine', 'Creatinine (no numbers on this page)', 'uk-ckd-diag', ['The test measures the levels of a waste product called creatinine in your blood.']),
      gap('gb-ckd-potassium-lab', 'Potassium'),
    ],
    gout: [
      med('gb-gout-nsaid', 'NSAIDs', 'uk-gout-treat', ['Attacks of gout are usually treated with a non-steroidal anti-inflammatory (NSAID), like ibuprofen.']),
      med('gb-gout-steroid', 'Steroids', 'uk-gout-treat', ['you may be given steroids as tablets or an injection.']),
      med('gb-gout-ual', 'Uric acid lowering medicine (no drug named on this page)', 'uk-gout-treat', ['you may need to take uric acid-lowering medicine.']),
      med('gb-gout-risk', 'Medicines that can raise gout risk', 'uk-gout-treat', ['take medicines such as diuretics (water tablets), or medicines for high blood pressure (such as ACE inhibitors)']),
      gap('gb-gout-uric', 'Uric acid'),
    ],
    hbp: [
      lab('gb-hbp-clinic', 'Blood pressure reading taken by a professional', 'uk-hbp', ['140/90 or higher']),
      lab('gb-hbp-home', 'Blood pressure reading taken at home', 'uk-hbp', ['135/85 or higher']),
    ],
    heart: [
      med('gb-chd-blood-thinners', 'Blood thinners', 'uk-chd-treat', ['Common blood-thinning medicines include:'], ['low-dose aspirin', 'clopidogrel', 'rivaroxaban', 'ticagrelor', 'prasugrel']),
      med('gb-chd-statins', 'Statins', 'uk-chd-treat', ['Most people start with atorvastatin but other statins include:'], ['simvastatin', 'rosuvastatin', 'pravastatin', 'fluvastatin']),
      med('gb-chd-bb', 'Beta blockers', 'uk-chd-treat', ['Beta blockers, including atenolol, bisoprolol, metoprolol and nebivolol, are often used to treat angina']),
      med('gb-chd-nitrates', 'Nitrates', 'uk-chd-treat', ["Nitrates are used to widen your blood vessels."]),
      med('gb-chd-ace', 'ACE inhibitors', 'uk-chd-treat', ['Examples include ramipril and lisinopril.']),
      med('gb-chd-arb', 'ARBs', 'uk-chd-treat', ["They're often prescribed as an alternative to ACE inhibitors, as they do not cause a dry cough."]),
      med('gb-chd-ccb', 'Calcium channel blockers', 'uk-chd-treat', ['Examples include amlodipine, verapamil and diltiazem.']),
      med('gb-chd-diuretics', 'Diuretics', 'uk-chd-treat', ['Sometimes known as water pills']),
      med('gb-chol-statins', 'High cholesterol medicines', 'uk-chol-treat', ['Statins are the most common medicine for high cholesterol.']),
      gap('gb-chol-range', 'Cholesterol typical range'),
    ],
    diabetes: [
      med('gb-t2d-metformin', 'Metformin', 'uk-t2d-treat', ['metformin – lowers your blood sugar levels by improving the way your body handles insulin']),
      med('gb-t2d-sglt2', 'SGLT2 inhibitor', 'uk-t2d-treat', ['a type of medicine called an SGLT2 inhibitor – these help lower your blood sugar levels']),
      med('gb-t2d-glp1', 'GLP1 agonist', 'uk-t2d-treat', ['you may also be offered a type of medicine called a GLP1-agonist.']),
      med('gb-t2d-insulin', 'Insulin', 'uk-t2d-treat', ['you may need to take insulin.']),
      lab('gb-t2d-hba1c', 'HbA1c test (how often, no numbers on this page)', 'uk-t2d-treat', ['checking your average blood glucose levels (an HbA1c test) every 3 to 6 months']),
      gap('gb-t2d-hba1c-range', 'HbA1c target'),
    ],
  },
  US: {
    ckd: [
      med('us-ckd-ace-arb', 'ACE inhibitors and ARBs', 'us-niddk-ckd-manage', ['Two types of blood pressure medicines, ACE inhibitors and ARBs, may slow kidney disease and delay kidney failure']),
      med('us-ckd-many', 'Medicines many people with CKD take', 'us-niddk-ckd-manage', ['Many people with CKD take medicines prescribed to lower blood pressure, control blood glucose, and lower cholesterol.']),
      med('us-ckd-diuretic', 'Diuretics', 'us-niddk-ckd-manage', ['You may also need to take a diuretic, sometimes called a water pill.']),
      med('us-ckd-nsaid', 'Medicines this page cautions about', 'us-niddk-ckd-manage', ['Ibuprofen and naproxen are NSAIDs.']),
      lab('us-ckd-gfr', 'GFR', 'us-niddk-ckd-tests', ['a GFR of 60 or more is in the normal range.', 'a GFR of less than 60 may mean you have kidney disease.', 'a GFR of 15 or less is called kidney failure.']),
      lab('us-ckd-albumin', 'Urine albumin', 'us-niddk-ckd-tests', ['30 mg/g or less is normal', 'more than 30 mg/g may be a sign of kidney disease']),
      lab('us-ckd-creatinine', 'Creatinine', 'us-ml-creatinine', ['A normal result is 0.7 to 1.3 mg/dL (62 to 115 µmol/L) for men and 0.5 to 0.95 mg/dL (44 to 84 µmol/L) for women.', 'Normal value ranges may vary slightly among different laboratories.']),
      lab('us-ckd-potassium', 'Potassium', 'us-ml-potassium', ['The normal range is 3.7 to 5.2 milliequivalents per liter (mEq/L) 3.70 to 5.20 millimoles per liter (millimol/L).', 'Normal value ranges may vary slightly among different laboratories.']),
    ],
    gout: [
      med('us-gout-anti-inflam', 'Anti-inflammatory medicines', 'us-niams-gout', ['Over-the-counter or prescription anti-inflammatory medications, which can reduce pain and swelling.']),
      med('us-gout-colchicine', 'Colchicine', 'us-niams-gout', ['Colchicine, which helps to relieve gout pain.']),
      med('us-gout-cortico', 'Corticosteroids', 'us-niams-gout', ['Corticosteroids, which can help decrease inflammation']),
      med('us-gout-urate', 'Medicines that lower urate', 'us-niams-gout', ['There are medications available to lower urate levels, including:', 'Xanthine oxidase inhibitors, which help prevent the production of urate.', 'Uricosuric agents, which help the kidneys flush more urate out of the body.', 'Uricase, which breaks down urate into a form that is easily removed from the body.']),
      lab('us-gout-uric', 'Uric acid', 'us-ml-uric', ['Normal values are 3.0 to 7.1 milligrams per deciliter (mg/dL) for women and 4.0 to 8.6 mg/dL for men.', 'Normal value ranges may vary slightly among different laboratories.']),
    ],
    hbp: [
      lab('us-hbp-readings', 'Blood pressure readings', 'us-cdc-hbp', ['Normal blood pressure is less than 120/80 mm Hg.', 'High blood pressure is consistently at or above 130/80 mm Hg.']),
      med('us-hbp-classes', 'Blood pressure medicine types', 'us-nhlbi-hbp', ['Calcium channel blockers prevent calcium from entering the muscle cells of your heart and blood vessels.', 'Diuretics remove extra water and sodium (salt) from your body', 'The main diuretic for high blood pressure treatment is thiazide.']),
    ],
    heart: [
      med('us-chd-statins', 'Statins', 'us-nhlbi-chd', ['such as atorvastatin and rosuvastatin, can help control high blood cholesterol and slow plaque buildup']),
      med('us-chd-bp', 'ACE inhibitors, beta blockers and ARBs', 'us-nhlbi-chd', ['ACE inhibitors, beta blockers, and angiotensin-receptor blockers help lower blood pressure']),
      med('us-chd-nitrates', 'Nitrates', 'us-nhlbi-chd', ['Nitrates, such as nitroglycerin, dilate your coronary arteries and relieve or prevent angina (chest pain).']),
      lab('us-chd-chol-total', 'Total cholesterol, adults 20 and over', 'us-ml-chol', ['Less than 200 mg/dL']),
      lab('us-chd-chol-ldl', 'LDL cholesterol, adults 20 and over', 'us-ml-chol', ['Less than 100 mg/dL']),
      lab('us-chd-chol-nonhdl', 'Non-HDL cholesterol, adults 20 and over', 'us-ml-chol', ['Less than 130 mg/dL']),
      lab('us-chd-chol-hdl-m', 'HDL cholesterol, men', 'us-ml-chol', ['Levels less than 40 mg/dL are considered low']),
      lab('us-chd-chol-hdl-w', 'HDL cholesterol, women', 'us-ml-chol', ['Levels less than 50 mg/dL are considered low']),
    ],
    diabetes: [
      med('us-t2d-metformin', 'Metformin', 'us-niddk-diab-med', ['Most people with type 2 diabetes start with metformin pills.']),
      lab('us-t2d-a1c-1', 'A1C, first group on the page', 'us-niddk-a1c', ['below 5.7 percent']),
      lab('us-t2d-a1c-2', 'A1C, second group on the page', 'us-niddk-a1c', ['5.7 to 6.4 percent']),
      lab('us-t2d-a1c-3', 'A1C, third group on the page', 'us-niddk-a1c', ['6.5 percent or above']),
      lab('us-t2d-a1c-target', 'A1C and blood glucose control', 'us-niddk-a1c', ['by keeping A1C levels below 7 percent.', 'Less strict blood glucose control, or an A1C between 7 and 8 percent']),
    ],
  },
  CA: {
    ckd: [
      med('ca-ckd-bp', 'Blood pressure medicines', 'ca-hlbc-ckd', ['ACE inhibitors, angiotensin II receptor blockers (ARBs), beta-blockers, or calcium channel blockers may be used.']),
      med('ca-ckd-diuretics', 'Diuretics', 'ca-hlbc-ckd', ['Diuretics are used for this.']),
      med('ca-ckd-anemia', 'Anemia treatments', 'ca-hlbc-ckd', ['Erythropoiesis-stimulating (ESA) therapy and iron replacement therapy can be used.']),
      lab('ca-ckd-egfr', 'eGFR', 'ca-hlbc-gfr', ['An eGFR under 60 mL/min/1.73 m² may mean kidney disease.']),
      lab('ca-ckd-creatinine', 'Creatinine (no numbers on this page)', 'ca-hlbc-creatinine', ["Each lab has a different range for what's normal.", 'Your lab report should show the range that your lab uses for each test.']),
      gap('ca-ckd-potassium', 'Potassium'),
    ],
    gout: [
      med('ca-gout-attack', 'Medicines for a gout attack', 'ca-hlbc-gout', ['To stop a gout attack, your doctor will prescribe pills such as colchicine or NSAIDs (such as naproxen).']),
      med('ca-gout-urate', 'Medicines that lower uric acid', 'ca-hlbc-gout', ['Medicines, such as allopurinol, lower uric acid levels in the blood.']),
      gap('ca-gout-uric', 'Uric acid'),
    ],
    hbp: [
      lab('ca-hbp-readings', 'Blood pressure readings', 'ca-gc-hbp', ['140/90 mmHg or lower for most people', '130/80 mmHg or lower if you measure your blood pressure at home', 'Blood pressure levels lower than 120/80 mmHg are considered normal.']),
    ],
    heart: [
      med('ca-cad', 'Medicines named for coronary artery disease', 'ca-hlbc-cad', ['Aspirin and other blood thinners to help prevent blood clots.', 'Examples are ACE inhibitors and beta-blockers.', 'A statin to help lower cholesterol.', 'an angina medicine, such as nitroglycerin.', 'Other cholesterol medicines, such as ezetimibe']),
      gap('ca-chol-range', 'Cholesterol typical range'),
    ],
    diabetes: [
      med('ca-t2d-pills', 'Pills and shots named for type 2 diabetes', 'ca-hlbc-t2d', ['Ones that you take as pills include metformin, canagliflozin, linagliptin, and pioglitazone.', 'Ones that you take as shots include dulaglutide, exenatide, and liraglutide.']),
      med('ca-t2d-gc', 'Treatment overview', 'ca-gc-diabetes', ['Type 2 diabetes can also be treated with a combination of lifestyle changes and medication, such as pills and insulin.']),
      lab('ca-t2d-a1c', 'A1c', 'ca-hlbc-sugar', ['an A1c of 7.0% or less']),
      lab('ca-t2d-before', 'Blood sugar before meals', 'ca-hlbc-sugar', ['4.0 to 7.0 millimoles per litre (mmol/L)']),
      lab('ca-t2d-after', 'Blood sugar 2 hours after meals', 'ca-hlbc-sugar', ['lower than 5.0 to 10.0 mmol/L']),
    ],
  },
};

export const referenceFor = (country: Country, cond: string): RefEntry[] => (REFERENCE[country] as Record<string, RefEntry[]>)[cond] ?? [];
export const overdue = (s: RefSource, today: Date) => !!s.nextReviewDue && new Date(s.nextReviewDue).getTime() < today.getTime();
export const sourceLabel = (s: RefSource) => (s.type === 'provincial_government' ? `${s.publisher}, provincial government, not a national page` : `${s.publisher}, government`);
