"use client";
import Link from "next/link";
import { useState } from "react";
import { Check, Plus, RotateCcw, ShoppingBag, Star, Truck } from "lucide-react";
import type { Product, SectionType, Store } from "@/lib/types";
import { money, cx } from "@/lib/format";
import { addSubscriber } from "@/lib/store";
import { ProductArt } from "./ProductArt";

/**
 * Everything in this file renders on the shopper-facing storefront.
 * White-label rule: nothing here may mention the platform.
 */

/** Per-store theme: palette becomes CSS variables used via arbitrary Tailwind values. */
export function StoreTheme({ store, children, className = "" }: { store: Store; children: React.ReactNode; className?: string }) {
  const p = store.palette;
  return (
    <div
      className={cx("min-h-full bg-[var(--s-bg)] text-[var(--s-text)]", className)}
      style={
        {
          "--s-accent": p.accent,
          "--s-on-accent": p.onAccent,
          "--s-bg": p.bg,
          "--s-soft": p.soft,
          "--s-text": p.text,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}

export const headingFont = (s: Store) => (s.font === "serif" ? "font-serif" : "font-sans font-semibold tracking-tight");
const line = "border-[color-mix(in_srgb,var(--s-text)_12%,transparent)]";

export function StoreHeader({ store, cartCount = 0, base }: { store: Store; cartCount?: number; base: string }) {
  return (
    <header className={cx("border-b", line)}>
      {store.announcement.trim() && (
        <div className="bg-[var(--s-accent)] px-4 py-1.5 text-center text-xs text-[var(--s-on-accent)]">{store.announcement}</div>
      )}
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href={base} className={cx("text-xl", headingFont(store))}>{store.name}</Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href={`${base}#shop`} className="hidden opacity-80 hover:opacity-100 sm:inline">Shop</Link>
          {store.sections.some((s) => s.id === "story" && s.enabled) && <Link href={`${base}#story`} className="hidden opacity-80 hover:opacity-100 sm:inline">About</Link>}
          <Link href={`${base}/cart`} className="relative flex items-center gap-1.5" aria-label={`Cart, ${cartCount} items`}>
            <ShoppingBag className="h-5 w-5" aria-hidden />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--s-accent)] px-1 text-[10px] font-semibold text-[var(--s-on-accent)]">{cartCount}</span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function Stars({ rating, className = "h-3.5 w-3.5" }: { rating: number; className?: string }) {
  return (
    <span className="inline-flex" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cx(className, i <= Math.round(rating) ? "fill-current" : "opacity-30")} aria-hidden />
      ))}
    </span>
  );
}

export function avgRating(store: Store, productId?: string) {
  const rs = store.reviews.filter((r) => !productId || r.productId === productId);
  return rs.length ? { avg: rs.reduce((a, r) => a + r.rating, 0) / rs.length, count: rs.length } : null;
}

export function ProductCard({ store, product, base }: { store: Store; product: Product; base: string }) {
  const rating = store.apps.reviews ? avgRating(store, product.id) : null;
  return (
    <Link href={`${base}/p/${product.id}`} className="group block">
      <div className="overflow-hidden rounded-lg">
        <ProductArt seed={product.art} title={product.title} category={store.category} accent={store.palette.accent} soft={store.palette.soft} className="aspect-[4/5] w-full transition-transform duration-300 group-hover:scale-[1.03]" />
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium">{product.title}</h3>
          {rating && (
            <div className="mt-1 flex items-center gap-1 text-xs opacity-70">
              <Stars rating={rating.avg} className="h-3 w-3" /> ({rating.count})
            </div>
          )}
        </div>
        <div className="text-right text-sm">
          <div>{money(product.priceCents)}</div>
          {product.compareAtCents && <div className="text-xs line-through opacity-50">{money(product.compareAtCents)}</div>}
        </div>
      </div>
      {product.stock === 0 && <div className="mt-1 text-xs opacity-60">Sold out</div>}
    </Link>
  );
}

export function StoreHome({ store, base }: { store: Store; base: string }) {
  const render: Record<SectionType, () => React.ReactNode> = {
    hero: () => <Hero store={store} base={base} />,
    collection: () => <Collection store={store} base={base} />,
    trust: () => <Trust store={store} />,
    story: () => <StorySection store={store} />,
    reviews: () => (store.apps.reviews ? <Reviews store={store} /> : null),
    faq: () => <Faq store={store} />,
    newsletter: () => <Newsletter store={store} />,
  };
  return (
    <>
      {store.sections.filter((s) => s.enabled).map((s) => (
        <div key={s.id}>{render[s.id]()}</div>
      ))}
    </>
  );
}

function Hero({ store, base }: { store: Store; base: string }) {
  const featured = store.products.find((p) => p.status === "active");
  return (
    <section className="bg-[var(--s-soft)]">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
        <div>
          <h1 className={cx("text-4xl leading-tight sm:text-5xl", headingFont(store))}>{store.heroHeadline}</h1>
          <p className="mt-4 max-w-md opacity-75">{store.heroSub}</p>
          <Link href={`${base}#shop`} className="mt-8 inline-flex h-12 items-center rounded-md bg-[var(--s-accent)] px-6 font-medium text-[var(--s-on-accent)] hover:opacity-90">
            Shop the collection
          </Link>
        </div>
        {featured && (
          <ProductArt seed={featured.art + 7} title={featured.title} category={store.category} accent={store.palette.accent} soft={store.palette.bg} className="aspect-square w-full rounded-2xl" />
        )}
      </div>
    </section>
  );
}

function Collection({ store, base }: { store: Store; base: string }) {
  const products = store.products.filter((p) => p.status === "active");
  return (
    <section id="shop" className="mx-auto max-w-6xl scroll-mt-4 px-4 py-16 sm:px-6">
      <h2 className={cx("text-2xl", headingFont(store))}>The collection</h2>
      {products.length === 0 ? (
        <p className="mt-6 opacity-70">New products are on the way. Check back soon.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
          {products.map((p) => <ProductCard key={p.id} store={store} product={p} base={base} />)}
        </div>
      )}
    </section>
  );
}

function Trust({ store }: { store: Store }) {
  return (
    <section className={cx("border-y", line)}>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm sm:grid-cols-3 sm:px-6">
        <div className="flex items-center gap-3"><Truck className="h-5 w-5 opacity-70" aria-hidden /> {store.freeShippingCents > 0 ? `Free shipping over ${money(store.freeShippingCents)}` : "Fast, tracked shipping"}</div>
        <div className="flex items-center gap-3"><RotateCcw className="h-5 w-5 opacity-70" aria-hidden /> 30-day easy returns</div>
        <div className="flex items-center gap-3"><Star className="h-5 w-5 opacity-70" aria-hidden /> Loved by our customers</div>
      </div>
    </section>
  );
}

function StorySection({ store }: { store: Store }) {
  const p = store.products[1] ?? store.products[0];
  return (
    <section id="story" className="mx-auto grid max-w-6xl scroll-mt-4 items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1fr_1.2fr]">
      {p && <ProductArt seed={p.art + 31} title={`${store.name} workshop`} category={store.category} accent={store.palette.accent} soft={store.palette.soft} className="aspect-[4/3] w-full rounded-2xl" />}
      <div>
        <h2 className={cx("text-3xl", headingFont(store))}>{store.story.title}</h2>
        <p className="mt-4 whitespace-pre-line leading-relaxed opacity-80">{store.story.body}</p>
      </div>
    </section>
  );
}

function Reviews({ store }: { store: Store }) {
  const avg = avgRating(store);
  if (!avg) return null;
  return (
    <section id="reviews" className="mx-auto max-w-6xl scroll-mt-4 px-4 py-16 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className={cx("text-2xl", headingFont(store))}>What customers say</h2>
        <div className="flex items-center gap-2 text-sm"><Stars rating={avg.avg} /> {avg.avg.toFixed(1)} · {avg.count} reviews</div>
      </div>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {store.reviews.slice(0, 3).map((r) => (
          <figure key={r.id} className="rounded-lg bg-[var(--s-soft)] p-5">
            <Stars rating={r.rating} />
            <blockquote className="mt-3 text-sm">{r.body}</blockquote>
            <figcaption className="mt-3 text-xs opacity-60">{r.author} · {store.products.find((p) => p.id === r.productId)?.title}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function Faq({ store }: { store: Store }) {
  if (!store.faqs.length) return null;
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h2 className={cx("text-2xl", headingFont(store))}>Questions</h2>
      <div className={cx("mt-6 divide-y border-y", line, "divide-[color-mix(in_srgb,var(--s-text)_12%,transparent)]")}>
        {store.faqs.map((f) => (
          <details key={f.q} className="group py-4">
            <summary className="flex items-center justify-between gap-4 font-medium">
              {f.q}
              <Plus className="h-4 w-4 shrink-0 opacity-60 transition-transform group-open:rotate-45" aria-hidden />
            </summary>
            <p className="mt-2 text-sm opacity-75">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function Newsletter({ store }: { store: Store }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  return (
    <section className="bg-[var(--s-soft)]">
      <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
        <h2 className={cx("text-2xl", headingFont(store))}>Get new drops first</h2>
        <p className="mt-2 text-sm opacity-75">A short email when something new lands. No spam, unsubscribe any time.</p>
        {done ? (
          <p className="mt-6 flex items-center justify-center gap-2 text-sm" role="status"><Check className="h-4 w-4" /> You&apos;re on the list.</p>
        ) : (
          <form
            className="mt-6 flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("Enter a valid email address.");
              addSubscriber(store.slug, email).then((ok) => (ok ? setDone(true) : setErr("Couldn't sign you up. Try again in a moment.")));
            }}
          >
            <label htmlFor={`nl-${store.slug}`} className="sr-only">Email address</label>
            <input
              id={`nl-${store.slug}`}
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErr(""); }}
              placeholder="you@example.com"
              className={cx("h-12 flex-1 rounded-md border bg-[var(--s-bg)] px-4 text-sm outline-none focus:border-[var(--s-accent)]", line)}
            />
            <button type="submit" className="h-12 rounded-md bg-[var(--s-accent)] px-6 text-sm font-medium text-[var(--s-on-accent)]">Subscribe</button>
          </form>
        )}
        {err && <p className="mt-2 text-xs text-red-600" role="alert">{err}</p>}
      </div>
    </section>
  );
}

export function StoreFooter({ store, base }: { store: Store; base: string }) {
  return (
    <footer className={cx("mt-10 border-t", line)}>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm sm:grid-cols-3 sm:px-6">
        <div>
          <div className={cx("text-lg", headingFont(store))}>{store.name}</div>
          <p className="mt-2 max-w-xs text-xs opacity-70">{store.tagline}</p>
        </div>
        <ul className="space-y-1.5 opacity-80">
          <li><Link href={`${base}#shop`} className="hover:underline">Shop all</Link></li>
          <li><Link href={`${base}/cart`} className="hover:underline">Cart</Link></li>
        </ul>
        <ul className="space-y-1.5 opacity-80">
          <li>Shipping &amp; returns</li>
          <li>Contact us</li>
        </ul>
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-8 text-xs opacity-60 sm:px-6">© 2026 {store.name}</div>
    </footer>
  );
}
