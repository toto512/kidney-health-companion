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
export type TileItem = { id: string; title: string; quotes: string[]; src: string; medIds?: string[] };
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
  'us-niams-gout': { country: 'US', publisher: 'NIAMS (US National Institutes of Health)', type: 'government', url: 'https://www.niams.nih.gov/health-topics/gout/diagnosis-treatment-and-steps-to-take', dateText: null, checkedOn: C },
  'uk-gout-treat': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/gout/treatment/', dateText: 'Page last reviewed: 24 August 2023', nextReviewDue: '2026-08-24', checkedOn: C },
  'ca-hlbc-gout': { country: 'CA', publisher: HLBC, type: 'provincial_government', url: 'https://www.healthlinkbc.ca/healthwise/gout', dateText: 'Adaptation Date: 6/14/2023', checkedOn: C },
  'us-nhlbi-hbp': { country: 'US', publisher: 'NHLBI (US National Institutes of Health)', type: 'government', url: 'https://www.nhlbi.nih.gov/health/high-blood-pressure/treatment', dateText: 'Last updated on April 30, 2024', checkedOn: C },
  'uk-hbp': { country: 'GB', publisher: NHS, type: 'government', url: 'https://www.nhs.uk/conditions/high-blood-pressure-hypertension/', dateText: 'Page last reviewed: 19 July 2024', nextReviewDue: '2027-07-19', checkedOn: C },
};

type Tiles = Partial<Record<TileKey, TileItem[]>>;
const it = (id: string, title: string, src: string, quotes: string[], medIds?: string[]): TileItem => ({ id, title, src, quotes, ...(medIds ? { medIds } : {}) });

// Keyed by the condition ids used on the My conditions screen. A condition or country with no entry shows nothing here yet (later batches).
export const TILES: Record<string, Partial<Record<Country, Tiles>>> = {
  ckd: {
    US: {
      moderate: [
        it('us-ckd-sodium', 'Sodium', 'us-niddk-ckd-eat', ['Many people with CKD need to limit their sodium even more.']),
        it('us-ckd-packaged', 'Prepared, packaged, and fast foods', 'us-niddk-ckd-eat', ['Limit the amount of prepared, packaged, and fast foods you eat.']),
        it('us-ckd-potassium', 'Foods that contain potassium', 'us-niddk-ckd-eat', ['Limit serving sizes of foods that contain potassium.']),
        it('us-ckd-fats', 'Saturated and trans fats', 'us-niddk-ckd-eat', ['Limit saturated and trans fats.']),
        it('us-ckd-alcohol', 'Alcohol', 'us-niddk-ckd-eat', ['Limit alcohol.']),
        it('us-ckd-meat-dairy', 'Meat and dairy foods', 'us-niddk-ckd-eat', ['limit how much meat and dairy foods you consume']),
      ],
      activity: [
        it('us-ckd-active', 'Physical activity', 'us-niddk-ckd-manage', ['Be active for 30 minutes or more on most days.', 'Physical activity can help you reduce stress, manage your weight, and achieve your blood pressure and blood glucose goals.']),
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
        it('ca-ckd-salt-protein', 'Salt (sodium) and protein', 'ca-hlbc-ckd', ['You may need to limit salt (sodium) and protein and watch your fluid intake.']),
        it('ca-ckd-potassium', 'Potassium and phosphorus', 'ca-hlbc-ckd', ['Some people also need to limit potassium and phosphorus.']),
      ],
      activity: [
        it('ca-ckd-walking', 'Walking', 'ca-hlbc-ckd', ['Be active. Walking is a good choice. Try for at least 2½ hours a week.']),
        it('ca-ckd-exercise', 'Exercise', 'ca-hlbc-ckd', ['Make exercise a routine part of your life.', 'Exercise may lower your risk for diabetes and high blood pressure.']),
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
        it('us-gout-seafood', 'Shellfish, sardines, and anchovies', 'us-niams-gout', ['Avoiding certain seafood, such as shellfish (shrimp and lobster), sardines, and anchovies.']),
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
        it('ca-gout-seafood', 'Seafood and red meat', 'ca-hlbc-gout', ['Eat less seafood and red meat.']),
        it('ca-gout-alcohol', 'Alcohol', 'ca-hlbc-gout', ['Check with your doctor before drinking alcohol.']),
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
      ],
    },
  },
};

// True once a condition has been checked for the country, even when every tile came out empty (the tiles then say so).
export const hasTiles = (conditionId: string, country: Country) => !!TILES[conditionId]?.[country];
export const tileItems = (conditionId: string, country: Country, key: TileKey): TileItem[] => TILES[conditionId]?.[country]?.[key] ?? [];
