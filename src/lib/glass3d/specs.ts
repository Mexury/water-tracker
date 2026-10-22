/**
 * Shape specs for IKEA glasses. Heights and capacities are IKEA's listed
 * figures; the profile and surface pattern follow IKEA's product
 * descriptions. The radius is solved so the inside holds the listed volume.
 */

/** Outer radius relative to the rim, at points from base (0) to rim (1). */
export type Profile = [t: number, r: number][];

export type Pattern =
  /** Flat panels, e.g. POKAL's hexagonal body. */
  | { kind: 'facets'; count: number; from: number; to: number }
  /** Vertical pleats, e.g. VARDAGEN. */
  | { kind: 'ridges'; count: number; depth: number; from: number; to: number; inside?: boolean }
  /** Rows of diamond facets, e.g. FRÖJDA. */
  | { kind: 'diamond'; count: number; rows: number; depth: number }
  /** Horizontal rings, e.g. REKO. */
  | { kind: 'grooves'; at: number[]; depth: number }
  /** Uneven hand-made texture, e.g. OLIVTRAST. */
  | { kind: 'hammered'; depth: number }
  /** Rounded square cross-section, e.g. IVRIG. */
  | { kind: 'square'; amount: number; from: number; to: number };

export type GlassSpec = {
  heightMm: number;
  capacityMl: number;
  profile: Profile;
  wallMm: number;
  baseMm: number;
  patterns?: Pattern[];
  /** Glass colour for tinted glasses. */
  tint?: string;
};

const straight: Profile = [
  [0, 0.95],
  [1, 1],
];

export const SPECS: Record<string, GlassSpec> = {
  'pokal-35': {
    heightMm: 140,
    capacityMl: 350,
    profile: [
      [0, 0.8],
      [0.4, 0.86],
      [0.7, 0.94],
      [1, 1],
    ],
    wallMm: 2.6,
    baseMm: 13,
    patterns: [{ kind: 'facets', count: 6, from: 0, to: 0.5 }],
  },
  'pokal-27': {
    heightMm: 100,
    capacityMl: 270,
    profile: [
      [0, 0.8],
      [0.4, 0.86],
      [0.7, 0.94],
      [1, 1],
    ],
    wallMm: 2.6,
    baseMm: 11,
    patterns: [{ kind: 'facets', count: 6, from: 0, to: 0.5 }],
  },
  'ikea365-30': {
    heightMm: 120,
    capacityMl: 300,
    profile: [
      [0, 0.8],
      [0.02, 0.9],
      [0.07, 0.95],
      [1, 1],
    ],
    wallMm: 2.4,
    baseMm: 10,
  },
  'ikea365-45': {
    heightMm: 135,
    capacityMl: 450,
    profile: [
      [0, 0.8],
      [0.02, 0.9],
      [0.07, 0.95],
      [1, 1],
    ],
    wallMm: 2.4,
    baseMm: 10,
  },
  'godis-40': { heightMm: 160, capacityMl: 400, profile: straight, wallMm: 2.8, baseMm: 15 },
  'godis-23': { heightMm: 100, capacityMl: 230, profile: straight, wallMm: 2.8, baseMm: 13 },
  'vardagen-43': {
    heightMm: 130,
    capacityMl: 430,
    profile: [
      [0, 0.9],
      [0.08, 0.94],
      [1, 1],
    ],
    wallMm: 2.6,
    baseMm: 10,
    patterns: [{ kind: 'ridges', count: 24, depth: 0.05, from: 0, to: 0.72 }],
  },
  'vardagen-31': {
    heightMm: 110,
    capacityMl: 310,
    profile: [
      [0, 0.9],
      [0.08, 0.94],
      [1, 1],
    ],
    wallMm: 2.6,
    baseMm: 10,
    patterns: [{ kind: 'ridges', count: 24, depth: 0.05, from: 0, to: 0.72 }],
    tint: '#9FE3D6',
  },
  'storsint-37': {
    heightMm: 100,
    capacityMl: 370,
    profile: [
      [0, 0.8],
      [0.3, 0.86],
      [1, 1],
    ],
    wallMm: 1.8,
    baseMm: 9,
  },
  'ivrig-45': {
    heightMm: 110,
    capacityMl: 450,
    profile: [
      [0, 0.66],
      [0.08, 0.86],
      [0.3, 0.98],
      [0.65, 1.0],
      [1, 0.96],
    ],
    wallMm: 2,
    baseMm: 7,
    patterns: [{ kind: 'square', amount: 0.55, from: 0, to: 1 }],
  },
  'olivtrast-29': {
    heightMm: 75,
    capacityMl: 290,
    profile: [
      [0, 0.74],
      [0.38, 0.78],
      [0.5, 0.95],
      [1, 1],
    ],
    wallMm: 2.6,
    baseMm: 7,
    patterns: [{ kind: 'hammered', depth: 0.008 }],
  },
  'frojda-30': {
    heightMm: 90,
    capacityMl: 300,
    profile: [
      [0, 0.8],
      [0.15, 0.87],
      [1, 1],
    ],
    wallMm: 2.6,
    baseMm: 8,
    patterns: [{ kind: 'diamond', count: 12, rows: 4, depth: 0.1 }],
  },
  'klipplax-25': {
    heightMm: 100,
    capacityMl: 250,
    profile: [
      [0, 0.97],
      [1, 1],
    ],
    wallMm: 1.4,
    baseMm: 5,
    patterns: [{ kind: 'ridges', count: 30, depth: 0.03, from: 0.05, to: 1, inside: true }],
  },
  'reko-17': {
    heightMm: 90,
    capacityMl: 170,
    profile: [
      [0, 0.66],
      [0.3, 0.7],
      [0.55, 0.8],
      [1, 1],
    ],
    wallMm: 2,
    baseMm: 6,
    patterns: [{ kind: 'grooves', at: [0.1, 0.18, 0.26], depth: 0.025 }],
  },
  'pokal-espresso-10': {
    heightMm: 70,
    capacityMl: 100,
    profile: [
      [0, 0.92],
      [1, 1],
    ],
    wallMm: 2.4,
    baseMm: 10,
    patterns: [{ kind: 'ridges', count: 16, depth: 0.035, from: 0, to: 0.7 }],
  },
};
