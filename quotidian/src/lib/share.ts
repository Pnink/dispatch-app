import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import type { RefObject } from 'react';
import { Platform, Share, type HostInstance } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import type { Quote } from '../data/quotes';

export type ShareResult = 'image' | 'text' | 'copied' | 'cancelled' | 'failed';

export function quoteAsText(q: Quote): string {
  return q.author ? `“${q.text}”\n— ${q.author}` : `“${q.text}”`;
}

/**
 * Phone: share a picture of the themed card. Web, or if the capture fails:
 * the system share sheet with text. No share sheet at all (desktop web):
 * copy to the clipboard.
 */
export async function shareQuote(q: Quote, cardRef?: RefObject<HostInstance | null>): Promise<ShareResult> {
  if (Platform.OS !== 'web' && cardRef?.current) {
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: 'Share quote' });
        return 'image';
      }
    } catch {
      // fall through to text
    }
  }

  const message = quoteAsText(q);
  const canWebShare =
    Platform.OS !== 'web' || (typeof navigator !== 'undefined' && typeof navigator.share === 'function');

  if (canWebShare) {
    try {
      const res = await Share.share({ message });
      return res.action === Share.dismissedAction ? 'cancelled' : 'text';
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return 'cancelled';
    }
  }

  try {
    await Clipboard.setStringAsync(message);
    return 'copied';
  } catch {
    return 'failed';
  }
}
