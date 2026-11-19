import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { QuoteText, ThemeBackground } from '../components/quote';
import { Chip, PrimaryButton, Screen, SectionTitle } from '../components/ui';
import {
  BACKGROUND_SWATCHES,
  backgroundKey,
  backgroundStops,
  FONT_OPTIONS,
  TEXT_SWATCHES,
  type QuoteAlign,
  type QuoteSize,
  type Theme,
} from '../data/themes';
import { worstContrast } from '../lib/contrast';
import { useStore } from '../state/store';
import { color, font, radius, space, type } from '../theme/tokens';

const SAMPLE = { text: 'Small steps, taken daily, turn into a road.' };

export default function ThemeEditor() {
  const { state, dispatch, theme } = useStore();
  const [draft, setDraft] = useState<Theme>(() =>
    state.themeId === 'custom' ? state.custom : { ...theme, id: 'custom', name: 'Your theme' },
  );
  const set = (patch: Partial<Theme>) => setDraft((d) => ({ ...d, ...patch }));
  const ratio = worstContrast(draft.textColor, backgroundStops(draft.background));
  const lowContrast = ratio < 3;

  return (
    <Screen title="Create a theme" closeIcon="back" testID="theme-editor">
      <ThemeBackground background={draft.background} style={styles.preview}>
        <QuoteText quote={SAMPLE} theme={draft} base={24} />
      </ThemeBackground>
      {lowContrast ? (
        <View style={styles.warning} accessibilityRole="alert" testID="contrast-warning">
          <Ionicons name="warning-outline" size={18} color={color.danger} />
          <Text style={styles.warningText}>
            This text colour is hard to read on that background ({ratio.toFixed(1)}:1). Try a lighter or darker one.
          </Text>
        </View>
      ) : null}

      <SectionTitle>Background</SectionTitle>
      <View style={styles.swatches}>
        {BACKGROUND_SWATCHES.map((bg) => {
          const selected = backgroundKey(bg) === backgroundKey(draft.background);
          return (
            <Pressable
              key={backgroundKey(bg)}
              onPress={() => set({ background: bg })}
              role="radio"
              aria-checked={selected}
              accessibilityLabel={`Background ${backgroundStops(bg).join(' to ')}`}
              style={[styles.swatchRing, selected && styles.swatchRingOn]}
            >
              <ThemeBackground background={bg} style={styles.swatch} />
            </Pressable>
          );
        })}
      </View>

      <SectionTitle>Font</SectionTitle>
      <View style={styles.fonts}>
        {FONT_OPTIONS.map((f) => {
          const selected = draft.font === f.id;
          return (
            <Pressable
              key={f.id}
              onPress={() => set({ font: f.id })}
              role="radio"
              aria-checked={selected}
              accessibilityLabel={`${f.label} font`}
              style={[styles.font, selected && styles.fontOn]}
              testID={`font-${f.id}`}
            >
              <Text style={{ fontFamily: f.family, fontSize: 22 * f.scale, color: selected ? color.onAccent : color.text }}>
                Aa
              </Text>
              <Text style={[styles.fontLabel, selected && { color: color.onAccent }]}>{f.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <SectionTitle>Text colour</SectionTitle>
      <View style={styles.swatches}>
        {TEXT_SWATCHES.map((c) => {
          const selected = draft.textColor.toLowerCase() === c.toLowerCase();
          return (
            <Pressable
              key={c}
              onPress={() => set({ textColor: c })}
              role="radio"
              aria-checked={selected}
              accessibilityLabel={`Text colour ${c}`}
              style={[styles.swatchRing, selected && styles.swatchRingOn]}
              testID={`text-${c.slice(1)}`}
            >
              <View style={[styles.swatch, { backgroundColor: c }]} />
            </Pressable>
          );
        })}
      </View>

      <SectionTitle>Size</SectionTitle>
      <View style={styles.chips}>
        {(['s', 'm', 'l'] as QuoteSize[]).map((s) => (
          <Chip key={s} label={{ s: 'Small', m: 'Medium', l: 'Large' }[s]} selected={draft.size === s} onPress={() => set({ size: s })} />
        ))}
      </View>

      <SectionTitle>Alignment</SectionTitle>
      <View style={styles.chips}>
        {(['center', 'left'] as QuoteAlign[]).map((a) => (
          <Chip
            key={a}
            label={a === 'center' ? 'Centred' : 'Left'}
            icon={a === 'center' ? 'reorder-three-outline' : 'list-outline'}
            selected={draft.align === a}
            onPress={() => set({ align: a })}
          />
        ))}
      </View>

      <PrimaryButton
        label="Save and use"
        onPress={() => {
          dispatch({ type: 'saveCustomTheme', theme: draft });
          router.dismissTo('/');
        }}
        style={{ marginTop: space[5] }}
        testID="save-theme"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: {
    height: 260,
    borderRadius: radius.lg,
    justifyContent: 'center',
    paddingHorizontal: space[5],
    marginBottom: space[4],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: color.border,
  },
  warning: {
    flexDirection: 'row',
    gap: space[2],
    alignItems: 'flex-start',
    backgroundColor: color.surface,
    borderRadius: radius.md,
    padding: space[3],
    marginBottom: space[3],
  },
  warningText: { flex: 1, color: color.text, fontFamily: font.sans, ...type.sm },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2], marginBottom: space[4] },
  swatchRing: { padding: 3, borderRadius: radius.pill, borderWidth: 2, borderColor: 'transparent' },
  swatchRingOn: { borderColor: color.accent },
  swatch: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.borderInput,
  },
  fonts: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2], marginBottom: space[4] },
  font: {
    width: 92,
    height: 84,
    borderRadius: radius.md,
    backgroundColor: color.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[1],
  },
  fontOn: { backgroundColor: color.accent },
  fontLabel: { color: color.textMuted, fontFamily: font.sans, ...type.xs },
  chips: { flexDirection: 'row', gap: space[2], marginBottom: space[4] },
});
