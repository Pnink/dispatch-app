/**
 * Fake AI layer. Deterministic, keyword-driven, no network calls.
 * Same shape a real LLM-backed implementation would have, so it can be
 * swapped for an API route later without touching screen code.
 */
import type { Category, EmailFlow, Palette, Product, Review, Store } from "./types";
import { withDefaults } from "./sections";

// ---------- seeded randomness ----------
export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let t = seed || 1;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T,>(r: () => number, arr: T[]): T => arr[Math.floor(r() * arr.length)];

export const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

// ---------- category templates ----------
type Template = {
  keywords: string[];
  nameA: string[];
  nameB: string[];
  palettes: Palette[];
  font: "serif" | "sans";
  products: { title: string; desc: string; price: [number, number]; variants: string[] }[];
  heroes: string[];
};

const TEMPLATES: Record<Category, Template> = {
  homeware: {
    keywords: ["home", "homeware", "decor", "candle", "vase", "ceramic", "linen", "furniture", "kitchen", "interior", "pottery", "lamp"],
    nameA: ["Hearth", "Ember", "Willow", "Stone", "Linden", "Fern", "Oak"],
    nameB: ["& Clay", "House", "Goods", "Studio", "Supply", "Room"],
    palettes: [
      { accent: "#7c4a2d", onAccent: "#ffffff", bg: "#fbf8f3", soft: "#f1e9dd", text: "#2b2118" },
      { accent: "#3f5f4a", onAccent: "#ffffff", bg: "#f7f7f2", soft: "#e7ebe2", text: "#1f2a22" },
    ],
    font: "serif",
    products: [
      { title: "Hand-thrown Stoneware Vase", desc: "Wheel-thrown in small batches, finished with a speckled matte glaze that looks good with or without flowers.", price: [48, 88], variants: ["Oat", "Charcoal", "Sage"] },
      { title: "Washed Linen Throw", desc: "Stonewashed European linen that softens with every wash. Generous size for the sofa or the foot of the bed.", price: [79, 129], variants: ["Natural", "Rust", "Ink"] },
      { title: "Beeswax Pillar Candle", desc: "Pure beeswax with a cotton wick and a slow, clean burn of roughly 40 hours.", price: [22, 36], variants: ["Small", "Large"] },
      { title: "Oak Serving Board", desc: "Solid oak, oiled by hand, with a carved handle. Made for bread, cheese and long lunches.", price: [42, 64], variants: ["Medium", "Large"] },
    ],
    heroes: ["Objects for slower days", "Made for the rooms you live in", "Quiet pieces, made to last"],
  },
  skincare: {
    keywords: ["skin", "skincare", "beauty", "serum", "cream", "cosmetic", "glow", "spa", "wellness", "soap", "makeup"],
    nameA: ["Dew", "Halo", "Bloom", "Lumen", "Mira", "Petal", "Aura"],
    nameB: ["Skin", "Lab", "Botanics", "Ritual", "Apothecary"],
    palettes: [
      { accent: "#9d4b5f", onAccent: "#ffffff", bg: "#fff9f7", soft: "#f8e8e4", text: "#2e1d22" },
      { accent: "#2f6f73", onAccent: "#ffffff", bg: "#f8fbfa", soft: "#e2efee", text: "#18292a" },
    ],
    font: "sans",
    products: [
      { title: "Daily Barrier Serum", desc: "A lightweight serum with ceramides and niacinamide that helps skin hold on to moisture all day.", price: [34, 58], variants: ["30 ml", "50 ml"] },
      { title: "Overnight Repair Cream", desc: "Rich but fast-absorbing night cream with squalane and peptides. Wake up to calmer, softer skin.", price: [42, 68], variants: ["50 ml"] },
      { title: "Gentle Gel Cleanser", desc: "A low-foam, pH-balanced cleanser that lifts makeup and SPF without the tight feeling.", price: [22, 32], variants: ["150 ml", "300 ml"] },
      { title: "Mineral Sun Fluid SPF 50", desc: "Sheer zinc-based protection that leaves no white cast and sits well under makeup.", price: [28, 39], variants: ["50 ml"] },
    ],
    heroes: ["Skincare that keeps it simple", "Fewer steps, better skin", "Your routine, minus the guesswork"],
  },
  clothing: {
    keywords: ["clothing", "apparel", "fashion", "shirt", "tee", "dress", "streetwear", "hoodie", "jacket", "denim", "wear", "knit"],
    nameA: ["North", "Loom", "Field", "Common", "Arc", "Tide", "Thread"],
    nameB: ["& Co", "Wear", "Label", "Outfitters", "Studio", "Garments"],
    palettes: [
      { accent: "#111827", onAccent: "#ffffff", bg: "#ffffff", soft: "#f3f4f6", text: "#111827" },
      { accent: "#1e3a5f", onAccent: "#ffffff", bg: "#fafaf8", soft: "#ebeee9", text: "#162231" },
    ],
    font: "sans",
    products: [
      { title: "Heavyweight Everyday Tee", desc: "Garment-dyed 260gsm cotton with a boxy fit and a collar that keeps its shape.", price: [32, 48], variants: ["S", "M", "L", "XL"] },
      { title: "Brushed Fleece Hoodie", desc: "Loopback cotton fleece, brushed inside for warmth, with a double-layer hood.", price: [78, 110], variants: ["S", "M", "L", "XL"] },
      { title: "Relaxed Canvas Trousers", desc: "Sturdy organic canvas with a relaxed leg, a gusseted crotch and deep pockets.", price: [88, 120], variants: ["28", "30", "32", "34"] },
      { title: "Merino Rib Beanie", desc: "Soft, itch-free merino in a classic rib knit. Fits most heads.", price: [26, 38], variants: ["One size"] },
    ],
    heroes: ["Clothes for every day, built for years", "Wardrobe staples, done right", "Less, but better made"],
  },
  coffee: {
    keywords: ["coffee", "espresso", "roast", "roaster", "tea", "cafe", "beans", "matcha", "brew"],
    nameA: ["Early", "Copper", "Ridge", "Daybreak", "Kettle", "Ember"],
    nameB: ["Roasters", "Coffee Co", "Beans", "Roastery", "Brew Supply"],
    palettes: [
      { accent: "#8a3b12", onAccent: "#ffffff", bg: "#fdf9f4", soft: "#f2e6d8", text: "#2a1a10" },
      { accent: "#14532d", onAccent: "#ffffff", bg: "#fbfaf6", soft: "#e9ecdf", text: "#1a2117" },
    ],
    font: "serif",
    products: [
      { title: "House Blend Whole Beans", desc: "Chocolate, toasted hazelnut and a little dried cherry. A forgiving blend for espresso or filter.", price: [16, 22], variants: ["250 g", "1 kg"] },
      { title: "Single Origin: Highland Washed", desc: "A bright, tea-like coffee with notes of bergamot and stone fruit. Roasted light for filter.", price: [19, 26], variants: ["250 g", "1 kg"] },
      { title: "Decaf Sugar Cane Process", desc: "Naturally decaffeinated and genuinely tasty: caramel, red apple and a round body.", price: [17, 23], variants: ["250 g"] },
      { title: "Ceramic Pour-over Dripper", desc: "A glazed ceramic cone that holds heat for an even extraction. Fits standard filters.", price: [28, 38], variants: ["White", "Black"] },
    ],
    heroes: ["Freshly roasted, shipped the same week", "Better mornings start here", "Coffee worth getting up for"],
  },
  jewelry: {
    keywords: ["jewelry", "jewellery", "ring", "necklace", "earring", "bracelet", "gold", "silver", "gem", "watch"],
    nameA: ["Lune", "Opal", "Vesper", "Sol", "Gilt", "Nova"],
    nameB: ["Atelier", "Jewels", "Fine", "& Stone", "Studio"],
    palettes: [
      { accent: "#6b5a2e", onAccent: "#ffffff", bg: "#fdfcf8", soft: "#f2eee1", text: "#24201a" },
      { accent: "#3b2f5e", onAccent: "#ffffff", bg: "#fbfafd", soft: "#ebe8f3", text: "#1d1a29" },
    ],
    font: "serif",
    products: [
      { title: "Fine Chain Necklace", desc: "A delicate 14k gold-filled chain that layers beautifully and is safe to wear every day.", price: [58, 96], variants: ["40 cm", "45 cm"] },
      { title: "Sculpted Signet Ring", desc: "Cast in recycled sterling silver with a softly domed face. Ready to engrave.", price: [72, 120], variants: ["5", "6", "7", "8"] },
      { title: "Freshwater Pearl Huggies", desc: "Small hoops finished with a single baroque pearl. No two pairs are quite alike.", price: [48, 74], variants: ["Gold", "Silver"] },
    ],
    heroes: ["Pieces to keep, not just wear", "Everyday jewellery, made to last", "Small details, worn daily"],
  },
  pet: {
    keywords: ["pet", "dog", "cat", "puppy", "kitten", "pets", "leash", "collar"],
    nameA: ["Good", "Happy", "Wag", "Paw", "Fetch", "Buddy"],
    nameB: ["Boy Supply", "Tails", "& Co", "Goods", "Club"],
    palettes: [
      { accent: "#c2410c", onAccent: "#ffffff", bg: "#fffaf5", soft: "#fdebdc", text: "#2b1a10" },
      { accent: "#1d4ed8", onAccent: "#ffffff", bg: "#f8fafc", soft: "#e2e8f5", text: "#111a2e" },
    ],
    font: "sans",
    products: [
      { title: "Rope Tug Toy", desc: "Tough, washable cotton rope for tug-of-war and solo chewing. Ages well with drool.", price: [14, 22], variants: ["Small", "Large"] },
      { title: "Padded Walk Harness", desc: "No-pull front clip, soft padding and reflective stitching for evening walks.", price: [38, 54], variants: ["S", "M", "L"] },
      { title: "Calming Donut Bed", desc: "A raised-rim bed with a removable, machine-washable cover. Built for serious naps.", price: [59, 89], variants: ["Small", "Medium", "Large"] },
    ],
    heroes: ["Good stuff for good pets", "Made for walks, naps and zoomies", "Everything your best friend needs"],
  },
  general: {
    keywords: [],
    nameA: ["Bright", "Maple", "Kind", "True", "Little", "Blue"],
    nameB: ["Market", "Goods", "Shop", "Supply", "Co"],
    palettes: [
      { accent: "#1f5f8b", onAccent: "#ffffff", bg: "#ffffff", soft: "#e6eef5", text: "#162330" },
      { accent: "#0f766e", onAccent: "#ffffff", bg: "#fbfcfc", soft: "#e3f1ef", text: "#132322" },
    ],
    font: "sans",
    products: [
      { title: "Signature Starter Kit", desc: "Everything you need to get started, in one thoughtfully packed box.", price: [39, 69], variants: ["Standard", "Deluxe"] },
      { title: "Everyday Essential", desc: "Our best-seller: simple, reliable and designed around how people actually use it.", price: [24, 44], variants: ["One size"] },
      { title: "Limited Edition Drop", desc: "A small-run release in a colourway we will not repeat.", price: [49, 79], variants: ["Edition A", "Edition B"] },
    ],
    heroes: ["Thoughtfully made, fairly priced", "The good stuff, all in one place", "Made with care, shipped with speed"],
  },
};

export const CATEGORY_CHIPS: { label: string; prompt: string; category: Category }[] = [
  { label: "Homeware", category: "homeware", prompt: "A calm homeware shop selling handmade ceramics and linen, earthy and minimal" },
  { label: "Skincare", category: "skincare", prompt: "A clean skincare brand with a short, science-backed routine and a soft pink look" },
  { label: "Clothing", category: "clothing", prompt: "A streetwear label making heavyweight basics in muted colours" },
  { label: "Coffee", category: "coffee", prompt: "A small-batch coffee roaster with subscriptions and a warm, cosy feel" },
  { label: "Jewellery", category: "jewelry", prompt: "Dainty everyday gold jewellery, elegant and timeless" },
  { label: "Pet", category: "pet", prompt: "Playful, durable dog accessories in bright colours" },
];

export function detectCategory(prompt: string): Category {
  const p = prompt.toLowerCase();
  let best: Category = "general";
  let bestScore = 0;
  for (const [cat, t] of Object.entries(TEMPLATES) as [Category, Template][]) {
    const score = t.keywords.filter((k) => p.includes(k)).length;
    if (score > bestScore) {
      best = cat;
      bestScore = score;
    }
  }
  return best;
}

// colour words in the prompt tint the palette
const COLOUR_WORDS: Record<string, string> = {
  pink: "#be185d", rose: "#be185d", red: "#b91c1c", orange: "#c2410c", yellow: "#a16207",
  gold: "#8a6d1f", green: "#15803d", sage: "#4d6b52", olive: "#5c6324", teal: "#0f766e",
  blue: "#1d4ed8", navy: "#1e3a8a", purple: "#6d28d9", lavender: "#7c5cbf", black: "#111111",
  brown: "#7c4a2d", earthy: "#7c4a2d", terracotta: "#b0532f",
};

function slugify(s: string) {
  return s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}


export type GenerationStep = { label: string; detail: string };

export function generationSteps(category: Category): GenerationStep[] {
  return [
    { label: "Reading your brief", detail: `Looks like a ${category === "general" ? "general goods" : category} store` },
    { label: "Naming the brand", detail: "Shortlisting names and checking they read well" },
    { label: "Choosing colours and type", detail: "Building a palette from your description" },
    { label: "Creating products", detail: "Writing titles, descriptions, prices and variants" },
    { label: "Generating product imagery", detail: "Rendering a consistent set of product shots" },
    { label: "Setting up the store", detail: "Reviews, email flows, a welcome offer and checkout" },
  ];
}

/** Turn a one-sentence brief into a complete store. */
export function generateStore(prompt: string, forced?: Category, existingSlugs: string[] = []): Store {
  const category = forced ?? detectCategory(prompt);
  const t = TEMPLATES[category];
  const seed = hash(prompt + category);
  const r = rng(seed);

  const name = `${pick(r, t.nameA)} ${pick(r, t.nameB)}`.replace(" & ", " & ");
  let slug = slugify(name);
  let n = 2;
  while (existingSlugs.includes(slug)) slug = `${slugify(name)}-${n++}`;

  const palette = { ...pick(r, t.palettes) };
  const lower = prompt.toLowerCase();
  for (const [word, hex] of Object.entries(COLOUR_WORDS)) {
    if (lower.includes(word)) {
      palette.accent = hex;
      break;
    }
  }
  const dark = /\b(dark|moody|night|black)\b/.test(lower);
  if (dark) {
    palette.bg = "#141312";
    palette.soft = "#24221f";
    palette.text = "#f4f1ec";
  }
  const font = /\b(modern|minimal|clean|tech)\b/.test(lower) ? "sans" : /\b(elegant|classic|luxury|vintage)\b/.test(lower) ? "serif" : t.font;

  const products: Product[] = t.products.slice(0, 3 + (r() > 0.5 ? 1 : 0)).map((p, i) => {
    const price = Math.round(p.price[0] + r() * (p.price[1] - p.price[0]));
    return {
      id: uid(),
      title: p.title,
      description: p.desc,
      priceCents: price * 100,
      compareAtCents: undefined, // no invented "was" prices: only show a sale price the item really sold at
      variants: p.variants,
      stock: 8 + Math.floor(r() * 60),
      status: "active",
      seoTitle: `${p.title} | ${name}`,
      art: Math.floor(r() * 1e6),
    };
  });

  // No invented reviews: on a real store fake reviews are illegal (e.g. the US FTC rule of 2024).
  // Reviews start empty and come only from real customers.
  const reviews: Review[] = [];

  const tagline = pick(r, t.heroes);
  return withDefaults({
    slug,
    name,
    tagline,
    prompt,
    category,
    palette,
    font,
    heroHeadline: tagline,
    heroSub: heroSubFrom(prompt, category),
    apps: { reviews: true, popup: true, email: true, loyalty: false },
    popup: { headline: "Take 10% off your first order", body: "Join the list for early access to new drops and the occasional good email.", code: "WELCOME10", percent: 10 },
    discounts: [{ code: "WELCOME10", percent: 10 }],
    freeShippingCents: 7500,
    shippingCents: 595,
    products,
    reviews,
    orders: [],
    flows: defaultFlows(name),
    loyalty: {},
    experiments: [],
    published: false,
    createdAt: new Date().toISOString(),
  });
}

function heroSubFrom(prompt: string, category: Category) {
  const trimmed = prompt.trim().replace(/\.$/, "");
  if (trimmed.length > 20 && trimmed.length < 140) {
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1) + ". Free shipping on orders over $75.";
  }
  return `A small, carefully chosen range of ${category === "general" ? "goods" : category}. Free shipping on orders over $75.`;
}

export function defaultFlows(name: string): EmailFlow[] {
  return [
    { kind: "welcome", enabled: true, delayMinutes: 0, subject: `Welcome to ${name}`, body: `Thanks for joining us. Here's 10% off your first order with code WELCOME10 — no rush, it doesn't expire.` },
    { kind: "abandoned_checkout", enabled: true, delayMinutes: 60, subject: "You left something behind", body: "Your cart is saved and waiting. Finish checking out whenever you're ready — we've held your items for 24 hours." },
    { kind: "post_purchase", enabled: true, delayMinutes: 1440, subject: "Your order is on its way", body: "Thanks again for your order. Here's how to get the most out of what you bought, plus a few things that pair well with it." },
    { kind: "review_request", enabled: false, delayMinutes: 10080, subject: "How did we do?", body: "You've had your order for a week. Would you leave a quick review? It takes 30 seconds and helps a small business a lot." },
  ];
}

/** AI product draft from just a name (dashboard "Draft with AI"). */
export function draftProduct(title: string, store: Store): Product {
  const r = rng(hash(title));
  const t = TEMPLATES[store.category];
  const base = pick(r, t.products);
  const clean = title.trim() || base.title;
  return {
    id: uid(),
    title: clean,
    description: `${clean} — ${base.desc.charAt(0).toLowerCase()}${base.desc.slice(1)}`,
    priceCents: Math.round(base.price[0] + r() * (base.price[1] - base.price[0])) * 100,
    variants: base.variants,
    stock: 25,
    status: "active",
    seoTitle: `${clean} | ${store.name}`,
    art: Math.floor(r() * 1e6),
  };
}

// ---------- assistant ----------
export type AssistantAction = {
  label: string;
  apply: (s: Store) => Store;
};
export type AssistantReply = { text: string; action?: AssistantAction };

const money = (c: number) => `$${(c / 100).toFixed(2)}`;

export function assistant(input: string, store: Store, page: string): AssistantReply {
  const q = input.toLowerCase();
  const paidOrders = store.orders.filter((o) => o.status !== "refunded");
  const revenue = paidOrders.reduce((a, o) => a + o.totalCents, 0);

  const pct = Number((q.match(/(\d{1,2})\s*%/) || [])[1] || 15);

  if (/(a\/b|\bab test|split test|experiment|\btest (a|the|my|our|new|another)\b)/.test(q)) {
    const running = (store.experiments ?? []).filter((e) => e.status === "running");
    const options = suggestHeadlines(store);
    const alt = options[hash(q) % Math.max(1, options.length)];
    if (running.some((e) => e.kind === "headline") || !alt) {
      return {
        text: `You have ${running.length} experiment${running.length === 1 ? "" : "s"} running. Open **Experiments** in the sidebar to see results, or start a price, free-shipping or popup test there.`,
      };
    }
    return {
      text: `I'd start with the homepage headline — every visitor sees it. Test **"${store.heroHeadline}"** (A) against **"${alt}"** (B), split 50/50. I'll roll out the winner once I'm 95% sure.`,
      action: {
        label: "Start headline test",
        apply: (s) => ({
          ...s,
          experiments: [
            {
              id: uid(),
              name: "Homepage headline",
              kind: "headline",
              status: "running",
              autoPromote: true,
              minSample: 100,
              variants: [
                { id: "a", value: s.heroHeadline, views: 0, conversions: 0, revenueCents: 0, simulatedViews: 0 },
                { id: "b", value: alt, views: 0, conversions: 0, revenueCents: 0, simulatedViews: 0 },
              ],
              createdAt: new Date().toISOString(),
            },
            ...(s.experiments ?? []),
          ],
        }),
      },
    };
  }

  if (/(discount|promo|coupon|sale|code)/.test(q)) {
    const code = `SAVE${pct}`;
    return {
      text: `I can create a ${pct}% discount code **${code}** that works at checkout, and feature it in the welcome popup. Want me to set it up?`,
      action: {
        label: `Create ${code}`,
        apply: (s) => ({
          ...s,
          discounts: [...s.discounts.filter((d) => d.code !== code), { code, percent: pct }],
          popup: { ...s.popup, code, percent: pct, headline: `Take ${pct}% off your first order` },
        }),
      },
    };
  }
  if (/(popup|pop-up|newsletter|signup form)/.test(q)) {
    return {
      text: store.apps.popup
        ? `Your popup is live: "${store.popup.headline}" with code ${store.popup.code}. I can turn it off if it's getting in the way.`
        : "Your popup is off. I'd suggest turning it on with a 10% first-order offer — it's the cheapest way to grow your email list.",
      action: { label: store.apps.popup ? "Turn popup off" : "Turn popup on", apply: (s) => ({ ...s, apps: { ...s.apps, popup: !s.apps.popup } }) },
    };
  }
  if (/(loyalty|points|reward)/.test(q)) {
    return {
      text: "Loyalty gives shoppers 1 point per dollar, shown on their order confirmation. It encourages a second purchase.",
      action: { label: store.apps.loyalty ? "Turn loyalty off" : "Turn loyalty on", apply: (s) => ({ ...s, apps: { ...s.apps, loyalty: !s.apps.loyalty } }) },
    };
  }
  if (/(add|create|new).*(product)/.test(q) || /^add /.test(q)) {
    const name = input.replace(/.*?(add|create|new)\s+(a\s+)?(product\s+)?(called\s+)?/i, "").replace(/["']/g, "").trim();
    const p = draftProduct(name && name.length < 60 ? titleCase(name) : "", store);
    return {
      text: `Here's a draft: **${p.title}** at ${money(p.priceCents)}, with variants ${p.variants.join(", ")} and 25 in stock.\n\n${p.description}`,
      action: { label: "Add to catalog", apply: (s) => ({ ...s, products: [p, ...s.products] }) },
    };
  }
  if (/(darker|dark mode|moody)/.test(q)) {
    return {
      text: "I'll switch the storefront to a dark background with light text and keep your accent colour.",
      action: { label: "Apply dark theme", apply: (s) => ({ ...s, palette: { ...s.palette, bg: "#141312", soft: "#24221f", text: "#f4f1ec" } }) },
    };
  }
  if (/(lighter|light mode|brighter)/.test(q)) {
    return {
      text: "I'll switch the storefront to a light background.",
      action: { label: "Apply light theme", apply: (s) => ({ ...s, palette: { ...s.palette, bg: "#ffffff", soft: "#f4f4f2", text: "#1c1917" } }) },
    };
  }
  for (const [word, hex] of Object.entries(COLOUR_WORDS)) {
    if (q.includes(word)) {
      return {
        text: `I'll make ${word} the accent colour for buttons, links and highlights across the storefront.`,
        action: { label: `Use ${word}`, apply: (s) => ({ ...s, palette: { ...s.palette, accent: hex } }) },
      };
    }
  }
  if (/(headline|hero|homepage|copy|rewrite)/.test(q)) {
    const options = TEMPLATES[store.category].heroes.filter((h) => h !== store.heroHeadline);
    const next = options[hash(q) % options.length] ?? store.heroHeadline;
    return {
      text: `New homepage headline suggestion: **"${next}"**. I'll keep the subheading as is.`,
      action: { label: "Use this headline", apply: (s) => ({ ...s, heroHeadline: next }) },
    };
  }
  if (/(stock|inventory|sold out|restock)/.test(q)) {
    const low = store.products.filter((p) => p.stock < 10);
    return {
      text: low.length
        ? `${low.length} product${low.length > 1 ? "s are" : " is"} running low: ${low.map((p) => `${p.title} (${p.stock})`).join(", ")}. I can restock each to 50 units.`
        : "Nothing is running low. Every product has 10 or more in stock.",
      action: low.length ? { label: "Restock to 50", apply: (s) => ({ ...s, products: s.products.map((p) => (p.stock < 10 ? { ...p, stock: 50 } : p)) }) } : undefined,
    };
  }
  const refund = q.match(/refund.*?#?(\d{3,5})/);
  if (refund) {
    const num = Number(refund[1]);
    const order = store.orders.find((o) => o.number === num);
    if (!order) return { text: `I couldn't find order #${num}. Check the Orders page for the right number.` };
    if (order.status === "refunded") return { text: `Order #${num} has already been refunded.` };
    return {
      text: `Order #${num} from ${order.customer.name} was ${money(order.totalCents)}. Refunding returns the money to their card and puts the items back in stock.`,
      action: { label: `Refund #${num}`, apply: (s) => refundOrder(s, order.id) },
    };
  }
  if (/(seo|google|search|meta)/.test(q)) {
    return {
      text: `I've drafted SEO titles for ${store.products.length} products in the form "Product — what it is | ${store.name}". Search engines prefer descriptive titles under 60 characters.`,
      action: {
        label: "Apply SEO titles",
        apply: (s) => ({ ...s, products: s.products.map((p) => ({ ...p, seoTitle: `${p.title} — ${s.category === "general" ? "shop" : s.category} | ${s.name}`.slice(0, 70) })) }),
      },
    };
  }
  if (/(email|flow|newsletter|campaign)/.test(q)) {
    const on = store.flows.filter((f) => f.enabled).length;
    return { text: `You have ${on} of ${store.flows.length} email flows switched on. The abandoned-checkout email goes out an hour after someone leaves checkout — it usually earns the most. Open Email in the sidebar to preview or edit them.` };
  }
  if (/(sales|revenue|how.*(doing|going)|orders|today|performance|report)/.test(q)) {
    if (!paidOrders.length) return { text: "No orders yet. Share your store link or turn on the welcome popup to start building a list. A first order usually comes from friends and family — that's normal." };
    const aov = Math.round(revenue / paidOrders.length);
    const top = topProduct(store);
    return { text: `You've taken **${paidOrders.length} orders** for **${money(revenue)}** (average ${money(aov)}).${top ? ` Best seller: ${top}.` : ""} ${store.orders.filter((o) => o.status === "paid").length} still need fulfilling.` };
  }
  if (/(publish|launch|go live)/.test(q)) {
    return {
      text: store.published ? "Your store is already live." : "Everything's in place. Publishing makes your storefront visible to shoppers.",
      action: store.published ? undefined : { label: "Publish store", apply: (s) => ({ ...s, published: true }) },
    };
  }
  return {
    text: `I'm your store assistant (demo). On the ${page} page I can help with things like:\n• "How are sales going?"\n• "Create a 20% discount"\n• "Add a product called Travel Mug"\n• "Make the accent green" or "Go darker"\n• "What's low on stock?"\n• "Refund order #1002"\n• "Write SEO titles"\n• "Run an A/B test"`,
  };
}

/** Alternative homepage headlines for an A/B test. */
export function suggestHeadlines(store: Store): string[] {
  const extra = [
    `${store.products[0]?.title ?? "Our best-seller"}, made to last`,
    `Free shipping over $${Math.round(store.freeShippingCents / 100)}. Shop ${store.name}.`,
    "Small batch. Big care. Shipped this week.",
  ];
  return [...TEMPLATES[store.category].heroes, ...extra].filter((h) => h !== store.heroHeadline);
}

function titleCase(s: string) {
  return s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));
}

function topProduct(store: Store) {
  const counts = new Map<string, number>();
  store.orders.filter((o) => o.status !== "refunded").forEach((o) => o.items.forEach((i) => counts.set(i.title, (counts.get(i.title) || 0) + i.qty)));
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return top ? `${top[0]} (${top[1]} sold)` : null;
}

export function refundOrder(s: Store, orderId: string): Store {
  const order = s.orders.find((o) => o.id === orderId);
  if (!order || order.status === "refunded") return s;
  return {
    ...s,
    orders: s.orders.map((o) => (o.id === orderId ? { ...o, status: "refunded" } : o)),
    products: s.products.map((p) => {
      const qty = order.items.filter((i) => i.productId === p.id).reduce((a, i) => a + i.qty, 0);
      return qty ? { ...p, stock: p.stock + qty } : p;
    }),
  };
}
