import Svg, { Path } from 'react-native-svg';

import { colors } from '../lib/theme';

type Props = {
  /** Liquid colour. */
  liquid: string;
  /** Relative glass size, 0.6 (small) to 1 (large). */
  scale?: number;
  height?: number;
};

/** A simple tapered tumbler, filled most of the way. */
export function GlassIcon({ liquid, scale = 1, height = 56 }: Props) {
  // Glass in a 40x56 box, bottom-aligned so sizes line up on one baseline.
  const h = 54 * scale;
  const top = 56 - h;
  const wTop = 30 * (0.75 + 0.25 * scale);
  const wBottom = wTop * 0.78;
  const x = (w: number) => [20 - w / 2, 20 + w / 2];
  const [tl, tr] = x(wTop);
  const [bl, br] = x(wBottom);
  const fillY = top + h * 0.22;
  const at = (y: number) => {
    const k = (y - top) / h;
    return x(wTop + (wBottom - wTop) * k);
  };
  const [fl, fr] = at(fillY);

  return (
    <Svg width={(height * 40) / 56} height={height} viewBox="0 0 40 56">
      <Path d={`M ${fl} ${fillY} L ${fr} ${fillY} L ${br} 55 L ${bl} 55 Z`} fill={liquid} opacity={0.85} />
      <Path
        d={`M ${tl} ${top + 1} L ${bl} 55 L ${br} 55 L ${tr} ${top + 1}`}
        fill="none"
        stroke={colors.text}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}
