import { useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { ClipPath, Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { colors } from '../lib/theme';

const VIEW_W = 200;
const VIEW_H = 240;
const WATER_TOP = 6;
const WATER_BOTTOM = 232;

/** The llama silhouette. Rendered three times: as outline, as fill and as water clip. */
function Silhouette(props: { fill?: string; stroke?: string; strokeWidth?: number }) {
  return (
    <G {...props}>
      <Ellipse cx={113} cy={30} rx={8} ry={18} transform="rotate(-14 113 30)" />
      <Ellipse cx={144} cy={27} rx={8} ry={18} transform="rotate(12 144 27)" />
      <Rect x={47} y={182} width={20} height={48} rx={10} />
      <Rect x={76} y={186} width={20} height={44} rx={10} />
      <Rect x={118} y={186} width={20} height={44} rx={10} />
      <Rect x={146} y={182} width={20} height={48} rx={10} />
      <Ellipse cx={36} cy={136} rx={13} ry={17} />
      <Rect x={34} y={112} width={140} height={88} rx={44} />
      <Rect x={114} y={54} width={44} height={100} rx={22} />
      <Ellipse cx={132} cy={62} rx={36} ry={30} />
      <Ellipse cx={158} cy={76} rx={22} ry={17} />
    </G>
  );
}

function wavePath(level: number, phase: number, amplitude: number): string {
  const wavelength = 100;
  let d = `M ${-wavelength * 2 + phase} ${level}`;
  for (let x = -wavelength * 2; x < VIEW_W + wavelength; x += wavelength) {
    const startX = x + phase;
    d += ` Q ${startX + wavelength / 4} ${level - amplitude} ${startX + wavelength / 2} ${level}`;
    d += ` Q ${startX + (wavelength * 3) / 4} ${level + amplitude} ${startX + wavelength} ${level}`;
  }
  return `${d} L ${VIEW_W + wavelength * 2} ${VIEW_H} L ${-wavelength * 2} ${VIEW_H} Z`;
}

type Props = { progress: number; size?: number };

export function Llama({ progress, size = 260 }: Props) {
  const target = Math.max(0, Math.min(1, progress));
  const targetRef = useRef(target);
  targetRef.current = target;

  const [frame, setFrame] = useState({ level: target, phase: 0 });
  const bounce = useRef(new Animated.Value(1)).current;
  const breath = useRef(new Animated.Value(1)).current;
  const scale = useRef(Animated.multiply(bounce, breath)).current;
  const firstRender = useRef(true);

  useEffect(() => {
    let raf = 0;
    let level = targetRef.current;
    let phase = 0;
    const tick = () => {
      level += (targetRef.current - level) * 0.06;
      phase = (phase + 0.9) % 100;
      setFrame({ level, phase });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    bounce.setValue(0.94);
    Animated.spring(bounce, { toValue: 1, friction: 3, tension: 120, useNativeDriver: true }).start();
  }, [target, bounce]);

  useEffect(() => {
    // Gentle idle breathing.
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1.015, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breath, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breath]);

  const waterY = WATER_BOTTOM - frame.level * (WATER_BOTTOM - WATER_TOP);
  const amplitude = frame.level <= 0.001 || frame.level >= 0.999 ? 0 : 4;
  const done = target >= 1;
  const sad = target < 0.25;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Svg width={size} height={(size * VIEW_H) / VIEW_W} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
        <Defs>
          <ClipPath id="llama">
            <Silhouette />
          </ClipPath>
          <LinearGradient id="water" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.water} />
            <Stop offset="1" stopColor={colors.waterDeep} />
          </LinearGradient>
        </Defs>

        <Silhouette fill={colors.llamaLine} stroke={colors.llamaLine} strokeWidth={8} />
        <Silhouette fill={colors.llama} />

        <G clipPath="url(#llama)">
          <Path d={wavePath(waterY - 2, (frame.phase + 50) % 100, amplitude * 0.7)} fill={colors.water} opacity={0.45} />
          <Path d={wavePath(waterY, frame.phase, amplitude)} fill="url(#water)" />
        </G>

        {/* Inner ear */}
        <Ellipse cx={144} cy={29} rx={3.5} ry={10} transform="rotate(12 144 29)" fill={colors.blush} opacity={0.8} />

        {/* Face */}
        {done ? (
          <Path d="M 130 58 Q 136 50 142 58" stroke={colors.llamaLine} strokeWidth={3.5} strokeLinecap="round" fill="none" />
        ) : (
          <G>
            <Circle cx={136} cy={57} r={5.5} fill={colors.llamaLine} />
            <Circle cx={138} cy={55} r={1.8} fill="#fff" />
          </G>
        )}
        <Ellipse cx={150} cy={72} rx={7} ry={4.5} fill={colors.blush} opacity={0.85} />
        <Ellipse cx={171} cy={70} rx={2} ry={3} fill={colors.llamaLine} />
        <Path
          d={sad ? 'M 158 86 Q 164 81 170 86' : done ? 'M 156 81 Q 164 92 172 81' : 'M 158 83 Q 164 88 170 83'}
          stroke={colors.llamaLine}
          strokeWidth={3}
          strokeLinecap="round"
          fill={done ? colors.blush : 'none'}
        />

        {done && (
          <G fill="#FFD25A">
            <Path d="M 30 40 l 4 10 l 10 4 l -10 4 l -4 10 l -4 -10 l -10 -4 l 10 -4 z" />
            <Path d="M 70 80 l 2.5 6 l 6 2.5 l -6 2.5 l -2.5 6 l -2.5 -6 l -6 -2.5 l 6 -2.5 z" />
            <Path d="M 185 120 l 3 7 l 7 3 l -7 3 l -3 7 l -3 -7 l -7 -3 l 7 -3 z" />
          </G>
        )}
      </Svg>
    </Animated.View>
  );
}
