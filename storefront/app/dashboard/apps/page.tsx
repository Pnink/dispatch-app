"use client";
import Link from "next/link";
import { Gift, Mail, MessageSquareQuote, PanelTop } from "lucide-react";
import { updateStore, useCurrentStore } from "@/lib/store";
import type { Apps } from "@/lib/types";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Field, Toggle } from "@/components/ui";

export default function AppsPage() {
  const store = useCurrentStore()!;
  const set = (k: keyof Apps, v: boolean) => updateStore(store.slug, (s) => ({ ...s, apps: { ...s.apps, [k]: v } }));
  const members = Object.entries(store.loyalty).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <PageHeader title="Built-in apps" sub="Everything here is included — no installs, no extra subscriptions. Flip a switch and it's live on your storefront." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card icon={<MessageSquareQuote className="h-5 w-5" />} title="Product reviews" desc="Star ratings on product cards, a reviews section on your homepage, and a review form on every product page." on={store.apps.reviews} onChange={(v) => set("reviews", v)}>
          <p className="text-sm text-muted">{store.reviews.length} reviews · average {store.reviews.length ? (store.reviews.reduce((a, r) => a + r.rating, 0) / store.reviews.length).toFixed(1) : "—"} ★</p>
        </Card>

        <Card icon={<PanelTop className="h-5 w-5" />} title="Email capture popup" desc="Shown to new visitors a few seconds after they land. Offers a first-order discount in exchange for an email." on={store.apps.popup} onChange={(v) => set("popup", v)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Headline" name="popup-headline" value={store.popup.headline} onChange={(e) => updateStore(store.slug, (s) => ({ ...s, popup: { ...s.popup, headline: e.target.value } }))} className="sm:col-span-2" />
            <Field
              label="Discount code"
              name="popup-code"
              value={store.popup.code}
              onChange={(e) => {
                const code = e.target.value.toUpperCase().replace(/\s/g, "");
                updateStore(store.slug, (s) => ({ ...s, popup: { ...s.popup, code } }));
              }}
              onBlur={() =>
                updateStore(store.slug, (s) => ({
                  ...s,
                  discounts: s.discounts.some((d) => d.code === s.popup.code) ? s.discounts : [...s.discounts, { code: s.popup.code, percent: s.popup.percent }],
                }))
              }
            />
            <Field
              label="Percent off"
              name="popup-percent"
              type="number"
              min={1}
              max={90}
              value={String(store.popup.percent)}
              onChange={(e) => {
                const percent = Math.max(1, Math.min(90, Number(e.target.value) || 1));
                updateStore(store.slug, (s) => ({ ...s, popup: { ...s.popup, percent }, discounts: s.discounts.map((d) => (d.code === s.popup.code ? { ...d, percent } : d)) }));
              }}
            />
          </div>
        </Card>

        <Card icon={<Mail className="h-5 w-5" />} title="Email marketing" desc="Automated welcome, abandoned-checkout, post-purchase and review-request emails." on={store.apps.email} onChange={(v) => set("email", v)}>
          <p className="text-sm text-muted">
            {store.flows.filter((f) => f.enabled).length} of {store.flows.length} flows on. <Link href="/dashboard/email" className="text-accent hover:underline">Edit flows →</Link>
          </p>
        </Card>

        <Card icon={<Gift className="h-5 w-5" />} title="Loyalty points" desc="Customers earn 1 point for every dollar spent. Points show on the order confirmation page." on={store.apps.loyalty} onChange={(v) => set("loyalty", v)}>
          {members.length === 0 ? (
            <p className="text-sm text-muted">No members yet. Points are added when a customer checks out with loyalty switched on.</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {members.slice(0, 5).map(([email, pts]) => (
                <li key={email} className="flex justify-between py-1.5"><span className="truncate">{email}</span><span className="tabular-nums">{pts} pts</span></li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

function Card({ icon, title, desc, on, onChange, children }: { icon: React.ReactNode; title: string; desc: string; on: boolean; onChange: (v: boolean) => void; children?: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-bg p-5">
      <div className="flex items-start gap-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">{icon}</div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">{title}</h2>
            <Toggle checked={on} onChange={onChange} label={`${title} ${on ? "on" : "off"}`} />
          </div>
          <p className="mt-1 text-sm text-muted">{desc}</p>
        </div>
      </div>
      {children && <div className={`mt-4 border-t border-border pt-4 ${on ? "" : "pointer-events-none opacity-50"}`}>{children}</div>}
    </section>
  );
}
