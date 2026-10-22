import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import type { GlassSpec, Pattern, Profile } from './specs';

const COLS = 120;
const ROWS = 90;
const TAU = Math.PI * 2;

function smoothstep(a: number, b: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function band(t: number, from: number, to: number): number {
  const soft = 0.06;
  return smoothstep(from - soft, from, t) * (1 - smoothstep(to, to + soft, t));
}

/** Cubic Hermite through the profile points with Catmull-Rom style tangents. */
function profileAt(p: Profile, t: number): number {
  if (t <= p[0][0]) return p[0][1];
  if (t >= p[p.length - 1][0]) return p[p.length - 1][1];
  let i = 0;
  while (t > p[i + 1][0]) i++;
  const [t0, r0] = p[i];
  const [t1, r1] = p[i + 1];
  const slope = (a: number) => {
    if (a <= 0) return (p[1][1] - p[0][1]) / (p[1][0] - p[0][0]);
    if (a >= p.length - 1) return (p[a][1] - p[a - 1][1]) / (p[a][0] - p[a - 1][0]);
    return (p[a + 1][1] - p[a - 1][1]) / (p[a + 1][0] - p[a - 1][0]);
  };
  const h = t1 - t0;
  const u = (t - t0) / h;
  const h00 = 2 * u ** 3 - 3 * u ** 2 + 1;
  const h10 = u ** 3 - 2 * u ** 2 + u;
  const h01 = -2 * u ** 3 + 3 * u ** 2;
  const h11 = u ** 3 - u ** 2;
  return h00 * r0 + h10 * h * slope(i) + h01 * r1 + h11 * h * slope(i + 1);
}

/** Radius multiplier of one pattern at angle θ and height t. */
function patternAt(pattern: Pattern, theta: number, t: number): number {
  switch (pattern.kind) {
    case 'facets': {
      const seg = TAU / pattern.count;
      const local = ((theta % seg) + seg) % seg;
      const poly = Math.cos(Math.PI / pattern.count) / Math.cos(local - seg / 2);
      return 1 + band(t, pattern.from, pattern.to) * (poly - 1);
    }
    case 'square': {
      const p = 2 + pattern.amount * 6;
      const sq = 1 / (Math.abs(Math.cos(theta)) ** p + Math.abs(Math.sin(theta)) ** p) ** (1 / p);
      return 1 + band(t, pattern.from, pattern.to) * (0.92 * sq - 1);
    }
    case 'ridges': {
      const pleat = 1 - Math.abs(Math.cos((pattern.count * theta) / 2));
      return 1 - band(t, pattern.from, pattern.to) * pattern.depth * pleat;
    }
    case 'diamond': {
      const row = Math.floor(t * pattern.rows);
      const u = (((pattern.count * theta) / TAU + (row % 2) * 0.5) % 1) - 0.5;
      const v = ((t * pattern.rows) % 1) - 0.5;
      return 1 - pattern.depth * (Math.abs(u) + Math.abs(v)) * band(t, 0.03, 0.9);
    }
    case 'grooves':
      return 1 - pattern.at.reduce((sum, a) => sum + pattern.depth * Math.exp(-(((t - a) / 0.015) ** 2)), 0);
    case 'hammered':
      return (
        1 +
        pattern.depth *
          (Math.sin(9 * theta + 23 * t) * Math.sin(14 * theta - 31 * t) + 0.5 * Math.sin(5 * theta + 47 * t))
      );
  }
}

/** Patterns that change the whole wall (inside follows) versus surface texture. */
const isShape = (p: Pattern) => p.kind === 'facets' || p.kind === 'square';

export type GlassModel = {
  spec: GlassSpec;
  /** Outer radius at angle θ and height t, in mm. */
  outer: (theta: number, t: number) => number;
  inner: (theta: number, t: number) => number;
  /** Fraction of the height taken by the solid base. */
  tBase: number;
  /** Height (0-1) the liquid reaches when holding `ml`. */
  levelFor: (ml: number) => number;
  maxRadius: number;
};

export function glassModel(spec: GlassSpec): GlassModel {
  const patterns = spec.patterns ?? [];
  const H = spec.heightMm;
  const tBase = spec.baseMm / H;
  const shapeMul = (theta: number, t: number) =>
    patterns.filter(isShape).reduce((m, p) => m * patternAt(p, theta, t), 1);
  const outerMul = (theta: number, t: number) =>
    patterns.filter((p) => !(p.kind === 'ridges' && p.inside)).reduce((m, p) => m * patternAt(p, theta, t), 1);
  const insideMul = (theta: number, t: number) =>
    patterns.filter((p) => p.kind === 'ridges' && p.inside).reduce((m, p) => m * patternAt(p, theta, t), 1);
  const textureDepth = Math.max(
    0,
    ...patterns.map((p) => (p.kind === 'ridges' && !p.inside) || p.kind === 'diamond' || p.kind === 'grooves' || p.kind === 'hammered' ? p.depth : 0),
  );

  const innerAt = (scale: number, theta: number, t: number) =>
    Math.max(1, scale * profileAt(spec.profile, t) * shapeMul(theta, t) * (1 - textureDepth) - spec.wallMm) *
    insideMul(theta, t);

  const volumeMm3 = (scale: number, tTop = 1) => {
    const steps = 60;
    const angles = 48;
    let v = 0;
    for (let i = 0; i < steps; i++) {
      const t = tBase + ((tTop - tBase) * (i + 0.5)) / steps;
      let area = 0;
      for (let j = 0; j < angles; j++) {
        const r = innerAt(scale, (TAU * j) / angles, t);
        area += 0.5 * r * r * (TAU / angles);
      }
      v += area * ((tTop - tBase) * H) / steps;
    }
    return v;
  };

  // Solve the rim radius so the glass holds its listed capacity to the brim.
  let lo = 10;
  let hi = 80;
  for (let k = 0; k < 40; k++) {
    const mid = (lo + hi) / 2;
    if (volumeMm3(mid) < spec.capacityMl * 1000) lo = mid;
    else hi = mid;
  }
  const scale = (lo + hi) / 2;

  const levelFor = (ml: number) => {
    let a = tBase;
    let b = 1;
    for (let k = 0; k < 30; k++) {
      const mid = (a + b) / 2;
      if (volumeMm3(scale, mid) < ml * 1000) a = mid;
      else b = mid;
    }
    return (a + b) / 2;
  };

  let maxRadius = 0;
  for (let i = 0; i <= 20; i++) maxRadius = Math.max(maxRadius, scale * profileAt(spec.profile, i / 20));

  return {
    spec,
    outer: (theta, t) => scale * profileAt(spec.profile, t) * outerMul(theta, t),
    inner: (theta, t) => innerAt(scale, theta, t),
    tBase,
    levelFor,
    maxRadius: maxRadius * 1.08,
  };
}

/** A (rows+1) x (cols+1) grid of vertices, wound so normals face `outward`. */
function grid(rows: number, cols: number, at: (i: number, j: number) => THREE.Vector3, outward: boolean) {
  const pos: number[] = [];
  for (let i = 0; i <= rows; i++) {
    for (let j = 0; j <= cols; j++) {
      const v = at(i, j);
      pos.push(v.x, v.y, v.z);
    }
  }
  const idx: number[] = [];
  const w = cols + 1;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const a = i * w + j;
      const b = a + 1;
      const c = a + w;
      const d = c + 1;
      if (outward) idx.push(a, c, b, b, c, d);
      else idx.push(a, b, c, b, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}

const polar = (r: number, theta: number, y: number) =>
  new THREE.Vector3(r * Math.cos(theta), y, -r * Math.sin(theta));

function finish(g: THREE.BufferGeometry, flat: boolean): THREE.BufferGeometry {
  const out = flat ? g.toNonIndexed() : g;
  out.computeVertexNormals();
  return out;
}

export function glassGeometry(model: GlassModel): THREE.BufferGeometry {
  const { spec, outer, inner, tBase } = model;
  const H = spec.heightMm;
  const flat = (spec.patterns ?? []).some((p) => p.kind === 'facets' || p.kind === 'diamond');
  const th = (j: number) => (TAU * j) / COLS;

  const parts = [
    // Outer wall, base to rim.
    grid(ROWS, COLS, (i, j) => polar(outer(th(j), i / ROWS), th(j), (i / ROWS) * H), true),
    // Rim, outer to inner edge.
    grid(1, COLS, (i, j) => polar(i === 0 ? outer(th(j), 1) : inner(th(j), 1), th(j), H), true),
    // Inner wall, rim down to the top of the solid base.
    grid(ROWS, COLS, (i, j) => {
      const t = 1 - (i / ROWS) * (1 - tBase);
      return polar(inner(th(j), t), th(j), t * H);
    }, true),
    // Inside floor.
    grid(1, COLS, (i, j) => polar(i === 0 ? inner(th(j), tBase) : 0, th(j), tBase * H), true),
    // Underside.
    grid(1, COLS, (i, j) => polar(i === 0 ? 0 : outer(th(j), 0), th(j), 0), true),
  ].map((g) => finish(g, flat));

  return mergeGeometries(parts.map((g) => (flat ? g : g.toNonIndexed())))!;
}

export function liquidGeometry(model: GlassModel, ml: number): THREE.BufferGeometry {
  const { spec, inner, tBase } = model;
  const H = spec.heightMm;
  const level = model.levelFor(ml);
  const th = (j: number) => (TAU * j) / COLS;
  const r = (j: number, t: number) => inner(th(j), t) - 0.4;
  const rows = 40;
  const parts = [
    grid(rows, COLS, (i, j) => {
      const t = tBase + (i / rows) * (level - tBase);
      return polar(r(j, t), th(j), t * H + 0.3);
    }, true),
    grid(1, COLS, (i, j) => polar(i === 0 ? 0 : r(j, level), th(j), level * H), true),
    grid(1, COLS, (i, j) => polar(i === 0 ? r(j, tBase) : 0, th(j), tBase * H + 0.3), true),
  ].map((g) => finish(g, false).toNonIndexed());
  // Groups: 0 side, 1 surface, 2 bottom.
  return mergeGeometries(parts, true)!;
}

const GLASS_VERTEX = `
varying vec3 vNormal;
varying vec3 vView;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;

// Clear glass on a light background: nearly invisible face-on, darker toward
// the silhouette (Fresnel), with vertical soft-box highlights.
const GLASS_FRAGMENT = `
uniform vec3 tint;
uniform float baseAlpha;
uniform float strength;
varying vec3 vNormal;
varying vec3 vView;

float strip(vec3 r, vec2 dir, float width) {
  float h = dot(normalize(r.xz + 1e-4), normalize(dir));
  float vertical = smoothstep(-0.7, -0.25, r.y) * (1.0 - smoothstep(0.55, 0.9, r.y));
  return smoothstep(1.0 - width, 1.0 - width * 0.25, h) * vertical;
}

void main() {
  vec3 n = normalize(vNormal);
  if (!gl_FrontFacing) n = -n;
  vec3 v = normalize(vView);
  float facing = clamp(abs(dot(n, v)), 0.0, 1.0);
  float fresnel = pow(1.0 - facing, 2.4);
  vec3 r = reflect(-v, n);
  float highlight = max(strip(r, vec2(-0.55, 0.85), 0.08), 0.75 * strip(r, vec2(0.8, 0.6), 0.05));
  vec3 edge = tint * 0.62;
  vec3 color = mix(edge, vec3(1.0), highlight);
  float alpha = baseAlpha + strength * (0.8 * fresnel + 0.9 * highlight);
  gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
}
`;

function glassMaterial(side: THREE.Side, tint: THREE.Color, baseAlpha: number, strength: number) {
  return new THREE.ShaderMaterial({
    vertexShader: GLASS_VERTEX,
    fragmentShader: GLASS_FRAGMENT,
    uniforms: { tint: { value: tint }, baseAlpha: { value: baseAlpha }, strength: { value: strength } },
    transparent: true,
    depthWrite: false,
    side,
  });
}

export type GlassScene = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  pivot: THREE.Group;
  setLiquid: (color: string) => void;
  dispose: () => void;
};

/** A lit scene with the glass, its liquid and a camera framing them. */
export function createGlassScene(
  spec: GlassSpec,
  opts: { liquid: string; fillMl?: number; aspect?: number },
): GlassScene {
  const model = glassModel(spec);
  const scene = new THREE.Scene();

  const pivot = new THREE.Group();
  pivot.position.y = -spec.heightMm / 2;
  const holder = new THREE.Group();
  holder.add(pivot);
  scene.add(holder);

  const glassGeo = glassGeometry(model);
  const tint = new THREE.Color(spec.tint ?? '#C9D6E6');

  const liquidMat = new THREE.MeshPhongMaterial({
    color: new THREE.Color(opts.liquid),
    specular: new THREE.Color('#FFFFFF'),
    shininess: 80,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });
  const surfaceMat = liquidMat.clone();
  surfaceMat.color = new THREE.Color(opts.liquid).lerp(new THREE.Color('#FFFFFF'), 0.35);
  const liquidGeo = liquidGeometry(model, opts.fillMl ?? spec.capacityMl * 0.85);

  const materials = [
    glassMaterial(THREE.BackSide, tint, spec.tint ? 0.25 : 0.03, 0.6),
    liquidMat,
    glassMaterial(THREE.FrontSide, tint, spec.tint ? 0.2 : 0.02, 1),
  ];
  materials.forEach((m, i) => {
    const mesh =
      m === liquidMat
        ? new THREE.Mesh(liquidGeo, [liquidMat, surfaceMat, liquidMat])
        : new THREE.Mesh(glassGeo, m);
    mesh.renderOrder = i;
    pivot.add(mesh);
  });

  scene.add(new THREE.HemisphereLight('#FFFFFF', '#B9C8DA', 1.6));
  const key = new THREE.DirectionalLight('#FFFFFF', 2.2);
  key.position.set(-120, 200, 160);
  scene.add(key);
  const rim = new THREE.DirectionalLight('#DDEBFF', 1.6);
  rim.position.set(160, 80, -180);
  scene.add(rim);

  const aspect = opts.aspect ?? 1;
  const camera = new THREE.PerspectiveCamera(28, aspect, 1, 5000);
  const halfH = spec.heightMm / 2 + model.maxRadius * 0.35;
  const halfW = model.maxRadius;
  const fov = THREE.MathUtils.degToRad(camera.fov);
  const dist = Math.max(halfH / Math.tan(fov / 2), halfW / (Math.tan(fov / 2) * aspect)) * 1.12 + model.maxRadius;
  const elevation = THREE.MathUtils.degToRad(16);
  camera.position.set(0, Math.sin(elevation) * dist, Math.cos(elevation) * dist);
  camera.lookAt(0, 0, 0);

  return {
    scene,
    camera,
    pivot,
    setLiquid: (color) => {
      liquidMat.color.set(color);
      surfaceMat.color.set(color).lerp(new THREE.Color('#FFFFFF'), 0.35);
    },
    dispose: () => {
      glassGeo.dispose();
      liquidGeo.dispose();
      materials.forEach((m) => m.dispose());
      surfaceMat.dispose();
    },
  };
}
