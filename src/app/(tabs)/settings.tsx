import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GlassIcon } from '../../components/GlassIcon';
import { SkyBackground } from '../../components/SkyBackground';
import { Card, Pill, SectionTitle } from '../../components/ui';
import { reminderHours, requestReminderPermission } from '../../lib/reminders';
import { useStore } from '../../lib/store';
import { colors, fonts } from '../../lib/theme';
import { formatVolume } from '../../lib/units';

const ML_PER_KG = 33;

function Stepper({ value, onMinus, onPlus }: { value: string; onMinus: () => void; onPlus: () => void }) {
  return (
    <View style={styles.stepper}>
      <Pressable onPress={onMinus} style={styles.stepBtn} hitSlop={8}>
        <Text style={styles.stepBtnText}>−</Text>
      </Pressable>
      <Text style={styles.stepValue}>{value}</Text>
      <Pressable onPress={onPlus} style={styles.stepBtn} hitSlop={8}>
        <Text style={styles.stepBtnText}>+</Text>
      </Pressable>
    </View>
  );
}

function hourLabel(h: number): string {
  return new Date(2000, 0, 1, h).toLocaleTimeString([], { hour: 'numeric' });
}

export default function SettingsScreen() {
  const { settings, updateSettings, resetAll } = useStore();
  const { goalMl, unit, weightKg, reminders, presets } = settings;
  const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

  const setReminders = (patch: Partial<typeof reminders>) => updateSettings({ reminders: { ...reminders, ...patch } });

  const toggleReminders = async (enabled: boolean) => {
    if (enabled && !(await requestReminderPermission())) {
      Alert.alert('Notifications are off', 'Allow notifications for this app in iOS Settings to get reminders.');
      return;
    }
    setReminders({ enabled });
  };

  const setPreset = (index: number, ml: number) =>
    updateSettings({ presets: presets.map((p, i) => (i === index ? { ...p, ml: clamp(ml, 50, 1500) } : p)) });

  const suggested = weightKg ? Math.round((weightKg * ML_PER_KG) / 50) * 50 : null;

  return (
    <View style={styles.safe}>
      <SkyBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>

        <Card>
          <SectionTitle>Daily goal</SectionTitle>
          <Stepper
            value={formatVolume(goalMl, unit)}
            onMinus={() => updateSettings({ goalMl: clamp(goalMl - 100, 500, 6000) })}
            onPlus={() => updateSettings({ goalMl: clamp(goalMl + 100, 500, 6000) })}
          />

          <Text style={styles.label}>Your weight</Text>
          <Stepper
            value={weightKg ? `${weightKg} kg` : 'Not set'}
            onMinus={() => updateSettings({ weightKg: clamp((weightKg ?? 70) - 1, 30, 200) })}
            onPlus={() => updateSettings({ weightKg: clamp((weightKg ?? 70) + 1, 30, 200) })}
          />
          {suggested && suggested !== goalMl && (
            <Pressable onPress={() => updateSettings({ goalMl: suggested })} style={styles.suggest}>
              <Text style={styles.suggestText}>Use suggested goal: {formatVolume(suggested, unit)}</Text>
            </Pressable>
          )}
        </Card>

        <Card style={styles.gap}>
          <SectionTitle>Glass sizes</SectionTitle>
          {presets.map((p, i) => (
            <View key={p.label} style={[styles.presetRow, i > 0 && { marginTop: 12 }]}>
              <View style={styles.presetName}>
                <GlassIcon liquid={colors.water} scale={0.7 + 0.15 * i} height={40} />
                <Text style={styles.presetLabel}>{p.label}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Stepper
                  value={formatVolume(p.ml, unit)}
                  onMinus={() => setPreset(i, p.ml - 10)}
                  onPlus={() => setPreset(i, p.ml + 10)}
                />
              </View>
            </View>
          ))}
        </Card>

        <Card style={styles.gap}>
          <SectionTitle>Units</SectionTitle>
          <View style={styles.pills}>
            <Pill label="Milliliters (ml)" active={unit === 'ml'} onPress={() => updateSettings({ unit: 'ml' })} />
            <Pill label="Ounces (oz)" active={unit === 'oz'} onPress={() => updateSettings({ unit: 'oz' })} />
          </View>
        </Card>

        <Card style={styles.gap}>
          <View style={styles.switchRow}>
            <SectionTitle>Reminders</SectionTitle>
            <Switch value={reminders.enabled} onValueChange={toggleReminders} trackColor={{ true: colors.primary }} />
          </View>
          {reminders.enabled && (
            <>
              <Text style={styles.label}>From</Text>
              <Stepper
                value={hourLabel(reminders.startHour)}
                onMinus={() => setReminders({ startHour: clamp(reminders.startHour - 1, 5, reminders.endHour - 1) })}
                onPlus={() => setReminders({ startHour: clamp(reminders.startHour + 1, 5, reminders.endHour - 1) })}
              />
              <Text style={styles.label}>Until</Text>
              <Stepper
                value={hourLabel(reminders.endHour)}
                onMinus={() => setReminders({ endHour: clamp(reminders.endHour - 1, reminders.startHour + 1, 23) })}
                onPlus={() => setReminders({ endHour: clamp(reminders.endHour + 1, reminders.startHour + 1, 23) })}
              />
              <Text style={styles.label}>Every</Text>
              <View style={styles.pills}>
                {[1, 2, 3, 4].map((h) => (
                  <Pill
                    key={h}
                    label={`${h} h`}
                    active={reminders.everyHours === h}
                    onPress={() => setReminders({ everyHours: h })}
                  />
                ))}
              </View>
              <Text style={styles.hint}>
                {reminderHours(reminders).length} reminders a day: {reminderHours(reminders).map(hourLabel).join(', ')}
              </Text>
            </>
          )}
        </Card>

        <Pressable
          style={styles.reset}
          onPress={() =>
            Alert.alert('Reset everything?', 'This deletes all your drinks and settings.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Reset', style: 'destructive', onPress: resetAll },
            ])
          }
        >
          <Text style={styles.resetText}>Reset all data</Text>
        </Pressable>
      </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  title: { color: colors.text, fontSize: 32, fontFamily: fonts.black, marginBottom: 16 },
  gap: { marginTop: 16 },
  label: { color: colors.muted, fontFamily: fonts.bold, marginTop: 16, marginBottom: 8 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { fontSize: 24, fontFamily: fonts.heavy, color: colors.primary },
  stepValue: { fontSize: 22, fontFamily: fonts.black, color: colors.text },
  suggest: { marginTop: 14, padding: 12, borderRadius: 12, backgroundColor: '#E5F7EE' },
  suggestText: { color: colors.success, fontFamily: fonts.heavy, textAlign: 'center' },
  presetRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  presetName: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, width: 96 },
  presetLabel: { fontFamily: fonts.heavy, color: colors.text },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  hint: { color: colors.muted, fontSize: 12, marginTop: 12 },
  reset: { marginTop: 24, padding: 16, alignItems: 'center' },
  resetText: { color: colors.danger, fontFamily: fonts.heavy },
});
