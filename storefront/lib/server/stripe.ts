/**
 * Stripe, called directly over HTTPS (no extra package).
 *
 * Flow: our checkout collects name + address, then sends the shopper to Stripe's own payment page (Stripe Checkout).
 * Card numbers only ever go to Stripe. When Stripe says it's paid (redirect back + webhook), we record the order.
 *
 * Settings (.env.local):
 *   STRIPE_SECRET_KEY      sk_test_... while testing, sk_live_... when you go live
 *   STRIPE_WEBHOOK_SECRET  whsec_... from the webhook you add in Stripe (Developers → Webhooks), pointing at /api/stripe/webhook
 *   PUBLIC_URL             e.g. https://yourshop.com (where Stripe sends shoppers back to)
 * STRIPE_FAKE=1 is a test double used by the automated tests: nothing is sent anywhere.
 */
import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import type { OrderItem } from "../types";

const API = "https://api.stripe.com/v1";
const fake = () => process.env.STRIPE_FAKE === "1";
export const stripeEnabled = () => fake() || !!process.env.STRIPE_SECRET_KEY;
export const stripeTestMode = () => fake() || (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_test_");

export class StripeError extends Error {}

/** Stripe wants form-encoded bodies with bracket keys: line_items[0][price_data][currency]=usd */
function form(obj: Record<string, unknown>, prefix = "", out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === "object") form(v as Record<string, unknown>, key, out);
    else out.append(key, String(v));
  }
  return out;
}

async function call<T>(method: "GET" | "POST", path: string, params?: Record<string, unknown>, idempotencyKey?: string): Promise<T> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new StripeError("Stripe isn't set up.");
  const body = params ? form(params) : undefined;
  const url = method === "GET" && body ? `${API}${path}?${body}` : `${API}${path}`;
  const r = await fetch(url, {
    method,
    headers: { authorization: `Bearer ${key}`, "content-type": "application/x-www-form-urlencoded", ...(idempotencyKey ? { "idempotency-key": idempotencyKey } : {}) },
    body: method === "POST" ? body : undefined,
    cache: "no-store",
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    console.error("Stripe error", r.status, data?.error?.type, data?.error?.code);
    throw new StripeError(data?.error?.type === "card_error" ? data.error.message : "The payment service had a problem. Please try again.");
  }
  return data as T;
}

export type CreatedSession = { id: string; url: string };

export async function createCheckout(opts: {
  slug: string;
  storeName: string;
  items: OrderItem[];
  totals: { discountCents: number; shippingCents: number; total: number };
  email: string;
  origin: string;
}): Promise<CreatedSession> {
  const back = `${opts.origin}/store/${opts.slug}`;
  if (fake()) {
    const id = `cs_test_fake_${randomUUID().replace(/-/g, "")}`;
    return { id, url: `${back}/order/confirm?session_id=${id}` };
  }
  const ref = randomUUID();
  // a discount becomes a one-time Stripe coupon for this checkout, so Stripe's total matches ours exactly
  let coupon: string | undefined;
  if (opts.totals.discountCents > 0) {
    const c = await call<{ id: string }>("POST", "/coupons", { amount_off: opts.totals.discountCents, currency: "usd", duration: "once", max_redemptions: 1, name: "Discount" }, `${ref}-coupon`);
    coupon = c.id;
  }
  const s = await call<{ id: string; url: string }>(
    "POST",
    "/checkout/sessions",
    {
      mode: "payment",
      customer_email: opts.email,
      client_reference_id: opts.slug,
      success_url: `${back}/order/confirm?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${back}/checkout?canceled=1`,
      line_items: opts.items.map((i) => ({
        quantity: i.qty,
        price_data: { currency: "usd", unit_amount: i.unitCents, product_data: { name: `${i.title}${i.variant ? ` (${i.variant})` : ""}`.slice(0, 250) } },
      })),
      discounts: coupon ? [{ coupon }] : undefined,
      shipping_options: [{ shipping_rate_data: { type: "fixed_amount", display_name: opts.totals.shippingCents ? "Shipping" : "Free shipping", fixed_amount: { amount: opts.totals.shippingCents, currency: "usd" } } }],
      metadata: { slug: opts.slug },
      payment_intent_data: { metadata: { slug: opts.slug }, statement_descriptor_suffix: opts.storeName.replace(/[^A-Za-z0-9 ]/g, "").slice(0, 22) || undefined },
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour to pay
    },
    `${ref}-session`,
  );
  return { id: s.id, url: s.url };
}

export type PaidSession = { id: string; paid: boolean; slug?: string; amount: number; paymentIntent?: string; label: string; feeCents?: number; test: boolean };

/** Ask Stripe whether a checkout was paid (never trust the browser's word for it). */
export async function getCheckout(id: string): Promise<PaidSession> {
  if (!/^cs_(test|live)_[A-Za-z0-9_]{10,200}$/.test(id)) throw new StripeError("Unknown checkout.");
  if (fake()) {
    if (!id.startsWith("cs_test_fake_")) throw new StripeError("Unknown checkout.");
    return { id, paid: true, amount: -1, label: "Visa •••• 4242 (test)", test: true };
  }
  type S = {
    id: string;
    payment_status: string;
    amount_total: number;
    livemode: boolean;
    metadata?: { slug?: string };
    payment_intent?: { id: string; latest_charge?: { payment_method_details?: { type?: string; card?: { brand?: string; last4?: string; wallet?: { type?: string } } }; balance_transaction?: { fee?: number } | null } } | null;
  };
  const s = await call<S>("GET", `/checkout/sessions/${id}`, { expand: ["payment_intent.latest_charge.balance_transaction"] });
  const ch = s.payment_intent?.latest_charge;
  const card = ch?.payment_method_details?.card;
  const wallet = card?.wallet?.type;
  const brand = card?.brand ? card.brand[0].toUpperCase() + card.brand.slice(1) : "";
  const label = card ? `${wallet === "apple_pay" ? "Apple Pay · " : wallet === "google_pay" ? "Google Pay · " : ""}${brand} •••• ${card.last4}` : (ch?.payment_method_details?.type ?? "Stripe");
  return {
    id: s.id,
    paid: s.payment_status === "paid",
    slug: s.metadata?.slug,
    amount: s.amount_total,
    paymentIntent: s.payment_intent?.id,
    label: `${label}${s.livemode ? "" : " (test)"}`,
    feeCents: ch?.balance_transaction?.fee ?? undefined,
    test: !s.livemode,
  };
}

export async function refundPayment(paymentIntent: string | undefined, sessionId: string) {
  if (fake() || sessionId.startsWith("cs_test_fake_")) return;
  if (!paymentIntent) throw new StripeError("This order has no Stripe payment to refund.");
  await call("POST", "/refunds", { payment_intent: paymentIntent }, `refund-${paymentIntent}`);
}

/** Check a webhook really came from Stripe (signed with your webhook secret, at most 5 minutes old). */
export function verifyWebhook(raw: string, header: string | null): boolean {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !header) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]).filter((p) => p.length === 2 && p[0] === "t"));
  const t = Number(parts.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > 300) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(`${t}.${raw}`).digest("hex"));
  return header
    .split(",")
    .filter((p) => p.startsWith("v1="))
    .some((p) => {
      const got = Buffer.from(p.slice(3));
      return got.length === expected.length && timingSafeEqual(got, expected);
    });
}
