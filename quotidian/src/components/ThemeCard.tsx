import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Theme } from '../data/themes';
import { color, font, radius, space, type } from '../theme/tokens';
import { ThemeBackground, quoteTextStyle } from './quote';

/** A small portrait preview of a theme, used in the theme picker and onboarding. */
export function ThemeCard({ theme, selected, onPress }: { theme: Theme; selected: boolean; onPress: () => void }) {
  const sample = quoteTextStyle(theme, 'Aa', 22);
  return (
    <Pressable
      onPress={onPress}
      role="radio"
      aria-checked={selected}
      accessibilityLabel={`${theme.name} theme`}
      testID={`theme-${theme.id}`}
      style={({ pressed }) => [styles.card, selected && styles.selected, pressed && { opacity: 0.85 }]}
    >
      <ThemeBackground background={theme.background} style={styles.preview}>
        <Text style={[sample, { textAlign: 'center' }]}>Aa</Text>
        {selected ? (
          <View style={styles.check}>
            <Ionicons name="checkmark" size={14} color={color.onAccent} />
          </View>
        ) : null}
      </ThemeBackground>
      <Text style={[styles.name, selected && { color: color.onAccent }]} numberOfLines={1}>
        {theme.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: '30.5%', flexGrow: 0, gap: space[2], borderRadius: radius.md, padding: 3 },
  selected: { backgroundColor: color.accent },
  preview: {
    aspectRatio: 9 / 14,
    borderRadius: radius.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
  },
  name: { color: color.text, fontFamily: font.sansMedium, ...type.xs, textAlign: 'center', paddingBottom: space[1] },
  check: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: color.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
