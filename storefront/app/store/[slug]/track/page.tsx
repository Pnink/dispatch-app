"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { Package, Truck } from "lucide-react";
import { trackOrder, useShopperStore, type TrackResult } from "@/lib/store";
import { cx } from "@/lib/format";
import { headingFont } from "@/components/storefront";

export default function TrackPage() {
  const { slug } = useParams<{ slug: string }>();
  const store = useShopperStore(slug);
  const [number, setNumber] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [r, setR] = useState<TrackResult | null>(null);
  if (!store) return null;
  const field = "h-11 w-full rounded-md border border-[color-mix(in_srgb,var(--s-text)_25%,transparent)] bg-transparent px-3 text-sm outline-none focus:border-[var(--s-accent)]";
  const status = r ? (r.status === "refunded" ? "Refunded" : r.tracking ? "Shipped" : "Being prepared") : "";

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <h1 className={cx("text-3xl", headingFont(store))}>Track your order</h1>
      <p className="mt-2 text-sm opacity-70">Enter your order number and the email you used at checkout.</p>
      <form
        className="mt-6 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          const out = await trackOrder(slug, number, email);
          setBusy(false);
          if (out.ok) setR(out.data);
          else {
            setR(null);
            setError(out.error);
          }
        }}
      >
        <div>
          <label htmlFor="t-num" className="mb-1 block text-xs opacity-70">Order number</label>
          <input id="t-num" inputMode="numeric" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="e.g. 1004" className={field} />
        </div>
        <div>
          <label htmlFor="t-email" className="mb-1 block text-xs opacity-70">Email</label>
          <input id="t-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
        </div>
        <button type="submit" disabled={busy || !number || !email} className="h-11 w-full rounded-md bg-[var(--s-accent)] text-sm font-medium text-[var(--s-on-accent)] disabled:opacity-50">{busy ? "Looking…" : "Find my order"}</button>
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      </form>

      {r && (
        <section className="mt-8 rounded-xl bg-[var(--s-soft)] p-6" aria-label="Order status">
          <div className="flex items-center gap-3">
            {r.tracking ? <Truck className="h-6 w-6 text-[var(--s-accent)]" aria-hidden /> : <Package className="h-6 w-6 text-[var(--s-accent)]" aria-hidden />}
            <div>
              <div className="font-semibold">Order #{r.number}: {status}</div>
              <div className="text-xs opacity-60">Placed {new Date(r.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
          {r.tracking ? (
            <p className="mt-4 text-sm">
              {r.tracking.carrier} tracking <span className="font-mono">{r.tracking.number}</span>
              <a href={r.tracking.url} target="_blank" rel="noopener noreferrer" className="mt-3 block w-fit rounded-md bg-[var(--s-accent)] px-4 py-2 text-sm font-medium text-[var(--s-on-accent)]">Track package</a>
            </p>
          ) : (
            r.status !== "refunded" && <p className="mt-4 text-sm opacity-75">We&apos;re getting it ready. Orders ship within {store.business.processingDays}; your tracking number will appear here.</p>
          )}
          <ul className="mt-4 space-y-1 border-t border-[color-mix(in_srgb,var(--s-text)_12%,transparent)] pt-3 text-sm opacity-80">
            {r.items.map((i, k) => <li key={k}>{i.qty} × {i.title}{i.variant ? ` (${i.variant})` : ""}</li>)}
          </ul>
        </section>
      )}
    </div>
  );
}
