"use client";
import Link from "next/link";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { placeOrder, quote, useCart, useShopperStore, writeCart, type Quote } from "@/lib/store";
import { cartTotals } from "@/lib/commerce";
import type { CardInput } from "@/lib/payments";
import type { Customer } from "@/lib/types";
import { money, cx } from "@/lib/format";
import { ProductArt } from "@/components/ProductArt";
import { headingFont } from "@/components/storefront";

type Method = "card" | "apple" | "google" | "paypal";

export default function CheckoutPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const store = useShopperStore(slug);
  const cart = useCart(slug);
  const [c, setC] = useState<Customer>({ name: "", email: "", address: "", city: "", zip: "", country: "US" });
  const [method, setMethod] = useState<Method>("card");
  const [card, setCard] = useState({ number: "", expiry: "", cvc: "" });
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState("");
  const [codeMsg, setCodeMsg] = useState("");
  const [q, setQ] = useState<Quote | null>(null); // server-confirmed totals once a code is applied
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [payError, setPayError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!store) return null;
  const base = `/store/${store.slug}`;
  const lines = cart.filter((l) => store.products.some((p) => p.id === l.productId));
  // the browser never knows discount codes; the server checks them and returns the totals it will charge
  const t = applied && q ? q : cartTotals(store, lines);

  if (lines.length === 0)
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className={cx("text-3xl", headingFont(store))}>Nothing to check out</h1>
        <Link href={base} className="mt-6 inline-block underline">Back to the shop</Link>
      </div>
    );

  const input = (err?: string) =>
    cx("h-11 w-full rounded-md border bg-transparent px-3 text-sm outline-none focus:border-[var(--s-accent)]", err ? "border-red-600" : "border-[color-mix(in_srgb,var(--s-text)_25%,transparent)]");

  const F = ({ k, label, auto, className = "" }: { k: keyof Customer; label: string; auto: string; className?: string }) => (
    // called as a function (not <F/>) so inputs keep focus across renders
    <div className={className}>
      <label htmlFor={`co-${k}`} className="mb-1 block text-xs opacity-70">{label}</label>
      <input id={`co-${k}`} autoComplete={auto} value={c[k]} onChange={(e) => setC({ ...c, [k]: e.target.value })} aria-invalid={!!errors[k] || undefined} className={input(errors[k])} />
      {errors[k] && <p className="mt-1 text-xs text-red-600">{errors[k]}</p>}
    </div>
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!c.email.match(/^\S+@\S+\.\S+$/)) errs.email = "Enter a valid email.";
    if (!c.name.trim()) errs.name = "Required.";
    if (!c.address.trim()) errs.address = "Required.";
    if (!c.city.trim()) errs.city = "Required.";
    if (!c.zip.trim()) errs.zip = "Required.";
    setErrors(errs);
    setPayError("");
    if (Object.keys(errs).length) return;
    setBusy(true);
    const payment: CardInput = method === "card" ? { method: "card", ...card } : { method };
    const res = await placeOrder(store.slug, lines, c, payment, applied);
    setBusy(false);
    if (!res.ok) {
      setPayError(res.error);
      return;
    }
    writeCart(store.slug, []);
    router.push(`${base}/order/${res.order.id}`);
  };

  const methods: { id: Method; label: string }[] = [
    { id: "card", label: "Card" },
    { id: "apple", label: "Apple Pay" },
    { id: "google", label: "Google Pay" },
    { id: "paypal", label: "PayPal" },
  ];

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_380px]">
      <form onSubmit={submit} noValidate className="space-y-8">
        <h1 className={cx("text-3xl", headingFont(store))}>Checkout</h1>
        <section>
          <h2 className="font-medium">Contact</h2>
          <p className="text-xs opacity-60">Checking out as a guest — no account needed.</p>
          <div className="mt-3">{F({ k: "email", label: "Email", auto: "email" })}</div>
        </section>
        <section>
          <h2 className="font-medium">Shipping address</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-6">
            {F({ k: "name", label: "Full name", auto: "name", className: "sm:col-span-6" })}
            {F({ k: "address", label: "Address", auto: "street-address", className: "sm:col-span-6" })}
            {F({ k: "city", label: "City", auto: "address-level2", className: "sm:col-span-3" })}
            {F({ k: "zip", label: "Postal code", auto: "postal-code", className: "sm:col-span-1" })}
            <div className="sm:col-span-2">
              <label htmlFor="co-country" className="mb-1 block text-xs opacity-70">Country</label>
              <select id="co-country" value={c.country} onChange={(e) => setC({ ...c, country: e.target.value })} className={input()}>
                {["US", "CA", "GB", "DE", "FR", "NL", "AU"].map((x) => <option key={x}>{x}</option>)}
              </select>
            </div>
          </div>
        </section>
        <section>
          <h2 className="font-medium">Payment</h2>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Payment method">
            {methods.map((m) => (
              <button key={m.id} type="button" role="radio" aria-checked={method === m.id} onClick={() => setMethod(m.id)} className={cx("h-11 rounded-md border text-sm", method === m.id ? "border-[var(--s-accent)] ring-1 ring-[var(--s-accent)]" : "border-[color-mix(in_srgb,var(--s-text)_25%,transparent)]")}>
                {m.label}
              </button>
            ))}
          </div>
          {method === "card" ? (
            <div className="mt-4 grid grid-cols-4 gap-3">
              <div className="col-span-4">
                <label htmlFor="cc" className="mb-1 block text-xs opacity-70">Card number</label>
                <input id="cc" inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242" value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value.replace(/[^\d ]/g, "").slice(0, 23) })} className={input()} />
              </div>
              <div className="col-span-2">
                <label htmlFor="exp" className="mb-1 block text-xs opacity-70">Expiry (MM/YY)</label>
                <input id="exp" autoComplete="cc-exp" placeholder="12/29" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value.slice(0, 5) })} className={input()} />
              </div>
              <div className="col-span-2">
                <label htmlFor="cvc" className="mb-1 block text-xs opacity-70">Security code</label>
                <input id="cvc" inputMode="numeric" autoComplete="cc-csc" placeholder="123" value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })} className={input()} />
              </div>
              <p className="col-span-4 text-xs opacity-60">Demo only — try 4242 4242 4242 4242 (success) or 4000 0000 0000 0002 (declined). Any future expiry and CVC.</p>
            </div>
          ) : (
            <p className="mt-4 rounded-md bg-[var(--s-soft)] p-4 text-sm opacity-80">You&apos;ll confirm with {methods.find((m) => m.id === method)!.label} (simulated) when you place the order.</p>
          )}
        </section>
        {payError && <div role="alert" className="rounded-md border border-red-600/40 bg-red-600/10 p-3 text-sm text-red-700">{payError}</div>}
        <button type="submit" disabled={busy} className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[var(--s-accent)] font-medium text-[var(--s-on-accent)] hover:opacity-90 disabled:opacity-60">
          {busy ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Processing…</> : <><Lock className="h-4 w-4" /> Pay {money(t.total)}</>}
        </button>
      </form>

      <aside className="h-fit rounded-xl bg-[var(--s-soft)] p-5 lg:sticky lg:top-6">
        <h2 className="font-medium">Order summary</h2>
        <ul className="mt-4 space-y-3">
          {lines.map((l) => {
            const p = store.products.find((x) => x.id === l.productId)!;
            return (
              <li key={`${l.productId}-${l.variant}`} className="flex items-center gap-3 text-sm">
                <div className="relative">
                  <ProductArt image={p.image} seed={p.art} title={p.title} category={store.category} accent={store.palette.accent} soft={store.palette.bg} className="h-14 w-14 rounded-md" />
                  <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-[var(--s-text)] text-[10px] text-[var(--s-bg)]">{l.qty}</span>
                </div>
                <div className="flex-1"><div>{p.title}</div>{l.variant && <div className="text-xs opacity-60">{l.variant}</div>}</div>
                <div className="tabular-nums">{money(p.priceCents * l.qty)}</div>
              </li>
            );
          })}
        </ul>
        <form
          className="mt-5 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            quote(store.slug, lines, code).then((res) => {
              if (res?.code) {
                setApplied(res.code.code);
                setQ(res);
                setCodeMsg(`${res.code.code} applied — ${res.code.percent}% off`);
              } else {
                setApplied("");
                setQ(null);
                setCodeMsg("That code isn't valid.");
              }
            });
          }}
        >
          <label htmlFor="discount" className="sr-only">Discount code</label>
          <input id="discount" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Discount code" className={input()} />
          <button type="submit" className="rounded-md border border-[color-mix(in_srgb,var(--s-text)_25%,transparent)] px-4 text-sm">Apply</button>
        </form>
        {codeMsg && <p className={cx("mt-2 text-xs", applied ? "" : "text-red-600")} role="status">{codeMsg}</p>}
        <dl className="mt-5 space-y-2 border-t border-[color-mix(in_srgb,var(--s-text)_12%,transparent)] pt-4 text-sm">
          <div className="flex justify-between"><dt className="opacity-70">Subtotal</dt><dd>{money(t.subtotal)}</dd></div>
          {t.discountCents > 0 && <div className="flex justify-between"><dt className="opacity-70">Discount ({applied})</dt><dd>−{money(t.discountCents)}</dd></div>}
          <div className="flex justify-between"><dt className="opacity-70">Shipping</dt><dd>{t.shippingCents ? money(t.shippingCents) : "Free"}</dd></div>
          <div className="flex justify-between pt-2 text-lg font-semibold"><dt>Total</dt><dd>{money(t.total)}</dd></div>
        </dl>
        {store.apps.loyalty && <p className="mt-3 text-xs opacity-70">You&apos;ll earn {Math.floor(t.total / 100)} loyalty points with this order.</p>}
      </aside>
    </div>
  );
}
