"use client";
/**
 * Browser data layer.
 *
 * Owner app: the whole database is loaded from /api/admin/db and every change is saved back
 * automatically (debounced ~0.3s). Each change is kept as a function until the server confirms it,
 * so if something else saved first (another window, a new order) the changes are re-applied on top
 * of the newer data instead of overwriting it.
 *
 * Storefront: reads only the public view of a store and sends shopper actions to /api/public/...
 * The server re-checks and re-prices everything; nothing a shopper's browser says is trusted.
 */
import { useEffect, useSyncExternalStore } from "react";
import { generateStore, refundOrder } from "./ai";
import { asStore, type PublicStore } from "./commerce";
import { forcedVariants, markSeen, seenExperiments, shopperView, visitorId } from "./experiments";
import type { CartLine, Category, Customer, Order, OrderStatus, Store } from "./types";
import type { CardInput } from "./payments";
import { withDefaults } from "./sections";

// neutral prefix: shoppers can see storage keys in dev tools, so they must not name the platform
const P = "sf";
const CURRENT = `${P}:current`;

type DB = { stores: Store[] };
export type SaveState = "saved" | "saving" | "unsaved" | "offline" | "error";
type State = {
  status: "idle" | "loading" | "ready" | "error" | "locked";
  db: DB;
  rev: number;
  save: SaveState;
  savedAt?: string;
  error?: string;
  current: string | null;
};

let state: State = { status: "idle", db: { stores: [] }, rev: 0, save: "saved", current: null };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const set = (patch: Partial<State>) => {
  state = { ...state, ...patch };
  emit();
};
function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

// ---------- loading ----------
async function api(path: string, init?: RequestInit) {
  const res = await fetch(path, { ...init, headers: { "content-type": "application/json", ...(init?.headers || {}) }, cache: "no-store" });
  if (res.status === 401) {
    window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
    throw new Error("unauthorised");
  }
  return res;
}

async function load() {
  if (state.status === "loading" || state.status === "ready") return;
  set({ status: "loading" });
  try {
    const res = await api("/api/admin/db");
    if (res.status === 403) return set({ status: "locked", error: (await res.json()).error });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { rev: number; savedAt: string; stores: Store[] };
    let current: string | null = null;
    try {
      current = localStorage.getItem(CURRENT);
    } catch {
      /* ignore */
    }
    // keep anything changed while we were loading
    const loaded = pending.reduce((db, fn) => fn(db), { stores: data.stores.map(withDefaults) } as DB);
    set({ status: "ready", db: loaded, rev: data.rev, savedAt: data.savedAt, save: pending.length ? "unsaved" : "saved", current });
    startPolling();
  } catch (e) {
    if ((e as Error).message !== "unauthorised") set({ status: "error", error: "Couldn't reach the app's server. Is it running?" });
  }
}

// ---------- saving ----------
type Change = (db: DB) => DB;
let pending: Change[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let inFlight = false;

function change(fn: Change) {
  pending.push(fn);
  set({ db: fn(state.db), save: "unsaved" });
  schedule(300);
}

function schedule(ms: number) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(flush, ms);
}

async function flush(): Promise<void> {
  timer = null;
  if (inFlight || !pending.length) return;
  inFlight = true;
  const sending = pending.length;
  set({ save: "saving" });
  try {
    const res = await api("/api/admin/db", { method: "PUT", body: JSON.stringify({ baseRev: state.rev, stores: state.db.stores }) });
    if (res.status === 409) {
      // Someone saved first. Re-apply our unsaved changes on top of their version and try again.
      const server = (await res.json()) as { rev: number; stores: Store[] };
      const rebased = pending.reduce((db, fn) => fn(db), { stores: server.stores.map(withDefaults) } as DB);
      set({ db: rebased, rev: server.rev });
      inFlight = false;
      return flush();
    }
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
    const out = (await res.json()) as { rev: number; savedAt: string };
    pending = pending.slice(sending);
    set({ rev: out.rev, savedAt: out.savedAt, save: pending.length ? "unsaved" : "saved", error: undefined });
    inFlight = false;
    if (pending.length) schedule(50);
  } catch (e) {
    inFlight = false;
    if ((e as Error).message === "unauthorised") return;
    const offline = e instanceof TypeError; // fetch network failure
    set({ save: offline ? "offline" : "error", error: offline ? "Can't reach the server. Your changes are kept and will save when it's back." : (e as Error).message });
    schedule(4000); // keep retrying
  }
}

/** Pull in changes made elsewhere (new orders, sign-ups) while the owner app is open. */
let polling = false;
function startPolling() {
  if (polling || typeof window === "undefined") return;
  polling = true;
  const tick = async () => {
    if (document.visibilityState !== "visible" || pending.length || inFlight || state.status !== "ready") return;
    try {
      const res = await fetch("/api/admin/db", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { rev: number; savedAt: string; stores: Store[] };
      if (data.rev > state.rev && !pending.length && !inFlight) set({ db: { stores: data.stores.map(withDefaults) }, rev: data.rev, savedAt: data.savedAt });
    } catch {
      /* next tick */
    }
  };
  setInterval(tick, 8000);
  window.addEventListener("focus", tick);
  window.addEventListener("beforeunload", (e) => {
    if (pending.length || inFlight) e.preventDefault(); // browser asks "leave with unsaved changes?"
  });
  // Closing or reloading inside the save delay: send the last changes as the page goes away.
  window.addEventListener("pagehide", () => {
    if (!pending.length || inFlight) return;
    const body = JSON.stringify({ baseRev: state.rev, stores: state.db.stores });
    if (body.length < 60_000) {
      // keepalive requests survive the page closing (browsers cap them at 64 KB)
      fetch("/api/admin/db", { method: "PUT", headers: { "content-type": "application/json" }, body, keepalive: true }).catch(() => {});
      pending = [];
    }
  });
}

/** Save now (⌘S). */
export function saveNow() {
  if (pending.length) {
    if (timer) clearTimeout(timer);
    flush();
  }
}

// ---------- owner hooks ----------
const EMPTY: DB = { stores: [] };
const SERVER_STATE: State = { status: "idle", db: EMPTY, rev: 0, save: "saved", current: null };

export function useAdmin(): State {
  const s = useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);
  useEffect(() => {
    load();
  }, []);
  return s;
}

export function useDB(): DB {
  return useAdmin().db;
}

export function useStore(slug: string | undefined): Store | undefined {
  const db = useDB();
  return slug ? db.stores.find((s) => s.slug === slug) : undefined;
}

/** The store the owner app is looking at. */
export function useCurrentStore(): Store | undefined {
  const s = useAdmin();
  return s.db.stores.find((x) => x.slug === s.current) ?? s.db.stores[0];
}

export function setCurrentStore(slug: string) {
  try {
    localStorage.setItem(CURRENT, slug);
  } catch {
    /* ignore */
  }
  set({ current: slug });
}

// ---------- owner mutations (all autosaved) ----------
export function updateStore(slug: string, fn: (s: Store) => Store) {
  change((db) => ({ stores: db.stores.map((s) => (s.slug === slug ? fn(s) : s)) }));
}

/** transform: optional rewrite of the generated store (e.g. copy written by an AI model). */
export function createStore(prompt: string, category?: Category, transform?: (s: Store) => Store): Store {
  const base = generateStore(prompt, category, state.db.stores.map((s) => s.slug));
  const store = transform ? { ...transform(base), slug: base.slug } : base;
  change((db) => ({ stores: [store, ...db.stores.filter((s) => s.slug !== store.slug)] }));
  setCurrentStore(store.slug);
  return store;
}

export function deleteStore(slug: string) {
  change((db) => ({ stores: db.stores.filter((s) => s.slug !== slug) }));
}

export function setOrderStatus(slug: string, orderId: string, status: OrderStatus) {
  updateStore(slug, (s) => (status === "refunded" ? refundOrder(s, orderId) : { ...s, orders: s.orders.map((o) => (o.id === orderId ? { ...o, status } : o)) }));
}

/** Order steps done on the server (real refunds, tracking + customer email). Pulls the result into the app. */
export async function orderAction(slug: string, orderId: string, action: "refund" | "tracking", extra: Record<string, unknown> = {}) {
  // send anything unsaved first, so the server works on the latest data
  if (pending.length) {
    if (timer) clearTimeout(timer);
    await flush();
  }
  const res = await api("/api/admin/orders", { method: "POST", body: JSON.stringify({ slug, orderId, action, ...extra }) });
  const data = await res.json().catch(() => ({}));
  if (res.ok) await pull();
  return res.ok ? { ok: true as const, ...data } : { ok: false as const, error: (data.error as string) || "That didn't work." };
}

async function pull() {
  const res = await fetch("/api/admin/db", { cache: "no-store" });
  if (!res.ok) return;
  const data = (await res.json()) as { rev: number; savedAt: string; stores: Store[] };
  const merged = pending.reduce((db, fn) => fn(db), { stores: data.stores.map(withDefaults) } as DB);
  set({ db: merged, rev: data.rev, savedAt: data.savedAt });
}

/** Delete every store and order (Settings → Danger zone). Backups on disk are kept. */
export function eraseEverything() {
  change(() => ({ stores: [] }));
}

// ---------- storefront (public, any visitor) ----------
type Closed = { name: string; palette: Store["palette"]; font: Store["font"] };
/** checkout: "stripe" (live), "stripe-test" (Stripe test keys) or "demo" (no Stripe key yet) */
export type Front = { status: "loading" | "ready" | "missing" | "closed" | "error"; store?: Store; closed?: Closed; checkout?: "stripe" | "stripe-test" | "demo" };
const fronts = new Map<string, Front>();
const LOADING: Front = { status: "loading" };

async function loadFront(slug: string) {
  if (!slug) return;
  try {
    const res = await fetch(`/api/public/stores/${encodeURIComponent(slug)}`, { cache: "no-store" });
    if (res.status === 404) fronts.set(slug, { status: "missing" });
    else if (!res.ok) fronts.set(slug, { status: "error" });
    else {
      const data = await res.json();
      if (data.published === false) fronts.set(slug, { status: "closed", closed: data as Closed });
      else {
        const { checkout, ...pub } = data;
        fronts.set(slug, { status: "ready", store: withDefaults(asStore(pub as PublicStore)), checkout });
      }
    }
  } catch {
    fronts.set(slug, { status: "error" });
  }
  emit();
}

export function refreshFront(slug: string) {
  return loadFront(slug);
}

/** The storefront's public data, as loaded from the server. */
export function useStorefront(slug: string): Front {
  const f = useSyncExternalStore(subscribe, () => fronts.get(slug) ?? LOADING, () => LOADING);
  useEffect(() => {
    if (!fronts.has(slug)) loadFront(slug);
    const onFocus = () => loadFront(slug);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [slug]);
  return f;
}

/** The storefront as this shopper sees it (running A/B tests applied for this visitor). */
export function useShopperStore(slug: string | undefined): Store | undefined {
  const f = useStorefront(slug ?? "");
  return f.store ? shopperView(f.store, visitorId()) : undefined;
}

async function post(slug: string, action: string, payload: unknown) {
  const res = await fetch(`/api/public/stores/${encodeURIComponent(slug)}/${action}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

/** Count this visitor once per running experiment (previews are never counted). */
export function recordVisit(slug: string, store: Store | undefined) {
  if (!store) return;
  const seen = seenExperiments(slug);
  const forced = forcedVariants();
  const fresh = store.experiments.filter((e) => e.status === "running" && !seen.includes(e.id) && !forced[e.id]).map((e) => e.id);
  if (!fresh.length) return;
  markSeen(slug, fresh);
  post(slug, "visit", { visitor: visitorId(), experiments: fresh });
}

export type Quote = { subtotal: number; discountCents: number; shippingCents: number; total: number; code: { code: string; percent: number } | null };
export async function quote(slug: string, lines: CartLine[], code?: string): Promise<Quote | null> {
  try {
    const r = await post(slug, "quote", { lines, code, visitor: visitorId(), forced: forcedVariants() });
    return r.ok ? (r.data as Quote) : null;
  } catch {
    return null;
  }
}

export type PlaceOrderResult = { ok: true; order: Order } | { ok: true; redirect: string } | { ok: false; error: string };
export async function placeOrder(slug: string, lines: CartLine[], customer: Customer, payment: CardInput, code?: string): Promise<PlaceOrderResult> {
  try {
    const r = await post(slug, "order", { lines, customer, payment, code, visitor: visitorId(), exposed: seenExperiments(slug), forced: forcedVariants() });
    if (!r.ok) return { ok: false, error: r.data.error || "We couldn't place that order." };
    if (typeof r.data.redirect === "string") return { ok: true, redirect: r.data.redirect }; // Stripe's payment page
    const order = r.data.order as Order;
    try {
      sessionStorage.setItem(`${P}:order:${order.id}`, JSON.stringify(order)); // shown on the confirmation page
    } catch {
      /* ignore */
    }
    loadFront(slug); // stock changed
    return { ok: true, order };
  } catch {
    return { ok: false, error: "Couldn't reach the store. Check your connection and try again." };
  }
}

/** Back from Stripe: the server checks with Stripe and records the order. */
export async function confirmCheckout(slug: string, session: string): Promise<PlaceOrderResult> {
  try {
    const r = await post(slug, "confirm", { session });
    if (!r.ok) return { ok: false, error: r.data.error || "We couldn't confirm your payment." };
    const order = r.data.order as Order;
    try {
      sessionStorage.setItem(`${P}:order:${order.id}`, JSON.stringify(order));
    } catch {
      /* ignore */
    }
    writeCart(slug, []);
    loadFront(slug);
    return { ok: true, order };
  } catch {
    return { ok: false, error: "Couldn't reach the store. Refresh this page to try again." };
  }
}

export type TrackResult = { number: number; status: string; createdAt: string; items: { title: string; variant?: string; qty: number }[]; tracking: { number: string; carrier: string; url: string; addedAt: string } | null };
export async function trackOrder(slug: string, number: string, email: string): Promise<{ ok: true; data: TrackResult } | { ok: false; error: string }> {
  try {
    const r = await post(slug, "track", { number: Number(number.replace(/\D/g, "")), email });
    return r.ok ? { ok: true, data: r.data as TrackResult } : { ok: false, error: r.data.error || "Couldn't look that up." };
  } catch {
    return { ok: false, error: "Couldn't reach the store." };
  }
}

export function readPlacedOrder(id: string): Order | null {
  try {
    return JSON.parse(sessionStorage.getItem(`${P}:order:${id}`) || "null");
  } catch {
    return null;
  }
}

export async function addSubscriber(slug: string, email: string) {
  try {
    return (await post(slug, "subscribe", { email })).ok;
  } catch {
    return false;
  }
}

export async function submitReview(slug: string, review: { productId: string; author: string; rating: number; body: string }) {
  try {
    const r = await post(slug, "review", review);
    if (r.ok) loadFront(slug);
    return r.ok ? null : (r.data.error as string) || "Couldn't post your review.";
  } catch {
    return "Couldn't reach the store.";
  }
}

// ---------- cart (per store, in this browser) ----------
const cartKey = (slug: string) => `${P}:cart:${slug}`;
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
  emit();
}

export function useCart(slug: string): CartLine[] {
  return useSyncExternalStore(subscribe, () => readCart(slug), () => NO_LINES);
}

export function addToCart(slug: string, productId: string, variant: string | undefined, qty = 1) {
  const lines = readCart(slug);
  const existing = lines.find((l) => l.productId === productId && l.variant === variant);
  writeCart(slug, existing ? lines.map((l) => (l === existing ? { ...l, qty: l.qty + qty } : l)) : [...lines, { productId, variant, qty }]);
}

// ---------- owner flag (owner tools bar on storefronts, in the owner's browser only) ----------
const OWNER = `${P}:owner`;
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
const BACKUP_FORMAT = "kovaz-backup";
const OLD_BACKUP_FORMATS = ["tillery-backup"]; // backups made before the rename still restore

/** Everything: all stores, products, orders, experiments, settings. */
export function downloadBackup() {
  download(`kovaz-backup-${stamp()}.json`, JSON.stringify({ format: BACKUP_FORMAT, version: 1, exportedAt: new Date().toISOString(), stores: state.db.stores }, null, 2), "application/json");
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
  if (!(p.format === BACKUP_FORMAT || OLD_BACKUP_FORMATS.includes(p.format ?? "")) || !Array.isArray(p.stores)) return "That doesn't look like a backup from this app.";
  const stores = (p.stores as Store[]).map(withDefaults);
  if (stores.some((s) => !s.slug || !s.name || !Array.isArray(s.products))) return "The backup is missing store data.";
  change(() => ({ stores }));
  if (stores[0]) setCurrentStore(stores[0].slug);
  return null;
}

const csvCell = (v: unknown) => {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // stop spreadsheet formula injection from customer-entered text
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
