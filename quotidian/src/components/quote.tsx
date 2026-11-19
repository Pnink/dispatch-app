import { LinearGradient } from 'expo-linear-gradient';
import { forwardRef, type ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  View,
  type HostInstance,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import type { Quote } from '../data/quotes';
import { fontFor, SIZE_SCALE, type Background, type Theme } from '../data/themes';
import { font, space, type } from '../theme/tokens';

export function ThemeBackground({
  background,
  style,
  children,
}: {
  background: Background;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  if (background.kind === 'solid') {
    return <View style={[{ backgroundColor: background.color }, style]}>{children}</View>;
  }
  return (
    <LinearGradient colors={background.colors} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }} style={style}>
      {children}
    </LinearGradient>
  );
}

/** Size and line height for a quote, shrinking long quotes so they fit one screen. */
export function quoteTextStyle(theme: Theme, text: string, base: number = type.quote.fontSize): TextStyle {
  const f = fontFor(theme.font);
  const len = text.length;
  const lengthScale = len > 200 ? 0.72 : len > 140 ? 0.82 : len > 90 ? 0.92 : 1;
  const size = Math.round(base * f.scale * SIZE_SCALE[theme.size] * lengthScale);
  return {
    fontFamily: f.family,
    fontSize: size,
    lineHeight: Math.round(size * (theme.font === 'hand' ? 1.15 : 1.34)),
    color: theme.textColor,
    textAlign: theme.align,
  };
}

export function QuoteText({
  quote,
  theme,
  base,
  numberOfLines,
}: {
  quote: Pick<Quote, 'text' | 'author'>;
  theme: Theme;
  base?: number;
  numberOfLines?: number;
}) {
  const main = quoteTextStyle(theme, quote.text, base);
  return (
    <View style={{ gap: space[4], alignSelf: 'stretch' }}>
      <Text style={main} numberOfLines={numberOfLines} testID="quote-text">
        {quote.text}
      </Text>
      {quote.author ? (
        <Text
          style={{
            fontFamily: font.sansMedium,
            fontSize: Math.max(12, Math.round((main.fontSize ?? 30) * 0.5)),
            lineHeight: Math.max(16, Math.round((main.fontSize ?? 30) * 0.7)),
            color: theme.textColor,
            opacity: 0.78,
            textAlign: theme.align,
            letterSpacing: 0.3,
          }}
          numberOfLines={1}
          testID="quote-author"
        >
          {quote.author}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * The share image: the quote on its theme, with a small wordmark. Rendered
 * off-screen and captured with react-native-view-shot on phones.
 */
export const ShareCard = forwardRef<HostInstance, { quote: Quote; theme: Theme; width: number }>(function ShareCard(
  { quote, theme, width },
  ref,
) {
  const height = Math.round(width * (16 / 9));
  return (
    <View ref={ref} collapsable={false} style={{ width, height }}>
      <ThemeBackground background={theme.background} style={[StyleSheet.absoluteFill, styles.shareInner]}>
        <QuoteText quote={quote} theme={theme} base={28} />
        <Text style={[styles.wordmark, { color: theme.textColor }]}>quotidian</Text>
      </ThemeBackground>
    </View>
  );
});

const styles = StyleSheet.create({
  shareInner: { justifyContent: 'center', paddingHorizontal: space[6] },
  wordmark: {
    position: 'absolute',
    bottom: space[6],
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: font.sansSemi,
    fontSize: 13,
    letterSpacing: 2,
    opacity: 0.6,
  },
});
