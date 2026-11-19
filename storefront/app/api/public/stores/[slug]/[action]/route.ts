/**
 * Shopper actions. Everything here is untrusted input from the internet:
 * validated, size-capped, rate-limited, and priced from the server's own data.
 */
import { randomUUID } from "crypto";
import type { NextRequest } from "next/server";
import { readDB, updateStoreOnServer } from "@/lib/server/db";
import { body, json, rateLimit, sameOrigin } from "@/lib/server/http";
import { applySubscriber, applyVisit, cleanCustomer, cleanForced, cleanLines, cleanReview, commitOrder, isEmail, quoteOrder, type OrderInput } from "@/lib/commerce";
import { chargeCard, type CardInput } from "@/lib/payments";
import { shopperView } from "@/lib/experiments";
import { cartTotals } from "@/lib/commerce";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string; action: string }> };
const visitorOk = (v: unknown): v is string => typeof v === "string" && /^[a-z0-9]{6,40}$/i.test(v);

export async function POST(req: NextRequest, { params }: Ctx) {
  const { slug, action } = await params;
  if (!sameOrigin(req)) return json({ error: "Bad origin." }, 403);
  if (!rateLimit(`shop:${action}`, req, action === "visit" ? 120 : 30, 60_000)) return json({ error: "Too many requests. Slow down a little." }, 429);
  const b = await body<Record<string, unknown>>(req, 20_000);
  if (!b) return json({ error: "Bad request." }, 400);

  switch (action) {
    case "visit": {
      if (!visitorOk(b.visitor) || !Array.isArray(b.experiments)) return json({ error: "Bad request." }, 400);
      const ids = b.experiments.filter((x): x is string => typeof x === "string");
      const out = await updateStoreOnServer(slug, async (s) => ({ store: applyVisit(s, b.visitor as string, ids), result: true }));
      return out.ok ? json({ ok: true }) : json({ error: out.error }, out.status);
    }

    case "quote": {
      // checkout totals, including whether a discount code is valid (codes are never sent to browsers)
      const lines = cleanLines(b.lines);
      if (typeof lines === "string") return json({ error: lines }, 400);
      const store = (await readDB()).stores.find((s) => s.slug === slug);
      if (!store?.published) return json({ error: "Store not found." }, 404);
      const view = shopperView(store, visitorOk(b.visitor) ? b.visitor : "anon", cleanForced(b.forced));
      const code = typeof b.code === "string" ? b.code.slice(0, 40) : "";
      const t = cartTotals(view, lines, code);
      return json({ subtotal: t.subtotal, discountCents: t.discountCents, shippingCents: t.shippingCents, total: t.total, code: t.discount ? { code: t.discount.code, percent: t.discount.percent } : null });
    }

    case "order": {
      const lines = cleanLines(b.lines);
      if (typeof lines === "string") return json({ error: lines }, 400);
      const customer = cleanCustomer(b.customer);
      if (typeof customer === "string") return json({ error: customer }, 400);
      if (!visitorOk(b.visitor)) return json({ error: "Bad request." }, 400);
      const input: OrderInput = {
        lines,
        customer,
        code: typeof b.code === "string" ? b.code.slice(0, 40) : undefined,
        visitor: b.visitor,
        exposed: Array.isArray(b.exposed) ? b.exposed.filter((x): x is string => typeof x === "string").slice(0, 20) : [],
        forced: cleanForced(b.forced),
      };
      const p = (b.payment ?? {}) as Record<string, unknown>;
      const payment: CardInput =
        p.method === "card"
          ? { method: "card", number: String(p.number ?? "").slice(0, 23), expiry: String(p.expiry ?? "").slice(0, 5), cvc: String(p.cvc ?? "").slice(0, 4) }
          : p.method === "apple" || p.method === "google" || p.method === "paypal"
            ? { method: p.method }
            : { method: "card", number: "", expiry: "", cvc: "" };
      const out = await updateStoreOnServer(slug, async (s) => {
        const q = quoteOrder(s, input);
        if ("error" in q) return q.error;
        // Demo processor. With real payments this becomes a Stripe Checkout session + webhook, and card numbers never reach this server.
        const charge = await chargeCard(payment, q.totals.total);
        if (!charge.ok) return charge.error;
        const { store, order } = commitOrder(s, q.view, input, q.totals, charge.label, randomUUID());
        return { store, result: order };
      });
      return out.ok ? json({ order: out.result }) : json({ error: out.error }, out.status === 404 ? 404 : 400);
    }

    case "subscribe": {
      const email = typeof b.email === "string" ? b.email.trim().toLowerCase().slice(0, 254) : "";
      if (!isEmail(email)) return json({ error: "Enter a valid email address." }, 400);
      const out = await updateStoreOnServer(slug, async (s) => ({ store: applySubscriber(s, email), result: true }));
      return out.ok ? json({ ok: true }) : json({ error: out.error }, out.status);
    }

    case "review": {
      const out = await updateStoreOnServer(slug, async (s) => {
        const r = cleanReview(b, s);
        if (typeof r === "string") return r;
        return { store: { ...s, reviews: [{ id: randomUUID(), ...r }, ...s.reviews] }, result: true };
      });
      return out.ok ? json({ ok: true }) : json({ error: out.error }, out.status);
    }

    default:
      return json({ error: "Not found." }, 404);
  }
}
