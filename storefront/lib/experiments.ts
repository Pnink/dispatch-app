/**
 * A/B testing engine. Pure functions: run in the browser (display) and on the server (orders, visits).
 *
 * - Assignment: each storefront visitor gets a stable random id; variant = hash(visitor + experiment) % 2.
 * - Exposure: counted once per visitor per experiment, when they load the storefront.
 * - Conversion: an order placed by an exposed visitor counts for their variant (plus its revenue).
 * - Stats: Beta(1+conversions, 1+non-conversions) posterior per variant; P(B beats A) via a normal
 *   approximation. Price tests compare revenue per visitor (conversion rate x average order value).
 * - Auto-promote: once both variants reach the minimum sample and P(B>A) >= 95% (or <= 5%), the winner
 *   is applied to the store and the experiment ends.
 */
import { hash, uid } from "./ai";
import type { Experiment, ExperimentKind, Store, Variant, VariantId } from "./types";

// ---------- visitor identity ----------
const VISITOR = "sf:visitor";

export function visitorId(): string {
  if (typeof window === "undefined") return "server";
  try {
    let v = localStorage.getItem(VISITOR);
    if (!v) {
      v = uid();
      localStorage.setItem(VISITOR, v);
    }
    return v;
  } catch {
    return "anon";
  }
}

const seenKey = (slug: string) => `sf:ab-seen:${slug}`;
export function seenExperiments(slug: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(seenKey(slug)) || "[]");
  } catch {
    return [];
  }
}
export function markSeen(slug: string, ids: string[]) {
  try {
    localStorage.setItem(seenKey(slug), JSON.stringify([...new Set([...seenExperiments(slug), ...ids])]));
  } catch {
    /* ignore */
  }
}

/** Preview overrides (?ab=<expId>.<a|b>), kept for the browser session; never counted in stats. */
const forceKey = "sf:ab-force";
export function forcedVariants(): Record<string, VariantId> {
  try {
    return JSON.parse(sessionStorage.getItem(forceKey) || "{}");
  } catch {
    return {};
  }
}
export function setForced(expId: string, v: VariantId | null) {
  const f = forcedVariants();
  if (v) f[expId] = v;
  else delete f[expId];
  try {
    sessionStorage.setItem(forceKey, JSON.stringify(f));
  } catch {
    /* ignore */
  }
}

/** forced: preview overrides; defaults to this browser's previews on the client, none on the server. */
export function assign(exp: Experiment, visitor: string, forced?: Record<string, VariantId>): VariantId {
  const f = (forced ?? (typeof window !== "undefined" ? forcedVariants() : {}))[exp.id];
  if (f) return f;
  return hash(`${visitor}:${exp.id}`) % 2 === 0 ? "a" : "b";
}

// ---------- applying variants ----------
export const popupCode = (percent: number) => `WELCOME${percent}`;

export function applyVariant(store: Store, exp: Experiment, v: VariantId): Store {
  const value = exp.variants.find((x) => x.id === v)!.value;
  switch (exp.kind) {
    case "headline":
      return { ...store, heroHeadline: String(value) };
    case "price":
      return { ...store, products: store.products.map((p) => (p.id === exp.productId ? { ...p, priceCents: Number(value) } : p)) };
    case "free_shipping":
      return { ...store, freeShippingCents: Number(value) };
    case "popup_offer": {
      const percent = Number(value);
      const code = v === "a" ? store.popup.code : popupCode(percent);
      return {
        ...store,
        popup: { ...store.popup, percent, code, headline: `Take ${percent}% off your first order` },
        discounts: store.discounts.some((d) => d.code === code) ? store.discounts : [...store.discounts, { code, percent }],
      };
    }
  }
}

/** The store as a given shopper sees it, with every running experiment applied. */
export function shopperView(store: Store, visitor: string, forced?: Record<string, VariantId>): Store {
  return (store.experiments ?? []).filter((e) => e.status === "running").reduce((s, e) => applyVariant(s, e, assign(e, visitor, forced)), store);
}

// ---------- stats ----------
function erf(x: number) {
  // Abramowitz–Stegun 7.1.26
  const s = Math.sign(x);
  x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return s * y;
}
const phi = (z: number) => 0.5 * (1 + erf(z / Math.SQRT2));

export type VariantStats = Variant & { cr: number; rpv: number; aov: number };
export type ExperimentStats = {
  a: VariantStats;
  b: VariantStats;
  metric: "conversion" | "revenue";
  probBBetter: number; // 0..1
  lift: number; // relative, on the primary metric
  enoughData: boolean;
  decisive: boolean;
  leader: VariantId | null;
};

export function experimentStats(exp: Experiment): ExperimentStats {
  const metric = exp.kind === "price" || exp.kind === "popup_offer" ? "revenue" : "conversion";
  const vs = exp.variants.map((v) => {
    const cr = v.views ? v.conversions / v.views : 0;
    const aov = v.conversions ? v.revenueCents / v.conversions : 0;
    return { ...v, cr, aov, rpv: v.views ? v.revenueCents / v.views : 0 };
  }) as [VariantStats, VariantStats];
  const [a, b] = vs;

  const post = (v: VariantStats) => {
    const al = 1 + v.conversions;
    const be = 1 + Math.max(0, v.views - v.conversions);
    const mean = al / (al + be);
    const variance = (al * be) / ((al + be) ** 2 * (al + be + 1));
    const scale = metric === "revenue" ? v.aov || 1 : 1;
    return { mean: mean * scale, sd: Math.sqrt(variance) * scale };
  };
  const pa = post(a);
  const pb = post(b);
  const sd = Math.sqrt(pa.sd ** 2 + pb.sd ** 2) || 1;
  const probBBetter = a.views + b.views === 0 ? 0.5 : phi((pb.mean - pa.mean) / sd);
  const ma = metric === "revenue" ? a.rpv : a.cr;
  const mb = metric === "revenue" ? b.rpv : b.cr;
  const lift = ma > 0 ? (mb - ma) / ma : 0;
  const enoughData = a.views >= exp.minSample && b.views >= exp.minSample;
  const decisive = enoughData && (probBBetter >= 0.95 || probBBetter <= 0.05);
  return { a, b, metric, probBBetter, lift, enoughData, decisive, leader: decisive ? (probBBetter >= 0.95 ? "b" : "a") : null };
}

// ---------- lifecycle ----------
export function endExperiment(store: Store, expId: string, winner: VariantId | "none"): Store {
  const exp = store.experiments.find((e) => e.id === expId);
  if (!exp) return store;
  const ended: Experiment = { ...exp, status: "completed", winner, endedAt: new Date().toISOString() };
  const base = winner === "b" ? applyVariant(store, exp, "b") : store;
  return { ...base, experiments: store.experiments.map((e) => (e.id === expId ? ended : e)) };
}

/** Auto-promote decisive experiments that opted in. */
export function settle(store: Store): Store {
  let s = store;
  for (const e of store.experiments) {
    if (e.status !== "running" || !e.autoPromote) continue;
    const st = experimentStats(e);
    if (st.decisive && st.leader) s = endExperiment(s, e.id, st.leader);
  }
  return s;
}

function bump(store: Store, expId: string, v: VariantId, f: (x: Variant) => Variant): Store {
  return {
    ...store,
    experiments: store.experiments.map((e) => (e.id === expId ? { ...e, variants: e.variants.map((x) => (x.id === v ? f(x) : x)) as [Variant, Variant] } : e)),
  };
}

export function recordExposures(store: Store, visitor: string, expIds: string[]): Store {
  let s = store;
  for (const id of expIds) {
    const e = s.experiments.find((x) => x.id === id);
    if (e && e.status === "running") s = bump(s, id, assign(e, visitor), (x) => ({ ...x, views: x.views + 1 }));
  }
  return settle(s);
}

export function recordConversion(store: Store, visitor: string, expIds: string[], revenueCents: number): Store {
  let s = store;
  for (const id of expIds) {
    const e = s.experiments.find((x) => x.id === id);
    if (e && e.status === "running") s = bump(s, id, assign(e, visitor), (x) => ({ ...x, conversions: x.conversions + 1, revenueCents: x.revenueCents + revenueCents }));
  }
  return settle(s);
}

// ---------- creation ----------
export const KIND_LABEL: Record<ExperimentKind, string> = {
  headline: "Homepage headline",
  price: "Product price",
  free_shipping: "Free-shipping threshold",
  popup_offer: "Popup discount",
};

export function controlValue(store: Store, kind: ExperimentKind, productId?: string): string | number {
  switch (kind) {
    case "headline":
      return store.heroHeadline;
    case "price":
      return store.products.find((p) => p.id === productId)?.priceCents ?? 0;
    case "free_shipping":
      return store.freeShippingCents;
    case "popup_offer":
      return store.popup.percent;
  }
}

export function conflict(store: Store, kind: ExperimentKind, productId?: string): string | null {
  const clash = store.experiments.find((e) => e.status !== "completed" && e.kind === kind && (kind !== "price" || e.productId === productId));
  return clash ? `"${clash.name}" is already testing this. End it first.` : null;
}

export function newExperiment(store: Store, kind: ExperimentKind, bValue: string | number, opts: { name?: string; productId?: string; autoPromote?: boolean; minSample?: number }): Experiment {
  const variant = (id: VariantId, value: string | number): Variant => ({ id, value, views: 0, conversions: 0, revenueCents: 0, simulatedViews: 0 });
  const product = store.products.find((p) => p.id === opts.productId);
  return {
    id: uid(),
    name: opts.name?.trim() || (kind === "price" && product ? `${product.title} price` : KIND_LABEL[kind]),
    kind,
    productId: opts.productId,
    status: "running",
    autoPromote: opts.autoPromote ?? true,
    minSample: opts.minSample ?? 100,
    variants: [variant("a", controlValue(store, kind, opts.productId)), variant("b", bValue)],
    createdAt: new Date().toISOString(),
  };
}

// ---------- traffic simulation (clearly labelled in the UI) ----------
function rng(seed: number) {
  let t = seed || 1;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Plausible "true" behaviour per variant, so simulated results look like a real test. */
function trueModel(store: Store, exp: Experiment, v: Variant): { cr: number; order: number } {
  const baseCr = 0.032;
  const active = store.products.filter((p) => p.status === "active");
  const avgPrice = active.length ? active.reduce((a, p) => a + p.priceCents, 0) / active.length : 3000;
  const a = exp.variants[0];
  switch (exp.kind) {
    case "headline": {
      // hidden effect between -25% and +45%, fixed per experiment
      const effect = v.id === "a" ? 0 : ((hash(exp.id) % 70) - 25) / 100;
      return { cr: baseCr * (1 + effect), order: avgPrice * 1.4 };
    }
    case "price": {
      const ratio = Number(a.value) / Math.max(1, Number(v.value));
      return { cr: baseCr * Math.pow(ratio, 1.6), order: avgPrice * 1.4 - Number(a.value) + Number(v.value) };
    }
    case "free_shipping": {
      // lower threshold -> more buyers, slightly smaller baskets
      const ratio = Number(a.value) / Math.max(100, Number(v.value));
      return { cr: baseCr * Math.pow(ratio, 0.35), order: avgPrice * 1.4 * Math.pow(1 / ratio, 0.15) };
    }
    case "popup_offer": {
      const pct = Number(v.value);
      return { cr: baseCr * (1 + pct * 0.025), order: avgPrice * 1.4 * (1 - pct / 100) };
    }
  }
}

export function simulateTraffic(store: Store, expId: string, visitors: number): Store {
  const exp = store.experiments.find((e) => e.id === expId);
  if (!exp || exp.status !== "running") return store;
  const r = rng(hash(expId + exp.variants[0].views + exp.variants[1].views));
  const models = exp.variants.map((v) => trueModel(store, exp, v));
  const next = exp.variants.map((v) => ({ ...v })) as [Variant, Variant];
  for (let i = 0; i < visitors; i++) {
    const k = r() < 0.5 ? 0 : 1;
    next[k].views++;
    next[k].simulatedViews++;
    if (r() < models[k].cr) {
      next[k].conversions++;
      next[k].revenueCents += Math.round(models[k].order * (0.7 + r() * 0.6));
    }
  }
  return settle({ ...store, experiments: store.experiments.map((e) => (e.id === expId ? { ...e, variants: next } : e)) });
}
