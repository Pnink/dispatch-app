import { router } from 'expo-router';
import { View } from 'react-native';

import { QuoteRow } from '../components/QuoteRow';
import { EmptyState, IconButton, PrimaryButton, Screen } from '../components/ui';
import { useStore } from '../state/store';
import { space } from '../theme/tokens';

export default function MyQuotes() {
  const { state, dispatch, ownAsQuotes } = useStore();

  return (
    <Screen
      title="Your own quotes"
      closeIcon="back"
      testID="own-screen"
      right={<IconButton icon="add" label="Write a quote" tone="surface" onPress={() => router.push('/own-quote')} testID="add-own" />}
    >
      {ownAsQuotes.length === 0 ? (
        <EmptyState
          icon="create-outline"
          title="Nothing written yet"
          body="Write the words you need to hear. They show up in your feed and in your reminders."
          action={
            <View style={{ alignSelf: 'stretch', marginTop: space[3] }}>
              <PrimaryButton label="Write a quote" onPress={() => router.push('/own-quote')} testID="add-own-empty" />
            </View>
          }
        />
      ) : (
        <>
          {ownAsQuotes.map((q) => (
            <QuoteRow
              key={q.id}
              quote={q}
              testID="own-row"
              onPress={() => {
                dispatch({ type: 'setSource', source: 'own', startQuoteId: q.id });
                router.dismissTo('/');
              }}
              action={{
                icon: 'pencil',
                label: 'Edit quote',
                onPress: () => router.push({ pathname: '/own-quote', params: { id: q.id } }),
              }}
            />
          ))}
          {state.own.length > 0 ? (
            <PrimaryButton
              label="Read them in the feed"
              variant="secondary"
              onPress={() => {
                dispatch({ type: 'setSource', source: 'own' });
                router.dismissTo('/');
              }}
              style={{ marginTop: space[2] }}
            />
          ) : null}
        </>
      )}
    </Screen>
  );
}
