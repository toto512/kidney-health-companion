import type { Country } from '@/lib/profile';

// The five tiles on each condition: food to avoid, food in moderation, recommended activities, home remedies, medicines.
// Rules (James, 2026-11-18): an item exists only if an official page for that condition, in that country, says it. Every quote below is copied
// word for word from the linked page (read 2026-11-18, each at most 120 characters, complete lines only). Nothing here is advice, a dose, a target
// or a good/bad label. An empty tile says so; we never fill it with something from another country or from our own knowledge.
// `avoid` items are the ones whose own wording says "avoid"; `moderate` items use the page's limit / less / too much wording.
// `title` only names what the quote names (the test checks every word of it is in the quote). `medIds` link to the app's medicine list.
// scripts/verify-condition-tiles.mjs re-checks every quote against its live page.
export type TileKey = 'avoid' | 'moderate' | 'activity' | 'home' | 'meds';
export const TILE_KEYS: TileKey[] = ['avoid', 'moderate', 'activity', 'home', 'meds'];
// A group of foods one official page names. `quote` is word for word from the page. With `list` false every food is inside the quote;
// with `list` true the quote introduces a list on the page and `foods` are its entries, copied word for word.
export type FoodGroup = { quote: string; foods: string[]; list?: boolean; src: string };
export type TileItem = { id: string; title: string; quotes: string[]; src: string; medIds?: string[]; foodGroups?: FoodGroup[] };
export type TileSource = { country: Country; publisher: string; type: 'government' | 'provincial_government'; url: string; dateText: string | null; nextReviewDue?: string; checkedOn: string };

const C = '2026-11-18';
const NHS = 'NHS';
const HLBC = 'HealthLink BC (British Columbia provincial government)';
const NIDDK = 'NIDDK (US National Institutes of Health)';

export const TILE_SOURCES: Record<string, TileSource> = {
  'us-niddk-ckd-manage': { country: 'US', publisher: NIDDK, type: 'government', url: 'https://www.niddk.nih.gov/health-information/kidney-disease/chronic-kidney-disease-ckd/managing', dateText: 'Last Reviewed October 2016', checkedOn: C },
  'us-niddk-ckd-eat': { country: 'US', publisher: NIDDK, type: 'government', url: 'https://www.niddk.nih.gov/health-information/kidney-disease/chronic-kidney-disease-ckd/healthy-eating-adults-chronic-kidney-disease', dateText: 'Last Reviewed January 2025', checkedOn: C },
  'uk-ckd-treat': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/kidney-disease/treatment/', dateText: 'Page last reviewed: 22 March 2023', nextReviewDue: '2026-03-22', checkedOn: C },
  'ca-hlbc-ckd': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/chronic-kidney-disease', dateText: 'Current as of: March 1, 2023', checkedOn: C },
  'us-cdc-diabetes-kidney-food': { country: 'US', publisher: 'CDC (US Centers for Disease Control and Prevention)', type: 'government', url: 'https://www.cdc.gov/diabetes/healthy-eating/diabetes-and-kidney-disease-food.html', dateText: 'Last Reviewed May 15, 2024', checkedOn: C },
  'us-niddk-potassium-tips': { country: 'US', publisher: 'NIDDK (US National Institutes of Health), "Potassium Tips for People with Chronic Kidney Disease"', type: 'government', url: 'https://www.niddk.nih.gov/-/media/Files/Health-Information/Health-Professionals/Kidney-Disease/PotassiumTipsforPeopleCKD_EN.pdf', dateText: null, checkedOn: C },
  'us-niddk-phosphorus-tips': { country: 'US', publisher: 'NIDDK (US National Institutes of Health), "Phosphorus Tips for People with Chronic Kidney Disease"', type: 'government', url: 'https://www.niddk.nih.gov/-/media/Files/Health-Information/Health-Professionals/Kidney-Disease/PhosphorusTipsforPeopleCKD_EN.pdf', dateText: null, checkedOn: C },
  'us-niddk-ckd-children-nutrition': { country: 'US', publisher: 'NIDDK (US National Institutes of Health), page for children with kidney disease', type: 'government', url: 'https://www.niddk.nih.gov/health-information/kidney-disease/children/helping-child-adapt-life-chronic-kidney-disease/nutrition-chronic-kidney-disease', dateText: 'Last Reviewed December 2019', checkedOn: C },
  'ca-hlbc-ckd-diet': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/kidney-disease-changing-your-diet', dateText: 'Current as of: March 1, 2023', checkedOn: C },
  'us-niddk-managing-diabetes': { country: 'US', publisher: NIDDK, type: 'government', url: 'https://www.niddk.nih.gov/health-information/diabetes/overview/managing-diabetes', dateText: 'Last Reviewed October 2023', checkedOn: C },
  'uk-diabetes': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/diabetes/', dateText: 'Page last reviewed: 26 June 2025', nextReviewDue: '2028-06-26', checkedOn: C },
  'ca-hlbc-t2d': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/type-2-diabetes', dateText: 'Adaptation Date: 6/14/2023', checkedOn: C },
  'us-nhlbi-chd': { country: 'US', publisher: 'NHLBI (US National Institutes of Health)', type: 'government', url: 'https://www.nhlbi.nih.gov/health/coronary-heart-disease/treatment', dateText: 'Last updated on December 27, 2024', checkedOn: C },
  'uk-chd-treat': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/coronary-heart-disease/treatment/', dateText: 'Page last reviewed: 17 January 2024', nextReviewDue: '2027-01-17', checkedOn: C },
  'ca-hlbc-cad': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/coronary-artery-disease-0', dateText: 'Current as of: September 7, 2022', checkedOn: C },
  'us-nhlbi-hf': { country: 'US', publisher: 'NHLBI (US National Institutes of Health)', type: 'government', url: 'https://www.nhlbi.nih.gov/health/heart-failure/treatment', dateText: 'Last updated on March 24, 2022', checkedOn: C },
  'uk-hf-treat': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/heart-failure/', dateText: 'Page last reviewed: 26 June 2026', nextReviewDue: '2029-06-26', checkedOn: C },
  'ca-hlbc-hf': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/heart-failure', dateText: 'Adaptation Date: 9/19/2023', checkedOn: C },
  'us-nhlbi-chol': { country: 'US', publisher: 'NHLBI (US National Institutes of Health)', type: 'government', url: 'https://www.nhlbi.nih.gov/health/blood-cholesterol/treatment', dateText: 'Last updated on April 19, 2024', checkedOn: C },
  'uk-chol-lower': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/high-cholesterol/how-to-lower-your-cholesterol/', dateText: 'Page last reviewed: 13 March 2026', nextReviewDue: '2029-03-13', checkedOn: C },
  'ca-hlbc-chol': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/high-cholesterol', dateText: 'Adaptation Date: 9/26/2023', checkedOn: C },
  'us-nhlbi-stroke': { country: 'US', publisher: 'NHLBI (US National Institutes of Health)', type: 'government', url: 'https://www.nhlbi.nih.gov/health/stroke/recovery', dateText: 'Last updated on May 26, 2023', checkedOn: C },
  'uk-stroke-recovery': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/stroke/recovery/', dateText: 'Page last reviewed: 12 September 2024', nextReviewDue: '2027-09-12', checkedOn: C },
  'ca-hlbc-stroke': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/stroke', dateText: 'Current as of: December 19, 2022', checkedOn: C },
  'us-niddk-obesity': { country: 'US', publisher: NIDDK, type: 'government', url: 'https://www.niddk.nih.gov/health-information/weight-management/adult-overweight-obesity/treatment', dateText: 'Last Reviewed May 2023', checkedOn: C },
  'ca-hlbc-obesity': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/obesity', dateText: 'Current as of: August 25, 2022', checkedOn: C },
  'us-niddk-nafld-eat': { country: 'US', publisher: NIDDK, type: 'government', url: 'https://www.niddk.nih.gov/health-information/liver-disease/nafld-nash/eating-diet-nutrition', dateText: 'Last Reviewed April 2021', checkedOn: C },
  'uk-nafld': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/non-alcoholic-fatty-liver-disease/', dateText: 'Page last reviewed: 31 July 2025', nextReviewDue: '2028-07-31', checkedOn: C },
  'ca-hlbc-nafld': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/non-alcoholic-fatty-liver-disease-nafld', dateText: 'Current as of: March 22, 2023', checkedOn: C },
  'us-nhlbi-pad': { country: 'US', publisher: 'NHLBI (US National Institutes of Health)', type: 'government', url: 'https://www.nhlbi.nih.gov/health/peripheral-artery-disease/treatment', dateText: 'Last updated on March 24, 2022', checkedOn: C },
  'uk-pad-treat': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/peripheral-arterial-disease-pad/', dateText: 'Page last reviewed: 29 October 2026', nextReviewDue: '2029-10-29', checkedOn: C },
  'ca-hlbc-pad': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/peripheral-arterial-disease', dateText: 'Current as of: September 7, 2022', checkedOn: C },
  'us-nhlbi-af': { country: 'US', publisher: 'NHLBI (US National Institutes of Health)', type: 'government', url: 'https://www.nhlbi.nih.gov/health/atrial-fibrillation/treatment', dateText: 'Last updated on November 30, 2022', checkedOn: C },
  'uk-af-treat': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/atrial-fibrillation/', dateText: 'Page last reviewed: 13 January 2025', nextReviewDue: '2028-01-13', checkedOn: C },
  'ca-hlbc-af': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/atrial-fibrillation', dateText: 'Adaptation Date: 9/19/2023', checkedOn: C },
  'us-niddk-adpkd': { country: 'US', publisher: NIDDK, type: 'government', url: 'https://www.niddk.nih.gov/health-information/kidney-disease/polycystic-kidney-disease/autosomal-dominant-pkd', dateText: 'Last Reviewed January 2017', checkedOn: C },
  'uk-adpkd-treat': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/autosomal-dominant-polycystic-kidney-disease-adpkd/treatment/', dateText: 'Page last reviewed: 23 February 2023', nextReviewDue: '2026-02-23', checkedOn: C },
  'us-nhlbi-copd': { country: 'US', publisher: 'NHLBI (US National Institutes of Health)', type: 'government', url: 'https://www.nhlbi.nih.gov/health/copd/treatment', dateText: 'Last updated on October 6, 2024', checkedOn: C },
  'uk-copd-treat': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/chronic-obstructive-pulmonary-disease-copd/', dateText: 'Page last reviewed: 2 November 2026', nextReviewDue: '2029-11-02', checkedOn: C },
  'ca-hlbc-copd': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/copd-chronic-obstructive-pulmonary-disease', dateText: 'Current as of: November 14, 2022', checkedOn: C },
  'us-nhlbi-asthma': { country: 'US', publisher: 'NHLBI (US National Institutes of Health)', type: 'government', url: 'https://www.nhlbi.nih.gov/health/asthma/treatment-action-plan', dateText: 'Last updated on April 17, 2024', checkedOn: C },
  'uk-asthma': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/asthma/', dateText: 'Page last reviewed: 07 April 2025', nextReviewDue: '2028-04-07', checkedOn: C },
  'ca-hlbc-asthma': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/asthma-teenagers-and-adults', dateText: 'Adaptation Date: 9/13/2023', checkedOn: C },
  'us-nhlbi-sleepapnea': { country: 'US', publisher: 'NHLBI (US National Institutes of Health)', type: 'government', url: 'https://www.nhlbi.nih.gov/health/sleep-apnea/treatment', dateText: 'Last updated on January 9, 2025', checkedOn: C },
  'ca-hlbc-sleepapnea': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/sleep-apnea', dateText: 'Current as of: November 7, 2022', checkedOn: C },
  'us-niams-oa': { country: 'US', publisher: 'NIAMS (US National Institutes of Health)', type: 'government', url: 'https://www.niams.nih.gov/health-topics/osteoarthritis/diagnosis-treatment-and-steps-to-take', dateText: 'Last Reviewed September 2023', checkedOn: C },
  'uk-oa-treat': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/osteoarthritis/treatment/', dateText: 'Page last reviewed: 20 March 2023', nextReviewDue: '2026-03-20', checkedOn: C },
  'ca-hlbc-oa': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/osteoarthritis', dateText: 'Current as of: November 9, 2022', checkedOn: C },
  'us-nimh-depression': { country: 'US', publisher: 'NIMH (US National Institutes of Health)', type: 'government', url: 'https://www.nimh.nih.gov/health/publications/depression', dateText: 'Revised 2024', checkedOn: C },
  'uk-depression-treat': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/mental-health/conditions/depression-in-adults/treatment/', dateText: 'Page last reviewed: 5 July 2023', nextReviewDue: '2026-07-05', checkedOn: C },
  'us-niams-osteo': { country: 'US', publisher: 'NIAMS (US National Institutes of Health)', type: 'government', url: 'https://www.niams.nih.gov/health-topics/osteoporosis/diagnosis-treatment-and-steps-to-take', dateText: 'Last Reviewed December 2022', checkedOn: C },
  'uk-osteo-treat': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/osteoporosis/', dateText: 'Page last reviewed: 29 October 2026', nextReviewDue: '2029-10-29', checkedOn: C },
  'ca-hlbc-osteo': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/osteoporosis', dateText: 'Adaptation Date: 6/14/2023', checkedOn: C },
  'uk-gad-selfhelp': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/mental-health/conditions/generalised-anxiety-disorder-gad/', dateText: 'Page last reviewed: 22 October 2024', nextReviewDue: '2027-10-22', checkedOn: C },
  'ca-hlbc-anxiety': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/anxiety-disorders', dateText: 'Current as of: October 20, 2022', checkedOn: C },
  'ca-hlbc-alz': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/alzheimers-disease', dateText: 'Current as of: October 20, 2022', checkedOn: C },
  'us-niddk-gerd-eat': { country: 'US', publisher: NIDDK, type: 'government', url: 'https://www.niddk.nih.gov/health-information/digestive-diseases/acid-reflux-ger-gerd-adults/eating-diet-nutrition', dateText: 'Last Reviewed July 2020', checkedOn: C },
  'us-niddk-gerd-treat': { country: 'US', publisher: NIDDK, type: 'government', url: 'https://www.niddk.nih.gov/health-information/digestive-diseases/acid-reflux-ger-gerd-adults/treatment', dateText: 'Last Reviewed July 2020', checkedOn: C },
  'uk-reflux': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/heartburn-and-acid-reflux/', dateText: 'Page last reviewed: 20 November 2023', nextReviewDue: '2026-11-20', checkedOn: C },
  'ca-hlbc-gerd-habits': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/gerd-controlling-heartburn-changing-your-habits', dateText: 'Current as of: March 22, 2023', checkedOn: C },
  'ca-hlbc-gerd': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/gastroesophageal-reflux-disease-gerd-0', dateText: 'Current as of: March 22, 2023', checkedOn: C },
  'us-niams-ra': { country: 'US', publisher: 'NIAMS (US National Institutes of Health)', type: 'government', url: 'https://www.niams.nih.gov/health-topics/rheumatoid-arthritis/diagnosis-treatment-and-steps-to-take', dateText: 'Last Reviewed November 2022', checkedOn: C },
  'uk-ra-treat': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/rheumatoid-arthritis/treatment/', dateText: 'Page last reviewed: 08 March 2023', nextReviewDue: '2026-03-08', checkedOn: C },
  'ca-hlbc-ra': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/rheumatoid-arthritis', dateText: 'Current as of: September 8, 2022', checkedOn: C },
  'us-niddk-ibs-eat': { country: 'US', publisher: NIDDK, type: 'government', url: 'https://www.niddk.nih.gov/health-information/digestive-diseases/irritable-bowel-syndrome/eating-diet-nutrition', dateText: 'Last Reviewed November 2017', checkedOn: C },
  'us-niddk-ibs-treat': { country: 'US', publisher: NIDDK, type: 'government', url: 'https://www.niddk.nih.gov/health-information/digestive-diseases/irritable-bowel-syndrome/treatment', dateText: 'Last Reviewed November 2017', checkedOn: C },
  'uk-ibs-diet': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/irritable-bowel-syndrome-ibs/diet-lifestyle-and-medicines/', dateText: 'Page last reviewed: 17 March 2025', nextReviewDue: '2028-03-17', checkedOn: C },
  'ca-hlbc-ibs': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/irritable-bowel-syndrome-ibs', dateText: 'Current as of: March 22, 2023', checkedOn: C },
  'us-nhlbi-insomnia': { country: 'US', publisher: 'NHLBI (US National Institutes of Health)', type: 'government', url: 'https://www.nhlbi.nih.gov/health/insomnia/treatment', dateText: 'Last updated on March 24, 2022', checkedOn: C },
  'uk-insomnia': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/insomnia/', dateText: 'Page last reviewed: 19 March 2024', nextReviewDue: '2027-03-19', checkedOn: C },
  'us-niams-back': { country: 'US', publisher: 'NIAMS (US National Institutes of Health)', type: 'government', url: 'https://www.niams.nih.gov/health-topics/back-pain/diagnosis-treatment-and-steps-to-take', dateText: 'Last Reviewed February 2023', checkedOn: C },
  'uk-back-pain': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/back-pain/', dateText: 'Page last reviewed: 05 March 2026', nextReviewDue: '2029-03-05', checkedOn: C },
  'ca-hlbc-back': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/low-back-pain', dateText: 'Current as of: November 9, 2022', checkedOn: C },
  'us-niddk-hypo': { country: 'US', publisher: NIDDK, type: 'government', url: 'https://www.niddk.nih.gov/health-information/endocrine-diseases/hypothyroidism', dateText: 'Last Reviewed March 2021', checkedOn: C },
  'uk-thyroid': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/underactive-thyroid-hypothyroidism/', dateText: 'Page last reviewed: 28 April 2025', nextReviewDue: '2028-04-28', checkedOn: C },
  'ca-hlbc-hypo': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/hypothyroidism', dateText: 'Adaptation Date: 6/14/2023', checkedOn: C },
  'us-ninds-pd': { country: 'US', publisher: 'NINDS (US National Institutes of Health)', type: 'government', url: 'https://www.ninds.nih.gov/health-information/disorders/parkinsons-disease', dateText: 'Last reviewed on July 23, 2026', checkedOn: C },
  'uk-pd-treat': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/parkinsons-disease/treatment/', dateText: 'Page last reviewed: 03 November 2022', nextReviewDue: '2025-11-03', checkedOn: C },
  'ca-hlbc-pd': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/parkinsons-disease', dateText: 'Current as of: August 25, 2022', checkedOn: C },
  'us-niddk-divert-eat': { country: 'US', publisher: NIDDK, type: 'government', url: 'https://www.niddk.nih.gov/health-information/digestive-diseases/diverticulosis-diverticulitis/eating-diet-nutrition', dateText: 'Last Reviewed August 2021', checkedOn: C },
  'us-niddk-divert-treat': { country: 'US', publisher: NIDDK, type: 'government', url: 'https://www.niddk.nih.gov/health-information/digestive-diseases/diverticulosis-diverticulitis/treatment', dateText: 'Last Reviewed August 2021', checkedOn: C },
  'uk-diverticular': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/diverticular-disease-and-diverticulitis/', dateText: 'Page last reviewed: 07 September 2023', nextReviewDue: '2026-09-07', checkedOn: C },
  'ca-hlbc-divert': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/diverticulitis', dateText: 'Current as of: March 22, 2023', checkedOn: C },
  'us-niddk-uti-eat': { country: 'US', publisher: NIDDK, type: 'government', url: 'https://www.niddk.nih.gov/health-information/urologic-diseases/bladder-infection-uti-in-adults/eating-diet-nutrition', dateText: 'Last Reviewed April 2024', checkedOn: C },
  'us-niddk-uti-treat': { country: 'US', publisher: NIDDK, type: 'government', url: 'https://www.niddk.nih.gov/health-information/urologic-diseases/bladder-infection-uti-in-adults/treatment', dateText: 'Last Reviewed April 2024', checkedOn: C },
  'uk-uti': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/urinary-tract-infections-utis/', dateText: 'Page last reviewed: 11 July 2025', nextReviewDue: '2028-07-11', checkedOn: C },
  'ca-hlbc-uti': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/urinary-tract-infection', dateText: 'Current as of: March 1, 2023', checkedOn: C },
  'uk-glaucoma': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/glaucoma/', dateText: 'Page last reviewed: 13 June 2025', nextReviewDue: '2028-06-13', checkedOn: C },
  'uk-cataracts': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/cataracts/', dateText: 'Page last reviewed: 12 March 2025', checkedOn: C },
  'us-cdc-flu-treat': { country: 'US', publisher: 'CDC (US Centers for Disease Control and Prevention)', type: 'government', url: 'https://www.cdc.gov/flu/treatment/index.html', dateText: 'Last Reviewed September 2, 2025', checkedOn: C },
  'uk-flu': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/flu/', dateText: 'Page last reviewed: 03 February 2026', nextReviewDue: '2029-02-03', checkedOn: C },
  'uk-gum': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/gum-disease/', dateText: 'Page last reviewed: 20 April 2026', nextReviewDue: '2029-04-20', checkedOn: C },
  'us-niams-gout': { country: 'US', publisher: 'NIAMS (US National Institutes of Health)', type: 'government', url: 'https://www.niams.nih.gov/health-topics/gout/diagnosis-treatment-and-steps-to-take', dateText: 'Last Reviewed December 2023', checkedOn: C },
  'uk-gout-treat': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/gout/', dateText: 'Page last reviewed: 24 August 2023', nextReviewDue: '2026-08-24', checkedOn: C },
  'ca-hlbc-gout': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/gout', dateText: 'Adaptation Date: 6/14/2023', checkedOn: C },
  'us-nhlbi-hbp': { country: 'US', publisher: 'NHLBI (US National Institutes of Health)', type: 'government', url: 'https://www.nhlbi.nih.gov/health/high-blood-pressure/treatment', dateText: 'Last updated on April 30, 2024', checkedOn: C },
  'uk-hbp': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/high-blood-pressure/', dateText: 'Page last reviewed: 19 July 2024', nextReviewDue: '2027-07-19', checkedOn: C },
  'uk-pneumonia': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/pneumonia/', dateText: 'Page last reviewed: 17 July 2026', nextReviewDue: '2029-07-17', checkedOn: C },
  'uk-cold': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/common-cold/', dateText: 'Page last reviewed: 22 March 2024', nextReviewDue: '2027-03-22', checkedOn: C },
  'uk-hayfever': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/hay-fever/', dateText: 'Page last reviewed: 21 March 2024', nextReviewDue: '2027-03-21', checkedOn: C },
  'uk-migraine': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/migraine/', dateText: 'Page last reviewed: 10 March 2026', nextReviewDue: '2029-03-10', checkedOn: C },
  'uk-dvt': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/deep-vein-thrombosis-dvt/', dateText: 'Page last reviewed: 30 April 2026', nextReviewDue: '2029-04-30', checkedOn: C },
  'us-nhlbi-pneumonia': { country: 'US', publisher: 'NHLBI (US National Institutes of Health)', type: 'government', url: 'https://www.nhlbi.nih.gov/health/pneumonia/treatment', dateText: 'Last updated on March 24, 2022', checkedOn: C },
  'us-cdc-cold': { country: 'US', publisher: 'CDC (US Centers for Disease Control and Prevention)', type: 'government', url: 'https://www.cdc.gov/common-cold/treatment/index.html', dateText: 'Last Reviewed April 24, 2024', checkedOn: C },
  'us-ninds-migraine': { country: 'US', publisher: 'NINDS (US National Institutes of Health)', type: 'government', url: 'https://www.ninds.nih.gov/health-information/disorders/migraine', dateText: 'Last reviewed on August 10, 2026', checkedOn: C },
  'us-nhlbi-vte': { country: 'US', publisher: 'NHLBI (US National Institutes of Health)', type: 'government', url: 'https://www.nhlbi.nih.gov/health/venous-thromboembolism/recovery', dateText: 'Last updated on September 20, 2022', checkedOn: C },
  'ca-hlbc-pneumonia': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/pneumonia-0', dateText: 'Current as of: October 31, 2022', checkedOn: C },
  'ca-hlbc-cold': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/colds', dateText: 'Current as of: October 31, 2022', checkedOn: C },
  'ca-hlbc-dvt': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/deep-vein-thrombosis', dateText: 'Current as of: December 19, 2022', checkedOn: C },
  'us-ninds-epilepsy': { country: 'US', publisher: 'NINDS (US National Institutes of Health)', type: 'government', url: 'https://www.ninds.nih.gov/health-information/disorders/epilepsy-and-seizures', dateText: 'Last reviewed on November 09, 2026', checkedOn: C },
  'uk-epilepsy': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/epilepsy/', dateText: 'Page last reviewed: 06 March 2025', nextReviewDue: '2028-03-06', checkedOn: C },
  'ca-hlbc-epilepsy': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/epilepsy', dateText: 'Current as of: August 25, 2022', checkedOn: C },
  'us-niddk-celiac': { country: 'US', publisher: NIDDK, type: 'government', url: 'https://www.niddk.nih.gov/health-information/digestive-diseases/celiac-disease/eating-diet-nutrition', dateText: 'Last Reviewed October 2020', checkedOn: C },
  'ca-hlbc-celiac': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/celiac-disease', dateText: 'Current as of: March 22, 2023', checkedOn: C },
  'us-niams-psoriasis': { country: 'US', publisher: 'NIAMS (US National Institutes of Health)', type: 'government', url: 'https://www.niams.nih.gov/health-topics/psoriasis/diagnosis-treatment-and-steps-to-take', dateText: 'Last Reviewed October 2023', checkedOn: C },
  'uk-psoriasis': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/psoriasis/', dateText: 'Page last reviewed: 10 March 2026', nextReviewDue: '2029-03-10', checkedOn: C },
  'ca-hlbc-psoriasis': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/psoriasis', dateText: 'Current as of: March 22, 2023', checkedOn: C },
  'us-niams-eczema': { country: 'US', publisher: 'NIAMS (US National Institutes of Health)', type: 'government', url: 'https://www.niams.nih.gov/health-topics/atopic-dermatitis/diagnosis-treatment-and-steps-to-take', dateText: 'Last Reviewed November 2022', checkedOn: C },
  'uk-eczema': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/atopic-eczema/', dateText: 'Page last reviewed: 06 September 2024', nextReviewDue: '2027-09-06', checkedOn: C },
  'us-ninds-ms': { country: 'US', publisher: 'NINDS (US National Institutes of Health)', type: 'government', url: 'https://www.ninds.nih.gov/health-information/disorders/multiple-sclerosis-ms', dateText: 'Last reviewed on December 17, 2025', checkedOn: C },
  'uk-ms': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/multiple-sclerosis/', dateText: 'Page last reviewed: 16 August 2024', nextReviewDue: '2027-08-16', checkedOn: C },
  'ca-hlbc-ms': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/multiple-sclerosis', dateText: 'Current as of: August 25, 2022', checkedOn: C },
  'us-niddk-crohn-eat': { country: 'US', publisher: 'NIDDK (US National Institutes of Health), page on Crohn\'s disease', type: 'government', url: 'https://www.niddk.nih.gov/health-information/digestive-diseases/crohns-disease/eating-diet-nutrition', dateText: 'Last Reviewed July 2024', checkedOn: C },
  'uk-ibd': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/inflammatory-bowel-disease/', dateText: 'Page last reviewed: 11 September 2026', nextReviewDue: '2029-09-11', checkedOn: C },
  'us-niddk-gall-eat': { country: 'US', publisher: NIDDK, type: 'government', url: 'https://www.niddk.nih.gov/health-information/digestive-diseases/gallstones/eating-diet-nutrition', dateText: 'Last Reviewed November 2017', checkedOn: C },
  'uk-gallstones': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/gallstones/', dateText: 'Page last reviewed: 11 August 2025', nextReviewDue: '2028-08-11', checkedOn: C },
  'ca-hlbc-gallstones': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/gallstones', dateText: 'Current as of: March 22, 2023', checkedOn: C },
  'us-niddk-ulcer': { country: 'US', publisher: NIDDK, type: 'government', url: 'https://www.niddk.nih.gov/health-information/digestive-diseases/peptic-ulcers-stomach-ulcers/treatment', dateText: 'Last Reviewed September 2022', checkedOn: C },
  'uk-ulcer': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/stomach-ulcer/', dateText: 'Page last reviewed: 12 August 2025', nextReviewDue: '2028-08-12', checkedOn: C },
  'us-nhlbi-anemia': { country: 'US', publisher: 'NHLBI (US National Institutes of Health)', type: 'government', url: 'https://www.nhlbi.nih.gov/health/anemia/treatment', dateText: 'Last updated on March 24, 2022', checkedOn: C },
  'uk-iron': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/iron-deficiency-anaemia/', dateText: 'Page last reviewed: 26 January 2024', nextReviewDue: '2027-01-26', checkedOn: C },
  'ca-hlbc-iron': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/iron-deficiency-anemia', dateText: 'Current as of: September 8, 2022', checkedOn: C },
  'uk-hyperthyroid': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/overactive-thyroid-hyperthyroidism/', dateText: 'Page last reviewed: 11 April 2023', nextReviewDue: '2026-04-11', checkedOn: C },
  'ca-hlbc-hyperthyroid': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/hyperthyroidism', dateText: 'Current as of: March 1, 2023', checkedOn: C },
  'uk-bronchitis': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/bronchitis/', dateText: 'Page last reviewed: 18 August 2026', nextReviewDue: '2029-08-18', checkedOn: C },
  'ca-hlbc-bronchitis': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/acute-bronchitis', dateText: 'Current as of: November 14, 2022', checkedOn: C },
  'uk-sinusitis': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/sinusitis-sinus-infection/', dateText: 'Page last reviewed: 31 January 2024', nextReviewDue: '2027-01-31', checkedOn: C },
  'ca-hlbc-sinusitis': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/sinusitis', dateText: 'Current as of: March 1, 2023', checkedOn: C },
  'uk-bronchiectasis': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/bronchiectasis/', dateText: 'Page last reviewed: 11 June 2025', nextReviewDue: '2028-06-11', checkedOn: C },
  'ca-hlbc-bronchiectasis': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/bronchiectasis', dateText: 'Current as of: November 14, 2022', checkedOn: C },
  'us-niams-cts': { country: 'US', publisher: 'NIAMS (US National Institutes of Health)', type: 'government', url: 'https://www.niams.nih.gov/health-topics/carpal-tunnel-syndrome/diagnosis-treatment-and-steps-to-take', dateText: 'Last Reviewed December 2023', checkedOn: C },
  'uk-cts': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/carpal-tunnel-syndrome/', dateText: 'Page last reviewed: 17 April 2024', nextReviewDue: '2027-04-17', checkedOn: C },
  'ca-hlbc-cts': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/carpal-tunnel-syndrome', dateText: 'Current as of: November 9, 2022', checkedOn: C },
  'uk-pf': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/plantar-fasciitis/', dateText: 'Page last reviewed: 14 February 2025', nextReviewDue: '2028-02-14', checkedOn: C },
  'ca-hlbc-pf': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/plantar-fasciitis', dateText: 'Current as of: November 9, 2022', checkedOn: C },
  'uk-ptsd': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/post-traumatic-stress-disorder-ptsd/', dateText: 'Page last reviewed: 08 April 2026', nextReviewDue: '2029-04-08', checkedOn: C },
  'ca-hlbc-ptsd': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/post-traumatic-stress-disorder', dateText: 'Adaptation Date: 6/14/2023', checkedOn: C },
  'uk-bipolar': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/mental-health/conditions/bipolar-disorder/', dateText: 'Page last reviewed: 28 October 2024', nextReviewDue: '2027-10-28', checkedOn: C },
  'ca-hlbc-bipolar': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/bipolar-disorder', dateText: 'Current as of: October 20, 2022', checkedOn: C },
  'uk-adhd': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/attention-deficit-hyperactivity-disorder-adhd/', dateText: 'Page last reviewed: 19 March 2025', nextReviewDue: '2028-03-19', checkedOn: C },
  'us-niddk-cirrhosis': { country: 'US', publisher: NIDDK, type: 'government', url: 'https://www.niddk.nih.gov/health-information/liver-disease/cirrhosis/eating-diet-nutrition', dateText: 'Last Reviewed June 2023', checkedOn: C },
  'uk-cirrhosis': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/cirrhosis/', dateText: 'Page last reviewed: 10 February 2025', nextReviewDue: '2028-02-10', checkedOn: C },
  'ca-hlbc-cirrhosis': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/cirrhosis', dateText: 'Current as of: March 22, 2023', checkedOn: C },
  'us-nhlbi-ipf': { country: 'US', publisher: 'NHLBI (US National Institutes of Health)', type: 'government', url: 'https://www.nhlbi.nih.gov/health/idiopathic-pulmonary-fibrosis/treatment', dateText: 'Last updated on March 24, 2022', checkedOn: C },
  'uk-ipf': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/idiopathic-pulmonary-fibrosis/', dateText: 'Page last reviewed: 27 August 2026', nextReviewDue: '2029-08-27', checkedOn: C },
  'ca-hlbc-pulmfib': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/pulmonary-fibrosis', dateText: 'Current as of: November 14, 2022', checkedOn: C },
};

type Tiles = Partial<Record<TileKey, TileItem[]>>;
const it = (id: string, title: string, src: string, quotes: string[], medIds?: string[], foodGroups?: FoodGroup[]): TileItem => ({ id, title, src, quotes, ...(medIds ? { medIds } : {}), ...(foodGroups ? { foodGroups } : {}) });

// Keyed by the condition ids used on the My conditions screen. A condition or country with no entry shows nothing here yet (later batches).
export const TILES: Record<string, Partial<Record<Country, Tiles>>> = {
  ckd: {
    US: {
      moderate: [
        it('us-ckd-sodium', 'Sodium', 'us-niddk-ckd-eat', ['Many people with CKD need to limit their sodium even more.']),
        it('us-ckd-packaged', 'Prepared, packaged, and fast foods', 'us-niddk-ckd-eat', ['Limit the amount of prepared, packaged, and fast foods you eat.'], undefined, [
          { src: 'us-cdc-diabetes-kidney-food', quote: 'Eat only small amounts of restaurant food and packaged food, which usually have lots of sodium.', foods: ['restaurant food', 'packaged food'] },
        ]),
        it('us-ckd-potassium', 'Foods that contain potassium', 'us-niddk-ckd-eat', ['Limit serving sizes of foods that contain potassium.'], undefined, [
          { src: 'us-cdc-diabetes-kidney-food', quote: 'Oranges, potatoes, tomatoes, whole-grain bread, and many other foods are high in potassium.', foods: ['oranges', 'potatoes', 'tomatoes', 'whole-grain bread'] },
          { src: 'us-niddk-ckd-children-nutrition', quote: 'Foods higher in potassium include', list: true, foods: ['apricots (fresh)', 'bananas', 'cantaloupe', 'dates', 'kiwi', 'nectarines', 'oranges/orange juice', 'prunes/prune juice', 'raisins', 'acorn and butternut squash', 'avocado', 'baked beans', 'beet and other greens', 'broccoli (cooked)', 'brussels sprouts (cooked)', 'chard', 'chili peppers', 'mushrooms (cooked)', 'potatoes', 'pumpkin', 'spinach (cooked)', 'split peas, lentils, beans', 'sweet potatoes, yams', 'tomatoes/tomato juice/tomato sauce', 'vegetable juice'] },
        ]),
        it('us-ckd-phosphorus', 'Phosphorus', 'us-niddk-phosphorus-tips', ['Most people with CKD need to eat foods with less phosphorus than they are used to eating.'], undefined, [
          { src: 'us-niddk-phosphorus-tips', quote: 'Phosphorus is found naturally in foods rich in protein, such as meat, poultry, fish, nuts, beans, and dairy products.', foods: ['meat', 'poultry', 'fish', 'nuts', 'beans', 'dairy products'] },
        ]),
        it('us-ckd-fats', 'Saturated and trans fats', 'us-niddk-ckd-eat', ['Limit saturated and trans fats.']),
        it('us-ckd-alcohol', 'Alcohol', 'us-niddk-ckd-eat', ['Limit alcohol.']),
        it('us-ckd-meat-dairy', 'Meat and dairy foods', 'us-niddk-ckd-eat', ['limit how much meat and dairy foods you consume'], undefined, [
          { src: 'us-niddk-potassium-tips', quote: 'Eat smaller portions of foods high in protein at meals and for snacks: meat, poultry, fish, beans, dairy, and nuts.', foods: ['meat', 'poultry', 'fish', 'beans', 'dairy', 'nuts'] },
          { src: 'us-cdc-diabetes-kidney-food', quote: 'Meat, dairy, beans, nuts, whole-grain bread, and dark-colored sodas are high in phosphorus.', foods: ['meat', 'dairy', 'beans', 'nuts', 'whole-grain bread', 'dark-colored sodas'] },
          { src: 'us-niddk-ckd-children-nutrition', quote: 'Foods higher in phosphorus include', list: true, foods: ['beans, lentils, nuts', 'bran cereals, oatmeal', 'cola, some bottled iced tea', 'dairy foods (milk, cheese, yogurt)', 'ice cream', 'processed meats (hot dogs, canned meat)'] },
        ]),
      ],
      activity: [
        it('us-ckd-active', 'Physical activity', 'us-niddk-ckd-manage', ['Be active for 30 minutes or more on most days.', 'Physical activity can help you reduce stress, manage your weight, and achieve your blood pressure and blood glucose goals.']),
        it('us-ckd-weight', 'Weight', 'us-niddk-ckd-manage', ['Being overweight makes your kidneys work harder and may damage your kidneys.']),
        it('us-ckd-sleep', 'Sleep', 'us-niddk-ckd-manage', ['Aim for 7 to 8 hours of sleep each night.']),
      ],
      meds: [
        it('us-ckd-nsaids', 'Ibuprofen and naproxen (NSAIDs)', 'us-niddk-ckd-manage', ['Some medicines can also harm your kidneys.', 'Ibuprofen and naproxen are NSAIDs.'], ['ibuprofen']),
        it('us-ckd-diuretic', 'A diuretic (water pill)', 'us-niddk-ckd-manage', ['You may also need to take a diuretic, sometimes called a water pill.']),
      ],
    },
    GB: {
      moderate: [
        it('gb-ckd-alcohol', 'Alcohol', 'uk-ckd-treat', ['manage your alcohol intake so you drink no more than the recommended limit of 14 units of alcohol a week']),
      ],
      activity: [
        it('gb-ckd-exercise', 'Regular exercise', 'uk-ckd-treat', ['do regular exercise – aim to do at least 150 minutes a week']),
        it('gb-ckd-smoking', 'Stop smoking', 'uk-ckd-treat', ['stop smoking if you smoke']),
        it('gb-ckd-weight', 'Weight', 'uk-ckd-treat', ["lose weight if you're overweight or obese"]),
      ],
      meds: [
        it('gb-ckd-sglt2', 'Dapagliflozin (an SGLT2 inhibitor)', 'uk-ckd-treat', ['An SGLT2 inhibitor called dapagliflozin is used to treat CKD and is often given to people who are also living with diabetes.']),
        it('gb-ckd-statins', 'Statins', 'uk-ckd-treat', ['You may be prescribed medicines called statins to reduce your risk of developing cardiovascular disease.', 'Examples include atorvastatin and simvastatin.'], ['atorvastatin', 'simvastatin']),
        it('gb-ckd-diuretics', 'Diuretics', 'uk-ckd-treat', ['In some cases you may also be given diuretics (tablets to help you pee more), such as furosemide.'], ['furosemide']),
        it('gb-ckd-binders', 'Phosphate binders', 'uk-ckd-treat', ['If this does not lower your phosphate level enough, you may be given medicines called phosphate binders.', 'Commonly used medicines include calcium acetate and calcium carbonate.']),
      ],
    },
    CA: {
      moderate: [
        it('ca-ckd-salt-protein', 'Salt (sodium) and protein', 'ca-hlbc-ckd', ['You may need to limit salt (sodium) and protein and watch your fluid intake.'], undefined, [
          { src: 'ca-hlbc-ckd-diet', quote: 'High-protein foods include meat, poultry, seafood, and eggs.', foods: ['meat', 'poultry', 'seafood', 'eggs'] },
        ]),
        it('ca-ckd-potassium', 'Potassium and phosphorus', 'ca-hlbc-ckd', ['Some people also need to limit potassium and phosphorus.'], undefined, [
          { src: 'ca-hlbc-ckd-diet', quote: 'Most salt substitutes and lite salts are high in potassium.', foods: ['salt substitutes', 'lite salts'] },
          { src: 'ca-hlbc-ckd-diet', quote: 'Limit nuts, peanut butter, seeds, lentils, beans, organ meats, and sardines.', foods: ['nuts', 'peanut butter', 'seeds', 'lentils', 'beans', 'organ meats', 'sardines'] },
          { src: 'ca-hlbc-ckd-diet', quote: 'Also limit cured meats such as sausages, bologna, and hot dogs.', foods: ['cured meats', 'sausages', 'bologna', 'hot dogs'] },
        ]),
      ],
      activity: [
        it('ca-ckd-walking', 'Walking', 'ca-hlbc-ckd', ['Be active. Walking is a good choice. Try for at least 2½ hours a week.']),
        it('ca-ckd-exercise', 'Exercise', 'ca-hlbc-ckd', ['Make exercise a routine part of your life.', 'Exercise may lower your risk for diabetes and high blood pressure.']),
        it('ca-ckd-smoking', 'Quitting smoking', 'ca-hlbc-ckd', ['If you need help quitting, talk to your doctor about stop-smoking programs and medicines.']),
        it('ca-ckd-weight', 'Weight', 'ca-hlbc-ckd', ['Stay at a healthy weight.']),
        it('ca-ckd-bp-home', 'Check blood pressure at home', 'ca-hlbc-ckd', ['Learn to check your blood pressure at home.']),
      ],
      meds: [
        it('ca-ckd-nsaids', 'Medicines that can harm your kidneys', 'ca-hlbc-ckd', ['Avoid medicines that can harm your kidneys.', 'These medicines include non-steroidal anti-inflammatory drugs. Examples of these are ibuprofen and celecoxib.'], ['ibuprofen']),
        it('ca-ckd-bp-meds', 'ACE inhibitors and ARBs', 'ca-hlbc-ckd', ['ACE inhibitors, angiotensin II receptor blockers (ARBs), beta-blockers, or calcium channel blockers may be used.']),
        it('ca-ckd-vitamin-d', 'Vitamin D', 'ca-hlbc-ckd', ['Your doctor might also suggest taking vitamin D to help keep your bones strong.']),
      ],
    },
  },
  gout: {
    US: {
      avoid: [
        it('us-gout-sugar-drinks', 'Sugar-sweetened drinks', 'us-niams-gout', ['Avoiding sugar-sweetened drinks, such as soda.']),
        it('us-gout-seafood', 'Shellfish, sardines, and anchovies', 'us-niams-gout', ['Avoiding certain seafood, such as shellfish (shrimp and lobster), sardines, and anchovies.'], undefined, [
          { src: 'us-niams-gout', quote: 'Avoiding certain seafood, such as shellfish (shrimp and lobster), sardines, and anchovies.', foods: ['shellfish', 'shrimp', 'lobster', 'sardines', 'anchovies'] },
        ]),
      ],
      moderate: [
        it('us-gout-alcohol', 'Alcoholic beverages', 'us-niams-gout', ['Drinking fewer alcoholic beverages.']),
        it('us-gout-fats', 'Saturated fats', 'us-niams-gout', ['Limiting foods high in saturated fats.']),
        it('us-gout-sugar-foods', 'Sugar-sweetened foods and drinks', 'us-niams-gout', ['Limiting sugar-sweetened foods and drinks.']),
      ],
      home: [
        it('us-gout-ice', 'Ice', 'us-niams-gout', ['Applying ice to the affected area to help reduce swelling and pain.']),
        it('us-gout-elevate', 'Elevating the limb', 'us-niams-gout', ['Elevating the affected limb, if possible, to help reduce swelling.']),
        it('us-gout-rest', 'Resting the joint', 'us-niams-gout', ['Resting the affected joint.']),
      ],
      meds: [
        it('us-gout-colchicine', 'Colchicine', 'us-niams-gout', ['Colchicine, which helps to relieve gout pain.']),
        it('us-gout-steroids', 'Corticosteroids', 'us-niams-gout', ['Corticosteroids, which can help decrease inflammation, provide pain relief, and reduce joint swelling.']),
        it('us-gout-xoi', 'Xanthine oxidase inhibitors', 'us-niams-gout', ['Xanthine oxidase inhibitors, which help prevent the production of urate.']),
      ],
    },
    GB: {
      moderate: [
        it('gb-gout-sugary', 'Sugary drinks and snacks', 'uk-gout-treat', ['do not have lots of sugary drinks and snacks']),
        it('gb-gout-alcohol', 'Alcohol', 'uk-gout-treat', ['have some alcohol-free days each week – try not to drink more than 14 units of alcohol a week']),
      ],
      activity: [
        it('gb-gout-exercise', 'Regular exercise', 'uk-gout-treat', ['exercise regularly – but avoid intense exercise or putting lots of pressure on joints']),
        it('gb-gout-weight', 'Weight', 'uk-gout-treat', ['try to lose weight if you are overweight, but avoid crash diets']),
        it('gb-gout-smoking', 'Quit smoking', 'uk-gout-treat', ['try to quit smoking']),
      ],
      home: [
        it('gb-gout-rest', 'Rest and raise the limb', 'uk-gout-treat', ['rest and raise the limb']),
        it('gb-gout-ice', 'An ice pack', 'uk-gout-treat', ['keep the joint cool – apply an ice pack, or a bag of frozen peas, wrapped in a towel for up to 20 minutes at a time']),
        it('gb-gout-water', 'Water', 'uk-gout-treat', ['drink lots of water (unless a GP tells you not to)']),
        it('gb-gout-bedclothes', 'Bedclothes off the joint', 'uk-gout-treat', ['try to keep bedclothes off the affected joint at night']),
      ],
      meds: [
        it('gb-gout-nsaid', 'NSAID (like ibuprofen)', 'uk-gout-treat', ['Attacks of gout are usually treated with a non-steroidal anti-inflammatory (NSAID), like ibuprofen.'], ['ibuprofen']),
        it('gb-gout-steroids', 'Steroids', 'uk-gout-treat', ['If the pain and swelling does not improve you may be given steroids as tablets or an injection.']),
        it('gb-gout-uric', 'Uric acid-lowering medicine', 'uk-gout-treat', ['If you have frequent attacks or high levels of uric acid in your blood, you may need to take uric acid-lowering medicine.']),
      ],
    },
    CA: {
      avoid: [
        it('ca-gout-hfcs', 'High-fructose corn syrup', 'ca-hlbc-gout', ['Avoid foods or drinks that are made with high-fructose corn syrup.']),
      ],
      moderate: [
        it('ca-gout-seafood', 'Seafood and red meat', 'ca-hlbc-gout', ['Eat less seafood and red meat.'], undefined, [
          { src: 'ca-hlbc-gout', quote: 'Eat less seafood and red meat.', foods: ['seafood', 'red meat'] },
        ]),
        it('ca-gout-alcohol', 'Alcohol', 'ca-hlbc-gout', ['Check with your doctor before drinking alcohol.']),
      ],
      activity: [
        it('ca-gout-weight', 'Weight', 'ca-hlbc-gout', ['Losing weight, if you are overweight, may help reduce attacks of gout.', 'But do not go on a diet that causes rapid weight loss.']),
      ],
      home: [
        it('ca-gout-ice', 'Ice or a cold pack', 'ca-hlbc-gout', ['If the joint is swollen, put ice or a cold pack on the area for 10 to 20 minutes at a time.']),
        it('ca-gout-prop', 'Prop up the sore limb', 'ca-hlbc-gout', ['Prop up the sore limb on a pillow when you ice it or anytime you sit or lie down during the next 3 days.']),
        it('ca-gout-rest', 'Rest sore joints', 'ca-hlbc-gout', ['Rest sore joints.']),
      ],
      meds: [
        it('ca-gout-colchicine', 'Colchicine and NSAIDs', 'ca-hlbc-gout', ['To stop a gout attack, your doctor will prescribe pills such as colchicine or NSAIDs (such as naproxen).']),
        it('ca-gout-allopurinol', 'Allopurinol', 'ca-hlbc-gout', ['Medicines, such as allopurinol, lower uric acid levels in the blood.']),
      ],
    },
  },
  hbp: {
    // Canada: the Canada.ca page (modified 2026-02-12) and the HealthLink BC page (current as of September 7, 2022) were read on 2026-11-18.
    // Neither has a usable line on food, activities, home remedies or named medicines, so every tile is empty.
    CA: {},
    US: {
      avoid: [
        it('us-hbp-alcohol', 'Alcohol', 'us-nhlbi-hbp', ['Avoid or limit alcohol.']),
      ],
      activity: [
        it('us-hbp-activity', 'Physical activity', 'us-nhlbi-hbp', ['Get regular physical activity.', 'Even a small amount of physical activity may help, like walking for 10 minutes each day.']),
        it('us-hbp-stress', 'Manage stress', 'us-nhlbi-hbp', ['Manage stress.', 'Learning how to manage stress and cope with problems can improve your mental and physical health.', 'Relaxation techniques, talking to a counselor, and finding a support group can all help.']),
        it('us-hbp-weight', 'Weight', 'us-nhlbi-hbp', ['Even losing just 3% to 5% of your weight can improve blood pressure.']),
        it('us-hbp-sleep', 'Sleep', 'us-nhlbi-hbp', ['The recommended amount for adults is 7 to 9 hours of sleep per day.']),
        it('us-hbp-smoking', 'Quit smoking', 'us-nhlbi-hbp', ['The Tips to Quit Smoking Fact Sheet has information about how to quit smoking.']),
      ],
      meds: [
        it('us-hbp-ccb', 'Calcium channel blockers', 'us-nhlbi-hbp', ['Calcium channel blockers prevent calcium from entering the muscle cells of your heart and blood vessels.']),
        it('us-hbp-diuretics', 'Diuretics', 'us-nhlbi-hbp', ['Diuretics remove extra water and sodium (salt) from your body, lowering the amount of fluid in your blood.', 'The main diuretic for high blood pressure treatment is thiazide.']),
      ],
    },
    GB: {
      avoid: [
        it('gb-hbp-salt', 'Salty food', 'uk-hbp', ['do not eat too much salt – avoid salty food or adding salt to your meals']),
        it('gb-hbp-alcohol', 'Alcohol', 'uk-hbp', ['do not drink too much alcohol – avoid drinking more than 14 alcohol units a week on a regular basis']),
      ],
      moderate: [
        it('gb-hbp-caffeine', 'Caffeine', 'uk-hbp', ['do not drink too much caffeine – drinks high in caffeine include coffee, tea and cola']),
      ],
      activity: [
        it('gb-hbp-exercise', 'Regular exercise', 'uk-hbp', ['exercise regularly – aim to do at least 150 minutes of exercise a week']),
        it('gb-hbp-weight', 'Lose weight', 'uk-hbp', ["lose weight if you're overweight"]),
        it('gb-hbp-smoking', 'Do not smoke', 'uk-hbp', ['do not smoke']),
        it('gb-hbp-bp-home', 'Blood pressure monitor at home', 'uk-hbp', ['use a blood pressure monitor at home to check your blood pressure regularly over the next few days']),
      ],
    },
  },
  // Batch 2 (read 2026-11-18). Diabetes: NIDDK, NHS and HealthLink BC type 2 diabetes pages. Heart disease: NHLBI, NHS and HealthLink BC coronary pages.
  // Empty tiles mean no usable official line (the NIDDK and NHS diabetes pages name no foods to limit; no page names a home remedy).
  diabetes: {
    US: {
      activity: [
        it('us-dm-activity', 'Physical activity', 'us-niddk-managing-diabetes', ['Try to get at least 150 minutes of moderate-intensity physical activity, such as brisk walking, each week.']),
        it('us-dm-weight', 'Weight', 'us-niddk-managing-diabetes', ['If you are overweight or have obesity, ask your health care team how you can manage your weight.']),
        it('us-dm-smoking', 'If you smoke', 'us-niddk-managing-diabetes', ['If you smoke, vape, or use other tobacco products, stop.']),
        it('us-dm-sleep', 'About 7 to 8 hours each night', 'us-niddk-managing-diabetes', ['Most adults should aim for about 7 to 8 hours each night.']),
        it('us-dm-home-glucose', 'Checking blood glucose at home', 'us-niddk-managing-diabetes', ['Even if you do not use insulin, checking your blood glucose level at home can help you manage your diabetes.']),
      ],
      meds: [
        it('us-dm-glucagon', 'Glucagon', 'us-niddk-managing-diabetes', ['Glucagon—a hormone that raises blood glucose levels—is the best way to treat severely low blood glucose.']),
      ],
    },
    GB: {
      meds: [
        it('gb-dm-metformin', 'Metformin or insulin', 'uk-diabetes', ['sometimes medicines, such as metformin or insulin'], ['metformin']),
      ],
    },
    CA: {
      moderate: [
        it('ca-dm-alcohol', 'Alcohol', 'ca-hlbc-t2d', ['If you drink alcohol, try to drink less.']),
      ],
      activity: [
        it('ca-dm-activity', 'Moderate to vigorous activity', 'ca-hlbc-t2d', ['Try to do moderate to vigorous activity for at least 2½ hours a week.']),
        it('ca-dm-smoking', 'Do not smoke', 'ca-hlbc-t2d', ['Do not smoke.']),
        it('ca-dm-glucose', 'Check your blood sugar', 'ca-hlbc-t2d', ['Check your blood sugar as often as your doctor recommends.']),
      ],
      meds: [
        it('ca-dm-pills', 'Pills: metformin, canagliflozin, linagliptin, pioglitazone', 'ca-hlbc-t2d', ['Ones that you take as pills include metformin, canagliflozin, linagliptin, and pioglitazone.'], ['metformin']),
        it('ca-dm-shots', 'Shots: dulaglutide, exenatide, liraglutide', 'ca-hlbc-t2d', ['Ones that you take as shots include dulaglutide, exenatide, and liraglutide.'], ['dulaglutide']),
      ],
    },
  },
  heart: {
    US: {
      moderate: [
        it('us-hd-fats', 'Saturated fats', 'us-nhlbi-chd', ['A heart-healthy eating plan includes fruits, vegetables, and whole grains and limits saturated fats']),
      ],
      activity: [
        it('us-hd-activity', 'Physical activity', 'us-nhlbi-chd', ['Before starting any exercise program, ask your provider what level of physical activity is right for you.']),
        it('us-hd-weight', 'Weight loss plan', 'us-nhlbi-chd', ['You can work with your provider to create a weight loss plan that is right for you.']),
        it('us-hd-sleep', 'Sleep', 'us-nhlbi-chd', ['The recommended amount for adults is 7 to 9 hours of sleep a night.']),
      ],
      meds: [
        it('us-hd-ace', 'ACE inhibitors and beta blockers', 'us-nhlbi-chd', ['ACE inhibitors, beta blockers, and angiotensin-receptor blockers help lower blood pressure']),
        it('us-hd-ccb', 'Calcium channel blockers', 'us-nhlbi-chd', ['Calcium channel blockers lower blood pressure by allowing blood vessels to relax.']),
        it('us-hd-nitrates', 'Nitrates', 'us-nhlbi-chd', ['Nitrates, such as nitroglycerin, dilate your coronary arteries and relieve or prevent angina (chest pain).']),
        it('us-hd-statins', 'Atorvastatin and rosuvastatin', 'us-nhlbi-chd', ['such as atorvastatin and rosuvastatin, can help control high blood cholesterol and slow plaque buildup.'], ['atorvastatin']),
      ],
    },
    GB: {
      activity: [
        it('gb-hd-exercise', 'Regular exercise', 'uk-chd-treat', ['doing regular exercise, will also reduce your future risk of heart disease']),
        it('gb-hd-smoking', 'Stopping smoking', 'uk-chd-treat', ['stopping smoking after a heart attack quickly reduces your risk']),
      ],
      meds: [
        it('gb-hd-statins', 'Statins', 'uk-chd-treat', ['Most people start with atorvastatin but other statins include:'], ['atorvastatin']),
        it('gb-hd-ace', 'Ramipril and lisinopril', 'uk-chd-treat', ['Examples include ramipril and lisinopril.'], ['ramipril', 'lisinopril']),
        it('gb-hd-ccb', 'Amlodipine, verapamil and diltiazem', 'uk-chd-treat', ['Examples include amlodipine, verapamil and diltiazem.'], ['amlodipine']),
      ],
    },
    CA: {
      moderate: [
        it('ca-hd-alcohol', 'Alcohol', 'ca-hlbc-cad', ['Drink alcohol in moderation, if you drink. Ask your doctor how much, if any, is okay for you.']),
      ],
      activity: [
        it('ca-hd-exercise', 'Exercise program', 'ca-hlbc-cad', ["Start an exercise program (if your doctor says it's safe)."]),
        it('ca-hd-walking', 'Walking, swimming, biking, or jogging', 'ca-hlbc-cad', ['Try walking, swimming, biking, or jogging for at least 30 minutes on most, if not all, days of the week.']),
        it('ca-hd-smoking', 'Quitting smoking', 'ca-hlbc-cad', ['Quitting smoking is the best thing you can do to reduce your risk of future problems.']),
        it('ca-hd-weight', 'Weight', 'ca-hlbc-cad', ['Being active and eating healthy foods can help you stay at a healthy weight or lose weight if you need to.']),
      ],
      meds: [
        it('ca-hd-ezetimibe', 'Ezetimibe with a statin', 'ca-hlbc-cad', ['Other cholesterol medicines, such as ezetimibe, may be used along with a statin.']),
      ],
    },
  },
  // Batch 3 (read 2026-11-18): heart failure, high cholesterol, stroke. Condition ids are the picker ids.
  'heart-failure': {
    US: {
      avoid: [it('us-hf-alcohol', 'Alcohol', 'us-nhlbi-hf', ['Avoid or limit alcohol.'])],
      moderate: [it('us-hf-sodium', 'Sodium (salt)', 'us-nhlbi-hf', ['Lower your sodium (salt) intake.', 'Salt may make fluid buildup worse.'])],
      activity: [
        it('us-hf-activity', 'Physical activity', 'us-nhlbi-hf', ['Get regular physical activity.']),
        it('us-hf-weight', 'Weight', 'us-nhlbi-hf', ['Aim for a healthy weight since extra weight can make your heart work harder.']),
        it('us-hf-smoking', 'Quit smoking', 'us-nhlbi-hf', ['Quit smoking.']),
        it('us-hf-sleep', 'Sleep', 'us-nhlbi-hf', ['Get good-quality sleep.']),
      ],
      meds: [
        it('us-hf-remove', 'Medicines that remove extra sodium and fluid', 'us-nhlbi-hf', ['Medicines that remove extra sodium and fluid from your body,']),
        it('us-hf-relax', 'Medicines to relax your blood vessels', 'us-nhlbi-hf', ['Medicines to relax your blood vessels']),
        it('us-hf-slow', 'Medicines to slow your heart rate', 'us-nhlbi-hf', ['Medicines to slow your heart rate,']),
        it('us-hf-digoxin', 'Digoxin', 'us-nhlbi-hf', ['Digoxin makes your heart beat stronger and pump more blood.']),
      ],
    },
    GB: {
      moderate: [it('gb-hf-alcohol', 'Alcohol', 'uk-hf-treat', ['cut down on alcohol, if you drink'])],
      activity: [
        it('gb-hf-active', 'Stay active', 'uk-hf-treat', ['stay active – you should be referred for a cardiac rehabilitation assessment, which can help you learn how exercise safely']),
        it('gb-hf-weight', 'Weight', 'uk-hf-treat', ['maintain a healthy weight']),
        it('gb-hf-weigh', 'Weigh yourself regularly', 'uk-hf-treat', ['weigh yourself regularly – a build-up of fluid can cause sudden weight gain and may need treatment']),
        it('gb-hf-smoking', 'Quit smoking', 'uk-hf-treat', ['try to quit smoking']),
      ],
      meds: [
        it('gb-hf-diuretics', 'Diuretics', 'uk-hf-treat', ['make you pee more to reduce fluid build-up in your body (diuretics), such as furosemide'], ['furosemide']),
        it('gb-hf-beta', 'Beta blockers', 'uk-hf-treat', ['slow your heart down, so it does not need as much oxygen (such as beta blockers)']),
      ],
    },
    CA: {
      avoid: [
        it('ca-hf-alcohol', 'Alcohol', 'ca-hlbc-hf', ['Limit or avoid alcohol.']),
        it('ca-hf-fat', 'Saturated and trans fat', 'ca-hlbc-hf', ['Choose foods that are low in saturated fat, and avoid trans fat.']),
      ],
      moderate: [
        it('ca-hf-sodium', 'Sodium, alcohol, and sugar', 'ca-hlbc-hf', ['Limit sodium, alcohol, and sugar.']),
        it('ca-hf-fluid', 'Fluid intake', 'ca-hlbc-hf', ['Limit your fluid intake if your doctor tells you to.']),
      ],
      activity: [
        it('ca-hf-exercise', 'Moderate to vigorous exercise', 'ca-hlbc-hf', ['Aim for at least 2½ hours of moderate to vigorous exercise a week.']),
        it('ca-hf-weigh', 'Weigh yourself each day', 'ca-hlbc-hf', ['Weigh yourself without clothing at the same time each day.']),
        it('ca-hf-smoke', 'Do not smoke', 'ca-hlbc-hf', ['Do not smoke.']),
        it('ca-hf-symptoms', 'Check your symptoms every day', 'ca-hlbc-hf', ['Check your symptoms every day to watch for changes.']),
      ],
      meds: [
        it('ca-hf-fishoil', 'Fish oil (omega-3)', 'ca-hlbc-hf', ['Fish oil (omega-3 fatty acid) supplements may help some people who have heart failure.']),
        it('ca-hf-worse', 'Medicines can affect heart failure', 'ca-hlbc-hf', ['Some medicines can affect your heart and make heart failure worse.']),
      ],
    },
  },
  'high-cholesterol': {
    US: {
      moderate: [it('us-hc-alcohol', 'Alcohol', 'us-nhlbi-chol', ['Limit alcohol.'])],
      activity: [it('us-hc-activity', 'Physical activity', 'us-nhlbi-chol', ['Before starting any exercise program, ask your provider what level of physical activity is right for you.'])],
      meds: [
        it('us-hc-statins', 'Statins', 'us-nhlbi-chol', ['Statins are the most common medicine used to treat high blood cholesterol.']),
        it('us-hc-ezetimibe', 'Ezetimibe', 'us-nhlbi-chol', ['Ezetimibe works by blocking how cholesterol is absorbed into the body.']),
        it('us-hc-pcsk9', 'PCSK9 inhibitors', 'us-nhlbi-chol', ['PCSK9 inhibitors are a type of medicine that you inject under your skin.']),
      ],
    },
    GB: {
      avoid: [it('gb-hc-alcohol', 'Alcohol', 'uk-chol-lower', ['avoid drinking more than 14 units of alcohol a week on a regular basis'])],
      moderate: [
        it('gb-hc-eat-less', 'Eat less', 'uk-chol-lower', ['Try to eat less:'], undefined, [
          { src: 'uk-chol-lower', quote: 'Try to eat less:', list: true, foods: ['meat pies, sausages and fatty meat', 'butter, lard and ghee', 'cream and cheese', 'cakes and biscuits'] },
        ]),
      ],
      activity: [it('gb-hc-exercises', 'Different exercises', 'uk-chol-lower', ['Try a few different exercises to find something you like doing.'])],
    },
    CA: {
      moderate: [
        it('ca-hc-sodium', 'Sodium and alcohol', 'ca-hlbc-chol', ['Limit sodium and alcohol.']),
        it('ca-hc-sugar', 'Added sugar', 'ca-hlbc-chol', ['Limit drinks and foods with added sugar.']),
        it('ca-hc-fat', 'Saturated fat', 'ca-hlbc-chol', ['Choose foods that are low in saturated fat.'], undefined, [
          { src: 'ca-hlbc-chol', quote: 'These foods include meats, whole milk, butter, and cheese.', foods: ['meats', 'whole milk', 'butter', 'cheese'] },
        ]),
      ],
      activity: [
        it('ca-hc-activity', 'Moderate to vigorous activity', 'ca-hlbc-chol', ['Try to do moderate to vigorous activity at least 2½ hours a week.']),
        it('ca-hc-weight', 'Weight', 'ca-hlbc-chol', ['Lose weight if you need to.']),
        it('ca-hc-smoke', 'Do not smoke', 'ca-hlbc-chol', ["Don't smoke."]),
      ],
      meds: [
        it('ca-hc-statins', 'Statins', 'ca-hlbc-chol', ['Some people also take medicines called statins, along with lifestyle changes, to reduce their risk.']),
        it('ca-hc-inhibitor', 'Cholesterol absorption inhibitor or PCSK9-inhibitor', 'ca-hlbc-chol', ['Your doctor may talk with you about also taking a cholesterol absorption inhibitor or a PCSK9-inhibitor.']),
      ],
    },
  },
  stroke: {
    US: {
      activity: [
        it('us-st-activity', 'Physical activity', 'us-nhlbi-stroke', ['Get regular physical activity.']),
        it('us-st-weight', 'Weight', 'us-nhlbi-stroke', ['Aim for a healthy weight.']),
        it('us-st-smoking', 'Quit smoking', 'us-nhlbi-stroke', ['Quit smoking.']),
        it('us-st-sleep', 'Sleep', 'us-nhlbi-stroke', ['Get enough good-quality sleep.']),
      ],
      meds: [
        it('us-st-aspirin', 'Aspirin', 'us-nhlbi-stroke', ['They may also recommend aspirin or other medicines to prevent dangerous clotting that could lead to another stroke.']),
        it('us-st-thinners', 'Blood thinners', 'us-nhlbi-stroke', ['Blood thinners can help lower the risk of another stroke from atrial fibrillation.']),
        it('us-st-statin', 'Statin therapy', 'us-nhlbi-stroke', ['Statin therapy has been found to be protective against stroke, but it should not be used by pregnant women.']),
      ],
    },
    GB: {
      activity: [it('gb-st-physio', 'Physiotherapy and exercises', 'uk-stroke-recovery', ['physiotherapy and exercises to help with movement'])],
    },
    CA: {
      moderate: [
        it('ca-st-sodium', 'Sodium and sugar', 'ca-hlbc-stroke', ['Limit sodium and sugar.']),
        it('ca-st-alcohol', 'Alcohol', 'ca-hlbc-stroke', ['If you drink alcohol, try to drink less.']),
      ],
      activity: [
        it('ca-st-exercise', 'Moderate to vigorous exercise', 'ca-hlbc-stroke', ['Be active. Get at least 2½ hours of moderate to vigorous exercise a week.']),
        it('ca-st-walking', 'Walking', 'ca-hlbc-stroke', ['Walking is a good choice.']),
        it('ca-st-weight', 'Weight', 'ca-hlbc-stroke', ['Stay at a healthy weight.']),
        it('ca-st-smoke', 'Do not smoke', 'ca-hlbc-stroke', ["Don't smoke."]),
        it('ca-st-rehab', 'Stroke rehabilitation', 'ca-hlbc-stroke', ['Attend stroke rehabilitation (rehab) if recommended.']),
      ],
      meds: [it('ca-st-tpa', 'Tissue plasminogen activator (TPA)', 'ca-hlbc-stroke', ['You may get a clot-dissolving medicine called tissue plasminogen activator (TPA).'])],
    },
  },
  // Batch 4 (read 2026-11-18): overweight or obesity, fatty liver, peripheral artery disease, atrial fibrillation, polycystic kidney disease.
  // UK obesity: no national NHS page was read, so it is not listed. Canada polycystic kidney: the page has no usable line, so every tile is empty.
  obesity: {
    US: {
      activity: [
        it('us-ob-activity', 'Physical activity', 'us-niddk-obesity', ['When combined with healthy eating, regular physical activity may help you lose weight and stay at a healthy weight.']),
        it('us-ob-goal', 'Losing weight', 'us-niddk-obesity', ['For example, losing 5% of your body weight over a period of 6 months may be a good initial goal.']),
        it('us-ob-apps', 'Smartphone apps', 'us-niddk-obesity', ['Smartphone apps and other tools may help you track how well you are sticking with your plan.']),
      ],
    },
    CA: {
      moderate: [
        it('ca-ob-foods', 'Foods high in fat, sugar, and calories', 'ca-hlbc-obesity', ['Limit foods high in fat, sugar, and calories.']),
        it('ca-ob-alcohol', 'Alcohol', 'ca-hlbc-obesity', ['Alcohol is very high in calories.']),
      ],
      activity: [
        it('ca-ob-activity', 'Moderate to vigorous activity', 'ca-hlbc-obesity', ['Start with at least 30 minutes of moderate to vigorous activity on most days of the week.']),
        it('ca-ob-losing', 'Losing weight', 'ca-hlbc-obesity', ['Losing just 10% of your body weight can make a difference in your health.']),
        it('ca-ob-track', 'Keep track', 'ca-hlbc-obesity', ['People who keep track of what they eat, feel, and do are better at losing weight.']),
      ],
      meds: [it('ca-ob-orlistat', 'Orlistat', 'ca-hlbc-obesity', ['Orlistat prevents some of the fat calories you eat from being absorbed in your intestines.'])],
    },
  },
  'fatty-liver': {
    US: {
      moderate: [
        it('us-fl-alcohol', 'Alcohol', 'us-niddk-nafld-eat', ['If you have NAFLD, you should minimize alcohol use, which can further damage your liver.']),
        it('us-fl-fructose', 'Fructose', 'us-niddk-nafld-eat', ['Fructose is found in sweetened soft drinks, sports drinks, sweetened tea, and juices.'], undefined, [
          { src: 'us-niddk-nafld-eat', quote: 'Fructose is found in sweetened soft drinks, sports drinks, sweetened tea, and juices.', foods: ['sweetened soft drinks', 'sports drinks', 'sweetened tea', 'juices'] },
        ]),
      ],
      activity: [it('us-fl-weight', 'Losing weight', 'us-niddk-nafld-eat', ['If you have NAFLD, your doctor may recommend gradually losing weight if you are overweight or have obesity.'])],
    },
    GB: {
      moderate: [it('gb-fl-alcohol', 'Alcohol', 'uk-nafld', ['do not drink too much alcohol – keep to the recommended limit of no more than 14 alcohol units a week'])],
      activity: [
        it('gb-fl-exercise', 'Regular exercise', 'uk-nafld', ['exercise regularly – aim to do at least 150 minutes of exercise a week']),
        it('gb-fl-weight', 'Lose weight', 'uk-nafld', ["lose weight if you're overweight"]),
        it('gb-fl-smoke', 'Do not smoke', 'uk-nafld', ['do not smoke']),
      ],
      meds: [it('gb-fl-pioglitazone', 'Pioglitazone or vitamin E', 'uk-nafld', ['Treatment from a liver specialist may include a medicine called pioglitazone, or vitamin E.'])],
    },
    CA: {
      meds: [it('ca-fl-weightloss', 'Medicines for weight loss', 'ca-hlbc-nafld', ['A doctor may prescribe medicines for related conditions or to help with weight loss.'])],
    },
  },
  'peripheral-artery-disease': {
    US: {
      activity: [it('us-pad-walking', 'Walking', 'us-nhlbi-pad', ['The goal is to work up to at least 30 minutes of continuous walking.'])],
      meds: [it('us-pad-cilostazol', 'Cilostazol', 'us-nhlbi-pad', ['One type of antiplatelet medicine, cilostazol, may also improve your symptoms and make walking easier.'])],
    },
    GB: {
      activity: [
        it('gb-pad-exercise-programme', 'Exercise programme', 'uk-pad-treat', ['an exercise programme – this may be with the help of a healthcare professional, or you may be able to do it on your own']),
        it('gb-pad-exercise-regularly', 'Exercise regularly', 'uk-pad-treat', ['exercise regularly – ask your doctor for advice about exercising if you have not done any physical activity for a while']),
        it('gb-pad-smoke', 'Do not smoke', 'uk-pad-treat', ['do not smoke because it can make your symptoms worse']),
      ],
      meds: [
        it('gb-pad-meds-pain', 'Medicines to relieve pain', 'uk-pad-treat', ['medicines to relieve pain or to help increase blood flow to your leg muscles']),
        it('gb-pad-meds-other', 'Medicines prescribed for other health conditions', 'uk-pad-treat', ["take any medicines you've been prescribed for other health conditions like high blood pressure and high cholesterol"]),
      ],
    },
    CA: {
      avoid: [it('ca-pad-fat', 'Trans fat', 'ca-hlbc-pad', ['Choose foods that are low in saturated fat and avoid trans fat.'])],
      moderate: [
        it('ca-pad-sodium', 'Sodium and alcohol', 'ca-hlbc-pad', ['Limit sodium and alcohol.']),
        it('ca-pad-sugar', 'Added sugar', 'ca-hlbc-pad', ['Limit drinks and foods with added sugar.']),
      ],
      activity: [
        it('ca-pad-walking', 'Walking, swimming, or biking', 'ca-hlbc-pad', ['Try walking, swimming, or biking for at least 2½ hours a week.']),
        it('ca-pad-smoking', 'Quit smoking', 'ca-hlbc-pad', ['Quit smoking, and avoid second-hand smoke.']),
        it('ca-pad-weight', 'Weight', 'ca-hlbc-pad', ['Stay at a healthy weight.']),
      ],
      meds: [
        it('ca-pad-aspirin', 'Aspirin and other blood thinners', 'ca-hlbc-pad', ['Aspirin and other blood thinners.']),
        it('ca-pad-statins', 'Statins', 'ca-hlbc-pad', ['Statins and other medicines.']),
      ],
    },
  },
  'atrial-fibrillation': {
    US: {
      avoid: [it('us-af-alcohol', 'Alcohol and stimulants', 'us-nhlbi-af', ['Limit or avoid alcohol or stimulants that may increase your heart rate.'])],
      activity: [
        it('us-af-activity', 'Be physically active', 'us-nhlbi-af', ['Be physically active.']),
        it('us-af-weight', 'Weight', 'us-nhlbi-af', ['Aim for a healthy weight to reduce the severity and number of atrial fibrillation episodes you have.']),
        it('us-af-smoke', 'Quit smoking', 'us-nhlbi-af', ['Quit smoking.']),
      ],
    },
    GB: {
      avoid: [it('gb-af-triggers', 'Triggers: caffeine, spicy food', 'uk-af-treat', ['avoid triggers such as caffeine, spicy food, stress, dehydration and lack of sleep'], undefined, [
        { src: 'uk-af-treat', quote: 'avoid triggers such as caffeine, spicy food, stress, dehydration and lack of sleep', foods: ['caffeine', 'spicy food'] },
      ])],
      moderate: [it('gb-af-alcohol', 'Alcohol', 'uk-af-treat', ['do not drink too much alcohol'])],
      activity: [
        it('gb-af-exercise', 'Regular exercise', 'uk-af-treat', ['exercise regularly – aim to do at least 150 minutes of moderate exercise a week, like walking, bike riding or gardening']),
        it('gb-af-hard', 'Do not exercise too hard', 'uk-af-treat', ['do not exercise too much or too hard – this can trigger atrial fibrillation']),
        it('gb-af-weight', 'Weight', 'uk-af-treat', ['try to keep to a healthy weight']),
        it('gb-af-smoke', 'Do not smoke', 'uk-af-treat', ['do not smoke']),
      ],
      meds: [
        it('gb-af-beta', 'Beta blockers', 'uk-af-treat', ['control the rate and rhythm of your heart, such as beta blockers']),
        it('gb-af-anticoag', 'Anticoagulants', 'uk-af-treat', ['lower the risk of blood clots or stroke (anticoagulants)']),
      ],
    },
    CA: {
      avoid: [it('ca-af-alcohol-avoid', 'Alcohol', 'ca-hlbc-af', ['Avoid alcohol if it triggers symptoms.'])],
      moderate: [it('ca-af-alcohol', 'Alcohol', 'ca-hlbc-af', ['Limit alcohol to 3 drinks a day for men and 2 drinks a day for women.'])],
      activity: [
        it('ca-af-exercise', 'Exercise', 'ca-hlbc-af', ['Talk to your doctor about what type and level of exercise is safe for you.']),
        it('ca-af-weight', 'Weight', 'ca-hlbc-af', ['Stay at a healthy weight. Lose weight if you need to.']),
        it('ca-af-smoke', 'Do not smoke', 'ca-hlbc-af', ["Don't smoke. Avoid second-hand smoke too."]),
      ],
    },
  },
  'polycystic-kidney': {
    US: {
      activity: [
        it('us-pkd-activity', 'Physical activity', 'us-niddk-adpkd', ['Sometimes you can control blood pressure with healthy eating and regular physical activity alone.']),
        it('us-pkd-bp', 'Blood pressure', 'us-niddk-adpkd', ['Keep your blood pressure under control to help delay kidney damage.']),
      ],
      meds: [it('us-pkd-otc', 'OTC medicines', 'us-niddk-adpkd', ['Always talk with a health care provider before taking any OTC medicines because some may be harmful to your kidneys.'])],
    },
    GB: {
      meds: [
        it('gb-pkd-nsaids', 'NSAIDs (such as ibuprofen)', 'uk-adpkd-treat', ['It’s usually recommended that non-steroidal anti-inflammatory drugs (NSAIDs), such as ibuprofen, are avoided.'], ['ibuprofen']),
        it('gb-pkd-paracetamol', 'Paracetamol', 'uk-adpkd-treat', ['If you need to take a painkiller, paracetamol is the best medication to try first.']),
      ],
    },
    CA: {},
  },
  // Batch 5 (read 2026-11-18): COPD, asthma, sleep apnea, osteoarthritis, depression. UK sleep apnea: no national NHS page read. Canada depression: the page has no usable line.
  copd: {
    US: {
      meds: [
        it('us-copd-broncho', 'Bronchodilators and steroids', 'us-nhlbi-copd', ['Medicines to treat COPD symptoms include bronchodilators and steroids or nonsteroid medicines that reduce inflammation']),
        it('us-copd-antibiotics', 'Antibiotics', 'us-nhlbi-copd', ['Antibiotics may be used to treat flare-ups caused by an infection.']),
      ],
    },
    GB: {
      activity: [
        it('gb-copd-exercise', 'Regular, gentle exercise', 'uk-copd-treat', ['try to increase your activity levels with regular, gentle exercise, such as walking, cycling, yoga and tai chi']),
        it('gb-copd-smoking', 'Quit smoking', 'uk-copd-treat', ["quit smoking if you smoke – it's the main thing you can do to improve COPD"]),
        it('gb-copd-vaccines', 'Flu and COVID vaccinations', 'uk-copd-treat', ['have your flu and COVID vaccinations']),
        it('gb-copd-diary', 'Keep a diary', 'uk-copd-treat', ['keep a diary of things that can cause flare-ups – this can help you avoid triggers']),
      ],
      meds: [it('gb-copd-inhalers', 'Bronchodilator inhalers', 'uk-copd-treat', ['inhalers that contain medicines to help widen your airways (bronchodilators)'])],
    },
    CA: {
      activity: [
        it('ca-copd-exercise', 'Regular exercise', 'ca-hlbc-copd', ['Get regular exercise to stay as strong as you can.']),
        it('ca-copd-smoking', 'Stop smoking', 'ca-hlbc-copd', ["It's very important to stop smoking."]),
        it('ca-copd-flu', 'Flu vaccine', 'ca-hlbc-copd', ['If you have COPD, you need to get a flu vaccine every year.']),
        it('ca-copd-weight', 'Losing weight', 'ca-hlbc-copd', ['If you are losing weight, ask your doctor or dietitian about ways to make it easier to get the calories you need.']),
        it('ca-copd-irritants', 'Things that irritate your lungs', 'ca-hlbc-copd', ['Avoid things that can irritate your lungs, such as smoke and air pollution.']),
      ],
      meds: [it('ca-copd-roflumilast', 'Roflumilast', 'ca-hlbc-copd', ['The only PDE4 inhibitor available is roflumilast (Daxas).'])],
    },
  },
  asthma: {
    US: {
      avoid: [it('us-as-allergens', 'Allergens that trigger your asthma', 'us-nhlbi-asthma', ['Avoiding the allergens that trigger your asthma can help control your symptoms and prevent flare-ups.'])],
      activity: [it('us-as-warmup', 'Warming up before you exercise', 'us-nhlbi-asthma', ['Training regularly and warming up before you exercise can also help prevent symptoms.'])],
      meds: [
        it('us-as-saba', 'Short-acting beta2-agonists', 'us-nhlbi-asthma', ['Inhaled short-acting beta2-agonists (SABAs) open the airways so air can flow through.']),
        it('us-as-oral', 'Oral corticosteroids', 'us-nhlbi-asthma', ['Oral corticosteroids reduce swelling in your airways.']),
        it('us-as-leuko', 'Leukotriene modifiers', 'us-nhlbi-asthma', ['Leukotriene modifiers reduce swelling and keep your airways open.']),
      ],
    },
    GB: {
      avoid: [it('gb-as-triggers', 'Things that trigger your asthma', 'uk-asthma', ['try to avoid things that trigger your asthma symptoms, such as air pollution, smoke, pollen or animals'])],
      activity: [
        it('gb-as-exercise', 'Regular exercise', 'uk-asthma', ['exercise regularly – get advice from your doctor or nurse about exercising safely if exercise triggers your asthma symptoms']),
        it('gb-as-weight', 'Weight', 'uk-asthma', ['keep to a healthy weight']),
        it('gb-as-smoke', 'Do not smoke', 'uk-asthma', ['do not smoke – get help to quit smoking if you need it']),
        it('gb-as-vaccines', 'Vaccinations', 'uk-asthma', ['have vaccinations such as the flu vaccine – viruses such as flu can make asthma symptoms worse']),
        it('gb-as-inhaler', 'Your inhaler', 'uk-asthma', ['always have your inhaler with you']),
      ],
    },
    CA: {
      avoid: [
        it('ca-as-smoke', 'Smoke', 'ca-hlbc-asthma', ["Don't smoke, and try to avoid being around others when they smoke."]),
        it('ca-as-cold', 'Exercising outdoors in cold weather', 'ca-hlbc-asthma', ['Avoid exercising outdoors in cold weather.']),
      ],
      moderate: [
        it('ca-as-foods', 'After eating or drinking', 'ca-hlbc-asthma', ['Some people have symptoms after eating processed potatoes, shrimp, nuts, and dried fruit, or after drinking beer or wine.'], undefined, [
          { src: 'ca-hlbc-asthma', quote: 'Some people have symptoms after eating processed potatoes, shrimp, nuts, and dried fruit, or after drinking beer or wine.', foods: ['processed potatoes', 'shrimp', 'nuts', 'dried fruit', 'beer', 'wine'] },
        ]),
      ],
      activity: [
        it('ca-as-plan', 'Asthma action plan', 'ca-hlbc-asthma', ['In general, you can take care of symptoms at home by following your asthma action plan.']),
        it('ca-as-diary', 'Asthma diary', 'ca-hlbc-asthma', ['Use an asthma diary to help manage your asthma.']),
      ],
      meds: [
        it('ca-as-inhaled', 'Beclomethasone, budesonide, fluticasone, mometasone', 'ca-hlbc-asthma', ['They include beclomethasone, budesonide, fluticasone, and mometasone.']),
        it('ca-as-quick', 'Quick-relief medicines', 'ca-hlbc-asthma', ['These quick-relief medicines include salbutamol and terbutaline.']),
      ],
    },
  },
  'sleep-apnea': {
    US: {
      activity: [it('us-sa-pap', 'PAP machines', 'us-nhlbi-sleepapnea', ['PAP machines often work best when they are paired with healthy lifestyle changes.'])],
      meds: [
        it('us-sa-apap', 'Auto-adjusting PAP (APAP) machine', 'us-nhlbi-sleepapnea', ['An auto-adjusting PAP (APAP) machine automatically adjusts the air pressure you receive during sleep.']),
        it('us-sa-mouthpieces', 'Mandibular repositioning mouthpieces', 'us-nhlbi-sleepapnea', ['Mandibular repositioning mouthpieces cover the upper and lower teeth and hold the lower jaw in place.']),
      ],
    },
    CA: {
      avoid: [it('ca-sa-alcohol-avoid', 'Alcohol and sedatives before bed', 'ca-hlbc-sleepapnea', ['You could try to lose weight, sleep on your side, and avoid alcohol and medicines like sedatives before bed.'])],
      moderate: [it('ca-sa-alcohol', 'Alcohol before sleep', 'ca-hlbc-sleepapnea', ['Drinking alcohol or taking certain medicines before going to sleep can increase the risk for sleep apnea.'])],
      activity: [
        it('ca-sa-weight', 'Weight loss', 'ca-hlbc-sleepapnea', ['Weight loss should be part of managing sleep apnea.']),
        it('ca-sa-back', 'Sleeping on your back', 'ca-hlbc-sleepapnea', ['Sleeping on your back may make sleep apnea worse.']),
        it('ca-sa-exercise', 'Exercise', 'ca-hlbc-sleepapnea', ['Eat sensibly, exercise, and stay at a healthy weight.']),
      ],
      home: [it('ca-sa-prop', 'Prop up the head of your bed', 'ca-hlbc-sleepapnea', ['Prop up the head of your bed.'])],
      meds: [
        it('ca-sa-cpap', 'Continuous positive airway pressure (CPAP)', 'ca-hlbc-sleepapnea', ['Continuous positive airway pressure (CPAP) is nearly always the first medical treatment for sleep apnea.']),
        it('ca-sa-oral', 'Oral devices', 'ca-hlbc-sleepapnea', ['Oral devices (also called oral appliances) are sometimes used to treat obstructive sleep apnea.']),
      ],
    },
  },
  osteoarthritis: {
    US: {
      activity: [
        it('us-oa-exercising', 'Exercising', 'us-niams-oa', ['Exercising, which can reduce joint pain and stiffness and increase flexibility, muscle strength, and endurance.']),
        it('us-oa-weight', 'Managing your weight', 'us-niams-oa', ['Managing your weight can help reduce the stress on joints.']),
        it('us-oa-slowly', 'Start exercise slowly', 'us-niams-oa', ['Remember to start any exercise program slowly and take the time to adjust to the new level of activity.']),
      ],
      home: [it('us-oa-heatcold', 'Heat and cold therapies', 'us-niams-oa', ['Heat and cold therapies can reduce joint pain.'])],
    },
    GB: {
      activity: [
        it('gb-oa-exercise', 'Exercise', 'uk-oa-treat', ['Exercise is one of the most important treatments for people with osteoarthritis, whatever your age or level of fitness.']),
        it('gb-oa-weight', 'Weight', 'uk-oa-treat', ['Being overweight or obese often makes osteoarthritis worse, as it places extra strain on some of your joints.']),
      ],
      home: [it('gb-oa-packs', 'Hot or cold packs', 'uk-oa-treat', ['Applying hot or cold packs to the joints can relieve the pain and symptoms of osteoarthritis in some people.'])],
      meds: [
        it('gb-oa-paracetamol', 'Paracetamol', 'uk-oa-treat', ['If you have pain caused by osteoarthritis, your GP might suggest you consider taking paracetamol for short-term pain relief.']),
        it('gb-oa-nsaid', 'NSAID', 'uk-oa-treat', ['A GP may prescribe a non-steroidal anti-inflammatory drug (NSAID).']),
        it('gb-oa-capsaicin', 'Capsaicin cream', 'uk-oa-treat', ['Capsaicin cream works by blocking the nerves that send pain messages in the treated area.']),
        it('gb-oa-steroid', 'Steroid injections', 'uk-oa-treat', ["Some people with osteoarthritis may be offered steroid injections when other treatments haven't worked."]),
      ],
    },
    CA: {
      activity: [
        it('ca-oa-swim', 'Swimming or walking', 'ca-hlbc-oa', ["Try exercises that don't put a lot of stress on your joints, such as swimming or walking."]),
        it('ca-oa-weight', 'Losing weight', 'ca-hlbc-oa', ['Losing weight can decrease the symptoms of arthritis and allow you to be more active.']),
        it('ca-oa-sleep', 'Sleep', 'ca-hlbc-oa', ['Good sleep can help your mood and help you cope with pain.']),
      ],
      home: [it('ca-oa-compress', 'Warm compresses or cold packs', 'ca-hlbc-oa', ['For example, you might try warm compresses or cold packs.'])],
      meds: [
        it('ca-oa-nsaids', 'NSAIDs, such as ibuprofen or naproxen', 'ca-hlbc-oa', ['These include non-steroidal anti-inflammatory drugs (NSAIDs), such as ibuprofen (Advil or Motrin) or naproxen (Aleve).'], ['ibuprofen']),
        it('ca-oa-acetaminophen', 'Acetaminophen', 'ca-hlbc-oa', ['Acetaminophen, such as Tylenol, may also help.']),
        it('ca-oa-tramadol', 'Tramadol', 'ca-hlbc-oa', ['Pain medicine called tramadol.']),
      ],
    },
  },
  depression: {
    US: {
      avoid: [it('us-dep-alcohol', 'Alcohol, nicotine, or drugs', 'us-nimh-depression', ['Avoid using alcohol, nicotine, or drugs, including medications not prescribed for you.'])],
      activity: [
        it('us-dep-activity', 'Physical activity', 'us-nimh-depression', ['Try to get physical activity.']),
        it('us-dep-bedtime', 'Regular bedtime and wake-up time', 'us-nimh-depression', ['Try to maintain a regular bedtime and wake-up time.']),
      ],
      meds: [it('us-dep-antidepressants', 'Antidepressants', 'us-nimh-depression', ['Antidepressants are medications commonly used to treat depression.'])],
    },
    GB: {
      activity: [it('gb-dep-exercise', 'Exercise', 'uk-depression-treat', ["There's evidence that exercise can help depression, and it's one of the main treatments for mild depression."])],
      meds: [it('gb-dep-tcas', 'TCAs: imipramine and amitriptyline', 'uk-depression-treat', ['TCAs, including imipramine (Imipramil) and amitriptyline, have been around for longer than SSRIs.'])],
    },
    CA: {},
  },
  // Batch 6 (read 2026-11-18): osteoporosis, anxiety, dementia, acid reflux, rheumatoid arthritis. All new sources are in PENDING_SOURCES until the verify script says OK.
  // US anxiety (NIMH page has no advice lines), US and UK dementia (no usable lines on the pages read): checked, tiles say so.
  osteoporosis: {
    US: {
      moderate: [it('us-osteo-alcohol', 'Alcohol in moderation', 'us-niams-osteo', ['Drink alcohol in moderation, no more than one drink a day for women and no more than two drinks a day for men.'])],
      activity: [
        it('us-osteo-strength', 'Strength or resistance training', 'us-niams-osteo', ['Research shows that the best physical activities for bone health include strength training or resistance training.']),
        it('us-osteo-impact', 'High-impact exercise', 'us-niams-osteo', ['If you have osteoporosis, you should avoid high-impact exercise.']),
        it('us-osteo-smoke', 'If you smoke, quit', 'us-niams-osteo', ['Avoid secondhand smoke, and if you smoke, quit.']),
      ],
      home: [
        it('us-osteo-cane', 'Cane or walker', 'us-niams-osteo', ['Use a cane or walker for added stability.']),
        it('us-osteo-clutter', 'Keep rooms free of clutter', 'us-niams-osteo', ['Keep rooms free of clutter, especially on floors.']),
      ],
      meds: [it('us-osteo-bisph', 'Bisphosphonates', 'us-niams-osteo', ['Several bisphosphonates are approved to help preserve bone density and strength and to treat osteoporosis.'])],
    },
    GB: {
      moderate: [it('gb-osteo-alcohol', 'Too much alcohol', 'uk-osteo-treat', ['do not drink too much alcohol'])],
      activity: [
        it('gb-osteo-exercise', 'Exercise regularly', 'uk-osteo-treat', ['exercise regularly – include weight-bearing exercise, strengthening exercises and balance exercises']),
        it('gb-osteo-smoke', 'Do not smoke', 'uk-osteo-treat', ['do not smoke']),
        it('gb-osteo-calcium', 'Food high in calcium', 'uk-osteo-treat', ['eat plenty of food high in calcium, and take a calcium supplement if your doctor prescribes it']),
        it('gb-osteo-vitd', 'Vitamin D from sunlight and a supplement', 'uk-osteo-treat', ['get enough vitamin D from sunlight in summer and from a supplement in winter']),
      ],
    },
    CA: {
      moderate: [it('ca-osteo-alcohol', 'Drink less alcohol', 'ca-hlbc-osteo', ['If you drink alcohol, try to drink less.'])],
      activity: [
        it('ca-osteo-weight', 'Weight-bearing exercise', 'ca-hlbc-osteo', ['Do weight-bearing exercise. This will help you build strong bones.']),
        it('ca-osteo-smoke', "Don't smoke", 'ca-hlbc-osteo', ["Don't smoke, and limit how much alcohol you drink."]),
      ],
      home: [it('ca-osteo-falls', 'Protect yourself from falling', 'ca-hlbc-osteo', ["It's also important to protect yourself from falling."])],
      meds: [it('ca-osteo-bisph', 'Alendronate, risedronate, and zoledronic acid', 'ca-hlbc-osteo', ['Examples are alendronate (Fosamax), risedronate (Actonel), and zoledronic acid (Aclasta).'])],
    },
  },
  anxiety: {
    US: {},
    GB: {
      moderate: [
        it('gb-anx-caffeine', 'Lots of coffee, tea, cola or energy drinks', 'uk-gad-selfhelp', ['do not drink lots of coffee, tea, cola or energy drinks']),
        it('gb-anx-substances', 'Alcohol, cigarettes, gambling or drugs', 'uk-gad-selfhelp', ['do not use alcohol, cigarettes, gambling or drugs to relieve anxiety as these can all contribute to poor mental health']),
      ],
      activity: [
        it('gb-anx-exercise', 'Running, walking, swimming and yoga', 'uk-gad-selfhelp', ['activities such as running, walking, swimming and yoga can reduce anxiety and stress']),
        it('gb-anx-sleep', 'Enough sleep', 'uk-gad-selfhelp', ['try to get enough sleep – this can help you have the energy you need to cope with difficult feelings and experiences']),
        it('gb-anx-relax', 'Calming breathing exercises', 'uk-gad-selfhelp', ['learn how to relax using calming breathing exercises']),
      ],
      meds: [it('gb-anx-ssri', 'Medicines that can help to treat anxiety', 'uk-gad-selfhelp', ['medicines that can help to treat anxiety – usually a type of antidepressant called an SSRI'])],
    },
    CA: {
      meds: [it('ca-anx-meds', 'Medicines and/or counselling', 'ca-hlbc-anxiety', ['These disorders can be treated with medicines and/or counselling.'])],
    },
  },
  dementia: {
    US: {},
    GB: {},
    CA: {
      activity: [
        it('ca-dem-exercise', 'Exercise such as walking', 'ca-hlbc-alz', ['Exercise such as walking may slow the decline of your mental abilities.']),
        it('ca-dem-diet', 'Whole grains, fruits, and vegetables', 'ca-hlbc-alz', ['Get plenty of whole grains, fruits, and vegetables every day.']),
        it('ca-dem-nap', 'Do not nap during the day', 'ca-hlbc-alz', ['If you have trouble sleeping, do not nap during the day.']),
        it('ca-dem-schedule', 'Schedule activities and tasks', 'ca-hlbc-alz', ['Schedule activities and tasks for times of the day when you are best able to handle them.']),
      ],
      meds: [
        it('ca-dem-chol', 'Cholinesterase inhibitors', 'ca-hlbc-alz', ["Cholinesterase inhibitors treat symptoms of mental decline in people who have mild to moderate Alzheimer's disease."]),
        it('ca-dem-memantine', 'Memantine', 'ca-hlbc-alz', ['Memantine treats more severe symptoms of confusion and memory loss.']),
      ],
    },
  },
  'acid-reflux': {
    US: {
      avoid: [it('us-gerd-certain', 'Certain foods or drinks', 'us-niddk-gerd-eat', ['Your doctor may recommend reducing or avoiding certain foods or drinks to see if GERD symptoms improve.'], undefined, [
        { src: 'us-niddk-gerd-eat', quote: 'Some people who have GERD find that certain foods or drinks trigger symptoms or make symptoms worse.', list: true, foods: ['acidic foods, such as citrus fruits and tomatoes', 'alcoholic drinks', 'chocolate', 'coffee and other sources of caffeine', 'high-fat foods', 'mint', 'spicy foods'] },
      ])],
      activity: [
        it('us-gerd-3h', 'Meals at least 3 hours before bed', 'us-niddk-gerd-eat', ['eating meals at least 3 hours before you lie down or go to bed may improve symptoms.']),
        it('us-gerd-weight', 'Weight', 'us-niddk-gerd-eat', ['If you are overweight or have obesity, your doctor may suggest losing weight to reduce your GERD symptoms.']),
        it('us-gerd-quit', 'Quitting smoking, if you smoke', 'us-niddk-gerd-treat', ['quitting smoking, if you smoke']),
      ],
      home: [it('us-gerd-wedge', 'Elevating your head during sleep', 'us-niddk-gerd-treat', ['elevating your head during sleep by placing a foam wedge or extra pillows'])],
      meds: [
        it('us-gerd-antacids', 'Antacids', 'us-niddk-gerd-treat', ['Doctors may recommend antacids to relieve mild heartburn and other mild GER and GERD symptoms.']),
        it('us-gerd-h2', 'H2 blockers', 'us-niddk-gerd-treat', ['H2 blockers lower the amount of acid your stomach makes.']),
        it('us-gerd-ppi', 'PPIs', 'us-niddk-gerd-treat', ['PPIs lower the amount of acid your stomach makes.']),
      ],
    },
    GB: {
      moderate: [
        it('gb-reflux-triggers', 'Food and drink that triggers your symptoms', 'uk-reflux', ['do not have food or drink that triggers your symptoms'], undefined, [
          { src: 'uk-reflux', quote: 'certain food and drink – such as coffee, tomatoes, alcohol, chocolate and fatty or spicy foods', foods: ['coffee', 'tomatoes', 'alcohol', 'chocolate'] },
        ]),
        it('gb-reflux-alcohol', 'Too much alcohol', 'uk-reflux', ['do not drink too much alcohol']),
      ],
      activity: [
        it('gb-reflux-meals', 'Smaller, more frequent meals', 'uk-reflux', ['eat smaller, more frequent meals']),
        it('gb-reflux-bed', 'Not within 3 or 4 hours before bed', 'uk-reflux', ['do not eat within 3 or 4 hours before bed']),
        it('gb-reflux-weight', 'Lose weight if overweight', 'uk-reflux', ["try to lose weight if you're overweight"]),
        it('gb-reflux-smoke', 'Do not smoke', 'uk-reflux', ['do not smoke']),
      ],
      meds: [
        it('gb-reflux-antacids', 'Antacids or alginates', 'uk-reflux', ['They may recommend medicines called antacids or alginates that can help ease your symptoms.']),
        it('gb-reflux-ppi', 'Proton pump inhibitor', 'uk-reflux', ['a medicine called a proton pump inhibitor (PPI) that reduces how much acid your stomach makes.']),
      ],
    },
    CA: {
      moderate: [it('ca-gerd-foods', 'Chocolate, mint, alcohol, pepper, spicy foods, high-fat foods, caffeine drinks', 'ca-hlbc-gerd-habits', ['These may include chocolate, mint, alcohol, pepper, spicy foods, high-fat foods, or drinks with caffeine in them'], undefined, [
        { src: 'ca-hlbc-gerd-habits', quote: 'These may include chocolate, mint, alcohol, pepper, spicy foods, high-fat foods, or drinks with caffeine in them', foods: ['chocolate', 'mint', 'alcohol', 'pepper', 'spicy foods', 'high-fat foods'] },
      ])],
      activity: [
        it('ca-gerd-small', 'Several small meals', 'ca-hlbc-gerd-habits', ["It's best to eat several small meals instead of two or three large meals."]),
        it('ca-gerd-wait', 'Wait before you lie down', 'ca-hlbc-gerd-habits', ['After you eat, wait 2 to 3 hours before you lie down.']),
        it('ca-gerd-tobacco', 'Do not smoke or chew tobacco', 'ca-hlbc-gerd-habits', ['Do not smoke or chew tobacco.']),
      ],
      meds: [
        it('ca-gerd-antacids', 'Antacids', 'ca-hlbc-gerd', ['Antacids neutralize stomach acid and relieve heartburn.']),
        it('ca-gerd-h2', 'H2 blockers', 'ca-hlbc-gerd', ['H2 blockers reduce the amount of acid in the stomach.']),
        it('ca-gerd-ppi', 'PPIs', 'ca-hlbc-gerd', ['PPIs reduce the amount of acid in the stomach.']),
      ],
    },
  },
  'rheumatoid-arthritis': {
    US: {
      activity: [
        it('us-ra-exercise', 'Low-impact exercises', 'us-niams-ra', ['Doctors may sometimes recommend low-impact exercises, such as water exercise programs.']),
        it('us-ra-weight', 'Maintaining weight', 'us-niams-ra', ['Maintaining a healthy weight to help lower the stress on your joints.']),
      ],
      home: [it('us-ra-rest', 'Shorter rest breaks', 'us-niams-ra', ['In general, shorter rest breaks every now and then are more helpful than long times spent in bed.'])],
      meds: [
        it('us-ra-dmards', 'DMARDs', 'us-niams-ra', ['Disease-modifying antirheumatic drugs (DMARDs) that can help to slow or change the progression of the disease.']),
        it('us-ra-antiinflam', 'Anti-inflammatory medications', 'us-niams-ra', ['Anti-inflammatory medications to provide pain relief and lower inflammation.']),
        it('us-ra-steroids', 'Corticosteroids', 'us-niams-ra', ['Corticosteroids that can help decrease inflammation, provide some pain relief, and slow joint damage.']),
        it('us-ra-biologics', 'Biologic response modifiers', 'us-niams-ra', ['Biologic response modifiers, which are also DMARDs, if your disease does not respond to initial therapies.']),
      ],
    },
    GB: {
      activity: [it('gb-ra-physio', 'Physiotherapist', 'uk-ra-treat', ['A physiotherapist may help you improve your fitness and muscle strength, and make your joints more flexible.'])],
      meds: [
        it('gb-ra-steroids', 'Steroids', 'uk-ra-treat', ['Steroids are powerful medicines that can help reduce pain, stiffness and inflammation.']),
        it('gb-ra-methotrexate', 'Methotrexate', 'uk-ra-treat', ["It's important to take methotrexate as instructed by your doctor, and see your doctor if you have any side effects."]),
      ],
    },
    CA: {
      activity: [
        it('ca-ra-eat', 'Variety of foods', 'ca-hlbc-ra', ['Try to eat a variety of healthy foods.']),
        it('ca-ra-calcium', 'Calcium and vitamin D', 'ca-hlbc-ra', ['Be sure to get enough calcium and vitamin D to protect your bones against osteoporosis.']),
        it('ca-ra-smoke', 'If you smoke, quit', 'ca-hlbc-ra', ['So, if you smoke, quit.']),
        it('ca-ra-weight', 'Lose weight if overweight', 'ca-hlbc-ra', ['Lose weight, if you are overweight.']),
      ],
      home: [
        it('ca-ra-rest', 'Make time to rest', 'ca-hlbc-ra', ['Make time to rest.']),
        it('ca-ra-heat', 'Heat therapy', 'ca-hlbc-ra', ['Joint pain and stiffness may improve with heat therapy, such as:']),
      ],
      meds: [
        it('ca-ra-dmards', 'DMARDs', 'ca-hlbc-ra', ['disease-modifying antirheumatic drugs (DMARDs) can slow or sometimes prevent joints from being destroyed.']),
        it('ca-ra-nsaids', 'Aspirin, ibuprofen, and naproxen', 'ca-hlbc-ra', ['These include aspirin, ibuprofen, and naproxen.']),
        it('ca-ra-prednisone', 'Prednisone', 'ca-hlbc-ra', ['An example is prednisone.']),
      ],
    },
  },
  // Batch 7 (read 2026-11-18): irritable bowel syndrome, insomnia, low back pain, underactive thyroid, Parkinson's disease. Canada insomnia: the HealthLink BC page read has no usable line. All new sources are in PENDING_SOURCES until the verify script says OK.
  ibs: {
    US: {
      moderate: [
        it('us-ibs-fodmap', 'Low FODMAP diet', 'us-niddk-ibs-eat', ['Your doctor may suggest that you try the low FODMAP diet for a few weeks to see if it helps with your symptoms.'], undefined, [
          { src: 'us-niddk-ibs-eat', quote: 'Examples of foods that contain FODMAPs include', list: true, foods: ['honey and foods with high-fructose corn syrup', 'dairy products such as milk, milk products, soft cheeses, yogurt, custard, and ice cream'] },
        ]),
        it('us-ibs-fiber-much', 'Too much fiber at once', 'us-niddk-ibs-eat', ['Too much fiber at once can cause gas, which can trigger IBS symptoms.']),
      ],
      activity: [
        it('us-ibs-fiber-slowly', 'Add fiber a little at a time', 'us-niddk-ibs-eat', ['To help your body get used to more fiber, add foods with fiber to your diet a little at a time.']),
        it('us-ibs-active', 'Increasing your physical activity', 'us-niddk-ibs-treat', ['increasing your physical activity']),
        it('us-ibs-stress', 'Reducing stressful life situations', 'us-niddk-ibs-treat', ['reducing stressful life situations as much as possible']),
        it('us-ibs-sleep', 'Getting enough sleep', 'us-niddk-ibs-treat', ['getting enough sleep']),
      ],
      meds: [
        it('us-ibs-fibersupp', 'Fiber supplements', 'us-niddk-ibs-treat', ["fiber supplements, when increasing fiber in your diet doesn't help"]),
        it('us-ibs-antidep', 'Low-dose antidepressants', 'us-niddk-ibs-treat', ['such as low doses of tricyclic antidepressants and selective serotonin reuptake inhibitors']),
      ],
    },
    GB: {
      moderate: [
        it('gb-ibs-caffeine', 'Tea, coffee or other caffeinated drink', 'uk-ibs-diet', ['do not drink more than 3 cups of tea, coffee or any other caffeinated drink a day']),
        it('gb-ibs-alcohol', 'Alcohol or fizzy drinks', 'uk-ibs-diet', ['do not drink lots of alcohol or fizzy drinks']),
        it('gb-ibs-fatty', 'Fatty, spicy or processed foods', 'uk-ibs-diet', ['do not eat lots of fatty, spicy or processed foods']),
        it('gb-ibs-fibre', 'High-fibre foods', 'uk-ibs-diet', ['cut down on high-fibre foods like wholegrain foods (such as brown bread and brown rice), nuts and seeds']),
      ],
      activity: [
        it('gb-ibs-meals', 'Do not delay or skip meals', 'uk-ibs-diet', ['do not delay or skip meals']),
        it('gb-ibs-quickly', 'Do not eat too quickly', 'uk-ibs-diet', ['do not eat too quickly']),
        it('gb-ibs-exercise', 'Plenty of exercise', 'uk-ibs-diet', ['get plenty of exercise']),
      ],
      meds: [
        it('gb-ibs-buscopan', 'Buscopan or peppermint oil', 'uk-ibs-diet', ['ask a pharmacist about medicines that can help, like Buscopan or peppermint oil']),
        it('gb-ibs-loperamide', 'Loperamide (Imodium)', 'uk-ibs-diet', ['ask a pharmacist about medicines that can help, like loperamide (Imodium)']),
        it('gb-ibs-laxatives', 'Laxatives, like Fybogel', 'uk-ibs-diet', ['ask a pharmacist about medicines that can help (laxatives), like Fybogel']),
      ],
    },
    CA: {
      activity: [
        it('ca-ibs-fibre', 'Slowly increase fibre', 'ca-hlbc-ibs', ['Slowly increase the amount of fibre you eat.']),
        it('ca-ibs-time', 'Plenty of time to eat', 'ca-hlbc-ibs', ['Give yourself plenty of time to eat, rather than eating on the go.']),
        it('ca-ibs-exercise', 'Exercise every day', 'ca-hlbc-ibs', ['Get some exercise every day.']),
      ],
      meds: [it('ca-ibs-fibresupp', 'Fibre supplement', 'ca-hlbc-ibs', ['Take a fibre supplement, such as Benefibre or Metamucil, every day if needed.'])],
    },
  },
  insomnia: {
    US: {
      avoid: [
        it('us-ins-caffeine', 'Caffeine, nicotine, and alcohol', 'us-nhlbi-insomnia', ['Avoid caffeine, nicotine, and alcohol close to your bedtime.']),
        it('us-ins-naps', 'Naps', 'us-nhlbi-insomnia', ['Avoid naps, especially in the afternoon.']),
        it('us-ins-screens', 'TV or electronic devices', 'us-nhlbi-insomnia', ['Avoid watching TV or looking at electronic devices, as the light from these sources can disrupt your sleep-wake cycle.']),
      ],
      moderate: [it('us-ins-exercise', 'Exercising close to bedtime', 'us-nhlbi-insomnia', ['Exercising close to bedtime can make it harder to fall asleep.'])],
      activity: [it('us-ins-routine', 'Routine before bed', 'us-nhlbi-insomnia', ['Follow a routine that helps you wind down and relax before bed.'])],
      home: [it('us-ins-bedroom', 'Cool, quiet, dark place', 'us-nhlbi-insomnia', ['Sleep in a cool, quiet, dark place.'])],
      meds: [it('us-ins-meds', 'Insomnia medicines', 'us-nhlbi-insomnia', ['Talk to your doctor about the benefits and side effects of insomnia medicines.'])],
    },
    GB: {
      moderate: [
        it('gb-ins-substances', 'Alcohol, tea or coffee before going to bed', 'uk-insomnia', ['do not smoke or drink alcohol, tea or coffee at least 6 hours before going to bed']),
        it('gb-ins-exercise-late', 'Exercise before bed', 'uk-insomnia', ['do not exercise at least 4 hours before bed']),
        it('gb-ins-screens', 'Television or devices before going to bed', 'uk-insomnia', ['do not watch television or use devices, like smartphones, right before going to bed']),
      ],
      activity: [
        it('gb-ins-nap', 'Do not nap during the day', 'uk-insomnia', ['do not nap during the day']),
        it('gb-ins-exercise', 'Exercise regularly during the day', 'uk-insomnia', ['exercise regularly during the day']),
        it('gb-ins-relax', 'Relax before bed', 'uk-insomnia', ['relax at least 1 hour before bed – for example, take a bath or read a book']),
      ],
      home: [it('gb-ins-bedroom', 'Dark and quiet bedroom', 'uk-insomnia', ['make sure your bedroom is dark and quiet – use curtains, blinds, an eye mask or ear plugs if needed'])],
      meds: [it('gb-ins-check', 'Check with your doctor before taking anything for sleep problems', 'uk-insomnia', ['Check with your doctor before taking anything for your sleep problems.'])],
    },
    CA: {},
  },
  'low-back-pain': {
    US: {
      avoid: [it('us-back-bedrest', 'Bedrest', 'us-niams-back', ['Avoid bedrest; instead, limit activities or exercise that cause pain.'])],
      activity: [
        it('us-back-gradual', 'Gradually increase physical activity', 'us-niams-back', ['Gradually increase physical activity as tolerated.']),
        it('us-back-exercise', 'Regular exercise', 'us-niams-back', ['Perform regular exercise that keeps your back muscles strong.']),
      ],
      meds: [
        it('us-back-antiinflam', 'Anti-inflammatory drugs', 'us-niams-back', ['Anti-inflammatory drugs taken by mouth to relieve pain and inflammation.']),
        it('us-back-relaxants', 'Muscle relaxants', 'us-niams-back', ['Muscle relaxants for some types of chronic back pain from muscle tension.']),
      ],
    },
    GB: {
      moderate: [it('gb-back-bed', 'Bed for long periods of time', 'uk-back-pain', ['do not stay in bed for long periods of time'])],
      activity: [
        it('gb-back-active', 'Stay active', 'uk-back-pain', ['stay active and try to continue with your daily activities']),
        it('gb-back-stretches', 'Exercises and stretches', 'uk-back-pain', ['try doing some exercises and stretches for back pain']),
      ],
      home: [
        it('gb-back-ice', 'Ice pack', 'uk-back-pain', ['use an ice pack (or bag of frozen peas) wrapped in a tea towel to reduce pain and swelling']),
        it('gb-back-heat', 'Heat pack', 'uk-back-pain', ['use a heat pack (or hot water bottle) wrapped in a tea towel to relieve joint stiffness or muscle spasms']),
      ],
      meds: [it('gb-back-paracetamol', 'Paracetamol on its own', 'uk-back-pain', ['paracetamol on its own is not recommended for back pain but it may be used with another painkiller'])],
    },
    CA: {
      activity: [
        it('ca-back-walk', 'Gentle exercise, such as walking', 'ca-hlbc-back', ['Get gentle exercise, such as walking.']),
        it('ca-back-active', 'Exercise and be active', 'ca-hlbc-back', ['Exercise and be active to keep your back healthy and strong.']),
      ],
      home: [it('ca-back-heat', 'Heat or ice', 'ca-hlbc-back', ['Using heat or ice and taking over-the-counter pain medicine also can help while your body heals.'])],
      meds: [
        it('ca-back-nsaids', 'NSAIDs: ibuprofen and naproxen', 'ca-hlbc-back', ['Non-steroidal anti-inflammatory drugs (NSAIDs) such as ibuprofen and naproxen.']),
        it('ca-back-acet', 'Acetaminophen', 'ca-hlbc-back', ["But if you can't take NSAIDs, you can try acetaminophen instead."]),
      ],
    },
  },
  'underactive-thyroid': {
    US: {
      meds: [
        it('us-hypo-levo', 'Levothyroxine', 'us-niddk-hypo', ['You will take levothyroxine, a thyroid hormone medicine identical to a hormone a healthy thyroid makes.']),
        it('us-hypo-morning', 'Taking the medicine in the morning', 'us-niddk-hypo', ['Your doctor may recommend taking the medicine in the morning before eating.']),
        it('us-hypo-stop', 'Never stop taking your medicine', 'us-niddk-hypo', ['Never stop taking your medicine without talking with your doctor first.']),
      ],
    },
    GB: {
      meds: [
        it('gb-hypo-levo', 'Levothyroxine tablets', 'uk-thyroid', ['This medicine is usually levothyroxine tablets.']),
        it('gb-hypo-life', 'Take them for the rest of your life', 'uk-thyroid', ["You'll usually need to take them for the rest of your life to prevent your symptoms returning."]),
      ],
    },
    CA: {
      activity: [it('ca-hypo-care', 'Get enough sleep and regular exercise', 'ca-hlbc-hypo', ['Take care of yourself. Eat a healthy diet, get enough sleep, and get regular exercise.'])],
      meds: [
        it('ca-hypo-levo', 'Levothyroxine', 'ca-hlbc-hypo', ['Your doctor will treat your low thyroid level with the thyroid pills levothyroxine.']),
        it('ca-hypo-breakfast', 'Medicine before breakfast', 'ca-hlbc-hypo', ['Take the medicine 30 minutes before breakfast, and do not take it with calcium, vitamins, or iron.']),
      ],
    },
  },
  parkinsons: {
    US: {
      moderate: [it('us-pd-protein', 'Too much protein', 'us-ninds-pd', ["Too much protein may limit a person's ability to absorb PD medicines like carbidopa-levodopa."])],
      activity: [
        it('us-pd-exercise', 'Exercise', 'us-ninds-pd', ['Exercise can improve flexibility, balance, strength, and the ability to move.']),
        it('us-pd-fiber', 'Fiber-rich diet and plenty of fluids', 'us-ninds-pd', ['Eating a fiber-rich diet and drinking plenty of fluids can help with constipation.']),
      ],
      meds: [it('us-pd-levodopa', 'Levodopa', 'us-ninds-pd', ['Once in the brain, levodopa is converted to dopamine.'])],
    },
    GB: {
      activity: [
        it('gb-pd-physio', 'Physiotherapist', 'uk-pd-treat', ['The physiotherapist aims to make moving easier and improve your walking and flexibility.']),
        it('gb-pd-diet', 'Dietary changes', 'uk-pd-treat', ["For some people with Parkinson's disease, making dietary changes can help improve some symptoms."]),
      ],
      meds: [
        it('gb-pd-levodopa', 'Levodopa', 'uk-pd-treat', ["Most people with Parkinson's disease eventually need a medication called levodopa."]),
        it('gb-pd-comt', 'COMT inhibitors', 'uk-pd-treat', ["Catechol-O-methyltransferase (COMT) inhibitors are prescribed for people in later stages of Parkinson's disease."]),
      ],
    },
    CA: {
      activity: [
        it('ca-pd-exercise', 'Exercise', 'ca-hlbc-pd', ['Exercise is an important treatment for this condition.']),
        it('ca-pd-therapists', 'Therapists', 'ca-hlbc-pd', ['Therapists may help you improve your walking and reduce your risk of falling.']),
      ],
      meds: [
        it('ca-pd-levodopa', 'Levodopa', 'ca-hlbc-pd', ['Levodopa works best to control movement symptoms.']),
        it('ca-pd-agonists', 'Dopamine agonists', 'ca-hlbc-pd', ['Dopamine agonists also help movement symptoms.']),
      ],
    },
  },
  // Batch 8 (read 2026-11-18): diverticular disease, urinary tract infection, glaucoma and cataracts, flu, gum disease. Gaps: no US page read for glaucoma/cataracts or gum disease; no Canadian page with usable lines for glaucoma/cataracts, flu or gum disease. All new sources are in PENDING_SOURCES until the verify script says OK.
  'diverticular-disease': {
    US: {
      moderate: [it('us-div-redmeat', 'Eating less red meat', 'us-niddk-divert-eat', ['Eating high-fiber foods and eating less red meat may lower the risk.'])],
      activity: [
        it('us-div-active', 'Physically active on a regular basis', 'us-niddk-divert-treat', ['being physically active on a regular basis']),
        it('us-div-weight', 'Reaching and maintaining weight', 'us-niddk-divert-treat', ['reaching and maintaining a healthy weight']),
        it('us-div-smoke', 'Not smoking, or quitting smoking', 'us-niddk-divert-treat', ['not smoking, or quitting smoking if you smoke']),
      ],
      meds: [
        it('us-div-pain', 'Antispasmodics or acetaminophen', 'us-niddk-divert-treat', ['Doctors may recommend antispasmodics or acetaminophen instead of nonsteroidal anti-inflammatory drugs (NSAIDs).']),
        it('us-div-nsaids', 'NSAIDs', 'us-niddk-divert-treat', ['NSAIDs may increase the chance of diverticulitis complications.']),
      ],
    },
    GB: {
      activity: [
        it('gb-div-fibre', 'Slowly increase fibre', 'uk-diverticular', ['slowly increase how much fibre you eat']),
        it('gb-div-diet', 'Balanced diet including whole grains, fruits and vegetables', 'uk-diverticular', ['eat a healthy, balanced diet including whole grains, fruits and vegetables']),
        it('gb-div-weight', 'Maintain weight', 'uk-diverticular', ['maintain a healthy weight']),
        it('gb-div-smoke', 'Stop smoking', 'uk-diverticular', ['stop smoking if you smoke']),
      ],
      meds: [
        it('gb-div-nsaids', 'NSAIDs (such as ibuprofen)', 'uk-diverticular', ['do not take NSAIDs (such as ibuprofen)']),
        it('gb-div-antibiotics', 'Antibiotics', 'uk-diverticular', ['antibiotics if the diverticulitis is caused by an infection']),
      ],
    },
    CA: {
      moderate: [it('ca-div-laxatives', 'Laxatives or enemas', 'ca-hlbc-divert', ['Do not use laxatives or enemas unless your doctor tells you to use them.'])],
      activity: [
        it('ca-div-fluids', 'Drink plenty of fluids', 'ca-hlbc-divert', ['Drink plenty of fluids.']),
        it('ca-div-liquids', 'Liquids or small amounts of food', 'ca-hlbc-divert', ['Stay with liquids or start with small amounts of food until you are feeling better.']),
      ],
      meds: [it('ca-div-antibiotics', 'Antibiotics', 'ca-hlbc-divert', ['If your doctor prescribed antibiotics, take them as directed.'])],
    },
  },
  uti: {
    US: {
      activity: [
        it('us-uti-liquids', 'Drinking enough liquids', 'us-niddk-uti-eat', ['Drinking enough liquids can keep you hydrated and help prevent or relieve bladder infections.']),
        it('us-uti-water', 'Water', 'us-niddk-uti-eat', ['Water is best.']),
      ],
      home: [it('us-uti-heating', 'Heating pad', 'us-niddk-uti-treat', ['A heating pad on your back or abdomen may help you ease pain from a bladder infection.'])],
      meds: [
        it('us-uti-antibiotics', 'Antibiotics', 'us-niddk-uti-treat', ['If you have a bladder infection caused by bacteria, your health care professional will likely prescribe antibiotics.']),
        it('us-uti-pain', 'Ibuprofen or acetaminophen', 'us-niddk-uti-treat', ['You may be asked to use medicine such as ibuprofen or acetaminophen.']),
      ],
    },
    GB: {
      avoid: [it('gb-uti-drinks', 'Drinks that may irritate your bladder', 'uk-uti', ['avoid drinks that may irritate your bladder, like fruit juices, coffee and alcohol'], undefined, [
        { src: 'uk-uti', quote: 'avoid drinks that may irritate your bladder, like fruit juices, coffee and alcohol', foods: ['fruit juices', 'coffee', 'alcohol'] },
      ])],
      moderate: [it('gb-uti-soap', 'Scented soap', 'uk-uti', ['do not use scented soap around the genital area'])],
      activity: [it('gb-uti-fluids', 'Plenty of fluids, particularly water', 'uk-uti', ['drink plenty of fluids, particularly water, so that you regularly pee during the day and do not feel thirsty'])],
      meds: [it('gb-uti-antibiotics', 'Take all the medicine you are prescribed', 'uk-uti', ["It's important to take all the medicine you are prescribed, even if you start to feel better."])],
    },
    CA: {
      meds: [it('ca-uti-antibiotics', 'Antibiotics', 'ca-hlbc-uti', ["They're caused by bacteria and can be cured with antibiotics."])],
    },
  },
  'glaucoma-cataracts': {
    US: {},
    GB: {
      activity: [it('gb-glau-appointments', 'Regular eye clinic appointments', 'uk-glaucoma', ['For many people this includes using eye drops daily and attending regular eye clinic appointments.'])],
      home: [it('gb-cat-light', 'Stronger glasses and brighter light', 'uk-cataracts', ['Using stronger glasses and brighter light for reading may help for a while.'])],
      meds: [it('gb-glau-drops', 'Eye drops', 'uk-glaucoma', ['eye drops – to decrease the amount of fluid in the eye and help it drain'])],
    },
    CA: {},
  },
  influenza: {
    US: {
      avoid: [it('us-flu-home', 'Contact with other people', 'us-cdc-flu-treat', ['Stay home and avoid contact with other people except to get medical care.'])],
      meds: [
        it('us-flu-antivirals', 'Flu antiviral drugs', 'us-cdc-flu-treat', ['Flu antiviral drugs work best when started early, ideally within two days after your flu symptoms begin.']),
        it('us-flu-otc', 'Antiviral drugs are not sold over the counter', 'us-cdc-flu-treat', ['Antiviral drugs are not sold over the counter.']),
      ],
    },
    GB: {
      home: [
        it('gb-flu-rest', 'Rest and sleep', 'uk-flu', ['rest and sleep']),
        it('gb-flu-water', 'Plenty of water', 'uk-flu', ['drink plenty of water to avoid dehydration (your pee should be light yellow or clear)']),
      ],
      meds: [it('gb-flu-painkillers', 'Paracetamol or ibuprofen', 'uk-flu', ['take paracetamol or ibuprofen to lower your temperature and treat aches and pains'])],
    },
    CA: {},
  },
  'dental-disease': {
    US: {},
    GB: {
      moderate: [it('gb-gum-mouthwash', 'Mouthwash straight after brushing your teeth', 'uk-gum', ['do not use mouthwash straight after brushing your teeth'])],
      activity: [
        it('gb-gum-brush', 'Brush with fluoride toothpaste', 'uk-gum', ['brush your teeth with fluoride toothpaste at least twice a day – spit after brushing, do not rinse']),
        it('gb-gum-floss', 'Clean in between your teeth', 'uk-gum', ['clean in between your teeth every day using floss or interdental brushes']),
        it('gb-gum-smoke', 'Do not smoke', 'uk-gum', ['do not smoke']),
        it('gb-gum-dentist', 'See a dentist', 'uk-gum', ["See a dentist if you have not had a check-up for 2 years (or 1 year if you're under 18)."]),
      ],
    },
    CA: {},
  },
  // Batch 9 (read 2026-11-18): pneumonia, common cold, hay fever, migraine and headache, blood clot in a leg vein. Gaps: no US or Canadian hay fever page with usable lines; HealthLink BC migraine page has no usable line. Canada pneumonia pages say little beyond antibiotics. All new sources are in PENDING_SOURCES until the verify script says OK.
  pneumonia: {
    US: {
      meds: [
        it('us-pn-antibiotics', 'Antibiotic treatment', 'us-nhlbi-pneumonia', ['Most people begin to feel better after one to three days of antibiotic treatment.']),
        it('us-pn-cough', 'Cough or cold medicine', 'us-nhlbi-pneumonia', ['Talk to your provider before taking cough or cold medicine.']),
        it('us-pn-otc', 'Over-the-counter medicines', 'us-nhlbi-pneumonia', ['Over-the-counter medicines may be recommended to treat your fever and muscle pain or help you breathe easier.']),
      ],
    },
    GB: {
      activity: [
        it('gb-pn-fluids', 'Drink plenty of fluids', 'uk-pneumonia', ['drink plenty of fluids']),
        it('gb-pn-smoke', 'Do not smoke', 'uk-pneumonia', ['do not smoke']),
        it('gb-pn-hands', 'Wash your hands regularly with water and soap', 'uk-pneumonia', ['wash your hands regularly with water and soap']),
        it('gb-pn-vaccines', 'Vaccines', 'uk-pneumonia', ['There are several vaccines available to help protect you or your child from infections that can cause pneumonia']),
      ],
      meds: [
        it('gb-pn-pain', 'Paracetamol or ibuprofen', 'uk-pneumonia', ['take paracetamol or ibuprofen']),
        it('gb-pn-cough', 'Cough medicine', 'uk-pneumonia', ['do not take cough medicine']),
        it('gb-pn-antibiotics', 'Antibiotics', 'uk-pneumonia', ["If you have pneumonia caused by bacteria, you'll usually be given antibiotics."]),
      ],
    },
    CA: {
      meds: [it('ca-pn-antibiotics', 'Antibiotics', 'ca-hlbc-pneumonia', ['Antibiotics are used to treat pneumonia caused by bacteria.'])],
    },
  },
  'common-cold': {
    US: {
      activity: [
        it('us-cold-rest', 'Get plenty of rest', 'us-cdc-cold', ['Get plenty of rest.']),
        it('us-cold-fluids', 'Drink plenty of fluids', 'us-cdc-cold', ['Drink plenty of fluids.']),
      ],
      meds: [it('us-cold-antibiotics', 'Antibiotics', 'us-cdc-cold', ["Antibiotics don't work against viruses and won't help you feel better."])],
    },
    GB: {
      activity: [
        it('gb-cold-rest', 'Get plenty of rest', 'uk-cold', ['get plenty of rest']),
        it('gb-cold-fluids', 'Drink lots of fluid, such as water', 'uk-cold', ['drink lots of fluid, such as water, to avoid dehydration']),
        it('gb-cold-smoke', 'Do not smoke', 'uk-cold', ['do not smoke as it can make your symptoms worse']),
      ],
      home: [
        it('gb-cold-salt', 'Gargle salt water', 'uk-cold', ['gargle salt water to soothe a sore throat (not suitable for children)']),
        it('gb-cold-lemon', 'Hot lemon and honey drink', 'uk-cold', ['drink a hot lemon and honey drink to soothe a sore throat']),
        it('gb-cold-steam', 'Breathe in steam', 'uk-cold', ['breathe in steam to ease a blocked nose']),
      ],
      meds: [
        it('gb-cold-pain', 'Paracetamol or ibuprofen', 'uk-cold', ['medicines like paracetamol or ibuprofen to ease aches or lower a temperature']),
        it('gb-cold-antibiotics', 'Antibiotics', 'uk-cold', ['Antibiotics only work if you have a bacterial infection, but colds are caused by viruses.']),
        it('gb-cold-aspirin', 'Aspirin for children under 16', 'uk-cold', ['do not give aspirin to children under the age of 16']),
      ],
    },
    CA: {
      activity: [
        it('ca-cold-fluids', 'Drink plenty of fluids', 'ca-hlbc-cold', ['To prevent dehydration, drink plenty of fluids.']),
        it('ca-cold-rest', 'Get plenty of rest', 'ca-hlbc-cold', ['Get plenty of rest.']),
        it('ca-cold-smoke', 'Do not smoke', 'ca-hlbc-cold', ['Do not smoke or allow others to smoke around you.']),
      ],
      home: [
        it('ca-cold-saline', 'Saline nasal washes', 'ca-hlbc-cold', ['Use saline (saltwater) nasal washes to help keep your nasal passages open and wash out mucus and allergens.']),
        it('ca-cold-humidifier', 'Vaporizer or humidifier', 'ca-hlbc-cold', ['Use a vaporizer or humidifier to add moisture to your bedroom.']),
      ],
      meds: [
        it('ca-cold-aspirin', 'Aspirin', 'ca-hlbc-cold', ['No one younger than 18 should take aspirin.']),
        it('ca-cold-tylenol', 'Cold or flu medicines and Tylenol', 'ca-hlbc-cold', ['Be careful when taking over-the-counter cold or influenza (flu) medicines and Tylenol at the same time.']),
      ],
    },
  },
  'hay-fever': {
    US: {},
    GB: {
      moderate: [it('gb-hf-outside', 'Too much time outside', 'uk-hayfever', ['do not spend too much time outside'])],
      activity: [
        it('gb-hf-grass', 'Do not cut grass or walk on grass', 'uk-hayfever', ['do not cut grass or walk on grass']),
        it('gb-hf-clothes', 'Do not dry clothes outside', 'uk-hayfever', ['do not dry clothes outside']),
        it('gb-hf-smoke', 'Do not smoke or be around smoke', 'uk-hayfever', ['do not smoke or be around smoke']),
        it('gb-hf-sunglasses', 'Wraparound sunglasses, a mask or a wide-brimmed hat', 'uk-hayfever', ['wear wraparound sunglasses, a mask or a wide-brimmed hat to stop pollen getting into your nose and eyes']),
      ],
      home: [
        it('gb-hf-jelly', 'Petroleum jelly around your nostrils', 'uk-hayfever', ['put petroleum jelly (such as Vaseline) around your nostrils to trap pollen']),
        it('gb-hf-shower', 'Shower and change your clothes', 'uk-hayfever', ['shower and change your clothes after you have been outside to wash pollen off']),
        it('gb-hf-windows', 'Keep windows and doors shut', 'uk-hayfever', ['keep windows and doors shut as much as possible']),
        it('gb-hf-vacuum', 'Vacuum regularly and dust with a damp cloth', 'uk-hayfever', ['vacuum regularly and dust with a damp cloth']),
      ],
      meds: [
        it('gb-hf-pharmacist', 'Speak to a pharmacist', 'uk-hayfever', ['Speak to a pharmacist if you have hay fever.']),
        it('gb-hf-antihistamine', 'Antihistamine drops, tablets or nasal sprays', 'uk-hayfever', ['antihistamine drops, tablets or nasal sprays']),
        it('gb-hf-steroid', 'Steroid nasal sprays', 'uk-hayfever', ['steroid nasal sprays']),
      ],
    },
    CA: {},
  },
  'migraine-headache': {
    US: {
      activity: [it('us-mig-rest', 'Napping or resting in a quiet, dark room', 'us-ninds-migraine', ['Napping or resting in a quiet, dark room'])],
      home: [it('us-mig-caffeine', 'Small amounts of caffeine', 'us-ninds-migraine', ["Small amounts of caffeine may help relieve symptoms during a migraine episode's early stages."])],
      meds: [
        it('us-mig-acute', 'Acute short-term medicines', 'us-ninds-migraine', ['Acute (short-term) medicines are taken as soon as symptoms begin.']),
        it('us-mig-supplements', 'Dietary supplements', 'us-ninds-migraine', ['Dietary supplements are marketed to relieve migraine symptoms, but many have not been thoroughly tested by researchers.']),
      ],
    },
    GB: {
      avoid: [it('gb-mig-triggers', 'Things you know trigger your migraine attacks', 'uk-migraine', ['try to avoid things you know trigger your migraine attacks'])],
      moderate: [it('gb-mig-caffeine', 'Caffeine and alcohol', 'uk-migraine', ['stay well hydrated, and limit how much caffeine and alcohol you drink'])],
      activity: [
        it('gb-mig-dark', 'Sleeping or lying down in a darkened room', 'uk-migraine', ['try sleeping or lying down in a darkened room during a migraine attack']),
        it('gb-mig-exercise', 'Get regular exercise', 'uk-migraine', ['get regular exercise']),
        it('gb-mig-sleep', 'Get plenty of sleep', 'uk-migraine', ['get plenty of sleep']),
        it('gb-mig-meals', 'Eat meals at regular times', 'uk-migraine', ['eat meals at regular times']),
        it('gb-mig-stress', 'Manage your stress', 'uk-migraine', ['try to manage your stress']),
        it('gb-mig-diary', 'Keep a migraine diary', 'uk-migraine', ['It can help to keep a migraine diary to help you work out what might trigger your migraine attacks.']),
      ],
      meds: [it('gb-mig-painkillers', 'Painkillers', 'uk-migraine', ["If you're taking painkillers, take them as soon as your headache starts."])],
    },
    CA: {},
  },
  'leg-blood-clot': {
    US: {
      activity: [it('us-dvt-moving', 'Keep moving regularly', 'us-nhlbi-vte', ['It is important to keep moving regularly while you are healing.'])],
      meds: [
        it('us-dvt-prescribed', 'Take all medicines as prescribed', 'us-nhlbi-vte', ['Take all medicines as prescribed.']),
        it('us-dvt-stockings', 'Compression stockings', 'us-nhlbi-vte', ['Your provider may prescribe compression stockings to give you relief.']),
        it('us-dvt-alcohol', 'Alcohol and blood-thinning medicine', 'us-nhlbi-vte', ['Alcohol can also be dangerous if you are taking blood-thinning medicine.']),
      ],
    },
    GB: {
      moderate: [it('gb-dvt-alcohol', 'Do not drink lots of alcohol', 'uk-dvt', ['do not drink lots of alcohol'])],
      activity: [
        it('gb-dvt-walk', 'Walk regularly', 'uk-dvt', ['walk regularly if you can']),
        it('gb-dvt-raised', 'Keep your affected leg raised', 'uk-dvt', ["keep your affected leg raised when you're sitting"]),
        it('gb-dvt-sit', 'Do not sit still for long periods', 'uk-dvt', ['do not sit still for long periods of time']),
        it('gb-dvt-fluids', 'Drink plenty of fluids', 'uk-dvt', ['drink plenty of fluids to avoid dehydration']),
        it('gb-dvt-smoke', 'Do not smoke', 'uk-dvt', ['do not smoke']),
        it('gb-dvt-flights', 'Delay flights or long journeys', 'uk-dvt', ['delay any flights or long journeys until at least 2 weeks after you start taking blood-thinning medicine']),
      ],
      meds: [it('gb-dvt-thinners', 'Blood-thinning medicines', 'uk-dvt', ['DVT (deep vein thrombosis) is treated with blood-thinning medicines.'])],
    },
    CA: {
      activity: [
        it('ca-dvt-walk', 'Walk several times a day', 'ca-hlbc-dvt', ['Walk several times a day, if possible.']),
        it('ca-dvt-bed', 'Get out of bed as soon as you can', 'ca-hlbc-dvt', ['Get out of bed as soon as you can after an illness or surgery.']),
        it('ca-dvt-elevate', 'Elevate your leg or arm', 'ca-hlbc-dvt', ['Elevate your leg or arm.']),
        it('ca-dvt-trips', 'Take breaks on long trips', 'ca-hlbc-dvt', ['Take breaks when you are on long trips.']),
      ],
      home: [it('ca-dvt-stockings', 'Compression stockings', 'ca-hlbc-dvt', ['Wear compression stockings if your doctor recommends them.'])],
      meds: [
        it('ca-dvt-anticoag', 'Anticoagulant medicines', 'ca-hlbc-dvt', ['Anticoagulant medicines, also called blood thinners, are used to prevent and treat DVT.']),
        it('ca-dvt-nsaid', 'NSAID', 'ca-hlbc-dvt', ["Do not take an NSAID unless your doctor tells you that it's safe for you."]),
      ],
    },
  },
  // Batch 10 (read 2026-11-18): epilepsy, celiac disease, psoriasis, eczema, multiple sclerosis. Gaps: no UK celiac or Canadian eczema line quoted verbatim (NHS celiac page lists foods only in paraphrase, HealthLink BC eczema page blocks reading); US/CA MS pages say little. Two NIAMS pages show no review date. All new sources are in PENDING_SOURCES until the verify script says OK.
  epilepsy: {
    US: {
      avoid: [it('us-epi-avoid', 'Dehydration, overexertion, and low blood sugar', 'us-ninds-epilepsy', ['Individuals with epilepsy should avoid dehydration, overexertion, and low blood sugar'])],
      activity: [
        it('us-epi-exercise', 'Regular exercise', 'us-ninds-epilepsy', ['regular exercise may improve seizure control in some people']),
        it('us-epi-sleep', 'Treating sleep problems', 'us-ninds-epilepsy', ['Treating sleep problems can help reduce seizures.']),
      ],
      meds: [
        it('us-epi-continue', 'Continue taking antiseizure medication', 'us-ninds-epilepsy', ['It is very important to continue taking antiseizure medication for as long as it is prescribed.']),
        it('us-epi-stop', 'Discontinuing medication', 'us-ninds-epilepsy', ['Discontinuing medication should always be done with supervision of a health care professional.']),
      ],
    },
    GB: {
      moderate: [it('gb-epi-alcohol', 'Too much alcohol', 'uk-epilepsy', ['do not drink too much alcohol, as it can increase the risk of seizures'])],
      activity: [
        it('gb-epi-family', 'Family and friends know what to do', 'uk-epilepsy', ['make sure your family and friends know what to do if you have a seizure']),
        it('gb-epi-id', 'Carry medical ID', 'uk-epilepsy', ['carry medical ID, such as a bracelet or a card that lets people know you have epilepsy']),
        it('gb-epi-showers', 'Showers instead of baths', 'uk-epilepsy', ['have showers instead of baths if you can']),
        it('gb-epi-safety', 'Think about safety', 'uk-epilepsy', ['think about safety when doing activities such as cooking, using tools or machinery, swimming or sports']),
      ],
      meds: [
        it('gb-epi-doses', 'Do not miss doses', 'uk-epilepsy', ['do not miss doses of your epilepsy medicine']),
        it('gb-epi-change', 'Do not change your dose or stop taking your medicine', 'uk-epilepsy', ['Do not change your dose or stop taking your medicine without talking to your specialist.']),
      ],
    },
    CA: {
      activity: [
        it('ca-epi-plan', 'Follow your treatment plan', 'ca-hlbc-epilepsy', ['To help control your seizures, follow your treatment plan.']),
        it('ca-epi-id', 'Wear a medical ID bracelet', 'ca-hlbc-epilepsy', ['Wear a medical ID bracelet.']),
        it('ca-epi-drive', 'Ask your doctor: drive or swim', 'ca-hlbc-epilepsy', ["Ask your doctor if it's safe for you to do things like drive or swim."]),
      ],
      meds: [
        it('ca-epi-prescribed', 'Take medicine exactly as prescribed', 'ca-hlbc-epilepsy', ['If you take medicine to control seizures, take it exactly as prescribed.']),
        it('ca-epi-missing', 'Missing doses', 'ca-hlbc-epilepsy', ['Even missing just a few doses can allow seizures to happen.']),
      ],
    },
  },
  celiac: {
    US: {
      activity: [
        it('us-cel-remove', 'Remove foods and drinks that contain gluten', 'us-niddk-celiac', ['If you have celiac disease, you will need to remove foods and drinks that contain gluten from your diet.']),
        it('us-cel-labels', 'Read food labels', 'us-niddk-celiac', ['carefully read food labels to check for grains that contain gluten']),
        it('us-cel-unsure', 'Foods you are not sure whether they contain gluten', 'us-niddk-celiac', ["don't eat foods if you aren't sure whether they contain gluten"]),
      ],
    },
    GB: {},
    CA: {
      activity: [it('ca-cel-labels', 'Read food labels carefully', 'ca-hlbc-celiac', ['It helps to read food labels carefully and look for hidden gluten.'])],
      meds: [it('ca-cel-medicine', 'Gluten in medicine', 'ca-hlbc-celiac', ['Also look for gluten in medicine and some food additives.'])],
    },
  },
  psoriasis: {
    US: {
      avoid: [it('us-pso-triggers', 'Things that trigger psoriasis flares', 'us-niams-psoriasis', ['Try to identify things that trigger psoriasis flares and work to avoid them.'])],
      moderate: [it('us-pso-alcohol', 'Moderate your use of alcohol', 'us-niams-psoriasis', ['Moderate your use of alcohol.'])],
      activity: [
        it('us-pso-moisture', 'Keep your skin well moisturized', 'us-niams-psoriasis', ['Keep your skin well moisturized.']),
        it('us-pso-smoke', 'Work with your doctor to quit if you smoke', 'us-niams-psoriasis', ['If you smoke, work with your doctor to make a plan to quit.']),
      ],
      home: [
        it('us-pso-bathe', 'Bathe in lukewarm water', 'us-niams-psoriasis', ['Bathe in lukewarm water and use mild soap that has added oils.']),
        it('us-pso-damp', 'Heavy moisturizers while your skin is still damp', 'us-niams-psoriasis', ['After bathing, apply heavy moisturizers while your skin is still damp.']),
      ],
    },
    GB: {
      avoid: [it('gb-pso-triggers', 'Things that make your symptoms worse', 'uk-psoriasis', ['try to avoid the things that make your symptoms worse (triggers)'])],
      moderate: [it('gb-pso-alcohol', 'Too much alcohol', 'uk-psoriasis', ['try not to drink too much alcohol'])],
      activity: [it('gb-pso-smoke', 'Stop smoking', 'uk-psoriasis', ['try to stop smoking, if you smoke'])],
      home: [it('gb-pso-share', 'Do not share your moisturising treatments', 'uk-psoriasis', ['do not share your moisturising treatments (emollients) with anyone else'])],
      meds: [it('gb-pso-severe', 'Light therapy and medicines', 'uk-psoriasis', ['If your psoriasis is more severe, there are other treatments, such as light therapy and medicines.'])],
    },
    CA: {
      avoid: [it('ca-pso-alcohol', 'Alcohol if it causes your symptoms to flare up', 'ca-hlbc-psoriasis', ['Avoid alcohol if it causes your symptoms to flare up.'])],
      activity: [it('ca-pso-smoke', 'Consider quitting if you smoke', 'ca-hlbc-psoriasis', ['If you smoke, consider quitting.'])],
      home: [it('ca-pso-lotions', 'Creams, ointments, and lotions', 'ca-hlbc-psoriasis', ['Creams, ointments, and lotions to moisturize the skin.'])],
      meds: [
        it('ca-pso-trigger', 'Certain medicines can trigger psoriasis', 'ca-hlbc-psoriasis', ['Certain medicines can trigger psoriasis or make symptoms worse.']),
        it('ca-pso-topical', 'Topical medicine', 'ca-hlbc-psoriasis', ['For moderate to severe psoriasis, you may need to use a topical medicine prescribed by your doctor.']),
      ],
    },
  },
  eczema: {
    US: {
      avoid: [it('us-ecz-scratch', 'Scratching or rubbing', 'us-niams-eczema', ['Try to avoid scratching or rubbing, which irritates the skin, increases inflammation, and can increase itchiness.'])],
      activity: [it('us-ecz-routine', 'Daily skin care routine', 'us-niams-eczema', ['Following a daily skin care routine is important and helps prevent flares.'])],
      home: [it('us-ecz-creams', 'Moisturizing creams', 'us-niams-eczema', ['Moisturizing creams can help restore the skin barrier.'])],
      meds: [it('us-ecz-calcineurin', 'Calcineurin inhibitors', 'us-niams-eczema', ['Calcineurin inhibitors applied to the skin decrease inflammation and help prevent flares.'])],
    },
    GB: {
      avoid: [it('gb-ecz-triggers', 'Things that make your eczema worse', 'uk-eczema', ['avoid things that make your eczema worse such as soap, washing detergent, some fabrics or pets'])],
      activity: [
        it('gb-ecz-soap', 'Wash with an emollient instead of soap', 'uk-eczema', ['wash with an emollient instead of soap']),
        it('gb-ecz-scratch', 'Do not scratch your eczema', 'uk-eczema', ['do not scratch your eczema, as it can make it worse']),
        it('gb-ecz-flames', 'Do not smoke or go near naked flames', 'uk-eczema', ['do not smoke or go near naked flames if you use an emollient']),
      ],
      home: [it('gb-ecz-emollients', 'Moisturising treatments', 'uk-eczema', ['apply moisturising treatments (emollients) to your skin as often as possible (at least 2 times a day)'])],
      meds: [it('gb-ecz-aqueous', 'Aqueous cream', 'uk-eczema', ['do not use aqueous cream as it can irritate the skin and make eczema worse'])],
    },
    CA: {},
  },
  ms: {
    US: {
      activity: [it('us-ms-stress', 'Stress management programs or relaxation training', 'us-ninds-ms', ['Stress management programs or relaxation training may help some people.'])],
      meds: [it('us-ms-spasticity', 'Medicines for spasticity', 'us-ninds-ms', ['Medicines can also help reduce spasticity.'])],
    },
    GB: {
      activity: [
        it('gb-ms-physio', 'Physiotherapy and exercises', 'uk-ms', ['physiotherapy and exercises to help with movement problems and muscle pain']),
        it('gb-ms-cbt', 'Cognitive behavioural therapy', 'uk-ms', ['cognitive behavioural therapy (CBT) to help with anxiety, depression and fatigue']),
        it('gb-ms-tiredness', 'Manage tiredness', 'uk-ms', ['advice about how to manage tiredness (fatigue)']),
      ],
      meds: [
        it('gb-ms-steroid', 'Steroid medicine', 'uk-ms', ['steroid medicine to reduce swelling and help nerves work better']),
        it('gb-ms-relaxant', 'Muscle relaxant medicine', 'uk-ms', ['muscle relaxant medicine to help relieve muscle spasms, cramps or stiffness']),
        it('gb-ms-walking', 'Medicine to improve walking', 'uk-ms', ['medicine to help improve walking']),
      ],
    },
    CA: {
      meds: [it('ca-ms-medicines', 'Medicines may help lower attacks', 'ca-hlbc-ms', ['MS has no cure, but medicines may help lower the number of attacks and make them less severe.'])],
    },
  },
  // Batch 11 (read 2026-11-18): inflammatory bowel disease, gallstones, stomach ulcer, iron deficiency anemia, overactive thyroid. Gaps: IBD US lines come from the NIDDK Crohn's disease page only; HealthLink BC blocks reading its Crohn's and stomach ulcer pages; no US overactive thyroid page could be read. All new sources are in PENDING_SOURCES until the verify script says OK.
  ibd: {
    US: {
      activity: [
        it('us-ibd-diary', 'Keep a food diary', 'us-niddk-crohn-eat', ['Your doctor may suggest keeping a food diary to help identify foods that seem to make your symptoms worse.']),
        it('us-ibd-talk', 'Talk with your doctor about foods related to your symptoms', 'us-niddk-crohn-eat', ['Talk with your doctor about any foods that seem to be related to your symptoms.']),
        it('us-ibd-fruit', 'Eating more fruits and vegetables', 'us-niddk-crohn-eat', ["Your doctor may recommend eating more fruits and vegetables for Crohn's disease."]),
      ],
      meds: [it('us-ibd-supplements', 'Dietary supplements', 'us-niddk-crohn-eat', ["Your doctor may also recommend dietary supplements if your body doesn't absorb enough nutrients."])],
    },
    GB: {
      activity: [it('gb-ibd-support', 'Support from other people with IBD', 'uk-ibd', ['You may find it helpful to get support from other people with IBD, either at a local support group or online.'])],
    },
    CA: {},
  },
  gallstones: {
    US: {
      avoid: [it('us-gall-fats', 'Fats found in desserts and fried foods', 'us-niddk-gall-eat', ['Avoid unhealthy fats, like those often found in desserts and fried foods.'])],
      moderate: [it('us-gall-carbs', 'Refined carbohydrates and sugar', 'us-niddk-gall-eat', ['Eat fewer refined carbohydrates and less sugar.'])],
      activity: [
        it('us-gall-oils', 'Fish oil and olive oil', 'us-niddk-gall-eat', ['Eat healthy fats, like fish oil and olive oil, to help your gallbladder contract and empty on a regular basis.']),
        it('us-gall-talk', 'Talk with your health care professional before changes to your eating plan', 'us-niddk-gall-eat', ['Talk with your health care professional before you make any changes to your eating plan.']),
      ],
    },
    GB: {
      avoid: [it('gb-gall-foods', 'Foods that cause symptoms', 'uk-gallstones', ['want to avoid foods that cause symptoms'])],
      moderate: [it('gb-gall-lowfat', 'Low-fat diet', 'uk-gallstones', ['be advised to eat a low-fat diet'])],
      meds: [
        it('gb-gall-pain', 'Painkillers such as paracetamol and ibuprofen', 'uk-gallstones', ['take painkillers, such as paracetamol and ibuprofen']),
        it('gb-gall-stronger', 'Stronger painkillers for severe pain', 'uk-gallstones', ['be offered stronger painkillers for severe pain if you need it']),
      ],
    },
    CA: {
      avoid: [it('ca-gall-fatty', 'Foods that cause symptoms, especially fatty foods', 'ca-hlbc-gallstones', ['Avoid foods that cause symptoms, especially fatty foods.'])],
      activity: [
        it('ca-gall-meals', 'Eat regular, balanced meals', 'ca-hlbc-gallstones', ['Eat regular, balanced meals.']),
        it('ca-gall-rest', 'Rest until you feel better', 'ca-hlbc-gallstones', ['Rest until you feel better.']),
        it('ca-gall-weight', 'Lose weight slowly and sensibly', 'ca-hlbc-gallstones', ['If you need to lose weight, do so slowly and sensibly.']),
      ],
      meds: [it('ca-gall-prescription', 'Prescription medicine for pain', 'ca-hlbc-gallstones', ['If the doctor gave you a prescription medicine for pain, take it as prescribed.'])],
    },
  },
  'stomach-ulcer': {
    US: {
      activity: [it('us-ulcer-smoke', 'Quitting smoking', 'us-niddk-ulcer', ['If you smoke, quitting smoking can lower your risk for peptic ulcers.'])],
      meds: [
        it('us-ulcer-doses', 'Take all doses exactly as your doctor prescribes', 'us-niddk-ulcer', ['If you are given medicines, take all doses exactly as your doctor prescribes.']),
        it('us-ulcer-early', 'Stop taking your medicine early', 'us-niddk-ulcer', ['If you stop taking your medicine early, some bacteria may survive and persist in your stomach.']),
        it('us-ulcer-nsaids', 'NSAIDs', 'us-niddk-ulcer', ['If you have a peptic ulcer caused by taking NSAIDs, your doctor may recommend changing your medicines.']),
      ],
    },
    GB: {
      moderate: [
        it('gb-ulcer-triggers', 'Food or drink that triggers your symptoms', 'uk-ulcer', ['do not have food or drink that triggers your symptoms, which can include fatty or spicy foods, coffee and chocolate']),
        it('gb-ulcer-alcohol', 'Too much alcohol', 'uk-ulcer', ['do not drink too much alcohol']),
      ],
      activity: [
        it('gb-ulcer-meals', 'Eat smaller meals', 'uk-ulcer', ['eat smaller meals']),
        it('gb-ulcer-evening', 'Eat your evening meal before going to bed', 'uk-ulcer', ['eat your evening meal 3 to 4 hours before going to bed']),
        it('gb-ulcer-smoke', 'Do not smoke', 'uk-ulcer', ['do not smoke']),
        it('gb-ulcer-stress', 'Manage stress', 'uk-ulcer', ['take steps to manage stress']),
      ],
      meds: [it('gb-ulcer-acid', 'Medicines to reduce stomach acid', 'uk-ulcer', ['medicines to reduce the amount of acid in your stomach, such as proton pump inhibitors'])],
    },
    CA: {},
  },
  'iron-anemia': {
    US: {
      activity: [it('us-iron-eating', 'Eating habits for everyone', 'us-nhlbi-anemia', ['Healthy eating habits are essential for everyone.'])],
      meds: [it('us-iron-marrow', 'Medicines to help your bone marrow make more red blood cells', 'us-nhlbi-anemia', ['Your doctor may prescribe medicines to help your bone marrow make more red blood cells.'])],
    },
    GB: {
      moderate: [it('gb-iron-limit', 'Large amounts of these foods and drinks', 'uk-iron', ['Large amounts of these foods and drinks make it harder for your body to absorb iron.'])],
      activity: [
        it('gb-iron-food', 'Taking the tablets with or soon after food', 'uk-iron', ['Try taking the tablets with or soon after food to reduce the chance of side effects.']),
        it('gb-iron-juice', 'Orange juice after a tablet', 'uk-iron', ["Drinking orange juice after you've taken a tablet may help your body absorb the iron."]),
      ],
      meds: [
        it('gb-iron-keep', 'Keep taking the tablets', 'uk-iron', ["It's important to keep taking the tablets, even if you get side effects."]),
        it('gb-iron-children', 'Iron supplement tablets out of the reach of children', 'uk-iron', ['Keep iron supplement tablets out of the reach of children.']),
      ],
    },
    CA: {
      activity: [
        it('ca-iron-steam', 'Steam vegetables to keep their iron content', 'ca-hlbc-iron', ['Steam vegetables to help them keep their iron content.']),
        it('ca-iron-vitc', 'Vitamin C or orange juice with your pills', 'ca-hlbc-iron', ['Take vitamin C (ascorbic acid) or drink orange juice with your pills.']),
        it('ca-iron-stomach', 'Take iron on an empty stomach', 'ca-hlbc-iron', ['Take iron on an empty stomach, if you can.']),
      ],
      meds: [
        it('ca-iron-doctor', 'Do not take iron pills without checking with your doctor', 'ca-hlbc-iron', ['Do not take iron pills without checking with your doctor.']),
        it('ca-iron-long', 'Take iron pills for as long as your doctor tells you', 'ca-hlbc-iron', ['Take iron pills for as long as your doctor tells you to.']),
        it('ca-iron-antacids', 'Antacids or tetracycline', 'ca-hlbc-iron', ["Don't take your iron pills within 2 hours of taking antacids or tetracycline."]),
        it('ca-iron-children', 'Keep iron pills out of the reach of children', 'ca-hlbc-iron', ['Keep iron pills out of the reach of children.']),
      ],
    },
  },
  'overactive-thyroid': {
    US: {},
    GB: {
      meds: [it('gb-thy-medicine', 'Medicine that stops your thyroid producing too much of the thyroid hormones', 'uk-hyperthyroid', ['medicine that stops your thyroid producing too much of the thyroid hormones'])],
    },
    CA: {
      activity: [
        it('ca-thy-kelp', 'Do not eat kelp', 'ca-hlbc-hyperthyroid', ['Do not eat kelp.', 'Kelp is high in iodine, which can make hyperthyroidism worse.']),
        it('ca-thy-salt', 'Iodized salt, bread and seafood', 'ca-hlbc-hyperthyroid', ['You can use iodized salt and eat bread and seafood.']),
        it('ca-thy-calcium', 'Get enough calcium', 'ca-hlbc-hyperthyroid', ['Make sure you get enough calcium.']),
        it('ca-thy-smoke', 'Do not smoke', 'ca-hlbc-hyperthyroid', ['Do not smoke.']),
      ],
      home: [
        it('ca-thy-eyes', 'Artificial tears, eye drops, and sunglasses', 'ca-hlbc-hyperthyroid', ['Use artificial tears, eye drops, and sunglasses to protect your eyes from dryness, wind, and sun.']),
        it('ca-thy-relax', 'Biofeedback, guided imagery, meditation', 'ca-hlbc-hyperthyroid', ['Learn to use biofeedback, guided imagery, meditation, or other methods to relax.']),
      ],
      meds: [
        it('ca-thy-prescribed', 'Take your medicines exactly as prescribed', 'ca-hlbc-hyperthyroid', ['Take your medicines exactly as prescribed.']),
        it('ca-thy-time', 'Thyroid medicine at the same time each day', 'ca-hlbc-hyperthyroid', ['You need to take the thyroid medicine at the same time each day.']),
        it('ca-thy-anti', 'Antithyroid medicine', 'ca-hlbc-hyperthyroid', ['Antithyroid medicine controls hyperthyroidism in many people.']),
      ],
    },
  },
  // Batch 12 (read 2026-11-18): acute bronchitis, chronic sinusitis, bronchiectasis, carpal tunnel syndrome, plantar fasciitis. Gaps: no US page could be read for bronchitis, sinusitis, bronchiectasis or plantar fasciitis (CDC pages did not load, no NIH page tried); only the carpal tunnel US page (NIAMS, undated). All new sources are in PENDING_SOURCES until the verify script says OK.
  'acute-bronchitis': {
    US: {},
    GB: {
      avoid: [it('gb-bron-contact', 'Contact with other people if you have a high temperature', 'uk-bronchitis', ['try to stay at home and avoid contact with other people if you have a high temperature'])],
      activity: [
        it('gb-bron-fluids', 'Drink plenty of fluids', 'uk-bronchitis', ['drink plenty of fluids']),
        it('gb-bron-smoke', 'Do not smoke', 'uk-bronchitis', ['do not smoke']),
        it('gb-bron-cover', 'Cover your mouth and nose when you cough or sneeze', 'uk-bronchitis', ['cover your mouth and nose with a tissue when you cough or sneeze']),
      ],
      home: [it('gb-bron-honey', 'Honey in a warm drink', 'uk-bronchitis', ['try adding honey to a warm drink to help soothe your throat'])],
      meds: [
        it('gb-bron-pain', 'Painkillers like paracetamol or ibuprofen', 'uk-bronchitis', ['take painkillers like paracetamol or ibuprofen to help with pain and bring down a high temperature']),
        it('gb-bron-antibiotics', 'Antibiotics', 'uk-bronchitis', ['Antibiotics may be offered if your bronchitis is caused by a more serious infection.']),
      ],
    },
    CA: {
      activity: [
        it('ca-bron-rest', 'Rest more than usual', 'ca-hlbc-bronchitis', ['Rest more than usual.']),
        it('ca-bron-fluids', 'Drink plenty of fluids', 'ca-hlbc-bronchitis', ["Drink plenty of fluids so you don't get dehydrated."]),
        it('ca-bron-smoke', 'Do not smoke', 'ca-hlbc-bronchitis', ["Don't smoke."]),
      ],
      meds: [
        it('ca-bron-antibiotics', 'Antibiotics', 'ca-hlbc-bronchitis', ["Antibiotics don't help with viral bronchitis."]),
        it('ca-bron-cough', 'Cough medicines', 'ca-hlbc-bronchitis', ['Cough medicines may not be safe for children younger than 6 or for people who have certain health problems.']),
        it('ca-bron-aspirin', 'Aspirin', 'ca-hlbc-bronchitis', ["Don't give aspirin to anyone younger than age 18."]),
      ],
    },
  },
  'chronic-sinusitis': {
    US: {},
    GB: {
      avoid: [it('gb-sinus-allergies', 'Things that trigger your allergies', 'uk-sinusitis', ['avoiding things that trigger your allergies'])],
      activity: [it('gb-sinus-smoke', 'Not smoking', 'uk-sinusitis', ['not smoking'])],
      meds: [
        it('gb-sinus-pain', 'Painkillers such as paracetamol or ibuprofen', 'uk-sinusitis', ['taking painkillers, such as paracetamol or ibuprofen']),
        it('gb-sinus-antibiotics', 'Antibiotics', 'uk-sinusitis', ['Rarely, you may need antibiotics.']),
      ],
    },
    CA: {
      avoid: [
        it('ca-sinus-smoke', 'Cigarette, cigar, and pipe smoke', 'ca-hlbc-sinusitis', ['Avoid cigarette, cigar, and pipe smoke in your home and workplace.']),
        it('ca-sinus-dry', 'Breathing dry air', 'ca-hlbc-sinusitis', ['Avoid breathing dry air.']),
        it('ca-sinus-allergy', 'Things that trigger your allergy attacks', 'ca-hlbc-sinusitis', ['Avoid the things that trigger your allergy attacks if you have allergies.']),
        it('ca-sinus-contact', 'Contact with people who have colds', 'ca-hlbc-sinusitis', ['Avoid contact with people who have colds and other upper respiratory infections.']),
      ],
      activity: [it('ca-sinus-fluids', 'Drinking lots of fluids and using saline nasal washes', 'ca-hlbc-sinusitis', ['This includes drinking lots of fluids and using saline nasal washes.'])],
      home: [it('ca-sinus-saline', 'Saline nasal washes', 'ca-hlbc-sinusitis', ['Use saline (saltwater) nasal washes.'])],
      meds: [
        it('ca-sinus-steroid', 'Steroid nasal spray', 'ca-hlbc-sinusitis', ['Try a steroid nasal spray.']),
        it('ca-sinus-directed', 'Take antibiotics as directed', 'ca-hlbc-sinusitis', ['If the doctor prescribed antibiotics, take them as directed.']),
        it('ca-sinus-course', 'Full course of antibiotics', 'ca-hlbc-sinusitis', ['You need to take the full course of antibiotics.']),
        it('ca-sinus-acetaminophen', 'Too much acetaminophen', 'ca-hlbc-sinusitis', ['Too much acetaminophen (Tylenol) can be harmful.']),
      ],
    },
  },
  bronchiectasis: {
    US: {},
    GB: {
      meds: [
        it('gb-bronchi-inhalers', 'Inhalers', 'uk-bronchiectasis', ['You may also be offered other medicines, such as inhalers to help your breathing.']),
        it('gb-bronchi-rescue', 'Antibiotics to keep at home', 'uk-bronchiectasis', ['You may be given antibiotics to keep at home (a rescue pack) for when you get symptoms of a chest infection.']),
      ],
    },
    CA: {
      activity: [
        it('ca-bronchi-fluids', 'Drink plenty of fluids', 'ca-hlbc-bronchiectasis', ["Drink plenty of fluids. This helps keep mucus thin and slippery so it's easier to cough up."]),
        it('ca-bronchi-active', 'Be active', 'ca-hlbc-bronchiectasis', ['Be active. Activity helps loosen mucus, encourages coughing, improves oxygen flow, and makes you feel better.']),
        it('ca-bronchi-smoke', 'Do not smoke or allow others to smoke around you', 'ca-hlbc-bronchiectasis', ["Don't smoke or allow others to smoke around you."]),
        it('ca-bronchi-airway', 'Airway clearance techniques', 'ca-hlbc-bronchiectasis', ['Your doctor may teach you airway clearance techniques to help you cough up mucus.']),
      ],
      meds: [it('ca-bronchi-follow', "Follow your doctor's instructions for taking your medicines", 'ca-hlbc-bronchiectasis', ["Follow your doctor's instructions for taking your medicines."])],
    },
  },
  'carpal-tunnel': {
    US: {
      activity: [
        it('us-cts-rest', 'Resting your hands periodically', 'us-niams-cts', ['Resting your hands periodically.']),
        it('us-cts-repetitive', 'Minimizing repetitive movements', 'us-niams-cts', ['Minimizing repetitive movements.']),
        it('us-cts-breaks', 'Short breaks when doing repetitive tasks', 'us-niams-cts', ['Taking short breaks when doing repetitive tasks with your hands.']),
      ],
      home: [
        it('us-cts-ice', 'Ice packs', 'us-niams-cts', ['Using ice packs as needed.']),
        it('us-cts-splint', 'Splint on the hand and wrist at night', 'us-niams-cts', ['Using a splint on the hand and wrist at night is a common initial treatment option for CTS symptoms.']),
      ],
      meds: [
        it('us-cts-prescribed', 'Taking medications as prescribed', 'us-niams-cts', ['Taking medications as prescribed by your doctor.']),
        it('us-cts-steroid', 'Steroid injection', 'us-niams-cts', ['An injection of steroid into your carpal tunnel can alleviate symptoms of CTS temporarily.']),
      ],
    },
    GB: {
      activity: [it('gb-cts-exercises', 'Hand exercises', 'uk-cts', ["There's a small amount of evidence to suggest hand exercises help ease the symptoms of CTS."])],
      home: [it('gb-cts-splint', 'Wrist splint', 'uk-cts', ['A wrist splint is something you wear on your hand to keep your wrist straight.'])],
      meds: [
        it('gb-cts-pain', 'Painkillers like paracetamol or ibuprofen', 'uk-cts', ['Painkillers like paracetamol or ibuprofen may help carpal tunnel pain short-term.']),
        it('gb-cts-steroid', 'Steroid injections', 'uk-cts', ['Steroid injections are not always a cure.']),
      ],
    },
    CA: {
      activity: [
        it('ca-cts-rest', 'Rest your fingers, hand, and wrist', 'ca-hlbc-cts', ['Rest your fingers, hand, and wrist.']),
        it('ca-cts-stop', 'Stop activities if they cause numbness and pain', 'ca-hlbc-cts', ['Stop activities if they cause numbness and pain.']),
        it('ca-cts-exercises', 'Exercises for flexibility and strength', 'ca-hlbc-cts', ['Talk to your doctor about starting exercises for flexibility and strength for your arm and wrist.']),
      ],
      home: [it('ca-cts-splint', 'Wear a wrist splint at night', 'ca-hlbc-cts', ['Wear a wrist splint at night.'])],
      meds: [it('ca-cts-medicine', 'Medicine for swelling, inflammation, and pain', 'ca-hlbc-cts', ['Medicine may relieve swelling, inflammation, and pain in the wrist or hand caused by carpal tunnel syndrome.'])],
    },
  },
  'plantar-fasciitis': {
    US: {},
    GB: {
      moderate: [
        it('gb-pf-standing', 'Walk or stand for long periods', 'uk-pf', ['do not walk or stand for long periods']),
        it('gb-pf-barefoot', 'Walk barefoot on hard surfaces', 'uk-pf', ['try not to walk barefoot on hard surfaces']),
      ],
      activity: [
        it('gb-pf-rest', 'Rest and raise your foot', 'uk-pf', ['rest and raise your foot on a stool when you can']),
        it('gb-pf-stretch', 'Gentle exercises to stretch the sole of your foot and your heel', 'uk-pf', ['try regular gentle exercises to stretch the sole of your foot and your heel']),
        it('gb-pf-shoes', 'Shoes with cushioned heels and arch support', 'uk-pf', ['wear shoes with cushioned heels and good arch support']),
        it('gb-pf-heels', 'High heels or tight pointy shoes', 'uk-pf', ['do not wear high heels or tight pointy shoes']),
        it('gb-pf-weight', 'Lose weight if overweight', 'uk-pf', ["try to lose weight if you're overweight"]),
      ],
      home: [
        it('gb-pf-ice', 'Ice pack on the painful area', 'uk-pf', ['put an ice pack (or bag of frozen peas) in a towel on the painful area for up to 20 minutes every 2 to 3 hours']),
        it('gb-pf-insoles', 'Insoles or heel pads', 'uk-pf', ['use insoles or heel pads in your shoes']),
      ],
      meds: [it('gb-pf-pain', 'Paracetamol or ibuprofen gel or tablets', 'uk-pf', ['take painkillers like paracetamol or ibuprofen gel, or ibuprofen tablets if you need them'])],
    },
    CA: {
      moderate: [it('ca-pf-hard', 'Walk or run on hard surfaces', 'ca-hlbc-pf', ['Try not to walk or run on hard surfaces.'])],
      activity: [
        it('ca-pf-rest', 'Give your feet a rest', 'ca-hlbc-pf', ['Give your feet a rest.']),
        it('ca-pf-cutback', 'Cut back on activities that make your foot hurt', 'ca-hlbc-pf', ['Cut back on activities that make your foot hurt.']),
        it('ca-pf-stretch', 'Stretch your toes and calves', 'ca-hlbc-pf', ['Stretch your toes and calves several times a day.']),
        it('ca-pf-shoes', 'Shoes with arch support and a cushioned sole', 'ca-hlbc-pf', ['Pick shoes with good arch support and a cushioned sole.']),
      ],
      home: [it('ca-pf-ice', 'Resting and icing your heel', 'ca-hlbc-pf', ['First, try resting and icing your heel.'])],
    },
  },
  // Batch 13 (read 2026-11-18): PTSD, bipolar disorder, ADHD, cirrhosis, pulmonary fibrosis. Gaps: NIMH pages for PTSD and bipolar disorder have no self-care or medicine line I could quote; no US or Canadian ADHD page read (NHS ADHD page is mostly about children). Bipolar Canada exercise line left out because it names a 30 minute target. All new sources are in PENDING_SOURCES until the verify script says OK.
  ptsd: {
    US: {},
    GB: {
      moderate: [it('gb-ptsd-alcohol', 'Too much alcohol', 'uk-ptsd', ['do not drink too much alcohol'])],
      activity: [
        it('gb-ptsd-active', 'Stay active', 'uk-ptsd', ['stay active']),
        it('gb-ptsd-talk', "Talk to someone about how you're feeling", 'uk-ptsd', ["talk to someone about how you're feeling, either a friend or family member, or through an online support group"]),
        it('gb-ptsd-diary', 'Keep a diary to help spot things that can trigger flashbacks', 'uk-ptsd', ['Keep a diary to help spot the things that can trigger flashbacks, such as certain smells or sounds.']),
      ],
      meds: [it('gb-ptsd-medicine', 'Do not stop taking your PTSD medicine', 'uk-ptsd', ['Do not stop taking your PTSD medicine unless you are told to by a doctor, even if you feel better.'])],
    },
    CA: {
      activity: [
        it('ca-ptsd-exercise', 'Exercise and be active', 'ca-hlbc-ptsd', ['Exercise and be active to reduce how tense you feel.']),
        it('ca-ptsd-things', 'Things to do to ease your memories and reactions', 'ca-hlbc-ptsd', ['Find things to do to ease your memories and reactions.']),
      ],
      meds: [it('ca-ptsd-medicine', 'Take medicine exactly as prescribed', 'ca-hlbc-ptsd', ['If you are using medicine, take it exactly as prescribed.'])],
    },
  },
  bipolar: {
    US: {},
    GB: {
      moderate: [it('gb-bip-alcohol', 'Too much alcohol', 'uk-bipolar', ['do not drink too much alcohol'])],
      activity: [
        it('gb-bip-routine', 'Have a regular routine', 'uk-bipolar', ['try to have a regular routine']),
        it('gb-bip-sleep', 'Get plenty of sleep', 'uk-bipolar', ['get plenty of sleep']),
        it('gb-bip-exercise', 'Exercise regularly', 'uk-bipolar', ['exercise regularly']),
      ],
      meds: [it('gb-bip-medicine', 'Do not stop taking your bipolar disorder medicine', 'uk-bipolar', ['Do not stop taking your bipolar disorder medicine unless you are told to by a doctor, even if you feel better.'])],
    },
    CA: {
      avoid: [it('ca-bip-alcohol', 'Alcohol, cannabis, and illegal drugs', 'ca-hlbc-bipolar', ['Avoid alcohol, cannabis, and illegal drugs.'])],
      activity: [
        it('ca-bip-sleep', 'Get enough sleep', 'ca-hlbc-bipolar', ['Get enough sleep.']),
        it('ca-bip-bed', 'Go to bed at the same time every night', 'ca-hlbc-bipolar', ['And try to go to bed at the same time every night.']),
      ],
      meds: [
        it('ca-bip-daily', 'Take your medicine every day as prescribed', 'ca-hlbc-bipolar', ['Take your medicine every day as prescribed.']),
        it('ca-bip-regular', 'Take your medicines regularly', 'ca-hlbc-bipolar', ["You must take your medicines regularly, even if you're feeling better."]),
      ],
    },
  },
  adhd: {
    US: {},
    GB: {
      meds: [it('gb-adhd-medicines', 'ADHD medicines', 'uk-adhd', ['ADHD medicines must be started and monitored by an ADHD specialist.'])],
    },
    CA: {},
  },
  cirrhosis: {
    US: {
      avoid: [it('us-cirr-raw', 'Raw or undercooked shellfish, fish, and meat, and unpasteurized milk', 'us-niddk-cirrhosis', ['Avoid eating raw or undercooked shellfish, fish, and meat, and unpasteurized milk and milk products.'])],
      moderate: [it('us-cirr-sodium', 'Limiting sodium in foods and drinks', 'us-niddk-cirrhosis', ['Your doctor may recommend limiting sodium in foods and drinks.'])],
      activity: [
        it('us-cirr-alcohol', 'Stop drinking alcohol', 'us-niddk-cirrhosis', ['You should completely stop drinking alcohol because it can cause more liver damage.']),
        it('us-cirr-dietitian', 'Registered dietitian', 'us-niddk-cirrhosis', ['Your doctor may refer you to a registered dietitian to help create healthy meal plans that fit your nutrition needs.']),
      ],
      meds: [it('us-cirr-supplements', 'Talk with your doctor before taking dietary supplements', 'us-niddk-cirrhosis', ['talk with your doctor before taking dietary supplements'])],
    },
    GB: {
      activity: [
        it('gb-cirr-alcohol', 'Do not drink alcohol', 'uk-cirrhosis', ['do not drink alcohol']),
        it('gb-cirr-smoke', 'Do not smoke', 'uk-cirrhosis', ['do not smoke']),
        it('gb-cirr-vaccines', 'Stay up to date with vaccinations', 'uk-cirrhosis', ['stay up to date with vaccinations, such as the flu vaccine and pneumococcal vaccine']),
        it('gb-cirr-diet', 'Have a balanced diet', 'uk-cirrhosis', ['have a healthy, balanced diet']),
      ],
    },
    CA: {
      avoid: [
        it('ca-cirr-sedatives', 'Sedative medicines', 'ca-hlbc-cirrhosis', ['Avoid sedative medicines, such as sleeping pills, medicines for anxiety, and opioids.']),
        it('ca-cirr-natural', 'Most natural health products', 'ca-hlbc-cirrhosis', ['In general, you should avoid most natural health products.']),
      ],
      moderate: [it('ca-cirr-salt', 'Limit the amount of salt', 'ca-hlbc-cirrhosis', ['You may need to limit the amount of salt you eat.'])],
      activity: [
        it('ca-cirr-alcohol', 'Do not drink any alcohol', 'ca-hlbc-cirrhosis', ['Do not drink any alcohol.']),
        it('ca-cirr-flu', 'Flu vaccine every year', 'ca-hlbc-cirrhosis', ['Get a flu vaccine every year.']),
      ],
      meds: [
        it('ca-cirr-ask', 'Talk to your doctor or pharmacist about medicines', 'ca-hlbc-cirrhosis', ['Talk to your doctor or pharmacist about what medicines are safe for you.']),
        it('ca-cirr-acetaminophen', 'Acetaminophen', 'ca-hlbc-cirrhosis', ['For example, acetaminophen (such as Tylenol) can speed up liver damage.']),
      ],
    },
  },
  'pulmonary-fibrosis': {
    US: {
      meds: [
        it('us-ipf-antifibrotics', 'Nintedanib or pirfenidone', 'us-nhlbi-ipf', ['Nintedanib or pirfenidone can help your lungs work better.']),
        it('us-ipf-antacids', 'Antacids', 'us-nhlbi-ipf', ['Antacids may help prevent stomach acid from getting into the lungs from reflux, making IPF worse.']),
        it('us-ipf-oxygen', 'Oxygen therapy', 'us-nhlbi-ipf', ['Oxygen therapy to decrease shortness of breath and improve the ability to exercise']),
      ],
    },
    GB: {
      activity: [
        it('gb-ipf-smoke', 'Stop smoking', 'uk-ipf', ['stop smoking if you smoke']),
        it('gb-ipf-exercise', 'Exercise regularly and stay as fit as you can', 'uk-ipf', ['exercise regularly and stay as fit as you can']),
        it('gb-ipf-vaccines', 'Annual flu vaccine, pneumococcal vaccine and RSV vaccine', 'uk-ipf', ["get the annual flu vaccine, pneumococcal vaccine and RSV vaccine if you're eligible"]),
      ],
      meds: [it('gb-ipf-oxygen', 'Oxygen therapy', 'uk-ipf', ['oxygen therapy to improve breathlessness and help you to be more active'])],
    },
    CA: {
      avoid: [it('ca-ipf-smoke', 'Smoke, dirty air, and sick children and adults', 'ca-hlbc-pulmfib', ['You can help prevent lung infections by avoiding smoke, dirty air, and sick children and adults.'])],
      meds: [it('ca-ipf-oxygen', 'Medicines and oxygen', 'ca-hlbc-pulmfib', ['Treatment includes medicines and oxygen to ease shortness of breath.'])],
    },
  },
};

// Items whose quote the live-page check could not find (verify-condition-tiles.mjs, James 2026-11-18). They stay hidden until the quote is re-verified.
// An entry is an item id, or "itemId@sourceId" to hide only that item's food group from one source.
// The two NIDDK PDFs cannot be read by the script: the lines were read by hand-run page fetch on 2026-11-18 and stay hidden until James confirms them in the PDF.
export const UNVERIFIED: string[] = ['us-ckd-phosphorus', 'us-ckd-meat-dairy@us-niddk-potassium-tips'];
// Old-page rule (James, 2026-11-18, option 3): an item that names a medicine or dose (every item in the Medicines tile, and any item with medIds) is hidden
// when its page's last review date is more than 5 years before today. Pages with no date, and old pages that name no medicines, stay visible.
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
// Reads the date out of a page's own date text ("Last Reviewed October 2016", "Current as of: March 1, 2023", "Adaptation Date: 6/14/2023", "22 March 2023").
// A month-only date counts as the last day of that month (a year-only date, 31 December), so a page is never hidden early. Returns null when no date can be read.
export const reviewDate = (dateText: string | null): Date | null => {
  if (!dateText) return null;
  const t = dateText.toLowerCase();
  const num = t.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (num) return new Date(Date.UTC(+num[3], +num[1] - 1, +num[2]));
  const m = MONTHS.findIndex((n) => t.includes(n));
  const y = t.match(/\b(19|20)\d{2}\b/);
  if (!y) return null;
  if (m < 0) return new Date(Date.UTC(+y[0], 11, 31)); // year only: the last day of that year
  const day = t.match(new RegExp(`(\\d{1,2})\\s+${MONTHS[m]}|${MONTHS[m]}\\s+(\\d{1,2})\\b`));
  return day ? new Date(Date.UTC(+y[0], m, +(day[1] ?? day[2]))) : new Date(Date.UTC(+y[0], m + 1, 0));
};
export const OLD_PAGE_YEARS = 5;
export const pageIsOld = (srcId: string, now: Date = new Date()): boolean => {
  const d = reviewDate(TILE_SOURCES[srcId]?.dateText ?? null);
  if (!d) return false;
  const cutoff = new Date(Date.UTC(now.getUTCFullYear() - OLD_PAGE_YEARS, now.getUTCMonth(), now.getUTCDate()));
  return d < cutoff;
};
export const namesMedicine = (i: TileItem, key?: TileKey) => key === 'meds' || !!i.medIds?.length;
export const hiddenAsOld = (i: TileItem, key?: TileKey, now: Date = new Date()) => namesMedicine(i, key) && pageIsOld(i.src, now);
// Sources whose lines are new and not yet confirmed by James's verify script (OK against the live page). Everything from them stays hidden; remove an id here once the script says OK.
export const PENDING_SOURCES: string[] = [
  'uk-ptsd', 'ca-hlbc-ptsd', 'uk-bipolar', 'ca-hlbc-bipolar', 'uk-adhd', 'us-niddk-cirrhosis', 'uk-cirrhosis', 'ca-hlbc-cirrhosis', 'us-nhlbi-ipf', 'uk-ipf', 'ca-hlbc-pulmfib',
];
const shown = (i: TileItem, key?: TileKey) => !UNVERIFIED.includes(i.id) && !PENDING_SOURCES.includes(i.src) && !hiddenAsOld(i, key);
export const groupShown = (itemId: string, g: FoodGroup) => !UNVERIFIED.includes(`${itemId}@${g.src}`) && !PENDING_SOURCES.includes(g.src);
export const visibleGroups = (i: TileItem) => (i.foodGroups ?? []).filter((g) => groupShown(i.id, g));

// True once a condition has been checked for the country, even when every tile came out empty (the tiles then say so).
export const hasTiles = (conditionId: string, country: Country) => !!TILES[conditionId]?.[country];
export const tileItems = (conditionId: string, country: Country, key: TileKey): TileItem[] => (TILES[conditionId]?.[country]?.[key] ?? []).filter((i) => shown(i, key));
