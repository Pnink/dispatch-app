/**
 * Shopper-side business rules, shared by the browser (to display totals) and the server (to decide them).
 * The server never trusts prices, totals or stock sent by a browser: it recomputes them here from its own data.
 */
import { recordConversion, recordExposures, shopperView } from "./experiments";
import type { CartLine, Customer, Order, OrderItem, Review, Store, VariantId } from "./types";

export function cartTotals(store: Store, lines: CartLine[], code?: string) {
  const subtotal = lines.reduce((a, l) => {
    const p = store.products.find((x) => x.id === l.productId);
    return a + (p ? p.priceCents * l.qty : 0);
  }, 0);
  const discount = store.discounts.find((d) => d.code.toUpperCase() === (code || "").trim().toUpperCase());
  const discountCents = discount ? Math.round((subtotal * discount.percent) / 100) : 0;
  const shippingCents = subtotal === 0 || subtotal - discountCents >= store.freeShippingCents ? 0 : store.shippingCents;
  return { subtotal, discountCents, shippingCents, total: subtotal - discountCents + shippingCents, discount };
}

/**
 * What a shopper's browser is allowed to see: no orders, customers, email list, loyalty balances,
 * email flow drafts, the original prompt, or experiment results.
 */
export type PublicStore = Omit<Store, "orders" | "subscribers" | "loyalty" | "flows" | "prompt" | "lessons" | "costs" | "pending">;

export function publicView(s: Store): PublicStore {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { orders, subscribers, loyalty, flows, prompt, lessons, costs, pending, ...rest } = s;
  return {
    ...rest,
    discounts: [], // codes stay secret; checkout asks the server to check one
    // supplier costs never leave the owner app
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    products: s.products.filter((p) => p.status === "active").map(({ costCents, ...p }) => p),
    experiments: s.experiments
      .filter((e) => e.status === "running")
      .map((e) => ({ ...e, variants: e.variants.map((v) => ({ ...v, views: 0, conversions: 0, revenueCents: 0, simulatedViews: 0 })) as typeof e.variants })),
  };
}

/** A storefront only needs the shopper-visible shape; fill the private fields with empties. */
export function asStore(p: PublicStore): Store {
  return { ...p, orders: [], subscribers: [], loyalty: {}, flows: [], prompt: "", lessons: [], costs: { supplierShippingCents: 0, feePercent: 0, feeFixedCents: 0 }, pending: [] };
}

// ---------- input validation (everything from a browser is untrusted) ----------
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
export const isEmail = (e: string) => /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(e);

export function cleanCustomer(c: unknown): Customer | string {
  const o = (c ?? {}) as Record<string, unknown>;
  const customer = { name: str(o.name, 100), email: str(o.email, 254).toLowerCase(), address: str(o.address, 200), city: str(o.city, 100), zip: str(o.zip, 20), country: str(o.country, 2).toUpperCase() };
  if (!isEmail(customer.email)) return "Enter a valid email.";
  if (!customer.name || !customer.address || !customer.city || !customer.zip) return "Please complete the shipping address.";
  if (!/^[A-Z]{2}$/.test(customer.country)) return "Pick a country.";
  return customer;
}

export function cleanLines(lines: unknown): CartLine[] | string {
  if (!Array.isArray(lines) || lines.length === 0) return "Your cart is empty.";
  if (lines.length > 50) return "Too many items.";
  const out: CartLine[] = [];
  for (const l of lines) {
    const o = (l ?? {}) as Record<string, unknown>;
    const qty = Number(o.qty);
    if (typeof o.productId !== "string" || !Number.isInteger(qty) || qty < 1 || qty > 99) return "Your cart has an invalid item.";
    out.push({ productId: o.productId.slice(0, 64), variant: o.variant ? str(o.variant, 60) : undefined, qty });
  }
  return out;
}

export function cleanForced(f: unknown): Record<string, VariantId> {
  const out: Record<string, VariantId> = {};
  if (f && typeof f === "object") for (const [k, v] of Object.entries(f)) if ((v === "a" || v === "b") && k.length < 64) out[k] = v;
  return out;
}

// ---------- shopper actions applied to a store (pure) ----------
export type OrderInput = { lines: CartLine[]; customer: Customer; code?: string; visitor: string; exposed: string[]; forced: Record<string, VariantId> };

/** Check stock and compute the order as this shopper would be charged. Charging happens between check and commit. */
export function quoteOrder(raw: Store, input: OrderInput): { error: string } | { totals: ReturnType<typeof cartTotals>; view: Store } {
  if (!raw.published) return { error: "This store isn't open yet." };
  const view = shopperView(raw, input.visitor, input.forced);
  for (const l of input.lines) {
    const p = view.products.find((x) => x.id === l.productId && x.status === "active");
    if (!p) return { error: "An item in your cart is no longer available." };
    if (l.variant && p.variants.length && !p.variants.includes(l.variant)) return { error: `That option of ${p.title} isn't available.` };
    if (p.stock < l.qty) return { error: p.stock === 0 ? `${p.title} just sold out.` : `Only ${p.stock} of ${p.title} left in stock.` };
  }
  const totals = cartTotals(view, input.lines, input.code);
  if (totals.total <= 0) return { error: "Nothing to charge." };
  return { totals, view };
}

/** What the shopper is buying, priced as they see it (incl. A/B price), with your cost per unit. */
export function orderItems(view: Store, lines: CartLine[]): OrderItem[] {
  return lines.map((l) => {
    const p = view.products.find((x) => x.id === l.productId)!;
    return { productId: p.id, title: p.title, variant: l.variant, qty: l.qty, unitCents: p.priceCents, unitCostCents: p.costCents };
  });
}

type Totals = { subtotal: number; discountCents: number; shippingCents: number; total: number };

/** Payment fee estimate from your settings (Stripe's standard US card rate by default). */
export const estimateFee = (s: Store, total: number) => Math.round((total * s.costs.feePercent) / 100) + s.costs.feeFixedCents;

export function commitOrder(raw: Store, items: OrderItem[], input: OrderInput, totals: Totals, paymentLabel: string, id: string, extra: Partial<Order> = {}): { store: Store; order: Order } {
  const points = raw.apps.loyalty ? Math.floor(totals.total / 100) : 0;
  const number = 1001 + raw.orders.length;
  const known = items.every((i) => i.unitCostCents !== undefined);
  const order: Order = {
    id,
    number,
    customer: input.customer,
    items,
    subtotalCents: totals.subtotal,
    discountCents: totals.discountCents,
    shippingCents: totals.shippingCents,
    totalCents: totals.total,
    status: "paid",
    createdAt: new Date().toISOString(),
    pointsEarned: points,
    paymentMethod: paymentLabel,
    costCents: known ? items.reduce((a, i) => a + (i.unitCostCents ?? 0) * i.qty, 0) + raw.costs.supplierShippingCents : undefined,
    feeCents: estimateFee(raw, totals.total),
    feeEstimated: true,
    ...extra,
  };
  // only real exposures count: previews never touch results
  const exposed = input.exposed.filter((e) => !input.forced[e]);
  // conversion first: it may auto-promote a winner (e.g. a new price), which the rest must keep
  const s = recordConversion(raw, input.visitor, exposed, totals.total);
  const email = input.customer.email;
  return {
    order,
    store: {
      ...s,
      orders: [order, ...s.orders],
      products: s.products.map((p) => {
        const qty = input.lines.filter((l) => l.productId === p.id).reduce((a, l) => a + l.qty, 0);
        return qty ? { ...p, stock: Math.max(0, p.stock - qty) } : p;
      }),
      loyalty: points ? { ...s.loyalty, [email]: (s.loyalty[email] || 0) + points } : s.loyalty,
    },
  };
}

export function applyVisit(s: Store, visitor: string, expIds: string[]): Store {
  const ids = expIds.filter((id) => s.experiments.some((e) => e.id === id && e.status === "running")).slice(0, 20);
  return ids.length ? recordExposures(s, visitor, ids) : s;
}

export function applySubscriber(s: Store, email: string): Store {
  const e = email.trim().toLowerCase();
  return s.subscribers.includes(e) ? s : { ...s, subscribers: [...s.subscribers, e] };
}

export function cleanReview(r: unknown, s: Store): Omit<Review, "id"> | string {
  const o = (r ?? {}) as Record<string, unknown>;
  const productId = str(o.productId, 64);
  const author = str(o.author, 60);
  const body = str(o.body, 1000);
  const rating = Number(o.rating);
  if (!s.apps.reviews) return "Reviews are turned off.";
  if (!s.products.some((p) => p.id === productId)) return "Unknown product.";
  if (!author || body.length < 5) return "Please add your name and a few words.";
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return "Pick a rating from 1 to 5.";
  return { productId, author, body, rating };
}
