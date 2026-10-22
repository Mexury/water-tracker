/**
 * IKEA drinking glasses with their listed capacity (ikea.com, Oct 2026).
 * Shapes are approximations in millimetres, used only for rendering.
 */
export type GlassShape = {
  heightMm: number;
  /** Outer radius from bottom to top, evenly spaced over the height. */
  radiiMm: number[];
  /** Number of vertical facets or ridges (0 for a smooth glass). */
  edges: number;
  /** Glass tint, if the glass is coloured. */
  tint?: string;
};

export type Glass = {
  id: string;
  name: string;
  capacityMl: number;
  note: string;
  shape: GlassShape;
};

export const GLASSES: Glass[] = [
  {
    id: 'pokal-35',
    name: 'POKAL',
    capacityMl: 350,
    note: 'Tall faceted classic',
    shape: { heightMm: 140, radiiMm: [30, 33, 36, 38, 40], edges: 6 },
  },
  {
    id: 'pokal-27',
    name: 'POKAL',
    capacityMl: 270,
    note: 'Smaller faceted classic',
    shape: { heightMm: 115, radiiMm: [29, 31, 34, 36, 38], edges: 6 },
  },
  {
    id: 'ikea365-30',
    name: 'IKEA 365+',
    capacityMl: 300,
    note: 'Straight, sleek tumbler',
    shape: { heightMm: 120, radiiMm: [26, 30, 31, 32, 33], edges: 0 },
  },
  {
    id: 'ikea365-45',
    name: 'IKEA 365+',
    capacityMl: 450,
    note: 'Large straight tumbler',
    shape: { heightMm: 140, radiiMm: [30, 34, 35, 36, 37], edges: 0 },
  },
  {
    id: 'godis-40',
    name: 'GODIS',
    capacityMl: 400,
    note: 'Tall, for drinks with ice',
    shape: { heightMm: 150, radiiMm: [30, 31, 31, 32, 32], edges: 0 },
  },
  {
    id: 'godis-23',
    name: 'GODIS',
    capacityMl: 230,
    note: 'Short and simple',
    shape: { heightMm: 92, radiiMm: [29, 30, 30, 31, 31], edges: 0 },
  },
  {
    id: 'vardagen-43',
    name: 'VARDAGEN',
    capacityMl: 430,
    note: 'Ribbed, sturdy',
    shape: { heightMm: 135, radiiMm: [33, 34, 34, 35, 35], edges: 18 },
  },
  {
    id: 'vardagen-31',
    name: 'VARDAGEN',
    capacityMl: 310,
    note: 'Ribbed, light turquoise',
    shape: { heightMm: 110, radiiMm: [31, 32, 32, 33, 33], edges: 18, tint: '#7FD6CB' },
  },
  {
    id: 'storsint-37',
    name: 'STORSINT',
    capacityMl: 370,
    note: 'Crystal-like, flared',
    shape: { heightMm: 135, radiiMm: [29, 30, 32, 35, 38], edges: 0 },
  },
  {
    id: 'ivrig-45',
    name: 'IVRIG',
    capacityMl: 450,
    note: 'Round bowl, no stem',
    shape: { heightMm: 105, radiiMm: [28, 40, 45, 45, 41], edges: 0 },
  },
  {
    id: 'olivtrast-29',
    name: 'OLIVTRAST',
    capacityMl: 290,
    note: 'Round, wide mouth',
    shape: { heightMm: 90, radiiMm: [30, 37, 40, 41, 41], edges: 0 },
  },
  {
    id: 'frojda-30',
    name: 'FRÖJDA',
    capacityMl: 300,
    note: 'Diamond facets',
    shape: { heightMm: 100, radiiMm: [30, 34, 37, 38, 39], edges: 12 },
  },
  {
    id: 'klipplax-25',
    name: 'KLIPPLAX',
    capacityMl: 250,
    note: 'Wavy texture',
    shape: { heightMm: 100, radiiMm: [30, 31, 31, 32, 32], edges: 10 },
  },
  {
    id: 'reko-17',
    name: 'REKO',
    capacityMl: 170,
    note: 'Small, stackable',
    shape: { heightMm: 85, radiiMm: [25, 27, 29, 31, 33], edges: 0 },
  },
  {
    id: 'pokal-espresso-10',
    name: 'POKAL espresso',
    capacityMl: 100,
    note: 'Tiny ribbed glass',
    shape: { heightMm: 75, radiiMm: [24, 25, 26, 27, 28], edges: 8 },
  },
];

export const DEFAULT_GLASS_IDS = ['pokal-35', 'ikea365-30', 'godis-40'];

export function getGlass(id: string): Glass | undefined {
  return GLASSES.find((g) => g.id === id);
}
