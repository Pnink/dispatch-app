import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

type IconName = ComponentProps<typeof Ionicons>['name'];

export type CategoryId =
  | 'hard-times'
  | 'self-worth'
  | 'discipline'
  | 'calm'
  | 'gratitude'
  | 'courage'
  | 'love'
  | 'work'
  | 'growth'
  | 'happiness'
  | 'wisdom';

/** Where the feed draws from: a topic, or one of the personal libraries. */
export type LibrarySource = 'all' | 'favorites' | 'own' | 'history';
export type FeedSource = CategoryId | LibrarySource;

export type Category = {
  id: CategoryId;
  name: string;
  blurb: string;
  icon: IconName;
};

export const CATEGORIES: Category[] = [
  { id: 'hard-times', name: 'Hard days', blurb: 'For when it is heavy', icon: 'rainy-outline' },
  { id: 'self-worth', name: 'Self-worth', blurb: 'You are enough', icon: 'sparkles-outline' },
  { id: 'discipline', name: 'Discipline', blurb: 'Show up anyway', icon: 'barbell-outline' },
  { id: 'calm', name: 'Calm', blurb: 'Slow the breath', icon: 'leaf-outline' },
  { id: 'gratitude', name: 'Gratitude', blurb: 'Notice the good', icon: 'sunny-outline' },
  { id: 'courage', name: 'Courage', blurb: 'Do it scared', icon: 'flame-outline' },
  { id: 'love', name: 'Love & people', blurb: 'The ones who matter', icon: 'heart-circle-outline' },
  { id: 'work', name: 'Focus & work', blurb: 'Build the thing', icon: 'briefcase-outline' },
  { id: 'growth', name: 'Growth', blurb: 'Keep becoming', icon: 'trending-up-outline' },
  { id: 'happiness', name: 'Joy', blurb: 'Small bright things', icon: 'happy-outline' },
  { id: 'wisdom', name: 'Old wisdom', blurb: 'Words that lasted', icon: 'library-outline' },
];

export const LIBRARY: { id: LibrarySource; name: string; icon: IconName }[] = [
  { id: 'all', name: 'All quotes', icon: 'albums-outline' },
  { id: 'favorites', name: 'Favorites', icon: 'heart-outline' },
  { id: 'own', name: 'Your quotes', icon: 'create-outline' },
  { id: 'history', name: 'Recently read', icon: 'time-outline' },
];

const byId = new Map<string, { name: string }>([
  ...CATEGORIES.map((c) => [c.id, c] as const),
  ...LIBRARY.map((l) => [l.id, l] as const),
]);

export function sourceName(source: FeedSource): string {
  return byId.get(source)?.name ?? 'All quotes';
}

export function isLibrarySource(source: FeedSource): source is LibrarySource {
  return source === 'all' || source === 'favorites' || source === 'own' || source === 'history';
}
