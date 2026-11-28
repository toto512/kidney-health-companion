// Photo-style pictures for the 12 Food group tiles, cut from the reference sheet James supplied (white background, about 140 px wide, shown at 2x).
// Decorative only: the group name on the tile stays the accessible name. Each group has one file in assets/food-groups/.
import type { ImageSourcePropType } from 'react-native';
import type { FoodGroup } from './foods';

export const TILE_IMAGE: Record<FoodGroup, ImageSourcePropType> = {
  vegetables: require('../../assets/food-groups/vegetables.jpg'),
  fruit: require('../../assets/food-groups/fruit.jpg'),
  'grains-bread': require('../../assets/food-groups/grains-bread.jpg'),
  'milk-cheese': require('../../assets/food-groups/milk-cheese.jpg'),
  eggs: require('../../assets/food-groups/eggs.jpg'),
  'meat-poultry': require('../../assets/food-groups/meat-poultry.jpg'),
  'fish-seafood': require('../../assets/food-groups/fish-seafood.jpg'),
  'beans-nuts-seeds': require('../../assets/food-groups/beans-nuts-seeds.jpg'),
  drinks: require('../../assets/food-groups/drinks.jpg'),
  'sweets-snacks': require('../../assets/food-groups/sweets-snacks.jpg'),
  'soups-sauces-meals': require('../../assets/food-groups/soups-sauces-meals.jpg'),
  'takeout-fast': require('../../assets/food-groups/takeout-fast.jpg'),
};
