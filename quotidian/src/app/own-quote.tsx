import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton, Screen } from '../components/ui';
import { confirm } from '../lib/confirm';
import { goBack } from '../lib/nav';
import { newId, OWN_QUOTE_MAX, useStore } from '../state/store';
import { color, font, radius, space, type } from '../theme/tokens';

export default function OwnQuoteEditor() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { state, dispatch } = useStore();
  const existing = id ? state.own.find((q) => q.id === id) : undefined;
  const [text, setText] = useState(existing?.text ?? '');
  const [author, setAuthor] = useState(existing?.author ?? '');
  const [touched, setTouched] = useState(false);

  const trimmed = text.trim();
  const error = !trimmed ? 'Write something first.' : trimmed.length > OWN_QUOTE_MAX ? `Keep it under ${OWN_QUOTE_MAX} characters.` : null;
  const showError = touched && error;

  const save = () => {
    setTouched(true);
    if (error) return;
    const a = author.trim() || undefined;
    if (existing) {
      dispatch({ type: 'updateOwn', id: existing.id, text: trimmed, author: a });
    } else {
      dispatch({ type: 'addOwn', quote: { id: newId('u'), text: trimmed, author: a, createdAt: Date.now() } });
    }
    goBack();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen title={existing ? 'Edit quote' : 'Write a quote'} testID="own-editor">
        <Text style={styles.label} nativeID="quote-label">
          Your words
        </Text>
        <TextInput
          value={text}
          onChangeText={setText}
          onBlur={() => setTouched(true)}
          placeholder="Something you want to remember…"
          placeholderTextColor={color.textMuted}
          multiline
          autoFocus={!existing}
          maxLength={OWN_QUOTE_MAX + 40}
          style={[styles.area, showError ? { borderColor: color.danger } : null]}
          accessibilityLabel="Your words"
          accessibilityLabelledBy="quote-label"
          aria-invalid={!!showError}
          testID="own-text"
        />
        <View style={styles.helpRow}>
          <Text style={[styles.help, showError ? { color: color.danger } : null]} accessibilityLiveRegion="polite">
            {showError ? error : ' '}
          </Text>
          <Text style={[styles.help, trimmed.length > OWN_QUOTE_MAX && { color: color.danger }]}>
            {trimmed.length}/{OWN_QUOTE_MAX}
          </Text>
        </View>

        <Text style={styles.label} nativeID="author-label">
          Who said it (optional)
        </Text>
        <TextInput
          value={author}
          onChangeText={setAuthor}
          placeholder="You, a friend, a grandparent…"
          placeholderTextColor={color.textMuted}
          maxLength={60}
          style={styles.input}
          accessibilityLabel="Who said it"
          accessibilityLabelledBy="author-label"
          testID="own-author"
        />

        <PrimaryButton label="Save" onPress={save} style={{ marginTop: space[5] }} testID="own-save" />
        {existing ? (
          <PrimaryButton
            label="Delete"
            variant="danger"
            style={{ marginTop: space[3] }}
            testID="own-delete"
            onPress={async () => {
              if (await confirm('Delete this quote?', 'It will be removed from your feed and favorites.')) {
                dispatch({ type: 'deleteOwn', id: existing.id });
                goBack();
              }
            }}
          />
        ) : null}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  label: { color: color.textMuted, fontFamily: font.sansMedium, ...type.xs, marginBottom: space[2] },
  area: {
    minHeight: 160,
    color: color.text,
    fontFamily: font.serif,
    ...type.lg,
    backgroundColor: color.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.borderInput,
    padding: space[4],
    textAlignVertical: 'top',
  },
  input: {
    color: color.text,
    fontFamily: font.sans,
    ...type.base,
    backgroundColor: color.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.borderInput,
    paddingHorizontal: space[4],
    height: 48,
  },
  helpRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space[2], marginBottom: space[4] },
  help: { color: color.textMuted, fontFamily: font.sans, ...type.xs },
});
