"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart, useShopperStore, writeCart } from "@/lib/store";
import { cartTotals } from "@/lib/commerce";
import { money, cx } from "@/lib/format";
import { ProductArt } from "@/components/ProductArt";
import { headingFont } from "@/components/storefront";

export default function CartPage() {
  const { slug } = useParams<{ slug: string }>();
  const store = useShopperStore(slug);
  const cart = useCart(slug);
  if (!store) return null;
  const base = `/store/${store.slug}`;
  // drop lines whose product was deleted
  const lines = cart.filter((l) => store.products.some((p) => p.id === l.productId));
  const t = cartTotals(store, lines);
  const toFree = store.freeShippingCents - t.subtotal;

  const setQty = (i: number, qty: number) => writeCart(slug, qty <= 0 ? lines.filter((_, j) => j !== i) : lines.map((l, j) => (j === i ? { ...l, qty } : l)));

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className={cx("text-3xl", headingFont(store))}>Your cart</h1>
      {lines.length === 0 ? (
        <div className="mt-10 rounded-xl bg-[var(--s-soft)] p-10 text-center">
          <p className="opacity-70">Your cart is empty.</p>
          <Link href={`${base}#shop`} className="mt-5 inline-block rounded-md bg-[var(--s-accent)] px-5 py-3 text-sm font-medium text-[var(--s-on-accent)]">Continue shopping</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-10 md:grid-cols-[1fr_300px]">
          <div>
            {store.freeShippingCents > 0 && (
              <div className="mb-6 rounded-lg bg-[var(--s-soft)] p-4 text-sm">
                {toFree > 0 ? <>You&apos;re <strong>{money(toFree)}</strong> away from free shipping.</> : <>You&apos;ve unlocked <strong>free shipping</strong>.</>}
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--s-text)_12%,transparent)]">
                  <div className="h-full bg-[var(--s-accent)]" style={{ width: `${Math.min(100, (t.subtotal / store.freeShippingCents) * 100)}%` }} />
                </div>
              </div>
            )}
            <ul className="divide-y divide-[color-mix(in_srgb,var(--s-text)_12%,transparent)]">
              {lines.map((l, i) => {
                const p = store.products.find((x) => x.id === l.productId)!;
                return (
                  <li key={`${l.productId}-${l.variant}`} className="flex gap-4 py-5">
                    <ProductArt image={p.image} seed={p.art} title={p.title} category={store.category} accent={store.palette.accent} soft={store.palette.soft} className="h-24 w-24 shrink-0 rounded-lg" />
                    <div className="flex flex-1 flex-col">
                      <div className="flex justify-between gap-3">
                        <Link href={`${base}/p/${p.id}`} className="font-medium hover:underline">{p.title}</Link>
                        <span className="tabular-nums">{money(p.priceCents * l.qty)}</span>
                      </div>
                      {l.variant && <span className="text-sm opacity-60">{l.variant}</span>}
                      <div className="mt-auto flex items-center gap-3 pt-2">
                        <div className="flex h-9 items-center rounded-md border border-[color-mix(in_srgb,var(--s-text)_25%,transparent)]">
                          <button onClick={() => setQty(i, l.qty - 1)} aria-label={`Decrease ${p.title}`} className="px-2.5"><Minus className="h-3.5 w-3.5" /></button>
                          <span className="w-6 text-center text-sm tabular-nums">{l.qty}</span>
                          <button onClick={() => setQty(i, Math.min(p.stock, l.qty + 1))} aria-label={`Increase ${p.title}`} className="px-2.5"><Plus className="h-3.5 w-3.5" /></button>
                        </div>
                        <button onClick={() => setQty(i, 0)} aria-label={`Remove ${p.title}`} className="opacity-60 hover:opacity-100"><Trash2 className="h-4 w-4" /></button>
                      </div>
                      {l.qty > p.stock && <p className="mt-1 text-xs text-red-600">Only {p.stock} left in stock.</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          <aside className="h-fit rounded-xl bg-[var(--s-soft)] p-5">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="opacity-70">Subtotal</dt><dd>{money(t.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="opacity-70">Shipping</dt><dd>{t.shippingCents ? money(t.shippingCents) : "Free"}</dd></div>
              <div className="flex justify-between border-t border-[color-mix(in_srgb,var(--s-text)_12%,transparent)] pt-2 text-base font-semibold"><dt>Estimated total</dt><dd>{money(t.total)}</dd></div>
            </dl>
            <Link href={`${base}/checkout`} className="mt-5 flex h-12 items-center justify-center rounded-md bg-[var(--s-accent)] font-medium text-[var(--s-on-accent)] hover:opacity-90">Check out</Link>
            <p className="mt-3 text-center text-xs opacity-60">Discount codes can be added at checkout.</p>
          </aside>
        </div>
      )}
    </div>
  );
}
