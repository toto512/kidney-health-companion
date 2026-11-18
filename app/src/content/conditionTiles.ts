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
  'us-niddk-ckd-eat': { country: 'US', publisher: NIDDK, type: 'government', url: 'https://www.niddk.nih.gov/health-information/kidney-disease/chronic-kidney-disease-ckd/eating-nutrition', dateText: 'Last Reviewed January 2025', checkedOn: C },
  'uk-ckd-treat': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/kidney-disease/treatment/', dateText: 'Page last reviewed: 22 March 2023', nextReviewDue: '2026-03-22', checkedOn: C },
  'ca-hlbc-ckd': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/chronic-kidney-disease', dateText: 'Current as of: March 1, 2023', checkedOn: C },
  'us-cdc-diabetes-kidney-food': { country: 'US', publisher: 'CDC (US Centers for Disease Control and Prevention)', type: 'government', url: 'https://www.cdc.gov/diabetes/healthy-eating/diabetes-and-kidney-disease-food.html', dateText: null, checkedOn: C },
  'us-niddk-potassium-tips': { country: 'US', publisher: 'NIDDK (US National Institutes of Health), "Potassium Tips for People with Chronic Kidney Disease"', type: 'government', url: 'https://www.niddk.nih.gov/-/media/Files/Health-Information/Health-Professionals/Kidney-Disease/PotassiumTipsforPeopleCKD_EN.pdf', dateText: null, checkedOn: C },
  'us-niddk-phosphorus-tips': { country: 'US', publisher: 'NIDDK (US National Institutes of Health), "Phosphorus Tips for People with Chronic Kidney Disease"', type: 'government', url: 'https://www.niddk.nih.gov/-/media/Files/Health-Information/Health-Professionals/Kidney-Disease/PhosphorusTipsforPeopleCKD_EN.pdf', dateText: null, checkedOn: C },
  'us-niddk-ckd-children-nutrition': { country: 'US', publisher: 'NIDDK (US National Institutes of Health), page for children with kidney disease', type: 'government', url: 'https://www.niddk.nih.gov/health-information/kidney-disease/children/helping-child-adapt-life-chronic-kidney-disease/nutrition-chronic-kidney-disease', dateText: null, checkedOn: C },
  'ca-hlbc-ckd-diet': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/kidney-disease-changing-your-diet', dateText: null, checkedOn: C },
  'us-niddk-managing-diabetes': { country: 'US', publisher: NIDDK, type: 'government', url: 'https://www.niddk.nih.gov/health-information/diabetes/overview/managing-diabetes', dateText: 'Last Reviewed October 2023', checkedOn: C },
  'uk-diabetes': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/diabetes/', dateText: 'Page last reviewed: 26 June 2025', nextReviewDue: '2028-06-26', checkedOn: C },
  'ca-hlbc-t2d': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/type-2-diabetes', dateText: 'Adaptation Date: 6/14/2023', checkedOn: C },
  'us-nhlbi-chd': { country: 'US', publisher: 'NHLBI (US National Institutes of Health)', type: 'government', url: 'https://www.nhlbi.nih.gov/health/coronary-heart-disease/treatment', dateText: 'Last updated on December 27, 2024', checkedOn: C },
  'uk-chd-treat': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/coronary-heart-disease/treatment/', dateText: 'Page last reviewed: 17 January 2024', nextReviewDue: '2027-01-17', checkedOn: C },
  'ca-hlbc-cad': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/coronary-artery-disease-0', dateText: 'Current as of: September 7, 2022', checkedOn: C },
  'us-nhlbi-hf': { country: 'US', publisher: 'NHLBI (US National Institutes of Health)', type: 'government', url: 'https://www.nhlbi.nih.gov/health/heart-failure/treatment', dateText: 'Last updated on March 24, 2022', checkedOn: C },
  'uk-hf-treat': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/heart-failure/treatment/', dateText: 'Page last reviewed: 26 June 2026', nextReviewDue: '2029-06-26', checkedOn: C },
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
  'uk-pad-treat': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/peripheral-arterial-disease-pad/treatment/', dateText: 'Page last reviewed: 10 April 2026', nextReviewDue: '2029-04-10', checkedOn: C },
  'ca-hlbc-pad': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/peripheral-arterial-disease', dateText: 'Current as of: September 7, 2022', checkedOn: C },
  'us-nhlbi-af': { country: 'US', publisher: 'NHLBI (US National Institutes of Health)', type: 'government', url: 'https://www.nhlbi.nih.gov/health/atrial-fibrillation/treatment', dateText: 'Last updated on November 30, 2022', checkedOn: C },
  'uk-af-treat': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/atrial-fibrillation/treatment/', dateText: 'Page last reviewed: 13 January 2025', nextReviewDue: '2028-01-13', checkedOn: C },
  'ca-hlbc-af': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/atrial-fibrillation', dateText: 'Adaptation Date: 9/19/2023', checkedOn: C },
  'us-niddk-adpkd': { country: 'US', publisher: NIDDK, type: 'government', url: 'https://www.niddk.nih.gov/health-information/kidney-disease/polycystic-kidney-disease/autosomal-dominant-pkd', dateText: 'Last Reviewed January 2017', checkedOn: C },
  'uk-adpkd-treat': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/autosomal-dominant-polycystic-kidney-disease-adpkd/treatment/', dateText: 'Page last reviewed: 23 February 2023', nextReviewDue: '2026-02-23', checkedOn: C },
  'us-nhlbi-copd': { country: 'US', publisher: 'NHLBI (US National Institutes of Health)', type: 'government', url: 'https://www.nhlbi.nih.gov/health/copd/treatment', dateText: 'Last updated on October 6, 2024', checkedOn: C },
  'uk-copd-treat': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/chronic-obstructive-pulmonary-disease-copd/treatment/', dateText: 'Page last reviewed: 2 November 2026', nextReviewDue: '2029-11-02', checkedOn: C },
  'ca-hlbc-copd': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/copd-chronic-obstructive-pulmonary-disease', dateText: 'Current as of: November 14, 2022', checkedOn: C },
  'us-nhlbi-asthma': { country: 'US', publisher: 'NHLBI (US National Institutes of Health)', type: 'government', url: 'https://www.nhlbi.nih.gov/health/asthma/treatment-action-plan', dateText: 'Last updated on April 17, 2024', checkedOn: C },
  'uk-asthma': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/asthma/', dateText: 'Page last reviewed: 07 April 2025', nextReviewDue: '2028-04-07', checkedOn: C },
  'ca-hlbc-asthma': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/asthma-teenagers-and-adults', dateText: 'Adaptation Date: 9/13/2023', checkedOn: C },
  'us-nhlbi-sleepapnea': { country: 'US', publisher: 'NHLBI (US National Institutes of Health)', type: 'government', url: 'https://www.nhlbi.nih.gov/health/sleep-apnea/treatment', dateText: 'Last updated on January 9, 2025', checkedOn: C },
  'ca-hlbc-sleepapnea': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/sleep-apnea', dateText: 'Current as of: November 7, 2022', checkedOn: C },
  'us-niams-oa': { country: 'US', publisher: 'NIAMS (US National Institutes of Health)', type: 'government', url: 'https://www.niams.nih.gov/health-topics/osteoarthritis/diagnosis-treatment-and-steps-to-take', dateText: null, checkedOn: C },
  'uk-oa-treat': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/osteoarthritis/treatment/', dateText: 'Page last reviewed: 20 March 2023', nextReviewDue: '2026-03-20', checkedOn: C },
  'ca-hlbc-oa': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/osteoarthritis', dateText: 'Current as of: November 9, 2022', checkedOn: C },
  'us-nimh-depression': { country: 'US', publisher: 'NIMH (US National Institutes of Health)', type: 'government', url: 'https://www.nimh.nih.gov/health/publications/depression', dateText: 'Revised 2024', checkedOn: C },
  'uk-depression-treat': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/mental-health/conditions/depression-in-adults/treatment/', dateText: 'Page last reviewed: 5 July 2023', nextReviewDue: '2026-07-05', checkedOn: C },
  'us-niams-gout': { country: 'US', publisher: 'NIAMS (US National Institutes of Health)', type: 'government', url: 'https://www.niams.nih.gov/health-topics/gout/diagnosis-treatment-and-steps-to-take', dateText: null, checkedOn: C },
  'uk-gout-treat': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/gout/treatment/', dateText: 'Page last reviewed: 24 August 2023', nextReviewDue: '2026-08-24', checkedOn: C },
  'ca-hlbc-gout': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/gout', dateText: 'Adaptation Date: 6/14/2023', checkedOn: C },
  'us-nhlbi-hbp': { country: 'US', publisher: 'NHLBI (US National Institutes of Health)', type: 'government', url: 'https://www.nhlbi.nih.gov/health/high-blood-pressure/treatment', dateText: 'Last updated on April 30, 2024', checkedOn: C },
  'uk-hbp': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/high-blood-pressure-hypertension/', dateText: 'Page last reviewed: 19 July 2024', nextReviewDue: '2027-07-19', checkedOn: C },
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
        it('gb-pad-walking', 'Walking', 'uk-pad-treat', ['One of the best exercises you can do is walking.']),
        it('gb-pad-smoking', 'Stopping smoking', 'uk-pad-treat', ['Stopping smoking will reduce your risk of PAD getting worse and another serious CVD developing.']),
      ],
      meds: [
        it('gb-pad-list', 'Medicines you may be prescribed', 'uk-pad-treat', ['Medicines you may be prescribed if you have PAD include:']),
        it('gb-pad-naftidrofuryl', 'Naftidrofuryl oxalate', 'uk-pad-treat', ['You may be offered naftidrofuryl oxalate if you have leg pain triggered by exercise (intermittent claudication).']),
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
        it('us-copd-broncho', 'Bronchodilators and steroids', 'us-nhlbi-copd', ['Medicines to treat COPD symptoms include bronchodilators and steroids or nonsteroid medicines that reduce inflammation.']),
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
};

// Items whose quote the live-page check could not find (verify-condition-tiles.mjs, James 2026-11-18). They stay hidden until the quote is re-verified.
// An entry is an item id, or "itemId@sourceId" to hide only that item's food group from one source.
// The two NIDDK PDFs cannot be read by the script: the lines were read by hand-run page fetch on 2026-11-18 and stay hidden until James confirms them in the PDF.
export const UNVERIFIED: string[] = ['us-ckd-phosphorus', 'us-ckd-meat-dairy@us-niddk-potassium-tips', 'gb-pad-walking', 'gb-pad-smoking', 'gb-pad-list', 'gb-pad-naftidrofuryl'];
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
const shown = (i: TileItem, key?: TileKey) => !UNVERIFIED.includes(i.id) && !hiddenAsOld(i, key);
export const groupShown = (itemId: string, g: FoodGroup) => !UNVERIFIED.includes(`${itemId}@${g.src}`);
export const visibleGroups = (i: TileItem) => (i.foodGroups ?? []).filter((g) => groupShown(i.id, g));

// True once a condition has been checked for the country, even when every tile came out empty (the tiles then say so).
export const hasTiles = (conditionId: string, country: Country) => !!TILES[conditionId]?.[country];
export const tileItems = (conditionId: string, country: Country, key: TileKey): TileItem[] => (TILES[conditionId]?.[country]?.[key] ?? []).filter((i) => shown(i, key));
