"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { X } from "lucide-react";
import { useCart, useStore } from "@/lib/store";
import type { Store } from "@/lib/types";
import { StoreFooter, StoreHeader, StoreTheme, headingFont } from "@/components/storefront";
import { cx } from "@/lib/format";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const { slug } = useParams<{ slug: string }>();
  const store = useStore(slug);
  const cart = useCart(slug);
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="min-h-dvh" />;
  if (!store)
    return (
      <div className="grid min-h-dvh place-items-center p-6 text-center">
        <div>
          <h1 className="text-2xl font-semibold">Store not found</h1>
          <p className="mt-2 text-muted">This store doesn&apos;t exist in this browser. Demo data lives in local storage.</p>
          <Link href="/create" className="mt-4 inline-block text-accent hover:underline">Create a store</Link>
        </div>
      </div>
    );

  const base = `/store/${store.slug}`;
  if (!store.published)
    return (
      <StoreTheme store={store} className="grid min-h-dvh place-items-center p-6 text-center">
        <div>
          <h1 className={cx("text-4xl", headingFont(store))}>{store.name}</h1>
          <p className="mt-3 opacity-70">Opening soon.</p>
          <Link href="/dashboard/settings" className="mt-8 inline-block text-xs underline opacity-60">Owner? Publish from your dashboard</Link>
        </div>
      </StoreTheme>
    );

  const inCheckout = pathname.endsWith("/checkout");
  return (
    <StoreTheme store={store} className="flex min-h-dvh flex-col">
      <OwnerBar />
      <StoreHeader store={store} base={base} cartCount={cart.reduce((a, l) => a + l.qty, 0)} />
      <main className="flex-1">{children}</main>
      <StoreFooter store={store} />
      {store.apps.popup && !inCheckout && <Popup store={store} />}
    </StoreTheme>
  );
}

function OwnerBar() {
  return (
    <div className="flex items-center justify-between gap-2 bg-[#0c0a09] px-4 py-1.5 text-xs text-[#fafaf9]">
      <span>Demo storefront · pay with 4242 4242 4242 4242</span>
      <Link href="/dashboard" className="underline">Back to dashboard</Link>
    </div>
  );
}

function Popup({ store }: { store: Store }) {
  const key = `forgecart:popup:${store.slug}`;
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (sessionStorage.getItem(key)) return;
    const t = setTimeout(() => setOpen(true), 2500);
    return () => clearTimeout(t);
  }, [key]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => {
    sessionStorage.setItem(key, "1");
    setOpen(false);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={close} role="presentation">
      <div role="dialog" aria-modal="true" aria-labelledby="popup-title" onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md rounded-2xl bg-[var(--s-bg)] p-8 text-center text-[var(--s-text)] shadow-2xl">
        <button ref={closeRef} onClick={close} aria-label="Close" className="absolute right-3 top-3 rounded p-1 opacity-60 hover:opacity-100"><X className="h-5 w-5" /></button>
        {done ? (
          <>
            <h2 id="popup-title" className={cx("text-2xl", headingFont(store))}>You&apos;re in!</h2>
            <p className="mt-3 text-sm opacity-75">Use this code at checkout:</p>
            <div className="mt-3 inline-block rounded-md border-2 border-dashed border-[var(--s-accent)] px-5 py-2 font-mono text-lg font-semibold">{store.popup.code}</div>
            <button onClick={close} className="mt-6 block w-full rounded-md bg-[var(--s-accent)] py-3 font-medium text-[var(--s-on-accent)]">Start shopping</button>
          </>
        ) : (
          <>
            <h2 id="popup-title" className={cx("text-2xl", headingFont(store))}>{store.popup.headline}</h2>
            <p className="mt-3 text-sm opacity-75">{store.popup.body}</p>
            <form
              className="mt-6 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (/^\S+@\S+\.\S+$/.test(email)) setDone(true);
              }}
            >
              <label htmlFor="popup-email" className="sr-only">Email address</label>
              <input id="popup-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-12 w-full rounded-md border border-[color-mix(in_srgb,var(--s-text)_25%,transparent)] bg-transparent px-4 text-sm outline-none focus:border-[var(--s-accent)]" />
              <button type="submit" className="h-12 w-full rounded-md bg-[var(--s-accent)] font-medium text-[var(--s-on-accent)]">Get {store.popup.percent}% off</button>
            </form>
            <button onClick={close} className="mt-4 text-xs underline opacity-60">No thanks</button>
          </>
        )}
      </div>
    </div>
  );
}
