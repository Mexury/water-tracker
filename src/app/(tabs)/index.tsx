import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassPhoto } from '../../components/GlassPhoto';
import { Llama } from '../../components/Llama';
import { Card, SectionTitle } from '../../components/ui';
import { CUP_SIZES_ML, DRINKS, getDrink, type DrinkId } from '../../lib/drinks';
import { getGlass, type Glass } from '../../lib/glasses';
import { currentStreak, dayKey, hydrationMl, totalsByDay } from '../../lib/stats';
import { useStore } from '../../lib/store';
import { colors, radius } from '../../lib/theme';
import { formatAmount, formatVolume } from '../../lib/units';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function TodayScreen() {
  const { entries, settings, addEntry, removeEntry } = useStore();
  const [drinkId, setDrinkId] = useState<DrinkId>('water');
  const { unit, goalMl } = settings;

  const today = dayKey(Date.now());
  const todayEntries = useMemo(
    () => entries.filter((e) => dayKey(e.ts) === today).sort((a, b) => b.ts - a.ts),
    [entries, today],
  );
  const totals = useMemo(() => totalsByDay(entries), [entries]);
  const drunk = totals.get(today) ?? 0;
  const progress = goalMl > 0 ? drunk / goalMl : 0;
  const streak = currentStreak(totals, goalMl);
  const remaining = Math.max(0, goalMl - drunk);

  const add = (amountMl: number) => {
    const wasDone = drunk >= goalMl;
    addEntry(drinkId, amountMl);
    const nowDone = drunk + amountMl * getDrink(drinkId).hydration >= goalMl;
    if (nowDone && !wasDone) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const addCustom = () => {
    Alert.prompt(
      'Custom amount',
      `How much ${getDrink(drinkId).label.toLowerCase()}? (${unit})`,
      (value) => {
        const n = Number(value?.replace(',', '.'));
        if (!Number.isFinite(n) || n <= 0) return;
        add(unit === 'oz' ? Math.round(n * 29.5735) : Math.round(n));
      },
      'plain-text',
      '',
      'number-pad',
    );
  };

  const confirmRemove = (id: string, label: string) => {
    Alert.alert('Remove drink?', label, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeEntry(id) },
    ]);
  };

  const selected = getDrink(drinkId);
  const myGlasses = settings.glassIds.map(getGlass).filter((g): g is Glass => !!g);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()}</Text>
            <Text style={styles.title}>Today</Text>
          </View>
          <View style={styles.streak}>
            <Text style={styles.streakText}>🔥 {streak}</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Llama progress={progress} size={230} />
          <Text style={styles.amount}>
            {formatAmount(drunk, unit)}
            <Text style={styles.amountGoal}>
              {' '}/ {formatAmount(goalMl, unit)} {unit}
            </Text>
          </Text>
          <Text style={styles.subline}>
            {progress >= 1
              ? 'Goal reached! Your llama is happy 🎉'
              : `${Math.round(progress * 100)}% · ${formatVolume(remaining, unit)} to go`}
          </Text>
        </View>

        <Card>
          <SectionTitle>Drink</SectionTitle>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.drinks}>
            {DRINKS.map((d) => {
              const active = d.id === drinkId;
              return (
                <Pressable
                  key={d.id}
                  onPress={() => {
                    setDrinkId(d.id);
                    Haptics.selectionAsync();
                  }}
                  style={[styles.drink, active && { borderColor: d.color, backgroundColor: `${d.color}22` }]}
                >
                  <Text style={styles.drinkEmoji}>{d.emoji}</Text>
                  <Text style={[styles.drinkLabel, active && { color: colors.text }]}>{d.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <SectionTitle>Your glasses</SectionTitle>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.glasses}>
            {myGlasses.map((g) => (
              <Pressable
                key={g.id}
                onPress={() => add(g.capacityMl)}
                style={({ pressed }) => [styles.glass, pressed && styles.pressed]}
              >
                <GlassPhoto glass={g} size={76} liquid={selected.color} />
                <Text style={styles.glassName} numberOfLines={1}>
                  {g.name}
                </Text>
                <Text style={styles.glassMl}>+{formatVolume(g.capacityMl, unit)}</Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => router.push({ pathname: '/glasses', params: { drink: drinkId } })}
              style={({ pressed }) => [styles.glass, styles.glassAdd, pressed && styles.pressed]}
            >
              <Text style={styles.glassAddPlus}>＋</Text>
              <Text style={styles.glassName}>IKEA glasses</Text>
            </Pressable>
          </ScrollView>

          <SectionTitle>Quick add {selected.label.toLowerCase()}</SectionTitle>
          <View style={styles.sizes}>
            {CUP_SIZES_ML.map((ml) => (
              <Pressable
                key={ml}
                onPress={() => add(ml)}
                style={({ pressed }) => [styles.size, { backgroundColor: selected.color }, pressed && styles.pressed]}
              >
                <Text style={styles.sizeText}>+{formatVolume(ml, unit)}</Text>
              </Pressable>
            ))}
            <Pressable onPress={addCustom} style={({ pressed }) => [styles.size, styles.custom, pressed && styles.pressed]}>
              <Text style={[styles.sizeText, { color: colors.text }]}>Custom</Text>
            </Pressable>
          </View>
          {selected.hydration < 1 && (
            <Text style={styles.hint}>
              {selected.label} counts for {Math.round(selected.hydration * 100)}% of its volume.
            </Text>
          )}
        </Card>

        <Card style={{ marginTop: 16 }}>
          <SectionTitle>Today's drinks</SectionTitle>
          {todayEntries.length === 0 ? (
            <Text style={styles.empty}>Nothing yet. Your llama is waiting for its first sip!</Text>
          ) : (
            todayEntries.map((e) => {
              const d = getDrink(e.drinkId);
              const time = new Date(e.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <Pressable
                  key={e.id}
                  onLongPress={() => confirmRemove(e.id, `${d.label}, ${formatVolume(e.amountMl, unit)} at ${time}`)}
                  style={styles.row}
                >
                  <Text style={styles.rowEmoji}>{d.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{d.label}</Text>
                    <Text style={styles.rowSub}>{time}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.rowTitle}>{formatVolume(e.amountMl, unit)}</Text>
                    {d.hydration < 1 && <Text style={styles.rowSub}>≈ {formatVolume(hydrationMl(e), unit)} water</Text>}
                  </View>
                </Pressable>
              );
            })
          )}
          {todayEntries.length > 0 && <Text style={styles.hint}>Long-press a drink to remove it.</Text>}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { color: colors.muted, fontSize: 15, fontWeight: '600' },
  title: { color: colors.text, fontSize: 32, fontWeight: '800' },
  streak: { backgroundColor: '#FFEBDD', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  streakText: { color: colors.flame, fontWeight: '800', fontSize: 16 },
  hero: { alignItems: 'center', marginVertical: 16 },
  amount: { fontSize: 40, fontWeight: '800', color: colors.text, marginTop: 8 },
  amountGoal: { fontSize: 20, fontWeight: '600', color: colors.muted },
  subline: { color: colors.muted, fontSize: 15, marginTop: 4, fontWeight: '500' },
  drinks: { gap: 10, paddingBottom: 16 },
  drink: {
    alignItems: 'center',
    width: 74,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
  },
  drinkEmoji: { fontSize: 26 },
  drinkLabel: { marginTop: 4, fontSize: 12, fontWeight: '600', color: colors.muted },
  glasses: { gap: 10, paddingBottom: 16 },
  glass: {
    width: 92,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
  },
  glassAdd: { justifyContent: 'center', borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed' },
  glassAddPlus: { fontSize: 28, color: colors.primary, fontWeight: '700' },
  glassName: { marginTop: 4, fontSize: 12, fontWeight: '700', color: colors.text },
  glassMl: { fontSize: 12, fontWeight: '700', color: colors.primary },
  sizes: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  size: { width: '31%', flexGrow: 1, paddingVertical: 14, borderRadius: radius.md, alignItems: 'center' },
  custom: { backgroundColor: colors.primarySoft },
  sizeText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.96 }] },
  hint: { color: colors.muted, fontSize: 12, marginTop: 10 },
  empty: { color: colors.muted, fontSize: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowEmoji: { fontSize: 24, marginRight: 12 },
  rowTitle: { fontWeight: '700', color: colors.text, fontSize: 15 },
  rowSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
});
