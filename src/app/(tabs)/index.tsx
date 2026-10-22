import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassIcon } from '../../components/GlassIcon';
import { SkyBackground } from '../../components/SkyBackground';
import { Card, SectionTitle } from '../../components/ui';
import { WaterOrb } from '../../components/WaterOrb';
import { DRINKS, getDrink, type DrinkId } from '../../lib/drinks';
import { currentStreak, dayKey, hydrationMl, totalsByDay } from '../../lib/stats';
import { useStore } from '../../lib/store';
import { colors, fonts, radius } from '../../lib/theme';
import { formatAmount, formatVolume } from '../../lib/units';

function cheer(progress: number): string {
  if (progress >= 1) return 'Goal reached! Amazing 🎉';
  if (progress >= 0.75) return 'Almost there, keep sipping!';
  if (progress >= 0.4) return 'Nice flow, halfway-ish 💧';
  if (progress > 0) return 'Great start!';
  return 'Time for your first sip';
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
  const selected = getDrink(drinkId);

  const add = (amountMl: number) => {
    const wasDone = drunk >= goalMl;
    addEntry(drinkId, amountMl);
    const nowDone = drunk + amountMl * selected.hydration >= goalMl;
    if (nowDone && !wasDone) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const addCustom = () => {
    Alert.prompt(
      'Custom amount',
      `How much ${selected.label.toLowerCase()}? (${unit})`,
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

  return (
    <View style={styles.screen}>
      <SkyBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <Text style={styles.date}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </Text>
              <Text style={styles.title}>Today</Text>
            </View>
            <View style={styles.streak}>
              <Text style={styles.streakText}>🔥 {streak}</Text>
            </View>
          </View>

          <View style={styles.hero}>
            <WaterOrb progress={progress} size={250} />
            <Text style={styles.amount}>
              {formatAmount(drunk, unit)}
              <Text style={styles.amountGoal}>
                {' '}/ {formatAmount(goalMl, unit)} {unit}
              </Text>
            </Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.min(100, progress * 100)}%` }]} />
            </View>
            <Text style={styles.cheer}>
              {Math.round(progress * 100)}% · {cheer(progress)}
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
                    style={styles.drink}
                  >
                    <View
                      style={[
                        styles.drinkBubble,
                        { backgroundColor: `${d.color}26` },
                        active && { borderColor: d.color, backgroundColor: `${d.color}44` },
                      ]}
                    >
                      <Text style={styles.drinkEmoji}>{d.emoji}</Text>
                    </View>
                    <Text style={[styles.drinkLabel, active && { color: colors.text }]}>{d.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <SectionTitle>Add {selected.label.toLowerCase()}</SectionTitle>
            <View style={styles.presets}>
              {settings.presets.map((p, i) => (
                <Pressable
                  key={p.label}
                  onPress={() => add(p.ml)}
                  style={({ pressed }) => [styles.preset, pressed && styles.pressed]}
                >
                  <GlassIcon liquid={selected.color} scale={0.7 + 0.15 * i} height={58} />
                  <Text style={styles.presetMl}>{formatVolume(p.ml, unit)}</Text>
                  <Text style={styles.presetLabel}>{p.label}</Text>
                </Pressable>
              ))}
              <Pressable onPress={addCustom} style={({ pressed }) => [styles.preset, pressed && styles.pressed]}>
                <View style={styles.plus}>
                  <Text style={styles.plusText}>+</Text>
                </View>
                <Text style={styles.presetMl}>Custom</Text>
                <Text style={styles.presetLabel}>Any amount</Text>
              </Pressable>
            </View>
            {selected.hydration < 1 && (
              <Text style={styles.hint}>
                {selected.label} counts for {Math.round(selected.hydration * 100)}% of its volume.
              </Text>
            )}
          </Card>

          <Card style={{ marginTop: 16 }}>
            <SectionTitle>Today's sips</SectionTitle>
            {todayEntries.length === 0 ? (
              <Text style={styles.empty}>Nothing yet. Tap a glass above to log your first drink.</Text>
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
                    <View style={[styles.rowBubble, { backgroundColor: `${d.color}2E` }]}>
                      <Text style={styles.rowEmoji}>{d.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{d.label}</Text>
                      <Text style={styles.rowSub}>{time}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.rowTitle}>{formatVolume(e.amountMl, unit)}</Text>
                      {d.hydration < 1 && (
                        <Text style={styles.rowSub}>≈ {formatVolume(hydrationMl(e), unit)} water</Text>
                      )}
                    </View>
                  </Pressable>
                );
              })
            )}
            {todayEntries.length > 0 && <Text style={styles.hint}>Long-press a drink to remove it.</Text>}
          </Card>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { color: colors.muted, fontSize: 15, fontFamily: fonts.bold },
  title: { color: colors.text, fontSize: 34, fontFamily: fonts.black },
  streak: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    shadowColor: '#2E5C8A',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  streakText: { color: colors.flame, fontSize: 17, fontFamily: fonts.black },
  hero: { alignItems: 'center', marginTop: 8, marginBottom: 20 },
  amount: { fontSize: 44, color: colors.text, marginTop: 4, fontFamily: fonts.black },
  amountGoal: { fontSize: 20, color: colors.muted, fontFamily: fonts.heavy },
  track: {
    width: '70%',
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    marginTop: 10,
  },
  fill: { height: '100%', borderRadius: 6, backgroundColor: colors.primary },
  cheer: { color: colors.muted, fontSize: 15, marginTop: 8, fontFamily: fonts.bold },
  drinks: { gap: 6, paddingBottom: 14 },
  drink: { alignItems: 'center', width: 66 },
  drinkBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: 'transparent',
  },
  drinkEmoji: { fontSize: 26 },
  drinkLabel: { marginTop: 5, fontSize: 12, color: colors.muted, fontFamily: fonts.bold },
  presets: { flexDirection: 'row', gap: 8 },
  preset: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 12,
    paddingBottom: 10,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
  },
  plus: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginBottom: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusText: { color: '#FFFFFF', fontSize: 26, lineHeight: 30, fontFamily: fonts.black },
  presetMl: { marginTop: 6, fontSize: 14, color: colors.text, fontFamily: fonts.black },
  presetLabel: { fontSize: 11, color: colors.muted, fontFamily: fonts.bold },
  pressed: { opacity: 0.75, transform: [{ scale: 0.95 }] },
  hint: { color: colors.muted, fontSize: 12, marginTop: 10, fontFamily: fonts.regular },
  empty: { color: colors.muted, fontSize: 14, fontFamily: fonts.regular },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12 },
  rowBubble: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  rowEmoji: { fontSize: 20 },
  rowTitle: { color: colors.text, fontSize: 15, fontFamily: fonts.heavy },
  rowSub: { color: colors.muted, fontSize: 12, marginTop: 1, fontFamily: fonts.regular },
});
