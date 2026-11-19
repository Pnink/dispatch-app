import { font } from '../theme/tokens';
import { isLight, luminance } from '../lib/contrast';

export type Background =
  | { kind: 'solid'; color: string }
  | { kind: 'gradient'; colors: [string, string, ...string[]] };

export type QuoteFont = 'serif' | 'display' | 'sans' | 'hand' | 'mono';
export type QuoteSize = 's' | 'm' | 'l';
export type QuoteAlign = 'center' | 'left';

export type Theme = {
  id: string;
  name: string;
  background: Background;
  font: QuoteFont;
  textColor: string;
  size: QuoteSize;
  align: QuoteAlign;
};

export const FONT_OPTIONS: { id: QuoteFont; label: string; family: string; scale: number }[] = [
  { id: 'serif', label: 'Classic', family: font.serif, scale: 1 },
  { id: 'display', label: 'Elegant', family: font.display, scale: 1.02 },
  { id: 'sans', label: 'Clean', family: font.sansMedium, scale: 0.94 },
  { id: 'hand', label: 'Handwritten', family: font.hand, scale: 1.25 },
  { id: 'mono', label: 'Typewriter', family: font.mono, scale: 0.86 },
];

export const SIZE_SCALE: Record<QuoteSize, number> = { s: 0.84, m: 1, l: 1.16 };

/* Built-in themes. All colours chosen for this app; text colours pass
 * WCAG AA (4.5:1) against every stop of their background. */
export const THEMES: Theme[] = [
  { id: 'ink', name: 'Ink', background: { kind: 'solid', color: '#0c0c0e' }, font: 'serif', textColor: '#f4f2ee', size: 'm', align: 'center' },
  { id: 'paper', name: 'Paper', background: { kind: 'solid', color: '#f3eee4' }, font: 'display', textColor: '#1c1a17', size: 'm', align: 'center' },
  { id: 'dusk', name: 'Dusk', background: { kind: 'gradient', colors: ['#24183a', '#6b2f5f'] }, font: 'serif', textColor: '#fff4f6', size: 'm', align: 'center' },
  { id: 'tide', name: 'Tide', background: { kind: 'gradient', colors: ['#0f2027', '#203a43', '#2c5364'] }, font: 'sans', textColor: '#f1f7fa', size: 'm', align: 'center' },
  { id: 'forest', name: 'Forest', background: { kind: 'gradient', colors: ['#14261d', '#2f5a42'] }, font: 'serif', textColor: '#f3ecd8', size: 'm', align: 'center' },
  { id: 'sunrise', name: 'Sunrise', background: { kind: 'gradient', colors: ['#ffd8a8', '#ffb38a'] }, font: 'display', textColor: '#2a1308', size: 'm', align: 'center' },
  { id: 'sand', name: 'Sand', background: { kind: 'solid', color: '#e8d8c3' }, font: 'hand', textColor: '#33281f', size: 'm', align: 'center' },
  { id: 'slate', name: 'Slate', background: { kind: 'solid', color: '#2f3640' }, font: 'mono', textColor: '#f5f6fa', size: 'm', align: 'left' },
  { id: 'rose', name: 'Rose', background: { kind: 'gradient', colors: ['#fbe3e6', '#f2b9c3'] }, font: 'display', textColor: '#3a1f25', size: 'm', align: 'center' },
  { id: 'midnight', name: 'Midnight', background: { kind: 'gradient', colors: ['#070b1d', '#22305a'] }, font: 'serif', textColor: '#e6ecff', size: 'm', align: 'center' },
  { id: 'ember', name: 'Ember', background: { kind: 'gradient', colors: ['#1a0e0a', '#6e2a1b'] }, font: 'display', textColor: '#ffe9d6', size: 'm', align: 'center' },
  { id: 'mint', name: 'Mint', background: { kind: 'solid', color: '#dcf2e6' }, font: 'sans', textColor: '#12372a', size: 'm', align: 'left' },
  { id: 'lavender', name: 'Lavender', background: { kind: 'gradient', colors: ['#ece6f9', '#cdbdf2'] }, font: 'hand', textColor: '#241a3d', size: 'm', align: 'center' },
  { id: 'mono', name: 'Mono', background: { kind: 'solid', color: '#ffffff' }, font: 'sans', textColor: '#000000', size: 'l', align: 'left' },
  { id: 'citrus', name: 'Citrus', background: { kind: 'gradient', colors: ['#fff1a6', '#ffd166'] }, font: 'mono', textColor: '#2b2100', size: 'm', align: 'left' },
  { id: 'storm', name: 'Storm', background: { kind: 'gradient', colors: ['#3a3f47', '#121417'] }, font: 'sans', textColor: '#eef0f3', size: 'm', align: 'center' },
];

export const DEFAULT_THEME_ID = 'ink';

export const DEFAULT_CUSTOM: Theme = {
  id: 'custom',
  name: 'Your theme',
  background: { kind: 'gradient', colors: ['#1b2a3a', '#4a3a5c'] },
  font: 'serif',
  textColor: '#ffffff',
  size: 'm',
  align: 'center',
};

/* Swatches for the theme editor. */
export const BACKGROUND_SWATCHES: Background[] = [
  { kind: 'solid', color: '#0c0c0e' },
  { kind: 'solid', color: '#ffffff' },
  { kind: 'solid', color: '#f3eee4' },
  { kind: 'solid', color: '#2f3640' },
  { kind: 'solid', color: '#14261d' },
  { kind: 'solid', color: '#7a1f2b' },
  { kind: 'solid', color: '#dcf2e6' },
  { kind: 'solid', color: '#ffd166' },
  { kind: 'gradient', colors: ['#1b2a3a', '#4a3a5c'] },
  { kind: 'gradient', colors: ['#24183a', '#6b2f5f'] },
  { kind: 'gradient', colors: ['#0f2027', '#2c5364'] },
  { kind: 'gradient', colors: ['#ffd8a8', '#ffb38a'] },
  { kind: 'gradient', colors: ['#fbe3e6', '#f2b9c3'] },
  { kind: 'gradient', colors: ['#070b1d', '#22305a'] },
  { kind: 'gradient', colors: ['#1a0e0a', '#6e2a1b'] },
  { kind: 'gradient', colors: ['#ece6f9', '#cdbdf2'] },
];

export const TEXT_SWATCHES = ['#ffffff', '#f4f2ee', '#ffe9d6', '#e6ecff', '#000000', '#1c1a17', '#2a1308', '#12372a', '#ffd166', '#ff8fa3'];

export function backgroundStops(bg: Background): string[] {
  return bg.kind === 'solid' ? [bg.color] : bg.colors;
}

export function backgroundKey(bg: Background): string {
  return backgroundStops(bg).join('-');
}

/** Average background luminance decides whether controls on top are light or dark. */
export function themeIsLight(theme: Theme): boolean {
  const stops = backgroundStops(theme.background);
  const avg = stops.reduce((sum, c) => sum + luminance(c), 0) / stops.length;
  return avg > 0.4 || (stops.length === 1 && isLight(stops[0]));
}

export function fontFor(id: QuoteFont) {
  return FONT_OPTIONS.find((f) => f.id === id) ?? FONT_OPTIONS[0];
}
