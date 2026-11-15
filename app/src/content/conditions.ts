import type { Country } from '@/lib/profile';

// Every text here is a verbatim quote from the linked official page. Nothing is paraphrased or added by us.
// `sourceType` is 'charity' only where no government page with a definition was found (decision 2026-11-15).
export type ConditionFact = {
  quote: string;
  source: string;
  url: string;
  sourceType: 'government' | 'charity';
  pageReviewed: string | null; // as the page states it
  nextReviewDue?: string; // ISO date, only where the page states one
  checkedOn: string; // ISO date we read the page
};

export type Condition = { id: string; label: string; facts: Record<Country, ConditionFact> };

const CHECKED = '2026-11-15';

export const CONDITIONS: Condition[] = [
  {
    id: 'ckd', label: 'Chronic kidney disease',
    facts: {
      GB: { quote: 'Chronic kidney disease (CKD) is a long-term condition where the kidneys do not work as well as they should.', source: 'NHS', url: 'https://www.nhs.uk/conditions/kidney-disease/', sourceType: 'government', pageReviewed: '22 March 2023', nextReviewDue: '2026-03-22', checkedOn: CHECKED },
      US: { quote: "CKD is a condition in which the kidneys are damaged and can't filter blood as well as they should.", source: 'CDC', url: 'https://www.cdc.gov/kidney-disease/about/', sourceType: 'government', pageReviewed: 'May 15, 2024', checkedOn: CHECKED },
      CA: { quote: 'Chronic kidney disease (CKD) is the presence of kidney damage, or a decreased level of kidney function, for a period of three months or more.', source: 'Kidney Foundation of Canada (no government page found)', url: 'https://kidney.ca/en/kidney-health/your-kidneys/what-is-kidney-disease', sourceType: 'charity', pageReviewed: null, checkedOn: CHECKED },
    },
  },
  {
    id: 'gout', label: 'Gout',
    facts: {
      GB: { quote: 'Gout is a type of arthritis that causes sudden, severe joint pain.', source: 'NHS', url: 'https://www.nhs.uk/conditions/gout/', sourceType: 'government', pageReviewed: '24 August 2023', nextReviewDue: '2026-08-24', checkedOn: CHECKED },
      US: { quote: 'Gout is a painful type of arthritis that usually affects one joint at a time, often the big toe.', source: 'CDC', url: 'https://www.cdc.gov/arthritis/gout/index.html', sourceType: 'government', pageReviewed: 'January 26, 2024', checkedOn: CHECKED },
      CA: { quote: 'Gout is a form of crystal arthropathies, characterized by the changes in uric acid levels which lead to joint swelling and sometimes, joint damage.', source: 'Public Health Agency of Canada', url: 'https://www.canada.ca/en/public-health/services/publications/diseases-conditions/gout-crystal-arthropathies.html', sourceType: 'government', pageReviewed: 'December 24, 2020 (date modified)', checkedOn: CHECKED },
    },
  },
  {
    id: 'hbp', label: 'High blood pressure',
    facts: {
      GB: { quote: 'High blood pressure (also called hypertension) can lead to serious problems like heart attacks or strokes.', source: 'NHS', url: 'https://www.nhs.uk/conditions/high-blood-pressure/', sourceType: 'government', pageReviewed: '19 July 2024', nextReviewDue: '2027-07-19', checkedOn: CHECKED },
      US: { quote: 'Blood pressure is the force of your blood pushing against the walls of your arteries as your heart pumps. High blood pressure is when that force is consistently too high.', source: 'CDC', url: 'https://www.cdc.gov/high-blood-pressure/about/index.html', sourceType: 'government', pageReviewed: 'October 13, 2026', checkedOn: CHECKED },
      CA: { quote: 'High blood pressure means that the pressure in your blood vessels is too high. This is also called hypertension.', source: 'Public Health Agency of Canada', url: 'https://www.canada.ca/en/public-health/services/diseases/heart-health/high-blood-pressure.html', sourceType: 'government', pageReviewed: 'February 12, 2026 (date modified)', checkedOn: CHECKED },
    },
  },
  {
    id: 'diabetes', label: 'Diabetes',
    facts: {
      GB: { quote: 'Diabetes is a condition that causes your blood glucose (sugar) level to become too high.', source: 'NHS', url: 'https://www.nhs.uk/conditions/diabetes/', sourceType: 'government', pageReviewed: '26 June 2025', nextReviewDue: '2028-06-26', checkedOn: CHECKED },
      US: { quote: 'Diabetes is a chronic (long-lasting) health condition that affects how your body turns food into energy.', source: 'CDC', url: 'https://www.cdc.gov/diabetes/about/index.html', sourceType: 'government', pageReviewed: 'January 2, 2026', checkedOn: CHECKED },
      CA: { quote: "Diabetes is a chronic condition that develops when your body either doesn't produce or effectively use insulin, which it needs to turn sugar into energy.", source: 'Public Health Agency of Canada', url: 'https://www.canada.ca/en/public-health/services/diseases/diabetes.html', sourceType: 'government', pageReviewed: 'November 21, 2025 (date modified)', checkedOn: CHECKED },
    },
  },
  {
    id: 'heart', label: 'Heart disease',
    facts: {
      GB: { quote: "Coronary heart disease is the term that describes what happens when your heart's blood supply is blocked or interrupted by a build-up of fatty substances in the coronary arteries.", source: 'NHS (coronary heart disease page)', url: 'https://www.nhs.uk/conditions/coronary-heart-disease/', sourceType: 'government', pageReviewed: '17 January 2024', checkedOn: CHECKED },
      US: { quote: 'The term "heart disease" refers to several types of heart conditions.', source: 'CDC', url: 'https://www.cdc.gov/heart-disease/about/index.html', sourceType: 'government', pageReviewed: 'October 2, 2023', checkedOn: CHECKED },
      CA: { quote: "Also known as ischemic heart disease or coronary heart disease, heart disease refers to the buildup of plaque in the heart's arteries that could lead to a heart attack, heart failure, or death.", source: 'Public Health Agency of Canada', url: 'https://www.canada.ca/en/public-health/services/publications/diseases-conditions/heart-disease-canada.html', sourceType: 'government', pageReviewed: 'July 28, 2022 (date modified)', checkedOn: CHECKED },
    },
  },
];

export const sourceReviewOverdue = (f: ConditionFact, today: Date) => !!f.nextReviewDue && new Date(f.nextReviewDue).getTime() < today.getTime();

// Symptom and get-help quotes, verbatim, from the same page as the fact above (same source, link and check date).
// Only complete sentences are included. Where a page's text was a partial list or lacked its lead-in, nothing is shown.
export type ConditionExtra = { symptoms?: string; getHelp?: string };
export const EXTRAS: Record<string, ConditionExtra> = {
  'ckd.GB': { getHelp: 'See a GP if you have persistent or worrying symptoms that you think could be caused by kidney disease.' },
  'gout.GB': { symptoms: 'sudden severe pain in a joint \u2013 usually your big toe, but it can be in other joints in your feet, ankles, hands, wrists, elbows or knees' },
  'hbp.GB': { symptoms: 'High blood pressure does not usually cause any symptoms.' },
  'gout.US': { symptoms: 'Symptoms of gout may come and go.' },
  'hbp.US': { symptoms: 'High blood pressure usually has no signs or symptoms, so many people do not know they have it.' },
  'heart.US': { symptoms: 'Sometimes heart disease may be "silent" and not diagnosed until a person experiences signs or symptoms of a heart attack, heart failure, or an arrhythmia.' },
};
