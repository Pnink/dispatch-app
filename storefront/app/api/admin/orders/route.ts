/** Owner-only (middleware): refunds through Stripe, and tracking numbers (+ customer email). */
import type { NextRequest } from "next/server";
import { body, json, sameOrigin } from "@/lib/server/http";
import { addTracking, refundOrderOnServer } from "@/lib/server/orders";
import { validTracking } from "@/lib/tracking";
import { mailEnabled } from "@/lib/server/mail";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return json({ error: "Bad origin." }, 403);
  const b = await body<{ slug?: string; orderId?: string; action?: string; number?: string; carrier?: string }>(req, 5_000);
  if (!b || typeof b.slug !== "string" || typeof b.orderId !== "string") return json({ error: "Bad request." }, 400);
  if (b.action === "refund") {
    const out = await refundOrderOnServer(b.slug, b.orderId);
    return out.ok ? json({ order: out.result }) : json({ error: out.error }, out.status);
  }
  if (b.action === "tracking") {
    if (typeof b.number !== "string" || !validTracking(b.number)) return json({ error: "That doesn't look like a tracking number." }, 400);
    const carrier = typeof b.carrier === "string" && ["ups", "usps", "fedex", "dhl", "other"].includes(b.carrier) ? b.carrier : undefined;
    const out = await addTracking(b.slug, b.orderId, b.number, carrier);
    return out.ok ? json({ order: out.order, emailed: out.emailed, message: out.message, mail: mailEnabled() }) : json({ error: out.error }, out.status);
  }
  return json({ error: "Unknown action." }, 400);
}
