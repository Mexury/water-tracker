import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { DrinkId } from './drinks';
import { syncReminders } from './reminders';
import type { Entry } from './stats';
import type { Unit } from './units';

export type Reminders = {
  enabled: boolean;
  /** Hour of day, 0-23. */
  startHour: number;
  endHour: number;
  everyHours: number;
};

export type Settings = {
  goalMl: number;
  unit: Unit;
  weightKg: number | null;
  reminders: Reminders;
};

type State = { settings: Settings; entries: Entry[] };

const STORAGE_KEY = 'llamawater/v1';

export const DEFAULT_SETTINGS: Settings = {
  goalMl: 2000,
  unit: 'ml',
  weightKg: null,
  reminders: { enabled: false, startHour: 9, endHour: 21, everyHours: 2 },
};

type Store = State & {
  ready: boolean;
  addEntry: (drinkId: DrinkId, amountMl: number) => void;
  removeEntry: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  resetAll: () => void;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ settings: DEFAULT_SETTINGS, entries: [] });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as Partial<State>;
        setState({
          settings: { ...DEFAULT_SETTINGS, ...saved.settings },
          entries: saved.entries ?? [],
        });
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  useEffect(() => {
    if (ready) syncReminders(state.settings.reminders).catch(() => {});
  }, [state.settings.reminders, ready]);

  const addEntry = useCallback((drinkId: DrinkId, amountMl: number) => {
    const entry: Entry = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ts: Date.now(), drinkId, amountMl };
    setState((s) => ({ ...s, entries: [...s.entries, entry] }));
  }, []);

  const removeEntry = useCallback((id: string) => {
    setState((s) => ({ ...s, entries: s.entries.filter((e) => e.id !== id) }));
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  const resetAll = useCallback(() => setState({ settings: DEFAULT_SETTINGS, entries: [] }), []);

  const value = useMemo(
    () => ({ ...state, ready, addEntry, removeEntry, updateSettings, resetAll }),
    [state, ready, addEntry, removeEntry, updateSettings, resetAll],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside StoreProvider');
  return store;
}
