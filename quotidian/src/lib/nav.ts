import { router } from 'expo-router';

/** Close the current screen; if it was opened directly (a web link), go to the feed. */
export function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}
