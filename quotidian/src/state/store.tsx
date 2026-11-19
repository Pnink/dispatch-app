import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react';

import { getBuiltInQuote, type Quote } from '../data/quotes';
import { THEMES, type Theme } from '../data/themes';
import { initialState, migrate, reducer, STORAGE_KEY, type Action, type State } from './reducer';

export {
  DEFAULT_REMINDERS,
  HISTORY_CAP,
  OWN_QUOTE_MAX,
  newId,
  type OwnQuote,
  type ReminderPlan,
  type State,
} from './reducer';

type Store = {
  state: State;
  ready: boolean;
  dispatch: (action: Action) => void;
  theme: Theme;
  isFavorite: (quoteId: string) => boolean;
  getQuote: (quoteId: string) => Quote | undefined;
  ownAsQuotes: Quote[];
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((json) => {
        if (cancelled) return;
        if (json) {
          try {
            dispatch({ type: 'hydrate', state: migrate(JSON.parse(json)) });
          } catch {
            // corrupt storage: start fresh rather than crash
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist after hydration, debounced so swiping through quotes stays smooth.
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [state, ready]);

  const favoriteSet = useMemo(() => new Set(state.favorites.map((f) => f.quoteId)), [state.favorites]);
  const ownAsQuotes = useMemo<Quote[]>(
    () => state.own.map((q) => ({ id: q.id, text: q.text, author: q.author, categories: [], own: true })),
    [state.own],
  );
  const ownById = useMemo(() => new Map(ownAsQuotes.map((q) => [q.id, q])), [ownAsQuotes]);

  const theme = useMemo(() => {
    if (state.themeId === 'custom') return state.custom;
    return THEMES.find((t) => t.id === state.themeId) ?? THEMES[0];
  }, [state.themeId, state.custom]);

  const isFavorite = useCallback((id: string) => favoriteSet.has(id), [favoriteSet]);
  const getQuote = useCallback((id: string) => getBuiltInQuote(id) ?? ownById.get(id), [ownById]);

  const value = useMemo<Store>(
    () => ({ state, ready, dispatch, theme, isFavorite, getQuote, ownAsQuotes }),
    [state, ready, theme, isFavorite, getQuote, ownAsQuotes],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside <StoreProvider>');
  return store;
}
