import { useEffect, useId, useState } from 'react';
import Svg, { Defs, Ellipse, G, LinearGradient, Path, Stop } from 'react-native-svg';

import { glassGeometry, VIEW_H, VIEW_W } from '../lib/glassGeometry';
import type { GlassShape } from '../lib/glasses';

type Props = {
  shape: GlassShape;
  /** Liquid colour, usually the selected drink's colour. */
  liquid: string;
  /** Liquid level, 0 to 1. */
  fill?: number;
  height?: number;
  /** Slowly rotates the glass so its facets catch the light. */
  spin?: boolean;
};

function useSpin(enabled: boolean): number {
  const [phase, setPhase] = useState(0.35);
  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    const start = Date.now();
    const tick = () => {
      setPhase(0.35 + ((Date.now() - start) / 1000) * 0.6);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [enabled]);
  return phase;
}

export function Glass3D({ shape, liquid, fill = 0.8, height = 120, spin = false }: Props) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const phase = useSpin(spin);
  const g = glassGeometry(shape, fill, phase);
  const glassEdge = shape.tint ?? '#C8D8EA';

  return (
    <Svg width={(height * VIEW_W) / VIEW_H} height={height} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
      <Defs>
        <LinearGradient id={`glass${id}`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={glassEdge} stopOpacity={0.95} />
          <Stop offset="0.18" stopColor="#FFFFFF" stopOpacity={shape.tint ? 0.35 : 0.2} />
          <Stop offset="0.75" stopColor={shape.tint ?? '#FFFFFF'} stopOpacity={shape.tint ? 0.3 : 0.12} />
          <Stop offset="1" stopColor={glassEdge} stopOpacity={0.9} />
        </LinearGradient>
        <LinearGradient id={`liquid${id}`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={liquid} stopOpacity={1} />
          <Stop offset="0.35" stopColor={liquid} stopOpacity={0.7} />
          <Stop offset="0.7" stopColor={liquid} stopOpacity={0.78} />
          <Stop offset="1" stopColor={liquid} stopOpacity={1} />
        </LinearGradient>
      </Defs>

      <Ellipse {...g.shadow} fill="#1F2A44" opacity={0.1} />
      <Path d={g.rimBack} stroke="#9FB4CA" strokeWidth={1} fill="none" opacity={0.7} />

      {g.liquid && g.surface && (
        <G>
          <Path d={g.liquid} fill={`url(#liquid${id})`} />
          <Ellipse {...g.surface} fill="#FFFFFF" opacity={0.55} />
          <Ellipse {...g.surface} fill={liquid} opacity={0.45} />
        </G>
      )}

      <Path d={g.body} fill={`url(#glass${id})`} stroke="#9FB4CA" strokeWidth={1} />
      <Path d={g.base} fill="#FFFFFF" opacity={0.35} />
      <Ellipse {...g.baseTop} fill="none" stroke="#FFFFFF" strokeWidth={1} opacity={0.7} />

      {g.edges.map((e, i) => (
        <G key={i}>
          <Path d={e.d} stroke="#8EA6BF" strokeWidth={0.9} fill="none" opacity={0.6 * e.opacity} />
          <Path d={e.d} stroke="#FFFFFF" strokeWidth={0.7} fill="none" opacity={0.85 * e.opacity} translateX={0.9} />
        </G>
      ))}

      {g.highlights.map((d, i) => (
        <Path key={i} d={d} fill="#FFFFFF" opacity={i === 0 ? 0.6 : 0.35} />
      ))}
      <Path d={g.rimFront} stroke="#FFFFFF" strokeWidth={1.8} fill="none" opacity={0.9} />
      <Path d={g.rimFront} stroke="#9FB4CA" strokeWidth={0.6} fill="none" opacity={0.8} />
    </Svg>
  );
}
