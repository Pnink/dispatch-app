/**
 * Stripe → this app. Add it in Stripe: Developers → Webhooks → Add endpoint → https://yourshop.com/api/stripe/webhook,
 * event "checkout.session.completed" (and "checkout.session.async_payment_succeeded"). Put the signing secret in
 * STRIPE_WEBHOOK_SECRET. This records the order even if the shopper closes the tab before coming back.
 */
import type { NextRequest } from "next/server";
import { json } from "@/lib/server/http";
import { verifyWebhook } from "@/lib/server/stripe";
import { finalizeCheckout } from "@/lib/server/orders";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (raw.length > 1_000_000 || !verifyWebhook(raw, req.headers.get("stripe-signature"))) return json({ error: "Bad signature." }, 400);
  let event: { type?: string; data?: { object?: { id?: string; metadata?: { slug?: string } } } };
  try {
    event = JSON.parse(raw);
  } catch {
    return json({ error: "Bad body." }, 400);
  }
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const s = event.data?.object;
    if (s?.id && s.metadata?.slug) {
      const out = await finalizeCheckout(s.metadata.slug, s.id).catch((e) => ({ ok: false as const, error: String(e), status: 500 }));
      // 402 = not paid yet (async methods): fine, the async_payment_succeeded event comes later
      if (!out.ok && out.status >= 500) return json({ error: "Try again." }, 500);
    }
  }
  return json({ received: true });
}
