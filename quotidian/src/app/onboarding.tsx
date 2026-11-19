import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ReminderForm, reminderError } from '../components/ReminderForm';
import { ThemeCard } from '../components/ThemeCard';
import { Chip, IconButton, PrimaryButton } from '../components/ui';
import { CATEGORIES, type CategoryId } from '../data/categories';
import { QUOTES } from '../data/quotes';
import { DEFAULT_THEME_ID, THEMES } from '../data/themes';
import { remindersSupported, scheduleReminders } from '../lib/reminders';
import { DEFAULT_REMINDERS, useStore, type ReminderPlan } from '../state/store';
import { color, font, space, type } from '../theme/tokens';

const STEPS = ['welcome', 'name', 'goals', 'reminders', 'theme'] as const;
const STARTER_THEMES = ['ink', 'paper', 'dusk', 'forest', 'sunrise', 'midnight'];

export default function Onboarding() {
  const { dispatch } = useStore();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [goals, setGoals] = useState<CategoryId[]>([]);
  const [plan, setPlan] = useState<ReminderPlan>({ ...DEFAULT_REMINDERS, enabled: true });
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID);
  const current = STEPS[step];
  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));

  const finish = () => {
    dispatch({ type: 'completeOnboarding', name: name.trim(), goals, themeId, reminders: plan });
    router.replace('/');
  };

  const chooseReminders = async (enabled: boolean) => {
    const chosen = { ...plan, enabled };
    setPlan(chosen);
    if (enabled && remindersSupported) {
      // The permission prompt appears here, right after the user asked for reminders.
      await scheduleReminders(chosen, QUOTES, { ask: true });
    }
    next();
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + space[3], paddingBottom: insets.bottom + space[4] }]} testID={`onboarding-step-${current}`}>
      <View style={styles.top}>
        {step > 0 ? (
          <IconButton icon="chevron-back" label="Back" tone="plain" onPress={() => setStep((s) => s - 1)} />
        ) : (
          <View style={{ width: 44 }} />
        )}
        <View
          style={styles.dots}
          role="progressbar"
          aria-label={`Step ${step + 1} of ${STEPS.length}`}
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={step + 1}
        >
          {STEPS.map((s, i) => (
            <View key={s} style={[styles.dot, i <= step && styles.dotOn]} />
          ))}
        </View>
        {current !== 'welcome' && current !== 'theme' ? (
          <PrimaryButton
            label="Skip"
            variant="ghost"
            onPress={() => (current === 'reminders' ? chooseReminders(false) : next())}
            style={{ minHeight: 40, paddingHorizontal: space[3] }}
            testID="onboarding-skip"
          />
        ) : (
          <View style={{ width: 44 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {current === 'welcome' ? (
          <View style={styles.center}>
            <Text style={styles.hero} accessibilityRole="header">
              Words for the days you need them.
            </Text>
            <Text style={styles.sub}>
              One quote a swipe. Keep the ones that land. Get a few through the day, when you need them most.
            </Text>
          </View>
        ) : null}

        {current === 'name' ? (
          <View>
            <Text style={styles.title} accessibilityRole="header">
              What should we call you?
            </Text>
            <Text style={styles.sub}>Used to greet you. It stays on this phone.</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={color.textMuted}
              style={styles.input}
              maxLength={40}
              autoFocus
              returnKeyType="next"
              onSubmitEditing={next}
              accessibilityLabel="Your name"
              testID="onboarding-name"
            />
          </View>
        ) : null}

        {current === 'goals' ? (
          <View>
            <Text style={styles.title} accessibilityRole="header">
              What do you want more of?
            </Text>
            <Text style={styles.sub}>Pick any. Your feed leans towards them.</Text>
            <View style={styles.chips}>
              {CATEGORIES.map((c) => (
                <Chip
                  key={c.id}
                  label={c.name}
                  icon={c.icon}
                  selected={goals.includes(c.id)}
                  onPress={() => setGoals((g) => (g.includes(c.id) ? g.filter((x) => x !== c.id) : [...g, c.id]))}
                  testID={`goal-${c.id}`}
                />
              ))}
            </View>
          </View>
        ) : null}

        {current === 'reminders' ? (
          <View>
            <Text style={styles.title} accessibilityRole="header">
              Get quotes through the day
            </Text>
            <Text style={styles.sub}>
              {remindersSupported
                ? 'A gentle nudge at the times you choose. You can change this any time.'
                : 'Reminders arrive in the phone app. Set your times now and they will be ready there.'}
            </Text>
            <ReminderForm plan={plan} onChange={setPlan} showSource={false} showToggle={false} />
          </View>
        ) : null}

        {current === 'theme' ? (
          <View>
            <Text style={styles.title} accessibilityRole="header">
              Pick a look
            </Text>
            <Text style={styles.sub}>There are more themes, and you can make your own, later.</Text>
            <View style={styles.themes}>
              {THEMES.filter((t) => STARTER_THEMES.includes(t.id)).map((t) => (
                <ThemeCard key={t.id} theme={t} selected={themeId === t.id} onPress={() => setThemeId(t.id)} />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        {current === 'welcome' ? <PrimaryButton label="Get started" onPress={next} testID="onboarding-next" /> : null}
        {current === 'name' || current === 'goals' ? (
          <PrimaryButton label="Continue" onPress={next} testID="onboarding-next" />
        ) : null}
        {current === 'reminders' ? (
          <PrimaryButton
            label="Turn on reminders"
            onPress={() => chooseReminders(true)}
            disabled={!!reminderError({ ...plan, enabled: true })}
            testID="onboarding-next"
          />
        ) : null}
        {current === 'theme' ? <PrimaryButton label="Start reading" onPress={finish} testID="onboarding-finish" /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.bg, paddingHorizontal: space[4] },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 48 },
  dots: { flexDirection: 'row', gap: space[2] },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: color.surface2 },
  dotOn: { backgroundColor: color.accent },
  body: { flexGrow: 1, justifyContent: 'center', paddingVertical: space[5] },
  center: { gap: space[4] },
  hero: { color: color.text, fontFamily: font.display, fontSize: 40, lineHeight: 48 },
  title: { color: color.text, fontFamily: font.display, fontSize: 30, lineHeight: 38, marginBottom: space[2] },
  sub: { color: color.textMuted, fontFamily: font.sans, ...type.base, marginBottom: space[5] },
  input: {
    color: color.text,
    fontFamily: font.sansMedium,
    ...type.xl,
    borderBottomWidth: 1,
    borderBottomColor: color.borderInput,
    paddingVertical: space[3],
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2] },
  themes: { flexDirection: 'row', flexWrap: 'wrap', gap: space[3] },
  footer: { paddingTop: space[3] },
});
