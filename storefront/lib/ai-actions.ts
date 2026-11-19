/**
 * The contract between the owner app and a real AI model.
 * The model replies in a fixed JSON shape (structured output): a message, plus at most one proposed action
 * from a fixed menu. The app turns that action into a change the owner approves with one click —
 * the model can never change the store directly.
 */
import { draftProduct, refundOrder, uid } from "./ai";
import type { Apps, Store } from "./types";
import type { AssistantAction } from "./ai";

const nullable = (type: string) => ({ anyOf: [{ type }, { type: "null" }] });

export const ASSISTANT_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string", description: "Short, plain answer to the owner (markdown **bold** allowed)." },
    action: {
      anyOf: [
        { type: "null" },
        {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["create_discount", "add_product", "set_accent", "set_theme", "set_headline", "restock_low", "toggle_app", "refund_order", "publish", "start_headline_test"],
            },
            percent: nullable("integer"),
            title: nullable("string"),
            hex: nullable("string"),
            mode: nullable("string"),
            text: nullable("string"),
            app: nullable("string"),
            on: nullable("boolean"),
            number: nullable("integer"),
          },
          required: ["type", "percent", "title", "hex", "mode", "text", "app", "on", "number"],
          additionalProperties: false,
        },
      ],
    },
  },
  required: ["reply", "action"],
  additionalProperties: false,
} as const;

export const GENERATE_SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" },
    tagline: { type: "string" },
    heroHeadline: { type: "string" },
    heroSub: { type: "string" },
    accentHex: { type: "string", description: "Brand accent colour as #rrggbb, dark enough for white text." },
    products: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          priceDollars: { type: "number" },
          variants: { type: "array", items: { type: "string" } },
          photoIndex: { ...nullable("integer"), description: "Which uploaded photo (0-based) shows this product, or null." },
        },
        required: ["title", "description", "priceDollars", "variants", "photoIndex"],
        additionalProperties: false,
      },
    },
    storyTitle: { type: "string" },
    storyBody: { type: "string" },
    announcement: { type: "string", description: "One short line for the top bar, e.g. a shipping promise." },
    faqs: {
      type: "array",
      items: { type: "object", properties: { q: { type: "string" }, a: { type: "string" } }, required: ["q", "a"], additionalProperties: false },
    },
  },
  required: ["name", "tagline", "heroHeadline", "heroSub", "accentHex", "products", "storyTitle", "storyBody", "announcement", "faqs"],
  additionalProperties: false,
} as const;

export type AiAction = {
  type: "create_discount" | "add_product" | "set_accent" | "set_theme" | "set_headline" | "restock_low" | "toggle_app" | "refund_order" | "publish" | "start_headline_test";
  percent: number | null;
  title: string | null;
  hex: string | null;
  mode: string | null;
  text: string | null;
  app: string | null;
  on: boolean | null;
  number: number | null;
};
export type AssistantReplyJson = { reply: string; action: AiAction | null };

export type GeneratedJson = {
  name: string;
  tagline: string;
  heroHeadline: string;
  heroSub: string;
  accentHex: string;
  products: { title: string; description: string; priceDollars: number; variants: string[]; photoIndex: number | null }[];
  storyTitle: string;
  storyBody: string;
  announcement: string;
  faqs: { q: string; a: string }[];
};

/** What the model is told about the store. No customer names, emails or addresses are sent. */
export function storeContext(s: Store) {
  const live = s.orders.filter((o) => o.status !== "refunded");
  return {
    name: s.name,
    category: s.category,
    published: s.published,
    headline: s.heroHeadline,
    accent: s.palette.accent,
    apps: s.apps,
    discounts: s.discounts,
    freeShippingOverCents: s.freeShippingCents,
    products: s.products.map((p) => ({ title: p.title, priceCents: p.priceCents, stock: p.stock, status: p.status })),
    orders: { count: live.length, revenueCents: live.reduce((a, o) => a + o.totalCents, 0), toShip: s.orders.filter((o) => o.status === "paid").length },
    recentOrders: s.orders.slice(0, 15).map((o) => ({ number: o.number, status: o.status, totalCents: o.totalCents, items: o.items.map((i) => `${i.qty}x ${i.title}`) })),
    subscribers: s.subscribers.length,
    runningExperiments: s.experiments.filter((e) => e.status === "running").map((e) => e.name),
  };
}

export const ASSISTANT_SYSTEM = `You are the assistant inside the owner's private store admin. Be brief, concrete and friendly; use numbers from the store data.
You may propose at most ONE change by filling "action" (the owner must approve it); otherwise set action to null. Use null for unused action fields.
Actions:
- create_discount: percent (1-90). Creates code SAVE<percent> and puts it in the welcome popup.
- add_product: title (a new product name; details are drafted for the owner).
- set_accent: hex (#rrggbb, dark enough for white text).
- set_theme: mode ("dark" or "light").
- set_headline: text (new homepage headline, under 60 characters).
- restock_low: sets every product with fewer than 10 in stock to 50.
- toggle_app: app ("reviews", "popup", "email" or "loyalty") and on (true/false).
- refund_order: number (an existing order number).
- publish: makes the storefront visible.
- start_headline_test: text (headline B for an A/B test against the current headline).
Never invent orders, products or numbers that aren't in the data. If asked for something you can't do with these actions, say so.`;

export const GENERATE_SYSTEM = `You build complete small online stores for a real owner who will sell real products.
Return: a brand name (2-3 words; use the owner's brand name if they give one; never an existing famous brand), a short tagline,
a homepage headline (under 50 characters) and subheading, an accent colour (#rrggbb, dark enough for white text, taken from the
products' look when photos are given), products, a short brand story, a one-line announcement bar, and 3-5 shopper FAQs.
PHOTOS: if product photos are attached, make exactly one product per photo and set photoIndex to that photo's position (0-based).
Describe only what you can see or what the owner told you: material, colour, size, use. If the owner gives names, prices, sizes or
variants, use them exactly. If there are no photos, create 3-4 fitting products and set photoIndex to null.
Prices: realistic US dollars for the product and its quality. Variants: real options (sizes, colours) or a single "Standard".
FAQs: shipping, returns, care/usage, sizing — answer with sensible defaults the owner can edit (30-day returns, ships in 1-3 business days).
Write fresh, plain, honest copy. No invented reviews, awards, statistics, certifications, discounts or "was" prices; no medical,
health or legal claims.`;

const APPS: (keyof Apps)[] = ["reviews", "popup", "email", "loyalty"];
const HEX = /^#[0-9a-fA-F]{6}$/;

/** Turn the model's proposal into something the owner can approve. Invalid proposals are dropped. */
export function toAssistantAction(a: AiAction | null, store: Store): AssistantAction | undefined {
  if (!a) return undefined;
  switch (a.type) {
    case "create_discount": {
      const pct = Math.round(a.percent ?? 0);
      if (pct < 1 || pct > 90) return undefined;
      const code = `SAVE${pct}`;
      return {
        label: `Create ${code}`,
        apply: (s) => ({ ...s, discounts: [...s.discounts.filter((d) => d.code !== code), { code, percent: pct }], popup: { ...s.popup, code, percent: pct, headline: `Take ${pct}% off your first order` } }),
      };
    }
    case "add_product": {
      const title = (a.title ?? "").trim().slice(0, 80);
      if (!title) return undefined;
      const p = draftProduct(title, store);
      return { label: `Add “${p.title}”`, apply: (s) => ({ ...s, products: [p, ...s.products] }) };
    }
    case "set_accent":
      return a.hex && HEX.test(a.hex) ? { label: `Use ${a.hex}`, apply: (s) => ({ ...s, palette: { ...s.palette, accent: a.hex!, onAccent: "#ffffff" } }) } : undefined;
    case "set_theme":
      if (a.mode === "dark") return { label: "Apply dark theme", apply: (s) => ({ ...s, palette: { ...s.palette, bg: "#141312", soft: "#24221f", text: "#f4f1ec" } }) };
      if (a.mode === "light") return { label: "Apply light theme", apply: (s) => ({ ...s, palette: { ...s.palette, bg: "#ffffff", soft: "#f4f4f2", text: "#1c1917" } }) };
      return undefined;
    case "set_headline": {
      const t = (a.text ?? "").trim().slice(0, 80);
      return t ? { label: "Use this headline", apply: (s) => ({ ...s, heroHeadline: t }) } : undefined;
    }
    case "restock_low":
      return { label: "Restock to 50", apply: (s) => ({ ...s, products: s.products.map((p) => (p.stock < 10 ? { ...p, stock: 50 } : p)) }) };
    case "toggle_app": {
      const app = a.app as keyof Apps;
      if (!APPS.includes(app) || typeof a.on !== "boolean") return undefined;
      return { label: `${a.on ? "Turn on" : "Turn off"} ${app}`, apply: (s) => ({ ...s, apps: { ...s.apps, [app]: a.on! } }) };
    }
    case "refund_order": {
      const o = store.orders.find((x) => x.number === a.number);
      return o && o.status !== "refunded" ? { label: `Refund #${o.number}`, apply: (s) => refundOrder(s, o.id) } : undefined;
    }
    case "publish":
      return store.published ? undefined : { label: "Publish store", apply: (s) => ({ ...s, published: true }) };
    case "start_headline_test": {
      const t = (a.text ?? "").trim().slice(0, 80);
      if (!t || store.experiments.some((e) => e.status === "running" && e.kind === "headline")) return undefined;
      return {
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
                { id: "b", value: t, views: 0, conversions: 0, revenueCents: 0, simulatedViews: 0 },
              ],
              createdAt: new Date().toISOString(),
            },
            ...s.experiments,
          ],
        }),
      };
    }
  }
}

/** Merge an AI-written store into the locally generated one (keeps ids, artwork, flows, defaults). */
export function applyGenerated(base: Store, g: GeneratedJson, photoIds: string[] = []): Store {
  const used = new Set<number>();
  let list = g.products.slice(0, Math.max(6, photoIds.length));
  // every uploaded photo gets a product, even if the model skipped one
  photoIds.forEach((_, idx) => {
    if (!list.some((p) => p.photoIndex === idx)) list.push({ title: `Product ${idx + 1}`, description: "", priceDollars: 0, variants: [], photoIndex: idx });
  });
  if (photoIds.length) list = list.filter((p) => p.photoIndex !== null && p.photoIndex >= 0 && p.photoIndex < photoIds.length && !used.has(p.photoIndex) && (used.add(p.photoIndex), true));
  const products = list.map((p, i) => {
    const b = base.products[i % base.products.length];
    const priceCents = Math.max(100, Math.round(Number(p.priceDollars) * 100) || b.priceCents);
    return {
      ...b,
      id: i < base.products.length ? b.id : uid(),
      title: p.title.slice(0, 80) || b.title,
      description: p.description.slice(0, 600) || b.description,
      priceCents,
      compareAtCents: undefined,
      variants: (p.variants || []).map((v) => String(v).slice(0, 30)).slice(0, 6),
      seoTitle: `${p.title} | ${g.name}`.slice(0, 70),
      art: b.art + i * 7919,
      image: photoIds.length && p.photoIndex !== null ? photoIds[p.photoIndex] : undefined,
    };
  });
  const keepIds = new Set(products.map((p) => p.id));
  return {
    ...base,
    name: g.name.slice(0, 60) || base.name,
    tagline: g.tagline.slice(0, 120) || base.tagline,
    heroHeadline: g.heroHeadline.slice(0, 80) || base.heroHeadline,
    heroSub: g.heroSub.slice(0, 240) || base.heroSub,
    palette: HEX.test(g.accentHex) ? { ...base.palette, accent: g.accentHex, onAccent: "#ffffff" } : base.palette,
    products,
    reviews: base.reviews.filter((r) => keepIds.has(r.productId)),
    story: { title: g.storyTitle.slice(0, 80) || base.story.title, body: g.storyBody.slice(0, 1200) || base.story.body },
    announcement: (g.announcement || base.announcement).slice(0, 120),
    faqs: g.faqs?.length ? g.faqs.slice(0, 8).map((f) => ({ q: f.q.slice(0, 140), a: f.a.slice(0, 600) })) : base.faqs,
    sections: g.faqs?.length ? base.sections.map((s) => (s.id === "faq" ? { ...s, enabled: true } : s)) : base.sections,
  };
}
