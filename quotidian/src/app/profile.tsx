import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Group, Row, Screen } from '../components/ui';
import { sourceName } from '../data/categories';
import { useStore } from '../state/store';
import { color, font, radius, space, type } from '../theme/tokens';

export default function Profile() {
  const { state, dispatch, theme } = useStore();
  const [name, setName] = useState(state.profile.name);
  const r = state.reminders;

  return (
    <Screen title="Profile" testID="profile-screen">
      <View style={styles.nameCard}>
        <Text style={styles.label} nativeID="name-label">
          Your name
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          onBlur={() => dispatch({ type: 'setName', name: name.trim() })}
          onSubmitEditing={() => dispatch({ type: 'setName', name: name.trim() })}
          placeholder="What should we call you?"
          placeholderTextColor={color.textMuted}
          style={styles.input}
          maxLength={40}
          returnKeyType="done"
          accessibilityLabelledBy="name-label"
          accessibilityLabel="Your name"
          testID="name-input"
        />
      </View>

      <Group title="Your quotes">
        <Row icon="heart-outline" label="Favorites" detail={String(state.favorites.length)} onPress={() => router.push('/favorites')} testID="row-favorites" />
        <Row icon="create-outline" label="Your own quotes" detail={String(state.own.length)} onPress={() => router.push('/my-quotes')} testID="row-own" />
        <Row icon="time-outline" label="Recently read" detail={String(state.history.length)} onPress={() => router.push('/history')} testID="row-history" />
      </Group>

      <Group title="Settings">
        <Row
          icon="notifications-outline"
          label="Reminders"
          detail={r.enabled ? `${r.perDay}× a day` : 'Off'}
          onPress={() => router.push('/reminders')}
          testID="row-reminders"
        />
        <Row icon="color-palette-outline" label="Theme" detail={theme.name} onPress={() => router.push('/themes')} testID="row-theme" />
        <Row
          icon="grid-outline"
          label="Feed"
          detail={state.feed.mode === 'mix' ? 'Your mix' : sourceName(state.feed.source)}
          onPress={() => router.push('/categories')}
        />
      </Group>

      <Text style={styles.footnote}>
        Everything you save stays on this device. No account, no tracking.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  nameCard: {
    backgroundColor: color.surface,
    borderRadius: radius.md,
    padding: space[4],
    marginBottom: space[5],
    gap: space[2],
  },
  label: { color: color.textMuted, fontFamily: font.sansMedium, ...type.xs },
  input: {
    color: color.text,
    fontFamily: font.sansMedium,
    ...type.lg,
    paddingVertical: space[2],
    borderBottomWidth: 1,
    borderBottomColor: color.borderInput,
  },
  footnote: { color: color.textMuted, fontFamily: font.sans, ...type.sm, textAlign: 'center', marginTop: space[2] },
});
