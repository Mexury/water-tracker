import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Glass3D } from '../components/Glass3D';
import { getDrink, type DrinkId } from '../lib/drinks';
import { GLASSES } from '../lib/glasses';
import { useStore } from '../lib/store';
import { colors, radius } from '../lib/theme';
import { formatVolume } from '../lib/units';

export default function GlassesScreen() {
  const { drink } = useLocalSearchParams<{ drink?: DrinkId }>();
  const liquid = getDrink(drink ?? 'water').color;
  const { settings, updateSettings } = useStore();
  const { glassIds, unit } = settings;
  const [focusedId, setFocusedId] = useState(glassIds[0] ?? GLASSES[0].id);
  const focused = GLASSES.find((g) => g.id === focusedId) ?? GLASSES[0];
  const selected = glassIds.includes(focused.id);

  const toggle = () => {
    Haptics.selectionAsync();
    updateSettings({
      glassIds: selected ? glassIds.filter((id) => id !== focused.id) : [...glassIds, focused.id],
    });
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>IKEA glasses</Text>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.done}>Done</Text>
        </Pressable>
      </View>

      <View style={styles.hero}>
        <Glass3D shape={focused.shape} liquid={liquid} height={190} spin />
        <View style={styles.heroText}>
          <Text style={styles.heroName}>{focused.name}</Text>
          <Text style={styles.heroMl}>{formatVolume(focused.capacityMl, unit)}</Text>
          <Text style={styles.heroNote}>{focused.note}</Text>
          <Pressable onPress={toggle} style={[styles.toggle, selected && styles.toggleOn]}>
            <Text style={[styles.toggleText, selected && { color: '#fff' }]}>
              {selected ? '✓ In my glasses' : '+ Add to my glasses'}
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {GLASSES.map((g) => {
          const isFocused = g.id === focused.id;
          const isMine = glassIds.includes(g.id);
          return (
            <Pressable
              key={g.id}
              onPress={() => setFocusedId(g.id)}
              style={[styles.card, isFocused && { borderColor: colors.primary }]}
            >
              {isMine && <Text style={styles.badge}>✓</Text>}
              <Glass3D shape={g.shape} liquid={liquid} height={96} />
              <Text style={styles.cardName} numberOfLines={1}>
                {g.name}
              </Text>
              <Text style={styles.cardMl}>{formatVolume(g.capacityMl, unit)}</Text>
            </Pressable>
          );
        })}
        <Text style={styles.footnote}>
          Capacities from ikea.com. Glass shapes are drawn to scale as close as we could estimate.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  done: { fontSize: 17, fontWeight: '700', color: colors.primary },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    gap: 16,
  },
  heroText: { flex: 1 },
  heroName: { fontSize: 22, fontWeight: '800', color: colors.text },
  heroMl: { fontSize: 32, fontWeight: '800', color: colors.primary, marginTop: 2 },
  heroNote: { color: colors.muted, marginTop: 4, fontWeight: '500' },
  toggle: {
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  toggleOn: { backgroundColor: colors.primary },
  toggleText: { color: colors.primary, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20, paddingBottom: 40 },
  card: {
    width: '31%',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 8,
    color: colors.success,
    fontWeight: '900',
    fontSize: 15,
  },
  cardName: { marginTop: 4, fontWeight: '700', color: colors.text, fontSize: 12 },
  cardMl: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  footnote: { color: colors.muted, fontSize: 11, marginTop: 8, width: '100%', textAlign: 'center' },
});
