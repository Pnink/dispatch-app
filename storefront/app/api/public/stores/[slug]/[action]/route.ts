/**
 * Shopper actions. Everything here is untrusted input from the internet:
 * validated, size-capped, rate-limited, and priced from the server's own data.
 */
import { randomUUID } from "crypto";
import type { NextRequest } from "next/server";
import { readDB, updateStoreOnServer } from "@/lib/server/db";
import { body, json, rateLimit, sameOrigin } from "@/lib/server/http";
import { applySubscriber, applyVisit, cleanCustomer, cleanForced, cleanLines, cleanReview, commitOrder, isEmail, orderItems, quoteOrder, type OrderInput } from "@/lib/commerce";
import { createCheckout, stripeEnabled, StripeError } from "@/lib/server/stripe";
import { finalizeCheckout } from "@/lib/server/orders";
import { chargeCard, type CardInput } from "@/lib/payments";
import { shopperView } from "@/lib/experiments";
import { cartTotals } from "@/lib/commerce";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string; action: string }> };
const visitorOk = (v: unknown): v is string => typeof v === "string" && /^[a-z0-9]{6,40}$/i.test(v);

export async function POST(req: NextRequest, { params }: Ctx) {
  const { slug, action } = await params;
  if (!sameOrigin(req)) return json({ error: "Bad origin." }, 403);
  if (!rateLimit(`shop:${action}`, req, action === "visit" ? 120 : action === "track" ? 10 : 30, 60_000)) return json({ error: "Too many requests. Slow down a little." }, 429);
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
      // ---- real payments: hand the shopper to Stripe's payment page; the order is recorded once Stripe confirms ----
      if (stripeEnabled()) {
        const store = (await readDB()).stores.find((s) => s.slug === slug);
        if (!store) return json({ error: "Store not found." }, 404);
        const q = quoteOrder(store, input);
        if ("error" in q) return json({ error: q.error }, 400);
        const items = orderItems(q.view, lines);
        const origin = (process.env.PUBLIC_URL || req.nextUrl.origin).replace(/\/$/, "");
        try {
          const session = await createCheckout({ slug, storeName: store.name, items, totals: q.totals, email: customer.email, origin });
          const t = q.totals;
          const saved = await updateStoreOnServer(slug, async (s) => ({
            store: { ...s, pending: [{ id: session.id, createdAt: new Date().toISOString(), input, items, totals: { subtotal: t.subtotal, discountCents: t.discountCents, shippingCents: t.shippingCents, total: t.total } }, ...s.pending].slice(0, 500) },
            result: true,
          }));
          if (!saved.ok) return json({ error: saved.error }, saved.status);
          return json({ redirect: session.url });
        } catch (e) {
          return json({ error: e instanceof StripeError ? e.message : "Couldn't start the payment. Please try again." }, 502);
        }
      }

      // ---- demo payments (no Stripe key yet) ----
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
        const { store, order } = commitOrder(s, orderItems(q.view, input.lines), input, q.totals, charge.label, randomUUID());
        return { store, result: order };
      });
      return out.ok ? json({ order: out.result }) : json({ error: out.error }, out.status === 404 ? 404 : 400);
    }

    case "confirm": {
      // back from Stripe: check with Stripe that it's paid, then record the order (same as the webhook does)
      const sid = typeof b.session === "string" ? b.session.slice(0, 255) : "";
      if (!stripeEnabled() || !sid) return json({ error: "Bad request." }, 400);
      try {
        const out = await finalizeCheckout(slug, sid);
        return out.ok ? json({ order: out.order }) : json({ error: out.error }, out.status);
      } catch (e) {
        return json({ error: e instanceof StripeError ? e.message : "Couldn't confirm the payment." }, 502);
      }
    }

    case "track": {
      // order lookup for customers: needs the order number AND the email it was placed with
      const num = Number(b.number);
      const email = typeof b.email === "string" ? b.email.trim().toLowerCase().slice(0, 254) : "";
      if (!Number.isInteger(num) || !isEmail(email)) return json({ error: "Enter your order number and email." }, 400);
      const store = (await readDB()).stores.find((s) => s.slug === slug);
      const o = store?.orders.find((x) => x.number === num && x.customer.email.toLowerCase() === email);
      if (!o) return json({ error: "We couldn't find that order. Check the number and the email you used." }, 404);
      return json({
        number: o.number,
        status: o.status,
        createdAt: o.createdAt,
        items: o.items.map((i) => ({ title: i.title, variant: i.variant, qty: i.qty })),
        tracking: o.tracking ? { number: o.tracking.number, carrier: o.tracking.carrier, url: o.tracking.url, addedAt: o.tracking.addedAt } : null,
      });
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
