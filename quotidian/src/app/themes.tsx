import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ThemeCard } from '../components/ThemeCard';
import { Screen, SectionTitle } from '../components/ui';
import { THEMES } from '../data/themes';
import { goBack } from '../lib/nav';
import { useStore } from '../state/store';
import { color, font, radius, space, type } from '../theme/tokens';

export default function Themes() {
  const { state, dispatch } = useStore();
  return (
    <Screen title="Themes" testID="themes-screen">
      <SectionTitle>Make it yours</SectionTitle>
      <View style={styles.grid}>
        <Pressable
          onPress={() => router.push('/theme-editor')}
          accessibilityRole="button"
          accessibilityLabel="Create your own theme"
          style={({ pressed }) => [styles.card, styles.create, pressed && { opacity: 0.8 }]}
          testID="create-theme"
        >
          <Ionicons name="add" size={28} color={color.text} />
          <Text style={styles.createLabel}>Create your own</Text>
        </Pressable>
        {state.custom ? (
          <ThemeCard
            theme={state.custom}
            selected={state.themeId === 'custom'}
            onPress={() => {
              dispatch({ type: 'setTheme', themeId: 'custom' });
              goBack();
            }}
          />
        ) : null}
      </View>

      <SectionTitle>Collection</SectionTitle>
      <View style={styles.grid}>
        {THEMES.map((t) => (
          <ThemeCard
            key={t.id}
            theme={t}
            selected={state.themeId === t.id}
            onPress={() => {
              dispatch({ type: 'setTheme', themeId: t.id });
              goBack();
            }}
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[3], marginBottom: space[5] },
  card: { width: '30.5%', flexGrow: 0, gap: space[2], borderRadius: radius.md, padding: 3 },
  create: {
    aspectRatio: 9 / 15.6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.surface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: color.borderInput,
  },
  createLabel: { color: color.text, fontFamily: font.sansMedium, ...type.xs, textAlign: 'center' },
});
