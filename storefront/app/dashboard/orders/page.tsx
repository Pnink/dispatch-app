"use client";
import { Suspense, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ClipboardCopy, ExternalLink, Truck, X } from "lucide-react";
import { orderAction, setOrderStatus, useCurrentStore } from "@/lib/store";
import type { Order, OrderStatus, Store } from "@/lib/types";
import { orderProfit, totalProfit } from "@/lib/profit";
import { trackingMessage } from "@/lib/emails";
import { dateShort, money, cx } from "@/lib/format";
import { PageHeader, Panel } from "@/components/dashboard/PageHeader";
import { OrderStatusBadge } from "@/components/dashboard/OrderStatusBadge";
import { Button } from "@/components/ui";

const TABS: { label: string; value: OrderStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Unfulfilled", value: "paid" },
  { label: "Fulfilled", value: "fulfilled" },
  { label: "Refunded", value: "refunded" },
];

export default function OrdersPage() {
  return (
    <Suspense>
      <Orders />
    </Suspense>
  );
}

function Orders() {
  const store = useCurrentStore()!;
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [tab, setTab] = useState<OrderStatus | "all">("all");
  const [q, setQ] = useState("");
  const [refunding, setRefunding] = useState(false);
  const selectedId = params.get("id");
  const selected = store.orders.find((o) => o.id === selectedId);

  const rows = store.orders.filter(
    (o) => (tab === "all" || o.status === tab) && (!q || `${o.number} ${o.customer.name} ${o.customer.email}`.toLowerCase().includes(q.toLowerCase())),
  );
  const open = (id?: string) => router.replace(id ? `${pathname}?id=${id}` : pathname, { scroll: false });

  return (
    <>
      <PageHeader
        title="Orders"
        sub={`${store.orders.length} total · ${store.orders.filter((o) => o.status === "paid").length} waiting to ship`}
        actions={(() => {
          const t = totalProfit(store.orders, store);
          return store.orders.length ? <span className="text-sm text-muted" data-total-profit>Profit: <strong className={cx("tabular-nums", t.profit < 0 ? "text-danger" : "text-text")}>{money(t.profit)}</strong>{t.missing ? ` · ${t.missing} order${t.missing > 1 ? "s" : ""} missing a product cost` : ""}</span> : null;
        })()}
      />
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex gap-1" role="tablist">
            {TABS.map((t) => (
              <button key={t.value} role="tab" aria-selected={tab === t.value} onClick={() => setTab(t.value)} className={cx("rounded-md px-3 py-1.5 text-sm", tab === t.value ? "bg-surface font-medium" : "text-muted hover:text-text")}>
                {t.label}
              </button>
            ))}
          </div>
          <label className="sr-only" htmlFor="order-search">Search orders</label>
          <input id="order-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by number, name or email" className="h-9 w-64 max-w-full rounded-md border border-border-input/60 px-3 text-sm outline-none focus:border-accent" />
        </div>
        {rows.length === 0 ? (
          <p className="px-5 py-14 text-center text-sm text-muted">{store.orders.length ? "No orders match this filter." : "No orders yet. They'll appear here as soon as someone checks out."}</p>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface/60 text-xs text-muted">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Order</th>
                  <th className="px-2 font-medium">Date</th>
                  <th className="px-2 font-medium">Customer</th>
                  <th className="px-2 font-medium">Items</th>
                  <th className="px-2 font-medium">Status</th>
                  <th className="px-2 text-right font-medium">Total</th>
                  <th className="px-5 text-right font-medium">Profit</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => (
                  <tr key={o.id} onClick={() => open(o.id)} className={cx("cursor-pointer border-t border-border hover:bg-surface/60", o.id === selectedId && "bg-accent-soft")}>
                    <td className="px-5 py-3 font-medium">
                      <button onClick={(e) => { e.stopPropagation(); open(o.id); }} className="hover:underline">#{o.number}</button>
                    </td>
                    <td className="px-2 text-muted">{dateShort(o.createdAt)}</td>
                    <td className="px-2">{o.customer.name}</td>
                    <td className="px-2 text-muted">{o.items.reduce((a, i) => a + i.qty, 0)}</td>
                    <td className="px-2"><OrderStatusBadge status={o.status} /></td>
                    <td className="px-2 text-right tabular-nums">{money(o.totalCents)}</td>
                    <td className="px-5 text-right tabular-nums">{(() => { const p = orderProfit(o, store).profit; return p === null ? <span className="text-xs text-muted">add cost</span> : <span className={p < 0 ? "text-danger" : ""}>{money(p)}</span>; })()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {selected && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/30" onClick={() => open()} role="presentation">
          <aside role="dialog" aria-modal="true" aria-label={`Order ${selected.number}`} className="h-full w-full max-w-md overflow-y-auto bg-bg p-6 shadow-pop" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Order #{selected.number}</h2>
              <button onClick={() => open()} aria-label="Close" className="rounded p-1 hover:bg-surface"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted">
              {new Date(selected.createdAt).toLocaleString()} <OrderStatusBadge status={selected.status} />
            </div>
            <section className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Items</h3>
              <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
                {selected.items.map((i, k) => (
                  <li key={k} className="flex justify-between gap-3 px-4 py-3 text-sm">
                    <span>{i.title}{i.variant && <span className="text-muted"> · {i.variant}</span>} × {i.qty}</span>
                    <span className="tabular-nums">{money(i.unitCents * i.qty)}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-3 space-y-1 text-sm">
                <Row k="Subtotal" v={money(selected.subtotalCents)} />
                {selected.discountCents > 0 && <Row k="Discount" v={`−${money(selected.discountCents)}`} />}
                <Row k="Shipping" v={selected.shippingCents ? money(selected.shippingCents) : "Free"} />
                <Row k="Total" v={money(selected.totalCents)} bold />
                <Row k="Paid with" v={selected.paymentMethod} />
                {selected.pointsEarned > 0 && <Row k="Loyalty points earned" v={String(selected.pointsEarned)} />}
              </dl>
            </section>
            <ProfitBox order={selected} store={store} />
            <TrackingBox key={selected.id} order={selected} store={store} />
            <section className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Customer</h3>
              <p className="mt-2 text-sm">{selected.customer.name}<br /><span className="text-muted">{selected.customer.email}</span></p>
              <p className="mt-2 text-sm text-muted">{selected.customer.address}<br />{selected.customer.city} {selected.customer.zip}, {selected.customer.country}</p>
            </section>
            <div className="mt-8 flex flex-wrap gap-2">
              {selected.status === "paid" && <Button onClick={() => setOrderStatus(store.slug, selected.id, "fulfilled")}>Mark as fulfilled</Button>}
              {selected.status === "fulfilled" && <Button variant="secondary" onClick={() => setOrderStatus(store.slug, selected.id, "paid")}>Mark unfulfilled</Button>}
              {selected.status !== "refunded" && (
                <Button
                  variant="danger"
                  loading={refunding}
                  onClick={async () => {
                    const viaStripe = selected.payment?.provider === "stripe";
                    if (!confirm(`Refund ${money(selected.totalCents)} to ${selected.customer.name}${viaStripe ? " through Stripe (money goes back to their card)" : ""}? Items go back into stock.`)) return;
                    if (!viaStripe) return setOrderStatus(store.slug, selected.id, "refunded");
                    setRefunding(true);
                    const r = await orderAction(store.slug, selected.id, "refund");
                    setRefunding(false);
                    if (!r.ok) alert(r.error);
                  }}
                >
                  Refund
                </Button>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className={cx("flex justify-between", bold && "border-t border-border pt-2 font-semibold")}>
      <dt className={bold ? "" : "text-muted"}>{k}</dt>
      <dd className="tabular-nums">{v}</dd>
    </div>
  );
}

function ProfitBox({ order, store }: { order: Order; store: Store }) {
  const p = orderProfit(order, store);
  return (
    <section className="mt-6" aria-label="Profit">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Your profit</h3>
      <dl className="mt-2 space-y-1 rounded-lg border border-border p-4 text-sm">
        <Row k="Customer paid" v={money(p.revenue)} />
        <Row k="Supplier (items + shipping)" v={p.cost === null ? "add product costs" : `−${money(p.cost)}`} />
        <Row k={`Payment fee${p.feeEstimated ? " (estimate)" : ""}`} v={`−${money(p.fee)}`} />
        <Row k="You made" v={p.profit === null ? "—" : money(p.profit)} bold />
      </dl>
    </section>
  );
}

function TrackingBox({ order, store }: { order: Order; store: Store }) {
  const [number, setNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);
  if (order.status === "refunded") return null;
  const t = order.tracking;
  const msg = t ? trackingMessage(store, order) : null;
  return (
    <section className="mt-6" aria-label="Tracking">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Shipping & tracking</h3>
      {t ? (
        <div className="mt-2 space-y-2 rounded-lg border border-border p-4 text-sm">
          <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-accent" /> {t.carrier} <span className="font-mono">{t.number}</span></div>
          <a href={t.url} target="_blank" rel="noopener noreferrer" className="flex w-fit items-center gap-1 text-accent underline">Open tracking <ExternalLink className="h-3 w-3" /></a>
          <p className="text-muted" data-tracking-emailed={t.emailed ? "yes" : "no"}>
            {t.emailed ? `Emailed to ${order.customer.email}.` : "Not emailed (email isn't set up). The customer can see it on your Track your order page, or send them this:"}
          </p>
          {!t.emailed && msg && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                navigator.clipboard?.writeText(`${msg.subject}\n\n${msg.text}`);
                setCopied(true);
              }}
            >
              <ClipboardCopy className="h-4 w-4" /> {copied ? "Copied" : "Copy message for the customer"}
            </Button>
          )}
          {note && <p className="text-xs text-success">{note}</p>}
        </div>
      ) : (
        <form
          className="mt-2 space-y-2 rounded-lg border border-border p-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            const r = await orderAction(store.slug, order.id, "tracking", { number, carrier: carrier || undefined });
            setBusy(false);
            if (!r.ok) setError(r.error);
            else setNote(r.emailed ? "Saved, marked as shipped, and emailed to the customer." : "Saved and marked as shipped.");
          }}
        >
          <label htmlFor="trk" className="block text-sm font-medium">Tracking number from your supplier</label>
          <div className="flex gap-2">
            <input id="trk" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="e.g. 1Z999AA10123456784" className="h-10 min-w-0 flex-1 rounded-md border border-border-input/60 px-3 font-mono text-sm outline-none focus:border-accent" />
            <label htmlFor="carrier" className="sr-only">Carrier</label>
            <select id="carrier" value={carrier} onChange={(e) => setCarrier(e.target.value)} className="h-10 rounded-md border border-border-input/60 px-2 text-sm">
              <option value="">Detect</option>
              <option value="usps">USPS</option>
              <option value="ups">UPS</option>
              <option value="fedex">FedEx</option>
              <option value="dhl">DHL</option>
              <option value="other">Other</option>
            </select>
          </div>
          {error && <p className="text-sm text-danger" role="alert">{error}</p>}
          <Button type="submit" size="sm" loading={busy} disabled={number.trim().length < 6}>Add tracking & mark shipped</Button>
        </form>
      )}
    </section>
  );
}
