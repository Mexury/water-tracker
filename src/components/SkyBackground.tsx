import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Rect, Stop } from 'react-native-svg';

import { sky } from '../lib/theme';

/** Soft pastel sky with a couple of clouds, drawn behind a screen. */
export function SkyBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 200">
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={sky.top} />
            <Stop offset="0.6" stopColor="#EAF4FF" />
            <Stop offset="1" stopColor={sky.bottom} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={100} height={200} fill="url(#sky)" />
        <Ellipse cx={14} cy={30} rx={14} ry={3.2} fill="#FFFFFF" opacity={0.7} />
        <Ellipse cx={20} cy={27.5} rx={7} ry={3} fill="#FFFFFF" opacity={0.7} />
        <Ellipse cx={86} cy={48} rx={12} ry={2.8} fill="#FFFFFF" opacity={0.6} />
        <Ellipse cx={81} cy={45.8} rx={6} ry={2.6} fill="#FFFFFF" opacity={0.6} />
      </Svg>
    </View>
  );
}
