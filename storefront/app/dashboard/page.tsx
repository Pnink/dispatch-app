"use client";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, ArrowRight, CheckCircle2, ExternalLink, Lightbulb, PartyPopper, Sparkles } from "lucide-react";
import { updateStore, useCurrentStore } from "@/lib/store";
import { todayBrief, type TodayItem } from "@/lib/today";
import { dateShort, money, cx } from "@/lib/format";
import { Panel } from "@/components/dashboard/PageHeader";
import { OrderStatusBadge } from "@/components/dashboard/OrderStatusBadge";
import { LinkButton } from "@/components/ui";

export default function DashboardHome() {
  return (
    <Suspense>
      <Home />
    </Suspense>
  );
}

const TONE: Record<TodayItem["tone"], { icon: typeof AlertCircle; cls: string; label: string }> = {
  urgent: { icon: AlertCircle, cls: "text-buoy", label: "Needs you" },
  do: { icon: ArrowRight, cls: "text-accent", label: "To do" },
  idea: { icon: Lightbulb, cls: "text-muted", label: "Idea" },
  good: { icon: CheckCircle2, cls: "text-success", label: "Good news" },
};

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function Home() {
  const store = useCurrentStore()!;
  const welcome = useSearchParams().get("welcome");
  const live = store.orders.filter((o) => o.status !== "refunded");
  const revenue = live.reduce((a, o) => a + o.totalCents, 0);
  const aov = live.length ? Math.round(revenue / live.length) : 0;
  const brief = todayBrief(store);
  const todo = brief.filter((b) => b.tone === "urgent" || b.tone === "do").length;

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

  return (
    <>
      {welcome && (
        <div className="mb-6 flex flex-wrap items-start gap-3 rounded-xl border border-accent/30 bg-accent-soft p-4 text-sm">
          <PartyPopper className="mt-0.5 h-5 w-5 text-accent" aria-hidden />
          <div className="flex-1">
            <div className="font-semibold">{store.name} is live.</div>
            <div className="text-muted">Open it in a new tab, buy something with card 4242 4242 4242 4242, and watch it land here.</div>
          </div>
          <LinkButton href={`/store/${store.slug}`} target="_blank" size="sm" variant="accent">Open store <ExternalLink className="h-3.5 w-3.5" /></LinkButton>
        </div>
      )}

      <div className="mb-6">
        <p className="text-sm text-muted">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
        <h1 className="mt-1 font-display text-3xl">{greeting()}.</h1>
        <p className="mt-1 text-muted">{todo === 0 ? "Nothing urgent. Here's what could help." : `${todo} thing${todo > 1 ? "s" : ""} to do today.`}</p>
      </div>

      <Panel title="Today" action={<span className="flex items-center gap-1 text-xs text-muted"><Sparkles className="h-3 w-3 text-accent" /> Ranked for you</span>}>
        {brief.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">All clear. Go make something.</p>
        ) : (
          <ul className="divide-y divide-border">
            {brief.slice(0, 6).map((item) => {
              const t = TONE[item.tone];
              const Icon = t.icon;
              return (
                <li key={item.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <Icon className={cx("h-5 w-5 shrink-0", t.cls)} aria-label={t.label} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{item.title}</div>
                    <div className="truncate text-xs text-muted">{item.detail}</div>
                  </div>
                  {item.action ? (
                    <button onClick={() => updateStore(store.slug, item.action!.run)} className="rounded-md bg-ink px-3 py-1.5 text-xs font-medium text-on-ink hover:bg-ink/85">
                      {item.action.label}
                    </button>
                  ) : item.href ? (
                    <Link href={item.href} className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface">Open</Link>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ["Revenue", money(revenue)],
          ["Orders", String(live.length)],
          ["Average order", money(aov)],
          ["Email list", String(store.subscribers.length)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl border border-border bg-bg p-5">
            <div className="text-xs text-muted">{k}</div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">{v}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Revenue, last 7 days">
          <div className="flex h-48 gap-3 px-5 pb-4 pt-6" role="img" aria-label={`Revenue by day: ${days.map((d) => `${d.label} ${money(d.total)}`).join(", ")}`}>
            {days.map((d) => (
              <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="relative w-full flex-1">
                  <div className="absolute inset-x-0 bottom-0 rounded-t bg-accent/80" style={{ height: `${Math.max(2, (d.total / max) * 100)}%` }} title={money(d.total)} />
                </div>
                <span className="text-xs text-muted">{d.label}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Recent orders" action={<Link href="/dashboard/orders" className="text-xs text-accent hover:underline">View all</Link>}>
          {store.orders.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">No orders yet. Share your store link to get the first one.</p>
          ) : (
            <div className="relative overflow-x-auto">
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
      </div>
    </>
  );
}
