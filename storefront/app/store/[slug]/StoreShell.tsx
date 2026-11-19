"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { X } from "lucide-react";
import { addSubscriber, isOwner, recordVisit, useCart, useShopperStore } from "@/lib/store";
import { forcedVariants, setForced } from "@/lib/experiments";
import type { VariantId } from "@/lib/types";
import type { Store } from "@/lib/types";
import { StoreFooter, StoreHeader, StoreTheme, headingFont } from "@/components/storefront";
import { cx } from "@/lib/format";

export function StoreShell({ children }: { children: React.ReactNode }) {
  const { slug } = useParams<{ slug: string }>();
  const store = useShopperStore(slug);
  const cart = useCart(slug);
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // ?ab=<experimentId>.<a|b> previews a variant for this browser session (not counted in results)
    const ab = new URLSearchParams(window.location.search).get("ab");
    if (ab) {
      const [id, v] = ab.split(".");
      if (id && (v === "a" || v === "b")) {
        setForced(id, v as VariantId);
        sessionStorage.removeItem(`wharf:popup:${slug}`);
      }
    }
    recordVisit(slug);
    setMounted(true);
  }, [slug]);

  // white-label: the browser tab shows the store, never the platform
  const storeName = store?.name;
  const accent = store?.palette.accent;
  useEffect(() => {
    if (!storeName) return;
    document.title = storeName;
    // Next.js re-applies the server title (built from the URL) after hydration; keep the real name.
    const keep = new MutationObserver(() => {
      if (document.title !== storeName) document.title = storeName;
    });
    keep.observe(document.head, { subtree: true, childList: true, characterData: true });
    // the store's own favicon: its initial on its accent colour
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="${accent}"/><text x="16" y="22" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="#fff" text-anchor="middle">${storeName.trim().charAt(0).toUpperCase().replace(/[<&]/g, "")}</text></svg>`;
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    return () => keep.disconnect();
  }, [storeName, accent, pathname]);

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
      {(isOwner() || Object.keys(forcedVariants()).length > 0) && <OwnerBar />}
      <StoreHeader store={store} base={base} cartCount={cart.reduce((a, l) => a + l.qty, 0)} />
      <main className="flex-1">{children}</main>
      <StoreFooter store={store} base={base} />
      {store.apps.popup && !inCheckout && <Popup store={store} />}
    </StoreTheme>
  );
}

function OwnerBar() {
  const previews = Object.entries(forcedVariants());
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 bg-ink px-4 py-1.5 text-xs text-on-ink">
      <span>
        Owner view (only you see this bar) · test card 4242 4242 4242 4242
        {previews.length > 0 && (
          <>
            {" · "}
            <strong>Previewing variant {previews.map(([, v]) => v.toUpperCase()).join(", ")}</strong> (not counted){" "}
            <button
              className="underline"
              onClick={() => {
                previews.forEach(([id]) => setForced(id, null));
                window.location.href = window.location.pathname;
              }}
            >
              Exit preview
            </button>
          </>
        )}
      </span>
      <Link href="/dashboard" className="underline">Back to dashboard</Link>
    </div>
  );
}

function Popup({ store }: { store: Store }) {
  const key = `wharf:popup:${store.slug}`;
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
                if (/^\S+@\S+\.\S+$/.test(email)) {
                  addSubscriber(store.slug, email);
                  setDone(true);
                }
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
