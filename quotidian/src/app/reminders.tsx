import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { reminderError, ReminderForm } from '../components/ReminderForm';
import { PrimaryButton, Screen } from '../components/ui';
import { goBack } from '../lib/nav';
import { reminderPool } from '../lib/pool';
import { formatTime, permissionState, remindersSupported, scheduleReminders, type ReminderStatus } from '../lib/reminders';
import { useStore, type ReminderPlan } from '../state/store';
import { color, font, radius, space, type } from '../theme/tokens';

export default function Reminders() {
  const { state, dispatch, getQuote, ownAsQuotes } = useStore();
  const [plan, setPlan] = useState<ReminderPlan>(state.reminders);
  const [status, setStatus] = useState<ReminderStatus | null>(null);
  const [permission, setPermission] = useState<string>('undetermined');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    permissionState().then(setPermission).catch(() => {});
  }, []);

  const error = reminderError(plan);

  const save = async () => {
    if (error) return;
    setSaving(true);
    dispatch({ type: 'setReminders', plan });
    const pool = reminderPool({ ...state, reminders: plan }, getQuote, ownAsQuotes);
    const result = await scheduleReminders(plan, pool, { ask: true });
    setStatus(result);
    setPermission(await permissionState().catch(() => 'undetermined'));
    setSaving(false);
    if (result === 'scheduled' || result === 'off' || result === 'unsupported') goBack();
  };

  return (
    <Screen title="Reminders" closeIcon="back" testID="reminders-screen">
      <Text style={styles.intro}>
        Quotes arrive as notifications, spread evenly between your start and end time.
      </Text>

      {!remindersSupported ? (
        <Notice icon="phone-portrait-outline" testID="reminders-web">
          Reminders arrive on your phone. Open Quotidian in the iOS or Android app to turn them on. You can still set
          your times here.
        </Notice>
      ) : permission === 'denied' || status === 'denied' ? (
        <Notice icon="notifications-off-outline">
          Notifications are turned off for Quotidian.{' '}
          <Text style={styles.link} onPress={() => Linking.openSettings()} accessibilityRole="link">
            Open Settings
          </Text>{' '}
          to allow them.
        </Notice>
      ) : null}

      {status === 'empty' ? (
        <Notice icon="alert-circle-outline">
          There are no quotes in that list yet, so there is nothing to send. Pick another source.
        </Notice>
      ) : null}
      {status === 'error' ? <Notice icon="alert-circle-outline">Something went wrong scheduling. Try again.</Notice> : null}

      <ReminderForm plan={plan} onChange={setPlan} />

      {plan.enabled && !error ? (
        <Text style={styles.summary} testID="reminders-summary">
          {plan.perDay === 1
            ? `One quote a day, around ${formatTime(Math.round((plan.start + plan.end) / 2))}.`
            : `${plan.perDay} quotes a day between ${formatTime(plan.start)} and ${formatTime(plan.end)}.`}
        </Text>
      ) : null}

      <PrimaryButton label={saving ? 'Saving…' : 'Save'} onPress={save} disabled={!!error || saving} testID="reminders-save" />
    </Screen>
  );
}

function Notice({
  icon,
  children,
  testID,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  children: ReactNode;
  testID?: string;
}) {
  return (
    <View style={styles.notice} testID={testID}>
      <Ionicons name={icon} size={20} color={color.text} />
      <Text style={styles.noticeText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { color: color.textMuted, fontFamily: font.sans, ...type.sm, marginBottom: space[4] },
  notice: {
    flexDirection: 'row',
    gap: space[3],
    alignItems: 'flex-start',
    backgroundColor: color.surface2,
    borderRadius: radius.md,
    padding: space[4],
    marginBottom: space[4],
  },
  noticeText: { flex: 1, color: color.text, fontFamily: font.sans, ...type.sm },
  link: { color: color.accent, fontFamily: font.sansSemi, textDecorationLine: 'underline' },
  summary: { color: color.textMuted, fontFamily: font.sans, ...type.sm, textAlign: 'center', marginBottom: space[3] },
});
