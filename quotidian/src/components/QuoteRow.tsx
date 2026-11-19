import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Quote } from '../data/quotes';
import { color, font, layout, radius, space, type } from '../theme/tokens';

type IconName = ComponentProps<typeof Ionicons>['name'];

/** One quote in a list: tap to read it in the feed, plus one trailing action. */
export function QuoteRow({
  quote,
  meta,
  onPress,
  action,
  testID,
}: {
  quote: Quote;
  meta?: string;
  onPress: () => void;
  action?: { icon: IconName; label: string; onPress: () => void; active?: boolean };
  testID?: string;
}) {
  return (
    <View style={styles.row} testID={testID}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityHint="Opens this quote in the feed"
        style={({ pressed }) => [styles.main, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.text} numberOfLines={4}>
          {quote.text}
        </Text>
        {quote.author || meta ? (
          <Text style={styles.meta} numberOfLines={1}>
            {[quote.author, meta].filter(Boolean).join('  ·  ')}
          </Text>
        ) : null}
      </Pressable>
      {action ? (
        <Pressable
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          hitSlop={layout.hitSlop}
          style={({ pressed }) => [styles.action, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name={action.icon} size={22} color={action.active ? color.like : color.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: color.surface,
    borderRadius: radius.md,
    marginBottom: space[3],
  },
  main: { flex: 1, padding: space[4], gap: space[2] },
  text: { color: color.text, fontFamily: font.serif, ...type.base },
  meta: { color: color.textMuted, fontFamily: font.sans, ...type.xs },
  action: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', marginTop: space[2] },
});
