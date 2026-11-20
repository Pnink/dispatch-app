/**
 * Practice tests for the AI team: a fixed practice store with known facts, and questions with checkable expectations.
 * Each answer is scored 0-100 (rule checks + expectations). Run them when you change model, playbook or prompts,
 * and compare scores — that's how you see whether the AI got better.
 */
import { generateStore } from "../ai";
import { check } from "./checks";
import { buildContext, type Context, type Input, type SpecialistId } from "./specialists";
import type { OrderStatus, Store } from "../types";

export function practiceStore(): Store {
  const s = generateStore("Hand-poured soy candles in amber jars, calm and minimal", "homeware");
  const now = Date.now();
  const products = [
    { title: "Lavender Soy Candle 8oz", description: "Soy wax candle with lavender scent in an amber jar.", priceCents: 2400, stock: 4, sold: 40 },
    { title: "Cedar Soy Candle 12oz", description: "Soy wax candle with cedarwood scent.", priceCents: 3200, stock: 50, sold: 0 },
    { title: "Wick Trimmer", description: "Stainless steel wick trimmer.", priceCents: 1400, stock: 30, sold: 8 },
  ].map((p, i) => ({ ...s.products[i % s.products.length], id: `p${i + 1}`, title: p.title, description: p.description, priceCents: p.priceCents, stock: p.stock, variants: [], bullets: [], image: undefined, _sold: p.sold }));
  const orders = products.flatMap((p) =>
    Array.from({ length: p._sold }, (_, k) => ({
      id: `o-${p.id}-${k}`,
      number: 1000 + k,
      customer: { name: "Sam Lee", email: `c${k}@example.com`, address: "1 St", city: "X", zip: "1", country: "US" },
      items: [{ productId: p.id, title: p.title, qty: 1, unitCents: p.priceCents }],
      subtotalCents: p.priceCents,
      discountCents: 0,
      shippingCents: 595,
      totalCents: p.priceCents + 595,
      status: "fulfilled" as OrderStatus,
      createdAt: new Date(now - k * 3_600_000 * 12).toISOString(),
      pointsEarned: 0,
      paymentMethod: "Visa •••• 4242",
    })),
  );
  orders[2] = { ...orders[2], number: 1002, status: "paid" };
  return {
    ...s,
    name: "Juniper Candle Co",
    products: products.map(({ _sold, ...p }) => p),
    orders,
    discounts: [{ code: "WELCOME10", percent: 10 }],
    lessons: [{ id: "l1", source: "result", text: 'Homepage headline: "Quiet light for slow evenings" beat "Shop candles" on conversion.', createdAt: new Date().toISOString() }, { id: "l2", source: "owner", text: "We never discount more than 15%.", createdAt: new Date().toISOString() }],
    published: true,
  };
}

type Case = {
  name: string;
  specialist: SpecialistId;
  input: Input;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  expect: (out: any, ctx: Context) => string[]; // returns failures
};

export const CASES: Case[] = [
  {
    name: "Product page: no invented facts",
    specialist: "product_copy",
    input: { productId: "p1" },
    expect: (o) => [
      ...(/\b\d+\s*(\+\s*)?(hours?|hrs?)\b/i.test(JSON.stringify(o)) ? ["mentions a burn time that was never given"] : []),
      ...(!/8\s?oz|8\s?ounce/i.test(`${o.title} ${o.description} ${o.bullets?.join(" ")}`) ? ["drops the 8 oz size"] : []),
      ...(!/soy/i.test(JSON.stringify(o)) ? ["drops the soy wax fact"] : []),
    ],
  },
  {
    name: "Pricing: fast seller nearly out",
    specialist: "pricing",
    input: {},
    expect: (o) => {
      const s = o.suggestions?.find((x: any) => x.productId === "p1");
      return [...(!s ? ["misses the fast-selling, low-stock candle"] : s.suggestedCents <= 2400 ? ["suggests lowering a product that's selling out"] : [])];
    },
  },
  {
    name: "Email: abandoned checkout uses only real codes",
    specialist: "email",
    input: { kind: "abandoned_checkout" },
    expect: (o) => [...(o.subject.length > 50 ? ["subject over 50 characters"] : []), ...(/\b\d{2,}%/.test(o.body) && !/10%/.test(o.body) ? ["offers a discount that doesn't exist"] : [])],
  },
  {
    name: "Tests: proposes valid, non-duplicate experiments",
    specialist: "experiments",
    input: {},
    expect: (o) => [...(!o.ideas?.length ? ["no test ideas"] : []), ...(o.ideas?.some((i: any) => i.kind === "popup_offer" && Number(i.bValue) > 15) ? ["ignores the owner's 15% discount limit"] : [])],
  },
  {
    name: "SEO: every active product, within limits",
    specialist: "seo",
    input: {},
    expect: (o, ctx) => [...(ctx.products.filter((p) => p.status === "active").every((p) => o.items?.some((i: any) => i.productId === p.id)) ? [] : ["skips a product"])],
  },
  {
    name: "Support: refund request is flagged for the owner",
    specialist: "support",
    input: { message: "Hi, where is my order #1002? Also the trimmer I got before arrived bent, can I get a refund?", orderNumber: 1002 },
    expect: (o) => [...(!o.needsOwner ? ["doesn't flag the refund for the owner"] : []), ...(!/1002/.test(o.reply) && !/order/i.test(o.reply) ? ["doesn't address the order"] : [])],
  },
  {
    name: "Support: simple question answered without escalation",
    specialist: "support",
    input: { message: "Do your candles come in a gift box?", orderNumber: null },
    expect: (o) => [...(o.reply.length > 900 ? ["reply too long for a simple question"] : [])],
  },
];

export type CaseResult = { name: string; specialist: SpecialistId; score: number; failures: string[]; issues: string[] };

export function score(c: Case, raw: any, ctx: Context): CaseResult {
  const { output, issues } = check(c.specialist, raw, ctx);
  const failures = c.expect(output, ctx);
  let s = 100 - failures.length * 25;
  for (const i of issues) s -= i.level === "blocked" ? 50 : i.level === "warning" ? 15 : 5;
  return { name: c.name, specialist: c.specialist, score: Math.max(0, s), failures, issues: issues.map((i) => `${i.level}: ${i.text}`) };
}

export function practiceContext() {
  return buildContext(practiceStore());
}
