/**
 * The AI team. Each specialist is the same underlying model (Claude or GPT) given:
 *  - a job description (role)
 *  - the playbook sections for that job
 *  - a worked example of excellent output
 *  - this store's real data + the store's memory (lessons)
 *  - a strict output format (JSON schema) so results can be checked and applied
 * Every specialist also has a free rule-based fallback for when no AI model is selected.
 * Pure module: used by the browser (fallbacks, labels) and the server (prompts).
 */
import type { EmailFlowKind, ExperimentKind, Lesson, Store } from "../types";
import { playbook, type PlaybookSection } from "./playbook";

export type SpecialistId = "product_copy" | "pricing" | "email" | "experiments" | "seo" | "support";

const nullable = (type: string) => ({ anyOf: [{ type }, { type: "null" }] });
const obj = (properties: Record<string, unknown>) => ({ type: "object", properties, required: Object.keys(properties), additionalProperties: false });
const str = { type: "string" };
const strArr = { type: "array", items: { type: "string" } };

// ---------- context: what each specialist is told about the store ----------
export type ProductFacts = {
  id: string;
  title: string;
  description: string;
  bullets: string[];
  priceCents: number;
  stock: number;
  status: string;
  variants: string[];
  unitsSold: number;
  revenueCents: number;
  hasPhoto: boolean;
  seoTitle: string;
  metaDescription: string;
};

export type Context = {
  store: { name: string; category: string; headline: string; heroSub: string; story: string; tagline: string; freeShippingOverCents: number; shippingCents: number; published: boolean };
  products: ProductFacts[];
  sales: { orders: number; revenueCents: number; averageOrderCents: number; refunded: number; last30DaysOrders: number };
  discounts: { code: string; percent: number }[];
  experiments: { name: string; kind: ExperimentKind; status: string; winner?: string; a: string; b: string; views: number; conversions: number[] }[];
  flows: { kind: EmailFlowKind; enabled: boolean; subject: string; body: string }[];
  lessons: { source: Lesson["source"]; text: string }[];
  apps: Store["apps"];
};

export function buildContext(s: Store): Context {
  const live = s.orders.filter((o) => o.status !== "refunded");
  const since = Date.now() - 30 * 86_400_000;
  const sold = new Map<string, { units: number; cents: number }>();
  live.forEach((o) => o.items.forEach((i) => {
    const e = sold.get(i.productId) ?? { units: 0, cents: 0 };
    sold.set(i.productId, { units: e.units + i.qty, cents: e.cents + i.qty * i.unitCents });
  }));
  const fmtVal = (kind: ExperimentKind, v: string | number) => (kind === "headline" ? String(v) : kind === "popup_offer" ? `${v}%` : `$${(Number(v) / 100).toFixed(2)}`);
  return {
    store: { name: s.name, category: s.category, headline: s.heroHeadline, heroSub: s.heroSub, story: s.story.body, tagline: s.tagline, freeShippingOverCents: s.freeShippingCents, shippingCents: s.shippingCents, published: s.published },
    products: s.products.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      bullets: p.bullets ?? [],
      priceCents: p.priceCents,
      stock: p.stock,
      status: p.status,
      variants: p.variants,
      unitsSold: sold.get(p.id)?.units ?? 0,
      revenueCents: sold.get(p.id)?.cents ?? 0,
      hasPhoto: !!p.image,
      seoTitle: p.seoTitle,
      metaDescription: p.metaDescription ?? "",
    })),
    sales: {
      orders: live.length,
      revenueCents: live.reduce((a, o) => a + o.totalCents, 0),
      averageOrderCents: live.length ? Math.round(live.reduce((a, o) => a + o.totalCents, 0) / live.length) : 0,
      refunded: s.orders.length - live.length,
      last30DaysOrders: live.filter((o) => new Date(o.createdAt).getTime() > since).length,
    },
    discounts: s.discounts,
    experiments: s.experiments.map((e) => ({
      name: e.name,
      kind: e.kind,
      status: e.status,
      winner: e.winner,
      a: fmtVal(e.kind, e.variants[0].value),
      b: fmtVal(e.kind, e.variants[1].value),
      views: e.variants[0].views + e.variants[1].views,
      conversions: e.variants.map((v) => v.conversions),
    })),
    flows: s.flows.map((f) => ({ kind: f.kind, enabled: f.enabled, subject: f.subject, body: f.body })),
    lessons: s.lessons.map((l) => ({ source: l.source, text: l.text })),
    apps: s.apps,
  };
}

// ---------- the specialists ----------
export type Input = { productId?: string | null; kind?: EmailFlowKind; message?: string; orderNumber?: number | null; focus?: string };

export type Specialist = {
  id: SpecialistId;
  name: string;
  job: string;
  role: string;
  sections: PlaybookSection[];
  example: string;
  schema: object;
  /** the task text for this run */
  task: (input: Input, ctx: Context) => string;
  /** a product photo to show the model, if any */
  photo?: (input: Input, s: Store) => string | undefined;
};

export const SPECIALISTS: Record<SpecialistId, Specialist> = {
  product_copy: {
    id: "product_copy",
    name: "Product page writer",
    job: "Rewrites a product's title, description, key facts and search text so it sells — from the photo and your notes.",
    role: "You are a senior e-commerce copywriter who has written thousands of product pages for small independent brands. You write pages that convert because they are clear, specific and honest.",
    sections: ["honesty", "voice", "product", "seo"],
    example: `Input: "Lavender candle 8oz", $24, soy wax (owner note), photo of an amber jar.
Output: {"title":"Lavender Soy Candle — 8 oz Amber Jar","description":"A calm lavender scent for the end of the day. Hand-poured soy wax in a reusable amber glass jar.","bullets":["8 oz hand-poured soy wax","Reusable amber glass jar","Cotton wick"],"seoTitle":"Lavender Soy Candle 8 oz | Juniper Candle Co","metaDescription":"Hand-poured lavender soy candle in a reusable 8 oz amber jar. Ships in 1–3 business days."}
(Note: burn time was NOT given, so it is not mentioned.)`,
    schema: obj({ title: str, description: str, bullets: strArr, seoTitle: str, metaDescription: str }),
    task: (i, c) => {
      const p = c.products.find((x) => x.id === i.productId);
      return `Rewrite this product page.\nProduct (JSON): ${JSON.stringify(p)}\n${i.focus ? `Owner's request: ${i.focus}\n` : ""}${p?.hasPhoto ? "The product photo is attached." : "No photo is available."}`;
    },
    photo: (i, s) => s.products.find((p) => p.id === i.productId)?.image,
  },

  pricing: {
    id: "pricing",
    name: "Pricing advisor",
    job: "Looks at prices, stock and sales and suggests changes — or a price test when the evidence is thin.",
    role: "You are a pricing analyst for small e-commerce brands. You reason from the store's actual sales and stock, say what you don't know, and prefer measured tests over guesses.",
    sections: ["honesty", "pricing", "testing"],
    example: `Data: candle A $24, 40 sold, 6 left; candle B $32, 0 sold in 30 days, 50 in stock.
Output: {"summary":"A is selling fast and nearly out; B isn't moving.","suggestions":[{"productId":"A","suggestedCents":2800,"reasoning":"Steady sales and only 6 left suggest room to raise price; test $28 so you don't guess.","confidence":"medium","testInstead":true},{"productId":"B","suggestedCents":2800,"reasoning":"No sales in 30 days. Check the photo and description first; a lower-price test can show if price is the blocker.","confidence":"low","testInstead":true}],"needToKnow":["Unit cost per candle, to keep margins safe"]}`,
    schema: obj({
      summary: str,
      suggestions: { type: "array", items: obj({ productId: str, suggestedCents: { type: "integer" }, reasoning: str, confidence: { type: "string", enum: ["low", "medium", "high"] }, testInstead: { type: "boolean" } }) },
      needToKnow: strArr,
    }),
    task: (i, c) => `Review pricing${i.productId ? ` for product ${i.productId}` : " across the store"}. Suggest at most 3 changes (only where the data supports it). Store data: ${JSON.stringify({ products: c.products.map(({ id, title, priceCents, stock, unitsSold, revenueCents, status }) => ({ id, title, priceCents, stock, unitsSold, revenueCents, status })), sales: c.sales, experiments: c.experiments.filter((e) => e.kind === "price") })}`,
  },

  email: {
    id: "email",
    name: "Email writer",
    job: "Writes your automatic emails (welcome, abandoned checkout, after purchase, review request) in your brand's voice.",
    role: "You are an email marketer for independent online shops. Your emails are short, human and useful, and they get opened because they never feel like spam.",
    sections: ["honesty", "voice", "email"],
    example: `Flow: abandoned_checkout, store "Juniper Candle Co", no discount codes besides WELCOME10.
Output: {"subject":"Your lavender candle is still here","preheader":"We saved your cart — it ships in 1–3 days.","body":"Hi there,\\n\\nYou left a Lavender Soy Candle in your cart. It's saved for you whenever you're ready.\\n\\nNot sure about the scent? It's soft and calming — not overpowering.\\n\\n— Juniper Candle Co"}`,
    schema: obj({ subject: str, preheader: str, body: str }),
    task: (i, c) => `Write the "${i.kind}" email. Current version: ${JSON.stringify(c.flows.find((f) => f.kind === i.kind))}. Store: ${JSON.stringify({ ...c.store, products: c.products.slice(0, 6).map((p) => p.title), discounts: c.discounts })}${i.focus ? `\nOwner's request: ${i.focus}` : ""}`,
  },

  experiments: {
    id: "experiments",
    name: "A/B test planner",
    job: "Picks the next tests most likely to grow sales, using what earlier tests already taught.",
    role: "You are a conversion-rate specialist. You choose high-impact, measurable experiments for low-traffic stores and never repeat a question that's already settled.",
    sections: ["honesty", "testing", "merch"],
    example: `Output: {"ideas":[{"kind":"free_shipping","productId":null,"bValue":"50","hypothesis":"Because the average order is $46, lowering free shipping from $75 to $50 will raise conversion.","why":"Most carts end up just under the current threshold."}]}`,
    schema: obj({
      ideas: { type: "array", items: obj({ kind: { type: "string", enum: ["headline", "price", "free_shipping", "popup_offer"] }, productId: nullable("string"), bValue: str, hypothesis: str, why: str }) },
    }),
    task: (_i, c) => `Suggest 1-3 experiments to run next. bValue format: headline = the new headline text; price = new price in dollars (e.g. "28"); free_shipping = threshold in dollars ("0" turns it off); popup_offer = percent ("15"). Data: ${JSON.stringify({ store: c.store, products: c.products.map(({ id, title, priceCents, unitsSold }) => ({ id, title, priceCents, unitsSold })), sales: c.sales, experiments: c.experiments, discounts: c.discounts })}`,
  },

  seo: {
    id: "seo",
    name: "Search (SEO) writer",
    job: "Writes search titles and descriptions for every product so they show up — and get clicked — on Google.",
    role: "You are an e-commerce SEO specialist. You write titles and descriptions that match what shoppers type, read naturally, and fit Google's limits.",
    sections: ["honesty", "seo"],
    example: `Output: {"items":[{"productId":"p1","seoTitle":"Lavender Soy Candle 8 oz | Juniper Candle Co","metaDescription":"Hand-poured lavender soy candle in a reusable 8 oz amber jar. Ships in 1–3 business days from our studio."}]}`,
    schema: obj({ items: { type: "array", items: obj({ productId: str, seoTitle: str, metaDescription: str }) } }),
    task: (_i, c) => `Write an SEO title and meta description for each active product. Products: ${JSON.stringify(c.products.filter((p) => p.status === "active").map(({ id, title, description, bullets, priceCents }) => ({ id, title, description, bullets, priceCents })))}; store name: ${c.store.name}.`,
  },

  support: {
    id: "support",
    name: "Customer service",
    job: "Drafts a reply to a customer message using their order details. Anything about refunds or exceptions is flagged for you.",
    role: "You are a warm, efficient customer-service lead at a small online shop. You solve the problem in as few words as possible and never promise what the shop hasn't agreed to.",
    sections: ["honesty", "voice", "support"],
    example: `Message: "Hi, where's my order #1004? It's been 5 days." Order 1004: status fulfilled.
Output: {"reply":"Hi Sam, thanks for checking in! Order #1004 has shipped and is on its way to you. If it hasn't arrived in the next couple of days, reply here and we'll sort it out right away.\\n\\n— Juniper Candle Co","needsOwner":false,"reason":""}`,
    schema: obj({ reply: str, needsOwner: { type: "boolean" }, reason: str }),
    task: () => "", // built on the server, where the order lookup happens
  },
};

export const SPECIALIST_LIST = Object.values(SPECIALISTS);

/** Everything the model is told for one run (role + playbook + example + memory). */
export function systemPrompt(sp: Specialist, ctx: Context) {
  const lessons = ctx.lessons.length
    ? `\n\nWHAT THIS STORE HAS LEARNED (follow these; they override general advice):\n${ctx.lessons.map((l) => `- [${l.source === "owner" ? "owner says" : l.source === "result" ? "test result" : "saved note"}] ${l.text}`).join("\n")}`
    : "";
  return `${sp.role}\nYou work for the store "${ctx.store.name}" (${ctx.store.category}). Headline: "${ctx.store.headline}".\n\n${playbook(sp.sections)}\n\nEXAMPLE OF EXCELLENT WORK:\n${sp.example}${lessons}\n\nReply only with JSON in the required format.`;
}
