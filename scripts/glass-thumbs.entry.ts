// Browser entry used by render-glass-thumbs.mjs to pre-render the 3D glasses.
import * as THREE from 'three';

import { createGlassScene } from '../src/lib/glass3d/buildGlass';
import { SPECS } from '../src/lib/glass3d/specs';

const SIZE = 360;
const canvas = document.createElement('canvas');
canvas.width = SIZE;
canvas.height = SIZE;
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
renderer.setClearColor(0x000000, 0);

const out: Record<string, string> = {};
for (const [id, spec] of Object.entries(SPECS)) {
  const s = createGlassScene(spec, { liquid: '#4FA8F7' });
  s.pivot.rotation.y = 0.35;
  renderer.render(s.scene, s.camera);
  out[id] = canvas.toDataURL('image/png');
  s.dispose();
}
(window as unknown as { thumbs: Record<string, string> }).thumbs = out;
