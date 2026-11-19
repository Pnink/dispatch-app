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

const KEY = "forgecart:v1";
const CURRENT = "forgecart:current";

type DB = { stores: Store[] };

let cache: DB | null = null;
const listeners = new Set<() => void>();

function read(): DB {
  if (cache) return cache;
  if (typeof window === "undefined") return { stores: [] };
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as DB) : seed();
    if (!raw) write(cache);
  } catch {
    cache = seed();
  }
  return cache;
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
    .filter((k) => k.startsWith("forgecart:cart:"))
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
  const store = read().stores.find((s) => s.slug === slug);
  if (!store) return { ok: false, error: "Store not found." };
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
  updateStore(slug, (s) => ({
    ...s,
    orders: [order, ...s.orders],
    products: s.products.map((p) => {
      const qty = lines.filter((l) => l.productId === p.id).reduce((a, l) => a + l.qty, 0);
      return qty ? { ...p, stock: p.stock - qty } : p;
    }),
    loyalty: points ? { ...s.loyalty, [customer.email.toLowerCase()]: (s.loyalty[customer.email.toLowerCase()] || 0) + points } : s.loyalty,
  }));
  return { ok: true, order };
}

// ---------- cart (per store, localStorage) ----------
const cartKey = (slug: string) => `forgecart:cart:${slug}`;
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
