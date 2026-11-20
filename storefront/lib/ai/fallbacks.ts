/**
 * Free, rule-based versions of each specialist (used when no AI model is selected).
 * Honest and conservative: they never invent facts, they work only from the store's own data.
 */
import type { Context, Input, SpecialistId } from "./specialists";

const dollars = (c: number) => `$${(c / 100).toFixed(c % 100 ? 2 : 0)}`;

/* eslint-disable @typescript-eslint/no-explicit-any */
export function fallback(id: SpecialistId, input: Input, ctx: Context): any {
  const name = ctx.store.name;
  switch (id) {
    case "product_copy": {
      const p = ctx.products.find((x) => x.id === input.productId);
      if (!p) return { title: "", description: "", bullets: [], seoTitle: "", metaDescription: "" };
      const title = p.title.replace(/\s+/g, " ").trim();
      const bullets = [
        ...p.bullets,
        ...(p.variants.length ? [`Options: ${p.variants.join(", ")}`] : []),
        `Ships in 1–3 business days`,
        `30-day returns on unused items`,
      ].slice(0, 5);
      return {
        title,
        description: p.description || `${title}.`,
        bullets,
        seoTitle: `${title} | ${name}`.slice(0, 60),
        metaDescription: `${title} from ${name}. ${ctx.store.freeShippingOverCents ? `Free shipping over ${dollars(ctx.store.freeShippingOverCents)}. ` : ""}Ships in 1–3 business days.`.slice(0, 155),
      };
    }
    case "pricing": {
      const suggestions = ctx.products
        .filter((p) => p.status === "active" && (!input.productId || p.id === input.productId))
        .map((p) => {
          if (p.unitsSold >= 5 && p.stock < 10)
            return { productId: p.id, suggestedCents: Math.round((p.priceCents * 1.15) / 100) * 100, reasoning: `Sold ${p.unitsSold} and only ${p.stock} left: there may be room to charge more. Test it rather than guess.`, confidence: "medium", testInstead: true };
          if (ctx.sales.orders >= 10 && p.unitsSold === 0)
            return { productId: p.id, suggestedCents: Math.max(100, Math.round((p.priceCents * 0.85) / 100) * 100), reasoning: "Other products sell but this one hasn't. Check its photo and description first; a lower-price test shows whether price is the blocker.", confidence: "low", testInstead: true };
          return null;
        })
        .filter(Boolean)
        .slice(0, 3);
      return {
        summary: suggestions.length ? "Based on sales and stock so far." : "Not enough sales yet to suggest price changes. Revisit after your first 10–20 orders.",
        suggestions,
        needToKnow: ["Your cost per item, so suggestions keep a healthy margin"],
      };
    }
    case "email": {
      const f = ctx.flows.find((x) => x.kind === input.kind);
      const first = ctx.products[0]?.title ?? "your favourite";
      const T: Record<string, { subject: string; preheader: string; body: string }> = {
        welcome: { subject: `Welcome to ${name}`, preheader: "Here's where to start.", body: `Hi there,\n\nThanks for joining us. If you're not sure where to start, ${first} is a good first pick.${ctx.discounts[0] ? `\n\nUse ${ctx.discounts[0].code} for ${ctx.discounts[0].percent}% off your first order.` : ""}\n\n— ${name}` },
        abandoned_checkout: { subject: "You left something in your cart", preheader: "It's saved for you.", body: `Hi there,\n\nYour cart is saved whenever you're ready to finish.${ctx.store.freeShippingOverCents ? ` Shipping is free on orders over ${dollars(ctx.store.freeShippingOverCents)}.` : ""}\n\n— ${name}` },
        post_purchase: { subject: "Thanks for your order", preheader: "Here's what happens next.", body: `Hi there,\n\nThanks for ordering from ${name}. We'll email you as soon as it ships (usually within 1–3 business days).\n\n— ${name}` },
        review_request: { subject: `How's your order from ${name}?`, preheader: "A quick review helps a lot.", body: `Hi there,\n\nYou've had your order for about a week. Would you leave a quick review? It takes a minute and helps a small shop a lot.\n\n— ${name}` },
      };
      return T[input.kind ?? "welcome"] ?? { subject: f?.subject ?? "", preheader: "", body: f?.body ?? "" };
    }
    case "experiments": {
      const running = new Set(ctx.experiments.filter((e) => e.status !== "completed").map((e) => e.kind));
      const tried = new Set(ctx.experiments.map((e) => e.kind));
      const ideas: any[] = [];
      const best = [...ctx.products].sort((a, b) => b.unitsSold - a.unitsSold)[0];
      if (!running.has("free_shipping") && !tried.has("free_shipping") && ctx.store.freeShippingOverCents && ctx.sales.averageOrderCents) {
        const target = Math.max(1, Math.round((ctx.sales.averageOrderCents * 1.15) / 500) * 5);
        if (target * 100 !== ctx.store.freeShippingOverCents)
          ideas.push({ kind: "free_shipping", productId: null, bValue: String(target), hypothesis: `Because the average order is ${dollars(ctx.sales.averageOrderCents)}, a free-shipping threshold of $${target} will nudge carts just over it.`, why: "Thresholds work best a little above the typical order." });
      }
      if (!running.has("headline") && !tried.has("headline"))
        ideas.push({ kind: "headline", productId: null, bValue: best ? `${best.title}, made to be used every day` : `New from ${name}`, hypothesis: "Naming the best seller in the headline will make the first click more obvious.", why: "Specific headlines usually beat general ones." });
      if (best && best.unitsSold >= 5 && !ctx.experiments.some((e) => e.kind === "price" && e.status !== "completed"))
        ideas.push({ kind: "price", productId: best.id, bValue: String(Math.round((best.priceCents * 1.15) / 100)), hypothesis: `${best.title} sells steadily; a 15% higher price may raise revenue per visitor.`, why: "Test price on the product with the most traffic." });
      return { ideas: ideas.slice(0, 3) };
    }
    case "seo":
      return {
        items: ctx.products
          .filter((p) => p.status === "active")
          .map((p) => ({ productId: p.id, seoTitle: `${p.title} | ${name}`.slice(0, 60), metaDescription: `${p.title} from ${name}. ${(p.description || "").split(/(?<=\.)\s/)[0] ?? ""}`.trim().slice(0, 155) })),
      };
    case "support":
      return { reply: `Hi there,\n\nThanks for getting in touch — we'll look into this right away and get back to you shortly.\n\n— ${name}`, needsOwner: true, reason: "Free rules can't read the message properly — choose an AI model for real drafts." };
  }
}
