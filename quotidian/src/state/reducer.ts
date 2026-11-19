// Pure state logic: no React, no storage. The provider lives in store.tsx.
import type { CategoryId, FeedSource } from '../data/categories';
import { getBuiltInQuote, type Quote } from '../data/quotes';
import { buildFeed } from '../lib/feed';
import { DEFAULT_CUSTOM, DEFAULT_THEME_ID, type Theme } from '../data/themes';

export const STORAGE_KEY = 'quotidian:v1';
export const HISTORY_CAP = 500;
export const OWN_QUOTE_MAX = 280;

export type OwnQuote = { id: string; text: string; author?: string; createdAt: number };
export type ReminderPlan = {
  enabled: boolean;
  perDay: number;
  /** minutes after midnight */
  start: number;
  end: number;
  source: FeedSource;
};

export type State = {
  version: 1;
  profile: { name: string; goals: CategoryId[]; onboarded: boolean };
  feed: {
    mode: 'source' | 'mix';
    source: FeedSource;
    mix: CategoryId[];
    /** bumped whenever the user picks a new feed, so the list reshuffles */
    seed: number;
    /** pinned to the top of the feed (from search, favorites, a notification) */
    startQuoteId?: string;
    /** the feed's order, computed here so it only changes when the user changes it */
    ids: string[];
    /** shuffled feeds go on forever; personal lists end */
    loops: boolean;
  };
  themeId: string;
  custom: Theme;
  favorites: { quoteId: string; at: number }[];
  own: OwnQuote[];
  history: { quoteId: string; at: number }[];
  reminders: ReminderPlan;
  hints: { swipe: boolean };
};

export const DEFAULT_REMINDERS: ReminderPlan = {
  enabled: false,
  perDay: 3,
  start: 9 * 60,
  end: 21 * 60,
  source: 'all',
};

const blankState: State = {
  version: 1,
  profile: { name: '', goals: [], onboarded: false },
  feed: { mode: 'source', source: 'all', mix: [], seed: 1, ids: [], loops: true },
  themeId: DEFAULT_THEME_ID,
  custom: DEFAULT_CUSTOM,
  favorites: [],
  own: [],
  history: [],
  reminders: DEFAULT_REMINDERS,
  hints: { swipe: true },
};

function ownQuotes(state: State): Quote[] {
  return state.own.map((q) => ({ id: q.id, text: q.text, author: q.author, categories: [], own: true }));
}

/** Recompute the feed's order from the feed settings and the user's lists. */
export function withFeed(state: State, feed: Partial<State['feed']> = {}): State {
  const next = { ...state.feed, ...feed };
  const own = ownQuotes(state);
  const ownById = new Map(own.map((q) => [q.id, q]));
  const built = buildFeed({
    mode: next.mode,
    source: next.source,
    mix: next.mix,
    seed: next.seed,
    startQuoteId: next.startQuoteId,
    goals: state.profile.goals,
    own,
    favoriteIds: state.favorites.map((f) => f.quoteId),
    historyIds: state.history.map((h) => h.quoteId),
    getQuote: (id) => getBuiltInQuote(id) ?? ownById.get(id),
  });
  return { ...state, feed: { ...next, ids: built.quotes.map((q) => q.id), loops: built.loops } };
}

export const initialState: State = withFeed(blankState);

const PERSONAL_SOURCES: FeedSource[] = ['favorites', 'own', 'history'];

export type Action =
  | { type: 'hydrate'; state: State }
  | { type: 'toggleFavorite'; quoteId: string }
  | { type: 'markSeen'; quoteId: string }
  | { type: 'clearHistory' }
  | { type: 'setSource'; source: FeedSource; startQuoteId?: string }
  | { type: 'setMix'; mix: CategoryId[] }
  | { type: 'refreshFeed' }
  | { type: 'setTheme'; themeId: string }
  | { type: 'saveCustomTheme'; theme: Theme }
  | { type: 'addOwn'; quote: OwnQuote }
  | { type: 'updateOwn'; id: string; text: string; author?: string }
  | { type: 'deleteOwn'; id: string }
  | { type: 'setReminders'; plan: ReminderPlan }
  | { type: 'setName'; name: string }
  | { type: 'completeOnboarding'; name: string; goals: CategoryId[]; themeId: string; reminders: ReminderPlan }
  | { type: 'dismissSwipeHint' }
  | { type: 'reset' };

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'hydrate':
      return action.state;
    case 'toggleFavorite': {
      const has = state.favorites.some((f) => f.quoteId === action.quoteId);
      return {
        ...state,
        favorites: has
          ? state.favorites.filter((f) => f.quoteId !== action.quoteId)
          : [{ quoteId: action.quoteId, at: Date.now() }, ...state.favorites],
      };
    }
    case 'markSeen': {
      if (state.history[0]?.quoteId === action.quoteId) return state;
      const rest = state.history.filter((h) => h.quoteId !== action.quoteId);
      return {
        ...state,
        history: [{ quoteId: action.quoteId, at: Date.now() }, ...rest].slice(0, HISTORY_CAP),
      };
    }
    case 'clearHistory':
      return { ...state, history: [] };
    case 'setSource':
      return withFeed(state, {
        mode: 'source',
        source: action.source,
        seed: state.feed.seed + 1,
        startQuoteId: action.startQuoteId,
      });
    case 'setMix':
      return withFeed(state, { mode: 'mix', mix: action.mix, seed: state.feed.seed + 1, startQuoteId: undefined });
    case 'refreshFeed': {
      // Personal lists pick up what changed since they were opened; shuffled feeds keep their order.
      if (state.feed.mode !== 'source' || !PERSONAL_SOURCES.includes(state.feed.source)) return state;
      const next = withFeed(state);
      const same =
        next.feed.ids.length === state.feed.ids.length && next.feed.ids.every((id, i) => id === state.feed.ids[i]);
      return same ? state : next;
    }
    case 'setTheme':
      return { ...state, themeId: action.themeId };
    case 'saveCustomTheme':
      return { ...state, custom: { ...action.theme, id: 'custom' }, themeId: 'custom' };
    case 'addOwn':
      return { ...state, own: [action.quote, ...state.own] };
    case 'updateOwn':
      return {
        ...state,
        own: state.own.map((q) => (q.id === action.id ? { ...q, text: action.text, author: action.author } : q)),
      };
    case 'deleteOwn':
      return {
        ...state,
        own: state.own.filter((q) => q.id !== action.id),
        favorites: state.favorites.filter((f) => f.quoteId !== action.id),
        history: state.history.filter((h) => h.quoteId !== action.id),
      };
    case 'setReminders':
      return { ...state, reminders: action.plan };
    case 'setName':
      return { ...state, profile: { ...state.profile, name: action.name } };
    case 'completeOnboarding':
      return withFeed(
        {
          ...state,
          profile: { name: action.name, goals: action.goals, onboarded: true },
          themeId: action.themeId,
          reminders: action.reminders,
        },
        { seed: state.feed.seed + 1 },
      );
    case 'dismissSwipeHint':
      return state.hints.swipe ? { ...state, hints: { ...state.hints, swipe: false } } : state;
    case 'reset':
      return initialState;
  }
}

/** Accepts whatever was on disk and returns a valid State, falling back field by field. */
export function migrate(raw: unknown): State {
  if (!raw || typeof raw !== 'object') return initialState;
  const r = raw as Partial<State>;
  if (r.version !== 1) return initialState;
  const merged: State = {
    ...initialState,
    ...r,
    profile: { ...initialState.profile, ...(r.profile ?? {}) },
    feed: { ...initialState.feed, ...(r.feed ?? {}) },
    custom: { ...DEFAULT_CUSTOM, ...(r.custom ?? {}) },
    reminders: { ...DEFAULT_REMINDERS, ...(r.reminders ?? {}) },
    hints: { ...initialState.hints, ...(r.hints ?? {}) },
    favorites: Array.isArray(r.favorites) ? r.favorites : [],
    own: Array.isArray(r.own) ? r.own : [],
    history: Array.isArray(r.history) ? r.history : [],
  };
  // Rebuild the order on load: new built-in quotes appear, deleted ones go.
  return withFeed(merged, { startQuoteId: undefined });
}

export function newId(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}
