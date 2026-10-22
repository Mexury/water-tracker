import type { GlassShape } from './glasses';

/** Shared canvas so every glass is drawn at the same real-world scale. */
export const VIEW_W = 110;
export const VIEW_H = 178;

/** Vertical squash of circles seen slightly from above. */
const K = 0.24;
const CX = VIEW_W / 2;
const SAMPLES = 28;
const WALL = 1.8;
const BASE_MM = 7;

type Pt = [number, number];

/** Catmull-Rom through the radii so curved glasses stay smooth. */
function radiusAt(radii: number[], t: number): number {
  const n = radii.length - 1;
  const seg = Math.min(n - 1, Math.floor(t * n));
  const u = t * n - seg;
  const p0 = radii[Math.max(0, seg - 1)];
  const p1 = radii[seg];
  const p2 = radii[seg + 1];
  const p3 = radii[Math.min(n, seg + 2)];
  return (
    0.5 *
    (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u)
  );
}

function fmt(n: number): string {
  return n.toFixed(2);
}

export type GlassGeometry = {
  shadow: { cx: number; cy: number; rx: number; ry: number };
  body: string;
  base: string;
  baseTop: { cx: number; cy: number; rx: number; ry: number };
  liquid: string | null;
  surface: { cx: number; cy: number; rx: number; ry: number } | null;
  rimBack: string;
  rimFront: string;
  highlights: string[];
  edges: { d: string; opacity: number }[];
};

/**
 * Projects a glass made of stacked circles into 2D paths.
 * @param fill Liquid level, 0 (empty) to 1 (brim).
 * @param phase Rotation of the facets in radians, for spinning.
 */
export function glassGeometry(shape: GlassShape, fill: number, phase = 0.35): GlassGeometry {
  const { heightMm: H, radiiMm, edges } = shape;
  const r = (t: number) => radiusAt(radiiMm, t);
  const ri = (t: number) => Math.max(1, r(t) - WALL);
  const r0 = r(0);
  const baseY = VIEW_H - 6 - r0 * K;
  const y = (t: number) => baseY - t * H;
  const tBase = BASE_MM / H;

  const ts = (t0: number, t1: number) =>
    Array.from({ length: SAMPLES + 1 }, (_, i) => t0 + ((t1 - t0) * i) / SAMPLES);

  /** Closed outline of the solid between t0 and t1, top closed along the back. */
  const solid = (rad: (t: number) => number, t0: number, t1: number): string => {
    const steps = ts(t0, t1);
    const left: Pt[] = [...steps].reverse().map((t) => [CX - rad(t), y(t)]);
    const right: Pt[] = steps.map((t) => [CX + rad(t), y(t)]);
    const rb = rad(t0);
    const rt = rad(t1);
    let d = `M ${fmt(left[0][0])} ${fmt(left[0][1])}`;
    for (const [px, py] of left.slice(1)) d += ` L ${fmt(px)} ${fmt(py)}`;
    d += ` A ${fmt(rb)} ${fmt(rb * K)} 0 0 0 ${fmt(right[0][0])} ${fmt(right[0][1])}`;
    for (const [px, py] of right.slice(1)) d += ` L ${fmt(px)} ${fmt(py)}`;
    d += ` A ${fmt(rt)} ${fmt(rt * K)} 0 0 0 ${fmt(left[0][0])} ${fmt(left[0][1])} Z`;
    return d;
  };

  const rTop = r(1);
  const yTop = y(1);
  const level = tBase + Math.max(0, Math.min(1, fill)) * (0.97 - tBase);

  const strip = (from: number, to: number, t0: number, t1: number): string => {
    const steps = ts(t0, t1);
    const a = steps.map((t) => `${fmt(CX + from * r(t))} ${fmt(y(t) + Math.sqrt(1 - from * from) * r(t) * K)}`);
    const b = [...steps].reverse().map((t) => `${fmt(CX + to * r(t))} ${fmt(y(t) + Math.sqrt(1 - to * to) * r(t) * K)}`);
    return `M ${a.join(' L ')} L ${b.join(' L ')} Z`;
  };

  const edgePaths: { d: string; opacity: number }[] = [];
  for (let i = 0; i < edges; i++) {
    const a = (2 * Math.PI * i) / edges + phase;
    const c = Math.cos(a);
    if (c < 0.08) continue;
    const pts = ts(0.02, 0.985).map((t) => `${fmt(CX + r(t) * Math.sin(a))} ${fmt(y(t) + r(t) * K * c)}`);
    edgePaths.push({ d: `M ${pts.join(' L ')}`, opacity: c });
  }

  return {
    shadow: { cx: CX + 3, cy: baseY + 2, rx: r0 * 1.15, ry: r0 * K * 1.15 },
    body: solid(r, 0, 1),
    base: solid(r, 0, tBase),
    baseTop: { cx: CX, cy: y(tBase), rx: ri(tBase), ry: ri(tBase) * K },
    liquid: fill > 0.01 ? solid(ri, tBase, level) : null,
    surface: fill > 0.01 ? { cx: CX, cy: y(level), rx: ri(level), ry: ri(level) * K } : null,
    rimBack: `M ${fmt(CX - rTop)} ${fmt(yTop)} A ${fmt(rTop)} ${fmt(rTop * K)} 0 0 1 ${fmt(CX + rTop)} ${fmt(yTop)}`,
    rimFront: `M ${fmt(CX - rTop)} ${fmt(yTop)} A ${fmt(rTop)} ${fmt(rTop * K)} 0 0 0 ${fmt(CX + rTop)} ${fmt(yTop)}`,
    highlights: [strip(-0.66, -0.5, 0.06, 0.93), strip(0.72, 0.8, 0.1, 0.9)],
    edges: edgePaths,
  };
}
