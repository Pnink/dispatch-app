import { expect, test } from '@playwright/test';

import { CATEGORIES } from '../src/data/categories';
import { getBuiltInQuote, QUOTES } from '../src/data/quotes';
import { backgroundStops, THEMES } from '../src/data/themes';
import { contrastRatio, worstContrast } from '../src/lib/contrast';
import { buildFeed, greeting, nextRound, shuffle, type FeedInput } from '../src/lib/feed';
import { formatTime, spreadTimes, timeAgo } from '../src/lib/time';
import { HISTORY_CAP, initialState, migrate, reducer } from '../src/state/reducer';

const input = (over: Partial<FeedInput> = {}): FeedInput => ({
  mode: 'source',
  source: 'all',
  mix: [],
  seed: 1,
  goals: [],
  own: [],
  favoriteIds: [],
  historyIds: [],
  getQuote: getBuiltInQuote,
  ...over,
});

test.describe('quote library', () => {
  test('ids are unique and every quote has a known category', () => {
    const ids = new Set(QUOTES.map((q) => q.id));
    expect(ids.size).toBe(QUOTES.length);
    const known = new Set(CATEGORIES.map((c) => c.id));
    for (const q of QUOTES) {
      expect(q.categories.length, q.id).toBeGreaterThan(0);
      for (const c of q.categories) expect(known.has(c), `${q.id} ${c}`).toBe(true);
    }
  });

  test('every topic has enough quotes to feel like a feed', () => {
    for (const c of CATEGORIES) {
      expect(QUOTES.filter((q) => q.categories.includes(c.id)).length, c.id).toBeGreaterThanOrEqual(8);
    }
  });

  test('no duplicate quote text', () => {
    const texts = QUOTES.map((q) => q.text.toLowerCase());
    expect(new Set(texts).size).toBe(texts.length);
  });
});

test.describe('feed', () => {
  test('shuffle is deterministic per seed and keeps every item', () => {
    const a = shuffle(QUOTES, 42).map((q) => q.id);
    expect(shuffle(QUOTES, 42).map((q) => q.id)).toEqual(a);
    expect(shuffle(QUOTES, 43).map((q) => q.id)).not.toEqual(a);
    expect([...a].sort()).toEqual(QUOTES.map((q) => q.id).sort());
  });

  test('a topic feed only holds that topic and loops', () => {
    const feed = buildFeed(input({ source: 'calm' }));
    expect(feed.loops).toBe(true);
    expect(feed.quotes.length).toBeGreaterThan(0);
    for (const q of feed.quotes) expect(q.categories).toContain('calm');
  });

  test('a mix holds any of its topics', () => {
    const feed = buildFeed(input({ mode: 'mix', mix: ['calm', 'courage'] }));
    for (const q of feed.quotes) expect(q.categories.some((c) => c === 'calm' || c === 'courage')).toBe(true);
  });

  test('goals pull matching quotes towards the front', () => {
    const feed = buildFeed(input({ goals: ['love'] }));
    const firstTen = feed.quotes.slice(0, 9);
    const matches = firstTen.filter((q) => q.categories.includes('love')).length;
    expect(matches).toBeGreaterThanOrEqual(6);
    expect(feed.quotes.length).toBe(QUOTES.length);
  });

  test('a pinned quote comes first and is not repeated', () => {
    const feed = buildFeed(input({ startQuoteId: 'c9' }));
    expect(feed.quotes[0].id).toBe('c9');
    expect(feed.quotes.filter((q) => q.id === 'c9')).toHaveLength(1);
  });

  test('favorites keep their saved order and end', () => {
    const feed = buildFeed(input({ source: 'favorites', favoriteIds: ['o3', 'c1', 'missing'] }));
    expect(feed.quotes.map((q) => q.id)).toEqual(['o3', 'c1']);
    expect(feed.loops).toBe(false);
  });

  test('next round never repeats the last quote straight away', () => {
    const quotes = QUOTES.slice(0, 5);
    for (let r = 1; r < 30; r++) {
      const round = nextRound(quotes, r, 3, quotes[4].id);
      expect(round[0].id).not.toBe(quotes[4].id);
    }
  });

  test('greeting uses the time of day and the name', () => {
    expect(greeting('Sam', new Date(2026, 0, 1, 8))).toBe('Good morning, Sam.');
    expect(greeting('', new Date(2026, 0, 1, 20))).toBe('Good evening.');
  });
});

test.describe('reducer', () => {
  test('liking twice unlikes', () => {
    let s = reducer(initialState, { type: 'toggleFavorite', quoteId: 'c1' });
    expect(s.favorites.map((f) => f.quoteId)).toEqual(['c1']);
    s = reducer(s, { type: 'toggleFavorite', quoteId: 'c1' });
    expect(s.favorites).toEqual([]);
  });

  test('history is newest first, deduped and capped', () => {
    let s = initialState;
    for (let i = 0; i < HISTORY_CAP + 20; i++) s = reducer(s, { type: 'markSeen', quoteId: `x${i}` });
    s = reducer(s, { type: 'markSeen', quoteId: 'x30' });
    expect(s.history).toHaveLength(HISTORY_CAP);
    expect(s.history[0].quoteId).toBe('x30');
    expect(s.history.filter((h) => h.quoteId === 'x30')).toHaveLength(1);
  });

  test('picking a feed reshuffles; returning to a personal list refreshes it', () => {
    let s = reducer(initialState, { type: 'setSource', source: 'favorites' });
    expect(s.feed.ids).toEqual([]);
    s = reducer(s, { type: 'toggleFavorite', quoteId: 'o1' });
    expect(s.feed.ids).toEqual([]); // the open feed does not jump while you read it
    s = reducer(s, { type: 'refreshFeed' });
    expect(s.feed.ids).toEqual(['o1']);
  });

  test('a shuffled feed ignores refresh', () => {
    const s = reducer(initialState, { type: 'setSource', source: 'calm' });
    expect(reducer(s, { type: 'refreshFeed' })).toBe(s);
  });

  test('deleting your own quote removes it everywhere', () => {
    let s = reducer(initialState, { type: 'addOwn', quote: { id: 'u1', text: 'Mine', createdAt: 1 } });
    s = reducer(s, { type: 'toggleFavorite', quoteId: 'u1' });
    s = reducer(s, { type: 'markSeen', quoteId: 'u1' });
    s = reducer(s, { type: 'deleteOwn', id: 'u1' });
    expect(s.own).toEqual([]);
    expect(s.favorites).toEqual([]);
    expect(s.history).toEqual([]);
  });

  test('migrate survives junk and fills gaps', () => {
    expect(migrate(null)).toEqual(initialState);
    expect(migrate({ version: 99 })).toEqual(initialState);
    const m = migrate({ version: 1, profile: { name: 'Sam' }, favorites: 'nope' });
    expect(m.profile).toEqual({ name: 'Sam', goals: [], onboarded: false });
    expect(m.favorites).toEqual([]);
    expect(m.feed.ids.length).toBe(QUOTES.length);
  });
});

test.describe('themes', () => {
  test('every built-in theme passes WCAG AA for its quote text', () => {
    for (const t of THEMES) {
      const ratio = worstContrast(t.textColor, backgroundStops(t.background));
      expect(ratio, `${t.id} ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('contrast maths matches the WCAG reference values', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 1);
  });
});

test.describe('reminder times', () => {
  test('spread evenly across the window, inclusive', () => {
    expect(spreadTimes(3, 540, 1260)).toEqual([540, 900, 1260]);
    expect(spreadTimes(1, 540, 1260)).toEqual([900]);
    expect(spreadTimes(0, 540, 1260)).toEqual([]);
    expect(spreadTimes(4, 600, 600)).toEqual([600]);
  });

  test('format as a 12-hour clock', () => {
    expect(formatTime(0)).toBe('12:00 AM');
    expect(formatTime(9 * 60 + 30)).toBe('9:30 AM');
    expect(formatTime(12 * 60)).toBe('12:00 PM');
    expect(formatTime(21 * 60)).toBe('9:00 PM');
  });

  test('relative time', () => {
    const now = 1_000_000_000;
    expect(timeAgo(now - 5_000, now)).toBe('just now');
    expect(timeAgo(now - 5 * 60_000, now)).toBe('5 min ago');
    expect(timeAgo(now - 26 * 3_600_000, now)).toBe('yesterday');
  });
});
