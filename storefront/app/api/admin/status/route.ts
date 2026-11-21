/** Owner-only: which outside services are switched on (never returns the keys themselves). */
import { json } from "@/lib/server/http";
import { stripeEnabled, stripeTestMode } from "@/lib/server/stripe";
import { mailEnabled } from "@/lib/server/mail";

export const dynamic = "force-dynamic";

export async function GET() {
  return json({
    stripe: !stripeEnabled() ? "off" : stripeTestMode() ? "test" : "live",
    webhook: !!process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_FAKE === "1",
    publicUrl: process.env.PUBLIC_URL || null,
    mail: mailEnabled(),
  });
}
