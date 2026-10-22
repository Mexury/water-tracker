import { Image } from 'react-native';

import { GLASS_THUMBS } from '../lib/glass3d/thumbs';

/** A pre-rendered 3D render of the glass, filled with water. */
export function GlassThumb({ id, size }: { id: string; size: number }) {
  return <Image source={GLASS_THUMBS[id]} style={{ width: size, height: size }} resizeMode="contain" />;
}
