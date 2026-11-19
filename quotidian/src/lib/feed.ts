import type { CategoryId, FeedSource } from '../data/categories';
import { QUOTES, type Quote } from '../data/quotes';

/** Small seeded PRNG (mulberry32) so a feed's order is stable until the user changes it. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: readonly T[], seed: number): T[] {
  const out = items.slice();
  const rand = rng(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export type FeedInput = {
  mode: 'source' | 'mix';
  source: FeedSource;
  mix: CategoryId[];
  seed: number;
  startQuoteId?: string;
  goals: CategoryId[];
  own: Quote[];
  favoriteIds: string[];
  historyIds: string[];
  getQuote: (id: string) => Quote | undefined;
};

export type Feed = {
  quotes: Quote[];
  /** shuffled feeds go on forever; personal lists end */
  loops: boolean;
};

function pool(input: FeedInput): Feed {
  const { mode, source, mix, own, favoriteIds, historyIds, getQuote, goals, seed } = input;
  if (mode === 'mix') {
    const set = new Set(mix);
    return { quotes: shuffle(QUOTES.filter((q) => q.categories.some((c) => set.has(c))), seed), loops: true };
  }
  switch (source) {
    case 'favorites':
      return { quotes: favoriteIds.map(getQuote).filter(Boolean) as Quote[], loops: false };
    case 'own':
      return { quotes: own, loops: false };
    case 'history':
      return { quotes: historyIds.map(getQuote).filter(Boolean) as Quote[], loops: false };
    case 'all': {
      // Everything, shuffled, with the user's goals pulled a little forward:
      // the first screens lean towards what they asked for in onboarding.
      const all = shuffle([...QUOTES, ...own], seed);
      if (goals.length === 0) return { quotes: all, loops: true };
      const goalSet = new Set(goals);
      const preferred = all.filter((q) => q.categories.some((c) => goalSet.has(c)));
      const others = all.filter((q) => !q.categories.some((c) => goalSet.has(c)));
      const out: Quote[] = [];
      while (preferred.length || others.length) {
        if (preferred.length) out.push(preferred.shift()!);
        if (preferred.length) out.push(preferred.shift()!);
        if (others.length) out.push(others.shift()!);
      }
      return { quotes: out, loops: true };
    }
    default:
      return { quotes: shuffle(QUOTES.filter((q) => q.categories.includes(source)), seed), loops: true };
  }
}

export function buildFeed(input: FeedInput): Feed {
  const feed = pool(input);
  const { startQuoteId, getQuote } = input;
  if (!startQuoteId) return feed;
  const start = getQuote(startQuoteId);
  if (!start) return feed;
  return { ...feed, quotes: [start, ...feed.quotes.filter((q) => q.id !== startQuoteId)] };
}

/** Next round for an endless feed: reshuffled, and never the same quote twice in a row. */
export function nextRound(quotes: Quote[], round: number, seed: number, lastId?: string): Quote[] {
  const next = shuffle(quotes, seed * 7919 + round);
  if (next.length > 1 && next[0].id === lastId) {
    [next[0], next[1]] = [next[1], next[0]];
  }
  return next;
}

export function greeting(name: string, now = new Date()): string {
  const h = now.getHours();
  const part = h < 5 ? 'Still up' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  const n = name.trim();
  return n ? `${part}, ${n}.` : `${part}.`;
}
