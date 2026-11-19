"use client";
/**
 * Demo data layer: everything lives in localStorage under one key.
 * Swap these functions for server actions / a real DB later; screens only
 * use the exported functions and hooks.
 */
import { useSyncExternalStore } from "react";
import { generateStore, refundOrder, uid } from "./ai";
import type { CartLine, Category, Customer, Order, OrderStatus, Store } from "./types";
import { chargeCard, type CardInput } from "./payments";
import { withDefaults } from "./sections";
import { forcedVariants, markSeen, recordConversion, recordExposures, seenExperiments, shopperView, visitorId } from "./experiments";

const KEY = "wharf:v1";
const CURRENT = "wharf:current";

type DB = { stores: Store[] };

let cache: DB | null = null;
const listeners = new Set<() => void>();

function read(): DB {
  if (cache) return cache;
  if (typeof window === "undefined") return { stores: [] };
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? migrate(JSON.parse(raw) as DB) : seed();
    if (!raw) write(cache);
  } catch {
    cache = seed();
  }
  return cache;
}

/** Fill in fields added after a store was first saved. */
function migrate(db: DB): DB {
  return { stores: db.stores.map(withDefaults) };
}

function write(db: DB) {
  cache = db;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* storage full or blocked: keep in memory */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

const EMPTY: DB = { stores: [] };

export function useDB(): DB {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function useStore(slug: string | undefined): Store | undefined {
  const db = useDB();
  return slug ? db.stores.find((s) => s.slug === slug) : undefined;
}

/**
 * The store as the current shopper sees it: running A/B experiments applied for this visitor.
 * Storefront pages use this; the dashboard uses the raw store.
 */
export function useShopperStore(slug: string | undefined): Store | undefined {
  const store = useStore(slug);
  return store ? shopperView(store, visitorId()) : undefined;
}

/** Count this visitor once per running experiment (preview overrides are not counted). */
export function recordVisit(slug: string) {
  const store = read().stores.find((s) => s.slug === slug);
  if (!store) return;
  const seen = seenExperiments(slug);
  const forced = forcedVariants();
  const fresh = store.experiments.filter((e) => e.status === "running" && !seen.includes(e.id) && !forced[e.id]).map((e) => e.id);
  if (!fresh.length) return;
  markSeen(slug, fresh);
  updateStore(slug, (s) => recordExposures(s, visitorId(), fresh));
}

/** The store the merchant dashboard is looking at. */
export function useCurrentStore(): Store | undefined {
  const db = useDB();
  const slug = typeof window !== "undefined" ? window.localStorage.getItem(CURRENT) : null;
  return db.stores.find((s) => s.slug === slug) ?? db.stores[0];
}

export function setCurrentStore(slug: string) {
  window.localStorage.setItem(CURRENT, slug);
  listeners.forEach((l) => l());
}

// ---------- mutations ----------
export function createStore(prompt: string, category?: Category): Store {
  const db = read();
  const store = generateStore(prompt, category, db.stores.map((s) => s.slug));
  write({ stores: [store, ...db.stores] });
  setCurrentStore(store.slug);
  return store;
}

export function updateStore(slug: string, fn: (s: Store) => Store) {
  const db = read();
  write({ stores: db.stores.map((s) => (s.slug === slug ? fn(s) : s)) });
}

export function deleteStore(slug: string) {
  const db = read();
  write({ stores: db.stores.filter((s) => s.slug !== slug) });
}

export function setOrderStatus(slug: string, orderId: string, status: OrderStatus) {
  updateStore(slug, (s) =>
    status === "refunded" ? refundOrder(s, orderId) : { ...s, orders: s.orders.map((o) => (o.id === orderId ? { ...o, status } : o)) },
  );
}

export function resetDemo() {
  window.localStorage.removeItem(KEY);
  window.localStorage.removeItem(CURRENT);
  Object.keys(window.localStorage)
    .filter((k) => k.startsWith("wharf:cart:"))
    .forEach((k) => window.localStorage.removeItem(k));
  cache = null;
  read();
  listeners.forEach((l) => l());
}

// ---------- pricing maths ----------
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

export type PlaceOrderResult = { ok: true; order: Order } | { ok: false; error: string };

export async function placeOrder(slug: string, lines: CartLine[], customer: Customer, card: CardInput, code?: string): Promise<PlaceOrderResult> {
  const raw = read().stores.find((s) => s.slug === slug);
  if (!raw) return { ok: false, error: "Store not found." };
  const visitor = visitorId();
  const store = shopperView(raw, visitor); // prices/thresholds/codes this shopper was shown
  if (!lines.length) return { ok: false, error: "Your cart is empty." };
  for (const l of lines) {
    const p = store.products.find((x) => x.id === l.productId);
    if (!p) return { ok: false, error: "An item in your cart is no longer available." };
    if (p.stock < l.qty) return { ok: false, error: `Only ${p.stock} of ${p.title} left in stock.` };
  }
  const t = cartTotals(store, lines, code);
  const charge = await chargeCard(card, t.total);
  if (!charge.ok) return { ok: false, error: charge.error };

  const number = 1001 + store.orders.length;
  const points = store.apps.loyalty ? Math.floor(t.total / 100) : 0;
  const order: Order = {
    id: uid(),
    number,
    customer,
    items: lines.map((l) => {
      const p = store.products.find((x) => x.id === l.productId)!;
      return { productId: p.id, title: p.title, variant: l.variant, qty: l.qty, unitCents: p.priceCents };
    }),
    subtotalCents: t.subtotal,
    discountCents: t.discountCents,
    shippingCents: t.shippingCents,
    totalCents: t.total,
    status: "paid",
    createdAt: new Date().toISOString(),
    pointsEarned: points,
    paymentMethod: charge.label,
  };
  const forced = forcedVariants();
  const exposed = seenExperiments(slug).filter((id) => !forced[id]);
  updateStore(slug, (prev) => {
    // conversion first: it may auto-promote a winner (e.g. a new price), which the rest must keep
    const s = recordConversion(prev, visitor, exposed, t.total);
    return {
      ...s,
      orders: [order, ...s.orders],
      products: s.products.map((p) => {
        const qty = lines.filter((l) => l.productId === p.id).reduce((a, l) => a + l.qty, 0);
        return qty ? { ...p, stock: p.stock - qty } : p;
      }),
      loyalty: points ? { ...s.loyalty, [customer.email.toLowerCase()]: (s.loyalty[customer.email.toLowerCase()] || 0) + points } : s.loyalty,
    };
  });
  return { ok: true, order };
}

// ---------- cart (per store, localStorage) ----------
const cartKey = (slug: string) => `wharf:cart:${slug}`;
const cartCache = new Map<string, CartLine[]>();
const NO_LINES: CartLine[] = [];

function readCart(slug: string): CartLine[] {
  if (cartCache.has(slug)) return cartCache.get(slug)!;
  if (typeof window === "undefined") return NO_LINES;
  let lines: CartLine[] = [];
  try {
    lines = JSON.parse(window.localStorage.getItem(cartKey(slug)) || "[]");
  } catch {
    lines = [];
  }
  cartCache.set(slug, lines);
  return lines;
}

export function writeCart(slug: string, lines: CartLine[]) {
  cartCache.set(slug, lines);
  try {
    window.localStorage.setItem(cartKey(slug), JSON.stringify(lines));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function useCart(slug: string): CartLine[] {
  return useSyncExternalStore(subscribe, () => readCart(slug), () => NO_LINES);
}

export function addToCart(slug: string, productId: string, variant: string | undefined, qty = 1) {
  const lines = readCart(slug);
  const existing = lines.find((l) => l.productId === productId && l.variant === variant);
  writeCart(
    slug,
    existing ? lines.map((l) => (l === existing ? { ...l, qty: l.qty + qty } : l)) : [...lines, { productId, variant, qty }],
  );
}

// ---------- seed ----------
function seed(): DB {
  const demo = generateStore("A calm homeware shop selling handmade ceramics and linen, earthy and minimal", "homeware");
  const names: [string, string][] = [
    ["Hannah Cole", "hannah@example.com"],
    ["Diego Ramos", "diego@example.com"],
    ["Mei Tanaka", "mei@example.com"],
    ["Oliver Grant", "oliver@example.com"],
    ["Fatima Noor", "fatima@example.com"],
  ];
  const now = Date.now();
  demo.orders = names.map(([name, email], i) => {
    const p = demo.products[i % demo.products.length];
    const qty = 1 + (i % 2);
    const subtotal = p.priceCents * qty;
    const shipping = subtotal >= demo.freeShippingCents ? 0 : demo.shippingCents;
    return {
      id: uid(),
      number: 1005 - i,
      customer: { name, email, address: `${12 + i * 7} Market Street`, city: "Portland", zip: "97205", country: "US" },
      items: [{ productId: p.id, title: p.title, variant: p.variants[0], qty, unitCents: p.priceCents }],
      subtotalCents: subtotal,
      discountCents: 0,
      shippingCents: shipping,
      totalCents: subtotal + shipping,
      status: (i < 2 ? "paid" : i === 4 ? "refunded" : "fulfilled") as OrderStatus,
      createdAt: new Date(now - i * 26 * 3600_000 - 3600_000).toISOString(),
      pointsEarned: 0,
      paymentMethod: "Visa •••• 4242",
    };
  });
  demo.published = true;
  return { stores: [demo] };
}

// ---------- email list ----------
export function addSubscriber(slug: string, email: string) {
  const e = email.trim().toLowerCase();
  updateStore(slug, (s) => (s.subscribers.includes(e) ? s : { ...s, subscribers: [...s.subscribers, e] }));
}

// ---------- owner flag (shows the owner tools bar on storefronts in the owner's browser only) ----------
const OWNER = "wharf:owner";
export function markOwner() {
  try {
    localStorage.setItem(OWNER, "1");
  } catch {
    /* ignore */
  }
}
export function isOwner() {
  try {
    return localStorage.getItem(OWNER) === "1";
  } catch {
    return false;
  }
}

// ---------- backup & export (no lock-in) ----------
function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const stamp = () => new Date().toISOString().slice(0, 10);

/** Everything: all stores, products, orders, experiments, settings. */
export function downloadBackup() {
  download(`wharf-backup-${stamp()}.json`, JSON.stringify({ format: "wharf-backup", version: 1, exportedAt: new Date().toISOString(), ...read() }, null, 2), "application/json");
}

/** Replace all data with a backup file's contents. Returns an error message, or null on success. */
export function restoreBackup(text: string): string | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return "That file isn't valid JSON.";
  }
  const p = parsed as { format?: string; stores?: unknown };
  if (p.format !== "wharf-backup" || !Array.isArray(p.stores)) return "That doesn't look like a backup from this app.";
  const db = migrate({ stores: p.stores as Store[] });
  if (db.stores.some((s) => !s.slug || !s.name || !Array.isArray(s.products))) return "The backup is missing store data.";
  write(db);
  if (db.stores[0]) setCurrentStore(db.stores[0].slug);
  return null;
}

const csvCell = (v: unknown) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCsv = (rows: unknown[][]) => rows.map((r) => r.map(csvCell).join(",")).join("\n");

export function downloadCsv(store: Store, what: "orders" | "products" | "subscribers") {
  let rows: unknown[][];
  if (what === "orders")
    rows = [
      ["number", "date", "status", "customer", "email", "address", "city", "zip", "country", "items", "subtotal", "discount", "shipping", "total", "payment"],
      ...store.orders.map((o) => [
        o.number, o.createdAt, o.status, o.customer.name, o.customer.email, o.customer.address, o.customer.city, o.customer.zip, o.customer.country,
        o.items.map((i) => `${i.qty}x ${i.title}${i.variant ? ` (${i.variant})` : ""}`).join("; "),
        (o.subtotalCents / 100).toFixed(2), (o.discountCents / 100).toFixed(2), (o.shippingCents / 100).toFixed(2), (o.totalCents / 100).toFixed(2), o.paymentMethod,
      ]),
    ];
  else if (what === "products")
    rows = [
      ["title", "price", "compare_at", "stock", "status", "variants", "seo_title", "description"],
      ...store.products.map((p) => [p.title, (p.priceCents / 100).toFixed(2), p.compareAtCents ? (p.compareAtCents / 100).toFixed(2) : "", p.stock, p.status, p.variants.join("|"), p.seoTitle, p.description]),
    ];
  else rows = [["email"], ...store.subscribers.map((e) => [e])];
  download(`${store.slug}-${what}-${stamp()}.csv`, toCsv(rows), "text/csv");
}
