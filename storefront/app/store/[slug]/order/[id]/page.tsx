"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle2, Gift } from "lucide-react";
import { isOwner, readPlacedOrder, useShopperStore } from "@/lib/store";
import { money, cx } from "@/lib/format";
import { headingFont } from "@/components/storefront";

export default function OrderConfirmed() {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const store = useShopperStore(slug);
  if (!store) return null;
  // shown from this browser's session only: order details are never readable by URL alone
  const order = readPlacedOrder(id);
  const base = `/store/${store.slug}`;
  if (!order)
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className={cx("text-3xl", headingFont(store))}>Thanks for your order</h1>
        <Link href={base} className="mt-6 inline-block underline">Back to the shop</Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <CheckCircle2 className="h-12 w-12 text-[var(--s-accent)]" aria-hidden />
      <h1 className={cx("mt-4 text-4xl", headingFont(store))}>Thank you, {order.customer.name.split(" ")[0]}!</h1>
      <p className="mt-3 opacity-75">Order #{order.number} is confirmed. A receipt is on its way to {order.customer.email} (simulated).</p>

      {store.apps.loyalty && order.pointsEarned > 0 && (
        <div className="mt-8 flex items-center gap-4 rounded-xl bg-[var(--s-accent)] p-5 text-[var(--s-on-accent)]">
          <Gift className="h-8 w-8 shrink-0" aria-hidden />
          <div>
            <div className="font-semibold">You earned {order.pointsEarned} points</div>
            <div className="text-sm opacity-90">They&apos;re saved to {order.customer.email} for your next order.</div>
          </div>
        </div>
      )}

      <section className="mt-8 rounded-xl bg-[var(--s-soft)] p-6">
        <ul className="space-y-2 text-sm">
          {order.items.map((i, k) => (
            <li key={k} className="flex justify-between gap-3">
              <span>{i.title}{i.variant && <span className="opacity-60"> · {i.variant}</span>} × {i.qty}</span>
              <span className="tabular-nums">{money(i.unitCents * i.qty)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1 border-t border-[color-mix(in_srgb,var(--s-text)_12%,transparent)] pt-4 text-sm">
          {order.discountCents > 0 && <div className="flex justify-between"><dt className="opacity-70">Discount</dt><dd>−{money(order.discountCents)}</dd></div>}
          <div className="flex justify-between"><dt className="opacity-70">Shipping</dt><dd>{order.shippingCents ? money(order.shippingCents) : "Free"}</dd></div>
          <div className="flex justify-between text-base font-semibold"><dt>Total paid</dt><dd>{money(order.totalCents)}</dd></div>
          <div className="flex justify-between opacity-70"><dt>Payment</dt><dd>{order.paymentMethod}</dd></div>
        </dl>
        <div className="mt-4 text-sm opacity-75">
          Shipping to: {order.customer.address}, {order.customer.city} {order.customer.zip}, {order.customer.country}
        </div>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={base} className="rounded-md bg-[var(--s-accent)] px-5 py-3 text-sm font-medium text-[var(--s-on-accent)]">Continue shopping</Link>
        {isOwner() && <Link href={`/dashboard/orders?id=${order.id}`} className="rounded-md border border-[color-mix(in_srgb,var(--s-text)_25%,transparent)] px-5 py-3 text-sm">See it in your dashboard →</Link>}
      </div>
    </div>
  );
}
