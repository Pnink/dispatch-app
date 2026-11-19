import { Alert, Platform } from 'react-native';

/** Alert.alert with buttons is a no-op on web, so use the browser's confirm there. */
export function confirm(title: string, message: string, destructiveLabel = 'Delete'): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(typeof window !== 'undefined' ? window.confirm(`${title}\n\n${message}`) : false);
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: destructiveLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}
