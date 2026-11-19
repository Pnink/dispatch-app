import { router } from 'expo-router';

import { QuoteRow } from '../components/QuoteRow';
import { EmptyState, PrimaryButton, Screen } from '../components/ui';
import { confirm } from '../lib/confirm';
import { timeAgo } from '../lib/time';
import { useStore } from '../state/store';
import { space } from '../theme/tokens';

export default function History() {
  const { state, dispatch, getQuote, isFavorite } = useStore();
  const rows = state.history
    .map((h) => ({ at: h.at, quote: getQuote(h.quoteId) }))
    .filter((r): r is { at: number; quote: NonNullable<typeof r.quote> } => r.quote !== undefined);

  return (
    <Screen
      title="Recently read"
      closeIcon="back"
      testID="history-screen"
      right={
        rows.length ? (
          <PrimaryButton
            label="Clear"
            variant="ghost"
            onPress={async () => {
              if (await confirm('Clear history?', 'This removes the list of quotes you have read.', 'Clear')) {
                dispatch({ type: 'clearHistory' });
              }
            }}
            style={{ minHeight: 36, paddingHorizontal: space[3] }}
            testID="clear-history"
          />
        ) : undefined
      }
    >
      {rows.length === 0 ? (
        <EmptyState icon="time-outline" title="Nothing read yet" body="Quotes you read in the feed will be listed here." />
      ) : (
        rows.map(({ at, quote }) => (
          <QuoteRow
            key={quote.id}
            quote={quote}
            meta={timeAgo(at)}
            testID="history-row"
            onPress={() => {
              dispatch({ type: 'setSource', source: 'all', startQuoteId: quote.id });
              router.dismissTo('/');
            }}
            action={{
              icon: isFavorite(quote.id) ? 'heart' : 'heart-outline',
              label: isFavorite(quote.id) ? 'Remove from favorites' : 'Add to favorites',
              active: isFavorite(quote.id),
              onPress: () => dispatch({ type: 'toggleFavorite', quoteId: quote.id }),
            }}
          />
        ))
      )}
    </Screen>
  );
}
