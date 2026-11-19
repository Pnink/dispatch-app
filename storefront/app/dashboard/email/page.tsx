"use client";
import { useState } from "react";
import { Clock } from "lucide-react";
import { updateStore, useCurrentStore } from "@/lib/store";
import type { EmailFlow, EmailFlowKind } from "@/lib/types";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ProductArt } from "@/components/ProductArt";
import { Toggle } from "@/components/ui";
import { cx, money } from "@/lib/format";

const META: Record<EmailFlowKind, { name: string; trigger: string }> = {
  welcome: { name: "Welcome", trigger: "Someone joins your email list" },
  abandoned_checkout: { name: "Abandoned checkout", trigger: "Checkout started but not completed" },
  post_purchase: { name: "Post-purchase", trigger: "An order is placed" },
  review_request: { name: "Review request", trigger: "Order delivered" },
};

const delay = (m: number) => (m === 0 ? "immediately" : m < 1440 ? `after ${m / 60} hour${m === 60 ? "" : "s"}` : `after ${m / 1440} day${m === 1440 ? "" : "s"}`);

export default function EmailPage() {
  const store = useCurrentStore()!;
  const [kind, setKind] = useState<EmailFlowKind>("abandoned_checkout");
  const flow = store.flows.find((f) => f.kind === kind)!;
  const patch = (p: Partial<EmailFlow>) => updateStore(store.slug, (s) => ({ ...s, flows: s.flows.map((f) => (f.kind === kind ? { ...f, ...p } : f)) }));
  const featured = store.products[0];

  return (
    <>
      <PageHeader title="Email" sub={store.apps.email ? "Automated flows send from your store's name. (Demo: nothing is actually sent.)" : "Email marketing is switched off in Built-in apps — flows below won't send."} />
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <ul className="space-y-2">
          {store.flows.map((f) => (
            <li key={f.kind}>
              <button onClick={() => setKind(f.kind)} aria-current={kind === f.kind} className={cx("w-full rounded-xl border p-4 text-left", kind === f.kind ? "border-accent bg-accent-soft" : "border-border bg-bg hover:border-border-input")}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{META[f.kind].name}</span>
                  <span className={cx("text-xs", f.enabled ? "text-success" : "text-muted")}>{f.enabled ? "On" : "Off"}</span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted"><Clock className="h-3 w-3" /> {META[f.kind].trigger}, {delay(f.delayMinutes)}</div>
              </button>
            </li>
          ))}
        </ul>

        <section className="rounded-xl border border-border bg-bg">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
            <h2 className="font-semibold">{META[kind].name}</h2>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted">{flow.enabled ? "Sending" : "Paused"}</span>
              <Toggle checked={flow.enabled} onChange={(v) => patch({ enabled: v })} label={`${META[kind].name} flow`} />
            </div>
          </div>
          <div className="grid gap-6 p-5 xl:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label htmlFor="subject" className="mb-1 block text-sm font-medium">Subject line</label>
                <input id="subject" value={flow.subject} onChange={(e) => patch({ subject: e.target.value })} className="h-10 w-full rounded-md border border-border-input/60 px-3 text-sm outline-none focus:border-accent" />
              </div>
              <div>
                <label htmlFor="body" className="mb-1 block text-sm font-medium">Message</label>
                <textarea id="body" rows={6} value={flow.body} onChange={(e) => patch({ body: e.target.value })} className="w-full rounded-md border border-border-input/60 p-3 text-sm outline-none focus:border-accent" />
              </div>
              <div>
                <label htmlFor="delay" className="mb-1 block text-sm font-medium">Send</label>
                <select id="delay" value={flow.delayMinutes} onChange={(e) => patch({ delayMinutes: Number(e.target.value) })} className="h-10 rounded-md border border-border-input/60 px-3 text-sm">
                  {[0, 60, 180, 1440, 4320, 10080].map((m) => <option key={m} value={m}>{delay(m)}</option>)}
                </select>
              </div>
            </div>
            {/* Preview */}
            <div className="rounded-lg border border-border bg-surface p-4" aria-label="Email preview">
              <div className="text-xs text-muted">From: {store.name} · Subject: <span className="text-text">{flow.subject}</span></div>
              <div className="mt-3 rounded-md p-5" style={{ background: store.palette.bg, color: store.palette.text }}>
                <div className={store.font === "serif" ? "font-serif text-xl" : "text-lg font-semibold"}>{store.name}</div>
                <p className="mt-4 text-sm leading-relaxed">{flow.body}</p>
                {featured && (
                  <div className="mt-4 flex items-center gap-3">
                    <ProductArt image={featured.image} seed={featured.art} title={featured.title} category={store.category} accent={store.palette.accent} soft={store.palette.soft} className="h-16 w-16 rounded" />
                    <div className="text-sm">{featured.title}<div className="opacity-60">{money(featured.priceCents)}</div></div>
                  </div>
                )}
                <div className="mt-5 inline-block rounded-md px-4 py-2 text-sm font-medium" style={{ background: store.palette.accent, color: store.palette.onAccent }}>
                  {kind === "abandoned_checkout" ? "Return to cart" : kind === "review_request" ? "Leave a review" : "Visit the shop"}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
