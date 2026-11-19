"use client";
import { Suspense, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { setOrderStatus, useCurrentStore } from "@/lib/store";
import type { OrderStatus } from "@/lib/types";
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
  const selectedId = params.get("id");
  const selected = store.orders.find((o) => o.id === selectedId);

  const rows = store.orders.filter(
    (o) => (tab === "all" || o.status === tab) && (!q || `${o.number} ${o.customer.name} ${o.customer.email}`.toLowerCase().includes(q.toLowerCase())),
  );
  const open = (id?: string) => router.replace(id ? `${pathname}?id=${id}` : pathname, { scroll: false });

  return (
    <>
      <PageHeader title="Orders" sub={`${store.orders.length} total · ${store.orders.filter((o) => o.status === "paid").length} waiting to ship`} />
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
                  <th className="px-5 text-right font-medium">Total</th>
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
                    <td className="px-5 text-right tabular-nums">{money(o.totalCents)}</td>
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
                  onClick={() => {
                    if (confirm(`Refund ${money(selected.totalCents)} to ${selected.customer.name}? Items go back into stock.`)) setOrderStatus(store.slug, selected.id, "refunded");
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
