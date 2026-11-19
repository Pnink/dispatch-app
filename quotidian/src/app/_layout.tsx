import { Caveat_500Medium } from '@expo-google-fonts/caveat';
import { DMMono_400Regular } from '@expo-google-fonts/dm-mono';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Lora_400Regular_Italic, Lora_500Medium } from '@expo-google-fonts/lora';
import { PlayfairDisplay_500Medium } from '@expo-google-fonts/playfair-display';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { remindersSupported, scheduleReminders } from '../lib/reminders';
import { reminderPool } from '../lib/pool';
import { StoreProvider, useStore } from '../state/store';
import { color, layout } from '../theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Lora_500Medium,
    Lora_400Regular_Italic,
    PlayfairDisplay_500Medium,
    Caveat_500Medium,
    DMMono_400Regular,
  });

  return (
    <SafeAreaProvider>
      <StoreProvider>
        <View style={styles.outer}>
          <View style={styles.inner}>
            {fontsLoaded || fontError ? <Navigation /> : null}
          </View>
        </View>
      </StoreProvider>
    </SafeAreaProvider>
  );
}

function Navigation() {
  const { ready } = useStore();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      <StatusBar style="light" />
      <ReminderSync />
      <NotificationOpener />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: color.bg },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="categories" options={{ presentation: 'modal' }} />
        <Stack.Screen name="themes" options={{ presentation: 'modal' }} />
        <Stack.Screen name="profile" options={{ presentation: 'modal' }} />
        <Stack.Screen name="own-quote" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}

/** Keeps the rolling queue of reminder notifications topped up each launch. */
function ReminderSync() {
  const { state, getQuote, ownAsQuotes } = useStore();
  const done = useRef(false);
  useEffect(() => {
    if (done.current || !remindersSupported || !state.reminders.enabled) return;
    done.current = true;
    scheduleReminders(state.reminders, reminderPool(state, getQuote, ownAsQuotes), { ask: false });
  }, [state, getQuote, ownAsQuotes]);
  return null;
}

/** Tapping a reminder opens the feed on that quote. */
function NotificationOpener() {
  if (!remindersSupported) return null;
  return <NotificationOpenerNative />;
}

function NotificationOpenerNative() {
  const { dispatch } = useStore();
  const response = Notifications.useLastNotificationResponse();
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (!response) return;
    const id = response.notification.request.identifier;
    if (handled.current === id) return;
    handled.current = id;
    const quoteId = response.notification.request.content.data?.quoteId;
    if (typeof quoteId === 'string') {
      dispatch({ type: 'setSource', source: 'all', startQuoteId: quoteId });
      router.dismissTo('/');
    }
  }, [response, dispatch]);
  return null;
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: Platform.OS === 'web' ? '#000' : color.bg },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? layout.maxContentWidth : undefined,
    alignSelf: 'center',
    backgroundColor: color.bg,
    overflow: 'hidden',
  },
});
