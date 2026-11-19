import { StyleSheet, Switch, Text, View } from 'react-native';

import { CATEGORIES, LIBRARY, type FeedSource } from '../data/categories';
import { formatTime } from '../lib/reminders';
import type { ReminderPlan } from '../state/store';
import { color, font, radius, space, type } from '../theme/tokens';
import { Chip, SectionTitle, Stepper } from './ui';

export const MAX_PER_DAY = 20;
const STEP = 30;
const LAST_SLOT = 24 * 60 - STEP;

export function reminderError(plan: ReminderPlan): string | null {
  if (!plan.enabled) return null;
  if (plan.perDay > 1 && plan.start >= plan.end) return 'The start time needs to be before the end time.';
  return null;
}

export function ReminderForm({
  plan,
  onChange,
  showSource = true,
  showToggle = true,
}: {
  plan: ReminderPlan;
  onChange: (plan: ReminderPlan) => void;
  showSource?: boolean;
  showToggle?: boolean;
}) {
  const set = (patch: Partial<ReminderPlan>) => onChange({ ...plan, ...patch });
  const error = reminderError(plan);
  const sources: { id: FeedSource; name: string }[] = [
    ...LIBRARY.filter((l) => l.id !== 'history'),
    ...CATEGORIES,
  ];

  return (
    <View>
      <View style={styles.card}>
        {showToggle ? (
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel} nativeID="reminders-toggle">
              Send me quotes
            </Text>
            <Switch
              value={plan.enabled}
              onValueChange={(enabled) => set({ enabled })}
              accessibilityLabelledBy="reminders-toggle"
              accessibilityLabel="Send me quotes"
              trackColor={{ true: color.success, false: color.surface2 }}
              thumbColor="#ffffff"
              testID="reminders-enabled"
            />
          </View>
        ) : null}
        <View
          style={!plan.enabled && showToggle ? { opacity: 0.4 } : undefined}
          pointerEvents={plan.enabled || !showToggle ? 'auto' : 'none'}
          aria-disabled={!plan.enabled && showToggle}
        >
          <Stepper
            label="How many"
            value={plan.perDay}
            display={`${plan.perDay}× a day`}
            min={1}
            max={MAX_PER_DAY}
            onChange={(perDay) => set({ perDay })}
            testID="reminders-count"
          />
          <Stepper
            label="Start at"
            value={plan.start}
            display={formatTime(plan.start)}
            min={0}
            max={LAST_SLOT}
            step={STEP}
            onChange={(start) => set({ start })}
            testID="reminders-start"
          />
          <Stepper
            label="End at"
            value={plan.end}
            display={formatTime(plan.end)}
            min={0}
            max={LAST_SLOT}
            step={STEP}
            onChange={(end) => set({ end })}
            testID="reminders-end"
          />
        </View>
      </View>
      {error ? (
        <Text style={styles.error} accessibilityRole="alert" testID="reminders-error">
          {error}
        </Text>
      ) : null}

      {showSource ? (
        <View
          style={!plan.enabled ? { opacity: 0.4 } : undefined}
          pointerEvents={plan.enabled ? 'auto' : 'none'}
          aria-disabled={!plan.enabled}
        >
          <SectionTitle>Quotes from</SectionTitle>
          <View style={styles.chips}>
            {sources.map((s) => (
              <Chip key={s.id} label={s.name} selected={plan.source === s.id} onPress={() => set({ source: s.id })} />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: color.surface, borderRadius: radius.md, overflow: 'hidden', marginBottom: space[3] },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 60,
    paddingHorizontal: space[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.border,
  },
  toggleLabel: { color: color.text, fontFamily: font.sansSemi, ...type.base },
  error: { color: color.danger, fontFamily: font.sansMedium, ...type.sm, marginBottom: space[3] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space[2], marginBottom: space[4] },
});
