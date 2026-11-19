import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Quote } from '../data/quotes';
import type { ReminderPlan } from '../state/store';
import { shuffle } from './feed';
import { formatTime, spreadTimes } from './time';

export { formatTime, spreadTimes };

export type ReminderStatus = 'scheduled' | 'off' | 'denied' | 'unsupported' | 'empty' | 'error';

/** iOS keeps at most 64 pending local notifications per app. Stay under it. */
const MAX_PENDING = 60;
const CHANNEL_ID = 'reminders';

export const remindersSupported = Platform.OS !== 'web';

if (remindersSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function permissionState(): Promise<'granted' | 'denied' | 'undetermined' | 'unsupported'> {
  if (!remindersSupported) return 'unsupported';
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

/**
 * Replaces every scheduled reminder with a fresh set: one notification per
 * time slot per day, each with a different quote, for as many days ahead as
 * the iOS cap allows. Called on save and every time the app opens, so the
 * queue keeps rolling forward.
 */
export async function scheduleReminders(
  plan: ReminderPlan,
  pool: Quote[],
  options: { ask: boolean; now?: Date; seed?: number } = { ask: false },
): Promise<ReminderStatus> {
  if (!remindersSupported) return 'unsupported';
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!plan.enabled) return 'off';
    if (pool.length === 0) return 'empty';

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted' && options.ask) {
      ({ status } = await Notifications.requestPermissionsAsync());
    }
    if (status !== 'granted') return 'denied';

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Quote reminders',
        // eslint-disable-next-line import/namespace -- re-exported via `export *`, which the rule can't follow
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const now = options.now ?? new Date();
    const times = spreadTimes(plan.perDay, plan.start, plan.end);
    const days = Math.max(1, Math.floor(MAX_PENDING / Math.max(1, times.length)));
    const quotes = shuffle(pool, options.seed ?? now.getTime());
    let qi = 0;
    let scheduled = 0;

    for (let d = 0; d < days && scheduled < MAX_PENDING; d++) {
      for (const t of times) {
        const at = new Date(now);
        at.setDate(now.getDate() + d);
        at.setHours(Math.floor(t / 60), t % 60, 0, 0);
        if (at.getTime() <= now.getTime() + 30_000) continue;
        const q = quotes[qi++ % quotes.length];
        await Notifications.scheduleNotificationAsync({
          content: {
            body: q.author ? `${q.text}\n— ${q.author}` : q.text,
            data: { quoteId: q.id },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: at,
            ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
          },
        });
        scheduled++;
        if (scheduled >= MAX_PENDING) break;
      }
    }
    return 'scheduled';
  } catch {
    return 'error';
  }
}
