// Food list, step 1. Names, categories, search words and typical servings only.
// No nutrient amounts and no ratings yet: an amount is added only with its official source link and check date
// (Canadian Nutrient File, USDA FoodData Central, UK CoFID). Food names stay in English until a native medical reviewer checks them.
export type FoodCategory = 'dairy' | 'grains' | 'vegetables' | 'fruit' | 'plant-protein' | 'protein' | 'meat' | 'seafood' | 'drinks' | 'packaged' | 'supplements';
export const FOOD_CATEGORIES: FoodCategory[] = ['fruit', 'vegetables', 'grains', 'dairy', 'protein', 'plant-protein', 'meat', 'seafood', 'drinks', 'packaged', 'supplements'];

// Per typical serving. Only filled in with a source link and check date.
export type Amounts = { sodiumMg?: number; potassiumMg?: number; phosphorusMg?: number; proteinG?: number; source: string; url: string; checkedOn: string };

export type Food = { id: string; name: string; category: FoodCategory; synonyms: string[]; serving: string; amounts?: Amounts };

export const FOODS: Food[] = [
  { id: 'mozzarella-part-skim', name: 'Mozzarella, part-skim', category: 'dairy', synonyms: ['mozzarella', 'mozzarella cheese', 'part skim mozzarella', 'part-skim mozzarella', 'low moisture mozzarella', 'low-moisture mozzarella'], serving: '1 oz (28 g)' },
  { id: 'white-rice', name: 'White rice, cooked', category: 'grains', synonyms: ['rice'], serving: '1 cup cooked' },
  { id: 'oatmeal', name: 'Oatmeal, plain', category: 'grains', synonyms: ['oats'], serving: '½ cup dry' },
  { id: 'potato', name: 'Potato, baked', category: 'vegetables', synonyms: ['potatoes', 'baked potato'], serving: '1 medium potato' },
  { id: 'tomato', name: 'Tomato', category: 'vegetables', synonyms: ['tomatoes'], serving: '1 medium tomato' },
  { id: 'banana', name: 'Banana', category: 'fruit', synonyms: ['bananas'], serving: '1 medium banana' },
  { id: 'apple', name: 'Apple', category: 'fruit', synonyms: ['apples'], serving: '1 medium apple' },
  { id: 'avocado', name: 'Avocado', category: 'fruit', synonyms: ['avocados'], serving: '¼ avocado' },
  { id: 'beans', name: 'Beans or lentils, cooked', category: 'plant-protein', synonyms: ['lentils', 'legumes'], serving: '½ cup cooked' },
  { id: 'spinach', name: 'Spinach, cooked', category: 'vegetables', synonyms: [], serving: '½ cup cooked' },
  { id: 'liver', name: 'Liver / organ meats', category: 'meat', synonyms: ['organ meat', 'kidney', 'sweetbread'], serving: '3 oz' },
  { id: 'beef', name: 'Beef, red meat', category: 'meat', synonyms: ['steak', 'red meat', 'lamb', 'pork'], serving: '3 oz cooked' },
  { id: 'deli-meat', name: 'Processed deli meat', category: 'meat', synonyms: ['lunch meat', 'cold cuts', 'bacon', 'sausage', 'ham'], serving: '2 oz' },
  { id: 'sardines', name: 'Sardines / anchovies', category: 'seafood', synonyms: ['anchovies'], serving: '3 oz' },
  { id: 'shellfish', name: 'Shellfish', category: 'seafood', synonyms: ['shrimp', 'crab', 'lobster', 'mussels'], serving: '3 oz' },
  { id: 'beer', name: 'Beer', category: 'drinks', synonyms: ['ale', 'lager'], serving: '12 fl oz' },
  { id: 'spirits', name: 'Spirits / liquor', category: 'drinks', synonyms: ['liquor', 'vodka', 'whiskey', 'rum', 'gin'], serving: '1.5 fl oz' },
  { id: 'soda', name: 'Sugar-sweetened soda', category: 'drinks', synonyms: ['soft drink', 'cola', 'high fructose corn syrup'], serving: '12 fl oz' },
  { id: 'water', name: 'Water', category: 'drinks', synonyms: ['plain water'], serving: 'Per clinician fluid plan' },
  { id: 'milk', name: 'Low-fat milk', category: 'dairy', synonyms: ['skim milk'], serving: '1 cup' },
  { id: 'egg', name: 'Egg', category: 'protein', synonyms: ['eggs'], serving: '1 large egg' },
  { id: 'chicken', name: 'Chicken, unprocessed', category: 'meat', synonyms: ['poultry'], serving: '3 oz cooked' },
  { id: 'ramen', name: 'Instant noodles / ramen', category: 'packaged', synonyms: ['instant noodles'], serving: '1 package' },
  { id: 'protein-powder', name: 'Protein powder / high-protein supplement', category: 'supplements', synonyms: ['protein shake', 'whey powder'], serving: '1 scoop (varies)' },
  { id: 'yogurt', name: 'Plain low-fat yogurt', category: 'dairy', synonyms: ['plain yogurt'], serving: '¾ cup' },
  { id: 'soup', name: 'Canned soup', category: 'packaged', synonyms: ['canned soup'], serving: '1 cup' },
];
