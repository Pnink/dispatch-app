import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { QuoteRow } from '../components/QuoteRow';
import { EmptyState, PrimaryButton, Screen, SectionTitle } from '../components/ui';
import { CATEGORIES, LIBRARY, type CategoryId, type FeedSource } from '../data/categories';
import { countFor, QUOTES } from '../data/quotes';
import { goBack } from '../lib/nav';
import { useStore } from '../state/store';
import { color, font, radius, space, type } from '../theme/tokens';

export default function Categories() {
  const { state, dispatch, isFavorite, ownAsQuotes } = useStore();
  const { feed } = state;
  const [query, setQuery] = useState('');
  const [mixing, setMixing] = useState(feed.mode === 'mix');
  const [mix, setMix] = useState<CategoryId[]>(feed.mix);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return null;
    return [...ownAsQuotes, ...QUOTES].filter(
      (x) => x.text.toLowerCase().includes(q) || (x.author ?? '').toLowerCase().includes(q),
    );
  }, [query, ownAsQuotes]);

  const pick = (source: FeedSource, startQuoteId?: string) => {
    dispatch({ type: 'setSource', source, startQuoteId });
    goBack();
  };

  const toggleMix = (id: CategoryId) =>
    setMix((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));

  const counts: Record<string, number> = {
    favorites: state.favorites.length,
    own: state.own.length,
    history: state.history.length,
  };

  return (
    <Screen title="Categories" testID="categories-screen">
      <View style={styles.search}>
        <Ionicons name="search" size={18} color={color.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search quotes or authors"
          placeholderTextColor={color.textMuted}
          style={styles.searchInput}
          accessibilityLabel="Search quotes or authors"
          returnKeyType="search"
          autoCorrect={false}
          testID="search"
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} accessibilityRole="button" accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={18} color={color.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {results ? (
        <View testID="search-results">
          <SectionTitle>{`${results.length} ${results.length === 1 ? 'result' : 'results'}`}</SectionTitle>
          {results.length === 0 ? (
            <EmptyState icon="search" title="Nothing matches" body="Try a different word, or an author's name." />
          ) : (
            results.slice(0, 50).map((q) => (
              <QuoteRow
                key={q.id}
                quote={q}
                onPress={() => pick('all', q.id)}
                action={{
                  icon: isFavorite(q.id) ? 'heart' : 'heart-outline',
                  label: isFavorite(q.id) ? 'Remove from favorites' : 'Add to favorites',
                  active: isFavorite(q.id),
                  onPress: () => dispatch({ type: 'toggleFavorite', quoteId: q.id }),
                }}
              />
            ))
          )}
        </View>
      ) : (
        <>
          <SectionTitle>Your library</SectionTitle>
          <View style={styles.grid}>
            {LIBRARY.map((l) => (
              <Tile
                key={l.id}
                icon={l.icon}
                title={l.name}
                subtitle={l.id === 'all' ? `${QUOTES.length + state.own.length} quotes` : `${counts[l.id]}`}
                selected={!mixing && feed.mode === 'source' && feed.source === l.id}
                disabled={mixing}
                onPress={() => pick(l.id)}
                testID={`source-${l.id}`}
              />
            ))}
          </View>

          <View style={styles.topicsHeader}>
            <SectionTitle>Topics</SectionTitle>
            <Pressable
              onPress={() => setMixing((m) => !m)}
              role="switch"
              aria-checked={mixing}
              accessibilityLabel="Make your own mix"
              style={[styles.mixToggle, mixing && { backgroundColor: color.accent }]}
              testID="mix-toggle"
            >
              <Ionicons name="shuffle" size={16} color={mixing ? color.onAccent : color.text} />
              <Text style={[styles.mixLabel, mixing && { color: color.onAccent }]}>
                {mixing ? 'Mixing' : 'Make a mix'}
              </Text>
            </Pressable>
          </View>
          {mixing ? <Text style={styles.help}>Pick as many topics as you like, then apply.</Text> : null}

          <View style={styles.grid}>
            {CATEGORIES.map((c) => {
              const inMix = mix.includes(c.id);
              return (
                <Tile
                  key={c.id}
                  icon={c.icon}
                  title={c.name}
                  subtitle={`${countFor(c.id)} · ${c.blurb}`}
                  selected={mixing ? inMix : feed.mode === 'source' && feed.source === c.id}
                  checkbox={mixing}
                  onPress={() => (mixing ? toggleMix(c.id) : pick(c.id))}
                  testID={`topic-${c.id}`}
                />
              );
            })}
          </View>

          {mixing ? (
            <PrimaryButton
              label={mix.length ? `Apply mix (${mix.length})` : 'Pick at least one topic'}
              disabled={mix.length === 0}
              onPress={() => {
                dispatch({ type: 'setMix', mix });
                goBack();
              }}
              style={{ marginTop: space[3] }}
              testID="apply-mix"
            />
          ) : null}
        </>
      )}
    </Screen>
  );
}

function Tile({
  icon,
  title,
  subtitle,
  selected,
  checkbox,
  disabled,
  onPress,
  testID,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
  selected: boolean;
  checkbox?: boolean;
  disabled?: boolean;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      role={checkbox ? 'checkbox' : 'radio'}
      aria-checked={selected}
      aria-disabled={!!disabled}
      accessibilityLabel={`${title}, ${subtitle}`}
      testID={testID}
      style={({ pressed }) => [
        styles.tile,
        selected && styles.tileSelected,
        pressed && { opacity: 0.8 },
        disabled && { opacity: 0.4 },
      ]}
    >
      <View style={styles.tileTop}>
        <Ionicons name={icon} size={22} color={selected ? color.onAccent : color.text} />
        {checkbox ? (
          <Ionicons
            name={selected ? 'checkmark-circle' : 'ellipse-outline'}
            size={20}
            color={selected ? color.onAccent : color.textMuted}
          />
        ) : null}
      </View>
      <Text style={[styles.tileTitle, selected && { color: color.onAccent }]} numberOfLines={1}>
        {title}
      </Text>
      <Text style={[styles.tileSub, selected && { color: color.onAccent, opacity: 0.75 }]} numberOfLines={1}>
        {subtitle}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    backgroundColor: color.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: color.border,
    paddingHorizontal: space[4],
    height: 48,
    marginBottom: space[4],
  },
  searchInput: { flex: 1, color: color.text, fontFamily: font.sans, ...type.base, height: '100%' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[3], marginBottom: space[4] },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: color.surface,
    borderRadius: radius.md,
    padding: space[4],
    gap: space[1],
    minHeight: 104,
  },
  tileSelected: { backgroundColor: color.accent },
  tileTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: space[2] },
  tileTitle: { color: color.text, fontFamily: font.sansSemi, ...type.base },
  tileSub: { color: color.textMuted, fontFamily: font.sans, ...type.xs },
  topicsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mixToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    paddingHorizontal: space[3],
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: color.surface2,
  },
  mixLabel: { color: color.text, fontFamily: font.sansMedium, ...type.sm },
  help: { color: color.textMuted, fontFamily: font.sans, ...type.sm, marginBottom: space[3] },
});
