export function timeAgo(at: number, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - at) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? 'yesterday' : `${d} days ago`;
}

/** Evenly spread `count` times (minutes after midnight) across [start, end]. */
export function spreadTimes(count: number, start: number, end: number): number[] {
  const n = Math.max(0, Math.floor(count));
  if (n === 0) return [];
  const lo = Math.min(start, end);
  const hi = Math.max(start, end);
  // One a day lands mid-window; a zero-length window can only hold one.
  if (n === 1 || hi === lo) return [Math.round((lo + hi) / 2)];
  const step = (hi - lo) / (n - 1);
  return Array.from({ length: n }, (_, i) => Math.round(lo + step * i));
}

export function formatTime(minutes: number): string {
  const h24 = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const suffix = h24 < 12 ? 'AM' : 'PM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${suffix}`;
}
