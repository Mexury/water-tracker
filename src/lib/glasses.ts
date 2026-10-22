/** IKEA drinking glasses with their listed capacity (ikea.com, Oct 2026). */
export type Glass = {
  id: string;
  name: string;
  capacityMl: number;
  note: string;
};

export const GLASSES: Glass[] = [
  {
    id: 'pokal-35',
    name: 'POKAL',
    capacityMl: 350,
    note: 'Tall faceted classic',
  },
  {
    id: 'pokal-27',
    name: 'POKAL',
    capacityMl: 270,
    note: 'Smaller faceted classic',
  },
  {
    id: 'ikea365-30',
    name: 'IKEA 365+',
    capacityMl: 300,
    note: 'Straight, sleek tumbler',
  },
  {
    id: 'ikea365-45',
    name: 'IKEA 365+',
    capacityMl: 450,
    note: 'Large straight tumbler',
  },
  {
    id: 'godis-40',
    name: 'GODIS',
    capacityMl: 400,
    note: 'Tall, for drinks with ice',
  },
  {
    id: 'godis-23',
    name: 'GODIS',
    capacityMl: 230,
    note: 'Short and simple',
  },
  {
    id: 'vardagen-43',
    name: 'VARDAGEN',
    capacityMl: 430,
    note: 'Ribbed, sturdy',
  },
  {
    id: 'vardagen-31',
    name: 'VARDAGEN',
    capacityMl: 310,
    note: 'Ribbed, light turquoise',
  },
  {
    id: 'storsint-37',
    name: 'STORSINT',
    capacityMl: 370,
    note: 'Crystal-clear, slightly flared',
  },
  {
    id: 'ivrig-45',
    name: 'IVRIG',
    capacityMl: 450,
    note: 'Squared bowl, no stem',
  },
  {
    id: 'olivtrast-29',
    name: 'OLIVTRAST',
    capacityMl: 290,
    note: 'Textured, wider top half',
  },
  {
    id: 'frojda-30',
    name: 'FRÖJDA',
    capacityMl: 300,
    note: 'Diamond facets',
  },
  {
    id: 'klipplax-25',
    name: 'KLIPPLAX',
    capacityMl: 250,
    note: 'Thin, rippled inside',
  },
  {
    id: 'reko-17',
    name: 'REKO',
    capacityMl: 170,
    note: 'Stackable, narrow waist',
  },
  {
    id: 'pokal-espresso-10',
    name: 'POKAL espresso',
    capacityMl: 100,
    note: 'Tiny ribbed glass',
  },
];

export const DEFAULT_GLASS_IDS = ['pokal-35', 'ikea365-30', 'godis-40'];

export function getGlass(id: string): Glass | undefined {
  return GLASSES.find((g) => g.id === id);
}
