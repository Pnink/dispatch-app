import { QUOTES, type Quote } from '../data/quotes';
import type { State } from '../state/store';
import { buildFeed } from './feed';

/** Quotes a reminder may use, from the source the user picked for reminders. */
export function reminderPool(state: State, getQuote: (id: string) => Quote | undefined, own: Quote[]): Quote[] {
  const source = state.reminders.source;
  if (source === 'all') return [...QUOTES, ...own];
  return buildFeed({
    mode: 'source',
    source,
    mix: [],
    seed: 1,
    goals: [],
    own,
    favoriteIds: state.favorites.map((f) => f.quoteId),
    historyIds: state.history.map((h) => h.quoteId),
    getQuote,
  }).quotes;
}
