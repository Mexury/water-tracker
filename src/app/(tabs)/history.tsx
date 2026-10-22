import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';

import { Card, SectionTitle } from '../../components/ui';
import { bestStreak, currentStreak, dayKey, lastNDays, totalsByDay } from '../../lib/stats';
import { useStore } from '../../lib/store';
import { colors } from '../../lib/theme';
import { formatVolume } from '../../lib/units';

const CHART_W = 320;
const CHART_H = 170;
const BAR_AREA_H = 130;

function WeekChart({ days, totals, goalMl }: { days: Date[]; totals: Map<string, number>; goalMl: number }) {
  const values = days.map((d) => totals.get(dayKey(d)) ?? 0);
  const max = Math.max(goalMl * 1.2, ...values);
  const slot = CHART_W / days.length;
  const barW = slot * 0.55;
  const goalY = BAR_AREA_H - (goalMl / max) * BAR_AREA_H + 10;

  return (
    <Svg width="100%" height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
      <Line x1={0} x2={CHART_W} y1={goalY} y2={goalY} stroke={colors.success} strokeDasharray="5 5" strokeWidth={1.5} />
      {days.map((d, i) => {
        const h = Math.max(4, (values[i] / max) * BAR_AREA_H);
        const x = i * slot + (slot - barW) / 2;
        const reached = values[i] >= goalMl;
        const isToday = dayKey(d) === dayKey(Date.now());
        return (
          <Rect
            key={dayKey(d)}
            x={x}
            y={BAR_AREA_H - h + 10}
            width={barW}
            height={h}
            rx={8}
            fill={reached ? colors.primary : values[i] > 0 ? colors.water : colors.border}
            opacity={isToday ? 1 : 0.85}
          />
        );
      })}
      {days.map((d, i) => (
        <SvgText
          key={`l-${dayKey(d)}`}
          x={i * slot + slot / 2}
          y={CHART_H - 8}
          fontSize={12}
          fontWeight="600"
          fill={colors.muted}
          textAnchor="middle"
        >
          {d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2)}
        </SvgText>
      ))}
    </Svg>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

export default function HistoryScreen() {
  const { entries, settings } = useStore();
  const { goalMl, unit } = settings;
  const totals = useMemo(() => totalsByDay(entries), [entries]);
  const week = lastNDays(7);
  const past = lastNDays(30).reverse();

  const weekValues = week.map((d) => totals.get(dayKey(d)) ?? 0);
  const avg = weekValues.reduce((a, b) => a + b, 0) / week.length;
  const goalDays = past.filter((d) => (totals.get(dayKey(d)) ?? 0) >= goalMl).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>History</Text>

        <View style={styles.stats}>
          <Stat label="Current streak" value={`🔥 ${currentStreak(totals, goalMl)}`} />
          <Stat label="Best streak" value={`🏆 ${bestStreak(totals, goalMl)}`} />
        </View>
        <View style={styles.stats}>
          <Stat label="7-day average" value={formatVolume(avg, unit)} />
          <Stat label="Goals hit (30d)" value={`${goalDays}/30`} />
        </View>

        <Card style={{ marginTop: 4 }}>
          <SectionTitle>This week</SectionTitle>
          <WeekChart days={week} totals={totals} goalMl={goalMl} />
        </Card>

        <Card style={{ marginTop: 16 }}>
          <SectionTitle>Last 30 days</SectionTitle>
          {past.map((d) => {
            const ml = totals.get(dayKey(d)) ?? 0;
            const pct = Math.min(1, goalMl ? ml / goalMl : 0);
            return (
              <View key={dayKey(d)} style={styles.dayRow}>
                <Text style={styles.dayLabel}>
                  {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
                <View style={styles.track}>
                  <View
                    style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: pct >= 1 ? colors.primary : colors.water }]}
                  />
                </View>
                <Text style={styles.dayValue}>
                  {pct >= 1 ? '✅ ' : ''}
                  {formatVolume(ml, unit)}
                </Text>
              </View>
            );
          })}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  title: { color: colors.text, fontSize: 32, fontWeight: '800', marginBottom: 16 },
  stats: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 18 },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.text },
  statLabel: { color: colors.muted, fontSize: 12, fontWeight: '600', marginTop: 4 },
  dayRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  dayLabel: { width: 96, color: colors.text, fontSize: 13, fontWeight: '600' },
  track: { flex: 1, height: 10, borderRadius: 5, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
  dayValue: { width: 84, textAlign: 'right', color: colors.muted, fontSize: 12, fontWeight: '600' },
});
