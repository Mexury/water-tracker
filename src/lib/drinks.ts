export type DrinkId =
  | 'water'
  | 'tea'
  | 'coffee'
  | 'juice'
  | 'milk'
  | 'soda'
  | 'sports'
  | 'smoothie';

export type Drink = {
  id: DrinkId;
  label: string;
  emoji: string;
  color: string;
  /** Share of the volume that counts towards hydration. */
  hydration: number;
};

export const DRINKS: Drink[] = [
  { id: 'water', label: 'Water', emoji: '💧', color: '#4FA8F7', hydration: 1 },
  { id: 'tea', label: 'Tea', emoji: '🍵', color: '#8BC48A', hydration: 0.9 },
  { id: 'coffee', label: 'Coffee', emoji: '☕️', color: '#A9785A', hydration: 0.8 },
  { id: 'juice', label: 'Juice', emoji: '🧃', color: '#F7B84F', hydration: 0.85 },
  { id: 'milk', label: 'Milk', emoji: '🥛', color: '#C9D6E8', hydration: 0.9 },
  { id: 'soda', label: 'Soda', emoji: '🥤', color: '#E7685F', hydration: 0.7 },
  { id: 'sports', label: 'Sports', emoji: '⚡️', color: '#7AD3C9', hydration: 1 },
  { id: 'smoothie', label: 'Smoothie', emoji: '🍓', color: '#F28DB2', hydration: 0.8 },
];

export const CUP_SIZES_ML = [100, 200, 250, 330, 500];

export function getDrink(id: DrinkId): Drink {
  return DRINKS.find((d) => d.id === id) ?? DRINKS[0];
}
