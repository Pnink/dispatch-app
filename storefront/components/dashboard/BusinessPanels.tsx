"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, ExternalLink, RotateCcw } from "lucide-react";
import Link from "next/link";
import { updateStore } from "@/lib/store";
import { POLICY_KINDS, POLICY_TITLE, policyTemplate } from "@/lib/policies";
import type { PolicyKind, Store } from "@/lib/types";
import { cx } from "@/lib/format";
import { Field } from "@/components/ui";
import { Panel } from "./PageHeader";

type Status = { stripe: "off" | "test" | "live"; webhook: boolean; publicUrl: string | null; mail: boolean };

/** Payments + email: what's connected, and exactly what to do to connect it. */
export function PaymentsPanel() {
  const [s, setS] = useState<Status | null>(null);
  useEffect(() => {
    fetch("/api/admin/status", { cache: "no-store" }).then((r) => (r.ok ? r.json().then(setS) : null)).catch(() => {});
  }, []);
  const Line = ({ ok, warn, children }: { ok: boolean; warn?: boolean; children: React.ReactNode }) => (
    <li className="flex items-start gap-2 text-sm">
      {ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> : <CircleAlert className={cx("mt-0.5 h-4 w-4 shrink-0", warn ? "text-buoy" : "text-muted")} />}
      <span>{children}</span>
    </li>
  );
  return (
    <section id="payments" className="scroll-mt-20">
      <Panel title="Payments & email">
        <div className="space-y-4 p-5">
          {!s ? (
            <p className="text-sm text-muted">Checking…</p>
          ) : (
            <ul className="space-y-2" data-stripe={s.stripe}>
              <Line ok={s.stripe !== "off"} warn>
                {s.stripe === "live" ? <><strong>Stripe is live.</strong> Real cards are charged; money goes to your bank on Stripe&apos;s payout schedule.</> : s.stripe === "test" ? <><strong>Stripe test mode.</strong> Checkout works end to end with test card 4242 4242 4242 4242; no real money moves. Swap in your live key when you&apos;re ready.</> : <><strong>Payments are in demo mode</strong> (nothing is charged). Connect Stripe to take real payments.</>}
              </Line>
              {s.stripe !== "off" && <Line ok={s.webhook} warn>{s.webhook ? "Stripe webhook connected: orders are saved even if a shopper closes the tab after paying." : "Add the Stripe webhook (step 4 below) so orders are saved even if a shopper closes the tab after paying."}</Line>}
              <Line ok={s.mail}>{s.mail ? "Customer emails are on: receipts and tracking numbers are emailed automatically." : "Customer emails are off: tracking numbers show on your Track your order page, and you get a message to copy. Optional: add Resend (below)."}</Line>
            </ul>
          )}
          {s?.stripe !== "live" && (
            <details className="rounded-md bg-surface p-4 text-sm">
              <summary className="cursor-pointer font-medium">How to connect Stripe (about 10 minutes)</summary>
              <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-muted">
                <li>Make a free account at <a href="https://dashboard.stripe.com/register" target="_blank" rel="noopener noreferrer" className="underline">stripe.com <ExternalLink className="inline h-3 w-3" /></a> and add your bank account (that&apos;s where payouts go).</li>
                <li>In Stripe, turn on <strong>Test mode</strong>, open <strong>Developers → API keys</strong>, and copy the <strong>Secret key</strong> (starts with <code>sk_test_</code>).</li>
                <li>Put it in the file <code>storefront/.env.local</code> as <code>STRIPE_SECRET_KEY=sk_test_…</code>, and set <code>PUBLIC_URL=</code> your shop&apos;s address. Restart the app.</li>
                <li>When the shop is online: <strong>Developers → Webhooks → Add endpoint</strong> → <code>{s?.publicUrl ?? "https://yourshop.com"}/api/stripe/webhook</code>, event <code>checkout.session.completed</code>. Copy its signing secret into <code>STRIPE_WEBHOOK_SECRET=whsec_…</code>.</li>
                <li>Place a test order with card 4242 4242 4242 4242. When it all works, repeat steps 2–4 with your <strong>live</strong> keys.</li>
              </ol>
              <p className="mt-3 text-xs text-muted">Never paste keys into a chat or email. Stripe charges about 2.9% + 30¢ per card payment; there&apos;s no monthly fee.</p>
            </details>
          )}
          {!s?.mail && (
            <details className="rounded-md bg-surface p-4 text-sm">
              <summary className="cursor-pointer font-medium">Optional: email receipts and tracking automatically</summary>
              <p className="mt-2 text-muted">Make a free account at resend.com (3,000 emails a month free), verify your domain, then add <code>RESEND_API_KEY=…</code> and <code>MAIL_FROM=&quot;Your Shop &lt;orders@yourshop.com&gt;&quot;</code> to <code>.env.local</code> and restart.</p>
            </details>
          )}
        </div>
      </Panel>
    </section>
  );
}

const cents = (v: string) => Math.max(0, Math.round(Number(v) * 100) || 0);

/** Supplier shipping and payment fees: used for profit numbers. Private. */
export function CostsPanel({ store }: { store: Store }) {
  const c = store.costs;
  const set = (patch: Partial<Store["costs"]>) => updateStore(store.slug, (s) => ({ ...s, costs: { ...s.costs, ...patch } }));
  return (
    <Panel title="Costs (for profit)">
      <div className="space-y-4 p-5">
        <p className="text-sm text-muted">Used to show what you actually make on each order. Set each product&apos;s cost on the <Link href="/dashboard/products" className="underline">Products</Link> page. Shoppers never see any of this.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Supplier shipping per order (USD)" name="supship" inputMode="decimal" defaultValue={(c.supplierShippingCents / 100).toFixed(2)} onBlur={(e) => set({ supplierShippingCents: cents(e.target.value) })} hint="What your supplier charges you to ship one order" />
          <Field label="Payment fee %" name="feepct" inputMode="decimal" defaultValue={String(c.feePercent)} onBlur={(e) => set({ feePercent: Math.min(20, Math.max(0, Number(e.target.value) || 0)) })} hint="Stripe US cards: 2.9" />
          <Field label="Payment fee per order (¢)" name="feefix" inputMode="numeric" defaultValue={String(c.feeFixedCents)} onBlur={(e) => set({ feeFixedCents: Math.min(500, Math.max(0, Math.round(Number(e.target.value)) || 0)) })} hint="Stripe US cards: 30" />
        </div>
        <p className="text-xs text-muted">With Stripe connected, each order records Stripe&apos;s actual fee instead of this estimate.</p>
      </div>
    </Panel>
  );
}

/** Business details shown on policy pages, plus the four policies. */
export function PoliciesPanel({ store }: { store: Store }) {
  const b = store.business;
  const setB = (patch: Partial<Store["business"]>) => updateStore(store.slug, (s) => ({ ...s, business: { ...s.business, ...patch } }));
  const [open, setOpen] = useState<PolicyKind | null>(null);
  return (
    <section id="policies" className="scroll-mt-20">
      <Panel title="Business details & policies">
        <div className="space-y-5 p-5">
          <p className="text-sm text-muted">Your policy pages are written from these details and linked in your shop&apos;s footer and at checkout. Payment providers and ad platforms check that they exist. They&apos;re a solid standard starting point, not legal advice.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Business name (legal)" name="legal" defaultValue={b.legalName} onBlur={(e) => setB({ legalName: e.target.value.trim().slice(0, 120) })} />
            <Field label="Customer support email" name="supemail" type="email" defaultValue={b.email} onBlur={(e) => setB({ email: e.target.value.trim().slice(0, 120) })} hint="Shown on policies and as 'Contact us'" />
            <Field label="Time to ship (processing)" name="proc" defaultValue={b.processingDays} onBlur={(e) => setB({ processingDays: e.target.value.trim().slice(0, 60) || "1–3 business days" })} hint="Ask your supplier, e.g. 1–3 business days" />
            <Field label="Delivery time" name="deliv" defaultValue={b.deliveryDays} onBlur={(e) => setB({ deliveryDays: e.target.value.trim().slice(0, 60) || "5–10 business days" })} hint="Ask your supplier, e.g. 7–12 business days" />
            <Field label="Return window (days)" name="retdays" type="number" min={0} max={365} defaultValue={String(b.returnDays)} onBlur={(e) => setB({ returnDays: Math.min(365, Math.max(0, Math.round(Number(e.target.value)) || 0)) })} />
            <Field label="Country you're based in" name="country" defaultValue={b.country} onBlur={(e) => setB({ country: e.target.value.trim().slice(0, 60) })} />
          </div>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {POLICY_KINDS.map((k) => {
              const custom = !!store.policies[k]?.trim();
              return (
                <li key={k} className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm">
                      <span className="font-medium">{POLICY_TITLE[k]}</span> <span className="text-xs text-muted">· {custom ? "your own text" : "standard, filled from your details"}</span>
                    </div>
                    <div className="flex gap-3 text-sm">
                      <a href={`/store/${store.slug}/policies/${k}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 underline">View <ExternalLink className="h-3 w-3" /></a>
                      <button onClick={() => setOpen(open === k ? null : k)} className="underline">{open === k ? "Close" : "Edit"}</button>
                    </div>
                  </div>
                  {open === k && (
                    <div className="mt-3 space-y-2">
                      <label htmlFor={`pol-${k}`} className="sr-only">{POLICY_TITLE[k]}</label>
                      <textarea
                        id={`pol-${k}`}
                        rows={14}
                        defaultValue={store.policies[k] || policyTemplate(k, store)}
                        onBlur={(e) => {
                          const v = e.target.value.slice(0, 20_000);
                          updateStore(store.slug, (s) => ({ ...s, policies: { ...s.policies, [k]: v.trim() === policyTemplate(k, s).trim() ? "" : v } }));
                        }}
                        className="w-full rounded-md border border-border-input/60 p-3 font-mono text-xs leading-relaxed outline-none focus:border-accent"
                      />
                      <p className="text-xs text-muted">Lines starting with &ldquo;## &rdquo; become headings. Saved when you click away.</p>
                      {custom && (
                        <button onClick={() => { updateStore(store.slug, (s) => ({ ...s, policies: { ...s.policies, [k]: "" } })); setOpen(null); }} className="flex items-center gap-1 text-xs underline">
                          <RotateCcw className="h-3 w-3" /> Go back to the standard version
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </Panel>
    </section>
  );
}
