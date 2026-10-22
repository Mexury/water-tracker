import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, View } from 'react-native';
import * as THREE from 'three';

import { createGlassScene, type GlassScene } from '../lib/glass3d/buildGlass';
import { SPECS } from '../lib/glass3d/specs';
import { GlassThumb } from './GlassThumb';

type Props = { id: string; liquid: string; size: number };

const IDLE_SPIN = 0.5; // radians per second

/** A live three.js render of the glass. Drag to spin it; it keeps turning slowly. */
export function Glass3DView({ id, liquid, size }: Props) {
  const [failed, setFailed] = useState(false);
  const sceneRef = useRef<GlassScene | null>(null);
  const spin = useRef({ angle: 0.35, velocity: IDLE_SPIN, dragging: false, lastDx: 0 });

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          spin.current.dragging = true;
          spin.current.lastDx = 0;
        },
        onPanResponderMove: (_, g) => {
          spin.current.angle += (g.dx - spin.current.lastDx) * 0.012;
          spin.current.lastDx = g.dx;
        },
        onPanResponderRelease: (_, g) => {
          spin.current.dragging = false;
          spin.current.velocity = Math.max(-8, Math.min(8, g.vx * 6)) || IDLE_SPIN;
        },
      }),
    [],
  );

  useEffect(() => {
    sceneRef.current?.setLiquid(liquid);
  }, [liquid]);

  const rafRef = useRef(0);
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const onContextCreate = (gl: ExpoWebGLRenderingContext) => {
    try {
      const width = gl.drawingBufferWidth;
      const height = gl.drawingBufferHeight;
      const canvas = {
        width,
        height,
        style: {},
        clientHeight: height,
        addEventListener: () => {},
        removeEventListener: () => {},
        getContext: () => gl,
      } as unknown as HTMLCanvasElement;
      const renderer = new THREE.WebGLRenderer({ canvas, context: gl as unknown as WebGL2RenderingContext, antialias: true });
      renderer.setPixelRatio(1);
      renderer.setSize(width, height, false);
      renderer.setClearColor(0xffffff, 1);

      sceneRef.current?.dispose();
      const s = createGlassScene(SPECS[id], { liquid, aspect: width / height });
      sceneRef.current = s;

      let last = Date.now();
      const frame = () => {
        const now = Date.now();
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const st = spin.current;
        if (!st.dragging) {
          st.angle += st.velocity * dt;
          st.velocity += (Math.sign(st.velocity || 1) * IDLE_SPIN - st.velocity) * Math.min(1, dt * 1.5);
        }
        s.pivot.rotation.y = st.angle;
        renderer.render(s.scene, s.camera);
        gl.endFrameEXP();
        rafRef.current = requestAnimationFrame(frame);
      };
      frame();
    } catch {
      setFailed(true);
    }
  };

  if (failed) return <GlassThumb id={id} size={size} />;

  return (
    <View style={{ width: size, height: size }} {...pan.panHandlers}>
      <GLView key={id} style={{ width: size, height: size }} onContextCreate={onContextCreate} />
    </View>
  );
}
