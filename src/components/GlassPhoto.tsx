import { useState } from 'react';
import { Image, View } from 'react-native';

import { photoUrl, type Glass } from '../lib/glasses';
import { Glass3D } from './Glass3D';

type Props = { glass: Glass; size: number; liquid: string };

/** IKEA's product photo of the glass, falling back to a drawing when offline. */
export function GlassPhoto({ glass, size, liquid }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Glass3D shape={glass.shape} liquid={liquid} height={size * 0.95} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: photoUrl(glass) }}
      onError={() => setFailed(true)}
      style={{ width: size, height: size, borderRadius: 12, backgroundColor: '#FFFFFF' }}
      resizeMode="contain"
      accessibilityLabel={`${glass.name} glass`}
    />
  );
}
