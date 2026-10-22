import { useEffect, useRef, useState } from 'react';
import Svg, { Circle, ClipPath, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { colors } from '../lib/theme';

const SIZE = 260;
const C = SIZE / 2;
const R = 112;

const BUBBLES = [
  { x: -50, speed: 26, r: 5, offset: 0 },
  { x: -18, speed: 34, r: 3.5, offset: 0.35 },
  { x: 12, speed: 22, r: 6, offset: 0.7 },
  { x: 44, speed: 30, r: 4, offset: 0.15 },
  { x: 66, speed: 25, r: 3, offset: 0.55 },
  { x: -72, speed: 20, r: 3, offset: 0.85 },
];

const CONFETTI_COLORS = ['#FF8FAB', '#FFD25A', '#7AD3C9', '#9B8CFF', '#FF9F5A', '#5AB8FF'];
const CONFETTI = Array.from({ length: 26 }, (_, i) => ({
  angle: (i / 26) * Math.PI * 2 + (i % 3) * 0.2,
  speed: 150 + (i % 5) * 35,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  spin: (i % 2 ? 1 : -1) * (3 + (i % 4)),
  w: i % 3 === 0 ? 7 : 5,
  h: i % 3 === 0 ? 4 : 9,
}));
const BURST_SECONDS = 2.2;

function wave(level: number, phase: number, amplitude: number, wavelength: number): string {
  let d = `M ${-wavelength * 2 + phase} ${level}`;
  for (let x = -wavelength * 2; x < SIZE + wavelength; x += wavelength) {
    const s = x + phase;
    d += ` Q ${s + wavelength / 4} ${level - amplitude} ${s + wavelength / 2} ${level}`;
    d += ` Q ${s + (wavelength * 3) / 4} ${level + amplitude} ${s + wavelength} ${level}`;
  }
  return `${d} L ${SIZE + wavelength * 2} ${SIZE} L ${-wavelength * 2} ${SIZE} Z`;
}

type Props = { progress: number; size?: number };

/** A glass orb that fills with animated water and bursts into confetti at 100%. */
export function WaterOrb({ progress, size = 240 }: Props) {
  const target = Math.max(0, Math.min(1, progress));
  const targetRef = useRef(target);
  targetRef.current = target;

  const [frame, setFrame] = useState({ level: target, t: 0, burstAt: -1 });

  useEffect(() => {
    let raf = 0;
    let level = targetRef.current;
    let burstAt = -1;
    let wasDone = targetRef.current >= 1;
    const start = Date.now();
    const tick = () => {
      const t = (Date.now() - start) / 1000;
      level += (targetRef.current - level) * 0.06;
      const done = targetRef.current >= 1;
      if (done && !wasDone) burstAt = t;
      wasDone = done;
      setFrame({ level, t, burstAt });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const { level, t, burstAt } = frame;
  const surface = C + R - level * 2 * R;
  const amp = level <= 0.002 || level >= 0.998 ? 0 : 6;
  const burst = burstAt >= 0 ? t - burstAt : -1;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ overflow: 'visible' }}>
      <Defs>
        <ClipPath id="orb">
          <Circle cx={C} cy={C} r={R} />
        </ClipPath>
        <LinearGradient id="water" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#8FD3FF" />
          <Stop offset="1" stopColor={colors.primary} />
        </LinearGradient>
        <LinearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#EAF4FF" />
        </LinearGradient>
      </Defs>

      <Circle cx={C} cy={C + 6} r={R + 10} fill="#2E5C8A" opacity={0.08} />
      <Circle cx={C} cy={C} r={R + 10} fill="url(#glass)" />

      <G clipPath="url(#orb)">
        <Path d={wave(surface - 3, ((t * 38 + 60) % 120) - 120, amp * 0.8, 120)} fill="#B9E3FF" />
        <Path d={wave(surface, -((t * 52) % 140), amp, 140)} fill="url(#water)" />
        {level > 0.04 &&
          BUBBLES.map((b, i) => {
            const travel = (t * b.speed + b.offset * 2 * R) % (2 * R);
            const y = C + R - travel;
            if (y < surface + 8) return null;
            return (
              <Circle
                key={i}
                cx={C + b.x + Math.sin(t * 2 + i) * 4}
                cy={y}
                r={b.r}
                fill="#FFFFFF"
                opacity={0.55}
              />
            );
          })}
      </G>

      <Circle cx={C} cy={C} r={R + 5} fill="none" stroke="#FFFFFF" strokeWidth={10} opacity={0.9} />
      <Circle cx={C} cy={C} r={R + 10} fill="none" stroke="#D3E6FA" strokeWidth={2} />
      <Path
        d={`M ${C - 78} ${C - 52} A ${R - 16} ${R - 16} 0 0 1 ${C - 36} ${C - 88}`}
        stroke="#FFFFFF"
        strokeWidth={9}
        strokeLinecap="round"
        fill="none"
        opacity={0.75}
      />
      <Circle cx={C - 88} cy={C - 26} r={4.5} fill="#FFFFFF" opacity={0.75} />

      {burst >= 0 &&
        burst < BURST_SECONDS &&
        CONFETTI.map((p, i) => {
          const x = C + Math.cos(p.angle) * p.speed * burst;
          const y = C + Math.sin(p.angle) * p.speed * burst + 160 * burst * burst;
          const opacity = Math.max(0, 1 - burst / BURST_SECONDS);
          return (
            <Rect
              key={i}
              x={x - p.w / 2}
              y={y - p.h / 2}
              width={p.w}
              height={p.h}
              rx={2}
              fill={p.color}
              opacity={opacity}
              transform={`rotate(${(p.spin * burst * 180) / Math.PI} ${x} ${y})`}
            />
          );
        })}

      {target >= 1 &&
        [
          [C - 120, C - 70, 1],
          [C + 118, C - 40, 0.8],
          [C + 96, C + 104, 0.7],
        ].map(([x, y, s], i) => {
          const k = s * (0.75 + 0.25 * Math.sin(t * 3 + i * 2));
          return (
            <Path
              key={`star${i}`}
              d={`M ${x} ${y - 10 * k} L ${x + 3 * k} ${y - 3 * k} L ${x + 10 * k} ${y} L ${x + 3 * k} ${y + 3 * k} L ${x} ${y + 10 * k} L ${x - 3 * k} ${y + 3 * k} L ${x - 10 * k} ${y} L ${x - 3 * k} ${y - 3 * k} Z`}
              fill="#FFD25A"
            />
          );
        })}
    </Svg>
  );
}
