import type { Category } from "@/lib/types";

/**
 * Generated product imagery (stand-in for AI product photography).
 * Pure SVG: a soft backdrop, a floor shadow and a simple object silhouette
 * chosen by category and title, tinted with the store's palette.
 */
export function ProductArt({
  seed,
  title,
  category,
  accent,
  soft,
  className = "",
}: {
  seed: number;
  title: string;
  category: Category;
  accent: string;
  soft: string;
  className?: string;
}) {
  const s = seed % 1000;
  const tilt = (s % 7) - 3;
  const circleX = 30 + (s % 40);
  const shape = pickShape(category, title);
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label={title} preserveAspectRatio="xMidYMid slice">
      <rect width="200" height="200" fill={soft} />
      <circle cx={circleX + 60} cy={60 + (s % 30)} r={46 + (s % 20)} fill={accent} opacity="0.12" />
      <rect x="0" y="150" width="200" height="50" fill={accent} opacity="0.06" />
      <ellipse cx="100" cy="160" rx="52" ry="8" fill="#000" opacity="0.12" />
      <g transform={`rotate(${tilt} 100 110)`}>{shape(accent)}</g>
    </svg>
  );
}

type Draw = (c: string) => React.ReactNode;

function pickShape(category: Category, title: string): Draw {
  const t = title.toLowerCase();
  if (/(vase|stoneware)/.test(t)) return vase;
  if (/(candle)/.test(t)) return candle;
  if (/(throw|linen|blanket|bed)/.test(t)) return folded;
  if (/(board)/.test(t)) return board;
  if (/(serum|cream|cleanser|spf|sun|fluid)/.test(t)) return bottle;
  if (/(tee|hoodie|shirt)/.test(t)) return tee;
  if (/(trouser|pant)/.test(t)) return trousers;
  if (/(beanie|hat)/.test(t)) return beanie;
  if (/(bean|blend|origin|decaf|coffee)/.test(t)) return bag;
  if (/(dripper|mug|cup)/.test(t)) return cup;
  if (/(ring|signet)/.test(t)) return ring;
  if (/(necklace|chain|pearl|huggie|earring)/.test(t)) return necklace;
  if (/(toy|rope)/.test(t)) return rope;
  if (/(harness|collar|leash)/.test(t)) return harness;
  const fallback: Record<Category, Draw> = {
    homeware: vase, skincare: bottle, clothing: tee, coffee: bag, jewelry: ring, pet: rope, general: box,
  };
  return fallback[category];
}

const vase: Draw = (c) => (
  <path d="M85 60h30v8c0 6 18 14 18 40s-14 48-33 48-33-22-33-48 18-34 18-40z" fill={c} />
);
const candle: Draw = (c) => (
  <g>
    <rect x="78" y="78" width="44" height="80" rx="6" fill={c} />
    <rect x="98" y="66" width="4" height="14" fill="#333" />
    <path d="M100 48c6 8 6 14 0 18-6-4-6-10 0-18z" fill="#f59e0b" />
  </g>
);
const folded: Draw = (c) => (
  <g>
    <rect x="50" y="118" width="100" height="18" rx="5" fill={c} />
    <rect x="54" y="100" width="92" height="18" rx="5" fill={c} opacity="0.8" />
    <rect x="58" y="82" width="84" height="18" rx="5" fill={c} opacity="0.6" />
    <rect x="62" y="140" width="76" height="18" rx="5" fill={c} opacity="0.9" />
  </g>
);
const board: Draw = (c) => (
  <g>
    <rect x="58" y="70" width="84" height="88" rx="14" fill={c} />
    <rect x="92" y="44" width="16" height="32" rx="6" fill={c} />
    <circle cx="100" cy="54" r="4" fill="#fff" opacity="0.6" />
  </g>
);
const bottle: Draw = (c) => (
  <g>
    <rect x="92" y="40" width="16" height="20" rx="3" fill="#2a2a2a" />
    <rect x="86" y="58" width="28" height="10" rx="3" fill="#ddd" />
    <rect x="74" y="66" width="52" height="92" rx="12" fill={c} />
    <rect x="84" y="96" width="32" height="30" rx="3" fill="#fff" opacity="0.75" />
  </g>
);
const tee: Draw = (c) => (
  <path d="M74 52l-30 18 12 26 14-6v68h60V90l14 6 12-26-30-18c-4 10-14 14-26 14s-22-4-26-14z" fill={c} />
);
const trousers: Draw = (c) => <path d="M68 44h64l8 114h-28l-12-80-12 80H60z" fill={c} />;
const beanie: Draw = (c) => (
  <g>
    <path d="M56 130c0-40 20-70 44-70s44 30 44 70z" fill={c} />
    <rect x="52" y="124" width="96" height="26" rx="8" fill={c} opacity="0.85" />
    <circle cx="100" cy="56" r="10" fill={c} />
  </g>
);
const bag: Draw = (c) => (
  <g>
    <path d="M68 60h64l6 98H62z" fill={c} />
    <path d="M68 60l8-12h48l8 12z" fill={c} opacity="0.7" />
    <rect x="80" y="92" width="40" height="34" rx="3" fill="#fff" opacity="0.8" />
  </g>
);
const cup: Draw = (c) => (
  <g>
    <path d="M60 80h80l-14 64H74z" fill={c} />
    <rect x="56" y="72" width="88" height="10" rx="4" fill={c} opacity="0.8" />
    <rect x="70" y="144" width="60" height="12" rx="4" fill={c} opacity="0.7" />
  </g>
);
const ring: Draw = (c) => (
  <g>
    <circle cx="100" cy="115" r="36" fill="none" stroke={c} strokeWidth="12" />
    <ellipse cx="100" cy="76" rx="18" ry="10" fill={c} />
  </g>
);
const necklace: Draw = (c) => (
  <g>
    <path d="M50 50c0 60 30 90 50 90s50-30 50-90" fill="none" stroke={c} strokeWidth="3" />
    <circle cx="100" cy="146" r="10" fill={c} />
  </g>
);
const rope: Draw = (c) => (
  <g>
    <path d="M50 120c20-40 80-40 100 0" fill="none" stroke={c} strokeWidth="14" strokeLinecap="round" />
    <circle cx="50" cy="124" r="14" fill={c} opacity="0.8" />
    <circle cx="150" cy="124" r="14" fill={c} opacity="0.8" />
  </g>
);
const harness: Draw = (c) => (
  <g fill="none" stroke={c} strokeWidth="12" strokeLinejoin="round">
    <path d="M60 80h80v50H60z" />
    <path d="M100 80v-24" />
    <circle cx="100" cy="50" r="8" fill={c} />
  </g>
);
const box: Draw = (c) => (
  <g>
    <rect x="58" y="76" width="84" height="80" rx="6" fill={c} />
    <rect x="52" y="64" width="96" height="18" rx="4" fill={c} opacity="0.8" />
    <rect x="94" y="64" width="12" height="92" fill="#fff" opacity="0.5" />
  </g>
);
