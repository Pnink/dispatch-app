import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type HostInstance,
  type LayoutChangeEvent,
  type ListViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAnimatedValue } from '../hooks/useAnimatedValue';
import { QuoteText, ShareCard, ThemeBackground } from '../components/quote';
import { EmptyState, IconButton, PrimaryButton, Toast } from '../components/ui';
import { CATEGORIES, sourceName } from '../data/categories';
import type { Quote } from '../data/quotes';
import { themeIsLight, type Theme } from '../data/themes';
import { greeting, nextRound, type Feed } from '../lib/feed';
import { shareQuote } from '../lib/share';
import { useStore } from '../state/store';
import { font, layout, radius, space, type } from '../theme/tokens';

type Page =
  | { kind: 'quote'; key: string; quote: Quote }
  | { kind: 'greeting'; key: string }
  | { kind: 'end'; key: string }
  | { kind: 'empty'; key: string };

export default function FeedRoute() {
  const { state } = useStore();
  if (!state.profile.onboarded) return <Redirect href="/onboarding" />;
  return <FeedScreen />;
}

let greetedThisLaunch = false;
const VIEWABILITY = { itemVisiblePercentThreshold: 60 };

function FeedScreen() {
  const { state, dispatch, theme, isFavorite, getQuote } = useStore();
  const insets = useSafeAreaInsets();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [index, setIndex] = useState(0);
  const [toast, setToast] = useState<{ text: string; key: number } | null>(null);
  const [sharing, setSharing] = useState<Quote | null>(null);
  const shareRef = useRef<HostInstance>(null);
  const listRef = useRef<FlatList<Page>>(null);
  const light = themeIsLight(theme);
  const { feed } = state;

  // Personal lists (favorites, your quotes, history) pick up changes each time
  // the feed comes back into view. The store leaves shuffled feeds alone.
  useFocusEffect(
    useCallback(() => {
      dispatch({ type: 'refreshFeed' });
    }, [dispatch]),
  );

  const base = useMemo<Feed>(
    () => ({ quotes: feed.ids.map(getQuote).filter((q): q is Quote => q !== undefined), loops: feed.loops }),
    [feed.ids, feed.loops, getQuote],
  );

  // Extra shuffled rounds appended as the reader nears the end of an endless feed.
  const [extra, setExtra] = useState<{ base: Feed; rounds: Quote[][] }>({ base, rounds: [] });
  const rounds = useMemo(
    () => (extra.base === base ? [base.quotes, ...extra.rounds] : [base.quotes]),
    [extra, base],
  );

  // A greeting page opens the first feed of each launch, if we know their name.
  const [showGreeting] = useState(() => !greetedThisLaunch && state.profile.name.trim().length > 0);
  useEffect(() => {
    greetedThisLaunch = true;
  }, []);

  const pages = useMemo<Page[]>(() => {
    const out: Page[] = [];
    if (showGreeting && feed.mode === 'source' && feed.source === 'all' && !feed.startQuoteId) {
      out.push({ kind: 'greeting', key: 'greeting' });
    }
    rounds.forEach((round, r) => round.forEach((q) => out.push({ kind: 'quote', key: `${r}-${q.id}`, quote: q })));
    if (base.quotes.length === 0) out.push({ kind: 'empty', key: 'empty' });
    else if (!base.loops) out.push({ kind: 'end', key: 'end' });
    return out;
  }, [rounds, base, showGreeting, feed.mode, feed.source, feed.startQuoteId]);

  const onEndReached = useCallback(() => {
    if (!base.loops || base.quotes.length === 0) return;
    setExtra((prev) => {
      const current = prev.base === base ? prev.rounds : [];
      const all = [base.quotes, ...current];
      const last = all[all.length - 1];
      return { base, rounds: [...current, nextRound(base.quotes, all.length, feed.seed, last[last.length - 1]?.id)] };
    });
  }, [base, feed.seed]);

  // FlatList needs this callback to keep one identity; dispatch and setIndex are stable.
  const onViewable = useCallback(
    ({ viewableItems }: { viewableItems: ListViewToken[] }) => {
      const first = viewableItems[0];
      if (!first || first.index == null) return;
      setIndex(first.index);
      const page = first.item as Page;
      if (page.kind === 'quote') dispatch({ type: 'markSeen', quoteId: page.quote.id });
      if (first.index > 0) dispatch({ type: 'dismissSwipeHint' });
    },
    [dispatch],
  );

  const toggleLike = useCallback(
    (q: Quote) => {
      dispatch({ type: 'toggleFavorite', quoteId: q.id });
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    },
    [dispatch],
  );

  const startShare = useCallback((q: Quote) => setSharing(q), []);
  useEffect(() => {
    if (!sharing) return;
    let cancelled = false;
    // Wait two frames so the off-screen card has painted before capture.
    requestAnimationFrame(() =>
      requestAnimationFrame(async () => {
        const result = await shareQuote(sharing, shareRef);
        if (cancelled) return;
        if (result === 'copied') setToast({ text: 'Copied to clipboard', key: Date.now() });
        if (result === 'failed') setToast({ text: "Couldn't share that one", key: Date.now() });
        setSharing(null);
      }),
    );
    return () => {
      cancelled = true;
    };
  }, [sharing]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.width || height !== size.height) setSize({ width, height });
  };

  const sourceLabel =
    feed.mode === 'mix'
      ? feed.mix.length === 1
        ? CATEGORIES.find((c) => c.id === feed.mix[0])?.name ?? 'Your mix'
        : 'Your mix'
      : sourceName(feed.source);

  const renderItem = useCallback(
    ({ item }: { item: Page }) => {
      const h = size.height;
      switch (item.kind) {
        case 'quote':
          return (
            <QuotePage
              quote={item.quote}
              theme={theme}
              height={h}
              pageKey={item.key}
              liked={isFavorite(item.quote.id)}
              onToggleLike={toggleLike}
              onShare={startShare}
            />
          );
        case 'greeting':
          return (
            <View style={[styles.page, { height: h }]}>
              <Text style={[styles.greeting, { color: theme.textColor, textAlign: theme.align }]}>
                {greeting(state.profile.name)}
              </Text>
              <Text style={[styles.greetingSub, { color: theme.textColor, textAlign: theme.align }]}>
                Here is something for today. Swipe up.
              </Text>
            </View>
          );
        case 'end':
          return (
            <View style={[styles.page, { height: h, alignItems: 'center', gap: space[4] }]}>
              <Text style={[styles.greeting, { color: theme.textColor }]}>That&apos;s all of them.</Text>
              <PrimaryButton
                label="Back to the top"
                variant="secondary"
                onPress={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })}
              />
              <PrimaryButton label="Read all quotes" onPress={() => dispatch({ type: 'setSource', source: 'all' })} />
            </View>
          );
        case 'empty':
          return <EmptyPage height={h} />;
      }
    },
    [size.height, theme, isFavorite, toggleLike, startShare, state.profile.name, dispatch],
  );

  const showHint = state.hints.swipe && index === 0 && pages.length > 1;

  return (
    <View style={styles.root} onLayout={onLayout}>
      <StatusBar style={light ? 'dark' : 'light'} />
      <ThemeBackground background={theme.background} style={StyleSheet.absoluteFill} />
      {size.height > 0 ? (
        <FlatList
          ref={listRef}
          key={`${feed.mode}-${feed.seed}`}
          data={pages}
          keyExtractor={(p) => p.key}
          renderItem={renderItem}
          pagingEnabled
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          getItemLayout={(_, i) => ({ length: size.height, offset: size.height * i, index: i })}
          onEndReached={onEndReached}
          onEndReachedThreshold={3}
          onViewableItemsChanged={onViewable}
          viewabilityConfig={VIEWABILITY}
          initialNumToRender={2}
          maxToRenderPerBatch={3}
          windowSize={5}
          extraData={theme}
          testID="feed"
        />
      ) : null}

      {showHint ? <SwipeHint light={light} bottom={insets.bottom + 96} /> : null}

      <View style={[styles.bar, { bottom: insets.bottom + space[4] }]} pointerEvents="box-none">
        <Pressable
          onPress={() => router.push('/categories')}
          accessibilityRole="button"
          accessibilityLabel={`Categories. Showing ${sourceLabel}`}
          testID="open-categories"
          hitSlop={layout.hitSlop}
          style={({ pressed }) => [
            styles.pill,
            { backgroundColor: light ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.12)' },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Ionicons name="grid-outline" size={18} color={light ? '#141414' : '#fff'} />
          <Text style={[styles.pillLabel, { color: light ? '#141414' : '#fff' }]} numberOfLines={1}>
            {sourceLabel}
          </Text>
        </Pressable>
        <View style={styles.barRight}>
          <IconButton icon="color-palette-outline" label="Themes" light={light} onPress={() => router.push('/themes')} testID="open-themes" />
          <IconButton icon="person-outline" label="Profile and settings" light={light} onPress={() => router.push('/profile')} testID="open-profile" />
        </View>
      </View>

      {sharing ? (
        <View style={styles.offscreen} pointerEvents="none" aria-hidden>
          <ShareCard ref={shareRef} quote={sharing} theme={theme} width={1080 / 3} />
        </View>
      ) : null}
      <Toast message={toast} />
    </View>
  );
}

const QuotePage = memo(function QuotePage({
  quote,
  pageKey,
  theme,
  height,
  liked,
  onToggleLike,
  onShare,
}: {
  quote: Quote;
  pageKey: string;
  theme: Theme;
  height: number;
  liked: boolean;
  onToggleLike: (q: Quote) => void;
  onShare: (q: Quote) => void;
}) {
  const lastTap = useRef(0);
  const burst = useAnimatedValue(0);

  const pop = () => {
    burst.setValue(0);
    Animated.sequence([
      Animated.spring(burst, { toValue: 1, useNativeDriver: Platform.OS !== 'web', speed: 30, bounciness: 12 }),
      Animated.timing(burst, { toValue: 0, duration: 260, delay: 280, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  };

  // Double tap likes (never unlikes), like a photo app.
  const onPress = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      lastTap.current = 0;
      if (!liked) onToggleLike(quote);
      pop();
    } else {
      lastTap.current = now;
    }
  };

  const justify = theme.align === 'center' ? 'center' : 'flex-start';
  return (
    <Pressable onPress={onPress} accessible={false} style={[styles.page, { height }]} testID={`quote-${pageKey}`}>
      <QuoteText quote={quote} theme={theme} />
      <View style={[styles.actions, { justifyContent: justify }]}>
        <ActionButton
          icon="share-outline"
          label="Share quote"
          color={theme.textColor}
          onPress={() => onShare(quote)}
          testID="share"
        />
        <ActionButton
          icon={liked ? 'heart' : 'heart-outline'}
          label={liked ? 'Remove from favorites' : 'Add to favorites'}
          color={theme.textColor}
          onPress={() => {
            if (!liked) pop();
            onToggleLike(quote);
          }}
          testID="like"
        />
      </View>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.burst,
          {
            opacity: burst,
            transform: [{ scale: burst.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.1] }) }],
          },
        ]}
      >
        <Ionicons name="heart" size={96} color={theme.textColor} />
      </Animated.View>
    </Pressable>
  );
});

function ActionButton({
  icon,
  label,
  color,
  onPress,
  testID,
}: {
  icon: 'share-outline' | 'heart' | 'heart-outline';
  label: string;
  color: string;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={layout.hitSlop}
      testID={testID}
      style={({ pressed }) => [styles.action, pressed && { opacity: 0.6, transform: [{ scale: 0.92 }] }]}
    >
      <Ionicons name={icon} size={28} color={color} />
    </Pressable>
  );
}

function EmptyPage({ height }: { height: number }) {
  const { state, dispatch } = useStore();
  const source = state.feed.source;
  const content =
    source === 'favorites'
      ? { icon: 'heart-outline' as const, title: 'No favorites yet', body: 'Tap the heart on any quote and it will wait for you here.' }
      : source === 'own'
        ? { icon: 'create-outline' as const, title: 'Nothing written yet', body: 'Write the words you need to hear. They will show up here and in your reminders.' }
        : { icon: 'time-outline' as const, title: 'Nothing read yet', body: 'Quotes you read will be listed here.' };
  return (
    <View style={[styles.emptyPage, { height }]}>
      <EmptyState
        icon={content.icon}
        title={content.title}
        body={content.body}
        action={
          <View style={{ gap: space[3], marginTop: space[3], alignSelf: 'stretch' }}>
            {source === 'own' ? <PrimaryButton label="Write a quote" onPress={() => router.push('/own-quote')} /> : null}
            <PrimaryButton
              label="Read all quotes"
              variant={source === 'own' ? 'secondary' : 'primary'}
              onPress={() => dispatch({ type: 'setSource', source: 'all' })}
            />
          </View>
        }
      />
    </View>
  );
}

function SwipeHint({ light, bottom }: { light: boolean; bottom: number }) {
  const y = useAnimatedValue(0);
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(y, { toValue: -8, duration: 600, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(y, { toValue: 0, duration: 600, useNativeDriver: Platform.OS !== 'web' }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [y]);
  const fg = light ? '#141414' : '#ffffff';
  return (
    <Animated.View pointerEvents="none" style={[styles.hint, { bottom, transform: [{ translateY: y }] }]}>
      <Ionicons name="chevron-up" size={22} color={fg} />
      <Text style={[styles.hintText, { color: fg }]}>Swipe up</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  page: { justifyContent: 'center', paddingHorizontal: space[6], paddingBottom: space[7] },
  emptyPage: { justifyContent: 'center', paddingHorizontal: space[5], backgroundColor: 'rgba(12,12,14,0.94)' },
  greeting: { fontFamily: font.display, fontSize: 34, lineHeight: 42 },
  greetingSub: { fontFamily: font.sans, ...type.base, opacity: 0.8, marginTop: space[3] },
  actions: { flexDirection: 'row', gap: space[5], marginTop: space[6] },
  action: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  burst: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    position: 'absolute',
    left: space[4],
    right: space[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  barRight: { flexDirection: 'row', gap: space[3] },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
    height: 44,
    maxWidth: 200,
    paddingHorizontal: space[4],
    borderRadius: radius.pill,
  },
  pillLabel: { fontFamily: font.sansSemi, ...type.sm },
  hint: { position: 'absolute', alignSelf: 'center', alignItems: 'center', gap: 2 },
  hintText: { fontFamily: font.sansMedium, ...type.xs, opacity: 0.8 },
  offscreen: { position: 'absolute', left: -5000, top: 0 },
});
