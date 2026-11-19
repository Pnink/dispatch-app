/**
 * "Today" brief: what needs the owner's attention, ranked. Pure function of the store,
 * so it is always current and needs no background jobs.
 */
import { endExperiment, experimentStats } from "./experiments";
import type { Store } from "./types";

export type TodayItem = {
  id: string;
  priority: number; // higher first
  tone: "urgent" | "do" | "idea" | "good";
  title: string;
  detail: string;
  href?: string;
  action?: { label: string; run: (s: Store) => Store };
};

const hours = (iso: string) => (Date.now() - new Date(iso).getTime()) / 3_600_000;

export function todayBrief(store: Store): TodayItem[] {
  const items: TodayItem[] = [];

  if (!store.published)
    items.push({
      id: "publish",
      priority: 100,
      tone: "urgent",
      title: "Your store is hidden",
      detail: "Shoppers see a coming-soon page until you publish.",
      action: { label: "Publish now", run: (s) => ({ ...s, published: true }) },
    });

  const toShip = store.orders.filter((o) => o.status === "paid");
  if (toShip.length) {
    const oldest = Math.max(...toShip.map((o) => hours(o.createdAt)));
    items.push({
      id: "ship",
      priority: oldest > 24 ? 90 : 70,
      tone: oldest > 24 ? "urgent" : "do",
      title: `Ship ${toShip.length} order${toShip.length > 1 ? "s" : ""}`,
      detail: oldest > 24 ? `The oldest has waited ${Math.floor(oldest / 24)} day${oldest >= 48 ? "s" : ""}. Customers notice after two.` : "All placed in the last day.",
      href: "/dashboard/orders",
    });
  }

  const out = store.products.filter((p) => p.status === "active" && p.stock === 0);
  const low = store.products.filter((p) => p.status === "active" && p.stock > 0 && p.stock < 10);
  if (out.length || low.length) {
    const names = [...out, ...low].map((p) => `${p.title} (${p.stock})`).join(", ");
    items.push({
      id: "stock",
      priority: out.length ? 85 : 60,
      tone: out.length ? "urgent" : "do",
      title: out.length ? `${out.length} product${out.length > 1 ? "s are" : " is"} sold out` : `${low.length} product${low.length > 1 ? "s are" : " is"} running low`,
      detail: names,
      action: {
        label: "Restock to 50",
        run: (s) => ({ ...s, products: s.products.map((p) => (p.stock < 10 && p.status === "active" ? { ...p, stock: 50 } : p)) }),
      },
    });
  }

  for (const e of store.experiments.filter((x) => x.status === "running")) {
    const st = experimentStats(e);
    if (st.decisive && st.leader && !e.autoPromote) {
      items.push({
        id: `exp-${e.id}`,
        priority: 75,
        tone: "do",
        title: `“${e.name}” has a winner`,
        detail: `${st.leader.toUpperCase()} is ahead with 95%+ confidence.`,
        action: { label: `Roll out ${st.leader.toUpperCase()}`, run: (s) => endExperiment(s, e.id, st.leader!) },
      });
    } else if (!st.enoughData) {
      items.push({
        id: `exp-${e.id}`,
        priority: 20,
        tone: "idea",
        title: `“${e.name}” needs visitors`,
        detail: `${st.a.views + st.b.views} of ${e.minSample * 2} visitors so far.`,
        href: `/dashboard/experiments?id=${e.id}`,
      });
    }
  }
  const justDecided = store.experiments.filter((e) => e.status === "completed" && e.endedAt && hours(e.endedAt) < 48);
  for (const e of justDecided)
    items.push({
      id: `won-${e.id}`,
      priority: 15,
      tone: "good",
      title: e.winner === "b" ? `“${e.name}”: B won and is live` : `“${e.name}”: A kept`,
      detail: "Decided in the last two days.",
      href: `/dashboard/experiments?id=${e.id}`,
    });

  if (!store.experiments.some((e) => e.status === "running") && store.published)
    items.push({ id: "test", priority: 30, tone: "idea", title: "Nothing is being tested", detail: "A headline or free-shipping test is a cheap way to sell more.", href: "/dashboard/experiments" });

  if (!store.apps.popup)
    items.push({
      id: "popup",
      priority: 40,
      tone: "idea",
      title: "Grow your email list",
      detail: `${store.subscribers.length} subscriber${store.subscribers.length === 1 ? "" : "s"}. A first-order discount popup usually doubles sign-ups.`,
      action: { label: "Turn popup on", run: (s) => ({ ...s, apps: { ...s.apps, popup: true } }) },
    });

  const reviewFlow = store.flows.find((f) => f.kind === "review_request");
  if (store.apps.reviews && reviewFlow && !reviewFlow.enabled && store.orders.length > 0)
    items.push({
      id: "reviews",
      priority: 35,
      tone: "idea",
      title: "Ask buyers for reviews",
      detail: "The review-request email is off. Reviews are the cheapest trust you can buy.",
      action: { label: "Switch it on", run: (s) => ({ ...s, flows: s.flows.map((f) => (f.kind === "review_request" ? { ...f, enabled: true } : f)) }) },
    });

  const repeat = new Map<string, number>();
  store.orders.forEach((o) => repeat.set(o.customer.email, (repeat.get(o.customer.email) || 0) + 1));
  if (!store.apps.loyalty && [...repeat.values()].some((n) => n > 1))
    items.push({
      id: "loyalty",
      priority: 25,
      tone: "idea",
      title: "You have repeat customers",
      detail: "Loyalty points give them a reason to come back sooner.",
      action: { label: "Turn loyalty on", run: (s) => ({ ...s, apps: { ...s.apps, loyalty: true } }) },
    });

  const weekAgo = Date.now() - 7 * 86_400_000;
  const weekRevenue = store.orders.filter((o) => o.status !== "refunded" && new Date(o.createdAt).getTime() > weekAgo).reduce((a, o) => a + o.totalCents, 0);
  if (weekRevenue > 0) items.push({ id: "week", priority: 5, tone: "good", title: "Money in this week", detail: `$${(weekRevenue / 100).toFixed(2)} from the last 7 days.`, href: "/dashboard/orders" });

  return items.sort((a, b) => b.priority - a.priority);
}
