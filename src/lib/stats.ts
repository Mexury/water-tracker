import { getDrink, type DrinkId } from './drinks';

export type Entry = {
  id: string;
  /** Epoch milliseconds. */
  ts: number;
  drinkId: DrinkId;
  amountMl: number;
};

export function dayKey(date: Date | number): string {
  const d = new Date(date);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function hydrationMl(entry: Entry): number {
  return entry.amountMl * getDrink(entry.drinkId).hydration;
}

export function totalsByDay(entries: Entry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const e of entries) {
    const k = dayKey(e.ts);
    totals.set(k, (totals.get(k) ?? 0) + hydrationMl(e));
  }
  return totals;
}

export function lastNDays(n: number, from = new Date()): Date[] {
  const days: Date[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() - i);
    days.push(d);
  }
  return days;
}

/**
 * Consecutive days that reached the goal, counting back from today.
 * Today only breaks the streak once it is over, so an unfinished today
 * still shows yesterday's streak.
 */
export function currentStreak(totals: Map<string, number>, goalMl: number, today = new Date()): number {
  let streak = 0;
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if ((totals.get(dayKey(cursor)) ?? 0) >= goalMl) streak++;
  cursor.setDate(cursor.getDate() - 1);
  while ((totals.get(dayKey(cursor)) ?? 0) >= goalMl) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function bestStreak(totals: Map<string, number>, goalMl: number): number {
  const goalDays = [...totals.entries()]
    .filter(([, ml]) => ml >= goalMl)
    .map(([k]) => k)
    .sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const k of goalDays) {
    const [y, m, d] = k.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const expected = prev ? new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1) : null;
    run = expected && dayKey(expected) === k ? run + 1 : 1;
    best = Math.max(best, run);
    prev = date;
  }
  return best;
}
