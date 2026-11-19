"use client";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Circle, ExternalLink, PartyPopper } from "lucide-react";
import { useCurrentStore } from "@/lib/store";
import { dateShort, money } from "@/lib/format";
import { PageHeader, Panel } from "@/components/dashboard/PageHeader";
import { OrderStatusBadge } from "@/components/dashboard/OrderStatusBadge";
import { LinkButton } from "@/components/ui";

export default function DashboardHome() {
  return (
    <Suspense>
      <Home />
    </Suspense>
  );
}

function Home() {
  const store = useCurrentStore()!;
  const welcome = useSearchParams().get("welcome");
  const live = store.orders.filter((o) => o.status !== "refunded");
  const revenue = live.reduce((a, o) => a + o.totalCents, 0);
  const aov = live.length ? Math.round(revenue / live.length) : 0;
  const toShip = store.orders.filter((o) => o.status === "paid").length;

  // last 7 days revenue
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (6 - i));
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    const total = live.filter((o) => new Date(o.createdAt) >= d && new Date(o.createdAt) < next).reduce((a, o) => a + o.totalCents, 0);
    return { label: d.toLocaleDateString("en-US", { weekday: "short" }), total };
  });
  const max = Math.max(1, ...days.map((d) => d.total));

  const checklist = [
    { done: store.published, label: "Publish your store", href: "/dashboard/settings" },
    { done: store.products.length > 3, label: "Add another product", href: "/dashboard/products" },
    { done: store.apps.loyalty, label: "Switch on loyalty points", href: "/dashboard/apps" },
    { done: store.orders.some((o) => o.customer.email !== "" && !o.customer.email.endsWith("@example.com")), label: "Place a test order on your storefront", href: `/store/${store.slug}` },
  ];

  return (
    <>
      {welcome && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-accent/30 bg-accent-soft p-4 text-sm">
          <PartyPopper className="mt-0.5 h-5 w-5 text-accent" aria-hidden />
          <div>
            <div className="font-semibold">{store.name} is live.</div>
            <div className="text-muted">Open your storefront in a new tab, place a test order with card 4242 4242 4242 4242, and watch it land in Orders.</div>
          </div>
          <LinkButton href={`/store/${store.slug}`} target="_blank" size="sm" variant="accent" className="ml-auto">Open store <ExternalLink className="h-3.5 w-3.5" /></LinkButton>
        </div>
      )}
      <PageHeader title={`Good to see you`} sub={`Here's how ${store.name} is doing.`} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ["Revenue", money(revenue)],
          ["Orders", String(live.length)],
          ["Average order", money(aov)],
          ["To fulfil", String(toShip)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl border border-border bg-bg p-5">
            <div className="text-xs text-muted">{k}</div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">{v}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Panel title="Revenue, last 7 days">
          <div className="flex h-48 items-end gap-3 px-5 pb-4 pt-6" role="img" aria-label={`Revenue by day: ${days.map((d) => `${d.label} ${money(d.total)}`).join(", ")}`}>
            {days.map((d) => (
              <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div className="w-full rounded-t bg-accent/80" style={{ height: `${Math.max(2, (d.total / max) * 100)}%` }} title={money(d.total)} />
                </div>
                <span className="text-xs text-muted">{d.label}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Setup guide">
          <ul className="divide-y divide-border">
            {checklist.map((c) => (
              <li key={c.label}>
                <Link href={c.href} className="flex items-center gap-3 px-5 py-3 text-sm hover:bg-surface">
                  {c.done ? <CheckCircle2 className="h-4 w-4 text-success" aria-label="Done" /> : <Circle className="h-4 w-4 text-muted" aria-label="To do" />}
                  <span className={c.done ? "text-muted line-through" : ""}>{c.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Recent orders" className="mt-6" action={<Link href="/dashboard/orders" className="text-xs text-accent hover:underline">View all</Link>}>
        {store.orders.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">No orders yet. Share your store link to get the first one.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <tbody>
                {store.orders.slice(0, 5).map((o) => (
                  <tr key={o.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3 font-medium"><Link href={`/dashboard/orders?id=${o.id}`} className="hover:underline">#{o.number}</Link></td>
                    <td className="px-2 py-3">{o.customer.name}</td>
                    <td className="px-2 py-3 text-muted">{dateShort(o.createdAt)}</td>
                    <td className="px-2 py-3"><OrderStatusBadge status={o.status} /></td>
                    <td className="px-5 py-3 text-right tabular-nums">{money(o.totalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
