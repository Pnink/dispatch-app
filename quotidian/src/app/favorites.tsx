import { router } from 'expo-router';

import { QuoteRow } from '../components/QuoteRow';
import { EmptyState, PrimaryButton, Screen } from '../components/ui';
import { useStore } from '../state/store';
import { space } from '../theme/tokens';

export default function Favorites() {
  const { state, dispatch, getQuote } = useStore();
  const quotes = state.favorites.map((f) => getQuote(f.quoteId)).filter((q) => q !== undefined);

  return (
    <Screen
      title="Favorites"
      closeIcon="back"
      testID="favorites-screen"
      right={
        quotes.length ? (
          <PrimaryButton
            label="Read"
            variant="secondary"
            onPress={() => {
              dispatch({ type: 'setSource', source: 'favorites' });
              router.dismissTo('/');
            }}
            style={{ minHeight: 36, paddingHorizontal: space[4] }}
          />
        ) : undefined
      }
    >
      {quotes.length === 0 ? (
        <EmptyState
          icon="heart-outline"
          title="No favorites yet"
          body="Tap the heart on any quote, or double-tap the quote itself, and it will wait for you here."
        />
      ) : (
        quotes.map((q) => (
          <QuoteRow
            key={q.id}
            quote={q}
            testID="favorite-row"
            onPress={() => {
              dispatch({ type: 'setSource', source: 'favorites', startQuoteId: q.id });
              router.dismissTo('/');
            }}
            action={{
              icon: 'heart',
              label: 'Remove from favorites',
              active: true,
              onPress: () => dispatch({ type: 'toggleFavorite', quoteId: q.id }),
            }}
          />
        ))
      )}
    </Screen>
  );
}
